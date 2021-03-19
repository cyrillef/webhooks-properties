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

export class SvfPropertiesUtils extends PropertiesUtils {

	protected constructor(cachePath: string = AppSettings.cacheFolder, cacheDuration: number = null) {
		super(cachePath, cacheDuration);
	}

	public static singleton(cachePath: string = AppSettings.cacheFolder): SvfPropertiesUtils {
		return (new SvfPropertiesUtils(cachePath));
	}

	public async get(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SvfPropertiesCache> {
		return (this.loadInCache(urn, region));
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

	public async loadInCache(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SvfPropertiesCache> {
		const self = this;
		try {
			urn = Utils.makeSafeUrn(urn);

			if (this.cache[urn]) {
				this.cache[urn].lastVisited = moment();
				return (this.cache[urn]);
			}

			const cachePath: string = this.getPath(urn);
			const cached: boolean = await Utils.fsExists(cachePath);
			if (cached) {
				this.cache[urn] = { lastVisited: moment() };
				const dbFiles: string[] = SvfProperties.dbNames;
				const jobs: Promise<Buffer>[] = dbFiles.map((elt: string): Promise<Buffer> => Utils.fsReadFile(_path.resolve(self.getPath(urn), elt), null));
				const results: Buffer[] = await Promise.all(jobs);
				dbFiles.map((elt: string, index: number): any => self.cache[urn][elt] = results[index]);

				const guids: any = JSON.parse((await Utils.fsReadFile(_path.resolve(this.getPath(urn), 'guids.json'), null)).toString('utf8'));
				this.cache[urn].guids = guids;

				return (this.cache[urn]);
			}

			return (await this.loadFromForge(urn, region));
		} catch (ex) {
			return (null);
		}
	}

	protected async loadFromForge(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SvfPropertiesCache> {
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
				await Utils.fsWriteFile(_path.resolve(cachePath, 'manifest.json'), Buffer.from(JSON.stringify(manifest, null, 4)));
				await Utils.fsWriteFile(_path.resolve(cachePath, 'metadata.json'), Buffer.from(JSON.stringify(metadata, null, 4)));
			}

			const svfEntry: any = manifest.body.derivatives.filter((elt: any): any => elt.outputType === 'svf' || elt.outputType === 'svf2');

			// DB / Properties
			const dbEntry: any = svfEntry[0].children.filter((elt: any): any => elt.mime === 'application/autodesk-db');
			let derivativePath: string = dbEntry[0].urn.substring(0, dbEntry[0].urn.lastIndexOf('/') + 1);

			const dbFiles: string[] = SvfProperties.dbNames;
			let paths: string[] = dbFiles.map((fn: string): string => `${derivativePath}${fn}.json.gz`);
			let jobs: Promise<Forge.ApiResponse>[] = paths.map((elt: string): Promise<Forge.ApiResponse> => md.getDerivativeManifest(urn, elt, null, oauth.internalClient, token));
			let results: Forge.ApiResponse[] = await Promise.all(jobs);
			const dbBuffers: Buffer[] = results.map((elt: Forge.ApiResponse): Buffer => elt.body);

			this.cache[urn] = { lastVisited: moment() };
			dbFiles.map((elt: string, index: number): any => {
				self.cache[urn][elt] = dbBuffers[index];
				Utils.fsWriteFile(_path.resolve(cachePath, elt), dbBuffers[index]);
			});

			// svf / svf2 / f2d
			const geometryEntries: any = svfEntry[0].children.filter((elt: any): any => elt.type === 'geometry');
			const svfEntries: any = geometryEntries
				//.map((entry: any): any => entry.children.filter((elt: any): any => elt.mime === 'application/autodesk-svf'))
				.map((entry: any): any => {
					let items: any = entry.children.filter((elt: any): any => elt.mime === 'application/autodesk-svf' || elt.mime === 'application/autodesk-svf2');
					items = items.map((item: any): any => {
						item.parent = entry.guid;
						item.viewableID = entry.viewableID;
						return (item);
					});
					return (items);
				})
				.filter((elt: any): any => elt.length > 0)
				.flat();
			// const svf2Entries: any = geometryEntries
			// 	.map((entry: any): any => entry.children.filter((elt: any): any => elt.mime === 'application/autodesk-svf2'))
			// 	.filter((elt: any): any => elt.length > 0)
			// 	.flat();
			const f2dEntries: any = geometryEntries
				//.map((entry: any): any => entry.children.filter((elt: any): any => elt.mime === 'application/autodesk-f2d'))
				.map((entry: any): any => {
					let items: any = entry.children.filter((elt: any): any => elt.mime === 'application/autodesk-f2d');
					items = items.map((item: any): any => {
						item.parent = entry.guid;
						item.viewableID = entry.viewableID;
						return (item);
					});
					return (items);
				})
				.filter((elt: any): any => elt.length > 0)
				.flat();
			const srcEntries = [...svfEntries, /*...svf2Entries,*/ ...f2dEntries];

			const guids: any = {};
			srcEntries.map((entry: any): any => guids[entry.guid] = entry.viewableID);
			this.cache[urn].guids = guids;
			Utils.fsWriteFile(_path.resolve(cachePath, 'guids.json'), Buffer.from(JSON.stringify(guids)));

			return (this.cache[urn]);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			return (null);
		}
	}

}

export default SvfPropertiesUtils;