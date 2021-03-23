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
import { SvfProperties, SvfPropertiesCache } from '../properties/svf-properties';
import SvfPropertiesUtils from '../properties/svf-properties-utils';
import { Literal, ExpressionParser, ExpressionEval } from '../utilities/expression-parser';

export class SvfPropertiesController implements Controller {

	public path: string = '/svf';
	public router: Router = Router();
	public expressApp: ExpressApp = null;

	private utils: SvfPropertiesUtils = SvfPropertiesUtils.singleton(AppSettings.cacheFolder);

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
			const dbBuffers: SvfPropertiesCache = await this.utils.get(urn, region);

			const propsDb = new SvfProperties();
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
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: SvfPropertiesCache = await this.utils.get(urn, region);

			// const propsDb: SvfProperties = new SvfProperties();
			// await propsDb.load(dbBuffers);
			const propsDb: string[] = await Utils.jsonGzRoot(dbBuffers.objects_ids);

			const sep: string = (request.query.sep as string) || ',';
			let dbIds: number[] = Utils.csvToNumber(request.query.ids as string, sep); // csv format
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
			const dbBuffers: SvfPropertiesCache = await this.utils.get(urn, region);

			const sep: string = (request.query.sep as string) || ',';
			const externalIds: string[] = Utils.csvToString(request.query.ids as string, sep); // csv format

			// const propsDb: SvfProperties = new SvfProperties();
			// await propsDb.load(dbBuffers);
			const propsDb: string[] = await Utils.jsonGzRoot(dbBuffers.objects_ids)

			const ids: { [index: string]: number } = {};
			if (externalIds && externalIds.length)
				externalIds.map((extid: string): any => ids[extid] = propsDb.indexOf(extid.trim()));
			else
				propsDb.slice(1).map((extId: string): any => ids[extId.trim()] = propsDb.indexOf(extId));

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

	private async databaseProperties(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			let guid: string = request.params.guid || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: SvfPropertiesCache = await this.utils.get(urn, region);

			const sep: string = (request.query.sep as string) || ',';
			const dbIds: number[] = Utils.csvToNumber(request.query.ids as string, sep); // csv format
			const keepHiddens: boolean = (request.query.keephiddens as string) === 'true'; // defaults to false
			const keepInternals: boolean = (request.query.keepinternals as string) === 'true'; // defaults to false

			const propsDb = new SvfProperties();
			await propsDb.load(dbBuffers);

			let trees: any[] = null;
			if ((!guid || guid === '') && dbIds) {
				trees = dbIds.map((id: number): any => propsDb.read(id, keepHiddens, keepInternals));
			} else {
				if (!guid || guid === '')
					guid = Object.keys(dbBuffers.guids)[0];
				if (!dbBuffers.guids.hasOwnProperty(guid))
					//return (response.status(404).end());
					guid = Object.keys(dbBuffers.guids)[0];
				const viewable_in: string[] = dbBuffers.guids[guid];

				// const rootIds: number[] = propsDb.findRootNodes();
				trees = [propsDb.buildTree(viewable_in, true, keepHiddens, keepInternals)];
				for (let i = 0; i < trees.length; i++) {
					if (trees[i].objects) {
						trees = [...trees, ...trees[i].objects];
						delete trees[i].objects;
					}
				}
				if (dbIds)
					trees = trees.filter((elt: any): boolean => dbIds.indexOf(elt.objectid) !== -1);
			}

			if (!keepInternals) {
				const regex = new RegExp('^__(\\w+)__$');
				trees.map((elt: any): any => {
					const keys = Object.keys(elt.properties);
					keys
						.filter((key: string): boolean => regex.test(key))
						.map((key: string): any => delete elt.properties[key]);
					//delete elt.properties.Other;
				});
			}
			trees.sort((a: any, b: any): number => (a.objectid > b.objectid) ? 1 : ((b.objectid > a.objectid) ? -1 : 0));

			response.json({
				data: {
					collection: trees,
					type: 'properties',
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databaseObjectTree(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			let guid: string = request.params.guid || '';
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const withProperties: boolean = (request.query.properties as string) === 'true'; // defaults to false
			const keepHiddens: boolean = (request.query.keephiddens as string) === 'true'; // defaults to false
			const keepInternals: boolean = (request.query.keepinternals as string) === 'true'; // defaults to false
			const dbBuffers: SvfPropertiesCache = await this.utils.get(urn, region);

			const propsDb = new SvfProperties();
			await propsDb.load(dbBuffers);

			if (!guid || guid === '')
				guid = Object.keys(dbBuffers.guids)[0];
			if (!dbBuffers.guids.hasOwnProperty(guid))
				//return (response.status(404).end());
				guid = Object.keys(dbBuffers.guids)[0];
			const viewable_in: string[] = dbBuffers.guids[guid];

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
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const dbBuffers: SvfPropertiesCache = await this.utils.get(urn, region);

			const bruteforce: boolean = (request.query.bruteforce as string) === 'true';
			const keepHiddens: boolean = (request.query.keephiddens as string) === 'true';
			const keepInternals: boolean = (request.query.keepinternals as string) === 'true';

			const search: string = (request.query.q as string) || ''; // ((request.query.q as string) || '').split('/');
			const parsed: Literal[] = ExpressionParser.parse(search);

			const propsDb = new SvfProperties();
			await propsDb.load(dbBuffers);

			let trees: any[] = null;
			let dbIds: number[] = [];
			if (bruteforce) { // Brute Force
				dbIds = Array.from({ length: propsDb.idMax }, (_, i) => i + 1);
			} else {
				// Here, we find all categories/keys from the search expression (think about not) TBD
				// Then, we go in the 'attrs' list to find their index
				// Go to the 'avs' and find all the even index value matching the Attribut ID
				// Divide that index by 2, and go to the 'offs' list and find the index of the maximum value for the AVS index
				// That gives the objID
				const keys: string[] = ExpressionEval.literalList(parsed);
				const idSet: Set<number> = new Set<number>();
				keys.map((key: string): void => {
					const values: string[] = key.split('.');
					const attrID: number = values.length === 2 ?
						  propsDb.attrs.findIndex((elt: any): boolean => elt[1] === values[0] && elt[5] === values[1])
						: propsDb.attrs.findIndex((elt: any): boolean => elt[5] === values[0]);
					const avsIDs: number[] = propsDb.avs.map((elt: number, index: number): number | string => elt === attrID && (index % 2 === 0)? index / 2 : '').filter(String);
					dbIds = avsIDs.map((elt: number): number => propsDb.offs.filter((offset: number): boolean => offset <= elt).length - 1);
					dbIds.map((id: number): Set<number> => idSet.add(id));
				});
				dbIds = Array.from(idSet);
			}
			trees = dbIds.map((id: number): any => propsDb.read(id, true, true));
			trees = trees.filter((elt: any): boolean => ExpressionEval.eval(elt, parsed));
			if (!keepHiddens || !keepInternals)
				trees = trees.map((elt: any): any => propsDb.read(elt.objectid, keepHiddens, keepInternals));

			response.json({
				data: {
					collection: trees,
					type: 'properties',
				}
			});
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

}

export default SvfPropertiesController;