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
import { Request, Response, Router } from 'express';
import * as Forge from 'forge-apis';
import Controller from '../interfaces/controller';
import AppSettings from '../server/app-settings';
import ExpressApp from '../server/express-server';
import Utils from '../utilities/utils';
import { Svf2Properties, Svf2PropertiesCache } from '../properties/svf2-properties';
import Svf2PropertiesUtils from '../properties/svf2-properties-utils';

export class Svf2PropertiesController implements Controller {

	public path: string = '/svf2';
	public router: Router = Router();
	public expressApp: ExpressApp = null;

	private utils: Svf2PropertiesUtils = Svf2PropertiesUtils.singleton(AppSettings.cacheFolder);

	public constructor(expressApp: ExpressApp) {
		this.expressApp = expressApp;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {
		this.router.get(`${this.path}/:urn/metadata/load`, this.databasePropertiesLoad.bind(this));
		this.router.get(`${this.path}/:urn/metadata/release`, this.databasePropertiesRelease.bind(this));
		this.router.get(`${this.path}/:urn/metadata/delete`, this.databasePropertiesDelete.bind(this));

		this.router.get(`${this.path}/:urn/metadata/externalids`, this.databaseIds.bind(this));
		this.router.get(`${this.path}/:urn/metadata/ids`, this.databaseExternalIds.bind(this));

		this.router.get(`${this.path}/:urn/metadata/properties`, this.databaseProperties.bind(this));
		this.router.get(`${this.path}/:urn/metadata/:guid/properties`, this.databaseProperties.bind(this));

		this.router.get(`${this.path}/:urn/metadata`, this.databaseObjectTree.bind(this));
		this.router.get(`${this.path}/:urn/metadata/:guid`, this.databaseObjectTree.bind(this));

		this.router.get(`${this.path}/:urn/metadata/search`, this.databasePropertiesSearch.bind(this));
	}

	private async databasePropertiesLoad(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: Svf2PropertiesCache = await this.utils.get(urn, region);

			const propsDb = new Svf2Properties();
			await propsDb.load(dbBuffers);

			const sizes: any = {};
			Object.keys(dbBuffers).map((key: string): number => sizes[key] = dbBuffers[key].length); //(dbBuffers[key].length / 1024).toFixed(2));

			response.json({
				data: {
					dbs: sizes,
					maxId: propsDb.idMax,
					type: 'details',
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databasePropertiesRelease(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			this.utils.release(urn, false); // no need to await
			response.status(202).json({ status: 'success' });
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databasePropertiesDelete(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			this.utils.release(urn, true); // no need to await
			response.status(202).json({ status: 'success' });
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseIds(request: Request, response: Response): Promise<void> {

	}

	private async databaseExternalIds(request: Request, response: Response): Promise<void> {

	}

	private async databaseProperties(request: Request, response: Response): Promise<void> {

	}

	private async databaseObjectTree(request: Request, response: Response): Promise<void> {

	}

	// operators = < > <= >= != ~= ( ) not and or ! & |
	// q=name=whatever
	// q=[objectid|name|externalid]=whatever and/or cat.prop=whatever
	private async databasePropertiesSearch(request: Request, response: Response): Promise<void> {
		
	}

}

export default Svf2PropertiesController;