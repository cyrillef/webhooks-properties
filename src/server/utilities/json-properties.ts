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

import * as zlib from 'zlib';

class JsonProperties {

	private urn: string = null;
	private offs: any = null;
	private avs: any = null;
	private vals: any = null;
	private attrs: any = null;
	private ids: any = null;

	constructor(urn: string) {
		this.urn = urn;
	}

	public static get dbs(): string[] {
		// The file list for property database files is fixed, no need to go to the server to find out
		return (['objects_offs', 'objects_avs', 'objects_vals', 'objects_attrs', 'objects_ids']);
	}

	public static get iNAME(): number { return (0); }
	public static get iCATEGORY(): number { return (1); }
	public static get iTYPE(): number { return (2); } // Type (1 = Boolean, 2 = Color, 3 = Numeric, 11 = ObjectReference, 20 = String)
	public static get iUNIT(): number { return (3); }
	// The PropertyDB use GNU Units to specify units of properties. For compound units, like for density,
	// which don’t have an atomic name you can for expressions like kg/m^3
	public static get DESCRIPTION(): number { return (4); }
	public static get iDISPLAYNAME(): number { return (5); }
	public static get iFLAGS(): number { return (6); }
	public static get iDISPLAYPRECISION(): number { return (7); }

	public static get tBoolean(): number { return (1); }
	public static get tColor(): number { return (2); }
	public static get tNumeric(): number { return (3); }
	public static get tObjectReference(): number { return (11); }
	public static get tString(): number { return (20); }
	public static get tString2(): number { return (21); }

	public get idMax(): number {
		return (this.offs.length - 1);
	}

	private static jsonGzRoot(res: any): Promise<any> {
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

	public async load(dbs: any[]): Promise<void> {
		const self = this;
		if (JsonProperties.dbs.length !== dbs.length)
			return;
		dbs = dbs.map((elt: any): Promise<any> => JsonProperties.jsonGzRoot(elt));
		dbs = await Promise.all(dbs);
		JsonProperties.dbs.map((id: string, index: number): any => (self as any)[id.substring(8)] = dbs[index]);
	}

	public read(dbId: number, strict: boolean = true): any {
		const result: any = {
			objectid: dbId,
			name: '',
			externalId: this.ids[dbId],
			properties: {}
		};

		let parent: any = this._read(dbId, result);
		if ( strict === true)
			delete result.properties.__internal__;

		//while ( parent !== null && parent !== 1 )
		//	parent =this._read (parent, result) ;
		//result.properties =Object.keys (result.properties).map ((elt) => result.properties [elt]) ;
		return (result);
	}

	private _read(dbId: number, result: any): number {
		let parent: number = null;
		var propStart: number = 2 * this.offs[dbId];
		var propStop: number = (this.offs.length <= dbId + 1) ? this.avs.length : 2 * this.offs[dbId + 1];
		for (let i = propStart; i < propStop; i += 2) {
			const attr: string = this.attrs[this.avs[i]];
			const category: string = attr[JsonProperties.iCATEGORY] || '__internal__';
			let key: string = attr[JsonProperties.iCATEGORY] + '/' + attr[JsonProperties.iNAME];
			// if ( key === '__parent__/parent' ) {
			// 	parent =parseInt (this.vals [this.avs [i + 1]]) ;
			// 	result.parents.push (parent) ;
			// 	continue ;
			// }
			if (key === '__instanceof__/instanceof_objid') {
				// Allright, we need to read the definition
				this._read(parseInt(this.vals[this.avs[i + 1]]), result);
				continue;
			}
			if (key === '__viewable_in__/viewable_in'
				|| key === '__parent__/parent'
				|| key === '__child__/child'
				|| key === '__node_flags__/node_flags'
				|| key === '__document__/schema_name'
				|| key === '__document__/schema_version'
				|| key === '__document__/is_doc_property'
			) {
				continue;
			}
			//console.log (key) ;
			if (key === '__name__/name') {
				if (result.name === '')
					result.name = this.vals[this.avs[i + 1]];
				continue;
			}
			if (!result.properties.hasOwnProperty(category))
				result.properties[category] = {};

			key = attr[JsonProperties.iDISPLAYNAME] || attr[JsonProperties.iNAME];
			let value: string = '';
			if (parseInt(attr[JsonProperties.iTYPE]) === JsonProperties.tBoolean)
				value = this.vals[this.avs[i + 1]] === 0 ? 'No' : 'Yes';
			else if (parseInt(attr[JsonProperties.iTYPE]) === JsonProperties.tColor)
				value = this.vals[this.avs[i + 1]].toString();
			else if (parseInt(attr[JsonProperties.iTYPE]) === JsonProperties.tNumeric)
				value = Number.parseFloat(this.vals[this.avs[i + 1]]).toFixed(3);
			else
				value = this.vals[this.avs[i + 1]];

			if (attr[JsonProperties.iUNIT] !== null)
				value += ' ' + attr[JsonProperties.iUNIT];

			//result.properties [category] [key] =value ;
			if (result.properties[category].hasOwnProperty(key)) {
				if (!Array.isArray(result.properties[category][key])) {
					result.properties[category][key] = [result.properties[category][key]];
				}
				result.properties[category][key].push(value);
			} else {
				result.properties[category][key] = value;
			}
		}
		// Sorting objects
		Object.keys(result.properties).sort().every((cat: string): boolean => {
			let r: any = {};
			Object.keys(result.properties[cat]).sort().every((elt: string): boolean => {
				r[elt] = result.properties[cat][elt];
				return (true);
			});
			delete result.properties[cat];
			result.properties[cat] = r;
			return (true);
		});
		return (parent);
	}

}

export default JsonProperties;