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
import * as Forge from 'forge-apis';
import AppSettings from '../server/app-settings';
import Forge2Legged from '../server/forge-oauth-2legged';
import { PropertiesUtils } from './common';
import { Svf2Properties, Svf2PropertiesCache } from './svf2-properties';
import Utils from '../utilities/utils';
import * as superagent from 'superagent';

export class Svf2PropertiesUtils extends PropertiesUtils {

	protected constructor(cachePath: string = AppSettings.cacheFolder, cacheDuration: number = null) {
		super(cachePath, cacheDuration);
	}

	public static singleton(cachePath: string = AppSettings.cacheFolder): Svf2PropertiesUtils {
		return (new Svf2PropertiesUtils(cachePath));
	}

	public async get(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<Svf2PropertiesCache> {
		return (this.loadInCache(urn, guid, region));
	}

	public getPath(urn: string): string {
		return (_path.resolve(this.cachePath, urn, 'svf2'));
	}

	public async release(urn: string, guid: string, deleteOnDisk: boolean = true): Promise<void> {
		try {
			urn = Utils.makeSafeUrn(urn);
			const dbs: any = await this.loadDBs(urn);
			if (dbs === null)
				return;
			const guids: any = await this.loadGuids(urn);
			guid = guid || PropertiesUtils.defaultGUID(guids);
			const dbname: string = PropertiesUtils.dbname(urn, guid, dbs);
			const key: string = PropertiesUtils.makeDBName(urn, dbname);
			if (this.cache[key])
				delete this.cache[key];
			if (deleteOnDisk)
				await Utils.rimraf(this.getPath(urn));
			await super.release(urn, guid, deleteOnDisk);
		} catch (ex) {
		}
	}

	protected async loadInCache(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<Svf2PropertiesCache> {
		const self = this;
		try {
			urn = Utils.makeSafeUrn(urn);
			const dbs: any = await this.loadDBs(urn);
			if (dbs === null)
				return (await this.loadFromForge(urn, guid, region));
			const guids: any = await this.loadGuids(urn);
			guid = guid || PropertiesUtils.defaultGUID(guids);
			const dbname: string = PropertiesUtils.dbname(urn, guid, dbs);
			const key: string = PropertiesUtils.makeDBName(urn, dbname);

			if (this.cache[key]) {
				this.cache[key].lastVisited = moment();
				return (this.cache[key]);
			}

			const cachePath: string = this.getPath(urn);
			const cached: boolean = await Utils.fsExists(cachePath);
			if (cached) {
				const tags: any = JSON.parse((await Utils.fsReadFile(_path.resolve(cachePath, 'tags.json'), null)).toString('utf8'));

				const dbFiles: string[] = Svf2Properties.dbNames;
				const jobs: Promise<Buffer>[] = dbFiles.map((elt: string): Promise<Buffer> => Utils.fsReadFile(_path.resolve(cachePath, elt), null));
				const results: Buffer[] = await Promise.all(jobs);
				let dbBuffers: { [index: string]: Buffer } = {};
				dbFiles.map((elt: string, index: number): any => dbBuffers[tags[elt]] = results[index]);
				dbBuffers.attrs = JSON.parse(dbBuffers.attrs.toString('utf8'));
				dbBuffers.values = JSON.parse(dbBuffers.values.toString('utf8'));
				dbBuffers.ids = JSON.parse(dbBuffers.ids.toString('utf8'));

				this.cache[key] = {
					lastVisited: moment(),
					guids: guids,
					dbs: dbs,
					...dbBuffers,
				};

				return (this.cache[key]);
			}

			return (await this.loadFromForge(urn, guid, region));
		} catch (ex) {
			return (null);
		}
	}

	// Files are considered small enough to be downloaded at once - anyway the browser do it, so why not us?
	// SVF2 is always compressed :)
	protected async loadFromForge(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<Svf2PropertiesCache> {
		const self = this;
		try {
			urn = Utils.makeSafeUrn(urn);
			const cachePath: string = this.getPath(urn);

			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;

			// const manifest: Forge.ApiResponse = await md.getManifest(urn, null, oauth.internalClient, token);
			// const svf2Entry: any = manifest.body.derivatives.filter((elt: any): any => elt.outputType === 'svf2');
			// An SVF2 entry is not really versatile, so assume the next step

			// prod_us_http: "https://cdn.derivative.autodesk.com",
			// prod_eu_http: "https://cdn.derivative.autodesk.com/regions/eu",

			const endpoint: string = region === Forge.DerivativesApi.RegionEnum.US ? 'https://cdn.derivative.autodesk.com/modeldata' : 'https://cdn.derivative.autodesk.com/regions/eu/modeldata';
			const manifestRequest = await superagent('GET', `${endpoint}/manifest/${urn}?domain=`)
				.set({ 'Authorization': `Bearer ${token.access_token}` });

			const manifest: any = manifestRequest.body.children.filter((elt: any): any => elt.role === 'viewable')[0];
			if (!manifest.otg_manifest)
				return (null);
			const storagepoints: any = manifest.otg_manifest.paths;

			await mkdirp(cachePath);
			if (process.env.NODE_ENV === 'development') {
				await Utils.fsWriteFile(_path.resolve(cachePath, 'manifest.json'), Buffer.from(JSON.stringify(manifestRequest.body, null, 4)));
				// Save otg_model.json files too
				const views: any = manifest.otg_manifest.views;
				const views_guids: string[] = Object.keys(views);
				for (let i = 0; i < views_guids.length; i++) {
					const path: string = encodeURIComponent(`${storagepoints.version_root}${views[views_guids[i]].urn}`);
					const modelRequest = await superagent('GET', `${endpoint}/file/${path}?acmsession=${urn}&domain=`)
						.set({ 'Authorization': `Bearer ${token.access_token}` });
					const outname: string = `${views_guids[i]}_${_path.basename(views[views_guids[i]].urn)}`; // `${views_guids[i]}_otg_model.json`;
					await Utils.fsWriteFile(_path.resolve(cachePath, outname), Buffer.from(JSON.stringify(modelRequest.body, null, 4)));
				}
			}

			const pdb_manifest: any = manifest.otg_manifest.pdb_manifest;
			const assets: any = pdb_manifest.assets;
			let jobs: Promise<any>[] = assets.map((elt: any): Promise<any> => {
				const path: string = encodeURIComponent(elt.isShared ?
					storagepoints.shared_root + pdb_manifest.pdb_shared_rel_path
					: storagepoints.version_root + pdb_manifest.pdb_version_rel_path
				);
				return (
					superagent('GET', `${endpoint}/file/${path}${elt.uri}?acmsession=${urn}&domain=`)
						.set({ Authorization: `Bearer ${token.access_token}` })
						.buffer()
				);
			});

			const results: any = await Promise.all(jobs);
			const tags: any = {};
			let dbBuffers: { [index: string]: Buffer } = {};
			jobs = assets.map((elt: any, index: number): Promise<any> => {
				dbBuffers[elt.tag] = results[index].body;
				tags[elt.uri] = elt.tag;
				return (Utils.fsWriteFile(_path.resolve(self.getPath(urn), elt.uri), results[index].text ? results[index].text : results[index].body));
			});
			jobs.push(Utils.fsWriteFile(_path.resolve(cachePath, 'tags.json'), Buffer.from(JSON.stringify(tags))));

			const guids: any = PropertiesUtils.findViewablesInManifest(manifest);
			jobs.push(this.saveGuids(urn, guids));

			// We can assume that OTG is always a shared DB
			const dbs: any = {};
			for (let i = 0; i < Object.keys(guids).length; i++)
				dbs[Object.keys(guids)[i]] = [Object.keys(guids)[i]];
			jobs.push(this.saveDBs(urn, dbs));
			await Promise.all(jobs);

			const dbname: string = PropertiesUtils.dbname(urn, guid, dbs);
			const key: string = PropertiesUtils.makeDBName(urn, dbname);
			this.cache[key] = {
				lastVisited: moment(),
				guids: guids,
				dbs: dbs,
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

	//todo
	protected resolvedFilename(urn: string, guid: string, dbs: any, which: number = 0): string {
		const cachePath: string = this.getPath(urn);
		const dbname: string = PropertiesUtils.dbname(urn, guid, dbs, which);
		return (_path.resolve(cachePath, dbname));
	}

}

export default Svf2PropertiesUtils;