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
import Utils from '../utilities/utils'

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
		return (_path.resolve(this.cachePath, urn));
	}

	public async release(urn: string, deleteOnDisk: boolean = true): Promise<void> {
		try {
			urn = Utils.makeSafeUrn(urn);
			if (this.cache[urn])
				delete this.cache[urn];
			// if (deleteOnDisk)
			// 	await Utils.rimraf(_path.resolve(this.cachePath, urn));
		} catch (ex) {
		}
	}

	public async loadInCache(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<Svf2PropertiesCache> {
		const self = this;
		
		return (null);
	}

	protected async loadFromForge(urn: string, region: string = Forge.DerivativesApi.RegionEnum.US): Promise<Svf2PropertiesCache> {
		const self = this;
		return (null);
	}

}

export default Svf2PropertiesUtils;