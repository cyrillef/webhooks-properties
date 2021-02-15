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

import * as bodyParser from 'body-parser';
//import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import Controller from '../interfaces/controller';
import errorMiddleware from '../middlewares/error';
import compressionMiddleware from '../middlewares/should-compress';
//import * as mongoose from 'mongoose';
import AppSettings from './app-settings';
import Forge2Legged from './forge-oauth-2legged';
import ForgeViewerProxy from './forge-proxy';

class ExpressApp {
	public app: express.Application;
	public oauth: Forge2Legged;

	constructor(controllers: Controller[]) {
		this.app = express();

		this.initializeForge2legged();
		this.connectDatabase();
		this.initializeMiddlewares();
		this.initializeControllers(controllers);
		this.initializeErrorHandling();
		this.initializeStaticPath();
		this.initializeForgeProxy();
	}

	public listen(): void {
		const self = this;
		this.app
			.listen(AppSettings.PORT, () => console.log(`Listening on port ${AppSettings.PORT}`))
			.on('error', (error: any) => {
				if (error.errno === 'EACCES')
					console.warn(`Port ${AppSettings.PORT} already in use.\nExiting...`);
				else
					console.error(error);
				process.exit(1);
			});
	}

	public getServer(): express.Application {
		return (this.app);
	}

	public getOAuth(): Forge2Legged {
		return (this.oauth);
	}

	private initializeForge2legged(): void {
		Forge2Legged.Instance ('main', AppSettings.main);
	}

	private initializeMiddlewares(): void {
		if (this.app.get('env') === 'production')
			this.app.set('trust proxy', 1); // trust first proxy
		//this.app.use(bodyParser.json());
		this.app.use(bodyParser.json({
			verify: (req: IncomingMessage, res: ServerResponse, buf: Buffer, encoding: string) => {
				(req as any).rawBody = buf;
			}
		}));
		this.app.use(bodyParser.urlencoded({ extended: true }));
		//this.app.use(cookieParser());
		this.app.use(compressionMiddleware);
	}

	private initializeControllers(controllers: Controller[]): void {
		const self = this;
		controllers.forEach((controller) => {
			self.app.use('/', controller.router);
		});
	}

	private initializeErrorHandling(): void {
		this.app.use(errorMiddleware);
	}

	private initializeStaticPath(): void {
		this.app.use('/', express.static('./www'));
		if (this.app.get('env') !== 'production')
			//this.app.use('/src/client', express.static('/src/client'));
			this.app.use('/src/client', express.static('./src/client'));
	}

	private initializeForgeProxy(): void {
		this.app.get('/forge-proxy/*', ForgeViewerProxy.buildProxy);
	}

	private connectDatabase(): void {
		//mongoose.connect(`mongodb://${AppSettings.MONGO_USER}:${AppSettings.MONGO_PASSWORD}${AppSettings.MONGO_PATH}`);
	}

}

export default ExpressApp;