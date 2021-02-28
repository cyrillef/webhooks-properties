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

const _fsWriteFile = util.promisify(_fs.writeFile);

(Object as any).equals = (x: any, y: any) => {
	if (x === y)
		return (true);
	// if both x and y are null or undefined and exactly the same

	if (!(x instanceof Object) || !(y instanceof Object))
		return (false);
	// if they are not strictly equal, they both need to be Objects

	if (x.constructor !== y.constructor)
		return (false);
	// they must have the exact same prototype chain, the closest we can do is
	// test there constructor.

	for (var p in x) {
		if (!x.hasOwnProperty(p)) continue;
		// other properties were tested using x.constructor === y.constructor

		if (!y.hasOwnProperty(p))
			return (false);
		// allows to compare x[ p ] and y[ p ] when set to undefined

		if (x[p] === y[p])
			continue;
		// if they have the same strict value or identity then they are equal

		if (typeof (x[p]) !== "object")
			return (false);
		// Numbers, Strings, Functions, Booleans must be strictly equal

		if (!(Object as any).equals(x[p], y[p]))
			return (false);
		// Objects and Arrays must be tested recursively
	}

	for (p in y) {
		if (y.hasOwnProperty(p) && !x.hasOwnProperty(p))
			return (false);
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
				'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: "graphics", mime: "application/autodesk-svf", type: "resource"
				//'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: "graphics", mime: "application/autodesk-svf2", type: "resource"
				'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: "graphics", mime: "application/autodesk-f2d", type: "resource",
				'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: "graphics", mime: "application/autodesk-f2d", type: "resource",
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
				superagent('GET', url),
				superagent('GET', url + '/db'),
			];
			const results: any[] = await Promise.all(jobs);
			const obj0 = JSON.parse(results[0].text);
			const obj1 = JSON.parse(results[1].text);

			obj1.data.objects[0].objects = obj1.data.objects[0].objects.filter ((elt: any): boolean => {
				return (
					elt.name !== 'Schedule Graphics' 
					&& elt.name !== 'Title Blocks' 
					&& elt.name !== ''

					&& elt.name !== 'Survey Point'
					&& elt.name !== 'Project Base Point'
				);
			});

			//if (JSON.stringify(obj0) === JSON.stringify(obj1))
			if ((Object as any).equals(obj0, obj1))
				console.log(`${message} identical`);
			else
				console.warn(`${message} different`);

			if ( fn) {
				await _fsWriteFile(`${fn}.json`, Buffer.from(JSON.stringify(obj0, null, 4)));
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