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

	public async get(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<Svf2PropertiesCache> {
		return (this.loadInCache(urn, region));
	}

	public getPath(urn: string): string {
		return (_path.resolve(this.cachePath, urn, 'svf2'));
	}

	public async release(urn: string, deleteOnDisk: boolean = true): Promise<void> {
		try {
			urn = Utils.makeSafeUrn(urn);
			if (this.cache[urn])
				delete this.cache[urn];
			if (deleteOnDisk)
				await Utils.rimraf(this.getPath(urn));
			await super.release(urn, deleteOnDisk);
		} catch (ex) {
		}
	}

	public async loadInCache(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<Svf2PropertiesCache> {
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
				const tags: any = JSON.parse((await Utils.fsReadFile(_path.resolve(cachePath, 'tags.json'), null)).toString('utf8'));

				const dbFiles: string[] = Svf2Properties.dbNames;
				const jobs: Promise<Buffer>[] = dbFiles.map((elt: string): Promise<Buffer> => Utils.fsReadFile(_path.resolve(cachePath, elt), null));
				const results: Buffer[] = await Promise.all(jobs);
				dbFiles.map((elt: string, index: number): any => self.cache[urn][tags[elt]] = results[index]);

				const guids: any = JSON.parse((await Utils.fsReadFile(_path.resolve(cachePath, 'guids.json'), null)).toString('utf8'));
				this.cache[urn].guids = guids;

				this.cache[urn].attrs = JSON.parse(this.cache[urn].attrs.toString('utf8'));
				this.cache[urn].values = JSON.parse(this.cache[urn].values.toString('utf8'));
				this.cache[urn].ids = JSON.parse(this.cache[urn].ids.toString('utf8'));

				return (this.cache[urn]);
			}

			return (await this.loadFromForge(urn, region));
		} catch (ex) {
			return (null);
		}
	}

	// Files are considered small enough to be downloaded at once - anyway the browser do it, so why not us?
	// SVF2 is always compressed :)
	protected async loadFromForge(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<Svf2PropertiesCache> {
		const self = this;
		try {
			urn = Utils.makeSafeUrn(urn);
			const cachePath: string = this.getPath(urn);
			await mkdirp(cachePath);

			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;

			// const manifest: Forge.ApiResponse = await md.getManifest(urn, null, oauth.internalClient, token);
			// const svf2Entry: any = manifest.body.derivatives.filter((elt: any): any => elt.outputType === 'svf2');
			// An SVF2 entry is not really versatile, so assume the next step

			const endpoint: string = 'https://cdn.derivative.autodesk.com/modeldata';
			const manifestRequest = await superagent('GET', `${endpoint}/manifest/${urn}?domain=`)
				.set({ 'Authorization': `Bearer ${token.access_token}` });
			if (process.env.NODE_ENV === 'development')
				await Utils.fsWriteFile(_path.resolve(cachePath, 'manifest.json'), Buffer.from(JSON.stringify(manifestRequest.body, null, 4)));

			const manifest: any = manifestRequest.body.children.filter((elt: any): any => elt.role === 'viewable')[0];
			const storagepoints: any = manifest.otg_manifest.paths;
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
			this.cache[urn] = { lastVisited: moment() };
			jobs = assets.map((elt: any, index: number): Promise<any> => {
				self.cache[urn][elt.tag] = results[index].body;
				tags[elt.uri] = elt.tag;
				return (Utils.fsWriteFile(_path.resolve(self.getPath(urn), elt.uri), results[index].text ? results[index].text : results[index].body));
			});
			jobs.push(Utils.fsWriteFile(_path.resolve(cachePath, 'tags.json'), Buffer.from(JSON.stringify(tags))));

			this.cache[urn].guids = this.findViewables(manifest);
			jobs.push(Utils.fsWriteFile(_path.resolve(cachePath, 'guids.json'), Buffer.from(JSON.stringify(this.cache[urn].guids))));

			await Promise.all(jobs);
			// this.cache[urn].attrs = JSON.parse(this.cache[urn].attrs.toString('utf8'));
			// this.cache[urn].vals = JSON.parse(this.cache[urn].vals.toString('utf8'));
			// this.cache[urn].ids = JSON.parse(this.cache[urn].ids.toString('utf8'));

			return (this.cache[urn]);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			return (null);
		}
	}

	protected findViewables(manifest: any): any {
		const guids: any = {};
		let items: any[] = [];
		const iterateChildren = (parent: any): void => {
			if (!parent.children)
				return;
			const entries: any[] = parent.children.filter((elt: any): any => elt.role === '3d' || elt.role === '2d');
			items = [...items, ...entries];
			if ((entries && entries.length) || !parent.children)
				return;
			parent.children.map ((children: any): void => iterateChildren(children));
		};
		iterateChildren(manifest);

		items.map((elt: any): void => {
			const svf: any = elt.children.filter((elt: any): any => elt.mime === 'application/autodesk-svf' || elt.role === '2d')[0];
			guids[svf.guid] = elt.viewableID;
		});

		return (guids);
	}

}

export default Svf2PropertiesUtils;