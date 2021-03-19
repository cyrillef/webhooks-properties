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
import { SqlPropertiesCache } from './sql-properties';
import { Sequelize } from 'sequelize';
import Utils from '../utilities/utils';

export class SqlPropertiesUtils extends PropertiesUtils {

	protected static CHUNK_SIZE: number = 1024 * 1024 * 5; // 5Mb chunks

	protected constructor(cachePath: string = AppSettings.cacheFolder, cacheDuration: number = null) {
		super(cachePath, cacheDuration);
	}

	public static singleton(cachePath: string = AppSettings.cacheFolder): SqlPropertiesUtils {
		return (new SqlPropertiesUtils(cachePath));
	}

	public async get(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesCache> {
		return (this.loadInCache(urn, region));
	}

	public getPath(urn: string): string {
		return (_path.resolve(this.cachePath, urn, 'sql'));
	}

	public async release(urn: string, deleteOnDisk: boolean = true): Promise<void> {
		try {
			urn = Utils.makeSafeUrn(urn);
			if (this.cache[urn]) {
				await this.cache[urn].sequelize.Close();
				delete this.cache[urn];
			}
			if (deleteOnDisk)
				await Utils.rimraf(this.getPath(urn));
			await super.release(urn, deleteOnDisk);
		} catch (ex) {
		}
	}

	public async loadInCache(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesCache> {
		try {
			urn = Utils.makeSafeUrn(urn);

			if (this.cache[urn]) {
				this.cache[urn].lastVisited = moment();
				return (this.cache[urn]);
			}

			const cachePath: string = this.getPath(urn);
			const cached: boolean = await Utils.fsExists(cachePath);
			// if (cached) {
			// 	this.cache[urn] = {
			// 		lastVisited: moment(),
			// 		path2SqlDB: cachePath,
			// 		sequelize: new Sequelize({
			// 			dialect: 'sqlite',
			// 			storage: _path.resolve(cachePath, 'model.db')
			// 		}),
			// 		guids: JSON.parse((await Utils.fsReadFile(_path.resolve(cachePath, 'guids.json'), null)).toString('utf8')),
			// 	};
			// 	return (this.cache[urn]);
			// }

			return (await this.loadFromForge(urn, region));
		} catch (ex) {
			return (null);
		}
	}

	// The database can be very big, so we may need to download it in chuncks!
	protected async loadFromForge(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesCache> {
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
			if (!dbEntry || dbEntry.length === 0) // Stop here
				return (null);
			// As the sqlite DB can be very large, check its size and download in chuncks (best practice anyway).
			const dbSizeResponse: Forge.ApiResponse = await md.getDerivativeManifestInfo(urn, dbEntry[0].urn, null, oauth.internalClient, token);
			const dbSize: number = Number.parseInt(dbSizeResponse.headers['content-length']);
			let dbBuffer: Forge.ApiResponse = null;
			let nbChunk: number = Math.floor(dbSize / SqlPropertiesUtils.CHUNK_SIZE);
			if (nbChunk=== 0) {
				dbBuffer = await md.getDerivativeManifest(urn, dbEntry[0].urn, null, oauth.internalClient, token);
			} else {
				// Download in serie vs parallel
				dbBuffer = dbSizeResponse;
				dbBuffer.body = Buffer.allocUnsafe(dbSize);
				for (let it = 0; it <= nbChunk; it++) {
					const start: number = it * SqlPropertiesUtils.CHUNK_SIZE;
					const end: number = Math.min((it + 1) * SqlPropertiesUtils.CHUNK_SIZE, dbSize) - 1;
					const chunck: Forge.ApiResponse = await md.getDerivativeManifest(urn, dbEntry[0].urn, { range: `bytes=${start}-${end}`}, oauth.internalClient, token);
					chunck.body.copy(dbBuffer.body, start, 0);
				}
			}

			await Utils.fsWriteFile(_path.resolve(cachePath, 'model.db'), dbBuffer.body);

			const guids: any = {};
			metadata.body.data.metadata.map((elt: any): void => guids[elt.guid] = elt.name);
			Utils.fsWriteFile(_path.resolve(cachePath, 'guids.json'), Buffer.from(JSON.stringify(guids)));
			this.cache[urn] = {
				lastVisited: moment(),
				path2SqlDB: cachePath,
				sequelize: new Sequelize({
					dialect: 'sqlite',
					storage: _path.resolve(cachePath, 'model.db')
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