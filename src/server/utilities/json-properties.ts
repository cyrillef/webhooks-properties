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

enum AttributeType {
	// Numeric types
	Unknown = 0,
	Boolean = 1,
	Integer = 2, // Color
	Double = 3,
	Float = 4,

	// Special types
	BLOB = 10,
	DbKey = 11, // represents a link to another object in the database, using database internal ID

	// String types 
	String = 20,
	LocalizableString = 21,
	DateTime = 22,// ISO 8601 date
	GeoLocation = 23, // LatLonHeight - ISO6709 Annex H string, e.g: "+27.5916+086.5640+8850/" for Mount Everest
	Position = 24 // "x y z w" space separated string representing vector with 2,3 or 4 elements
}

enum AttributeFieldIndex {
	iNAME = 0,
	iCATEGORY = 1,
	iTYPE = 2, // Type (1 = Boolean, 2 = Color, 3 = Numeric, 11 = ObjectReference, 20 = String)
	iUNIT = 3,
	// The PropertyDB use GNU Units to specify units of properties. For compound units, like for density,
	// which don’t have an atomic name you can for expressions like kg/m^3
	iDESCRIPTION = 4,
	iDISPLAYNAME = 5,
	iFLAGS = 6,
	iDISPLAYPRECISION = 7
}

// Bitmask values for boolean attribute options
enum AttributeFlags {
	afHidden = 1 << 0, // Attribute will not be displayed in default GUI property views.
	afDontIndex = 1 << 1, // Attribute will not be indexed by the search service.
	afDirectStorage = 1 << 2, // Attribute is not worth de-duplicating (e.g. vertex data or dbId reference)
	afReadOnly = 1 << 3 // Attribute is read-only (used when writing back to the design model, in e.g. Revit)
}
export interface JsonPropertiesSources {
	objects_offs: Buffer,
	objects_avs: Buffer,
	objects_vals: Buffer,
	objects_attrs: Buffer,
	objects_ids: Buffer,

	[index: string]: any,
}
export class JsonProperties {

	private isV2: boolean = false;
	public offs: any = null;
	public avs: any = null;
	public vals: any = null;
	public attrs: any = null;
	public ids: any = null;

	// Cached ids of commonly used well known attributes (child, parent, name)
	private childAttrId: number = -1;
	private parentAttrId: number = -1;
	private nameAttrId: number = -1;
	private instanceOfAttrId: number = -1;
	private viewableInAttrId: number = -1;
	private externalRefAttrId: number = -1;
	private nodeFlagsAttrId: number = -1;
	private layersAttrId: number = -1;

	private static readonly NODE_TYPE_ASSEMBLY = 0x0; // Real world object as assembly of sub-objects
	private static readonly NODE_TYPE_GEOMETRY = 0x6; // Leaf geometry node

	constructor() {
	}

	public static get dbNames(): string[] {
		// The file list for property database files is fixed, no need to go to the server to find out
		return (['objects_offs', 'objects_avs', 'objects_vals', 'objects_attrs', 'objects_ids']);
	}

	public get idMax(): number {
		return (this.offs.length - 1);
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

	public async load(dbs: JsonPropertiesSources | Buffer[]): Promise<void> {
		const self = this;
		Array.isArray(dbs)
		if (Array.isArray(dbs) && JsonProperties.dbNames.length !== dbs.length)
			return;
		let temp: any[] = null;
		if (Array.isArray(dbs)) {
			temp = dbs.map((elt: Buffer): Promise<any> => JsonProperties.jsonGzRoot(elt));
		} else {
			temp = JsonProperties.dbNames.map((id: string): Promise<any> => JsonProperties.jsonGzRoot(dbs[id]));
		}
		temp = await Promise.all(temp);
		JsonProperties.dbNames.map((id: string, index: number): any => (self as any)[id.substring(8)] = temp[index]);

		if (this.attrs[0] === 'pdb version 2')
			this.isV2 = true;

		for (let i = 1; i < this.attrs.length; i++) {
			const attrName = this.attrs[i][AttributeFieldIndex.iNAME];
			switch (attrName) {
				case 'Layer': this.layersAttrId = i; break;
				default: break;
			}
			const category = this.attrs[i][AttributeFieldIndex.iCATEGORY];
			switch (category) {
				case '__parent__': this.parentAttrId = i; break;
				case '__child__': this.childAttrId = i; break;
				case '__name__': this.nameAttrId = i; break;
				case '__instanceof__': this.instanceOfAttrId = i; break;
				case '__viewable_in__': this.viewableInAttrId = i; break;
				case '__externalref__': this.externalRefAttrId = i; break;
				case '__node_flags__': this.nodeFlagsAttrId = i; break;
				default: break;
			}

			// As of V2, DbKey attribute values are stored directly into the AV array
			if (this.isV2 && this.attrs[i][AttributeFieldIndex.iTYPE] === AttributeType.DbKey)
				this.attrs[i][AttributeFieldIndex.iFLAGS] = this.attrs[i][AttributeFieldIndex.iFLAGS] | AttributeFlags.afDirectStorage;
		}
	}

	public read(dbId: number, keepHidden: boolean, keepInternals: boolean): any {
		const result: any = {
			objectid: dbId,
			name: '',
			externalId: this.ids[dbId],
			properties: {}
		};

		let parent: any = this._read(dbId, result, keepHidden, keepInternals);
		if (keepInternals === false)
			//delete result.properties.__internal__;
			JsonProperties.deleteInternals(result);

		//while ( parent !== null && parent !== 1 )
		//	parent =this._read (parent, result) ;
		//result.properties =Object.keys (result.properties).map ((elt) => result.properties [elt]) ;
		return (result);
	}

	private _read(dbId: number, result: any, keepHidden: boolean = false, keepInternals: boolean = false): number {
		let parent: number = null;
		const propStart: number = 2 * this.offs[dbId];
		const propStop: number = (this.offs.length <= dbId + 1) ? this.avs.length : 2 * this.offs[dbId + 1];
		for (let i = propStart; i < propStop; i += 2) {
			const attr: string = this.attrs[this.avs[i]];
			let category: string = attr[AttributeFieldIndex.iCATEGORY] || '__internal__';
			let key: string = attr[AttributeFieldIndex.iCATEGORY] + '/' + attr[AttributeFieldIndex.iNAME];
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
				category = '__internal__';
			}
			//console.log (key) ;
			if (key === '__name__/name') {
				if (result.name === '')
					result.name = this.vals[this.avs[i + 1]];
				continue;
			}
			if (!result.properties.hasOwnProperty(category))
				result.properties[category] = {};

			key = attr[AttributeFieldIndex.iDISPLAYNAME] || attr[AttributeFieldIndex.iNAME];
			let value: string = this._readPropertyAsString(attr, i);
			if (attr[AttributeFieldIndex.iUNIT] !== null)
				value += ' ' + attr[AttributeFieldIndex.iUNIT];
			try { value = value.trimEnd(); } catch (ex) { }

			//let isHidden: boolean = (Number.parseInt(attr[AttributeFieldIndex.iFLAGS]) & 1) !== 1;
			// In theory should we should also mark as hidden if in parent, child, viewable or externalRef category
			if (!(category === '__internal__' && keepInternals) && !(category !== '__internal__' && keepHidden))
				if (Number.parseInt(attr[AttributeFieldIndex.iFLAGS]) & 1)
					continue;

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
		// Object.keys(result.properties).sort().every((cat: string): boolean => {
		// 	let r: any = {};
		// 	Object.keys(result.properties[cat]).sort().every((elt: string): void => r[elt] = result.properties[cat][elt]);
		// 	delete result.properties[cat];
		// 	result.properties[cat] = r;
		// 	return (true);
		// });
		// Object.keys(result).sort().every((prop: string): boolean => {
		// 	const propArchive = result[prop];
		// 	delete result[prop];
		// 	result[prop] = propArchive;
		// 	return (true);
		// });
		return (parent);
	}

	private static deleteInternals(node: any) {
		// __parent__
		// __child__
		// __viewable_in__
		// __externalref__
		const regex = new RegExp('^__(\\w+)__$');
		const keys = Object.keys(node.properties);
		keys
			.filter((key: string): boolean => regex.test(key))
			.map((key: string): any => delete node.properties[key]);
		//delete elt.properties.Other;
	}

	private _readProperty(attr: any, valueId: number): boolean | number | string | number[] | string[] | Date {
		let value: boolean | number | string | number[] | string[] | Date = '';
		const tp: number = Number.parseInt(attr[AttributeFieldIndex.iTYPE]);
		switch (tp) {
			case AttributeType.Unknown:
			case AttributeType.String:
			case AttributeType.LocalizableString:
			case AttributeType.BLOB:
			case AttributeType.GeoLocation: // LatLonHeight - ISO6709 Annex H string, e.g: "+27.5916+086.5640+8850/" for Mount Everest
			default:
				value = this.vals[this.avs[valueId + 1]];
				break;
			case AttributeType.Boolean:
				value = !(this.vals[this.avs[valueId + 1]] === 0);
				break;
			case AttributeType.Integer:
				value = Number.parseInt(this.vals[this.avs[valueId + 1]]);
				break;
			case AttributeType.Double:
			case AttributeType.Float:
				value = Number.parseFloat(this.vals[this.avs[valueId + 1]]);
				break;
			case AttributeType.DbKey: // represents a link to another object in the database, using database internal ID
				if (attr[AttributeFieldIndex.iFLAGS] & AttributeFlags.afDirectStorage)
					value = valueId + 1;
				else
					value = Number.parseInt(this.vals[this.avs[valueId + 1]]);
				//console.log(`AttributeType.DbKey => ${value}`);
				break;
			case AttributeType.DateTime: // ISO 8601 date
				value = new Date(this.vals[this.avs[valueId + 1]]);
				break;
			case AttributeType.Position: // "x y z w" space separated string representing vector with 2,3 or 4 elements
				value = this.vals[this.avs[valueId + 1]].split(' ');
				value = (value as string[]).map((elt: string): number => Number.parseFloat(elt));
				break;
		}
		return (value);
	}

	private _readPropertyAsString(attr: any, valueId: number): string {
		let value: string = '';
		const tp: number = Number.parseInt(attr[AttributeFieldIndex.iTYPE]);
		switch (tp) {
			case AttributeType.Unknown:
			case AttributeType.String:
			case AttributeType.LocalizableString:
			case AttributeType.BLOB:
			case AttributeType.GeoLocation: // LatLonHeight - ISO6709 Annex H string, e.g: "+27.5916+086.5640+8850/" for Mount Everest
			default:
				value = this.vals[this.avs[valueId + 1]];
				break;
			case AttributeType.Boolean:
				value = this.vals[this.avs[valueId + 1]] === 0 ? 'No' : 'Yes';
				break;
			case AttributeType.Integer:
				value = Number.parseInt(this.vals[this.avs[valueId + 1]]).toString();
				break;
			case AttributeType.Double:
			case AttributeType.Float:
				const precision: number = Number.parseInt(attr[AttributeFieldIndex.iDISPLAYPRECISION]) || 3;
				//value = Number.parseFloat(this.vals[this.avs[valueId + 1]]).toFixed(precision);
				value = Number.parseFloat(this.vals[this.avs[valueId + 1]]).toFixed(3);
				break;
			case AttributeType.DbKey: // represents a link to another object in the database, using database internal ID
				if (attr[AttributeFieldIndex.iFLAGS] & AttributeFlags.afDirectStorage)
					value = (valueId + 1).toString();
				else
					value = this.vals[this.avs[valueId + 1]];
				//console.log(`AttributeType.DbKey => ${value}`);
				break;
			case AttributeType.DateTime: // ISO 8601 date
				value = this.vals[this.avs[valueId + 1]];
				break;
			case AttributeType.Position: // "x y z w" space separated string representing vector with 2,3 or 4 elements
				value = this.vals[this.avs[valueId + 1]];
				break;
		}
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
		for (let dbId = 1; dbId < this.idMax; dbId++) {
			const node: any = this.read(dbId, true, true);
			if (
				node.name && node.name !== ''
				&& !node.properties.__internal__.parent
				&& node.properties.__internal__.child /*&& node.properties.__internal__.child.length*/
			)
				roots.push(node.objectid);
		}
		return (roots);
	}

	public buildFullTree(nodeId: number, keepNode: boolean, keepHidden: boolean, keepInternals: boolean): any {
		const node: any = this.read(nodeId, keepHidden, true);
		let result: any = keepNode ? node : {
			name: node.name,
			objectid: nodeId,
			//objects: [],
		};
		if (!node.properties.__internal__.child)
			return (result);
		if (typeof node.properties.__internal__.child === 'number')
			node.properties.__internal__.child = [node.properties.__internal__.child];
		result.objects = node.properties.__internal__.child.map((id: number): any => this.buildFullTree(id, keepNode, keepHidden, keepInternals));
		return (result);
	}

	public buildTree(viewable_in: string, keepNode: boolean, keepHidden: boolean, keepInternals: boolean): any {
		const nodeIds: number[] = this.findRootNodes();
		const node: any = this.read(nodeIds[0], keepHidden, true);
		let result: any = keepNode ? node : {
			name: node.name,
			objectid: nodeIds[0],
			//objects: [],
		};
		if (!node.properties.__internal__.child)
			return (result);
		if (typeof node.properties.__internal__.child === 'number')
			node.properties.__internal__.child = [node.properties.__internal__.child];
		result.objects = node.properties.__internal__.child.map((id: number): any => this.buildFullTree(id, true, keepHidden, keepInternals));

		const isIn = (node: any): boolean => {
			if (node.objects)
				node.objects = node.objects.filter((elt: any): boolean => isIn(elt));
			if (node.objects && node.objects.length > 0) {
				if (!keepNode) {
					delete node.properties;
					delete node.externalId;
				}
				return (true);
			}
			delete node.objects;
			if (!node.properties || !node.properties.__internal__ || !node.properties.__internal__.viewable_in) {
				if (!keepNode) {
					delete node.properties;
					delete node.externalId;
				}
				return (false);
			}
			const cmp: boolean = node.properties.__internal__.viewable_in.indexOf(viewable_in) !== -1;
			if (!keepNode) {
				delete node.properties;
				delete node.externalId;
			}
			return (cmp);
		};

		isIn(result);

		return (result);
	}

	public buildReverseTree(nodeIds: number[], keepNode: boolean, keepHidden: boolean, keepInternals: boolean): any {
		const nodes: any = {};
		let rootNode: any = null;

		const traverseReverseNodes = (nodeId: number): any => {
			const node: any = this.read(nodeId, keepHidden, true);
			const result: any = keepNode ? node : {
				name: node.name,
				objectid: nodeId,
				//objects: [],
			};
			nodes[nodeId] = result;
			const parentId = node.properties.__internal__ && node.properties.__internal__.parent;
			if (!parentId)
				return (rootNode = result);

			const parentNode: any = nodes.hasOwnProperty(parentId) ? nodes[parentId] : traverseReverseNodes(parentId);
			if (!parentNode.objects)
				parentNode.objects = [];
			parentNode.objects.push(result);
			return (result);
		};

		nodeIds.forEach((nodeId: number): void => traverseReverseNodes(nodeId));
		return (rootNode);
	}

}

export default JsonProperties;