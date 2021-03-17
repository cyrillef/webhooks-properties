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

import * as _fs from 'fs';
import * as _path from 'path';
import * as util from 'util';

const _fsExists = util.promisify(_fs.exists);
const _fsUnlink = util.promisify(_fs.unlink);
const _fsReadFile = util.promisify(_fs.readFile);
const _fsWriteFile = util.promisify(_fs.writeFile);

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

enum AttributeFlags {
	afHidden = 1 << 0, // Attribute will not be displayed in default GUI property views.
	afDontIndex = 1 << 1, // Attribute will not be indexed by the search service.
	afDirectStorage = 1 << 2, // Attribute is not worth de-duplicating (e.g. vertex data or dbId reference)
	afReadOnly = 1 << 3 // Attribute is read-only (used when writing back to the design model, in e.g. Revit)
}

class OTG_Test {

	public constructor() {
	}

	public static async idMapping(): Promise<void> {
		const avsIdxPath: string = _path.resolve(__dirname, '../../cache/test/dbid.idx');
		const idsIdx: Buffer = await _fsReadFile(avsIdxPath, null);

		const ids32: Uint32Array = new Uint32Array(idsIdx.buffer, idsIdx.byteOffset + 4, (idsIdx.byteLength / Uint32Array.BYTES_PER_ELEMENT) - 1);
		let lmvId: number = 1;
		const mapping: Map<number, number> = new Map<number, number>();
		const mappingObject: any = {};
		ids32.forEach((otgId: number): void => {
			// Instead of adding, overwrite any duplicate IDs in the map
			// If an element's design ID is missing, the ID of its parent 
			// element is used instead. In these cases, the element with 
			// the missing design ID is not important - usually empty in
			// terms of properties and geometry.
			mapping.set(otgId, lmvId);
			mappingObject[otgId] = lmvId++;
		});
		console.log(mapping);

		const ids32_: Uint32Array = new Uint32Array(idsIdx.buffer, idsIdx.byteOffset, idsIdx.byteLength / Uint32Array.BYTES_PER_ELEMENT);
		// const mappingArray: number[] = Array.from(ids32_);
		// console.log(mappingArray);
	}

	private static Mask1: number = 0x7f; // 127
	private static Mask2: number = 0x80; // 128
	private static ShiftBy: number = 7;

	protected static readUInt32(pack: Buffer, offset: number): { value: number, offset: number } {
		let b: number = pack[offset++];
		let value: number = b & OTG_Test.Mask1;
		let shiftBy: number = OTG_Test.ShiftBy;

		while ((b & OTG_Test.Mask2) != 0) {
			b = pack[offset++];
			value |= (b & OTG_Test.Mask1) << shiftBy;
			shiftBy += OTG_Test.ShiftBy;
		}

		return ({ value: value, offset: offset });
	}

	protected static buildEAV(objectId: number, avs32: Uint32Array, pack: Buffer): { attributeIndex: number, valueIndex: number }[] {
		let offset: number = avs32[objectId];
		const endOffset = avs32[objectId + 1];

		const result: { attributeIndex: number, valueIndex: number }[] = [];
		let attributeIndex: number = 0;
		while (offset < endOffset) {
			let valueIndex: any = OTG_Test.readUInt32(pack, offset);
			// attribute ID is delta encoded from the previously seen attribute ID, add that back in
			attributeIndex += valueIndex.value;
			valueIndex = OTG_Test.readUInt32(pack, valueIndex.offset);
			offset = valueIndex.offset;
			result.push({
				attributeIndex: attributeIndex,
				valueIndex: valueIndex.value
			});
		}
		return (result);
	}

	protected static getValue(attributeIndex: number, valueIndex: number, attrs: any, vals: any): any {
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

	public static async run(): Promise<void> {
		const avsIdxPath: string = _path.resolve(__dirname, '../../cache/test/avs.idx');
		const avsIdx: Buffer = await _fsReadFile(avsIdxPath, null);

		const avs32: Uint32Array = new Uint32Array(avsIdx.buffer, avsIdx.byteOffset, avsIdx.byteLength / Uint32Array.BYTES_PER_ELEMENT);
		//console.log(avs32);

		const avsPackPath: string = _path.resolve(__dirname, '../../cache/test/avs.pack');
		const avsPack: Buffer = await _fsReadFile(avsPackPath, null);

		const test: any = OTG_Test.buildEAV(3177, avs32, avsPack);
		//console.log(test);

		const attrsPath: string = _path.resolve(__dirname, '../../cache/test/attrs.json');
		const attrs: any = JSON.parse((await _fsReadFile(attrsPath, null)).toString('utf8'));

		const valsPath: string = _path.resolve(__dirname, '../../cache/test/vals.json');
		const vals: any = JSON.parse((await _fsReadFile(valsPath, null)).toString('utf8'));

		for (let index = 0; index < test.length; index++) {
			const elt: any = test[index];
			console.log(index, attrs[elt.attributeIndex], OTG_Test.getValue(elt.attributeIndex, elt.valueIndex, attrs, vals));
		}
	}

}

const run = async (fctName: string, index: string) => {
	await OTG_Test.run();
	process.exit(0);
};

run(process.argv[2], process.argv[3] || '0');