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

import { Request, Response, Router } from 'express';
import * as moment from 'moment';
import Controller from '../interfaces/controller';
import Forge2Legged from '../server/forge-oauth-2legged';

class OAuth2leggedController implements Controller {

	public path = '/token';
	public router = Router();

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get(`${this.path}`, this.returnExternalToken);
	}

	private returnExternalToken = async (request: Request, response: Response) => {
		// At this moment, we know the 'main' token configuration object exists
		const oauth: Forge2Legged = Forge2Legged.Instance('main', {});
		if (oauth && oauth.externalToken && oauth.externalToken.access_token) {
			const token: { [index: string]: any } = oauth.externalToken as object;
			const expires_in = parseInt(moment.duration(moment(token.expires_at).diff(moment())).as('seconds').toString());
			response.json({ access_token: oauth.externalToken.access_token, expires_in: expires_in });
		} else {
			response.json({});
		}
	}

}

export default OAuth2leggedController;