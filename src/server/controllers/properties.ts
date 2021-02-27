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

import { Request, Response, Router } from 'express';
import Controller from '../interfaces/controller';
import * as Forge from 'forge-apis';
import Forge2Legged from '../server/forge-oauth-2legged';
import AppSettings from '../server/app-settings';
import { JsonProperties, JsonPropertiesSources } from '../utilities/json-properties';
import JsonPropertiesUtils from '../utilities/json-properties-utils';
import ExpressApp from '../server/express-server';
import * as util from 'util';
import * as _fs from 'fs';
import * as _path from 'path';

const _fsExists = util.promisify(_fs.exists);
const _fsReadFile = util.promisify(_fs.readFile);
const _fsWriteFile = util.promisify(_fs.writeFile);

// public static objects: any = {
// 	master: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
// 		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTWFzdGVyJTIwLSUyMFBsYW50M0QuZHdn',
// 		guids: [
// 			'b7bb12b1-f832-5005-ca30-a0e6b00f9da5', // 2d
// 			'e30bd031-d13a-a976-9153-78100829986a', // 3d
// 		],
// 		objid: 24,
// 		objids: [/*1st level*/24, /*2nd level*/44735, /*3rd level*/481, 324, 300, 195, 199, 504, 656, 494],
// 	},
//	pier9: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
//		ur: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvUDlfTWFjaGluZVNob3BfRmluYWwucnZ0',
// 		guids: [
// 			'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: "graphics", mime: "application/autodesk-svf", type: "resource"
//			//'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: "graphics", mime: "application/autodesk-svf2", type: "resource"
// 			'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: "graphics", mime: "application/autodesk-f2d", type: "resource",
// 			'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: "graphics", mime: "application/autodesk-f2d", type: "resource",
// 		],
// 		objid: 1,
// 		objids: [
//			1,
//				2824,
//					2825,
//						2827,
//							2828, 2829, 2830, 2831, 2968,
//					2860,
//						2971,
//							2972,
//								2977, 2980, ...
//				...
//		],
//	},
// 	dxf: { // rOlB7GtsAOmuvm6XqPAILp83ARMymAfL
// 		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS0yMDIxL2FyYWIuZHhm',
// 		guids: [
// 			'115d2418-de8a-46bf-852a-b23ef9338de2', // 2d
// 		],
// 		objid: 109,
// 		objids: [/*1st level*/109, /*2nd level*/19451, 19450, /*3rd level -1*/4099, 4102, 4103, 254, /*3rd level -2*/253, 4093, 4094, 4095], // and many more
// 	},
// };

class PropertiesController implements Controller {

	public pathTree: string = '/tree';
	public path: string = '/properties';
	public router: Router = Router();
	public expressApp: ExpressApp = null;

	public static readonly WAIT_429: number = 20000;
	public static readonly WAIT_202: number = 1000;

	private utils: JsonPropertiesUtils = new JsonPropertiesUtils(AppSettings.cacheFolder);

	public constructor(expressApp: ExpressApp) {
		this.expressApp = expressApp;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {
		this.router.get(`${this.path}/:urn`, this.modelDerivativesProperties.bind(this));
		this.router.get(`${this.path}/:urn/guids/:guid`, this.modelDerivativesProperties.bind(this));

		this.router.get(`${this.path}/:urn/db`, this.databaseProperties.bind(this));
		this.router.get(`${this.path}/:urn/guids/:guid/db`, this.databaseProperties.bind(this));

		this.router.get(`${this.pathTree}/:urn`, this.modelDerivativesObjectTree.bind(this));
		this.router.get(`${this.pathTree}/:urn/guids/:guid`, this.modelDerivativesObjectTree.bind(this));

		this.router.get(`${this.pathTree}/:urn/db`, this.databaseObjectTree.bind(this));
		this.router.get(`${this.pathTree}/:urn/guids/:guid/db`, this.databaseObjectTree.bind(this));

	}

	private static sleep(milliseconds: number): Promise<any> {
		return (new Promise((resolve: (value?: any) => void) => setTimeout(resolve, milliseconds)));
	}

	private async runTestUntilSuccess(generator: any): Promise<Forge.ApiResponse> {
		try {
			let result: Forge.ApiResponse = null;
			while (true) {
				result = await generator();
				switch (result.statusCode) {
					case 200:
					case 201:
						return (result);
					case 429:
						await PropertiesController.sleep(PropertiesController.WAIT_429);
						break;
					case 202:
						await PropertiesController.sleep(PropertiesController.WAIT_202);
						break;
					default:
						return (result);
				}
			};
		} catch (ex) {
			// If any non 20x status code is returned, we endup here
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
		return (null);
	}

	private async modelDerivativesProperties(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = request.params.urn || '';
			let guid: string = request.params.guid || '';
			const region: string = request.query.region as string || 'US';

			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;
			const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, region);

			if (!guid || guid === '') {
				const guids: Forge.ApiResponse = await api.getMetadata(urn, null, oauth.internalClient, token);
				guid = guids.body.data.metadata[0].guid;
			}

			// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
			// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
			//                     Possible values: true, false. The the implicit value is false.
			const results: Forge.ApiResponse = await this.runTestUntilSuccess(
				() => api.getModelviewProperties(urn, guid, { forceget: true }, oauth.internalClient, token)
			);
			if (results === null || results.statusCode !== 200)
				return (response.status(results.statusCode || 500).end());
			response.json(results.body);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseProperties(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = request.params.urn || '';
			let guid: string = request.params.guid || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: JsonPropertiesSources = await this.utils.get(urn, region);

			const propsDb = new JsonProperties();
			await propsDb.load(dbBuffers);

			if (!guid || guid === '')
				guid = dbBuffers.guids[0];
			if (!dbBuffers.hasOwnProperty(guid))
				return (response.status(404).end());

			// const rootIds: number[] = propsDb.findRootNodes();
			// let trees: any[] = rootIds.map((objId: number): any => propsDb.buildFullTree(objId, true));
			// for (let i = 0; i < trees.length; i++) {
			// 	if (trees[i].objects) {
			// 		trees = [...trees, ...trees[i].objects];
			// 		delete trees[i].objects;
			// 	}
			// }
			// trees.map((elt: any): any => delete elt.properties.__internal__);

			let trees: any[] = [propsDb.buildTree(dbBuffers[guid], true)];
			for (let i = 0; i < trees.length; i++) {
				if (trees[i].objects) {
					trees = [...trees, ...trees[i].objects];
					delete trees[i].objects;
				}
			}
			const regex = new RegExp('^__(\\w+)__$');
			trees.map((elt: any): any => {
				const keys = Object.keys(elt.properties);
				keys
					.filter((key: string): boolean => regex.test(key))
					.map((key: string): any => delete elt.properties[key]);
				delete elt.properties.Other;
			});
			trees.sort((a, b) => (a.objectid > b.objectid) ? 1 : ((b.objectid > a.objectid) ? -1 : 0))

			response.json({
				data: {
					type: 'properties',
					collection: trees,
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async modelDerivativesObjectTree(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = request.params.urn || '';
			let guid: string = request.params.guid || '';
			const region: string = request.query.region as string || 'US';

			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;
			const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, region);

			if (!guid || guid === '') {
				const guids: Forge.ApiResponse = await api.getMetadata(urn, null, oauth.internalClient, token);
				guid = guids.body.data.metadata[0].guid;
			}

			// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
			// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
			//                     Possible values: true, false. The the implicit value is false.
			const results: Forge.ApiResponse = await this.runTestUntilSuccess(
				() => api.getModelviewMetadata(urn, guid, { forceget: true }, oauth.internalClient, token)
			);
			if (results === null || results.statusCode !== 200)
				return (response.status(results.statusCode || 500).end());
			response.json(results.body);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseObjectTree(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = request.params.urn || '';
			let guid: string = request.params.guid || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: JsonPropertiesSources = await this.utils.get(urn, region);

			const propsDb = new JsonProperties();
			await propsDb.load(dbBuffers);

			if (!guid || guid === '')
				guid = dbBuffers.guids[0];
			if (!dbBuffers.hasOwnProperty(guid))
				//return (response.status(404).end());
				guid = dbBuffers.guids[0];

			// const rootIds: number[] = propsDb.findRootNodes();
			// const trees: any[] = rootIds.map((objId: number): any => propsDb.buildFullTree(objId));

			const tree: any = propsDb.buildTree(dbBuffers[guid], false);

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

}

export default PropertiesController;