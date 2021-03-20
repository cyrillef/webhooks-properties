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
import * as _util from 'util';
import * as superagent from 'superagent';
import JsonDiff from './json-diff';
//import request = require('superagent');
//import { stringify } from 'querystring';
import chalk from 'chalk';

const _fsExists = _util.promisify(_fs.exists);
const _fsUnlink = _util.promisify(_fs.unlink);
const _fsReadFile = _util.promisify(_fs.readFile);
const _fsWriteFile = _util.promisify(_fs.writeFile);
const _fsReadDir = _util.promisify(_fs.readdir);

// oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
const urns: any = {
	'Master - Plant3D.dwg': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTWFzdGVyJTIwLSUyMFBsYW50M0QuZHdn', // Master - Plant3D.dwg
		guids: [
			'e30bd031-d13a-a976-9153-78100829986a', // 3d
			'b7bb12b1-f832-5005-ca30-a0e6b00f9da5', // 2d
		],
		type: 'svf',
	},
	'P9_MachineShop_Final.rvt': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvUDlfTWFjaGluZVNob3BfRmluYWwucnZ0', // P9_MachineShop_Final.rvt
		guids: [
			'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf', type: 'resource'
			'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
			'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
		],
		type: 'svf',
	},
	'P9_MachineShop_Final-2.rvt': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvUDlfTWFjaGluZVNob3BfRmluYWwtMi5ydnQ', // P9_MachineShop_Final-2.rvt
		guids: [
			'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf2', type: 'resource'
			'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
			'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
		],
		type: 'svf2',
	},
	'Model.ifc': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTW9kZWwuaWZj', // Model.ifc
		guids: [
			'87a2f6e1-9a1f-434f-acfb-6bcaeace1c3d',
		],
		type: 'svf',
	},
	'Model2.ifc': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTW9kZWwyLmlmYw', // Model2.ifc
		guids: [
			'8fc795ac-7438-46c4-95e5-8b8fd74d33cb',
		],
		type: 'svf2',
	},
};

// Unicode Character “✓” (U+2713)
// Unicode Character “✗” (U+2717)

class PropertiesController {

	private static sortKey: string
		//= 'objectid';
		= 'externalId';
	private static sortByObjectID: string = 'objectid';

	private static rangeIDs: number = 30;

	constructor() { }

	private static sleep(milliseconds: number): Promise<any> {
		return (new Promise((resolve: (value?: any) => void) => setTimeout(resolve, milliseconds)));
	}

	public async help(args?: string[]): Promise<void> {
		console.log('properties <command> [args]');
		console.log('  help        - this message');
		console.log('  list        - Models list');
		console.log('  forge <model> - test Forge endpoints (both for SVF and SVF2)');
		console.log('  svf <model> - test SVF (both for SVF and SVF2)');
		console.log('  sql <model> - test SQL (both for SVF and SVF2)');
		console.log('  svf2 <model> - test SVF2');
		console.log('  clean <model> [<model> ...] - delete all data files');
		console.log('  all <model> [<model> ...] - run forge/svf/sql/svv2 commands for these models');
		console.log(' ');
		await PropertiesController.sleep(0);
	}

	public async list(index: string = ''): Promise<void> {
		console.log('models: ', Object.keys(urns));
	}

	public async forge_getProperties(args: string, guid: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/forge/${def.urn}/metadata/${guid}/properties`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-properties.forge`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortKey]);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} forge-properties created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} forge-properties`, PropertiesController.sortKey);
		}
		return (result.body.data.collection);
	}

	public async forge_getPropertiesRange(args: string, guid: string, dbids: number[]): Promise<any> {
		const def: any = urns[args];
		const jobs: Promise<any>[] = dbids.map((dbid: number): Promise<any> => {
			const url: string = `/forge/${def.urn}/metadata/${guid}/properties?objectid=${dbid}`;
			const job: any = superagent('GET', PropertiesController.makeRequestURL(url));
			return (job);
		});
		const results: any[] = await Promise.all(jobs);
		const result: any = results[0].body;
		for (let i = 1; i < results.length; i++)
			result.data.collection.push(results[i].body.data.collection[0]);

		const fn: string = `./data/${args}-properties-range.forge`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result, [PropertiesController.sortKey]);
		if (!json) {
			await this.saveJson(fn, result);
			PropertiesController.console(true, `${args} forge-properties-range created!`);
		} else {
			PropertiesController.compareObjects(result, json, `${args} forge-properties-range`, PropertiesController.sortKey);
		}
		return (result.data.collection);
	}

	public async forge_getTree(args: string, guid: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/forge/${def.urn}/metadata/${guid}`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-tree.forge`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortByObjectID]);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} forge-tree created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} forge-tree`, PropertiesController.sortByObjectID);
		}
		return (result.body.data.objects);
	}

	public async xxx_load(method: string, args: string): Promise<any> {
		//const _urns: any[] = Object.keys(urns).filter ((elt: string): boolean => )
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/load`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-load.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} ${method} load created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} load`);
		}
		return (result.body);
	}

	public async xxx_delete(method: string, args: string): Promise<void> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/delete`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
	}

	public async xxx_getExternalIds(method: string, args: string): Promise<any> {
		//const _urns: any[] = Object.keys(urns).filter ((elt: string): boolean => )
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/externalids`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-externalids.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} ${method} externalids created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} externalids`);
		}
		return (result.body.data.collection);
	}

	public async xxx_getObjIds(method: string, args: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/ids`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-ids.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} ${method} ids created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} ids`);
		}
		return (result.body.data.collection);
	}

	public async xxx_getIdsRange(method: string, args: string, extIds: string[]): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/ids?ids=${encodeURIComponent(extIds.join(','))}`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-ids-range.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} ${method} ids range created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} ids range`);
		}
		return (result.body.data.collection);
	}

	public async xxx_GetProperties(method: string, args: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/properties`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-properties.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortKey]);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} ${method} properties created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} properties`, PropertiesController.sortKey);
		}
		return (result.body.data.collection);
	}

	public async xxx_getPropertiesRange(method: string, args: string, dbids: number[], keepInternals: boolean): Promise<any> {
		const num: string = keepInternals ? '-internals' : '-range';
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/properties?ids=${encodeURIComponent(dbids.join(','))}&keephiddens=${keepInternals.toString()}&keepinternals=${keepInternals.toString()}`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-properties${num}.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortKey]);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} ${method} properties${num} created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} properties${num}`, PropertiesController.sortKey);
		}
		return (result.body.data.collection);
	}

	public async xxx_getTree(method: string, args: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-tree.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortByObjectID]);
		if (!json) {
			await this.saveJson(fn, result.body);
			PropertiesController.console(true, `${args} ${method} tree created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} tree`, PropertiesController.sortByObjectID);
		}
		return (result.body.data.objects);
	}

	public async svf2_svfTosvf2_mapping(objIDs: number[], args: string, reverse: boolean = true): Promise<number[]> {
		const def: any = urns[args];
		let url: string = `/svf2/${def.urn}/metadata/svf-svf2?reverse=${reverse.toString()}`;
		if (objIDs && objIDs.length)
			url += `&ids=${encodeURIComponent(objIDs.join(','))}`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		return (result.body.data.mapping);
	}

	public async forge(args?: string[]): Promise<void> {
		if (args.length < 1)
			return (this.help(args));
		let data: any = null;
		try {
			for (let i = 0; i < args.length; i++) {
				if (!urns.hasOwnProperty(args[i]))
					continue;
				const fn: string = args[i]; // Model translated with SVF
				const defaultGUID: string = urns[fn].guids[0];

				const forgeProps: any = await this.forge_getProperties(fn, defaultGUID);
				const forgeTree: any = await this.forge_getTree(fn, defaultGUID);

				// Get a meaningful range
				//const extidsrange: string[] = forgeProps.slice(0, PropertiesController.rangeIDs).map((elt: any): string => elt.externalId);
				const range: number[] = forgeProps.slice(0, PropertiesController.rangeIDs).map((elt: any): string => elt.objectid);
				await this.forge_getPropertiesRange(fn, defaultGUID, range);
			}
		} catch (ex) {
			console.error(ex);
		}
	}

	public async svf(args?: string[]): Promise<void> {
		if (args.length < 1 || !urns.hasOwnProperty(args[0]))
			return (this.help(args));
		let data: any = null;
		try {
			const fn1: string = args[0]; // Model translated with SVF
			const defaultGUID: string = urns[fn1].guids[0];
			console.log(`Downloading ${fn1} .json.gz files, please wait...`);
			await this.xxx_load('svf', fn1);

			// Get all ExternalID and ObjectID and verify each lists
			const extids: any = await this.xxx_getExternalIds('svf', fn1); // { svfID: externalID }
			const ids: any = await this.xxx_getObjIds('svf', fn1); // { externalID: svfID }
			data = {};
			Object.values(ids).map((id: number, index: number): string => data[`${id}`] = Object.keys(ids)[index]);
			JsonDiff.sortObjectProperties(data);
			PropertiesController.compareObjects(extids, data, `${fn1} svf ExtId <-> ObjId`);

			// Get a meaningful range
			const extidsrange: string[] = Object.values(extids).sort().slice(0, PropertiesController.rangeIDs) as string[];
			const idsrange: any = await this.xxx_getIdsRange('svf', fn1, extidsrange);
			let bs: boolean[] = Object.keys(idsrange).map((extId: string): boolean => ids[extId] && ids[extId] === idsrange[extId]);
			let equal: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
			PropertiesController.console(equal, `${fn1} svf ObjID -> ExternalID -> ObjID conversion`);
			const range: number[] = Object.values(idsrange).sort() as number[]; // SVF IDs from sorted ExternalIDs

			// Check Properties
			//const forgeProps: any = await this.forge_getProperties(fn1, defaultGUID);
			const svfProps: any = await this.xxx_GetProperties('svf', fn1);
			await this.xxx_getPropertiesRange('svf', fn1, range, false);
			await this.xxx_getPropertiesRange('svf', fn1, range, true);

			//const forgeTree: any = await this.forge_getTree(fn1, defaultGUID);
			const svfTree: any = await this.xxx_getTree('svf', fn1);

			// await this.compareMethods(fn1, 'metadata-properties', 'forge', forgeProps, 'svf', svfProps, PropertiesController.sortKey);
			// await this.compareMethods(fn1, 'metadata-objecttree', 'forge', forgeTree, 'svf', svfTree, PropertiesController.sortKey);
		} catch (ex) {
			console.error(ex);
		}
	}

	public async sql(args?: string[]): Promise<void> {
		if (args.length < 1 || !urns.hasOwnProperty(args[0]))
			return (this.help(args));
		let data: any = null;
		try {
			const fn1: string = args[0]; // Model translated with SVF
			const defaultGUID: string = urns[fn1].guids[0];
			console.log(`Downloading ${fn1} sqlite DB, please wait...`);
			await this.xxx_load('sql', fn1);

			// Get all ExternalID and ObjectID and verify each lists
			const extids: any = await this.xxx_getExternalIds('sql', fn1); // { svfID: externalID }
			const ids: any = await this.xxx_getObjIds('sql', fn1); // { externalID: svfID }
			data = {};
			Object.values(ids).map((id: number, index: number): string => data[`${id}`] = Object.keys(ids)[index]);
			JsonDiff.sortObjectProperties(data);
			PropertiesController.compareObjects(extids, data, `${fn1} sql ExtId <-> ObjId`);

			// Get a meaningful range
			const extidsrange: string[] = Object.values(extids).sort().slice(0, PropertiesController.rangeIDs) as string[];
			const idsrange: any = await this.xxx_getIdsRange('sql', fn1, extidsrange);
			let bs: boolean[] = Object.keys(idsrange).map((extId: string): boolean => ids[extId] && ids[extId] === idsrange[extId]);
			let equal: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
			PropertiesController.console(equal, `${fn1} sql ObjID -> ExternalID -> ObjID conversion`);
			const range: number[] = Object.values(idsrange).sort() as number[]; // SVF IDs from sorted ExternalIDs

			// Check Properties
			//const forgeProps: any = await this.forge_getProperties(fn1, defaultGUID);
			const sqlProps: any = await this.xxx_GetProperties('sql', fn1);
			await this.xxx_getPropertiesRange('sql', fn1, range, false);
			await this.xxx_getPropertiesRange('sql', fn1, range, true);

			//const forgeTree: any = await this.forge_getTree(fn1, defaultGUID);
			const sqlTree: any = await this.xxx_getTree('sql', fn1);

			// await this.compareMethods(fn1, 'metadata-properties', 'forge', forgeProps, 'sql', sqlProps, PropertiesController.sortKey);
			// await this.compareMethods(fn1, 'metadata-objecttree', 'forge', forgeTree, 'sql', sqlTree, PropertiesController.sortKey);
		} catch (ex) {
			console.error(ex);
		}
	}

	public async svf2(args?: string[]): Promise<void> {
		if (args.length < 1 || !urns.hasOwnProperty(args[0]))
			return (this.help(args));
		let data: any = null;
		try {
			const fn2: string = args[0]; // Model translated with SVF2
			const defaultGUID2: string = urns[fn2].guids[0];
			console.log(`Downloading ${fn2} .json .idx .pack files, please wait...`);
			await this.xxx_load('svf2', fn2);

			// Get all ExternalID and ObjectID and verify each lists
			const extids: any = await this.xxx_getExternalIds('svf2', fn2); // { svf2ID: externalID }
			const ids: any = await this.xxx_getObjIds('svf2', fn2); // { externalID: svf2ID }
			data = {};
			Object.values(ids).map((id: number, index: number): string => data[`${id}`] = Object.keys(ids)[index]);
			JsonDiff.sortObjectProperties(data);
			PropertiesController.compareObjects(extids, data, `${fn2} svf2 ExtId <-> ObjId`);

			// Get a meaningful range
			const extidsrange: string[] = Object.values(extids).sort().slice(0, PropertiesController.rangeIDs) as string[];
			const idsrange: any = await this.xxx_getIdsRange('svf2', fn2, extidsrange);
			let bs: boolean[] = Object.keys(idsrange).map((extId: string): boolean => ids[extId] && ids[extId] === idsrange[extId]);
			let equal: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
			PropertiesController.console(equal, `${fn2} svf2 ObjID -> ExternalID -> ObjID conversion`);
			const range: number[] = Object.values(idsrange).sort() as number[]; // SVF2 IDs from sorted ExternalIDs

			// Check SVF2/SVF ID conversions (we assume range is SVF2 IDs)
			let svf2_svf_ids: any = await this.svf2_svfTosvf2_mapping(range, fn2, true); // { svf2ID: svfID }
			let svf_svf2_ids: any = await this.svf2_svfTosvf2_mapping(Object.values(svf2_svf_ids), fn2, false); // { svfID: svf2ID }
			bs = range.map((svf2ID: number): boolean => svf2_svf_ids[svf2ID] && svf2ID === svf_svf2_ids[svf2_svf_ids[svf2ID]]);
			equal = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
			PropertiesController.console(equal, `${fn2} svf2 svf2 -> svf -> svf2 ID conversion`);

			// !!! careful, to be able to compare with SVF, we need to map IDs (which we just did above)

			// Check Properties
			//const forgeProps: any = await this.forge_getProperties(fn2, defaultGUID2);
			const svf2Props: any = await this.xxx_GetProperties('svf2', fn2);
			await this.xxx_getPropertiesRange('svf2', fn2, range, false);
			await this.xxx_getPropertiesRange('svf2', fn2, range, true);

			//const forgeTree: any = await this.forge_getTree(fn2, defaultGUID2);
			const svf2Tree: any = await this.xxx_getTree('svf2', fn2);

			// await this.compareMethods(fn2, 'metadata-properties', 'forge', forgeProps, 'svf2', svf2Props, PropertiesController.sortKey);
			// await this.compareMethods(fn2, 'metadata-objecttree', 'forge', forgeTree, 'svf2', svf2Tree, PropertiesController.sortKey);
		} catch (ex) {
			console.error(ex);
		}
	}

	public async check1(args?: string[]): Promise<void> {
		if (args.length < 2 || !urns.hasOwnProperty(args[0]) || !urns.hasOwnProperty(args[1]))
			return (this.help(args));
		try {
			const fn1: string = args[0]; // Model translated with SVF
			const fn2: string = args[1]; // Model translated with SVF2
			const defaultGUID1: string = urns[fn1].guids[0];
			const defaultGUID2: string = urns[fn2].guids[1];

			const svfLoad = await this.loadJson(`data/${fn1}-load.svf`);
			const sqlLoad = await this.loadJson(`data/${fn1}-load.sql`);
			const svf2Load = await this.loadJson(`data/${fn2}-load.svf2`);
			PropertiesController.console(
				svfLoad.data.maxId === sqlLoad.data.maxId && svfLoad.data.maxId === svf2Load.data.maxId,
				`${fn1} number of entries`
			);
			
			const svfExtIds: any = await this.loadJson(`data/${fn1}-externalids.svf`);
			const sqlExtIds: any = await this.loadJson(`data/${fn1}-externalids.sql`);
			PropertiesController.compareObjects(svfExtIds, sqlExtIds, `${fn1} svf-sql externalids`, null);
			const svf2ExtIds: any = await this.loadJson(`data/${fn2}-externalids.svf2`);
			//PropertiesController.compareObjects(svfExtIds, svf2ExtIds, `${fn1} svf-svf2 externalids`, null); // expected to fail
			const svfList: string[] = Object.values(svfExtIds.data.collection).sort() as string[];
			const svf2List: string[] = Object.values(svf2ExtIds.data.collection).sort() as string[];
			PropertiesController.compareObjects(svfList, svf2List, `${fn1} svf-svf2 externalids`, null);

			const svfIds: any = await this.loadJson(`data/${fn1}-ids.svf`);
			const sqlIds: any = await this.loadJson(`data/${fn1}-ids.sql`);
			PropertiesController.compareObjects(svfIds, sqlIds, `${fn1} svf-sql ids`, null);
			//const svf2Ids: any = await this.loadJson(`data/${fn2}-ids.svf2`);
			//PropertiesController.compareObjects(svfIds, svf2Ids, `${fn1} svf-svf2 ids`, null); // expected to fail

			const svfIdsRange: any = await this.loadJson(`data/${fn1}-ids-range.svf`);
			const sqlIdsRange: any = await this.loadJson(`data/${fn1}-ids-range.sql`);
			PropertiesController.compareObjects(svfIdsRange, sqlIdsRange, `${fn1} svf-sql ids range`, null);
			//const svf2IdsRange: any = await this.loadJson(`data/${fn2}-ids-range.svf2`);
			//PropertiesController.compareObjects(svfIdsRange, svf2IdsRange, `${fn1} svf-svf2 ids range`, null); // expected to fail

			const svfTree: any = await this.loadJson(`./data/${fn1}-tree.svf`);
			const sqlTree: any = await this.loadJson(`./data/${fn1}-tree.sql`);
			PropertiesController.compareObjects(svfTree, sqlTree, `${fn1} svf-sql tree`, PropertiesController.sortByObjectID);
			// const svf2Tree: any = await this.loadJson(`./data/${fn2}-tree.svf2`);
			// PropertiesController.compareObjects(svfTree, svf2Tree, `${fn1} svf-svf2 tree`, PropertiesController.sortByObjectID); // expected to fail
			let svf2TreeText: string = (await this.loadFile(`./data/${fn2}-tree.svf2`)).toString('utf8');
			const regex: RegExp = new RegExp(`"${fn2}"`, 'g');
			svf2TreeText = svf2TreeText.replace(regex, `"${fn1}"`);
			const svf2Tree: any = JSON.parse(svf2TreeText);
			const idMapping: any = await this.svf2_svfTosvf2_mapping(null, fn2, true); // { svf2ID: svfID }
			let node: any = svf2Tree.data.objects[0];
			const traverseSvf2TreeNodes = (elt: any): void => {
				elt.objectid = idMapping[elt.objectid];
				if (elt.objects && elt.objects.length)
					elt.objects.map((subelt: any): void => traverseSvf2TreeNodes(subelt));
			};
			traverseSvf2TreeNodes(node);
			node = svfTree.data.objects[0];
			const renameNodeName = (name: any): string => {
				let regex = new RegExp('^(.*)[:#]\\d+$');
				const r = name.match(regex);
				if (r !== null)
					return (r[1]);
				return (name);
			};
			const traverseSvfNodes = (elt: any): void => {
				if (elt.name)
					elt.name = renameNodeName(elt.name);
				if (elt.objects && elt.objects.length)
					elt.objects.map((subelt: any): void => traverseSvfNodes(subelt));
			};
			traverseSvfNodes(node);
			JsonDiff.sortObjectProperties(svf2Tree, [PropertiesController.sortByObjectID]); // Sort again since we changed objectIDs
			await this.saveJson(`./data/${fn1}-tree.svf.remapped`, svfTree);
			await this.saveJson(`./data/${fn2}-tree.svf2.remapped`, svf2Tree);
			PropertiesController.compareObjectsWithSVF2(svfTree, svf2Tree, `${fn1} svf-svf2 tree`, PropertiesController.sortByObjectID);

			const svfProperties: any = await this.loadJson(`./data/${fn1}-properties.svf`);
			const sqlProperties: any = await this.loadJson(`./data/${fn1}-properties.sql`);
			PropertiesController.compareObjects(svfProperties, sqlProperties, `${fn1} svf-sql properties`, PropertiesController.sortByObjectID);
			//const svf2Properties: any = await this.loadJson(`./data/${fn2}-properties.svf2`);
			//PropertiesController.compareObjects(svfProperties, svf2Properties, `${fn1} svf-svf2 properties`, PropertiesController.sortByObjectID); // expected to fail
			let svf2PropertiesText: string = (await this.loadFile(`./data/${fn2}-properties.svf2`)).toString('utf8');
			svf2PropertiesText = svf2PropertiesText.replace(regex, `"${fn1}"`);
			const svf2Properties: any = JSON.parse(svf2PropertiesText);
			svf2Properties.data.collection.map((elt: any): void => elt.objectid = idMapping[elt.objectid]);
			const iterateSvfNodes = (elt: any): void => {
				if (elt.name)
					elt.name = renameNodeName(elt.name);
				if (elt.Name)
					elt.Name = renameNodeName(elt.Name);
				if (elt.NAME)
					elt.NAME = renameNodeName(elt.NAME);
				if (elt.GUID)
					delete elt.GUID;
				if (elt.properties)
					Object.keys(elt.properties).map((category: any): void =>
						//Object.keys(elt.properties[category]).map((prop: any): void =>
						//	iterateSvfNodes(elt.properties[category][prop])));
						iterateSvfNodes(elt.properties[category]));
			};
			svfProperties.data.collection.map((elt: any): void => iterateSvfNodes(elt));
			JsonDiff.sortObjectProperties(svf2Properties, [PropertiesController.sortKey]); // Sort again since we changed objectIDs
			await this.saveJson(`./data/${fn1}-properties.svf.remapped`, svfProperties);
			await this.saveJson(`./data/${fn2}-properties.svf2.remapped`, svf2Properties);
			PropertiesController.compareObjectsWithSVF2(svfProperties, svf2Properties, `${fn1} svf-svf2 properties`, PropertiesController.sortByObjectID);

			//await this.changeReferences(fn2, fn1, [`${fn2}-properties2.svf2`, `${fn2}-properties3.svf2`, `${fn2}-properties.svf2`]);
		} catch (ex) {
			console.error(ex);
		}
	}

	public async check2(args?: string[]): Promise<void> {
		if (args.length < 1 || !urns.hasOwnProperty(args[0]))
			return (this.help(args));
		try {
			const fn2: string = args[0]; // Model translated with SVF2
			const defaultGUID2: string = urns[fn2].guids[0];

			const svfLoad = await this.loadJson(`data/${fn2}-load.svf`);
			const sqlLoad = await this.loadJson(`data/${fn2}-load.sql`);
			const svf2Load = await this.loadJson(`data/${fn2}-load.svf2`);
			PropertiesController.console(
				svfLoad.data.maxId === sqlLoad.data.maxId && svfLoad.data.maxId === svf2Load.data.maxId,
				`${fn2} number of entries`
			);

			const svfExtIds: any = await this.loadJson(`data/${fn2}-externalids.svf`);
			const sqlExtIds: any = await this.loadJson(`data/${fn2}-externalids.sql`);
			PropertiesController.compareObjects(svfExtIds, sqlExtIds, `${fn2} svf-sql externalids`, null);
			const svf2ExtIds: any = await this.loadJson(`data/${fn2}-externalids.svf2`);
			//PropertiesController.compareObjects(svfExtIds, svf2ExtIds, `${fn2} svf-svf2 externalids`, null); // expected to fail
			const svfList: string[] = Object.values(svfExtIds.data.collection).sort() as string[];
			const svf2List: string[] = Object.values(svf2ExtIds.data.collection).sort() as string[];
			PropertiesController.compareObjects(svfList, svf2List, `${fn2} svf-svf2 externalids`, null);

			const svfIds: any = await this.loadJson(`data/${fn2}-ids.svf`);
			const sqlIds: any = await this.loadJson(`data/${fn2}-ids.sql`);
			PropertiesController.compareObjects(svfIds, sqlIds, `${fn2} svf-sql ids`, null);
			//const svf2Ids: any = await this.loadJson(`data/${fn2}-ids.svf2`);
			//PropertiesController.compareObjects(svfIds, svf2Ids, `${fn2} svf-svf2 ids`, null); // expected to fail

			const svfIdsRange: any = await this.loadJson(`data/${fn2}-ids-range.svf`);
			const sqlIdsRange: any = await this.loadJson(`data/${fn2}-ids-range.sql`);
			PropertiesController.compareObjects(svfIdsRange, sqlIdsRange, `${fn2} svf-sql ids range`, null);
			//const svf2IdsRange: any = await this.loadJson(`data/${fn2}-ids-range.svf2`);
			//PropertiesController.compareObjects(svfIdsRange, svf2IdsRange, `${fn2} svf-svf2 ids range`, null); // expected to fail

			let svfTree: any = await this.loadJson(`./data/${fn2}-tree.svf`);
			const sqlTree: any = await this.loadJson(`./data/${fn2}-tree.sql`);
			PropertiesController.compareObjects(svfTree, sqlTree, `${fn2} svf-sql tree`, PropertiesController.sortByObjectID);
			const svf2Tree: any = await this.loadJson(`./data/${fn2}-tree.svf2`);
			//PropertiesController.compareObjects(svfTree, svf2Tree, `${fn2} svf-svf2 tree`, PropertiesController.sortByObjectID); // expected to fail
			const idMapping: any = await this.svf2_svfTosvf2_mapping(null, fn2, true); // { svf2ID: svfID }
			let node: any = svf2Tree.data.objects[0];
			const traverseSvf2TreeNodes = (elt: any): void => {
				elt.objectid = idMapping[elt.objectid];
				if (elt.objects && elt.objects.length)
					elt.objects.map((subelt: any): void => traverseSvf2TreeNodes(subelt));
			};
			traverseSvf2TreeNodes(node);
			node = svfTree.data.objects[0];
			const renameNodeName = (name: any): string => {
				let regex = new RegExp('^(.*)[:#]\\d+$');
				const r = name.match(regex);
				if (r !== null)
					return (r[1]);
				return (name);
			};
			const traverseSvfNodes = (elt: any): void => {
				if (elt.name)
					elt.name = renameNodeName(elt.name);
				if (elt.objects && elt.objects.length)
					elt.objects.map((subelt: any): void => traverseSvfNodes(subelt));
			};
			traverseSvfNodes(node);
			JsonDiff.sortObjectProperties(svf2Tree, [PropertiesController.sortByObjectID]); // Sort again since we changed objectIDs
			await this.saveJson(`./data/${fn2}-tree.svf.remapped`, svfTree);
			await this.saveJson(`./data/${fn2}-tree.svf2.remapped`, svf2Tree);
			PropertiesController.compareObjectsWithSVF2(svfTree, svf2Tree, `${fn2} svf-svf2 tree`, PropertiesController.sortByObjectID);

			let svfProperties: any = await this.loadJson(`./data/${fn2}-properties.svf`);
			const sqlProperties: any = await this.loadJson(`./data/${fn2}-properties.sql`);
			PropertiesController.compareObjects(svfProperties, sqlProperties, `${fn2} svf-sql properties`, PropertiesController.sortByObjectID);
			const svf2Properties: any = await this.loadJson(`./data/${fn2}-properties.svf2`);
			//PropertiesController.compareObjects(svfProperties, svf2Properties, `${fn2} svf-svf2 properties`, PropertiesController.sortByObjectID); // expected to fail
			svf2Properties.data.collection.map((elt: any): void => elt.objectid = idMapping[elt.objectid]);
			const iterateSvf2Nodes = (elt: any): void => {
				if (elt.GLOBALID && Array.isArray(elt.GLOBALID))
					elt.GLOBALID = elt.GLOBALID.sort();
				if (elt.properties)
					Object.keys(elt.properties).map((category: any): void =>
						//Object.keys(elt.properties[category]).map((prop: any): void =>
						//	iterateSvfNodes(elt.properties[category][prop])));
						iterateSvf2Nodes(elt.properties[category]));
			};
			svf2Properties.data.collection.map((elt: any): void => iterateSvf2Nodes(elt));
			const iterateSvfNodes = (elt: any): void => {
				if (elt.name)
					elt.name = renameNodeName(elt.name);
				if (elt.Name)
					elt.Name = renameNodeName(elt.Name);
				if (elt.NAME)
					elt.NAME = renameNodeName(elt.NAME);
				if (elt.GUID)
					delete elt.GUID;
				if (elt.GLOBALID && Array.isArray(elt.GLOBALID))
					elt.GLOBALID = elt.GLOBALID.sort();
				if (elt.properties)
					Object.keys(elt.properties).map((category: any): void =>
						//Object.keys(elt.properties[category]).map((prop: any): void =>
						//	iterateSvfNodes(elt.properties[category][prop])));
						iterateSvfNodes(elt.properties[category]));
			};
			svfProperties.data.collection.map((elt: any): void => iterateSvfNodes(elt));
			JsonDiff.sortObjectProperties(svf2Properties, [PropertiesController.sortKey]); // Sort again since we changed objectIDs
			await this.saveJson(`./data/${fn2}-properties.svf.remapped`, svfProperties);
			await this.saveJson(`./data/${fn2}-properties.svf2.remapped`, svf2Properties);
			let different: JsonDiff = PropertiesController.compareObjectsWithSVF2(svfProperties, svf2Properties, `${fn2} svf-svf2 properties`, PropertiesController.sortByObjectID, false);
			if (!different.areEquals)
				await this.accepOrRejectChanges(different, `./data/${fn2}-properties-svf-sv2.diff`, `${fn2} svf-svf2 properties differences`, false);

			// Now compare with Forge
			svfTree = await this.loadJson(`./data/${fn2}-tree.svf`);
			const forgeTree: any = await this.loadJson(`./data/${fn2}-tree.forge`);
			different = PropertiesController.compareObjectsWithSVF2(svfTree, forgeTree, `${fn2} svf-forge tree`, PropertiesController.sortByObjectID, false);
			if (!different.areEquals)
				await this.accepOrRejectChanges(different, `./data/${fn2}-tree-svf-forge.diff`, `${fn2} svf-forge tree differences`, false);


			svfProperties = await this.loadJson(`./data/${fn2}-properties.svf`);
			const forgeProperties: any = await this.loadJson(`./data/${fn2}-properties.forge`);
			different = PropertiesController.compareObjectsWithSVF2(svfProperties, forgeProperties, `${fn2} svf-forge properties`, PropertiesController.sortByObjectID, false);
			if (!different.areEquals)
				await this.accepOrRejectChanges(different, `./data/${fn2}-properties-svf-forge.diff`, `${fn2} svf-forge properties differences`, false);

		} catch (ex) {
			console.error(ex);
		}
	}

	public async test(args?: string[]): Promise<void> {
		let result: any = null;
		const fn1 = args[0];
		const fn2 = args[1];
		const def1: any = urns[args[0]];
		const def2: any = urns[args[1]];

		//await this.xxx_delete('svf2', fn2);

		//await this.xxx_getPropertiesRange('svf', fn1, [2], false);
		//await this.xxx_getPropertiesRange('svf', fn2, [2], false);
		//await this.xxx_getPropertiesRange('sql', fn1, [2], false);
		//await this.xxx_getPropertiesRange('sql', fn2, [2], false);
		//await this.xxx_getPropertiesRange('svf2', fn2, [2], false);

		//await this.xxx_load('svf', fn2);
		//const result: any = await this.xxx_getTree('svf', fn2);
		//await this.xxx_getPropertiesRange('sql', fn1, [3145], false);

		// await this.xxx_delete('svf2', fn1);
		// await this.xxx_getTree('svf2', fn1);
		// const t: any = await this.xxx_getPropertiesRange('sql', fn1, [2828], true);
		// console.log (JSON.stringify(t, null, 4));
		//await this.xxx_getTree('sql', fn1);

		console.log('\x1b[36m%s\x1b[0m', 'I am cyan');  //cyan
		console.log('\x1b[31m%s\x1b[0m', 'stringToMakeYellow');  //yellow

		// Reset = "\x1b[0m"
		// Bright = "\x1b[1m"
		// Dim = "\x1b[2m"
		// Underscore = "\x1b[4m"
		// Blink = "\x1b[5m"
		// Reverse = "\x1b[7m"
		// Hidden = "\x1b[8m"

		// FgBlack = "\x1b[30m"
		// FgRed = "\x1b[31m"
		// FgGreen = "\x1b[32m"
		// FgYellow = "\x1b[33m"
		// FgBlue = "\x1b[34m"
		// FgMagenta = "\x1b[35m"
		// FgCyan = "\x1b[36m"
		// FgWhite = "\x1b[37m"

		// BgBlack = "\x1b[40m"
		// BgRed = "\x1b[41m"
		// BgGreen = "\x1b[42m"
		// BgYellow = "\x1b[43m"
		// BgBlue = "\x1b[44m"
		// BgMagenta = "\x1b[45m"
		// BgCyan = "\x1b[46m"
		// BgWhite = "\x1b[47m"

		console.log(result);
		console.log(JSON.stringify(result, null, 4));
	}

	public async clean(args?: string[]): Promise<void> {
		try {
			const dirPath: string = PropertiesController.resolvePath('./data');
			let files: string[] = await _fsReadDir(dirPath);

			const ls: string[] = [...args];
			files = files.filter((fn: string): boolean =>
				ls.map((sample: string): boolean =>
					fn.indexOf(sample) === 0
				).reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator || currentValue, false)
			);
			const jobs: Promise<void>[] = files.map((fn: string): Promise<void> => _fsUnlink(PropertiesController.resolvePath(`./data/${fn}`)));
			await Promise.all(jobs);
			//console.log(JSON.stringify(files.sort(), null, 4));
		} catch (ex) { }
	}

	public async all(args?: string[]): Promise<void> {
		const self = this;
		try {
			const ls: string[] = [...args];
			const jobs: Promise<void>[] = ls.map(async (fn: string): Promise<void> => {
				if (!urns.hasOwnProperty(fn)) {
					console.error(`Unknown entry ${fn}`);
					return (Promise.resolve());
				}
				const forgeType: string = urns[fn].type;
				const subjobs: Promise<void>[] = [
					self.forge([fn]),
					self.svf([fn]),
					self.sql([fn]),
				];
				if (forgeType === 'svf2')
					subjobs.push(self.svf2([fn]));
				await Promise.all(subjobs);
				return (Promise.resolve());
			});

			// const jobs: Promise<void>[] = files.map((fn: string): Promise<void> => _fsUnlink(PropertiesController.resolvePath(`./data/${fn}`)));
			await Promise.all(jobs);
			//console.log(JSON.stringify(files.sort(), null, 4));
		} catch (ex) {
			console.error(ex);
		}
	}

	// Utils

	protected static resolvePath(ref: string): string {
		let result: string = _path.resolve(__dirname, ref);
		result = result.replace('/bin/', '/src/');
		return (result);
	}

	protected async loadFile(ref: any): Promise<Buffer> {
		try {
			const buffer: Buffer = await _fsReadFile(PropertiesController.resolvePath(ref));
			return (buffer);
		} catch (ex) { }
		return (null);
	}

	protected async saveFile(ref: any, buffer: Buffer): Promise<void> {
		try {
			await _fsWriteFile(PropertiesController.resolvePath(ref), buffer);
		} catch (ex) { }
	}

	protected async loadJson(ref: any): Promise<any> {
		try {
			const buffer: Buffer = await _fsReadFile(PropertiesController.resolvePath(ref));
			return (JSON.parse(buffer.toString('utf8')));
		} catch (ex) { }
		return (null);
	}

	protected async saveJson(ref: any, obj: any): Promise<void> {
		try {
			await _fsWriteFile(PropertiesController.resolvePath(ref), Buffer.from(JSON.stringify(obj, null, 4)));
		} catch (ex) { }
	}

	protected static makeRequestURL(uri: string): string {
		return (`http://localhost:${process.env.PORT}${uri}`);
	}

	protected static compareObjects(lhs: any, rhs: any, message: string = '', key?: string, bConsole: boolean = true): boolean {
		//JsonDiff.sortObjectProperties(lhs);
		//JsonDiff.sortObjectProperties(rhs);
		const cmp: JsonDiff = new JsonDiff(lhs, rhs, key ? [key] : undefined);
		if (cmp.areEquals) {
			PropertiesController.console(true, `${message}`);
		} else {
			if (bConsole)
				PropertiesController.console(false, `${message}\n${cmp.toString(4)}\n`);
			else
				PropertiesController.console(false, `${message} different`);
		}
		return (cmp.areEquals);
	}

	protected static compareObjectsWithSVF2(lhs: any, rhs: any, message: string = '', key?: string, bConsole: boolean = true): JsonDiff {
		//JsonDiff.sortObjectProperties(lhs);
		//JsonDiff.sortObjectProperties(rhs);
		const compareNames = (lhs_name: string, rhs_name: string): number => {
			if (lhs_name.length === rhs_name.length)
				return (lhs_name.localeCompare(rhs_name));
			const len: number = rhs_name.length;
			let lhs_sub: string = lhs_name.substring(0, len);
			if (lhs_sub !== rhs_name)
				return (lhs_sub.localeCompare(rhs_name));
			lhs_sub = lhs_name.substring(len);
			let regex = new RegExp(':\\d+');
			if (regex.test(lhs_sub))
				return (0);
			regex = new RegExp('#\\d+');
			if (rhs_name === '' && regex.test(lhs_sub))
				return (0);
			return (1);
		};
		const cmp: JsonDiff = new JsonDiff(
			lhs, rhs,
			key ? [key] : undefined,
			{ name: compareNames, Name: compareNames, NAME: compareNames }
		);
		if (cmp.areEquals) {
			PropertiesController.console(true, `${message}`);
		} else {
			if (bConsole)
				PropertiesController.console(false, `${message} ${cmp.toString(4)}\n`);
			else
				PropertiesController.console(false, `${message} different`);
		}
		return (cmp);
	}

	protected async compareMethods(model: string, what: string, lformat: string, lhs: any, rformat: string, rhs: any, key?: string): Promise<boolean> {
		const fn: string = `./data/${model}-${what}.${lformat}-${rformat}`;
		let diff: any = await this.loadJson(fn);

		const cmp: JsonDiff = new JsonDiff(lhs, rhs, key ? [key] : undefined);
		if (cmp.areEquals || (diff && JSON.stringify(diff) === cmp.toString())) {
			PropertiesController.console(true, `${model} ${what} (${lformat}-${rformat})`);
		} else {
			PropertiesController.console(true, `${model} ${what} (${lformat}-${rformat}) created!`);
			PropertiesController.console(false, `${model} ${what} (${lformat}-${rformat})\n${cmp.toString(4)}\n`);
			await this.saveFile(fn, Buffer.from(cmp.toString(4)));
		}
		return (cmp.areEquals);
	}

	protected async changeReferences(from: string, to: string, files: string[]): Promise<void> {
		let jobs: Promise<void>[] = files.map(async (file: string): Promise<void> => {
			let fn: string = `./data/${file}`;
			const content: Buffer = await this.loadFile(fn);
			let text: string = content.toString('utf8');
			var re = new RegExp(from, 'g');
			text = text.replace(re, to);
			fn = `./data/${file}.ref`;
			await this.saveFile(fn, Buffer.from(text));
		});
		await Promise.all(jobs);
	}

	protected async accepOrRejectChanges(different: JsonDiff, diffFilename: string, message: string = '', bConsole: boolean = true): Promise<boolean> {
		let diff: any = await this.loadJson(diffFilename);
		if (different.areEquals || (diff && JSON.stringify(diff) === different.toString())) {
			PropertiesController.console(true, `${message} accepted`);
		} else {
			PropertiesController.console(false, `${message} rejected!`);
			if (bConsole)
				PropertiesController.console(false, `${different.toString(4)}\n`);
			await this.saveFile(diffFilename, Buffer.from(different.toString(4)));
		}
		return (different.areEquals);
	}

	protected static console(isOk: boolean, message: string = '') {
		if (!isOk)
			console.warn(chalk`{red ✗ ${message}}`);
		else
			console.info(chalk`{green ✓ ${message}}`);
	}

}

const run = async (fctName: string, args?: string[]) => {
	const controller: PropertiesController = new PropertiesController();
	const fct = (controller as any)[fctName || 'help'];
	if (fct)
		await (fct.bind(controller))(args);
	else
		await controller.help(args);

	process.exit(0);
};

if (process.argv.length < 3)
	run('help');
else
	run(process.argv[2], process.argv.slice(3));
