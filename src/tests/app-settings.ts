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

const AppSettings = {
	PORT: Number.parseInt(process.env.PORT, 10) || 80,
	
	// Forge
	main: {
		forgeClientId: process.env.FORGE_CLIENT_ID || 'your_client_id',
		forgeClientSecret: process.env.FORGE_CLIENT_SECRET || 'your_client_secret',
		forgeCallback: process.env.FORGE_CALLBACK || ('http://localhost:' + (process.env.PORT || '80') + '/oauth'),
		forgeScope: {
			internal: 'data:read data:write data:create data:search bucket:read bucket:create bucket:update bucket:delete',
			external: 'viewables:read',
			userinfo: 'user-profile:read',
		},
		forgeWebhooks: process.env.FORGE_WEBHOOKS || 'your_webhook_base_url',
		forgeWebhooksToken: process.env.FORGE_WEBHOOKS_TOKEN, // your_webhook_secret_token, defaults to undefined
	},

	// Mongoose
	MONGO_USER: process.env.MONGO_USER || 'MONGO_USER',
	MONGO_PASSWORD: process.env.MONGO_PASSWORD || 'MONGO_PASSWORD',
	MONGO_PATH: process.env.MONGO_PATH || 'MONGO_PATH',

	// Common
	userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
	
};

export default AppSettings;