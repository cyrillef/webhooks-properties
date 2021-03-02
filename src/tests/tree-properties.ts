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

import * as superagent from 'superagent';
import * as moment from 'moment';
import * as Forge from 'forge-apis';
import AppSettings from './app-settings';
import * as util from 'util';
import * as _fs from 'fs';
import * as _path from 'path';
import JsonDiff from './json-diff';
import * as diffx from 'deep-diff';

const _fsWriteFile = util.promisify(_fs.writeFile);

(Object as any).equals = (x: any, y: any, path: string = './') => {
	if (x === y) // if both x and y are null or undefined and exactly the same
		return (true);

	// if they are not strictly equal, they both need to be Objects
	if (!(x instanceof Object) || !(y instanceof Object))
		return (console.log(`- diff @ ${path}`), false);
	// they must have the exact same prototype chain, the closest we can do is test there constructor.
	if (x.constructor !== y.constructor)
		return (console.log(`- diff @ ${path}`), false);

	for (let p in x) {
		// other properties were tested using x.constructor === y.constructor
		if (!x.hasOwnProperty(p))
			continue;
		// allows to compare x[ p ] and y[ p ] when set to undefined
		if (!y.hasOwnProperty(p))
			return (console.log(`- diff @ ${path}`), false);
		if (x[p] === y[p]) // if they have the same strict value or identity then they are equal
			continue;
		// Numbers, Strings, Functions, Booleans must be strictly equal
		if (typeof (x[p]) !== 'object')
			return (console.log(`- diff @ ${path}`), false);
		// Objects and Arrays must be tested recursively
		if (!(Object as any).equals(x[p], y[p], `${path}${p}/`))
			return (/*console.log(`${path}${p} are different`),*/ false);
	}

	for (let p in y) {
		if (y.hasOwnProperty(p) && !x.hasOwnProperty(p))
			return (console.log(`- diff @ ${path}`), false);
		// allows x[ p ] to be set to undefined
	}
	return (true);
};

class TreePropertiesTestsController {

	public static readonly DEFAULT_PROFILE: string = 'master';

	public static objects: any = {
		master: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTWFzdGVyJTIwLSUyMFBsYW50M0QuZHdn',
			guids: [
				'e30bd031-d13a-a976-9153-78100829986a', // 3d
				'b7bb12b1-f832-5005-ca30-a0e6b00f9da5', // 2d
			],
			objid: 24,
		},
		pier9: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvUDlfTWFjaGluZVNob3BfRmluYWwucnZ0',
			guids: [
				'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf', type: 'resource'
				//'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf2', type: 'resource'
				'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
				'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
			],
			objid: 1,
		},
		dxf: { // rOlB7GtsAOmuvm6XqPAILp83ARMymAfL
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS0yMDIxL2FyYWIuZHhm',
			guids: [
				'115d2418-de8a-46bf-852a-b23ef9338de2', // 2d
			],
			objid: 109,
		},
	};

	public constructor() {
	}

	private static sleep(milliseconds: number): Promise<any> {
		return (new Promise((resolve: (value?: any) => void) => setTimeout(resolve, milliseconds)));
	}

	private async request(url: string, message: string, fn?: string): Promise<void> {
		try {
			const jobs: Promise<any>[] = [
				superagent('GET', url + '/forge'),
				superagent('GET', url),
			];
			const results: any[] = await Promise.all(jobs);
			const obj0 = JSON.parse(results[0].text);
			const obj1 = JSON.parse(results[1].text);

			// obj1.data.objects[0].objects = obj1.data.objects[0].objects.filter ((elt: any): boolean => {
			// 	return (
			// 		elt.name !== 'Schedule Graphics' 
			// 		&& elt.name !== 'Title Blocks' 
			// 		&& elt.name !== ''

			// 		&& elt.name !== 'Survey Point'
			// 		&& elt.name !== 'Project Base Point'
			// 	);
			// });

			const cmp: JsonDiff = new JsonDiff(obj0, obj1, ['objectid']);
			if (cmp.areEquals)
			//if (JSON.stringify(obj0) === JSON.stringify(obj1))
			//if ((Object as any).equals(obj0, obj1))
				console.log(`${message} identical`);
			else
				console.warn(`${message} different`, cmp.toString(4));

			if (fn) {
				await _fsWriteFile(`${fn}-forge.json`, Buffer.from(JSON.stringify(obj0, null, 4)));
				await _fsWriteFile(`${fn}-db.json`, Buffer.from(JSON.stringify(obj1, null, 4)));
			}
		} catch (ex) {
			console.error(`failed - ${ex.message}`);
		}
	}

	public async pier9Default(index: number = 0): Promise<void> {
		const urn: string = TreePropertiesTestsController.objects.pier9.urn;
		await this.request(`http://localhost:3001/tree/${urn}`, 'tree ${urn}', _path.resolve(__dirname, `tree-${urn}`));
	}

	public async pier9(index: number = 0): Promise<void> {
		const urn: string = TreePropertiesTestsController.objects.pier9.urn;
		const guid: string = TreePropertiesTestsController.objects.pier9.guids[index];
		await this.request(`http://localhost:3001/tree/${urn}/guids/${guid}`, `tree ${urn} ${guid}`, _path.resolve(__dirname, `tree-${urn}-${guid}`));
	}

	public async test(index: number = 0): Promise<void> {
		const json0: any = {
			key: 1,
			test1: 1,
			test2: 'test',
			test3: [1, 3, 5, 2],
			test4: {
				key: 4,
				test41: 4,
				test42: 'test4',
				test43: [1, 3, 5, 2],
			},
			test5: [
				{
					key: 5,
					test51: 5,
					test52: 'test5',
					test53: [1, 3, 5, 2],
				},
				{
					key: 6,
					test61: 6,
					test62: 'test6',
					test63: [1, 3, 5, 2],
				},
				{
					key: 7,
					test71: 7,
					test72: 'test7',
					test73: [1, 3, 5, 2],
				},
				{
					key: 8,
					test81: 8,
				},
			],
			testmissing: 9,
		};
		const json1: any = {
			key: 1,
			test2: 'test',
			test4: {
				key: 4,
				test41: 4,
				test43: [1, 3, 5, 2],
				test42: 'test4',
			},
			test1: 1,
			test5: [
				{
					key: 6,
					test62: 'test6',
					test63: [1, 3, 5, 2],
					test61: 6,
				},
				{
					test51: 5,
					test53: [1, 3, 5, 2],
					key: 5,
					test52: 'test5',
				},
				{
					test73: [1, 3, 5, 2],
					test71: 7,
					test72: 'test7',
					key: 7,
				},
				{
					key: 8,
					test81: 8,
				},
			],
			test3: [1, 3, 5, 2],
			testmissing: 9,
		};
		const json2: any = {
			key: 1,
			test2: 'test_', // < not equal
			test4: {
				key: 4,
				test41: 44, // < not equal
				test43: [1, 3, 5, 2],
				test42: 'test4',
			},
			test1: 1,
			test5: [
				{
					key: 6,
					test62: 'test6_', // < not equal
					//test63: [1, 3, 5, 2], // < missing on right
					test61: 66, // < not equal
				},
				{
					test51: 5,
					test53: [1, 8, 5, 2], // < not equal
					key: 5,
					test52: 'test5',
				},
				{
					test73: [1, 3, 5, 2],
					test71: '7', // < not of the same type
					test72: 'test7',
					key: 7,
					test75: 0, // < missing on left
				},
				{
					key: 9,
					test91: 9,
				},
			],
			test3: [1, 3, 55, 2], // < not equal
			testnew: 9, // < missing on left
		};
		const diff2 = {
			'//test2/': 'not equal',
			'//test3/': 'arrays content are different',
			'//test4/test41/': 'not equal',
			'//test5/[key=5]test53/': 'arrays content are different',
			'//test5/[key=6]test61/': 'not equal',
			'//test5/[key=6]test62/': 'not equal',
			'//test5/[key=6]test63/': 'missing on right',
			'//test5/[key=7]test71/': 'not of the same type',
			'//test5/[key=7]test75/': 'missing on left',
			"//test5/[key=8]": "missing on right",
			"//test5/[key=9]": "missing on left",
			"//test5/": "arrays content are different",
			'//testmissing/': 'missing on right',
			'//testnew/': 'missing on left',
		};

		const cmp1: JsonDiff = new JsonDiff(json0, json1, ['key']);
		if (!cmp1.areEquals)
			console.log(cmp1.toString(4));

		const cmp2: JsonDiff = new JsonDiff(json0, json2, ['key']);
		if (!cmp2.areEquals) {
			console.log(cmp2.toString(4));
			//console.log(JSON.stringify(diff2, null, 4));
			if (JSON.stringify(diff2) !== cmp2.toString())
				console.log('I was expecting', JSON.stringify(diff2, null, 4));
		}

		// const cmp3 = diffx.diff(json0, json1);
		// const cmp4 = diffx.diff(json0, json2);

		let g = 0;
	}

}

const run = async (fctName: string, index: string) => {
	const Index: number = parseInt(index);

	const controller: TreePropertiesTestsController = new TreePropertiesTestsController();
	const fct = (controller as any)[fctName];
	await (fct.bind(controller))(Index);

	process.exit(0);
};

//console.log(process.argv);
if (process.argv.length < 4)
	process.exit(1);
run(process.argv[2], process.argv[3] || '0');