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

	public async get(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesCache> {
		return (this.loadInCache(urn, guid, region));
	}

	public getPath(urn: string): string {
		return (_path.resolve(this.cachePath, urn, 'sql'));
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
			if (this.cache[key]) {
				await this.cache[key].sequelize.Close();
				delete this.cache[key];
			}
			if (deleteOnDisk)
				await Utils.rimraf(this.getPath(urn));
			await super.release(urn, guid, deleteOnDisk);
		} catch (ex) {
		}
	}

	public async loadInCache(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesCache> {
		try {
			urn = Utils.makeSafeUrn(urn);
			const dbs: any = await this.loadDBs(urn);
			if (dbs === null)
				return (await this.loadFromForge(urn, guid, region));
			const guids: any = await this.loadGuids(urn);
			guid = guid || PropertiesUtils.defaultGUID(guids);
			const dbname: string = PropertiesUtils.dbname(urn, guid, dbs);
			const resolvedFilename: string = this.resolvedFilename(urn, guid, dbs);
			const key: string = PropertiesUtils.makeDBName (urn, dbname);

			if (this.cache[key]) {
				this.cache[key].lastVisited = moment();
				return (this.cache[key]);
			}

			const cachePath: string = this.getPath(urn);
			const cached: boolean = await Utils.fsExists(cachePath);
			if (cached) {
				this.cache[key] = {
					lastVisited: moment(),
					path2SqlDB: resolvedFilename,
					sqlDBName: dbname,
					sequelize: new Sequelize({
						dialect: 'sqlite',
						storage: resolvedFilename,
						define: {
							charset: 'utf8',
							collate: 'utf8_general_ci',
						}
					}),
					guids: guids,
					dbs: dbs,
				};
				return (this.cache[key]);
			}

			return (await this.loadFromForge(urn, guid, region));
		} catch (ex) {
			return (null);
		}
	}

	// The database can be very big, so we may need to download it in chuncks!
	// But no need to compress unlike for SVF / SVF2
	protected async loadFromForge(urn: string, guid: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<SqlPropertiesCache> {
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
			const dbEntries: any[] = PropertiesUtils.findDBEntriesInManifest(manifest.body, ['application/autodesk-db']);
			if (!dbEntries || dbEntries.length === 0) // Stop here
				return (null);
			// As the sqlite DB can be very large, check its size and download in chuncks (best practice anyway).
			// DWFX might have one DB for each viewable (not shared like others)
			const modelPathes: string[] = [];
			for (let iDB = 0; iDB < dbEntries.length; iDB++) {
				const dbEntry: any = dbEntries[iDB];
				const dbSizeResponse: Forge.ApiResponse = await md.getDerivativeManifestInfo(urn, dbEntry.urn, null, oauth.internalClient, token);
				const dbSize: number = Number.parseInt(dbSizeResponse.headers['content-length']);
				let dbBuffer: Forge.ApiResponse = null;
				//modelPathes.push(_path.resolve(cachePath, `${dbEntry.guid}.db`));
				modelPathes.push(_path.resolve(cachePath, `${dbEntries.length > 1 ? dbEntry.guid : 'properties'}.db`));
				let nbChunk: number = Math.floor(dbSize / SqlPropertiesUtils.CHUNK_SIZE);
				if (nbChunk === 0) {
					dbBuffer = await md.getDerivativeManifest(urn, dbEntry.urn, null, oauth.internalClient, token);
					await Utils.fsWriteFile(modelPathes[iDB], dbBuffer.body);
				} else {
					// Download in serie vs parallel
					if (await Utils.fsExists(modelPathes[iDB]))
						await Utils.fsUnlink(modelPathes[iDB]);
					for (let it = 0; it <= nbChunk; it++) {
						const start: number = it * SqlPropertiesUtils.CHUNK_SIZE;
						const end: number = Math.min((it + 1) * SqlPropertiesUtils.CHUNK_SIZE, dbSize) - 1;
						const chunck: Forge.ApiResponse = await md.getDerivativeManifest(urn, dbEntry.urn, { range: `bytes=${start}-${end}` }, oauth.internalClient, token);
						await Utils.fsWriteFile(modelPathes[iDB], chunck.body, { flag: 'a' });
					}
				}
			}

			const aecEntries: any[] = PropertiesUtils.findInManifest(manifest.body, 'role', ['Autodesk.AEC.ModelData']);
			for (let iAEC = 0; iAEC < aecEntries.length; iAEC++) {
				const aecEntry: any = aecEntries[iAEC];
				let dbBuffer: Forge.ApiResponse = await md.getDerivativeManifest(urn, aecEntry.urn, null, oauth.internalClient, token);
				const aecPath: string = _path.resolve(cachePath, `${aecEntries.length > 1 ? aecEntry.guid : 'AECModelData'}.json`);
				await Utils.fsWriteFile(aecPath, Buffer.from(JSON.stringify(dbBuffer.body, null, 4)));
			}

			const guids: any = PropertiesUtils.findViewablesInManifest(manifest.body);
			guid = guid || PropertiesUtils.defaultGUID(guids);
			await this.saveGuids(urn, guids);
			const dbs: any = {};
			Object.keys(guids).map((guid: string): string[] => dbs[guid] = [`${dbEntries.length > 1 ? guid : 'properties'}.db`]);
			await this.saveDBs(urn, dbs);

			const dbname: string = PropertiesUtils.dbname(urn, guid, dbs);
			const resolvedFilename: string = this.resolvedFilename(urn, guid, dbs);
			const key: string = PropertiesUtils.makeDBName (urn, dbname);
			this.cache[key] = {
				lastVisited: moment(),
				path2SqlDB: resolvedFilename,
				sqlDBName: dbname,
				sequelize: new Sequelize({
					dialect: 'sqlite',
					storage: resolvedFilename,
					define: {
						charset: 'utf8',
						collate: 'utf8_general_ci',
					}
				}),
				guids: guids,
				dbs: dbs,
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

	protected resolvedFilename(urn: string, guid: string, dbs: any, which: number = 0): string {
		const cachePath: string = this.getPath(urn);
		const filename: string = PropertiesUtils.dbname(urn, guid, dbs, which);
		return (_path.resolve(cachePath, filename));
	}

}

export default SqlPropertiesUtils;