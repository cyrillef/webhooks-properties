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
import { PropertiesUtils, AttributeFieldIndex, AttributeFlags, AttributeType, PropertiesCache } from './common';

export interface Svf2PropertiesCache extends PropertiesCache {
	dbid: Buffer,
	avs: Buffer,
	offsets: Buffer,

	values: string[],
	attrs: string[],
	ids: string[],
}

export class Svf2Properties {

	private isV2: boolean = true;
	public dbidIdx: Uint32Array = null;
	public avsIdx: Uint32Array = null;
	public avsPack: any = null;
	public vals: any = null;
	public attrs: any = null;
	public ids: any = null;

	constructor(dbs: Svf2PropertiesCache) {
		this.load(dbs);
	}

	public static get dbNames(): string[] {
		// The file list for property database files is fixed, no need to go to the server to find out
		return (['dbid.idx', 'avs.idx', 'avs.pack', 'vals.json', 'attrs.json', 'ids.json']);
	}

	public get idMax(): number {
		return (this.dbidIdx.length - 1);
	}

	private load(dbs: Svf2PropertiesCache): void {
		this.dbidIdx = new Uint32Array(dbs.dbid.buffer, dbs.dbid.byteOffset, dbs.dbid.byteLength / Uint32Array.BYTES_PER_ELEMENT);
		this.avsIdx = new Uint32Array(dbs.offsets.buffer, dbs.offsets.byteOffset, dbs.offsets.byteLength / Uint32Array.BYTES_PER_ELEMENT);
		this.avsPack = dbs.avs;

		// this.attrs = JSON.parse(dbs.attrs.toString('utf8'));
		// this.vals = JSON.parse(dbs.values.toString('utf8'));
		// this.ids = JSON.parse(dbs.ids.toString('utf8'));
		this.attrs = dbs.attrs;
		this.vals = dbs.values;
		this.ids = dbs.ids;
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

		return (result);
	}

	private _read(dbId: number, result: any, keepHidden: boolean = false, keepInternals: boolean = false, instanceOf: boolean = false): number {
		let parent: number = null;

		const eav: any = Svf2Properties._buildEAV(dbId, this.avsIdx, this.avsPack);
		for (let index = 0; index < eav.length; index++) {
			const elt: any = eav[index];
			let value: string | number = Svf2Properties._readPropertyAsString(elt.attributeIndex, elt.valueIndex, this.attrs, this.vals);
			const attr: any = this.attrs[elt.attributeIndex];
			let category: string = attr[AttributeFieldIndex.iCATEGORY] || '__internal__';
			if (category === 'Item')
				console.log(1);
			let key: string = attr[AttributeFieldIndex.iCATEGORY] + '/' + attr[AttributeFieldIndex.iNAME];
			if (instanceOf && (key === '__parent__/parent' || key === '__child__/child' || key === '__viewable_in__/viewable_in'))
				continue;
			if (key === '__instanceof__/instanceof_objid') {
				// Allright, we need to read the definition
				this._read(value as number, result, keepHidden, keepInternals, true);
				//continue;
			}
			if (key === '__viewable_in__/viewable_in'
				|| key === '__parent__/parent'
				|| key === '__child__/child'
				|| key === '__node_flags__/node_flags'
				|| key === '__document__/schema_name'
				|| key === '__document__/schema_version'
				|| key === '__document__/is_doc_property'
				|| key === '__instanceof__/instanceof_objid'
			) {
				category = '__internal__';
			}
			if (key === '__name__/name') {
				if (result.name === '')
					result.name = value;
				continue;
			}
			if (!result.properties.hasOwnProperty(category))
				result.properties[category] = {};

			key = attr[AttributeFieldIndex.iDISPLAYNAME] || attr[AttributeFieldIndex.iNAME];
			if (attr[AttributeFieldIndex.iUNIT] !== null)
				value += ' ' + attr[AttributeFieldIndex.iUNIT];
			value = typeof value === 'string' ? value.trimEnd() : value;

			//let isHidden: boolean = (Number.parseInt(attr[AttributeFieldIndex.iFLAGS]) & 1) !== 1;
			// In theory should we should also mark as hidden if in parent, child, viewable or externalRef category
			if (!(category === '__internal__' && keepInternals) && !(category !== '__internal__' && keepHidden))
				if (Number.parseInt(attr[AttributeFieldIndex.iFLAGS]) & 1)
					continue;

			//result.properties [category] [key] =value ;
			if (result.properties[category].hasOwnProperty(key)) {
				if (category === '__internal__' && key === 'viewable_in'
					&& (value === result.properties[category][key] || (Array.isArray(result.properties[category][key]) && result.properties[category][key].indexOf(value) !== -1)))
					continue;
				if (!Array.isArray(result.properties[category][key]))
					result.properties[category][key] = [result.properties[category][key]];
				result.properties[category][key].push(value);
			} else {
				result.properties[category][key] = value;
			}
		}

		return (parent);
	}

	// Heuristically find the root node(s) of a scene
	// A root is a node that has children, has no (or null) parent and has a name.
	// There can be multiple nodes at the top level (e.g. Revit DWF), which is why
	// we should get the scene root with absolute certainty from the SVF instance tree,
	// but we would have to uncompress and parse that in -- something that is
	// not currently done. This is good enough for now (if pretty slow).

	public findRootNodes(): number[] {
		let roots: number[] = [];
		// Slow method
		// for (let dbId = 1; dbId < this.idMax; dbId++) {
		// 	const node: any = this.read(dbId, true, true);
		// 	if (
		// 		node.name && node.name !== ''
		// 		&& !node.properties.__internal__.parent
		// 		&& node.properties.__internal__.child /*&& node.properties.__internal__.child.length*/
		// 	)
		// 		roots.push(node.objectid);
		// }

		// Faster - First find parent and child attribute definition
		// next collect EAV which use those
		// Root nodes are the one which do not have parents, but have children
		let childAttrId: number = -1;
		let parentAttrId: number = -1;
		for (let i = 0; i < this.attrs.length && (childAttrId === -1 || parentAttrId === -1); i++) {
			const key: string = this.attrs[i][AttributeFieldIndex.iCATEGORY] + '/' + this.attrs[i][AttributeFieldIndex.iNAME];
			if (key === '__child__/child')
				childAttrId = i;
			if (key === '__parent__/parent')
				parentAttrId = i;
		}

		//let objId: number = 1;
		const results: { childs: number[], parents: number[] } = { childs: new Array(this.idMax), parents: new Array(this.idMax) };
		for (let objId = 1; objId <= this.idMax; objId++) {
			let offset: number = this.avsIdx[objId];
			let endOffset: number = this.avsIdx[objId + 1];

			let attributeIndex: number = 0;
			let foundChildAttr: boolean = false;
			let foundParentAttr: boolean = false;
			while ((offset < endOffset) && (!foundChildAttr || !foundParentAttr)) {
				let valueIndex: any = Svf2Properties.readUInt32(this.avsPack, offset);
				// attribute ID is delta encoded from the previously seen attribute ID, add that back in
				attributeIndex += valueIndex.value;

				if (attributeIndex === childAttrId) {
					foundChildAttr = true;
					if (!results.childs.includes(objId))
						results.childs.push(objId);
				}
				if (attributeIndex === parentAttrId) {
					foundParentAttr = true;
					if (!results.parents.includes(objId))
						results.parents.push(objId);
				}

				valueIndex = Svf2Properties.readUInt32(this.avsPack, valueIndex.offset);
				offset = valueIndex.offset;
			}
		}

		roots = results.childs.filter((x: number): boolean => !results.parents.includes(x));

		return (roots);
	}

	public buildFullTree(nodeId: number, withProperties: boolean, keepHidden: boolean, keepInternals: boolean): any {
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
		result.objects = node.properties.__internal__.child.map((id: number): any => this.buildFullTree(id, withProperties, keepHidden, keepInternals));
		return (result);
	}

	public buildTree(viewable_in: string, withProperties: boolean, keepHidden: boolean, keepInternals: boolean): any {
		const nodeIds: number[] = this.findRootNodes();
		const node: any = this.read(nodeIds[0], keepHidden, true);
		let result: any = withProperties ? node : {
			name: node.name,
			objectid: nodeIds[0],
			//objects: [],
		};
		if (!node.properties.__internal__.child)
			return (result);
		if (!Array.isArray(node.properties.__internal__.child))
			node.properties.__internal__.child = [node.properties.__internal__.child];
		result.objects = node.properties.__internal__.child.map((id: number): any => this.buildFullTree(id, true, keepHidden, keepInternals));

		const isIn = (node: any): boolean => {
			if (node.objects)
				node.objects = node.objects.filter((elt: any): boolean => isIn(elt));
			if (node.objects && node.objects.length > 0) {
				if (!withProperties) {
					delete node.properties;
					delete node.externalId;
				}
				return (true);
			}
			delete node.objects;
			if (!node.properties || !node.properties.__internal__ || !node.properties.__internal__.viewable_in) {
				if (!withProperties) {
					delete node.properties;
					delete node.externalId;
				}
				return (false);
			}
			const cmp: boolean = node.properties.__internal__.viewable_in.indexOf(viewable_in) !== -1;
			if (!withProperties) {
				delete node.properties;
				delete node.externalId;
			}
			return (cmp);
		};

		isIn(result);

		return (result);
	}

	//-----

	private static Mask1: number = 0x7f; // 127
	private static Mask2: number = 0x80; // 128
	private static ShiftBy: number = 7;

	protected static readUInt32(pack: Buffer, offset: number): { value: number, offset: number } {
		let b: number = pack[offset++];
		let value: number = b & Svf2Properties.Mask1;
		let shiftBy: number = Svf2Properties.ShiftBy;

		while ((b & Svf2Properties.Mask2) != 0) {
			b = pack[offset++];
			value |= (b & Svf2Properties.Mask1) << shiftBy;
			shiftBy += Svf2Properties.ShiftBy;
		}

		return ({ value: value, offset: offset });
	}

	protected static _buildEAV(objectId: number, avs32: Uint32Array, pack: Buffer): { attributeIndex: number, valueIndex: number }[] {
		let offset: number = avs32[objectId];
		const endOffset: number = avs32[objectId + 1];

		const result: { attributeIndex: number, valueIndex: number }[] = [];
		let attributeIndex: number = 0;
		while (offset < endOffset) {
			let valueIndex: any = Svf2Properties.readUInt32(pack, offset);
			// attribute ID is delta encoded from the previously seen attribute ID, add that back in
			attributeIndex += valueIndex.value;
			valueIndex = Svf2Properties.readUInt32(pack, valueIndex.offset);
			offset = valueIndex.offset;
			result.push({
				attributeIndex: attributeIndex,
				valueIndex: valueIndex.value
			});
		}
		return (result);
	}

	protected static _readProperty(attributeIndex: number, valueIndex: number, attrs: any, vals: any): any {
		const attr: any = attrs[attributeIndex];
		const attrType: number = attr[AttributeFieldIndex.iTYPE];
		let value: boolean | number | string | number[] | string[] | Date = '';
		switch (attrType) {
			case AttributeType.Unknown:
			case AttributeType.String:
			case AttributeType.LocalizableString:
			case AttributeType.BLOB:
			case AttributeType.GeoLocation: // LatLonHeight - ISO6709 Annex H string, e.g: "+27.5916+086.5640+8850/" for Mount Everest
			default:
				value = vals[valueIndex];
				break;
			case AttributeType.Boolean:
				value = !(vals[valueIndex] === 0);
				break;
			case AttributeType.Integer:
				value = Number.parseInt(vals[valueIndex]);
				break;
			case AttributeType.Double:
			case AttributeType.Float:
				value = Number.parseFloat(vals[valueIndex]);
				break;
			case AttributeType.DbKey: // represents a link to another object in the database, using database internal ID
				// As of V2, DbKey attribute values are stored directly into the AV array
				//if (attr[AttributeFieldIndex.iFLAGS] & AttributeFlags.afDirectStorage)
				value = valueIndex;
				//console.log(`AttributeType.DbKey => ${value}`);
				break;
			case AttributeType.DateTime: // ISO 8601 date
				value = new Date(vals[valueIndex]);
				break;
			case AttributeType.Position: // "x y z w" space separated string representing vector with 2,3 or 4 elements
				value = vals[valueIndex].split(' ');
				value = (value as string[]).map((elt: string): number => Number.parseFloat(elt));
				break;
		}
		return (value);
	}

	protected static _readPropertyAsString(attributeIndex: number, valueIndex: number, attrs: any, vals: any): string | number {
		const attr: any = attrs[attributeIndex];
		const attrType: number = attr[AttributeFieldIndex.iTYPE];
		let value: string | number = '';
		switch (attrType) {
			case AttributeType.Unknown:
			case AttributeType.String:
			case AttributeType.LocalizableString:
			case AttributeType.BLOB:
			case AttributeType.GeoLocation: // LatLonHeight - ISO6709 Annex H string, e.g: "+27.5916+086.5640+8850/" for Mount Everest
			default:
				value = vals[valueIndex];
				break;
			case AttributeType.Boolean:
				value = !(vals[valueIndex] === 0) ? 'Yes' : 'No';
				break;
			case AttributeType.Integer:
				value = Number.parseInt(vals[valueIndex]).toString();
				break;
			case AttributeType.Double:
			case AttributeType.Float:
				value = Number.parseFloat(vals[valueIndex]).toFixed(3);
				break;
			case AttributeType.DbKey: // represents a link to another object in the database, using database internal ID
				// As of V2, DbKey attribute values are stored directly into the AV array
				//if (attr[AttributeFieldIndex.iFLAGS] & AttributeFlags.afDirectStorage)
				value = valueIndex;
				//console.log(`AttributeType.DbKey => ${value}`);
				break;
			case AttributeType.DateTime: // ISO 8601 date
				//value = new Date(vals[valueIndex]);
				value = vals[valueIndex].toString();
				break;
			case AttributeType.Position: // "x y z w" space separated string representing vector with 2,3 or 4 elements
				value = vals[valueIndex];
				break;
		}
		return (value);
	}

}

export default Svf2Properties;