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
import { PropertiesUtils, PropertiesCache, AttributeFieldIndex, AttributeFlags, AttributeType } from './common';

export interface SvfPropertiesCache extends PropertiesCache {
	objects_offs: Buffer,
	objects_avs: Buffer,
	objects_vals: Buffer,
	objects_attrs: Buffer,
	objects_ids: Buffer,
}

export class SvfProperties {

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

	public async load(dbs: SvfPropertiesCache | Buffer[]): Promise<void> {
		const self = this;
		Array.isArray(dbs)
		if (Array.isArray(dbs) && SvfProperties.dbNames.length !== dbs.length)
			return;
		let temp: any[] = null;
		if (Array.isArray(dbs)) {
			temp = dbs.map((elt: Buffer): Promise<any> => Utils.jsonGzRoot(elt));
		} else {
			temp = SvfProperties.dbNames.map((id: string): Promise<any> => Utils.jsonGzRoot(dbs[id]));
		}
		temp = await Promise.all(temp);
		SvfProperties.dbNames.map((id: string, index: number): any => (self as any)[id.substring(8)] = temp[index]);

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

		let parent: number = this._read(dbId, result, keepHidden, keepInternals);
		if (keepInternals === false)
			//delete result.properties.__internal__;
			PropertiesUtils.deleteInternals(result);

		//while ( parent !== null && parent !== 1 )
		//	parent =this._read (parent, result) ;
		//result.properties =Object.keys (result.properties).map ((elt) => result.properties [elt]) ;
		return (result);
	}

	private _read(dbId: number, result: any, keepHidden: boolean = false, keepInternals: boolean = false, instanceOf: boolean = false): number {
		let parent: number = null;
		const propStart: number = 2 * this.offs[dbId];
		const propStop: number = (this.offs.length <= dbId + 1) ? this.avs.length : 2 * this.offs[dbId + 1];
		for (let i = propStart; i < propStop; i += 2) {
			const attr: string = this.attrs[this.avs[i]];
			let category: string = attr[AttributeFieldIndex.iCATEGORY] || 'xxROOTxx';
			let key: string = (category + '/' + attr[AttributeFieldIndex.iNAME]).toLowerCase();
			if (instanceOf && (key === '__parent__/parent' || key === '__child__/child' || key === '__viewable_in__/viewable_in'))
				continue;
			if (key === '__instanceof__/instanceof_objid')
				// Allright, we need to read the definition
				this._read(Number.parseInt(this.vals[this.avs[i + 1]]), result, keepHidden, keepInternals, true);
			if (/^__[_\w]+__\/[_a-z]+$/.test(key))
				category = '__internal__';
			//console.log (key) ;
			if (key === '__name__/name') {
				if (result.name === '')
					result.name = this.vals[this.avs[i + 1]];
				continue;
			}
			if (!result.properties.hasOwnProperty(category))
				result.properties[category] = {};

			key = attr[AttributeFieldIndex.iDISPLAYNAME] || attr[AttributeFieldIndex.iNAME];
			let value: string | number = this._readPropertyAsString(attr, i);
			if (attr[AttributeFieldIndex.iUNIT] !== null)
				value += ' ' + attr[AttributeFieldIndex.iUNIT];
			value = typeof value === 'string' ? value.trimEnd() : value;

			//let isHidden: boolean = (Number.parseInt(attr[AttributeFieldIndex.iFLAGS]) & 1) !== 1;
			// In theory should we should also mark as hidden if in parent, child, viewable or externalRef category
			if (!(category === '__internal__' && keepInternals) && !(category !== '__internal__' && keepHidden))
				if (Number.parseInt(attr[AttributeFieldIndex.iFLAGS]) & 1)
					continue;

			if (result.properties[category].hasOwnProperty(key)) {
				if (category === '__internal__' && key === 'viewable_in'
					&& (value === result.properties[category][key]
						|| (Array.isArray(result.properties[category][key]) && result.properties[category][key].indexOf(value) !== -1))
				)
					continue;
				if (!Array.isArray(result.properties[category][key]))
					result.properties[category][key] = [result.properties[category][key]];
				result.properties[category][key].push(value);
			} else {
				result.properties[category][key] = value;
			}
		}
		if (result.properties.xxROOTxx) {
			Object.keys(result.properties.xxROOTxx).map((key: string): void => result.properties[key] = result.properties.xxROOTxx[key]);
			delete result.properties.xxROOTxx;
		}
		return (parent);
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

	private _readPropertyAsString(attr: any, valueId: number): string | number {
		let value: string | number = '';
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
					value = valueId + 1;
				else
					value = Number.parseInt(this.vals[this.avs[valueId + 1]]);
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
		// Slow method
		for (let dbId = 1; dbId < this.idMax; dbId++) {
			const node: any = this.read(dbId, true, true);
			if (
				node.name && node.name !== ''
				&& (!node.properties.__internal__ || !node.properties.__internal__.parent)
				&& (node.properties.__internal__ && node.properties.__internal__.child /*&& node.properties.__internal__.child.length*/)
			)
				roots.push(node.objectid);
		}

		let final: number[] = [];
		if (roots.length > 1) {
			// We may need to cleanup the list (ex: dwfx)
			for (let i = 0; i < roots.length; i++) {
				const node: any = this.read(roots[i], false, false);
				if (node.name !== '')
					final.push(roots[i]);
			}
		} else {
			final = roots;
		}
		return (final);
	}

	public buildFullTree(nodeId: number, viewable_in: string[], withProperties: boolean, keepHidden: boolean, keepInternals: boolean): any {
		const node: any = this.read(nodeId, keepHidden, true);
		let result: any = withProperties ? node : {
			name: node.name,
			objectid: nodeId,
			//objects: [],
		};
		if (!node.properties.__internal__.child)
			return (result);
		if (typeof node.properties.__internal__.child === 'number')
			node.properties.__internal__.child = [node.properties.__internal__.child];
		result.objects = node.properties.__internal__.child.map((id: number): any => this.buildFullTree(id, viewable_in, withProperties, keepHidden, keepInternals));
		return (result);
	}

	public buildTree(viewable_in: string[], withProperties: boolean, keepHidden: boolean, keepInternals: boolean): any {
		const rootIds: number[] = this.findRootNodes();

		let nodes: any = {};
		for (let i = 0; i < rootIds.length; i++) {
			const node: any = this.read(rootIds[i], keepHidden, true);
			let result: any = withProperties ? node : {
				name: node.name,
				objectid: rootIds[i],
				//objects: [],
			};
			if (!node.properties || !node.properties.__internal__ || !node.properties.__internal__.child)
				return (result);
			if (!Array.isArray(node.properties.__internal__.child))
				node.properties.__internal__.child = [node.properties.__internal__.child];
			result.objects = node.properties.__internal__.child.map((id: number): any => this.buildFullTree(id, viewable_in, true, keepHidden, keepInternals));

			nodes[rootIds[i]] = result;
		}

		const cleanNode = (node: any): void => {
			if (!withProperties) {
				delete node.properties;
				delete node.externalId;
			}
		};
		const isIn = (node: any): boolean => {
			let _isin_: boolean = true; // by default, we are in
			let nodeViewableIn: any = node.properties && node.properties.__internal__ && node.properties.__internal__.viewable_in;
			if (nodeViewableIn && !Array.isArray(nodeViewableIn))
				nodeViewableIn = [nodeViewableIn];
			if (viewable_in && nodeViewableIn) {
				_isin_ = viewable_in.filter((x: string): boolean => nodeViewableIn.includes(x)).length > 0;
				if (_isin_ === false)
					return (cleanNode(node), false); // if a node is not in, all its childs aren't either
			}

			if (node.objects) {
				node.objects = node.objects.filter((elt: any): boolean => isIn(elt));
				if (node.objects.length === 0)
					delete node.objects;
			}

			return (cleanNode(node), _isin_);
		};
		Object.values(nodes).map((result: any): boolean => isIn(result));

		const rootId: number = (rootIds.length === 1 && rootIds[0]) || 0;
		if (rootIds.length > 1) {
			nodes[rootId] = {
				name: '',
				objectid: 0,
				objects: rootIds.map((nodeId: number): any => nodes[nodeId]),
			};
		}

		return (nodes[rootId]);
	}

	public buildReverseTree(nodeIds: number[], withProperties: boolean, keepHidden: boolean, keepInternals: boolean): any {
		const nodes: any = {};
		let rootNode: any = null;

		const traverseReverseNodes = (nodeId: number): any => {
			const node: any = this.read(nodeId, keepHidden, true);
			const result: any = withProperties ? node : {
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

export default SvfProperties;