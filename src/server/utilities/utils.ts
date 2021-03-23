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

import * as _util from 'util';
import * as _fs from 'fs';
import * as rimraf from 'rimraf';
import * as zlib from 'zlib';

const _fsExists = _util.promisify(_fs.exists);
const _fsUnlink = _util.promisify(_fs.unlink);
const _fsReadFile = _util.promisify(_fs.readFile);
const _fsWriteFile = _util.promisify(_fs.writeFile);
const _rimraf = _util.promisify(rimraf);

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
	public static csvToNumber(st: string, sep: string): number[] {
		if (!st)
			return (undefined);
		const dbIds: (number | number[])[] = st
			.split(sep)
			.map((elt: string): number | number[] => {
				const r: RegExpMatchArray = elt.match(/^(\d+)-(\d+)$/);
				if (r === null)
					return (Number.parseInt(elt));
				const t: number[] = [];
				for (let i = Number.parseInt(r[1]); i <= Number.parseInt(r[2]); i++)
					t.push(i);
				return (t);
			});
		return ([].concat.apply([], dbIds));
	}

	public static csvToString(st: string, sep: string): string[] {
		if (!st)
			return (undefined);
		const dbIds: string[] = st
			.split(sep)
			.filter((elt: string): boolean => elt !== '');
		return ([].concat.apply([], dbIds));
		// const entries: string[] = [];
		// const stringChars: string[] = ['"', "'"];
		// const escapeChars: string[] = ['\\'];
		// const separators: string[] = [sep];

		// let inString: boolean = false;
		// //let foundEscapeChar: boolean = false;
		// for (let i = 0; i < st.length; i++) {
		// 	if (inString && escapeChars.includes(st[i])) { // eat and skip next
		// 		i++;
		// 		continue;
		// 	}
		// 	if (stringChars.includes(st[i])) {
		// 		inString = !inString;
		// 		continue;
		// 	}
		// 	if (inString)
		// 		continue;
		// 	if (separators.includes(st[i])) {
		// 		entries.push(st.substring(0, i));
		// 		st = st.substring(i + 1);
		// 		i = 0;
		// 	}
		// }
		// return (entries);
	}

	public static fsExists = _fsExists;
	public static fsUnlink = _fsUnlink;
	public static fsReadFile = _fsReadFile;
	public static fsWriteFile = _fsWriteFile;

	public static rimraf = _rimraf;

}

export default Utils;
