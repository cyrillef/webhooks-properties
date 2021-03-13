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
import * as util from 'util';
import * as superagent from 'superagent';
import JsonDiff from './json-diff';
import request = require('superagent');

const _fsExists = util.promisify(_fs.exists);
const _fsUnlink = util.promisify(_fs.unlink);
const _fsReadFile = util.promisify(_fs.readFile);
const _fsWriteFile = util.promisify(_fs.writeFile);

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

class PropertiesController {

	constructor() { }

	private static sleep(milliseconds: number): Promise<any> {
		return (new Promise((resolve: (value?: any) => void) => setTimeout(resolve, milliseconds)));
	}

	public async help(args?: string[]): Promise<void> {
		console.log('properties <command> [args]');
		console.log('  help        - this message');
		console.log('  list        - Models list');
		console.log('  svf <model> - test SVF');
		console.log(' ');
		await PropertiesController.sleep(0);
	}

	public async list(index: string = ''): Promise<void> {
		console.log('models: ', Object.keys(urns));
	}

	public async forge_properties(args: string, guid: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/forge/${def.urn}/metadata/${guid}/properties`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-properties.forge`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, ['objectid']);
		if (!json) {
			await this.saveJson(fn, result.body);
			console.info(`${args} forge-properties created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} forge-properties`, 'objectid');
		}
		return (result.body);
	}

	public async forge_tree(args: string, guid: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/forge/${def.urn}/metadata/${guid}`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-tree.forge`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, ['objectid']);
		if (!json) {
			await this.saveJson(fn, result.body);
			console.info(`${args} forge-tree created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} forge-tree`, 'objectid');
		}
		return (result.body);
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
			console.info(`${args} ${method} load created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} load`);
		}
		return (result.body);
	}

	public async xxx_externalids(method: string, args: string): Promise<any> {
		//const _urns: any[] = Object.keys(urns).filter ((elt: string): boolean => )
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/externalids`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-externalids.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body);
		if (!json) {
			await this.saveJson(fn, result.body);
			console.info(`${args} ${method} externalids created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} externalids`);
		}
		return (result.body);
	}

	public async xxx_ids(method: string, args: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/ids`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-ids.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body);
		if (!json) {
			await this.saveJson(fn, result.body);
			console.info(`${args} ${method} ids created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} ids`);
		}
		return (result.body);
	}

	public async xxx_ids2(method: string, args: string, extIds: string[]): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/ids?ids=${encodeURIComponent(extIds.join(','))}`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-ids2.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body);
		if (!json) {
			await this.saveJson(fn, result.body);
			console.info(`${args} ${method} ids2 created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} ids2`);
		}
		return (result.body);
	}

	public async xxx_properties(method: string, args: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/properties`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-properties.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, ['objectid']);
		if (!json) {
			await this.saveJson(fn, result.body);
			console.info(`${args} ${method} properties created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} properties`, 'objectid');
		}
		return (result.body);
	}

	public async xxx_properties2(method: string, args: string, dbids: string[]): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata/properties?ids=${encodeURIComponent(dbids.join(','))}&keephiddens=true&keepinternals=true`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-properties2.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, ['objectid']);
		if (!json) {
			await this.saveJson(fn, result.body);
			console.info(`${args} ${method} properties2 created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} properties2`, 'objectid');
		}
		return (result.body);
	}

	public async xxx_tree(method: string, args: string): Promise<any> {
		const def: any = urns[args];
		const url: string = `/${method}/${def.urn}/metadata`;
		let result: any = await superagent('GET', PropertiesController.makeRequestURL(url));
		const fn: string = `./data/${args}-tree.${method}`;
		let json: any = await this.loadJson(fn);
		JsonDiff.sortObjectProperties(result.body, ['objectid']);
		if (!json) {
			await this.saveJson(fn, result.body);
			console.info(`${args} ${method} tree created!`);
		} else {
			PropertiesController.compareObjects(result.body, json, `${args} ${method} tree`, 'objectid');
		}
		return (result.body);
	}

	public async svf(args?: string[]): Promise<void> {
		if (args.length < 1 || (!urns.hasOwnProperty(args[0]) /*&& args[0] !== 'all'*/))
			return (this.help(args));
		let data: any = null;
		try {
			console.log(`Downloading ${args[0]} .json.gz files, please wait...`);
			await this.xxx_load('svf', args[0]);
			data = await this.xxx_externalids('svf', args[0]);
			await this.xxx_ids('svf', args[0]);
			const extIds: string[] = Object.values(data.data.collection).slice(0, 5) as string[];
			await this.xxx_ids2('svf', args[0], extIds);
			const forgeProps: any = await this.forge_properties(args[0], urns[args[0]].guids[0]);
			const svfProps: any = await this.xxx_properties('svf', args[0]);
			const dbids: string[] = Object.keys(data.data.collection).slice(0, 30) as string[];
			await this.xxx_properties2('svf', args[0], dbids);
			const forgeTree: any = await this.forge_tree(args[0], urns[args[0]].guids[0]);
			const svfTree: any = await this.xxx_tree('svf', args[0]);

			await this.compareMethods(args[0], 'metadata-properties', 'forge', forgeProps, 'svf', svfProps, 'objectid');
			await this.compareMethods(args[0], 'metadata-objecttree', 'forge', forgeTree, 'svf', svfTree, 'objectid');
		} catch (ex) {
			console.error(ex);
		}
	}

	public async sql(args?: string[]): Promise<void> {
		if (args.length < 1 || (!urns.hasOwnProperty(args[0]) /*&& args[0] !== 'all'*/))
			return (this.help(args));
		let data: any = null;
		try {
			console.log(`Downloading ${args[0]} sqlite DB, please wait...`);
			await this.xxx_load('sql', args[0]);
			data = await this.xxx_externalids('sql', args[0]);
			await this.xxx_ids('sql', args[0]);
			const extIds: string[] = Object.values(data.data.collection).slice(0, 5) as string[];
			await this.xxx_ids2('sql', args[0], extIds);
			const forgeProps: any = await this.forge_properties(args[0], urns[args[0]].guids[0]);
			const sqlProps: any = await this.xxx_properties('sql', args[0]);
			const dbids: string[] = Object.keys(data.data.collection).slice(0, 30) as string[];
			await this.xxx_properties2('sql', args[0], dbids);
			const forgeTree: any = await this.forge_tree(args[0], urns[args[0]].guids[0]);
			const sqlTree: any = await this.xxx_tree('sql', args[0]);

			await this.compareMethods(args[0], 'metadata-properties', 'forge', forgeProps, 'sql', sqlProps, 'objectid');
			await this.compareMethods(args[0], 'metadata-objecttree', 'forge', forgeTree, 'sql', sqlTree, 'objectid');
		} catch (ex) {
			console.error(ex);
		}
	}

	public async svf2(args?: string[]): Promise<void> {
		if (args.length < 1 || (!urns.hasOwnProperty(args[0]) /*&& args[0] !== 'all'*/))
			return (this.help(args));
		let data: any = null;
		try {
			console.log(`Downloading ${args[0]} .json .idx .pack files, please wait...`);
			await this.xxx_load('svf2', args[0]);
			data = await this.xxx_externalids('svf2', args[0]);
			await this.xxx_ids('svf2', args[0]);
			const extIds: string[] = Object.values(data.data.collection).slice(0, 5) as string[];
			await this.xxx_ids2('svf2', args[0], extIds);
			const forgeProps: any = await this.forge_properties(args[0], urns[args[0]].guids[0]);
			const svf2Props: any = await this.xxx_properties('svf2', args[0]);
			const dbids: string[] = Object.keys(data.data.collection).slice(0, 30) as string[];
			await this.xxx_properties2('svf2', args[0], dbids);
			const forgeTree: any = await this.forge_tree(args[0], urns[args[0]].guids[0]);
			const svf2Tree: any = await this.xxx_tree('svf2', args[0]);

			await this.compareMethods(args[0], 'metadata-properties', 'forge', forgeProps, 'svf2', svf2Props, 'objectid');
			await this.compareMethods(args[0], 'metadata-objecttree', 'forge', forgeTree, 'svf2', svf2Tree, 'objectid');
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
			await _fsWriteFile(PropertiesController.resolvePath(ref), Buffer.from(JSON.stringify(obj)));
		} catch (ex) { }
	}

	protected static makeRequestURL(uri: string): string {
		return (`http://localhost:${process.env.PORT}${uri}`);
	}

	protected static compareObjects(lhs: any, rhs: any, message: string = '', key?: string): boolean {
		//JsonDiff.sortObjectProperties(lhs);
		//JsonDiff.sortObjectProperties(rhs);
		const cmp: JsonDiff = new JsonDiff(lhs, rhs, key ? [key] : undefined);
		if (cmp.areEquals) {
			console.log(`${message} ok`);
		} else {
			console.warn(`${message} `, cmp.toString(4));
			console.log(' ');
		}
		return (cmp.areEquals);
	}

	protected async compareMethods(model: string, what: string, lformat: string, lhs: any, rformat: string, rhs: any, key?: string): Promise<boolean> {
		const fn: string = `./data/${model}-${what}.${lformat}-${rformat}`;
		let diff: any = await this.loadJson(fn);
		
		const cmp: JsonDiff = new JsonDiff(lhs, rhs, key ? [key] : undefined);
		if (cmp.areEquals || (diff && JSON.stringify(diff) === cmp.toString())) {
			console.log(`${model} ${what} (${lformat}-${rformat}) ok`);
		} else {
			console.info(`${model} ${what} (${lformat}-${rformat}) created!`);
			console.warn(`${model} ${what} (${lformat}-${rformat}) `, cmp.toString(4));
			await this.saveFile(fn, Buffer.from(cmp.toString()));
			console.log(' ');
		}
		return (cmp.areEquals);
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
