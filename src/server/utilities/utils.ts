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

import * as util from 'util';
import * as _fs from 'fs';
import * as rimraf from 'rimraf';
import * as zlib from 'zlib';

const _fsExists = util.promisify(_fs.exists);
const _fsUnlink = util.promisify(_fs.unlink);
const _fsReadFile = util.promisify(_fs.readFile);
const _fsWriteFile = util.promisify(_fs.writeFile);
const _rimraf = util.promisify(rimraf);

export class Utils {

	public static makeSafeUrn(urn: string): string {
		return (urn.replace(/\+/g, '-') // Convert '+' to '-'
			.replace(/\//g, '_') // Convert '/' to '_'
			.replace(/=+$/, '') // Remove trailing '='
		);
	}

	public static fromSafeUrn(urn: string): string {
		return (urn
			.replace(/-/g, '+') // Convert '-' to '+'
			.replace(/_/g, '/') // Convert '_' to '/'
			+ Array(5 - urn.length % 4).join('=') // Add trainling '='
		);
	}

	public static sleep(milliseconds: number): Promise<any> {
		return (new Promise((resolve: (value?: any) => void) => setTimeout(resolve, milliseconds)));
	}

	public static jsonGzRoot(res: Buffer): Promise<any> {
		return (new Promise((resolve: (value: any) => void, reject: (reason?: any) => void) => {
			zlib.gunzip(res, (error: Error | null, result: Buffer): void => {
				try {
					resolve(JSON.parse(result.toString('utf-8')));
				} catch (ex) {
					console.error(ex.message, name);
					reject(ex);
				}
			});
		}));
	}

	// uses ',' separated Ids
	// ids are either a number, or a range with 2 numbers separated with a '-'
	public static csv(st: string): number[] {
		if (!st)
			return (undefined);
		const dbIds: (number | number[])[] = st
			.split(',')
			.map((elt: string): number | number[] => {
				const r: RegExpMatchArray = elt.match(/^(\d+)-(\d+)$/);
				if (r === null)
					return (parseInt(elt));
				const t: number[] = [];
				for (let i = parseInt(r[1]); i <= parseInt(r[2]); i++)
					t.push(i);
				return (t);
			});
		return ([].concat.apply([], dbIds));
	}

	public static fsExists = _fsExists;
	public static fsUnlink = _fsUnlink;
	public static fsReadFile = _fsReadFile;
	public static fsWriteFile = _fsWriteFile;

	public static rimraf = _rimraf;

}

export default Utils;
