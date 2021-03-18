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
import JsonDiff from './json-diff';
import * as _fs from 'fs';
import * as _path from 'path';
import * as _util from 'util';

const _fsExists = _util.promisify(_fs.exists);
const _fsUnlink = _util.promisify(_fs.unlink);
const _fsReadFile = _util.promisify(_fs.readFile);
const _fsWriteFile = _util.promisify(_fs.writeFile);

interface TestParams {
	model: string;
	urn: string;
	guid: string;
	diff: any;
};

class TreePropertiesTestsController {

	public static readonly DEFAULT_PROFILE: string = 'master';

	public static objects: any = {
		master: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTWFzdGVyJTIwLSUyMFBsYW50M0QuZHdn', // Master - Plant3D.dwg
			guids: [
				'e30bd031-d13a-a976-9153-78100829986a', // 3d
				'b7bb12b1-f832-5005-ca30-a0e6b00f9da5', // 2d
			],
			objid: 24,
			diffs: {
				tree: {
					'e30bd031-d13a-a976-9153-78100829986a': {},
					'b7bb12b1-f832-5005-ca30-a0e6b00f9da5': {},
				},
				properties: {
					'e30bd031-d13a-a976-9153-78100829986a': {},
					'b7bb12b1-f832-5005-ca30-a0e6b00f9da5': {},
				},
			},
		},
		pier9: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvUDlfTWFjaGluZVNob3BfRmluYWwucnZ0', // P9_MachineShop_Final.rvt
			guids: [
				'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf', type: 'resource'
				//'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf2', type: 'resource'
				'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
				'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
			],
			objid: 1,
			diffs: {
				tree: {
					'ee578c34-41d4-83e7-fd72-1c18a453c3b9': {},
					'6fda4fe6-0ceb-4525-a86d-20be4000dab5': {
						"//data/objects/[objectid=1]objects/[objectid=15]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=3184]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=3203]": "missing on left",
						"//data/objects/[objectid=1]objects/": "warning: arrays do not have the same length",
						"//data/objects/": "arrays content are different"
					},
					'e67f2035-8010-3ff5-e399-b9c9217c2366': {
						"//data/objects/[objectid=1]objects/[objectid=15]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=1953]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=1958]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=3184]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=3203]": "missing on left",
						"//data/objects/[objectid=1]objects/": "warning: arrays do not have the same length",
						"//data/objects/": "arrays content are different"
					},
				},
				properties: {
					'ee578c34-41d4-83e7-fd72-1c18a453c3b9': {
						"//data/collection/[objectid=2977]properties/Other/": "missing on left",
						"//data/collection/[objectid=2980]properties/Other/": "missing on left",
						"//data/collection/[objectid=2982]properties/Other/": "missing on left",
						"//data/collection/[objectid=2984]properties/Other/": "missing on left",
						"//data/collection/[objectid=2986]properties/Other/": "missing on left",
						"//data/collection/[objectid=2987]properties/Other/": "missing on left",
						"//data/collection/[objectid=2988]properties/Other/": "missing on left",
						"//data/collection/[objectid=2989]properties/Other/": "missing on left",
						"//data/collection/[objectid=2994]properties/Other/": "missing on left",
						"//data/collection/[objectid=2995]properties/Other/": "missing on left",
						"//data/collection/[objectid=2996]properties/Other/": "missing on left",
						"//data/collection/[objectid=2997]properties/Other/": "missing on left",
						"//data/collection/[objectid=2998]properties/Other/": "missing on left",
						"//data/collection/[objectid=2999]properties/Other/": "missing on left",
						"//data/collection/[objectid=3000]properties/Other/": "missing on left",
						"//data/collection/[objectid=3001]properties/Other/": "missing on left",
						"//data/collection/[objectid=3002]properties/Other/": "missing on left",
						"//data/collection/[objectid=3003]properties/Other/": "missing on left",
						"//data/collection/[objectid=3004]properties/Other/": "missing on left",
						"//data/collection/[objectid=3005]properties/Other/": "missing on left",
						"//data/collection/[objectid=3006]properties/Other/": "missing on left",
						"//data/collection/[objectid=3007]properties/Other/": "missing on left",
						"//data/collection/[objectid=3008]properties/Other/": "missing on left",
						"//data/collection/[objectid=3009]properties/Other/": "missing on left",
						"//data/collection/[objectid=3010]properties/Other/": "missing on left",
						"//data/collection/[objectid=3011]properties/Other/": "missing on left",
						"//data/collection/[objectid=3012]properties/Other/": "missing on left",
						"//data/collection/[objectid=3013]properties/Other/": "missing on left",
						"//data/collection/[objectid=3014]properties/Other/": "missing on left",
						"//data/collection/[objectid=3015]properties/Other/": "missing on left",
						"//data/collection/[objectid=3074]properties/Other/": "missing on left",
						"//data/collection/[objectid=3084]properties/Other/": "missing on left",
						"//data/collection/[objectid=3088]properties/Other/": "missing on left",
						"//data/collection/[objectid=3120]properties/Other/": "missing on left",
						"//data/collection/[objectid=3124]properties/Other/": "missing on left",
						"//data/collection/[objectid=3141]properties/Other/": "missing on left",
						"//data/collection/[objectid=3147]properties/Other/": "missing on left",
						"//data/collection/[objectid=3178]properties/Other/": "missing on left",
						"//data/collection/[objectid=3212]properties/Other/": "missing on left",
						"//data/collection/[objectid=3236]properties/Other/": "missing on left",
						"//data/collection/": "arrays content are different"
					},
					'6fda4fe6-0ceb-4525-a86d-20be4000dab5': {
						"//data/collection/[objectid=2977]properties/Other/": "missing on left",
						"//data/collection/[objectid=2980]properties/Other/": "missing on left",
						"//data/collection/[objectid=2982]properties/Other/": "missing on left",
						"//data/collection/[objectid=2984]properties/Other/": "missing on left",
						"//data/collection/[objectid=2998]properties/Other/": "missing on left",
						"//data/collection/[objectid=2999]properties/Other/": "missing on left",
						"//data/collection/[objectid=3000]properties/Other/": "missing on left",
						"//data/collection/[objectid=3001]properties/Other/": "missing on left",
						"//data/collection/[objectid=3002]properties/Other/": "missing on left",
						"//data/collection/[objectid=3005]properties/Other/": "missing on left",
						"//data/collection/[objectid=3010]properties/Other/": "missing on left",
						"//data/collection/[objectid=3011]properties/Other/": "missing on left",
						"//data/collection/[objectid=3012]properties/Other/": "missing on left",
						"//data/collection/[objectid=3074]properties/Other/": "missing on left",
						"//data/collection/[objectid=3084]properties/Other/": "missing on left",
						"//data/collection/[objectid=3088]properties/Other/": "missing on left",
						"//data/collection/[objectid=3120]properties/Other/": "missing on left",
						"//data/collection/[objectid=3124]properties/Other/": "missing on left",
						"//data/collection/[objectid=3141]properties/Other/": "missing on left",
						"//data/collection/[objectid=3147]properties/Other/": "missing on left",
						"//data/collection/[objectid=3167]properties/Other/": "missing on left",
						"//data/collection/[objectid=3178]properties/Other/": "missing on left",
						"//data/collection/[objectid=3193]properties/Graphics/View Scale/": "not equal",
						"//data/collection/[objectid=3212]properties/Other/": "missing on left",
						"//data/collection/[objectid=3236]properties/Other/": "missing on left",
						"//data/collection/[objectid=15]": "missing on left",
						"//data/collection/[objectid=26]": "missing on left",
						"//data/collection/[objectid=28]": "missing on left",
						"//data/collection/[objectid=29]": "missing on left",
						"//data/collection/[objectid=590]": "missing on left",
						"//data/collection/[objectid=3184]": "missing on left",
						"//data/collection/[objectid=3185]": "missing on left",
						"//data/collection/[objectid=3187]": "missing on left",
						"//data/collection/[objectid=3188]": "missing on left",
						"//data/collection/[objectid=3203]": "missing on left",
						"//data/collection/[objectid=3204]": "missing on left",
						"//data/collection/": "warning: arrays do not have the same length"
					},
					'e67f2035-8010-3ff5-e399-b9c9217c2366': {
						"//data/collection/[objectid=2994]properties/Other/": "missing on left",
						"//data/collection/[objectid=2995]properties/Other/": "missing on left",
						"//data/collection/[objectid=2996]properties/Other/": "missing on left",
						"//data/collection/[objectid=2997]properties/Other/": "missing on left",
						"//data/collection/[objectid=3003]properties/Other/": "missing on left",
						"//data/collection/[objectid=3004]properties/Other/": "missing on left",
						"//data/collection/[objectid=3013]properties/Other/": "missing on left",
						"//data/collection/[objectid=3014]properties/Other/": "missing on left",
						"//data/collection/[objectid=3015]properties/Other/": "missing on left",
						"//data/collection/[objectid=3074]properties/Other/": "missing on left",
						"//data/collection/[objectid=3084]properties/Other/": "missing on left",
						"//data/collection/[objectid=3088]properties/Other/": "missing on left",
						"//data/collection/[objectid=3124]properties/Other/": "missing on left",
						"//data/collection/[objectid=3147]properties/Other/": "missing on left",
						"//data/collection/[objectid=3212]properties/Other/": "missing on left",
						"//data/collection/[objectid=3236]properties/Other/": "missing on left",
						"//data/collection/[objectid=3270]properties/Graphics/View Scale/": "not equal",
						"//data/collection/[objectid=15]": "missing on left",
						"//data/collection/[objectid=596]": "missing on left",
						"//data/collection/[objectid=1953]": "missing on left",
						"//data/collection/[objectid=1954]": "missing on left",
						"//data/collection/[objectid=1958]": "missing on left",
						"//data/collection/[objectid=1959]": "missing on left",
						"//data/collection/[objectid=3184]": "missing on left",
						"//data/collection/[objectid=3185]": "missing on left",
						"//data/collection/[objectid=3187]": "missing on left",
						"//data/collection/[objectid=3203]": "missing on left",
						"//data/collection/[objectid=3261]": "missing on left",
						"//data/collection/[objectid=3265]": "missing on left",
						"//data/collection/": "warning: arrays do not have the same length"
					},
				},
			},
		},
		ModelIfc: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTW9kZWwuaWZj', // Model.ifc
			guids: [
				'87a2f6e1-9a1f-434f-acfb-6bcaeace1c3d',
			],
			objid: 1,
			diffs: {
				tree: {
					'87a2f6e1-9a1f-434f-acfb-6bcaeace1c3d': {
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=196]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=207]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1971]objects/[objectid=2031]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1971]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6831]objects/[objectid=7342]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6831]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/": "arrays content are different",
						"//data/objects/": "arrays content are different"
					},
				},
				properties: {
					'87a2f6e1-9a1f-434f-acfb-6bcaeace1c3d': 'properties-dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTW9kZWwuaWZj-87a2f6e1-9a1f-434f-acfb-6bcaeace1c3d-accepted.json',
				},
			},
		},
		// dxf: { // rOlB7GtsAOmuvm6XqPAILp83ARMymAfL
		// 	urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS0yMDIxL2FyYWIuZHhm',
		// 	guids: [
		// 		'115d2418-de8a-46bf-852a-b23ef9338de2', // 2d
		// 	],
		// 	objid: 109,
		// 	diffs: {
		// 		'115d2418-de8a-46bf-852a-b23ef9338de2': {},
		// 	},
		// },
	};

	public constructor() {
	}

	private static sleep(milliseconds: number): Promise<any> {
		return (new Promise((resolve: (value?: any) => void) => setTimeout(resolve, milliseconds)));
	}

	private async requestDiff(url: string, message: string, diff: string, fn?: string): Promise<void> {
		try {
			const jobs: Promise<any>[] = [
				superagent('GET', url + '/forge'),
				superagent('GET', url),
			];
			const results: any[] = await Promise.all(jobs);
			const obj0 = JSON.parse(results[0].text);
			const obj1 = JSON.parse(results[1].text); // Automatically sorted :)

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
			if (cmp.areEquals || (diff && diff === cmp.toString())) {
				console.log(`${message} ok`);
			} else {
				console.warn(`${message} `, cmp.toString(4));
				await _fsWriteFile(`${fn}-diff.json`, Buffer.from(cmp.toString(4)));
				console.log(' ');
			}

			// if (fn) {
			// 	await _fsWriteFile(`${fn}-forge.json`, Buffer.from(JSON.stringify(obj0, null, 4)));
			// 	await _fsWriteFile(`${fn}-db.json`, Buffer.from(JSON.stringify(obj1, null, 4)));
			// }
		} catch (ex) {
			console.error(`failed - ${ex.message}`);
		}
	}

	private async request(url: string, message: string, fn?: string): Promise<void> {
		try {
			const jobs: Promise<any>[] = [
				superagent('GET', url),
				superagent('GET', url + '/forge'),
			];
			const results: any[] = await Promise.all(jobs);
			const obj0 = JSON.parse(results[0].text); // Automatically sorted :)
			const obj1 = JSON.parse(results[1].text);

			JsonDiff.sortObjectProperties(obj0, ['objectid']);
			JsonDiff.sortObjectProperties(obj1, ['objectid']);

			console.log(`${message} `, JSON.stringify(obj0, null, 4));

			if (fn) {
				await _fsWriteFile(`${fn}-db.json`, Buffer.from(JSON.stringify(obj0, null, 4)));
				await _fsWriteFile(`${fn}-forge.json`, Buffer.from(JSON.stringify(obj1, null, 4)));
			}
		} catch (ex) {
			console.error(`failed - ${ex.message}`);
		}
	}

	public async help(index: string = ''): Promise<void> {
		console.log(`comamnds: help, list, testall, test <model>, runall, run <model>`)
		this.list();
	}

	public async list(index: string = ''): Promise<void> {
		console.log('models: ', Object.keys(TreePropertiesTestsController.objects));
	}

	public async all(cmd: (index: string) => Promise<void>, index: string = ''): Promise<void> {
		const self = this;

		const runTest = async (model: string): Promise<void> => {
			await self.test(model);
		};

		const runTests = (models: string[]): Promise<void> => {
			return (models.reduce((p, test): Promise<void> => {
				return (p.then((): Promise<void> => runTest(test)));
			}, Promise.resolve())); // initial
		};

		const toTest: string[] = Object.keys(TreePropertiesTestsController.objects);
		await runTests(toTest);
	}

	public async testall(index: string = ''): Promise<void> {
		await this.all(this.test.bind(this), index);
	}

	public async runall(index: string = ''): Promise<void> {
		await this.all(this.run.bind(this), index);
	}

	// public async run(index: string = ''): Promise<void> {
	// 	const models: string[] = Object.keys(TreePropertiesTestsController.objects);
	// 	if (models.indexOf(index) === -1)
	// 		return (console.log(`model ${index} does not exist!`));

	// 	const self = this;
	// 	const urn: string = TreePropertiesTestsController.objects[index].urn;
	// 	const jobs: Promise<void>[] = TreePropertiesTestsController.objects[index].guids.map(async (guid: string): Promise<void> => {
	// 		const diff: string = JSON.stringify(TreePropertiesTestsController.objects.pier9.diffs.tree[guid]);
	// 		return (self.request(`http://localhost:3001/tree/${urn}/guids/${guid}`, `tree ${urn} ${guid}`, diff, _path.resolve(__dirname, `tree-${urn}-${guid}`)));
	// 	});
	// 	await Promise.all(jobs);
	// }

	protected async loadDiffDefinition(ref: any): Promise<string> {
		let diff: string = JSON.stringify(ref);
		try {
			if (typeof ref === 'string') {
				const buffer: Buffer = await _fsReadFile(_path.resolve(__dirname, ref));
				diff = JSON.stringify(JSON.parse(buffer.toString('utf8')));
			}
		} catch (ex) { }
		return (diff);
	}

	public async test(index: string = ''): Promise<void> {
		const self = this;
		const models: string[] = Object.keys(TreePropertiesTestsController.objects);
		if (models.indexOf(index) === -1)
			return (console.log(`model ${index} does not exist!`));

		const model: any = TreePropertiesTestsController.objects[index];
		const urn: string = model.urn;

		const runTest = async (test: TestParams): Promise<void> => {
			console.log(`Model\n  urn  = ${test.urn}\n  guid = ${test.guid}\n`);
			let diff: string = await self.loadDiffDefinition(TreePropertiesTestsController.objects[test.model].diffs.tree[test.guid]);
			await self.requestDiff(
				`http://localhost:3001/tree/${test.urn}/guids/${test.guid}`,
				`  => Tree: `,
				diff,
				_path.resolve(__dirname, `tree-${test.urn}-${test.guid}`)
			);

			diff = await self.loadDiffDefinition(TreePropertiesTestsController.objects[test.model].diffs.properties[test.guid]);
			await self.requestDiff(
				`http://localhost:3001/properties/${test.urn}/guids/${test.guid}`,
				`  => Properties: `,
				diff,
				_path.resolve(__dirname, `properties-${test.urn}-${test.guid}`)
			);
			console.log(' ');
		};

		const runTests = (tests: TestParams[]): Promise<void> => {
			return (tests.reduce((p, test): Promise<void> => {
				return (p.then((): Promise<void> => runTest(test)));
			}, Promise.resolve())); // initial
		};

		const toTest: TestParams[] = model.guids.map((guid: string): TestParams => {
			return ({
				model: index,
				urn: urn,
				guid: guid,
				diff: model.diffs[guid],
			});
		});
		await runTests(toTest);
	}

	public async run(index: string = ''): Promise<void> {
		const self = this;
		const models: string[] = Object.keys(TreePropertiesTestsController.objects);
		if (models.indexOf(index) === -1)
			return (console.log(`model ${index} does not exist!`));

		const model: any = TreePropertiesTestsController.objects[index];
		const urn: string = model.urn;

		const runTest = async (test: TestParams): Promise<void> => {
			console.log(`Model\n  urn  = ${test.urn}\n  guid = ${test.guid}`);
			await self.request(
				`http://localhost:3001/tree/${test.urn}/guids/${test.guid}`,
				`  => Tree: `,
				_path.resolve(__dirname, `tree-${test.urn}-${test.guid}`)
			);
			await self.request(
				`http://localhost:3001/properties/${test.urn}/guids/${test.guid}`,
				`  => Properties: `,
				_path.resolve(__dirname, `properties-${test.urn}-${test.guid}`)
			);
			console.log(' ');
		};

		const runTests = (tests: TestParams[]): Promise<void> => {
			return (tests.reduce((p, test): Promise<void> => {
				return (p.then((): Promise<void> => runTest(test)));
			}, Promise.resolve())); // initial
		};

		const toTest: TestParams[] = model.guids.map((guid: string): TestParams => {
			return ({
				model: index,
				urn: urn,
				guid: guid,
				diff: model.diffs[guid],
			});
		});
		await runTests(toTest);
	}

}


const run = async (fctName: string, index: string) => {
	const controller: TreePropertiesTestsController = new TreePropertiesTestsController();
	const fct = (controller as any)[fctName || 'help'];
	if (fct)
		await (fct.bind(controller))(index);

	process.exit(0);
};

run(process.argv[2], process.argv[3] || '0');