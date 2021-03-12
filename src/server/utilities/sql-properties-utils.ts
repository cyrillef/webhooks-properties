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
import * as Forge from 'forge-apis';
import Forge2Legged from '../server/forge-oauth-2legged';
import { SqlProperties, SqlPropertiesSources } from './sql-properties';
import { Sequelize } from 'sequelize';
import Utils from '../utilities/utils';

interface CacheEntry extends SqlPropertiesSources {
	lastVisited?: moment.Moment,
}

export class SqlPropertiesUtils {

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

	public async get(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesSources> {
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
			urn = Utils.makeSafeUrn(urn);
			if (this.cache[urn]) {
				await this.cache[urn].sequelize.Close();
				if (clearOnDisk) {
					await Utils.fsUnlink(this.cache[urn].path2SqlDB);
					await Utils.fsUnlink(this.cache[urn].path2SqlDB + '.json');
				}
				delete this.cache[urn];
			}
		} catch (ex) {
		}
	}

	public async loadInCache(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesSources> {
		try {
			urn = Utils.makeSafeUrn(urn);

			if (this.cache[urn]) {
				this.cache[urn].lastVisited = moment();
				return (this.cache[urn]);
			}

			const cachePath: string = _path.resolve(this.cachePath, urn) + '.db';
			const cached: boolean = await Utils.fsExists(cachePath);
			if (cached) {
				this.cache[urn] = {
					lastVisited: moment(),
					path2SqlDB: cachePath,
					sequelize: new Sequelize({
						dialect: 'sqlite',
						storage: cachePath
					}),
					guids: JSON.parse((await Utils.fsReadFile(cachePath + '.json', null)).toString('utf8')),
				};
				return (this.cache[urn]);
			}

			return (await this.loadFromForge(urn, region));
		} catch (ex) {
			return (null);
		}
	}

	private async loadFromForge(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesSources> {
		try {
			urn = Utils.makeSafeUrn(urn);

			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;
			const md: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, region);
			const manifest: Forge.ApiResponse = await md.getManifest(urn, null, oauth.internalClient, token);
			const metadata: Forge.ApiResponse = await md.getMetadata(urn, null, oauth.internalClient, token);

			const svfEntry: any = manifest.body.derivatives.filter((elt: any): any => elt.outputType === 'svf' || elt.outputType === 'svf2');

			// DB / Properties
			const dbEntry: any = svfEntry[0].children.filter((elt: any): any => elt.mime === 'application/autodesk-db');
			const dbBuffer: Forge.ApiResponse = await md.getDerivativeManifest(urn, dbEntry[0].urn, null, oauth.internalClient, token);

			const cachePath: string = _path.resolve(this.cachePath, urn) + '.db';
			await Utils.fsWriteFile(cachePath, dbBuffer.body);

			const guids: any = {};
			metadata.body.data.metadata.map((elt: any): void => guids[elt.guid] = elt.name);
			Utils.fsWriteFile(cachePath + '.json', Buffer.from(JSON.stringify(guids)));
			this.cache[urn] = {
				lastVisited: moment(),
				path2SqlDB: cachePath,
				sequelize: new Sequelize({
					dialect: 'sqlite',
					storage: cachePath
				}),
				guids: guids
			};

			return (this.cache[urn]);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			return (null);
		}
	}

}

export default SqlPropertiesUtils;