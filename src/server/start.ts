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

import { createServer } from 'spdy';
import ExpressApp from './server/express-server';
import AppSettings from './server/app-settings';
import * as _path from 'path';
import * as _fs from 'fs';

import OAuth2leggedController from './controllers/oauth-2legged';

const useHTTP2: Boolean = false;
const dev: Boolean = process.env.NODE_ENV !== 'production';
console.log(`Server running in ${dev === true ? 'development' : 'production'} mode.`);
if (dev === true)
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const expressApp = new ExpressApp([
	new OAuth2leggedController(),
]);

if (useHTTP2 === true) {

	// Create your own certificate with openssl for development
	const options = {
		key: _fs.readFileSync(_path.join(__dirname, '/keys/server.key')),
		cert: _fs.readFileSync(_path.join(__dirname, '/keys/server.crt')),
		ca: _fs.readFileSync(_path.join(__dirname, '/keys/server.csr'))
		// protocols: [ 'http/1.1' ],
		// plain: false
	};

	// Start the HTTP/2 server with express
	createServer(options, expressApp.app)
		.listen(AppSettings.PORT, () => {
			console.log(`HTTP/2 server listening on port: ${AppSettings.PORT}`);
		})
		.on('error', (error) => {
			if (error.errno === 'EACCES')
				console.warn(`Port ${AppSettings.PORT} already in use.\nExiting...`);
			else
				console.error(error);
			process.exit(1);
		});

} else {

	expressApp.listen();

}
