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

import * as util from 'util';
import * as _fs from 'fs';
import * as _path from 'path';
import * as moment from 'moment';
import * as rimraf from 'rimraf';
import * as mkdirp from 'mkdirp';
import * as Forge from 'forge-apis';
import Forge2Legged from '../server/forge-oauth-2legged';
import { JsonProperties, JsonPropertiesSources } from './json-properties';

const _fsExists = util.promisify(_fs.exists);
const _fsReadFile = util.promisify(_fs.readFile);
const _fsWriteFile = util.promisify(_fs.writeFile);
const _rimraf = util.promisify(rimraf);

interface CacheEntry extends JsonPropertiesSources {
	lastVisited?: moment.Moment,
}

export class JsonPropertiesUtils {

	private cachePath: string = null;
	private cache: CacheEntry = {} as CacheEntry;
	private cacheDuration: any = moment.duration(20, 'minutes');
	private cacheCleanupJob: NodeJS.Timeout = null;

	constructor(cachePath: string, cacheDuration: number = null) {
		this.cachePath = _path.resolve(__dirname, '../..', cachePath);
		if (cacheDuration)
			this.cacheDuration = moment.duration(cacheDuration);
		this.cacheCleanupJob = setInterval(this.clearAll.bind(this), this.cacheDuration);
	}

	public dispose(): void {
		clearInterval(this.cacheCleanupJob);
		this.cacheCleanupJob = null;
		this.clearAll();
	}

	public async get(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<JsonPropertiesSources> {
		return (this.loadInCache(urn, region));
	}

	private async clearAll(): Promise<void> {
		try {
			const self = this;
			const jobs: Promise<void>[] = [];
			Object.keys(this.cache).map((urn: string): any => jobs.push(self.clear(urn, false)));
			await Promise.all(jobs)
		} catch (ex) {
		}
	}

	public async clear(urn: string, clearOnDisk: boolean = true): Promise<void> {
		try {
			urn = JsonPropertiesUtils.makeSafeUrn(urn);
			if (this.cache[urn])
				delete this.cache[urn];
			if (clearOnDisk)
				await _rimraf(_path.resolve(this.cachePath, urn));
		} catch (ex) {
		}
	}

	public async loadInCache(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<JsonPropertiesSources> {
		const self = this;
		try {
			urn = JsonPropertiesUtils.makeSafeUrn(urn);

			if (this.cache[urn]) {
				this.cache[urn].lastVisited = moment();
				return (this.cache[urn]);
			}

			const cachePath: string = _path.resolve(this.cachePath, urn);
			const cached: boolean = await _fsExists(cachePath);
			if (cached) {
				this.cache[urn] = { lastVisited: moment() };
				const dbFiles: string[] = JsonProperties.dbNames;
				const jobs: Promise<Buffer>[] = dbFiles.map((elt: string): Promise<Buffer> => _fsReadFile(_path.resolve(self.cachePath, urn, elt), null));
				const results: Buffer[] = await Promise.all(jobs);
				dbFiles.map((elt: string, index: number): any => self.cache[urn][elt] = results[index]);

				const guids: any = JSON.parse((await _fsReadFile(_path.resolve(this.cachePath, urn, 'idmap.json'), null)).toString('utf8'));
				this.cache[urn].guids = guids;

				return (this.cache[urn]);
			}

			return (await this.loadFromForge(urn, region));
		} catch (ex) {
			return (null);
		}
	}

	private async loadFromForge(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<JsonPropertiesSources> {
		const self = this;
		try {
			urn = JsonPropertiesUtils.makeSafeUrn(urn);

			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;
			const md: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, region);
			const manifest: Forge.ApiResponse = await md.getManifest(urn, null, oauth.internalClient, token);

			const svfEntry: any = manifest.body.derivatives.filter((elt: any): any => elt.outputType === 'svf' || elt.outputType === 'svf2');

			// DB / Properties
			const dbEntry: any = svfEntry[0].children.filter((elt: any): any => elt.mime === 'application/autodesk-db');
			let derivativePath: string = dbEntry[0].urn.substring(0, dbEntry[0].urn.lastIndexOf('/') + 1);

			const dbFiles: string[] = JsonProperties.dbNames;
			let paths: string[] = dbFiles.map((fn: string): string => `${derivativePath}${fn}.json.gz`);
			let jobs: Promise<Forge.ApiResponse>[] = paths.map((elt: string): Promise<Forge.ApiResponse> => md.getDerivativeManifest(urn, elt, null, oauth.internalClient, token));
			let results: Forge.ApiResponse[] = await Promise.all(jobs);
			const dbBuffers: Buffer[] = results.map((elt: Forge.ApiResponse): Buffer => elt.body);

			this.cache[urn] = { lastVisited: moment() };
			await mkdirp(_path.resolve(this.cachePath, urn));
			dbFiles.map((elt: string, index: number): any => {
				self.cache[urn][elt] = dbBuffers[index];
				_fsWriteFile(_path.resolve(self.cachePath, urn, elt), dbBuffers[index]);
			});

			// svf / svf2 / f2d
			const geometryEntries: any = svfEntry[0].children.filter((elt: any): any => elt.type === 'geometry');
			const svfEntries: any = geometryEntries
				//.map((entry: any): any => entry.children.filter((elt: any): any => elt.mime === 'application/autodesk-svf'))
				.map((entry: any): any => {
					let items: any = entry.children.filter((elt: any): any => elt.mime === 'application/autodesk-svf');
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

			const dataGuids: any = {};
			srcEntries.map((entry: any): any => dataGuids[entry.guid] = entry.viewableID);
			this.cache[urn].guids = dataGuids;
			_fsWriteFile(_path.resolve(this.cachePath, urn, 'idmap.json'), Buffer.from(JSON.stringify(dataGuids)));

			return (this.cache[urn]);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			return (null);
		}
	}

	// Utils

	public static makeSafeUrn(urn: string): string {
		return (urn.replace(/\+/g, '-') // Convert '+' to '-'
			.replace(/\//g, '_') // Convert '/' to '_'
			.replace(/=+$/, '') // Remove trailing '='
		);
	}

	public static fromSafeUrn(urn: string): string {
		return (urn
			.replace(/-/g, '+') // Convert '-' to '+'
			.replace(/_/g, '/') // Convert '_' to '/'
			+ Array(5 - urn.length % 4).join('=') // Add trainling '='
		);
	}

}

export default JsonPropertiesUtils;