//
// Copyright (c) 2018 Autodesk, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

import PackFileStream from './packfile';
import * as THREE from 'three';

class FragmentListReader extends PackFileStream {

	public static readonly FragmentListEntryVersion: number = 5;
	public static readonly VisibilityFlagMask: number = 0x01;

	protected version: number = FragmentListReader.FragmentListEntryVersion;
	public fragments: any = {};
	public transforms: any = {};
	public idMap: any[] = [];

	// https://developer.api.autodesk.com/derivativeservice/v2/viewers/wgs.js
	constructor(packageDefinition = {}, typeset = {}, littleEndian: boolean = true) {
		super(packageDefinition, typeset, littleEndian);
		this._init();
		this.fragments = {};
		this.transforms = {};
		//this.idMap = {};
		this.idMap = [];
	}

	protected _init(): void {
		this.version = this.getVersion(); // Latest is 5
	}

	public getEntryIndex(id: number): number {
		return (this.idMap.indexOf(id));
	}

	public readFragmentList(): number {
		// Don't parse future versions.
		if (this.getVersion() > FragmentListReader.FragmentListEntryVersion)
			// Cannot read instance tree: tree was encoded by a newer version of the LMV Toolkit.
			return (0);

		const nb: number = this.getEntryCounts();
		this.idMap = new Array(nb);
		for (let i = 0; i < nb; i++) {
			const item: any = this.readFragmentListEntry(i, true);
			//this.idMap[item.id] = i; // this.dataSegOffsetList[i];
			//this.idMap.push (item.id);
			this.idMap[i] = item.id;
		}
		return (this.idMap.length);
	}

	public readFragmentListEntry(entry: number, store: boolean = false): any {
		if (this.fragments[entry] !== undefined)
			return (this.fragments[entry]);
		// Seek to entry, verify that it's acceptable
		if (!this.seekToEntry(entry))
			return (false);
		let obj: any = {};
		obj.visible = true;
		if (this.getVersion() > 4) {
			const flags: number = this.readU8();
			obj.visible = (flags & FragmentListReader.VisibilityFlagMask) === FragmentListReader.VisibilityFlagMask;
		}

		const materialIndex: number = this.readU32V();
		// Actually, the material index is equal to the material ID as materials are store in a JSON list.
		// Otherwise, we would need to read the material list.
		obj.materialID = materialIndex;

		if (this.getVersion() > 2) // Read metadata index and metadata from that stream
			obj.geometryEntry = this.readU32V();
		else // Read geometry reference
			obj.geometryMetadata = this.readPackFileReference();
		obj.transform = this.readTransform();

		const min = this.readPoint3f();
		const max = this.readPoint3f();
		obj.boundingBox = new THREE.Box3();
		if (this.getVersion() >= 4) {
			// With version 4 the bounding box is stored with the translation subtracted
			const translation = obj.transform.tr || new THREE.Vector3();
			obj.boundingBox = new THREE.Box3(min.add(translation), max.add(translation));
		} else {
			obj.boundingBox = new THREE.Box3(min, max);
		}
		obj.id = 0;
		if (this.getVersion() > 1)
			obj.id = this.readU64V();
		obj.instanceTreePath = this.readPathID();
		if (store) {
			this.fragments[entry] = obj;
			this.transforms[entry] = null;
		}
		return (obj);
	}

	public writeFragmentListEntry(): void {
		// TO-IMPLEMENT: writeFragmentListEntry
	}

	public getOriginalWorldMatrix(index: number): THREE.Matrix4 {
		let dstMtx = new THREE.Matrix4();
		dstMtx.identity();
		if (this.transforms[index])
			dstMtx = this.transforms[index];
		return (dstMtx);
	}

}

export default FragmentListReader;
