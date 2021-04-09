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
import * as rimraf from 'rimraf';
import { dir } from 'console';

const _fsExists = _util.promisify(_fs.exists);
const _fsUnlink = _util.promisify(_fs.unlink);
const _fsReadFile = _util.promisify(_fs.readFile);
const _fsWriteFile = _util.promisify(_fs.writeFile);
const _fsReadDir = _util.promisify(_fs.readdir);
const _rimraf = _util.promisify(rimraf);

// oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
const urns: any = {
	'Model.ifc': { // svf only (3d)
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTW9kZWwuaWZj', // Model.ifc
		guids: {
			'3d': [
				'87a2f6e1-9a1f-434f-acfb-6bcaeace1c3d',
			],
		},
		type: 'svf',
	},
	'Model2.ifc': { // svf2 (3d)
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTW9kZWwyLmlmYw', // Model2.ifc
		guids: {
			'3d': [
				'8fc795ac-7438-46c4-95e5-8b8fd74d33cb',
			],
		},
		type: 'svf2',
	},
	'Master - Plant3D.dwg': { // svf2 (3d and 2d)
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTWFzdGVyJTIwLSUyMFBsYW50M0QuZHdn', // Master - Plant3D.dwg
		guids: {
			'3d': [
				'e30bd031-d13a-a976-9153-78100829986a', // 3d
			],
			'2d': [
				'62036a98-bd5b-ac36-061f-4a442416cb93', // 2d
			],
		},
		type: 'svf2',
	},
	'ASSM.f3d': { // svf2 (3d) ASSM.996d7bd3-c6d8-43d9-9926-6cdfaed1870c.f3d
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvQVNTTS45OTZkN2JkMy1jNmQ4LTQzZDktOTkyNi02Y2RmYWVkMTg3MGMuZjNk',
		guids: {
			'3d': [
				'f0cc4235-47a0-4df7-aa74-4aff72062432',
			],
		},
		type: 'svf2',
	},
	'ACM-LRT-N-Master-Autodesk.nwd': { // svf2 (3d)
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvQUNNLUxSVC1OLU1hc3Rlci1BdXRvZGVzay5ud2Q', // ACM-LRT-N-Master-Autodesk.nwd
		guids: {
			'3d': [
				'662ce6e5-aed0-44f6-99cb-94c7f0f0e97e',
			],
		},
		type: 'svf2',
	},
	'P9_MachineShop_Final.rvt': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvUDlfTWFjaGluZVNob3BfRmluYWwucnZ0', // P9_MachineShop_Final.rvt
		guids: {
			'3d': [
				'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf', type: 'resource'
			],
			'2d': [
				'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
				'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
			],
		},
		type: 'svf',
	},
	'P9_MachineShop_Final-2.rvt': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvUDlfTWFjaGluZVNob3BfRmluYWwtMi5ydnQ', // P9_MachineShop_Final-2.rvt
		guids: {
			'3d': [
				'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf2', type: 'resource'
			],
			'2d': [
				'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
				'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
			],
		},
		type: 'svf2',
	},
	'rac_basic_sample_project.rvt': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvcmFjX2Jhc2ljX3NhbXBsZV9wcm9qZWN0LnJ2dA',
		guids: {
			'3d': [
				'6bfb4886-f2ee-9ccb-8db0-c5c170220c40', // 3d
			],
			'2d': [
				'abdacd31-f94c-e84f-9a58-4663e281d894',
				'8be5a450-c03d-fcb2-6125-08d5baf4b9d9',
				'10f26e65-bbca-7a68-125e-749e559c1e3b',
				'db90b95d-0265-5fe4-376a-4dd3386c3d7d',
				'1fd6b2ec-267d-8ba3-6b00-abe1adf80994',
				'97e8b569-a295-8750-f788-2d5067608b9c',
			],
		},
		type: 'svf',
	},
	'4017-Forge.rvt.zip': {
		urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6NDAxNy1mb3JnZS80MDE3LUZvcmdlLnJ2dC56aXA',
		guids: {
			'3d': [
				'f4df1229-8738-2817-c082-60b701da5ef0',
			],
		},
		type: 'svf2',
	},


	// '1403_V1.dwfx': { // svf2 (3d and 2d) 1403_V1_2018-03-14_04-32-00pm.dwfx (multi DB) but testing as svf for now (svf2 bug)
	// 	urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvMTQwM19WMV8yMDE4LTAzLTE0XzA0LTMyLTAwcG0uZHdmeA',
	// 	guids: {
	// 		'3d': [
	// 			'a6128518-dcf0-967b-31a1-3439a375daeb',
	// 			'488e0550-6e79-38b3-9f56-ae8fd21416bb',
	// 		],
	// 		'2d': [
	// 			'beaab4e2-9abc-8ca2-4e65-23df60e4b6a7',
	// 			'439a5dce-43e2-17bb-d5e3-60c33bc0cc0d',
	// 			'd98802b2-1887-798c-e78b-0d11488ea602',
	// 			'2c2386ea-0f02-5ad5-49cf-8c19d8b0768b',
	// 			'737da12d-3f75-cf3a-a650-8c18557f1a11',
	// 			'b30334d5-b1c0-ca27-6038-bcbbd5540ed3',
	// 			'7203514b-58e3-5776-fcb7-6ee34f330c52',
	// 			'be4f7d3f-bf72-7169-2c73-274a594fb40a',
	// 			'0d2c7d59-0ac9-a47b-849f-6b30ee49574f',
	// 			'a81433d1-e3e7-97f8-17f2-e85c1bbc1f66',
	// 			'e7d88667-9f10-b63a-a6d6-9a8d5492b134',
	// 			'626a6596-a298-a883-1feb-b072ffdf4575',
	// 			'38f44bb4-6337-fb87-a6ec-caa62e1d97ff',
	// 			'80f0723f-92ff-317d-7802-e99c3fddd4e8',
	// 			'a14bcaf0-056a-9f06-03c3-ed30317acc53',
	// 			'624c1fe4-dee7-49b0-fdee-ea2c9b5ff660',
	// 			'391da052-8c6f-af4e-5fe2-009fccc70c80',
	// 			'e91e3333-6510-abeb-714a-06dea8be33ff',
	// 		],
	// 	},
	// 	type: 'svf',
	// },
	// 'BadMonkeys.dwfx': { // svf2 (2d)
	// 	urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvQmFkTW9ua2V5cy5kd2Z4',
	// 	guids: {
	// 		'2d': [
	// 			'c745e431-cc5c-df39-f6ae-c744b63d33cb',
	// 			'044a5d42-12cb-356a-7521-4b5f68c3b04d',
	// 			'b6bff568-b730-ee0f-9049-7d57514ec76b'
	// 		],
	// 	},
	// 	type: 'svf2',
	// },

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
		console.log('  checks <model> - checks outputs from SVF/SQL/SVF2');
		console.log('  clean <model> [<model> ...] - delete all data files');
		console.log('  deldb <model> [<model> ...] - delete all database files');
		console.log('  all <model> [<model> ...] - run forge/svf/sql/svv2 commands for these models');
		console.log(' ');
		await PropertiesController.sleep(0);
	}

	public async list(index: string = ''): Promise<void> {
		console.log('models: ', Object.keys(urns));
	}

	public async forge_getProperties(model: string, guid: string): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/forge/${def.urn}/metadata/${guid}/properties`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-properties.forge`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortKey]);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} forge-properties created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} forge-properties`, PropertiesController.sortKey, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body.data.collection);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} forge-properties error!`);
			return (null);
		}
	}

	public async forge_getPropertiesRange(model: string, guid: string, dbids: number[]): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const jobs: Promise<any>[] = dbids.map((dbid: number): Promise<any> => {
				const url: string = `/forge/${def.urn}/metadata/${guid}/properties?objectid=${dbid}`;
				const job: any = superagent('GET', PropertiesController.makeRequestURL(url));
				return (job);
			});
			const results: any[] = await Promise.all(jobs);
			// const results: any[] = new Array(jobs.length);
			// for (let i = 0; i < jobs.length; i++) {
			// 	try {
			// 		results.push(await jobs[i]);
			// 	} catch (ex) {
			// 		PropertiesController.console(false, `forge_getPropertiesRange(${dbids[i]}) ${i} ${ex.status} ${ex.message}`);
			// 	}
			// }

			const result: any = results[0].body;
			for (let i = 1; i < results.length; i++)
				result.data.collection.push(results[i].body.data.collection[0]);

			const fn: string = `./data/${model}-${guid}-properties-range.forge`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result, [PropertiesController.sortKey]);
			if (!json) {
				await PropertiesController.saveJson(fn, result);
				PropertiesController.console(true, `${model} ${guid} forge-properties-range created!`);
			} else {
				if (!PropertiesController.compareObjects(result, json, `${model} ${guid} forge-properties-range`, PropertiesController.sortKey, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.data.collection);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} forge-properties-range error!`);
			return (null);
		}
	}

	public async forge_getTree(model: string, guid: string): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/forge/${def.urn}/metadata/${guid}`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-tree.forge`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortByObjectID]);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} forge-tree created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} forge-tree`, PropertiesController.sortByObjectID, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body.data.objects);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} forge-tree error!`);
			return (null);
		}
	}

	public async xxx_load(method: string, model: string, guid: string): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/${method}/${def.urn}/metadata/load?guid=${guid}`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-load.${method}`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} ${method} load created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} ${method} load`))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} ${method} load error!`);
			return (null);
		}
	}

	public async xxx_delete(method: string, model: string, guid: string): Promise<void> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/${method}/${def.urn}/metadata/delete?guid=${guid}`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} ${method} delete error!`);
		}
	}

	public async xxx_getExternalIds(method: string, model: string, guid: string): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/${method}/${def.urn}/metadata/externalids?guid=${guid}`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-externalids.${method}`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} ${method} externalids created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} ${method} externalids`, undefined, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body.data.collection);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} ${method} externalids error!`);
			return (null);
		}
	}

	public async xxx_getObjIds(method: string, model: string, guid: string): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/${method}/${def.urn}/metadata/ids?guid=${guid}`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-ids.${method}`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} ${method} ids created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} ${method} ids`, undefined, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body.data.collection);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} ${method} ids error!`);
			return (null);
		}
	}

	public async xxx_getIdsRange(method: string, model: string, guid: string, extIds: string[]): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const bs: boolean[] = extIds.map((elt: string): boolean => elt.indexOf(',') === -1);
			const found: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator || currentValue, false);
			const sep: string = found ? '^' : ',';

			extIds = extIds.map((elt: string): string => encodeURIComponent(elt));
			const url: string = `/${method}/${def.urn}/metadata/ids?guid=${guid}&ids=${extIds.join(sep)}&sep=${sep}`;

			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-ids-range.${method}`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} ${method} ids range created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} ${method} ids range`, undefined, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body.data.collection);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} ${method} ids range error!`);
			return (null);
		}
	}

	public async xxx_GetProperties(method: string, model: string, guid: string): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/${method}/${def.urn}/metadata/properties?guid=${guid}`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-properties.${method}`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortKey]);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} ${method} properties created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} ${method} properties`, PropertiesController.sortKey, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body.data.collection);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} ${method} properties error!`);
			return (null);
		}
	}

	public async xxx_getPropertiesRange(method: string, model: string, guid: string, dbids: number[], keepInternals: boolean): Promise<any> {
		const num: string = keepInternals ? '-internals' : '-range';
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/${method}/${def.urn}/metadata/properties?guid=${guid}&ids=${encodeURIComponent(dbids.join(','))}&keephiddens=${keepInternals.toString()}&keepinternals=${keepInternals.toString()}`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-properties${num}.${method}`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortKey]);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} ${method} properties${num} created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} ${method} properties${num}`, PropertiesController.sortKey, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body.data.collection);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} ${method} properties${num} error!`);
			return (null);
		}
	}

	public async xxx_getTree(method: string, model: string, guid: string): Promise<any> {
		try {
			const def: any = urns[model];
			guid = guid || this.defaultGuid(def);
			const url: string = `/${method}/${def.urn}/metadata?guid=${guid}`;
			let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
			const fn: string = `./data/${model}-${guid}-tree.${method}`;
			let json: any = await PropertiesController.loadJson(fn);
			JsonDiff.sortObjectProperties(result.body, [PropertiesController.sortByObjectID]);
			if (!json) {
				await PropertiesController.saveJson(fn, result.body);
				PropertiesController.console(true, `${model} ${guid} ${method} tree created!`);
			} else {
				if (!PropertiesController.compareObjects(result.body, json, `${model} ${guid} ${method} tree`, PropertiesController.sortByObjectID, false))
					await PropertiesController.saveJson(`${fn}.tmp`, result.body);
			}
			return (result.body.data.objects);
		} catch (ex) {
			PropertiesController.console(false, `${model} ${guid} ${method} tree error!`);
			return (null);
		}
	}

	protected guids(def: any, _3dOnly: boolean = false): string[] {
		let guids: string[] = [];
		def.guids['3d'] && (guids = def.guids['3d']);
		!_3dOnly && def.guids['2d'] && (guids = [...guids, ...def.guids['2d']]);
		return (guids);
	}

	protected defaultGuid(def: any): string {
		return (this.guids(def)[0]);
	}

	public async svf2_svfTosvf2_mapping(objIDs: number[], model: string, guid: string, reverse: boolean = true): Promise<number[]> {
		const def: any = urns[model];
		guid = guid || this.defaultGuid(def);
		let url: string = `/svf2/${def.urn}/metadata/svf-svf2?guid=${guid}&reverse=${reverse.toString()}`;
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
				const model: string = args[i]; // Model translated with SVF
				const def: any = urns[model];
				const guids: string[] = this.guids(def);
				for (let i = 0; i < guids.length; i++) {
					const guid: string = guids[i];
					console.log(`Using GUID ${guid}`);

					const forgeProps: any = await this.forge_getProperties(model, guid);
					const forgeTree: any = await this.forge_getTree(model, guid);

					// Get a meaningful range
					const range: number[] = forgeProps.slice(0, PropertiesController.rangeIDs).map((elt: any): string => elt.objectid);
					await this.forge_getPropertiesRange(model, guid, range);
				}
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
			if (!urns[fn1]) {
				PropertiesController.console(false, 'Unknown or incompatible file.');
				return;
			}
			const def: any = urns[fn1];
			const guids: string[] = this.guids(def);
			for (let i = 0; i < guids.length; i++) {
				const guid: string = guids[i];
				console.log(`Downloading ${fn1} .json.gz files, please wait...`);
				console.log(`Using GUID ${guid}`);
				await this.xxx_load('svf', fn1, guid);

				// Get all ExternalID and ObjectID and verify each lists
				const extids: any = await this.xxx_getExternalIds('svf', fn1, guid); // { svfID: externalID }
				const ids: any = await this.xxx_getObjIds('svf', fn1, guid); // { externalID: svfID }
				// data = {};
				// Object.values(ids).map((id: number, index: number): string => data[`${id}`] = Object.keys(ids)[index]);
				// JsonDiff.sortObjectProperties(data);
				// PropertiesController.compareObjects(extids, data, `${fn1} svf ExtId <-> ObjId`, undefined, false);
				this.compareIDs(extids, ids, `${fn1} ${guid} svf ExtId <-> ObjId`);

				// Get a meaningful range
				const extidsrange: string[] = Object.values(extids).sort().slice(0, PropertiesController.rangeIDs) as string[];
				const idsrange: any = await this.xxx_getIdsRange('svf', fn1, guid, extidsrange);
				let bs: boolean[] = Object.keys(idsrange).map((extId: string): boolean => ids[extId] && ids[extId] === idsrange[extId]);
				let equal: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
				PropertiesController.console(equal, `${fn1} ${guid} svf ObjID -> ExternalID -> ObjID conversion`);
				const range: number[] = Object.values(idsrange).sort() as number[]; // SVF IDs from sorted ExternalIDs

				// Check Properties
				//const forgeProps: any = await this.forge_getProperties(fn1, defaultGUID);
				const svfProps: any = await this.xxx_GetProperties('svf', fn1, guid);
				await this.xxx_getPropertiesRange('svf', fn1, guid, range, false);
				await this.xxx_getPropertiesRange('svf', fn1, guid, range, true);

				//const forgeTree: any = await this.forge_getTree(fn1, defaultGUID);
				const svfTree: any = await this.xxx_getTree('svf', fn1, guid);
				//break;
			}
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
			if (!urns[fn1]) {
				PropertiesController.console(false, 'Unknown or incompatible file.');
				return;
			}
			const def: any = urns[fn1];
			const guids: string[] = this.guids(def);
			for (let i = 0; i < guids.length; i++) {
				const guid: string = guids[i];
				console.log(`Downloading ${fn1} sqlite DB, please wait...`);
				console.log(`Using GUID ${guid}`);
				await this.xxx_load('sql', fn1, guid);

				// Get all ExternalID and ObjectID and verify each lists
				const extids: any = await this.xxx_getExternalIds('sql', fn1, guid); // { svfID: externalID }
				const ids: any = await this.xxx_getObjIds('sql', fn1, guid); // { externalID: svfID }
				// data = {};
				// Object.keys(ids).forEach((key: string): any => data[ids[key]] = key);
				// JsonDiff.sortObjectProperties(data);
				// PropertiesController.compareObjects(extids, data, `${fn1} sql ExtId <-> ObjId`, undefined, false);
				this.compareIDs(extids, ids, `${fn1} ${guid} sql ExtId <-> ObjId`);

				// Get a meaningful range
				const extidsrange: string[] = Object.values(extids).sort().slice(0, PropertiesController.rangeIDs) as string[];
				const idsrange: any = await this.xxx_getIdsRange('sql', fn1, guid, extidsrange);
				let bs: boolean[] = Object.keys(idsrange).map((extId: string): boolean => ids[extId] && ids[extId] === idsrange[extId]);
				let equal: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
				PropertiesController.console(equal, `${fn1} ${guid} sql ObjID -> ExternalID -> ObjID conversion`);
				const range: number[] = Object.values(idsrange).sort() as number[]; // SVF IDs from sorted ExternalIDs

				// Check Properties
				//const forgeProps: any = await this.forge_getProperties(fn1, defaultGUID);
				const sqlProps: any = await this.xxx_GetProperties('sql', fn1, guid);
				await this.xxx_getPropertiesRange('sql', fn1, guid, range, false);
				await this.xxx_getPropertiesRange('sql', fn1, guid, range, true);

				//const forgeTree: any = await this.forge_getTree(fn1, defaultGUID);
				const sqlTree: any = await this.xxx_getTree('sql', fn1, guid);
			}
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
			if (!urns[fn2] || urns[fn2].type !== 'svf2') {
				PropertiesController.console(false, 'Unknown or incompatible file.');
				return;
			}
			const def: any = urns[fn2];
			const guids: string[] = this.guids(def, true);
			for (let i = 0; i < guids.length; i++) {
				const guid: string = guids[i];
				console.log(`Downloading ${fn2} .json .idx .pack files, please wait...`);
				console.log(`Using GUID ${guid}`);
				if (await this.xxx_load('svf2', fn2, guid) === null)
					return (console.warn(' ==>> Not Found!'));

				// Get all ExternalID and ObjectID and verify each lists
				const extids: any = await this.xxx_getExternalIds('svf2', fn2, guid); // { svf2ID: externalID }
				const ids: any = await this.xxx_getObjIds('svf2', fn2, guid); // { externalID: svf2ID }
				// data = {};
				// Object.values(ids).map((id: number, index: number): string => data[`${id}`] = Object.keys(ids)[index]);
				// JsonDiff.sortObjectProperties(data);
				// PropertiesController.compareObjects(extids, data, `${fn2} svf2 ExtId <-> ObjId`, undefined, false);
				this.compareIDs(extids, ids, `${fn2} ${guid} svf2 ExtId <-> ObjId`);

				// Get a meaningful range
				const extidsrange: string[] = Object.values(extids).sort().slice(0, PropertiesController.rangeIDs) as string[];
				const idsrange: any = await this.xxx_getIdsRange('svf2', fn2, guid, extidsrange);
				let bs: boolean[] = Object.keys(idsrange).map((extId: string): boolean => ids[extId] && ids[extId] === idsrange[extId]);
				let equal: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
				PropertiesController.console(equal, `${fn2} ${guid} svf2 ObjID -> ExternalID -> ObjID conversion`);
				const range: number[] = Object.values(idsrange).sort() as number[]; // SVF2 IDs from sorted ExternalIDs

				// Check SVF2/SVF ID conversions (we assume range is SVF2 IDs)
				let svf2_svf_ids: any = await this.svf2_svfTosvf2_mapping(range, fn2, guid, true); // { svf2ID: svfID }
				let svf_svf2_ids: any = await this.svf2_svfTosvf2_mapping(Object.values(svf2_svf_ids), fn2, guid, false); // { svfID: svf2ID }
				bs = range.map((svf2ID: number): boolean => svf2_svf_ids[svf2ID] && svf2ID === svf_svf2_ids[svf2_svf_ids[svf2ID]]);
				equal = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
				PropertiesController.console(equal, `${fn2} ${guid} svf2 svf2 -> svf -> svf2 ID conversion`);

				// !!! careful, to be able to compare with SVF, we need to map IDs (which we just did above)

				// Check Properties
				//const forgeProps: any = await this.forge_getProperties(fn2, defaultGUID2);
				const svf2Props: any = await this.xxx_GetProperties('svf2', fn2, guid);
				await this.xxx_getPropertiesRange('svf2', fn2, guid, range, false);
				await this.xxx_getPropertiesRange('svf2', fn2, guid, range, true);

				//const forgeTree: any = await this.forge_getTree(fn2, defaultGUID2);
				const svf2Tree: any = await this.xxx_getTree('svf2', fn2, guid);
			}
		} catch (ex) {
			console.error(ex);
		}
	}

	public async checks(args?: string[]): Promise<void> {
		if (args.length < 1 || !urns.hasOwnProperty(args[0]))
			return (this.help(args));
		try {
			const fn2: string = args[0]; // Model translated with SVF2
			const def: any = urns[fn2];
			const guids: string[] = this.guids(def);
			const guids3d: string[] = this.guids(def, true);
			for (let i = 0; i < guids.length; i++) {
				const guid: string = guids[i];
				console.log(`Verifying ${fn2} using GUID ${guid}`);
				const hasSVF2: boolean = def.type === 'svf2' && guids3d.includes(guid);
				const idMapping: any = hasSVF2 && await this.svf2_svfTosvf2_mapping(null, fn2, guid, true); // { svf2ID: svfID }

				const svfLoad: any = await PropertiesController.loadJson(`data/${fn2}-${guid}-load.svf`);
				const sqlLoad: any = await PropertiesController.loadJson(`data/${fn2}-${guid}-load.sql`);
				const svf2Load: any = hasSVF2 && await PropertiesController.loadJson(`data/${fn2}-${guid}-load.svf2`);
				PropertiesController.console(
					svfLoad.data.maxId === sqlLoad.data.maxId && (!hasSVF2 || svfLoad.data.maxId === svf2Load.data.maxId),
					`${fn2} ${guid} number of entries`
				);

				const svfExtIds: any = await PropertiesController.loadJson(`data/${fn2}-${guid}-externalids.svf`);
				const sqlExtIds: any = await PropertiesController.loadJson(`data/${fn2}-${guid}-externalids.sql`);
				PropertiesController.compareObjects(svfExtIds, sqlExtIds, `${fn2} ${guid} svf-sql externalids`, undefined, false);
				const svf2ExtIds: any = hasSVF2 && await PropertiesController.loadJson(`data/${fn2}-${guid}-externalids.svf2`);
				//PropertiesController.compareObjects(svfExtIds, svf2ExtIds, `${fn2} svf-svf2 externalids`, null); // expected to fail
				const svfList: string[] = Object.values(svfExtIds.data.collection).sort() as string[];
				const svf2List: string[] = hasSVF2 && Object.values(svf2ExtIds.data.collection).sort() as string[];
				hasSVF2 && PropertiesController.compareObjects(svfList, svf2List, `${fn2} ${guid} svf-svf2 externalids`, undefined, false);
				//console.log(svfList.length, svf2List.length, svfList, svf2List);

				const svfIds: any = await PropertiesController.loadJson(`data/${fn2}-${guid}-ids.svf`);
				const sqlIds: any = await PropertiesController.loadJson(`data/${fn2}-${guid}-ids.sql`);
				PropertiesController.compareObjects(svfIds, sqlIds, `${fn2} ${guid} svf-sql ids`, undefined, false);
				//const svf2Ids: any = await this.loadJson(`data/${fn2}-ids.svf2`);
				//PropertiesController.compareObjects(svfIds, svf2Ids, `${fn2} svf-svf2 ids`, undefined, false); // expected to fail

				const svfIdsRange: any = await PropertiesController.loadJson(`data/${fn2}-${guid}-ids-range.svf`);
				const sqlIdsRange: any = await PropertiesController.loadJson(`data/${fn2}-${guid}-ids-range.sql`);
				PropertiesController.compareObjects(svfIdsRange, sqlIdsRange, `${fn2} ${guid} svf-sql ids range`, undefined, false);
				//const svf2IdsRange: any = await this.loadJson(`data/${fn2}-${guid}-ids-range.svf2`);
				//PropertiesController.compareObjects(svfIdsRange, svf2IdsRange, `${fn2} ${guid} svf-svf2 ids range`, undefined, false); // expected to fail

				let svfTree: any = await PropertiesController.loadJson(`./data/${fn2}-${guid}-tree.svf`);
				const sqlTree: any = hasSVF2 && await PropertiesController.loadJson(`./data/${fn2}-${guid}-tree.sql`);
				PropertiesController.compareObjects(svfTree, sqlTree, `${fn2} ${guid} svf-sql tree`, PropertiesController.sortByObjectID, false);
				const svf2Tree: any = hasSVF2 && await PropertiesController.loadJson(`./data/${fn2}-${guid}-tree.svf2`);
				//PropertiesController.compareObjects(svfTree, svf2Tree, `${fn2} ${guid} svf-svf2 tree`, PropertiesController.sortByObjectID, false); // expected to fail
				let node: any = hasSVF2 && svf2Tree.data.objects[0];
				const traverseSvf2TreeNodes = (elt: any): void => {
					elt.objectid = idMapping[elt.objectid];
					if (elt.objects && elt.objects.length)
						elt.objects.map((subelt: any): void => traverseSvf2TreeNodes(subelt));
				};
				hasSVF2 && traverseSvf2TreeNodes(node);
				node = svfTree.data.objects[0];
				const renameNodeName = (name: any): string => {
					let regex = new RegExp('^(.*)[:#]\\d+$');
					let r = name.match(regex);
					if (r !== null)
						return (r[1]);
					regex = new RegExp('^(.*) \\[.*\\]$');
					r = name.match(regex);
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
				hasSVF2 && traverseSvfNodes(node);
				hasSVF2 && JsonDiff.sortObjectProperties(svf2Tree, [PropertiesController.sortByObjectID]); // Sort again since we changed objectIDs
				hasSVF2 && svf2Tree.data.objects[0] && !svf2Tree.data.objects[0].objectid && (svf2Tree.data.objects[0].objectid = 0);
				hasSVF2 && await PropertiesController.saveJson(`./data/${fn2}-${guid}-tree.svf.remapped`, svfTree);
				hasSVF2 && await PropertiesController.saveJson(`./data/${fn2}-${guid}-tree.svf2.remapped`, svf2Tree);
				hasSVF2 && PropertiesController.compareObjectsWithSVF2(
					svfTree, svf2Tree, PropertiesController.sortByObjectID, `${fn2} ${guid} svf-svf2 tree`,
					`./data/${fn2}-${guid}-tree-svf-svf2.diff`,
					false
				);

				let svfPropertiesInternals: any = await PropertiesController.loadJson(`./data/${fn2}-${guid}-properties-internals.svf`);
				const sqlPropertiesInternals: any = await PropertiesController.loadJson(`./data/${fn2}-${guid}-properties-internals.sql`);
				PropertiesController.compareObjects(svfPropertiesInternals, sqlPropertiesInternals, `${fn2} ${guid} svf-sql internal properties`, PropertiesController.sortByObjectID, false);
				const svf2PropertiesInternals: any = hasSVF2 && await PropertiesController.loadJson(`./data/${fn2}-${guid}-properties-internals.svf2`);
				//PropertiesController.compareObjects(svfPropertiesInternals, svf2PropertiesInternals, `${fn2} ${guid} svf-svf2 internal properties`, PropertiesController.sortByObjectID, false); // expected to fail
				hasSVF2 && svf2PropertiesInternals.data.collection.map((elt: any): void => elt.objectid = idMapping[elt.objectid]);
				const iterateSvf2Nodes = (elt: any): void => {
					if (elt.GLOBALID && Array.isArray(elt.GLOBALID))
						elt.GLOBALID = elt.GLOBALID.sort();
					if (elt.parent)
						elt.parent = idMapping[elt.parent];
					if (elt.child)
						elt.child = elt.child.map((id: number): number => idMapping[id]);
					if (elt.properties)
						Object.keys(elt.properties).map((category: any): void =>
							//Object.keys(elt.properties[category]).map((prop: any): void =>
							//	iterateSvfNodes(elt.properties[category][prop])));
							iterateSvf2Nodes(elt.properties[category]));
				};
				hasSVF2 && svf2PropertiesInternals.data.collection.map((elt: any): void => iterateSvf2Nodes(elt));
				const iterateSvfNodes = (elt: any): void => {
					if (elt.name)
						elt.name = renameNodeName(elt.name);
					if (elt.Name)
						elt.Name = renameNodeName(elt.Name);
					if (elt.NAME)
						elt.NAME = renameNodeName(elt.NAME);
					// if (elt.GUID)
					// 	delete elt.GUID;
					if (elt.GLOBALID && Array.isArray(elt.GLOBALID))
						elt.GLOBALID = elt.GLOBALID.sort();
					if (elt.properties)
						Object.keys(elt.properties).map((category: any): void =>
							//Object.keys(elt.properties[category]).map((prop: any): void =>
							//	iterateSvfNodes(elt.properties[category][prop])));
							iterateSvfNodes(elt.properties[category]));
				};
				hasSVF2 && svfPropertiesInternals.data.collection.map((elt: any): void => iterateSvfNodes(elt));
				hasSVF2 && JsonDiff.sortObjectProperties(svf2PropertiesInternals, [PropertiesController.sortKey]); // Sort again since we changed objectIDs
				hasSVF2 && await PropertiesController.saveJson(`./data/${fn2}-${guid}-properties-internals.svf.remapped`, svfPropertiesInternals);
				hasSVF2 && await PropertiesController.saveJson(`./data/${fn2}-${guid}-properties-internals.svf2.remapped`, svf2PropertiesInternals);
				let different: JsonDiff = hasSVF2 && await PropertiesController.compareObjectsWithSVF2(
					svfPropertiesInternals, svf2PropertiesInternals, PropertiesController.sortByObjectID, `${fn2} ${guid} svf-svf2 internal properties`,
					`./data/${fn2}-${guid}-properties-internals-svf-svf2.diff`,
					false
				);

				let svfProperties: any = await PropertiesController.loadJson(`./data/${fn2}-${guid}-properties.svf`);
				const sqlProperties: any = await PropertiesController.loadJson(`./data/${fn2}-${guid}-properties.sql`);
				PropertiesController.compareObjects(svfProperties, sqlProperties, `${fn2} ${guid} svf-sql properties`, PropertiesController.sortByObjectID, false);
				const svf2Properties: any = hasSVF2 && await PropertiesController.loadJson(`./data/${fn2}-${guid}-properties.svf2`);
				//PropertiesController.compareObjects(svfProperties, svf2Properties, `${fn2} ${guid} svf-svf2 properties`, PropertiesController.sortByObjectID, false); // expected to fail
				hasSVF2 && svf2Properties.data.collection.map((elt: any): void => elt.objectid = idMapping[elt.objectid]);
				hasSVF2 && svf2Properties.data.collection.map((elt: any): void => iterateSvf2Nodes(elt));
				hasSVF2 && svfProperties.data.collection.map((elt: any): void => iterateSvfNodes(elt));
				hasSVF2 && JsonDiff.sortObjectProperties(svf2Properties, [PropertiesController.sortKey]); // Sort again since we changed objectIDs
				hasSVF2 && await PropertiesController.saveJson(`./data/${fn2}-${guid}-properties.svf.remapped`, svfProperties);
				hasSVF2 && await PropertiesController.saveJson(`./data/${fn2}-${guid}-properties.svf2.remapped`, svf2Properties);
				different = hasSVF2 && await PropertiesController.compareObjectsWithSVF2(
					svfProperties, svf2Properties, PropertiesController.sortByObjectID, `${fn2} ${guid} svf-svf2 properties`,
					`./data/${fn2}-${guid}-properties-svf-svf2.diff`,
					false
				);

				// Now compare with Forge
				svfTree = await PropertiesController.loadJson(`./data/${fn2}-${guid}-tree.svf`);
				const forgeTree: any = await PropertiesController.loadJson(`./data/${fn2}-${guid}-tree.forge`);
				different = await PropertiesController.compareObjectsWithSVF2(
					svfTree, forgeTree, PropertiesController.sortByObjectID, `${fn2} ${guid} svf-forge tree`,
					`./data/${fn2}-${guid}-tree-svf-forge.diff`,
					false
				);

				svfProperties = await PropertiesController.loadJson(`./data/${fn2}-${guid}-properties.svf`);
				const forgeProperties: any = await PropertiesController.loadJson(`./data/${fn2}-${guid}-properties.forge`);
				different = await PropertiesController.compareObjectsWithSVF2(
					svfProperties, forgeProperties, PropertiesController.sortByObjectID, `${fn2} ${guid} svf-forge properties`,
					`./data/${fn2}-${guid}-properties-svf-forge.diff`,
					false
				);

				//break;
			}
		} catch (ex) {
			console.error(ex);
		}
	}

	public async test(args?: string[]): Promise<void> {
		let result: any = null;
		const fn1: string = args[0];
		const fn2: string = args[1];
		const def1: any = urns[fn1];
		const def2: any = urns[fn2];
		const guids1: string = this.defaultGuid(def1);
		const guids2: string = def2 && this.defaultGuid(def2);

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


		//result = await this.forge_getPropertiesRange(fn1, guids1, [4]);
		//result = await this.xxx_GetProperties('sql', fn1);

		//await this.xxx_getPropertiesRange('sql', fn1, [1618], true);

		// const guid: string = '488e0550-6e79-38b3-9f56-ae8fd21416bb';
		// result = await this.xxx_getTree('svf2', fn1, guid);

		let guid: string = '';
		guid = '6fda4fe6-0ceb-4525-a86d-20be4000dab5';
		//guid = '488e0550-6e79-38b3-9f56-ae8fd21416bb';
		//result = await this.xxx_getTree('sql', fn1, guid);
		result = await this.xxx_getTree('svf', fn1, guid);


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

	public async deldb(args?: string[]): Promise<void> {
		try {
			const ls: string[] = [...args];
			const jobs: Promise<void>[] = ls.map((db: string): Promise<void> => {
				const urn: string = urns[db].urn;
				const dirPath: string = _path.resolve(__dirname, '../../cache', urn);
				//console.log(dirPath);
				return (_rimraf(dirPath));
				//return (Promise.resolve());
			});
			await Promise.all(jobs);
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

	protected static async loadFile(ref: any): Promise<Buffer> {
		try {
			const buffer: Buffer = await _fsReadFile(PropertiesController.resolvePath(ref));
			return (buffer);
		} catch (ex) { }
		return (null);
	}

	protected static async saveFile(ref: any, buffer: Buffer): Promise<void> {
		try {
			await _fsWriteFile(PropertiesController.resolvePath(ref), buffer);
		} catch (ex) { }
	}

	protected static async loadJson(ref: any): Promise<any> {
		try {
			const buffer: Buffer = await _fsReadFile(PropertiesController.resolvePath(ref));
			return (JSON.parse(buffer.toString('utf8')));
		} catch (ex) { }
		return (null);
	}

	protected static async saveJson(ref: any, obj: any): Promise<void> {
		try {
			await _fsWriteFile(PropertiesController.resolvePath(ref), Buffer.from(JSON.stringify(obj, null, 4), 'utf8'), { encoding: 'utf8' });
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

	protected static async compareObjectsWithSVF2(
		lhs: any, rhs: any, key: string = '', message: string = '',
		diffFile: string = null,
		bConsole: boolean = true
	): Promise<JsonDiff> {
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
			const acceptedDiff: boolean = await PropertiesController.accepOrRejectChanges(cmp, diffFile);
			const acceptedDiffMsg: string = `differences ${acceptedDiff ? 'accepted' : 'rejected'}`;
			if (bConsole)
				PropertiesController.console(false, `${message}  different -`, acceptedDiff, acceptedDiffMsg, undefined, `\n${cmp.toString(4)}\n`);
			else
				PropertiesController.console(false, `${message} different -`, acceptedDiff, acceptedDiffMsg);
		}
		return (cmp);
	}

	protected async compareMethods(model: string, what: string, lformat: string, lhs: any, rformat: string, rhs: any, key?: string): Promise<boolean> {
		const fn: string = `./data/${model}-${what}.${lformat}-${rformat}`;
		let diff: any = await PropertiesController.loadJson(fn);

		const cmp: JsonDiff = new JsonDiff(lhs, rhs, key ? [key] : undefined);
		if (cmp.areEquals || (diff && JSON.stringify(diff) === cmp.toString())) {
			PropertiesController.console(true, `${model} ${what} (${lformat}-${rformat})`);
		} else {
			PropertiesController.console(true, `${model} ${what} (${lformat}-${rformat}) created!`);
			PropertiesController.console(false, `${model} ${what} (${lformat}-${rformat})\n${cmp.toString(4)}\n`);
			await PropertiesController.saveFile(fn, Buffer.from(cmp.toString(4)));
		}
		return (cmp.areEquals);
	}

	protected async changeReferences(from: string, to: string, files: string[]): Promise<void> {
		let jobs: Promise<void>[] = files.map(async (file: string): Promise<void> => {
			let fn: string = `./data/${file}`;
			const content: Buffer = await PropertiesController.loadFile(fn);
			let text: string = content.toString('utf8');
			var re = new RegExp(from, 'g');
			text = text.replace(re, to);
			fn = `./data/${file}.ref`;
			await PropertiesController.saveFile(fn, Buffer.from(text));
		});
		await Promise.all(jobs);
	}

	protected compareIDs(extIDs: any, IDs: any, message: string = ''): boolean {
		let equal: boolean = true;
		// extIDs = { svfID: externalID }
		// IDs    = { externalID: svfID }
		const keys: string[] = Object.keys(IDs);
		if (keys.length !== Object.keys(extIDs).length)
			return (false);

		// if ( keys.length > 5000 ) {
		// 	// Do only few, but random
		// } else {
		// Compare all
		const bs: boolean[] = keys.map((extid: string): boolean => extIDs.hasOwnProperty(IDs[extid]) && extid === extIDs[IDs[extid]]);
		equal = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator && currentValue, true);
		// JsonDiff.sortObjectProperties(data);
		// PropertiesController.compareObjects(extids, data, `${fn1} sql ExtId <-> ObjId`, undefined, false);
		// }
		PropertiesController.console(equal, message);
		return (equal);
	}

	protected static async accepOrRejectChanges(different: JsonDiff, diffFilename: string): Promise<boolean> {
		let diff: any = await PropertiesController.loadJson(diffFilename);
		if (different.areEquals || (diff && JSON.stringify(diff) === different.toString())) {
			return (true);
		} else {
			await PropertiesController.saveFile(diffFilename, Buffer.from(different.toString(4)));
			return (false);
		}
	}

	// pairs of:   bool: true|false|undefined, string: ''
	protected static console(...args: any[]): void {
		let st: string | string[] = [];
		for (let i = 0; i < args.length; i += 2) {
			let flag = '';
			if (args[i] === true)
				flag = 'green ✓';
			else if (args[i] === false)
				flag = 'red ✗';
			else
				flag = 'white  ';
			st.push(chalk`{${flag} ${args[i + 1]}}`);
		}
		st = st.join(' ');
		console.log(st);
		// if (!isOk)
		// 	console.warn(chalk`{red ✗ ${message}}`);
		// else
		// 	console.info(chalk`{green ✓ ${message}}`);
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
