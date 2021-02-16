// //
// // Copyright (c) Autodesk, Inc. All rights reserved
// //
// // Permission to use, copy, modify, and distribute this software in
// // object code form for any purpose and without fee is hereby granted,
// // provided that the above copyright notice appears in all copies and
// // that both that copyright notice and the limited warranty and
// // restricted rights notice below appear in all supporting
// // documentation.
// //
// // AUTODESK PROVIDES THIS PROGRAM 'AS IS' AND WITH ALL FAULTS.
// // AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// // MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// // DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// // UNINTERRUPTED OR ERROR FREE.
// //

// import { Request, Response } from 'express';
// import * as moment from 'moment';
// import * as ForgeAPI from 'forge-apis';
// import AppSettings from './app-settings';

// class Forge_oauth {

// 	static get settings() {
// 		return (AppSettings);
// 	}

// 	static get client() {
// 		return (new ForgeAPI.AuthClientThreeLegged(Forge_oauth.settings.forgeClientId, Forge_oauth.settings.forgeClientSecret, Forge_oauth.settings.forgeCallback, Forge_oauth.settings.forgeScope.scope.split(' '), true));
// 	}

// 	static get clientMe() {
// 		return (new ForgeAPI.UserProfileApi());
// 	}

// 	static getCredentials(request: Request) {
// 		const session = request.session;
// 		return (session.forge);
// 	}

// 	static setCredentials(request: Request, credentials) {
// 		if (!credentials) {
// 			// request.session.destroy((err) => {
// 			//	// cannot access session here
// 			//	console.log ('cleared credentials');
// 			// });
// 			request.session.forge = undefined;
// 		} else {
// 			request.session.forge = credentials;
// 			//request.session.save ((err) => {});
// 		}
// 	}

// 	static _3legged_authorize(state: string) {
// 		const oa3Legged = Forge_oauth.client;
// 		// Generate a URL page that asks for permissions for the specified scopes.
// 		return (oa3Legged.generateAuthUrl(state));
// 	}

// 	static _3legged_refresh(req) {
// 		return (new Promise((fulfill, reject) => {
// 			const oa3Legged = Forge_oauth.client;
// 			const credentials = Forge_oauth.getCredentials(req);
// 			oa3Legged.refreshToken(credentials)
// 				.then((_credentials) => {
// 					Forge_oauth.setCredentials(req, _credentials);
// 					fulfill(oa3Legged);
// 				})
// 				.catch((error) => {
// 					Forge_oauth.setCredentials(req, undefined);
// 					console.error('Failed to refresh your credentials', error);
// 					reject(error);
// 				});
// 		}));
// 	}

// 	static _3legged_code(req, code) {
// 		return (new Promise((fulfill, reject) => {
// 			const oa3Legged = Forge_oauth.client;
// 			let _credentials = null;
// 			oa3Legged.getToken(code)
// 				.then((credentials) => {
// 					_credentials = credentials;
// 					return (Forge_oauth.clientMe.getUserProfile(oa3Legged, _credentials));
// 				})
// 				.then((profile) => {
// 					if (!profile.body.emailId.endsWith('@autodesk.com') || !profile.body.emailVerified)
// 						return (reject({ statusCode: 401, message: 'Not Authorized' }));
// 					Forge_oauth.setCredentials(req, _credentials);
// 					fulfill(oa3Legged);
// 				})
// 				.catch((error) => {
// 					Forge_oauth.setCredentials(req, undefined);
// 					console.error('Failed to get your credentials', error);
// 					reject(error);
// 				});
// 		}));
// 	}

// 	static _3legged_release(request: Request) {
// 		Forge_oauth.setCredentials(request, undefined);
// 		console.error('Your 3 legged token has been released!');
// 	}

// 	static expired(expires_at) {
// 		return (moment(expires_at) <= moment());
// 	}

// 	static getOauth3Legged(request: Request) {
// 		return (new Promise((fulfill, reject) => {
// 			const credentials = Forge_oauth.getCredentials(rrequesteq);
// 			const oa3Legged = Forge_oauth.client;
// 			// Try to refresh the token using its refresh_token
// 			if (!credentials || Forge_oauth.expired(credentials.expires_at)) {
// 				oa3Legged.refreshToken(credentials)
// 					.then((_credentials) => {
// 						oa3Legged.credentials = _credentials;
// 						Forge_oauth.setCredentials(request, _credentials);
// 						fulfill(oa3Legged);
// 					})
// 					.catch((error) => {
// 						Forge_oauth.setCredentials(request, undefined);
// 						console.error('Failed to refresh your credentials', error);
// 						reject(error);
// 					});
// 			} else {
// 				oa3Legged.credentials = credentials;
// 				fulfill(oa3Legged);
// 			}
// 		}));
// 	}

// 	static async validateToken(request: Request) {
// 		try {
// 			if (!request.session || !request.session.forge || !request.session.forge.access_token)
// 				return (null);
// 			const response = await superagent
// 				.post('https://developer.api.autodesk.com/validation/v1/validatetoken')
// 				.accept('application/json')
// 				.send(`client_id=${AppSettings.forgeClientId}`)
// 				.send(`client_secret=${AppSettings.forgeClientSecret}`)
// 				.send(`token=${request.session.forge.access_token}`)
// 				;
// 			// 3 legged
// 			// {
// 			// 	access_token: {
// 			// 		userid: 'User ID',
// 			// 		oxygenid: 'User SSO ID',
// 			// 		firstname: 'User firstname',
// 			// 		lastname: 'Userlastname',
// 			// 		email: 'user.email@xxx.com',
// 			// 		username: 'User Login or Email address'
// 			// 	},
// 			// 	scope: 'SCOPES separated with a space',
// 			// 	expires_in: NNNN, // Access token expiration time (in seconds)
// 			// 	client_id: 'FORGE_CLIENT_ID from the token'
// 			// }
// 			if (response && response.body && response.body.client_id === AppSettings.forgeClientId && response.body.expires_in > 0)
// 				return (response.body);
// 			//throw new Error ('__TEST__');
// 		} catch (ex) {
// 			if (ex.status === 401 || ex.message === '__TEST__') {
// 				try {
// 					let response = await Forge_oauth._3legged_refresh(request);
// 					response = await superagent
// 						.post('https://developer.api.autodesk.com/validation/v1/validatetoken')
// 						.accept('application/json')
// 						.send(`client_id=${AppSettings.forgeClientId}`)
// 						.send(`client_secret=${AppSettings.forgeClientSecret}`)
// 						.send(`token=${req.session.forge.access_token}`)
// 						; // eslint-disable-line indent
// 					return (response.body);
// 				} catch (ex2) {
// 					console.error(`Failed to refresh the token - ${ex2.message} [${ex2.code || ex2.status}]`);
// 					Forge_oauth.setCredentials(req, undefined);
// 				}
// 			} else {
// 				console.error(`validateToken error - ${ex.message} [${ex.code || ex.status}]`);
// 				Forge_oauth.setCredentials(req, undefined);
// 			}
// 		}
// 		return (null);
// 	}

// }

// let router = express.Router();
// router.use(bodyParser.json());

// router.get('/user/login', (req, res) => {
// 	let state = req.query.state || '/';
// 	res.redirect(Forge_oauth._3legged_authorize(state));
// });

// router.get('/user/is', async (req, res) => {
// 	// if (process.env.NODE_ENV !== 'production')
// 	// 	return (res.json('ok')); // for debug
// 	const response = await Forge_oauth.validateToken(req);
// 	res.json(response && response.access_token ? { ...response.access_token, admin: AppSettings.admins.indexOf(response.access_token.email) !== -1 } : null);
// });

// router.get('/callback', (req, res) => {
// 	Forge_oauth._3legged_code(req, req.query.code)
// 		.then((client) => { // eslint-disable-line no-unused-vars
// 			res.redirect(req.query.state);
// 		})
// 		.catch((error) => {
// 			console.error(error);
// 			res.redirect('/');
// 		});
// });

// router.get('/user/logout', (req, res) => {
// 	Forge_oauth.setCredentials(req, undefined);
// 	res.redirect('/');
// });

// module.exports = { OAuthRouter: router, OAuthTool: Forge_oauth };