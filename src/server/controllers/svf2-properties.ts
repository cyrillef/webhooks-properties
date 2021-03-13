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
		this.router.get(`${this.path}/:urn/metadata/svf-svf2`, this.databaseIdMapping.bind(this));

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

			const propsDb = new Svf2Properties(dbBuffers);

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
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: Svf2PropertiesCache = await this.utils.get(urn, region);

			// const propsDb = new Svf2Properties(dbBuffers);
			const propsDb: string[] = JSON.parse(dbBuffers.ids.toString('utf8'));

			let dbIds: number[] = Utils.csv(request.query.ids as string); // csv format
			if (!dbIds || isNaN(dbIds[0]))
				dbIds = Array.from({ length: propsDb.length - 1 }, (_, i) => i + 1);

			const externalIds: { [index: number]: string } = {};
			dbIds.map((id: number): any => externalIds[id] = propsDb[id]);

			response.json({
				data: {
					collection: externalIds,
					type: 'externalIds',
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseExternalIds(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: Svf2PropertiesCache = await this.utils.get(urn, region);

			const externalIds: string[] = (request.query.ids as string).split(','); // csv format

			// const propsDb = new Svf2Properties(dbBuffers);
			const propsDb: string[] = JSON.parse(dbBuffers.ids.toString('utf8'));

			const ids: { [index: string]: number } = {};
			externalIds.map((extid: string): any => ids[extid] = propsDb.indexOf(extid));

			response.json({
				data: {
					collection: ids,
					type: 'objectids',
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseIdMapping(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const reverse: boolean = (request.query.reverse as string) === 'true'; // defaults to false
			const dbBuffers: Svf2PropertiesCache = await this.utils.get(urn, region);

			// const propsDb: Svf2Properties = new Svf2Properties(dbBuffers);
			const dbidIdx: Uint32Array = new Uint32Array(dbBuffers.dbid.buffer, dbBuffers.dbid.byteOffset, dbBuffers.dbid.byteLength / Uint32Array.BYTES_PER_ELEMENT);

			let dbIds: number[] = Utils.csv(request.query.ids as string); // csv format
			if (!dbIds || isNaN(dbIds[0]))
				dbIds = Array.from({ length: dbidIdx.length - 1 }, (_, i) => i + 1);

			const idmapping: { [index: number]: number } = {};
			if ( !reverse )
				dbIds.map((id: number): any => idmapping[id] = dbidIdx[id]);
			else
				dbIds.map((id: number): any => idmapping[id] = dbidIdx.indexOf(id));

			response.json({
				data: {
					mapping: idmapping,
					type: reverse ? 'svf2->svf' : 'svf->svf2',
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseProperties(request: Request, response: Response): Promise<void> {

	}

	private async databaseObjectTree(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			let guid: string = request.params.guid || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const withProperties: boolean = (request.query.properties as string) === 'true'; // defaults to false
			const keepHiddens: boolean = (request.query.keephiddens as string) === 'true'; // defaults to false
			const keepInternals: boolean = (request.query.keepinternals as string) === 'true'; // defaults to false
			const dbBuffers: Svf2PropertiesCache = await this.utils.get(urn, region);

			const propsDb = new Svf2Properties(dbBuffers);

			if (!guid || guid === '')
				guid = Object.keys(dbBuffers.guids)[0];
			if (!dbBuffers.guids.hasOwnProperty(guid))
				//return (response.status(404).end());
				guid = Object.keys(dbBuffers.guids)[0];
			const viewable_in: string = dbBuffers.guids[guid];

			// const rootIds: number[] = propsDb.findRootNodes();
			// const trees: any[] = rootIds.map((objId: number): any => propsDb.buildFullTree(objId));
			const tree: any = propsDb.buildTree(viewable_in, withProperties, keepHiddens, keepInternals);

			// if (withProperties) {
			// 	const regex = new RegExp('^__(\\w+)__$');

			// 	const cleanup = (elt: any): void => {
			// 		if (elt.objects)
			// 			elt.objects.map((elt: any): void => cleanup(elt));
			// 		const keys = Object.keys(elt.properties);
			// 		keys
			// 			.filter((key: string): boolean => regex.test(key))
			// 			.map((key: string): any => delete elt.properties[key]);
			// 		delete elt.properties.Other;
			// 	};

			// 	cleanup(tree);
			// }

			response.json({
				data: {
					type: 'objects',
					objects: [tree],
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	// operators = < > <= >= != ~= ( ) not and or ! & |
	// q=name=whatever
	// q=[objectid|name|externalid]=whatever and/or cat.prop=whatever
	private async databasePropertiesSearch(request: Request, response: Response): Promise<void> {
		
	}

}

export default Svf2PropertiesController;