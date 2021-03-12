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

import Utils from '../utilities/utils';
import { PropertiesCache } from './common';

export interface Svf2PropertiesCache extends PropertiesCache {
	dbid_idx: Buffer,
	avs_idx: Buffer,
	avs_pack: Buffer,
	
	vals: Buffer,
	attrs: Buffer,
	ids: Buffer,
}

export class Svf2Properties {

	constructor() {
	}

	public static get dbNames(): string[] {
		// The file list for property database files is fixed, no need to go to the server to find out
		return (['dbid.idx', 'avs.idx', 'avs.pack', 'vals.json', 'attrs.json', 'ids.json']);
	}

	public get idMax(): number {
		return (NaN);
	}

	public async load(dbs: Svf2PropertiesCache | Buffer[]): Promise<void> {
		const self = this;
		
	}

	public read(dbId: number, keepHidden: boolean, keepInternals: boolean): any {
		
	}

	private _read(dbId: number, result: any, keepHidden: boolean = false, keepInternals: boolean = false): number {
		let parent: number = null;
		
		return (parent);
	}

	private _readProperty(attr: any, valueId: number): boolean | number | string | number[] | string[] | Date {
		let value: boolean | number | string | number[] | string[] | Date = '';
		
		return (value);
	}

	// Heuristically find the root node(s) of a scene
	// A root is a node that has children, has no (or null) parent and has a name.
	// There can be multiple nodes at the top level (e.g. Revit DWF), which is why
	// we should get the scene root with absolute certainty from the SVF instance tree,
	// but we would have to uncompress and parse that in -- something that is
	// not currently done. This is good enough for now (if pretty slow).

	public findRootNodes(): number[] {
		const roots: number[] = [];

		return (roots);
	}

	public buildTree(viewable_in: string, withProperties: boolean, keepHidden: boolean, keepInternals: boolean): any {

	}

}

export default Svf2Properties;