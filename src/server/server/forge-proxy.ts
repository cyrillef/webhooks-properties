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

import { NextFunction, Request, Response } from 'express';
import * as _path from 'path';
import * as https from 'https';
import { IncomingHttpHeaders } from 'http';
import Forge2Legged from '../server/forge-oauth-2legged';
import { IncomingMessage, ServerResponse } from 'http';

export class ForgeViewerProxy {

	protected static apiEndpoint: string = 'developer.api.autodesk.com';

	protected EXTENSIONS: { [index: string]: string[] } = {
		gzip: ['.json.gz', '.bin', '.pack'],
		json: ['.json.gz', '.json']
	};

	protected WHITE_LIST: string[] = [
		'if-modified-since',
		'if-none-match',
		'accept-encoding',
		'x-ads-acm-namespace', // Forge Data Management API
		'x-ads-acm-check-groups' // Forge Data Management API
	];

	protected endpoint: string;
	protected authHeaders: NodeJS.Dict<string | string[]>;

	constructor(endpoint: string, access_token: string) {
		this.authHeaders = { Authorization: 'Bearer ' + access_token };
		this.endpoint = endpoint;
	}

	public static buildProxy(req: Request, res: Response, next: NextFunction): void {
		const url = req.url.replace(/^\/forge\-proxy/gm, '');
		const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
		const proxy = new ForgeViewerProxy(ForgeViewerProxy.apiEndpoint, oauth.externalToken.access_token);
		proxy.request(req, res, url);
	}

	protected hasExtension(filename: string, ext: string): boolean {
		return (_path.extname(filename) === ext);
	}

	protected fixContentHeaders(req: IncomingMessage, res: ServerResponse): void {
		// DS does not return content-encoding header for gzip and other files that we know are gzipped, so we add it here.
		// The viewer does want gzip files uncompressed by the browser
		if (this.EXTENSIONS.gzip.indexOf(_path.extname(req.url)) > -1)
			res.setHeader ('content-encoding', 'gzip');
		if (this.EXTENSIONS.json.indexOf(_path.extname(req.url)) > -1)
			res.setHeader('content-type', 'application/json');
	}

	protected setCORSHeaders(res: ServerResponse): void {
		res.setHeader('access-control-allow-origin', '*');
		res.setHeader('access-control-allow-credentials', 'false');
		res.setHeader('access-control-allow-headers', 'Origin, X-Requested-With, Content-Type, Accept');
	}

	protected proxyClientHeaders(clientHeaders: IncomingHttpHeaders, upstreamHeaders: NodeJS.Dict<string | string[]>): void {
		for (let i = 0; i < this.WHITE_LIST.length; i++) {
			if (clientHeaders.hasOwnProperty(this.WHITE_LIST[i]))
				upstreamHeaders[this.WHITE_LIST[i]] = clientHeaders[this.WHITE_LIST[i]];
		}
		// Fix for OSS issue not accepting the etag surrounded with double quotes...
		if (upstreamHeaders.hasOwnProperty('if-none-match'))
			upstreamHeaders['if-none-match'] = (upstreamHeaders['if-none-match'] as string).replace(/^"{1}|"{1}$/gm, '');
	}

	protected request(req: IncomingMessage, res: ServerResponse, url: string) {
		const self = this;
		const options = {
			host: this.endpoint,
			port: 443,
			path: url,
			method: 'GET', // only proxy GET
			headers: this.authHeaders
		};
		this.proxyClientHeaders(req.headers, options.headers);
		const creq = https.request(options, (cres: any) => {
			// Set encoding
			//cres.setEncoding('utf8') ;
			Object.keys(cres.headers).forEach((key: string) => res.setHeader(key, cres.headers[key]));
			self.setCORSHeaders(res);
			self.fixContentHeaders(req, res);
			res.writeHead(cres.statusCode);
			cres.pipe(res);
			cres.on('error', (err: any) => {
				// We got an error, return error 500 to the client
				console.error(err.message);
				res.end();
			});
		});
		creq.end();
	}

}

export default ForgeViewerProxy;