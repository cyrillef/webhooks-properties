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
import SqlPropertiesUtils from '../utilities/sql-properties-utils';
import { SqlPropertiesSources, SqlProperties } from '../utilities/sql-properties';

export class SqlPropertiesController implements Controller {

	public path: string = '/sql';
	public router: Router = Router();
	public expressApp: ExpressApp = null;

	private utils: SqlPropertiesUtils = new SqlPropertiesUtils(AppSettings.cacheFolder);

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
			const sources: SqlPropertiesSources = await this.utils.get(urn, region);

			const propsDb: SqlProperties = new SqlProperties(sources.sequelize);
			const idMax: number = await propsDb.idMax();

			// const jobs: Promise<object[]>[] = SqlProperties.dbNames.map((key: string): Promise<object[]> => propsDb.selectQuery(`select count(id) from ${key};`));
			// const results: object[][] = await Promise.all(jobs);
			const results: object[][] = await propsDb.selectQueries(SqlProperties.dbNames.map((key: string): string => `select count(id) from ${key};`));

			const sizes: any = {};
			SqlProperties.dbNames.map((key: string, index): number => sizes[key] = Object.values(results[index][0])[0]);

			response.json({
				data: {
					dbs: sizes,
					maxId: idMax,
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
			this.utils.clear(urn, false); // no need to await
			response.status(202).json({ status: 'success' });
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async databasePropertiesDelete(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			this.utils.clear(urn, true); // no need to await
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
			const sources: SqlPropertiesSources = await this.utils.get(urn, region);

			const propsDb: SqlProperties = new SqlProperties(sources.sequelize);

			let dbIds: number[] = Utils.csv(request.query.ids as string); // csv format
			if (!dbIds || isNaN(dbIds[0]))
				dbIds = Array.from({ length: await propsDb.idMax() - 1 }, (_, i) => i + 1);

			const externalIds: { [index: number]: string } = {};
			const results : any = await propsDb.selectQuery(`select id, external_id from _objects_id where id in (${dbIds.join(',')});`);
			results.map ((elt: any): void => externalIds[elt.id] = elt.external_id);

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
			const sources: SqlPropertiesSources = await this.utils.get(urn, region);

			const propsDb: SqlProperties = new SqlProperties(sources.sequelize);

			const ids: { [index: string]: number } = {};
			let externalIds: string[] = (request.query.ids as string).split(','); // csv format
			externalIds = externalIds.map((extid: string): any => `external_id = '${extid}'`);
			const results: any = await propsDb.selectQuery(`select id, external_id from _objects_id where ${externalIds.join(' or ')};`);
			results.map((elt: any): void => ids[elt.external_id] = elt.id);

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
			const sources: SqlPropertiesSources = await this.utils.get(urn, region);

			const dbIds: number[] = Utils.csv(request.query.ids as string); // csv format
			const keepHiddens: boolean = (request.query.keephiddens as string) === 'true'; // defaults to false
			const keepInternals: boolean = (request.query.keepinternals as string) === 'true'; // defaults to false

			const propsDb = new SqlProperties(sources.sequelize);

			let trees: any[] = null;
			if ((!guid || guid === '') && dbIds) {
				trees = dbIds.map((id: number): any => propsDb.read(id, keepHiddens, keepInternals));
				trees = await Promise.all(trees);
			} else {
				// const viewable_in_ID: number[] = select id from _objects_attr where name = 'viewable_in' and category = '__viewable_in__';
				// select distinct(value_id) as valid, _objects_val.value from _objects_eav inner join _objects_val on _objects_val.id = _objects_eav.value_id where attribute_id = ${viewable_in_ID};
				if (!guid || guid === '')
					guid = Object.keys(sources.guids)[0];
				if (!sources.guids.hasOwnProperty(guid))
					guid = Object.keys(sources.guids)[0];
				const viewable_in: string = sources.guids[guid];

				trees = [await propsDb.buildTree(viewable_in, true, keepHiddens, keepInternals)];
				for (let i = 0; i < trees.length; i++) {
					if (trees[i].objects) {
						trees = [...trees, ...trees[i].objects];
						delete trees[i].objects;
					}
				}
				if (dbIds)
					trees = trees.filter((elt: any): boolean => dbIds.indexOf(elt.objectid) !== -1);
			}

			// if (!keepInternals) {
			// 	const regex = new RegExp('^__(\\w+)__$');
			// 	trees.map((elt: any): any => {
			// 		const keys = Object.keys(elt.properties);
			// 		keys
			// 			.filter((key: string): boolean => regex.test(key))
			// 			.map((key: string): any => delete elt.properties[key]);
			// 		//delete elt.properties.Other;
			// 	});
			// }
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
			const sources: SqlPropertiesSources = await this.utils.get(urn, region);

			const propsDb = new SqlProperties(sources.sequelize);

			if (!guid || guid === '')
				guid = Object.keys(sources.guids)[0];
			if (!sources.guids.hasOwnProperty(guid))
				//return (response.status(404).end());
				guid = Object.keys(sources.guids)[0];
			const viewable_in: string = sources.guids[guid];

			// const rootIds: number[] = propsDb.findRootNodes();
			// const trees: any[] = rootIds.map((objId: number): any => propsDb.buildFullTree(objId));
			const tree: any = await propsDb.buildTree(viewable_in, withProperties, keepHiddens, keepInternals);

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

	private async databasePropertiesSearch(request: Request, response: Response): Promise<void> {
		try {
			const urn: string = Utils.makeSafeUrn(request.params.urn || '');
			const region: string = request.query.region as string || Forge.DerivativesApi.RegionEnum.US;
			const sources: SqlPropertiesSources = await this.utils.get(urn, region);

			const keepHiddens: boolean = (request.query.keephiddens as string) === 'true';
			const keepInternals: boolean = (request.query.keepinternals as string) === 'true';

			const search: string = (request.query.q as string) || '';

		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

}

export default SqlPropertiesController;