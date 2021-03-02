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

class PropertiesController implements Controller {

	public path: string = '/properties';
	public pathTree: string = '/tree';
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
		this.router.get(`${this.path}/:urn/details`, this.databasePropertiesDetails.bind(this));
		this.router.get(`${this.path}/:urn/release`, this.databasePropertiesRelease.bind(this));
		this.router.get(`${this.path}/:urn/externalids`, this.databaseIds.bind(this));
		this.router.get(`${this.path}/:urn/ids`, this.databaseExternalIds.bind(this));

		this.router.get(`${this.path}/:urn/forge`, this.modelDerivativesProperties.bind(this));
		this.router.get(`${this.path}/:urn/guids/:guid/forge`, this.modelDerivativesProperties.bind(this));

		this.router.get(`${this.path}/:urn`, this.databaseProperties.bind(this));
		this.router.get(`${this.path}/:urn/guids/:guid`, this.databaseProperties.bind(this));

		this.router.get(`${this.pathTree}/:urn/forge`, this.modelDerivativesObjectTree.bind(this));
		this.router.get(`${this.pathTree}/:urn/guids/:guid/forge`, this.modelDerivativesObjectTree.bind(this));

		this.router.get(`${this.pathTree}/:urn`, this.databaseObjectTree.bind(this));
		this.router.get(`${this.pathTree}/:urn/guids/:guid`, this.databaseObjectTree.bind(this));
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

	private async databasePropertiesDetails(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = request.params.urn || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: JsonPropertiesSources = await this.utils.get(urn, region);

			const propsDb = new JsonProperties();
			await propsDb.load(dbBuffers);

			const sizes: any = {};
			Object.keys(dbBuffers).map((key: string): number => sizes[key] = dbBuffers[key].length); //(dbBuffers[key].length / 1024).toFixed(2));

			response.json({
				data: {
					type: 'details',
					maxId: propsDb.idMax,
					dbs: sizes
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databasePropertiesRelease(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = request.params.urn || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;

			this.utils.clear (urn, true); // no need to await

			response.status(202).json({ status: 'success' });
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseIds(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = request.params.urn || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: JsonPropertiesSources = await this.utils.get(urn, region);

			const dbIds: number[] = PropertiesController.csv(request.query.ids as string); // csv format

			// const propsDb = new JsonProperties();
			// await propsDb.load(dbBuffers);
			const propsDb: string[] = await JsonProperties.jsonGzRoot(dbBuffers.objects_ids)

			const externalIds: { [index: number]: string } = {};
			dbIds.map((id: number): any => externalIds[id] = propsDb[id]);

			response.json({
				data: {
					type: 'externalIds',
					collection: externalIds,
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseExternalIds(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = request.params.urn || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: JsonPropertiesSources = await this.utils.get(urn, region);

			const externalIds: string[] = (request.query.ids as string).split(','); // csv format

			// const propsDb = new JsonProperties();
			// await propsDb.load(dbBuffers);
			const propsDb: string[] = await JsonProperties.jsonGzRoot(dbBuffers.objects_ids)

			const ids: { [index: string]: number } = {};
			externalIds.map((extid: string): any => ids[extid] = propsDb.indexOf(extid));

			response.json({
				data: {
					type: 'objectids',
					collection: ids,
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
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

			const objid: number = request.query.objectid ? parseInt(request.query.objectid as string) : undefined;

			// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
			// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
			//                     Possible values: true, false. The the implicit value is false.
			const results: Forge.ApiResponse = await this.runTestUntilSuccess(
				() => api.getModelviewProperties(urn, guid, { forceget: true, objectid: objid }, oauth.internalClient, token)
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

			const dbIds: number[] = PropertiesController.csv(request.query.ids as string); // csv format
			const keepInternals: boolean = (request.query.keepinternals as string) === 'true';

			const propsDb = new JsonProperties();
			await propsDb.load(dbBuffers);

			let trees: any[] = null;
			if ((!guid || guid === '') && dbIds ) {
				trees = dbIds.map((id: number): any => propsDb.read(id, keepInternals));
			} else {
				if (!guid || guid === '')
					guid = Object.keys(dbBuffers.guids)[0];
				if (!dbBuffers.guids.hasOwnProperty(guid))
					//return (response.status(404).end());
					guid = Object.keys(dbBuffers.guids)[0];
				const viewable_in: string = dbBuffers.guids[guid];

				// const rootIds: number[] = propsDb.findRootNodes();
				trees = [propsDb.buildTree(viewable_in, true)];
				for (let i = 0; i < trees.length; i++) {
					if (trees[i].objects) {
						trees = [...trees, ...trees[i].objects];
						delete trees[i].objects;
					}
				}
				if (dbIds)
					trees = trees.filter((elt: any): boolean => dbIds.indexOf(elt.objectid) !== -1);
			}

			const regex = new RegExp('^__(\\w+)__$');
			if (!keepInternals) {
				trees.map((elt: any): any => {
					const keys = Object.keys(elt.properties);
					keys
						.filter((key: string): boolean => regex.test(key))
						.map((key: string): any => delete elt.properties[key]);
					delete elt.properties.Other;
				});
			}
			trees.sort((a: any, b: any): number => (a.objectid > b.objectid) ? 1 : ((b.objectid > a.objectid) ? -1 : 0));

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
			const withProperties: boolean = (request.query.properties as string || 'false') === 'true';
			const dbBuffers: JsonPropertiesSources = await this.utils.get(urn, region);

			const propsDb = new JsonProperties();
			await propsDb.load(dbBuffers);

			if (!guid || guid === '')
				guid = Object.keys(dbBuffers.guids)[0];
			if (!dbBuffers.guids.hasOwnProperty(guid))
				//return (response.status(404).end());
				guid = Object.keys(dbBuffers.guids)[0];
			const viewable_in: string = dbBuffers.guids[guid];

			// const rootIds: number[] = propsDb.findRootNodes();
			// const trees: any[] = rootIds.map((objId: number): any => propsDb.buildFullTree(objId));
			const tree: any = propsDb.buildTree(viewable_in, withProperties);

			if (withProperties) {
				const regex = new RegExp('^__(\\w+)__$');

				const cleanup = (elt: any): void => {
					if (elt.objects)
						elt.objects.map((elt: any): void => cleanup(elt));
					const keys = Object.keys(elt.properties);
					keys
						.filter((key: string): boolean => regex.test(key))
						.map((key: string): any => delete elt.properties[key]);
					delete elt.properties.Other;
				};

				cleanup(tree);
			}

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

	// Utils

	// uses ',' separated Ids
	// ids are either a number, or a range with 2 numbers separated with a '-'
	private static csv(st: string): number[] {
		if (!st)
			return (undefined);
		const dbIds: (number | number[])[] = st
			.split(',')
			.map((elt: string): number | number[] => {
				const r: RegExpMatchArray = elt.match(/^(\d+)-(\d+)$/);
				if (r === null)
					return (parseInt(elt));
				const t: number[] = [];
				for (let i = parseInt(r[1]); i <= parseInt(r[2]); i++)
					t.push(i);
				return (t);
			});
		return ([].concat.apply([], dbIds));
	}

}

export default PropertiesController;