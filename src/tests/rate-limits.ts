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

import * as moment from 'moment';
import * as Forge from 'forge-apis';
import AppSettings from './app-settings';

class RateLimitsTestsController {

	public static readonly DEFAULT_PROFILE: string = 'master';
	public static readonly DEFAULT_GUID: number = 0;

	public static readonly LEVEL0: number = 14000;
	public static readonly LEVEL1: number = 2000;
	public static readonly LEVEL2: number = 500;
	public static readonly LEVEL3: number = 200;
	public static readonly LEVEL4: number = 100;
	public static readonly LEVEL5: number = 60;

	public static readonly WAIT: number = 0;

	public static objects: any = {
		master: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTWFzdGVyJTIwLSUyMFBsYW50M0QuZHdn',
			guids: [
				'b7bb12b1-f832-5005-ca30-a0e6b00f9da5', // 2d
				'e30bd031-d13a-a976-9153-78100829986a', // 3d
			],
			objid: 24,
			objids: [/*1st level*/24, /*2nd level*/44735, /*3rd level*/481, 324, 300, 195, 199, 504, 656, 494],
		},
		dxf: { // rOlB7GtsAOmuvm6XqPAILp83ARMymAfL
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS0yMDIxL2FyYWIuZHhm',
			guids: [
				'115d2418-de8a-46bf-852a-b23ef9338de2', // 2d
			],
			objid: 109,
			objids: [/*1st level*/109, /*2nd level*/19451, 19450, /*3rd level -1*/4099, 4102, 4103, 254, /*3rd level -2*/253, 4093, 4094, 4095], // and many more
		},
	};
	private runObject: any = null;

	private oauth: Forge.AuthClientTwoLegged = null;

	public constructor(oauth: Forge.AuthClientTwoLegged) {
		//this.initializeRoutes();
		this.oauth = oauth;
		this.setRunObject(RateLimitsTestsController.DEFAULT_PROFILE, RateLimitsTestsController.DEFAULT_GUID);
	}

	// private initializeRoutes(): void {
	// 	if (this.expressApp.app.get('env') === 'production')
	// 		//if (process.env.NODE_ENV === 'production')
	// 		return;
	// 	this.router.get(this.path, this.tests.bind(this));
	// 	this.router.get(`${this.path}/test1`, this.test1.bind(this));
	// 	this.router.get(`${this.path}/test2`, this.test2.bind(this));
	// 	this.router.get(`${this.path}/test3`, this.test3.bind(this));
	// 	this.router.get(`${this.path}/test4`, this.test4.bind(this));
	// 	this.router.get(`${this.path}/test5`, this.test5.bind(this));
	// 	this.router.get(`${this.path}/test6`, this.test6.bind(this));
	// 	this.router.get(`${this.path}/test7`, this.test7.bind(this));

	// 	this.router.get(`${this.path}/test9`, this.test9.bind(this));
	// }

	public setRunObject(profile: string, guidIndex: number = 0) {
		this.runObject = RateLimitsTestsController.objects[profile];
		this.runObject.runGUID = this.runObject.guids[guidIndex];
	}

	private async runTest(label: string, limit: number, generator: any): Promise<void> {
		let started: moment.Moment = null;
		try {
			const jobs: Promise<Forge.ApiResponse>[] = new Array(limit);
			started = moment();
			// Generate X requests to stress rate limit scenario
			for (let i = 0; i < limit; i++)
				jobs[i] = generator();
			const results: Forge.ApiResponse[] = await Promise.all(jobs);
			const tps = moment.duration(moment().diff(started)).as('seconds').toString();
			// Check status code
			let st: string = '';
			const non200Codes: number[] = results.filter((elt: Forge.ApiResponse): boolean => elt.statusCode !== 200).map((elt: Forge.ApiResponse): number => elt.statusCode);
			//const non20xCodes: number[] = non200Codes.filter((elt: number): boolean => elt < 200 || elt >= 300);
			if (non200Codes.length > 0) {
				const unique: number[] = Array.from(new Set<number>(non200Codes.sort()));
				const sts = unique.map((elt: number): string => {
					const count: number = non200Codes.reduce((acc: number, cur: number): number => { if (cur === elt) acc++; return (acc); }, 0);
					return (`${elt} (${count})`);
				});
				st = sts.join(' ');
				//st = non20xCodes.map((elt: Forge.ApiResponse): number => elt.statusCode).join(' ');
			}

			console.log(`Successfuly requested ${label} ${results.length} times in ${tps} seconds \n${st}`);
		} catch (ex) {
			const tps = moment.duration(moment().diff(started)).as('seconds').toString();
			console.log(`Failed after ${tps} seconds`);
			// If any non 20x status code is returned, we endup here
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private static sleep(milliseconds: number): Promise<any> {
		return (new Promise((resolve: (value?: any) => void) => setTimeout(resolve, milliseconds)));
	}

	private async runTestUntilSuccess(label: string, limit: number, generator: any): Promise<void> {
		let started: moment.Moment = null;
		try {
			started = moment();
			let count: number = 0;
			let result: Forge.ApiResponse = null;
			let keepGoing: boolean = true;
			while (keepGoing) {
				count++;
				result = await generator();
				const tps = moment.duration(moment().diff(started)).as('seconds').toString();
				switch (result.statusCode) {
					case 200:
					case 201:
						keepGoing = false;
						break;
					case 429:
						//await RateLimitsTestsController.sleep(20000); // 20 seconds?
						keepGoing = false;
						break;
					case 202:
						if (RateLimitsTestsController.WAIT > 0)
							await RateLimitsTestsController.sleep(RateLimitsTestsController.WAIT);
						break;
					default:
						keepGoing = false;
						break
				}
			};
			const tps = moment.duration(moment().diff(started)).as('seconds').toString();
			if (!result || result.statusCode !== 200) {
				console.log(`Request ${label} failed after ${count} tries in ${tps} seconds`);
			} else {
				console.log(`Successfuly requested ${label} after ${count} tries in ${tps} seconds`);
			}
		} catch (ex) {
			const tps = moment.duration(moment().diff(started)).as('seconds').toString();
			console.log(`Failed after ${tps} seconds`);
			// If any non 20x status code is returned, we endup here
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	public async test1(): Promise<void> {
		const self = this;
		const oauth: Forge.AuthClientTwoLegged = this.oauth;
		const token: Forge.AuthToken = oauth.getCredentials();
		const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, Forge.DerivativesApi.RegionEnum.US);

		await this.runTest(
			'the manifest',
			RateLimitsTestsController.LEVEL3,
			() => api.getManifest(self.runObject.urn, null, oauth, token)
		);
	}

	public async test2(): Promise<void> {
		const self = this;
		const oauth: Forge.AuthClientTwoLegged = this.oauth;
		const token: Forge.AuthToken = oauth.getCredentials();
		const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, Forge.DerivativesApi.RegionEnum.US);

		// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
		// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
		//                     Possible values: true, false. The the implicit value is false.
		await this.runTest(
			'the object tree (forceget to default)',
			RateLimitsTestsController.LEVEL3,
			() => api.getModelviewMetadata(self.runObject.urn, self.runObject.runGUID, null, oauth, token)
		);
	}

	public async test3(): Promise<void> {
		const self = this;
		const oauth: Forge.AuthClientTwoLegged = this.oauth;
		const token: Forge.AuthToken = oauth.getCredentials();
		const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, Forge.DerivativesApi.RegionEnum.US);

		// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
		// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
		//                     Possible values: true, false. The the implicit value is false.
		await this.runTest(
			'the object tree (forceget to true)',
			RateLimitsTestsController.LEVEL3,
			() => api.getModelviewMetadata(self.runObject.urn, self.runObject.runGUID, { forceget: true }, oauth, token)
		);
	}

	public async test4(): Promise<void> {
		const self = this;
		const oauth: Forge.AuthClientTwoLegged = this.oauth;
		const token: Forge.AuthToken = oauth.getCredentials();
		const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, Forge.DerivativesApi.RegionEnum.US);

		// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
		// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
		//                     Possible values: true, false. The the implicit value is false.
		await this.runTest(
			'properties (forceget to default)',
			RateLimitsTestsController.LEVEL3,
			() => api.getModelviewProperties(self.runObject.urn, self.runObject.grunGUID, null, oauth, token)
		);
	}

	public async test5(): Promise<void> {
		const self = this;
		const oauth: Forge.AuthClientTwoLegged = this.oauth;
		const token: Forge.AuthToken = oauth.getCredentials();
		const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, Forge.DerivativesApi.RegionEnum.US);

		// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
		// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
		//                     Possible values: true, false. The the implicit value is false.
		await this.runTest(
			'properties (forceget to true)',
			RateLimitsTestsController.LEVEL3,
			() => api.getModelviewProperties(self.runObject.urn, self.runObject.runGUID, { forceget: true }, oauth, token)
		);
	}

	public async test6(): Promise<void> {
		const self = this;
		const oauth: Forge.AuthClientTwoLegged = this.oauth;
		const token: Forge.AuthToken = oauth.getCredentials();
		const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, Forge.DerivativesApi.RegionEnum.US);

		// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
		// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
		//                     Possible values: true, false. The the implicit value is false.
		await this.runTest(
			'1 object properties (forceget to default)',
			RateLimitsTestsController.LEVEL3,
			() => api.getModelviewProperties(self.runObject.urn, self.runObject.runGUID, { objectid: self.runObject.objid }, oauth, token)
		);
	}

	public async test7(): Promise<void> {
		const self = this;
		const oauth: Forge.AuthClientTwoLegged = this.oauth;
		const token: Forge.AuthToken = oauth.getCredentials();
		const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, Forge.DerivativesApi.RegionEnum.US);

		// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
		// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
		//                     Possible values: true, false. The the implicit value is false.
		await this.runTest(
			'1 object properties (forceget to true)',
			RateLimitsTestsController.LEVEL3,
			() => api.getModelviewProperties(self.runObject.urn, self.runObject.runGUID, { forceget: true, objectid: self.runObject.objid }, oauth, token)
		);
	}

	public async test9(): Promise<void> {
		const self = this;
		const oauth: Forge.AuthClientTwoLegged = this.oauth;
		const token: Forge.AuthToken = oauth.getCredentials();
		const api: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, Forge.DerivativesApi.RegionEnum.US);

		// Rate Limit        - 60 calls per minute for force getting large resource - Otherwise engineering said it is 14.000
		// forceget {string} - To force get the large resource even if it exceeded the expected maximum length(20 MB).
		//                     Possible values: true, false. The the implicit value is false.
		await this.runTestUntilSuccess(
			'1 object properties (forceget to true) until success',
			RateLimitsTestsController.LEVEL3,
			() => api.getModelviewProperties(self.runObject.urn, self.runObject.runGUID, { forceget: true, objectid: self.runObject.objid }, oauth, token)
		);
	}

}

const run = async (fctName: string, profile: string) => {
	if (!Object.keys(RateLimitsTestsController.objects).includes(profile))
		return;

	const internalClient: Forge.AuthClientTwoLegged = new Forge.AuthClientTwoLegged(
		AppSettings.main.forgeClientId,
		AppSettings.main.forgeClientSecret,
		AppSettings.main.forgeScope.internal.split(' ').map((elt: string) => (elt as Forge.Scope)),
		true
	);

	const authenticate = async (): Promise<void> => {
		await internalClient.authenticate();
		setTimeout(authenticate, (internalClient.getCredentials().expires_in - 300) * 100); // -5min
	};
	await authenticate();

	const controller: RateLimitsTestsController = new RateLimitsTestsController(internalClient);
	controller.setRunObject(profile, 0);
	const fct = (controller as any)[fctName];
	await (fct.bind(controller))();
	process.exit(0);
};

console.log(process.argv);
if (process.argv.length < 4)
	process.exit(1);
run(process.argv[2], process.argv[3]);