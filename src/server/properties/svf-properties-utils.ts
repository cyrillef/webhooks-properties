//
// Copyright (c) Autodesk, Inc. All rights reserved
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM 'AS IS' AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
//

import * as _fs from 'fs';
import * as _path from 'path';
import * as moment from 'moment';
import * as mkdirp from 'mkdirp';
import AppSettings from '../server/app-settings';
import * as Forge from 'forge-apis';
import Forge2Legged from '../server/forge-oauth-2legged';
import { PropertiesUtils } from './common';
import { SvfProperties, SvfPropertiesCache } from './svf-properties';
import Utils from '../utilities/utils'
import { getUnpackedSettings } from 'http2';

export class SvfPropertiesUtils extends PropertiesUtils {

	protected constructor(cachePath: string = AppSettings.cacheFolder, cacheDuration: number = null) {
		super(cachePath, cacheDuration);
	}

	public static singleton(cachePath: string = AppSettings.cacheFolder): SvfPropertiesUtils {
		return (new SvfPropertiesUtils(cachePath));
	}

	public async get(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SvfPropertiesCache> {
		return (this.loadInCache(urn, guid, region));
	}

	public getPath(urn: string): string {
		return (_path.resolve(this.cachePath, urn, 'svf'));
	}

	public async release(urn: string, deleteOnDisk: boolean = true): Promise<void> {
		try {
			urn = Utils.makeSafeUrn(urn);
			if (this.cache[urn])
				delete this.cache[urn];
			if (deleteOnDisk)
				await Utils.rimraf(this.getPath(urn));
			await super.release(urn, deleteOnDisk); // should be last
		} catch (ex) {
		}
	}

	public async loadInCache(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SvfPropertiesCache> {
		const self = this;
		try {
			urn = Utils.makeSafeUrn(urn);
			const dbs: any = await this.loadDBs(urn);
			if (dbs === null)
				return (await this.loadFromForge(urn, guid, region));
			const guids: any = await this.loadGuids(urn);
			guid = guid || this.defaultGUID(guids);
			const keyname: string = this.keyname(urn, guid, dbs);
			const key: string = `${urn}-${keyname}`;

			if (this.cache[key]) {
				this.cache[key].lastVisited = moment();
				return (this.cache[key]);
			}

			const cachePath: string = this.getPath(urn);
			const cached: boolean = await Utils.fsExists(cachePath);
			if (cached) {
				this.cache[key] = { lastVisited: moment() };

				const dbFiles: string[] = SvfProperties.dbNames;
				const jobs: Promise<Buffer>[] = dbFiles.map((elt: string, index: number): Promise<Buffer> => 
					Utils.fsReadFile(self.resolvedFilename(urn, guid, index, dbs), null)
				);
				const results: Buffer[] = await Promise.all(jobs);
				dbFiles.map((elt: string, index: number): any => self.cache[key][elt] = results[index]);

				this.cache[key].guids = guids;

				return (this.cache[key]);
			}

			return (await this.loadFromForge(urn, guid, region));
		} catch (ex) {
			return (null);
		}
	}

	// Files are considered small enough to be downloaded at once - anyway the browser do it, so why not us?
	// But make sure to get the compressed versions (.json.gz versions)
	protected async loadFromForge(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SvfPropertiesCache> {
		const self = this;
		try {
			urn = Utils.makeSafeUrn(urn);
			const cachePath: string = this.getPath(urn);
			await mkdirp(cachePath);

			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;
			const md: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, region);
			const manifest: Forge.ApiResponse = await md.getManifest(urn, null, oauth.internalClient, token);
			const metadata: Forge.ApiResponse = await md.getMetadata(urn, null, oauth.internalClient, token);
			if (process.env.NODE_ENV === 'development') {
				await Utils.fsWriteFile(_path.resolve(cachePath, 'manifest.json'), Buffer.from(JSON.stringify(manifest.body, null, 4)));
				await Utils.fsWriteFile(_path.resolve(cachePath, 'metadata.json'), Buffer.from(JSON.stringify(metadata.body, null, 4)));
			}

			const svfEntry: any = manifest.body.derivatives.filter((elt: any): any => elt.outputType === 'svf' || elt.outputType === 'svf2');
			if (!svfEntry || svfEntry.length === 0)
				return (null);

			// DB / Properties
			// This is an shortcut to the real process. In theory, we should get the SVF file, unzip and get the
			// manifest.json file (i.e. .svf://manifest.json) and search for ./assets[ "type" = "Autodesk.CloudPlatform.Property*" ]
			const dbEntries: any[] = PropertiesUtils.findDBEntriesInManifest(manifest.body, ['application/autodesk-db']);
			if (!dbEntries || dbEntries.length === 0) // Stop here
				return (null);

			const dbFiles: string[] = SvfProperties.dbNames;
			const guids: any = PropertiesUtils.findViewablesInManifest(manifest.body);
			guid = guid || this.defaultGUID(guids);
			await this.saveGuids(urn, guids);
			const dbs: any = {};
			Object.keys(guids).map((guid: string): string[] => 
				dbs[guid] = dbFiles.map((elt: string): string => dbEntries.length === 1 ? elt : self.buildJsonGzFilename(guid, elt))
			);
			await this.saveDBs(urn, dbs);

			// DWFX might have one DB for each viewable (not shared like others)
			let dbBuffers: { [index: string]: Buffer[] } = {};
			for (let iDB = 0; iDB < dbEntries.length; iDB++) {
				const dbEntry: any = dbEntries[iDB];
				const derivativePath: string = dbEntry.urn.substring(0, dbEntry.urn.lastIndexOf('/') + 1);

				const paths: string[] = dbFiles.map((fn: string): string => `${derivativePath}${fn}.json.gz`);
				const jobs: Promise<Forge.ApiResponse>[] = paths.map((elt: string): Promise<Forge.ApiResponse> => md.getDerivativeManifest(urn, elt, null, oauth.internalClient, token));
				const results: Forge.ApiResponse[] = await Promise.all(jobs);

				if (dbEntries.length === 1 || guid === dbEntry.guid)
					results.map((elt: Forge.ApiResponse, index: number): Buffer => dbBuffers[dbFiles[index]] = elt.body);

				const writeJobs: Promise<void>[] = results.map((buff: Forge.ApiResponse, index: number): Promise<void> =>
					Utils.fsWriteFile(self.resolvedFilename(urn, dbEntries.length === 1 ? guid : dbEntry.guid, index, dbs), buff.body)
				);
				await Promise.all(writeJobs);
			}

			const keyname: string = this.keyname(urn, guid, dbs);
			const key: string = `${urn}-${keyname}`;
			this.cache[key] = {
				lastVisited: moment(),
				guids: guids,
				...dbBuffers,
			};

			return (this.cache[key]);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			return (null);
		}
	}

	protected async saveDBs(urn: string, dbs: any): Promise<any> {
		const cachePath: string = this.getPath(urn);
		Utils.fsWriteFile(_path.resolve(cachePath, 'dbs.json'), Buffer.from(JSON.stringify(dbs)));
	}

	protected async loadDBs(urn: string): Promise<any> {
		try {
			const cachePath: string = this.getPath(urn);
			const dbs: any = JSON.parse((await Utils.fsReadFile(_path.resolve(cachePath, 'dbs.json'), null)).toString('utf8'));
			return (dbs);
		} catch (ex) {
			return (null);
		}
	}

	protected async saveGuids(urn: string, guids: any): Promise<any> {
		const cachePath: string = this.getPath(urn);
		Utils.fsWriteFile(_path.resolve(cachePath, 'guids.json'), Buffer.from(JSON.stringify(guids)));
	}

	protected async loadGuids(urn: string): Promise<any> {
		try {
			const cachePath: string = this.getPath(urn);
			const guids: any = JSON.parse((await Utils.fsReadFile(_path.resolve(cachePath, 'guids.json'), null)).toString('utf8'));
			return (guids);
		} catch (ex) {
			return (null);
		}
	}

	protected defaultGUID(guids: any): string {
		return (Object.keys(guids)[0]);
	}

	protected keyname(urn: string, guid: string, dbs: any): string {
		return (dbs[guid][0]);
	}

	protected buildJsonGzFilename(guid: string, base: string): string {
		return (`${guid}${base.substring(7)}`)
	}

	protected resolvedFilename(urn: string, guid: string, which: number, dbs: any): string {
		const cachePath: string = this.getPath(urn);
		const jsonGzFilename: string = `${dbs[guid][which]}.json.gz`;
		return (_path.resolve(cachePath, jsonGzFilename));
	}

}

export default SvfPropertiesUtils;