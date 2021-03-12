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

import { NextFunction, Request, Response, Router } from 'express';
import Controller from '../interfaces/controller';
import * as Forge from 'forge-apis';
import Forge2Legged from '../server/forge-oauth-2legged';
import AppSettings from '../server/app-settings';
import * as crypto from 'crypto';
import SvfProperties from '../properties/svf-properties';
import ExpressApp from '../server/express-server';

export class WebHooksController implements Controller {

	public path: string = '/webhooks';
	public router: Router = Router();
	public expressApp: ExpressApp = null;
	private scope: string = 'webhooks-properties';
	private webhooksToken: string = AppSettings.main.forgeWebhooksToken;

	public constructor(expressApp: ExpressApp) {
		this.expressApp = expressApp;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {
		// extraction.updated / extraction.finished
		this.router.post(
			this.path,
			this.verifySignatureMiddleware.bind(this),
			this.modelDerivativesEvents.bind(this)
		);

		this.router.post(`${this.path}/setup`, this.modelDerivativesSetup.bind(this));
		this.router.get(`${this.path}/setup`, this.modelDerivativesList.bind(this));
		this.router.delete(`${this.path}/setup`, this.modelDerivativesDelete.bind(this));

		if (this.expressApp.app.get('env') !== 'production') {
		//if (process.env.NODE_ENV !== 'production') {
			this.router.get(`${this.path}/setup-create`, this.modelDerivativesSetup.bind(this));
			this.router.get(`${this.path}/setup-delete`, this.modelDerivativesDelete.bind(this));
			this.router.get(`${this.path}/setup-test`, this.modelDerivativesTest.bind(this));
		}
	}

	private verifySignatureMiddleware(request: Request, response: Response, next: NextFunction): void {
		if (!this.webhooksToken)
			return (next());
		const signature: string | string[] = request.headers['x-adsk-signature'];
		if (!signature)
			return (console.error('No Hook signature present!'), next());
		// const body: string = JSON.stringify(request.body, null, 2)
		// 	.replace(/\[\]/g, '[ ]')
		// 	.replace(/": /g, '" : ');
		const body: string = (request as any).rawBody.toString('utf8');
		const hmac: any = crypto.createHmac('sha1', this.webhooksToken);
		const calcSignature: string = 'sha1hash=' + hmac.update(body).digest('hex');
		//console.log(`calcSignature=${calcSignature}\n              ${signature}`);
		(request as any).signature_match = (calcSignature === signature);
		console.log(`Hook signature present and ${calcSignature === signature ? 'verified' : 'invalid'}`);
		next();
	}

	private async modelDerivativesEvents(request: Request, response: Response): Promise<any> {
		// When the event occurs, the webhooks service sends a payload to the callback URL as an HTTP POST request.
		// The webhook service expects a 2xx response to the HTTP POST request.The response must be received within 6 seconds.
		// A non - 2xx response or no response within 6 seconds is considered an error.
		//
		// When there is no error from the registered callback URL, the Webhooks service guarantees at least once delivery.
		// In the event of an error, the call will be retried four times, with the final attempt being at least 48 hours after the initial attempt.
		// If last retry attempt fails, the webhook will be disabled and it will need to be re-enabled using PATCH systems /:system/events/:event/hooks/:hook_id.

		if (this.webhooksToken && !(request as any).signature_match)
			return (response.status(403).send('Not geniune webhook call'));

		response.status(204).send();

		// Proceed now
		//console.log (JSON.stringify(request.body, null, 4));
		const hook: any = request.body.hook;
		if (hook.tenant !== this.scope || !hook.scope || hook.scope.workflow !== this.scope)
			return;
		const st: string = 'modelDerivatives' + hook.event
			.split('.')
			.map((elt: string): string => elt[0].toUpperCase() + elt.substring(1))
			.join('');
		(this as any)[st](request, response);
		//(((this as any)[st]).bind(this))(request, response);
		//(this as any)[st].apply(this, [request, response]);
	}

	private async modelDerivativesExtractionUpdated(request: Request, response: Response): Promise<void> {
		try {
			// If we have a need for updates, we could send a socket.io message to clients
			// or pull the manifest for intermedaite resources becoming avalable and start processing data

			const payload: any = request.body.payload;
			// payload.EventType === 'UPDATED';

			// payload.Payload.status;
			// payload.Payload.bubble.status;
			// payload.Payload.bubble.success;
			// payload.Payload.bubble.progress;

			if (payload.Payload.status !== 'success')
				return;

			const urn: string = payload.URN;

			// The file list for property database files is fixed, no need to go to the server to find out
			// const dbFiles: string[] = [
			// 	'objects_offs.json.gz',
			// 	'objects_avs.json.gz',
			// 	'objects_vals.json.gz',
			// 	'objects_attrs.json.gz',
			// 	'objects_ids.json.gz',
			// ];
			const dbFiles: string[] = SvfProperties.dbNames;
			// `urn:adsk.viewing:fs.file:${urn}/output/objects_attrs.json.gz`
			// `urn:adsk.viewing:fs.file:${urn}/${derivativePath}`
			const paths: string[] = dbFiles.map((fn: string): string => `urn:adsk.viewing:fs.file:${urn}/output/${fn}.json.gz`);

			// Let's get the derivatives we want
			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;
			const md: Forge.DerivativesApi = new Forge.DerivativesApi(undefined, payload.Payload.bubble.region);
			const jobs: Promise<Forge.ApiResponse>[] = paths.map((elt: string): Promise<Forge.ApiResponse> => md.getDerivativeManifest(urn, elt, null, oauth.internalClient, token));
			const results: Forge.ApiResponse[] = await Promise.all(jobs);
			const dbBuffers: Buffer[] = results.map((elt: Forge.ApiResponse): Buffer => elt.body);

			const propsDb = new SvfProperties();
			await propsDb.load(dbBuffers);

			// Ready to get properties
			const test14 = propsDb.read(481, false, false);
			console.log (JSON.stringify(test14, null, 4));

			const test199 = propsDb.read(199, false, false);
			console.log(JSON.stringify(test199, null, 4));

			const test14all = propsDb.read(24, false, false); // get internal properties too
			console.log(JSON.stringify(test14all, null, 4));

			console.log('ok');

		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async modelDerivativesExtractionFinished(request: Request, response: Response): Promise<void> {
		const payload: any = request.body.payload;
		// payload.EventType === 'EXTRACTION_FINISHED';


	}

	private async modelDerivativesSetup(request: Request, response: Response): Promise<void> {
		try {
			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;

			const TokensApi: Forge.TokensApi = new Forge.TokensApi(undefined, Forge.TokensApi.RegionEnum.US);
			if (this.webhooksToken)
				await TokensApi.CreateToken(this.webhooksToken, null/*{ xAdsRegion: Forge.TokensApi.RegionEnum.US } as Forge.TokensApi.TokensOptions*/, oauth.internalClient, token);

			const api: Forge.WebhooksApi = new Forge.WebhooksApi(undefined, Forge.WebhooksApi.RegionEnum.US);
			const url: string = `${AppSettings.main.forgeWebhooks}${this.path}`;
			const hook: Forge.ApiResponse = await api.CreateSystemHook(
				Forge.WebhooksApi.WebhooksSystemEnum.derivative,
				url,
				{
					workflow: this.scope
				},
				null, //{ xAdsRegion: Forge.WebhooksApi.RegionEnum.US } as Forge.WebhooksApi.HooksOptions,
				oauth.internalClient,
				token
			);
			console.log(JSON.stringify(hook, null, 4));

			response.status(200).end();
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async listWebhooks(regions?: string | string[]): Promise<{ [index: string]: any[] }> {
		const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
		const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;

		regions = regions || [Forge.WebhooksApi.RegionEnum.US, Forge.WebhooksApi.RegionEnum.EMEA];
		if (typeof regions === 'string')
			regions = [regions];

		const api: Forge.WebhooksApi = new Forge.WebhooksApi();
		const proceed = async (region: string): Promise<any[]> => {
			let results: any[] = [];
			while (true) {
				const jobs: Forge.ApiResponse = await api.GetHooks({ xAdsRegion: region } as Forge.WebhooksApi.HooksOptions, oauth.internalClient, token);
				results = [...results, ...jobs.body.data];
				if (!jobs.body.links || !jobs.body.links.next || jobs.body.links.next === null)
					break;
			}
			return (results);
		}

		const jobs: Promise<any[]>[] = regions.map((region: string): Promise<any[]> => (proceed(region)));
		const results: any[] = await Promise.all(jobs);
		const data: { [index: string]: any[] } = {};
		regions.map((region: string, index: number): any => { data[region] = results[index]; });
		return (data);
	}

	private async modelDerivativesList(request: Request, response: Response): Promise<void> {
		try {
			const data: { [index: string]: any[] } = await this.listWebhooks();
			response.json(data);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async modelDerivativesDelete(request: Request, response: Response): Promise<void> {
		try {
			const self = this;
			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;

			const TokensApi: Forge.TokensApi = new Forge.TokensApi(undefined, Forge.TokensApi.RegionEnum.US);
			if (this.webhooksToken)
				await TokensApi.DeleteToken(null/*{ xAdsRegion: Forge.TokensApi.RegionEnum.US } as Forge.TokensApi.TokensOptions*/, oauth.internalClient, token);

			const api: Forge.WebhooksApi = new Forge.WebhooksApi(undefined, Forge.WebhooksApi.RegionEnum.US);
			const data: { [index: string]: any[] } = await this.listWebhooks(Forge.WebhooksApi.RegionEnum.US);
			data.US.forEach(/*async*/(hook: any): void => {
				if (hook.tenant === self.scope && hook.scope && hook.scope.workflow === self.scope)
					/*await*/ api.DeleteHook(
					Forge.WebhooksApi.WebhooksSystemEnum.derivative,
					hook.event,
					hook.hookId,
					null, //{ xAdsRegion: Forge.WebhooksApi.RegionEnum.US } as Forge.WebhooksApi.HooksOptions,
					oauth.internalClient,
					token
				);
			});
			response.status(202).end();
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

	private async modelDerivativesTest(request: Request, response: Response): Promise<void> {
		try {
			const self = this;
			const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
			const token: Forge.AuthToken = oauth.internalToken as Forge.AuthToken;

			const api: Forge.DerivativesApi = new Forge.DerivativesApi();
			const payload = {
				input: {
					urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTWFzdGVyJTIwLSUyMFBsYW50M0QuZHdn' // 'objectKey': 'Master - Plant3D.dwg'
				},
				output: {
					destination: {
						region: Forge.DerivativesApi.RegionEnum.US
					},
					formats: [{
						type: 'svf',
						views: [
							'2d',
							'3d'
						]
					}]
				},
				misc: {
					workflow: this.scope
				}
			};
			const result: Forge.ApiResponse = await api.translate(
				payload as Forge.JobPayload,
				{ xAdsForce: true },
				oauth.internalClient,
				token
			);

			//response.status(202).end();
			response.status(202).json(result);
		} catch (ex) {
			console.error(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
			response.status(ex.statusCode || 500).send(ex.message || ex.statusMessage || `${ex.statusBody.code}: ${JSON.stringify(ex.statusBody.detail)}`);
		}
	}

}

export default WebHooksController;