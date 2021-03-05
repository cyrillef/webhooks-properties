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

import { Request, Response } from 'express';
//import * as moment from 'moment';
import * as ForgeAPI from 'forge-apis';
import AppSettings from './app-settings';

export class Forge2Legged {

	public name: string;
	public internalClient: ForgeAPI.AuthClientTwoLegged;
	public externalClient: ForgeAPI.AuthClientTwoLegged;

	private constructor(name: string, config: any) {
		this.name = name;
		this.internalClient = new ForgeAPI.AuthClientTwoLegged(
			config.forgeClientId,
			config.forgeClientSecret,
			config.forgeScope.internal.split(' ').map((elt: string) => (elt as ForgeAPI.Scope)),
			true
		);
		//await this.internalClient.authenticate();
		this.externalClient = new ForgeAPI.AuthClientTwoLegged(
			config.forgeClientId,
			config.forgeClientSecret,
			config.forgeScope.external.split(' ').map((elt: string) => (elt as ForgeAPI.Scope)),
			true
		);
		//await this.externalClient.authenticate();
	}

	private async authenticate (): Promise<void> {
		await Promise.all ([
			this.internalClient.authenticate(),
			this.externalClient.authenticate()
		]);
		setTimeout(this.authenticate.bind(this), (this.internalClient.getCredentials().expires_in - 300) * 100); // -5min
	}

	public get internalToken(): ForgeAPI.AuthToken {
		return (this.internalClient.getCredentials());
	}

	public get externalToken(): ForgeAPI.AuthToken {
		return (this.externalClient.getCredentials());
	}

	// Client Singletons
	private static _instances: Forge2Legged[] = [];

	public static Instance(name: string, config: any): Forge2Legged {
		const result: Forge2Legged[] = Forge2Legged._instances.filter((elt: Forge2Legged) => elt.name === name);
		if (result && result.length > 0)
			return (result[0]);
		const instance: Forge2Legged = new Forge2Legged(name, config);
		instance.authenticate();
		Forge2Legged._instances.push(instance);
		return (instance);
	}

}

export default Forge2Legged