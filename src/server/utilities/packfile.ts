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
import * as zlib from 'zlib';
import Int64 from './Int64';
import { Duplex, /*Writable,*/ Readable } from 'stream';
import * as THREE from 'three';

let StreamMode = {
	read: 'r',
	write: 'w',
};

const AutodeskCloudPlatformPackFile = 'Autodesk.CloudPlatform.PackFile';
const AutodeskCloudPlatformPackFile64 = 'Autodesk.CloudPlatform.PackFile64';
const PackFileCurrentVersion = 2;
const defaultWriteSize = 10 * 1024 * 1024; // 10 Mb

const TransformType = {
	TT_Translation: 0,
	TT_RotationTranslation: 1,
	TT_UniformScaleRotationTranslation: 2,
	TT_AffineMatrix: 3,
	TT_Identity: 4,
};

const TransformTypeString = [
	'Translation',
	'RotationTranslation',
	'UniformScaleRotationTranslation',
	'AffineMatrix',
	'Identity',
];

interface Transform {
	mtype: string,
	tr?: THREE.Vector3,
	rt?: THREE.Quaternion,
	scale?: number,
	mt?: THREE.Matrix3
}

interface FileReference {
	manifestID: string,
	index: number
}

interface TypeSet {
	class: string,
	type: string,
	version: number
}

class MemoryWritable extends Duplex {

	protected buffer: Buffer = null;
	protected offset: number = -1;

	constructor(options?: any) {
		// Calls the stream.Writable() constructor
		super(options || {});
		// ...
		this.buffer = null;
		this.offset = 0;
	}

	_read(size: number): void {
		if (this.buffer.length <= 0)
			return (this.push(null), undefined);
		this.push(this.buffer.slice(0, size));
		this.buffer = this.buffer.slice(size);
	}

	_write(chunk: Uint8Array, encoding: string, cb: () => void) {
		this.buffer = this.buffer ? Buffer.concat([this.buffer, chunk]) : Buffer.from(chunk);
		cb();
	}

	_destroy() {
		this.offset = -1;
		this.buffer = undefined;
	}

}

class MemoryReadable extends Readable {

	protected buffer: Buffer = null;
	protected offset: number = -1;

	constructor(data: Buffer, options?: any) {
		// Calls the stream.Readable() constructor
		super(options || {});
		// ...
		this.buffer = data;
		this.offset = 0;
	}

	_read(size: number): void {
		if (!this.buffer || this.buffer.length <= 0)
			return (this.push(null), undefined);
		this.push(this.buffer.slice(0, size));
		this.buffer = this.buffer.slice(size);
	}

	_destroy() {
		this.offset = -1;
		this.buffer = undefined;
	}

}

class PackFileStream {

	protected littleEndian: boolean = true;
	protected packFileVersion = PackFileCurrentVersion;
	protected is64PackFile: boolean = false;
	protected dataSegOffsetList: number[] = undefined;
	protected typeSets: TypeSet[] = undefined;

	protected packageDefinition: any = null;
	protected typeSet: any = null;
	protected packFileStream: MemoryReadable | MemoryWritable | _fs.ReadStream | _fs.WriteStream = undefined;
	protected buffer: Buffer = undefined;
	protected dataView: DataView = undefined;
	protected compress: boolean = false;
	protected offset: number = 0;
	protected tocOffset: number = 0;
	protected typesOffset: number = 0;

	constructor(packageDefinition: any = {}, typeset: any = {}, littleEndian: boolean = true) {
		this.littleEndian = littleEndian;
		this.packFileVersion = PackFileCurrentVersion;
		this.is64PackFile = false;
		this.dataSegOffsetList = undefined;
		this.typeSets = undefined;
		this._reset(packageDefinition, typeset);
	}

	protected _reset(packageDefinition?: any, typeset?: any): void {
		this.packageDefinition = packageDefinition || this.packageDefinition || {};
		this.typeSet = typeset || this.typeSet || {};

		this.packFileStream = undefined;
		this.buffer = undefined;
		this.dataView = undefined;
		this.compress = false;

		this.offset = 0;
	}

	protected _memcpy(dst: ArrayBufferLike, dstOffset: number, src: ArrayBufferLike, srcOffset: number, length: number): void {
		let dstU8: Uint8Array = new Uint8Array(dst, dstOffset, length);
		let srcU8: Uint8Array = new Uint8Array(src, srcOffset, length);
		dstU8.set(srcU8);
	}

	protected _increaseBufferIfNecessary(incomingDataSize: number): void {
		if ((this.buffer.length - this.offset) < incomingDataSize) {
			const newBuffer: Buffer = Buffer.alloc(this.buffer.length + defaultWriteSize);
			this.buffer.copy(newBuffer, 0, 0, this.offset);
			this.buffer = newBuffer;
			this.dataView = new DataView(this.buffer.buffer);
		}
	}

	protected _preWrite(size: number): void {
		if (this.offset + size > this.buffer.length)
			this._increaseBufferIfNecessary(size);
	}

	public getVersion(): number {
		return (this.typeSet.version || 1); // Default version is 1 (latest) before we started storing the version number in the type set table.
	}

	public getPackFileVersion(): number {
		return (this.packFileVersion);
	}

	public open(mode: string, file: Buffer): Promise<void> {
		let _this = this;
		this._reset();
		return (new Promise((resolve, reject) => {
			let bMemoryMode: boolean = (file === undefined || Buffer.isBuffer(file));
			switch (mode) {
				case StreamMode.read:
					_this.packFileStream = (bMemoryMode ? new MemoryReadable(file) : _fs.createReadStream(file, {
						autoClose: true
					}));
					if (file === undefined)
						return (resolve());

					_this.packFileStream
						.pipe(zlib.createGunzip())
						.on('data', (data) => {
							//_this.buffer = _this.buffer ? Buffer.concat([_this.buffer, data]) : data;
							if (_this.buffer === undefined) {
								_this.buffer = Buffer.alloc(Math.max(_this.packageDefinition.usize || 0, 4 * file.length, data.length)); // Make it large enough to be reduce later
								_this.offset = 0;
							} else if (_this.offset + data.length > _this.buffer.length) {
								const tmpBuffer = Buffer.alloc(_this.buffer.length + 2 * data.length);
								_this.buffer.copy(tmpBuffer, 0, 0, _this.offset);
								_this.buffer = tmpBuffer;
							}
							data.copy(_this.buffer, _this.offset, 0, data.length);
							_this.offset += data.length;
						})
						.on('finish', () => {
							if (_this.buffer.length > _this.offset) {
								const tmpBuffer: Buffer = Buffer.alloc(_this.offset);
								_this.buffer.copy(tmpBuffer, 0, 0, _this.offset);
								_this.buffer = tmpBuffer;
							}
							_this.offset = 0;
							_this.dataView = new DataView(_this.buffer.buffer);
							if (_this.readHeader( /*this.packageDefinition.type*/ ))
								resolve();
							else
								reject('Wrong header');
						})
						.on('error', (err) => {
							reject(err);
						});
					break;
				case StreamMode.write:
					_this.packFileStream = (bMemoryMode ? new MemoryWritable() : _fs.createWriteStream(file, {
						autoClose: true
					}));
					//_this.compress = zlib.createGzip();
					//_this.compress.pipe(_this.packFileStream);
					_this.compress = true;

					_this.buffer = Buffer.alloc(defaultWriteSize); // 10Mb to start with
					_this.dataView = new DataView(_this.buffer.buffer);

					_this.writeHeader();
					resolve();
					break;
			}

		}));
	}

	public close(): Promise<Buffer> {
		let _this = this;
		return (new Promise((fulfill, reject) => {
			if (_this.packFileStream instanceof MemoryWritable || _this.packFileStream instanceof _fs.WriteStream) { // Strip unnecessary size
				this.writeEntries();
					
				let newBuffer = new Buffer(_this.offset);
				_this.buffer.copy(newBuffer, 0, 0, _this.offset);
				_this.buffer = newBuffer;
				_this.dataView = new DataView(_this.buffer.buffer);

				if (_this.compress) {
					// _this.compress.write(_this.buffer);
					// //_this.compress.flush(() => {});
					// _this.compress.flush(() => {
					// 	fulfill();
					// });
					// if (_this.packFileStream instanceof MemoryWritable)
					// 	_this.packFileStream.write(_this.compress._outBuffer);
					//_this.compress = undefined;
					zlib.gzip(_this.buffer, (err, data) => {
						if (err)
							return (reject(err));
						if (_this.packFileStream instanceof MemoryWritable || _this.packFileStream instanceof _fs.WriteStream) {
							_this.packFileStream.write(data, () => {
								fulfill(data);
							});
						}
					});
				} else {
					_this.packFileStream.write(_this.buffer, () => {
						fulfill(_this.buffer);
					});
				}
			} else {
				fulfill(_this.buffer);
			}
			//_this.packFileStream.end();
			//_this._reset();
		}));
	}

	public moveBy(inc: number): number {
		this.offset += inc;
		return (this.offset);
	}

	public moveTo(offset: number): number {
		this.offset = offset;
		return (this.offset);
	}

	public seekToEntry(entryIndex: number): boolean {
		const entryCounts: number = this.getEntryCounts();
		if (!entryCounts || entryIndex >= entryCounts)
			return (false);
		// Skip type index of data segment.
		this.offset = this.dataSegOffsetList[entryIndex] + Uint32Array.BYTES_PER_ELEMENT; // Skip typeset index
		return (true);
	}

	public seekToEntryWithTypeset(entryIndex: number): TypeSet | boolean {
		const entryCounts: number = this.getEntryCounts();
		if (!entryCounts || entryIndex >= entryCounts)
			return (false);
		this.offset = this.dataSegOffsetList[entryIndex];
		const index: number = this.readU32();
		return (index < this.typeSets.length ? this.typeSets[index] : true);
	}

	public getEntrySize(entryIndex: number): number | boolean {
		const entryCounts: number = this.getEntryCounts();
		if (!entryCounts || entryIndex >= entryCounts)
			return (false);
		let size: number = 0;
		if (entryIndex === entryCounts - 1)
			size = this.typesOffset - this.dataSegOffsetList[entryIndex] - Uint32Array.BYTES_PER_ELEMENT;
		else
			size = this.dataSegOffsetList[entryIndex + 1] - this.dataSegOffsetList[entryIndex] - Uint32Array.BYTES_PER_ELEMENT;
		return (size);
	}

	public readHeader(): boolean {
		const headerSt: string = this.readString();
		this.packFileVersion = this.readU32();
		this.is64PackFile = (headerSt === AutodeskCloudPlatformPackFile64);
		return (
			(headerSt === AutodeskCloudPlatformPackFile || headerSt === AutodeskCloudPlatformPackFile64) &&
			this.packFileVersion <= PackFileCurrentVersion
		);
	}

	public writeHeader(): void {
		this.writeString(this.is64PackFile ? AutodeskCloudPlatformPackFile64 : AutodeskCloudPlatformPackFile);
		this.writeU32(PackFileCurrentVersion);
	}

	public getEntryCounts(): number {
		if (this.dataSegOffsetList !== undefined)
			return (this.dataSegOffsetList.length);
		const currentOffset: number | Int64 = this.offset;
		if (this.is64PackFile) {
			// Jump to file footer.
			this.moveTo(this.buffer.length - 4 * Uint32Array.BYTES_PER_ELEMENT);
			// Jump to toc.
			this.tocOffset = this.readU64().valueOf();
			this.typesOffset = this.readU64().valueOf();
			// Populate type sets.
			this.moveTo(this.typesOffset);
			let typesCount = this.readU64V();
			this.typeSets = [];
			for (let i = 0; i < typesCount; i++)
				this.typeSets.push({
					class: this.readUTF8String(),
					type: this.readUTF8String(),
					version: this.readU32V()
				});
			// Populate data offset list.
			this.moveTo(this.tocOffset);
			let entryCounts = this.readU64V();
			this.dataSegOffsetList = [];
			for (let i = 0; i < entryCounts; i++)
				this.dataSegOffsetList.push(this.readU64().valueOf());
		} else {
			// Jump to file footer.
			this.moveTo(this.buffer.length - 2 * Uint32Array.BYTES_PER_ELEMENT);
			// Jump to toc.
			this.tocOffset = this.readU32();
			this.typesOffset = this.readU32();
			// Populate type sets.
			this.moveTo(this.typesOffset);
			const typesCount: number = this.readU32V();
			this.typeSets = [];
			for (let i = 0; i < typesCount; i++)
				this.typeSets.push({
					class: this.readUTF8String(),
					type: this.readUTF8String(),
					version: this.readU32V()
				});
			// Populate data offset list.
			this.moveTo(this.tocOffset);
			const entryCounts: number = this.readU32V();
			this.dataSegOffsetList = [];
			for (let i = 0; i < entryCounts; i++)
				this.dataSegOffsetList.push(this.readU32());
		}
		// Restore sanity of the world.
		this.moveTo(currentOffset);
		return (this.dataSegOffsetList.length);
	}

	public writeEntries(): void {
		if (this.is64PackFile) {
			// Populate type sets.
			const typesOffset: number = this.offset;
			const typesCount: number = this.typeSets === undefined ? 0 : this.typeSets.length;
			this.writeU64V(typesCount);
			for (let i = 0; i < typesCount; i++) {
				this.writeUTF8String(this.typeSets[i].class);
				this.writeUTF8String(this.typeSets[i].type);
				this.writeU32V(this.typeSets[i].version);
			}
			// Populate data offset list.
			const tocOffset: number = this.offset;
			const entryCounts: number = this.dataSegOffsetList === undefined ? 0 : this.dataSegOffsetList.length;
			this.writeU64V(entryCounts);
			for (let i = 0; i < entryCounts; i++)
				this.writeU64(new Int64 (this.dataSegOffsetList[i]));
			// Jump to toc.
			this.writeU64(new Int64(tocOffset));
			this.writeU64(new Int64(typesOffset));
		} else {
			// Populate type sets.
			const typesOffset: number = this.offset;
			const typesCount: number = this.typeSets === undefined ? 0 : this.typeSets.length;
			this.writeU32V(typesCount);
			for (let i = 0; i < typesCount; i++) {
				this.writeUTF8String(this.typeSets[i].class);
				this.writeUTF8String(this.typeSets[i].type);
				this.writeU32V(this.typeSets[i].version);
			}
			// Populate data offset list.
			const tocOffset: number = this.offset;
			const entryCounts: number = this.dataSegOffsetList === undefined ? 0 : this.dataSegOffsetList.length;
			this.writeU32V(entryCounts);
			for (let i = 0; i < entryCounts; i++)
				this.writeU32(this.dataSegOffsetList[i]);
			// Jump to toc.
			this.writeU32(tocOffset);
			this.writeU32(typesOffset);
		}
	}

	public readString(): string {
		let len: number = this.readU32();
		let tmp: string = String.fromCharCode.apply(null, this.buffer.slice(this.offset, this.offset + len));
		this.offset += len;
		return (tmp);
	}

	public writeString(val: string): void {
		this._preWrite(val.length + Uint32Array.BYTES_PER_ELEMENT);
		this.writeU32(val.length);
		for (let i = 0; i < val.length; i++)
			this.writeU8(val.charCodeAt(i));
	}

	public readUTF8String(): string {
		let len: number = this.readU32V();
		let tmp: string = String.fromCharCode.apply(null, this.buffer.slice(this.offset, this.offset + len));
		this.offset += len;
		return (tmp);
	}

	public writeUTF8String(val: string): void {
		this._preWrite(val.length + Uint32Array.BYTES_PER_ELEMENT);
		this.writeU32V(val.length);
		for (let i = 0; i < val.length; i++)
			this.writeU8(val.charCodeAt(i));
	}

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures

	public readU8(): number {
		try {
			return (this.dataView.getUint8(this.offset++));
		} catch (ex) {
			return (0);
		}
	}

	public writeU8(val: number): void {
		this._preWrite(1);
		this.dataView.setUint8(this.offset++, val);
	}

	public readS8(): number {
		try {
			return (this.dataView.getInt8(this.offset++));
		} catch (ex) {
			return (0);
		}
	}

	public writeS8(val: number): void {
		this._preWrite(1);
		this.dataView.setInt8(this.offset++, val);
	}

	public readU16(): number {
		try {
			let tmp: number = this.dataView.getUint16(this.offset, this.littleEndian);
			this.offset += Uint16Array.BYTES_PER_ELEMENT;
			return (tmp);
		} catch (ex) {
			return (0);
		}
	}

	public writeU16(val: number): void {
		this._preWrite(Uint16Array.BYTES_PER_ELEMENT);
		this.dataView.setUint16(this.offset, val, this.littleEndian);
		this.offset += Uint16Array.BYTES_PER_ELEMENT;
	}

	public readS16(): number {
		try {
			let tmp: number = this.dataView.getInt16(this.offset, this.littleEndian);
			this.offset += Int16Array.BYTES_PER_ELEMENT;
			return (tmp);
		} catch (ex) {
			return (0);
		}
	}

	public writeS16(val: number): void {
		this._preWrite(Int16Array.BYTES_PER_ELEMENT);
		this.dataView.setInt16(this.offset, val, this.littleEndian);
		this.offset += Int16Array.BYTES_PER_ELEMENT;
	}

	public readU32(): number {
		try {
			let tmp: number = this.dataView.getUint32(this.offset, this.littleEndian);
			this.offset += Uint32Array.BYTES_PER_ELEMENT;
			return (tmp);
		} catch (ex) {
			return (0);
		}
	}

	public writeU32(val: number): void {
		this._preWrite(Uint32Array.BYTES_PER_ELEMENT);
		this.dataView.setUint32(this.offset, val, this.littleEndian);
		this.offset += Uint32Array.BYTES_PER_ELEMENT;
	}

	public readS32(): number {
		try {
			let tmp: number = this.dataView.getInt32(this.offset, this.littleEndian);
			this.offset += Int32Array.BYTES_PER_ELEMENT;
			return (tmp);
		} catch (ex) {
			return (0);
		}
	}

	public writeS32(val: number): void {
		this._preWrite(Int32Array.BYTES_PER_ELEMENT);
		this.dataView.setInt32(this.offset, val, this.littleEndian);
		this.offset += Int32Array.BYTES_PER_ELEMENT;
	}

	// Javascript does not support Uint64/Int64 types, use the node-int64 package
	// Uint64 - we are not entirely correct below unless we get to the extremes...
	public readU64(): Int64 {
		try {
			const hi: number = this.dataView.getUint32(this.offset, this.littleEndian);
			this.offset += Uint32Array.BYTES_PER_ELEMENT;
			const lo: number = this.dataView.getUint32(this.offset, this.littleEndian);
			this.offset += Uint32Array.BYTES_PER_ELEMENT;
			return (new Int64(hi, lo));
		} catch (ex) {
			return (new Int64(0));
		}
	}

	public writeU64(val: Int64): void {
		this._preWrite(2 * Uint32Array.BYTES_PER_ELEMENT);
		const dataView: DataView = new DataView(val.buffer.buffer);
		this.dataView.setUint32(this.offset, dataView.getUint32(0), this.littleEndian);
		this.offset += Uint32Array.BYTES_PER_ELEMENT;
		this.dataView.setUint32(this.offset, dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT), this.littleEndian);
		this.offset += Uint32Array.BYTES_PER_ELEMENT;
	}

	public readS64(): Int64 {
		return (this.readU64());
	}

	public writeS64(val: Int64): void {
		this.writeU64(val);
	}

	protected _readVariant(): number {
		do {
			let byte: number = 0;
			let value: number = 0;
			let shiftBy: number = 0;
			do {
				byte = this.readU8();
				value |= (byte & 0x7f) << shiftBy;
				shiftBy += 7;
			} while (byte & 0x80);
			return (value);
		} while (true);
	}

	protected _writeVariant(val: number): void {
		do {
			let byte = val & 0x7f;
			val >>= 7;
			if (val)
				byte |= 0x80;
			this.writeU8(byte);
		} while (val);
	}

	public readU16V(): number {
		return (this._readVariant());
	}

	public writeU16V(val: number) {
		return (this._writeVariant(val));
	}

	public readS16V(): number {
		let value = this.readU16V();
		return ((value >> 1) ^ -(value & 1));
	}

	public writeS16V(val: number): void {
		const value: number = (val << 1) ^ (val >> 15);
		this.writeU16V(value);
	}

	public readU32V(): number {
		return (this._readVariant());
	}

	public writeU32V(val: number): void {
		this._writeVariant(val);
	}

	public readS32V(): number {
		const value: number= this.readU32V();
		return ((value >> 1) ^ -(value & 1));
	}

	public writeS32V(val: number): void {
		const value: number = (val << 1) ^ (val >> 31);
		this.writeU32V(value);
	}

	public readU64V(): number {
		return (this._readVariant());
	}

	public writeU64V(val: number): void {
		this._writeVariant(val);
	}

	public readS64V(): number {
		const value: number = this.readU64V();
		return ((value >> 1) ^ -(value & 1));
	}

	public writeS64V(val: number): void {
		const value: number = (val << 1) ^ (val >> 63);
		this.writeU64V(value);
	}

	public readF32(): number {
		try {
			const tmp: number = this.dataView.getFloat32(this.offset, this.littleEndian);
			this.offset += Float32Array.BYTES_PER_ELEMENT;
			return (tmp);
		} catch (ex) {
			return (0);
		}
	}

	public writeF32(val: number): void {
		this._preWrite(Float32Array.BYTES_PER_ELEMENT);
		this.dataView.setFloat32(this.offset, val, this.littleEndian);
		this.offset += Float32Array.BYTES_PER_ELEMENT;
	}

	public readF64(): number {
		try {
			const tmp: number = this.dataView.getFloat64(this.offset, this.littleEndian);
			this.offset += Float64Array.BYTES_PER_ELEMENT;
			return (tmp);
		} catch (ex) {
			return (0);
		}
	}

	public writeF64(val: number): void {
		this._preWrite(Float64Array.BYTES_PER_ELEMENT);
		this.dataView.setFloat64(this.offset, val, this.littleEndian);
		this.offset += Float64Array.BYTES_PER_ELEMENT;
	}

	public readVector2f(): THREE.Vector2 {
		return (new THREE.Vector2(this.readF32(), this.readF32()));
	}

	public writeVector2f(val: THREE.Vector2): void { // THREE.Vector2
		this.writeF32(val.x);
		this.writeF32(val.y);
	}

	public readVector3f(): THREE.Vector3 {
		return (new THREE.Vector3(this.readF32(), this.readF32(), this.readF32()));
	}

	public writeVector3f(val: THREE.Vector3): void { // THREE.Vector3
		this.writeF32(val.x);
		this.writeF32(val.y);
		this.writeF32(val.z);
	}

	public readVector2d(): THREE.Vector2 {
		return (new THREE.Vector2(this.readF64(), this.readF64()));
	}

	public writeVector2d(val: THREE.Vector2): void { // THREE.Vector2
		this.writeF64(val.x);
		this.writeF64(val.y);
	}

	public readVector3d(): THREE.Vector3 {
		return (new THREE.Vector3(this.readF64(), this.readF64(), this.readF64()));
	}

	public writeVector3d(val: THREE.Vector3): void { // THREE.Vector3
		this.writeF64(val.x);
		this.writeF64(val.y);
		this.writeF64(val.z);
	}

	public readPoint2f(): THREE.Vector2 {
		return (this.readVector2f());
	}

	public writePoint2f(val: THREE.Vector2): void {
		this.writeVector2f(val);
	}

	public readPoint3f(): THREE.Vector3 {
		return (this.readVector3f());
	}

	public writePoint3f(val: THREE.Vector3): void {
		this.writeVector3f(val);
	}

	public readPoint2d(): THREE.Vector2 {
		return (this.readVector2d());
	}

	public writePoint2d(val: THREE.Vector2): void {
		this.writeVector2d(val);
	}

	public readPoint3d(): THREE.Vector3 {
		return (this.readVector3d());
	}

	public writePoint3d(val: THREE.Vector3): void {
		this.writeVector3d(val);
	}

	public readMatrix3f(): THREE.Matrix3 {
		const mat: THREE.Matrix3 = new THREE.Matrix3();
		const ds: number[] = new Array(mat.elements.length);
		for (let i = 0; i < mat.elements.length; ++i)
			ds[i] = this.readF32();
		mat.fromArray(ds);
		return (mat);
	}

	public writeMatrix3f(val: THREE.Matrix3): void { // THREE.Matrix3
		for (let i = 0; i < val.elements.length; ++i)
			this.writeF32(val.elements[i]);
	}

	public readMatrix3d(): THREE.Matrix3 {
		const mat: THREE.Matrix3 = new THREE.Matrix3();
		const ds: number[] = new Array(mat.elements.length);
		for (let i = 0; i < mat.elements.length; ++i)
			ds[i] = this.readF64();
		mat.fromArray(ds);
		return (mat);
	}

	public writeMatrix3d(val: THREE.Matrix3): void { // THREE.Matrix3
		for (let i = 0; i < val.elements.length; ++i)
			this.writeF64(val.elements[i]);
	}

	public readQuaternionf(): THREE.Quaternion {
		return (new THREE.Quaternion(this.readF32(), this.readF32(), this.readF32(), this.readF32()));
	}

	public writeQuaternionf(val: THREE.Quaternion): void { // THREE.Quaternion
		this.writeF32(val.x);
		this.writeF32(val.y);
		this.writeF32(val.z);
		this.writeF32(val.w);
	}

	public readQuaterniond(): THREE.Quaternion {
		return (new THREE.Quaternion(this.readF64(), this.readF64(), this.readF64(), this.readF64()));
	}

	public writeQuaterniond(val: THREE.Quaternion): void { // THREE.Quaternion
		this.writeF64(val.x);
		this.writeF64(val.y);
		this.writeF64(val.z);
		this.writeF64(val.w);
	}

	public readBoundingBox(): THREE.Box3 { // THREE.Box3
		return (new THREE.Box3(this.readVector3f(), this.readVector3f()));
	}

	public writeBoundingBox(val: THREE.Box3): void {
		this.writeVector3f(val.min);
		this.writeVector3f(val.max);
	}

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures

	public readTransform(): Transform {
		let transformType = this.readU8();
		/* eslint-disable indent */
		/* eslint-disable no-fallthrough */
		switch (transformType) {
			case TransformType.TT_Identity:
				return ({
					mtype: TransformTypeString[transformType]
				});
			case TransformType.TT_Translation:
				{
					let translation = this.readVector3d(); // THREE.Vector3
					return ({
						mtype: TransformTypeString[transformType],
						tr: translation
					});
				}
			case TransformType.TT_RotationTranslation:
				{
					let rotation = this.readQuaternionf(); // Quaternionf
					let translation = this.readVector3d(); // THREE.Vector3
					return ({
						mtype: TransformTypeString[transformType],
						rt: rotation,
						tr: translation
					});
				}
			case TransformType.TT_UniformScaleRotationTranslation:
				{
					let scale = this.readF32();
					let rotation = this.readQuaternionf(); // Quaternionf
					let translation = this.readVector3d(); // THREE.Vector3
					return ({
						mtype: TransformTypeString[transformType],
						scale: scale,
						rt: rotation,
						tr: translation
					});
				}
			case TransformType.TT_AffineMatrix:
				{
					let affineMatrix = this.readMatrix3f(); // THREE.Matrix3
					let translation = this.readVector3d();
					return ({
						mtype: TransformTypeString[transformType],
						mt: affineMatrix,
						tr: translation
					});
				}
			default:
				break;
		}
		/* eslint-enable indent */
		/* eslint-enable no-fallthrough */

		// Reaching this point indicates a deserialization error
		return ({
			mtype: TransformTypeString[TransformType.TT_Identity]
		});
	}

	public writeTransform(transform: Transform): void {
		const type: number = TransformTypeString.indexOf(transform.mtype);
		this.writeU8(type);
		/* eslint-disable indent */
		switch (type) {
			case TransformType.TT_Identity:
				break;
			case TransformType.TT_Translation:
				{
					// let translation = new THREE.Vector3(transform.tr);
					// this.writeVector3d(translation);
					this.writeVector3d(transform.tr);
					break;
				}
			case TransformType.TT_RotationTranslation:
				{
					// let rotation = new THREE.Quaternion(transform.rt);
					// this.writeQuaternionf(rotation);
					// let translation = new THREE.Vector3(transform.tr);
					// this.writeVector3d(translation);
					this.writeQuaternionf(transform.rt);
					this.writeVector3d(transform.tr);
					break;
				}
			case TransformType.TT_UniformScaleRotationTranslation:
				{
					this.writeF32(transform.scale);
					// let rotation = new THREE.Quaternion(transform.rt);
					// this.writeQuaternionf(rotation);
					// let translation = new THREE.Vector3(transform.tr);
					// this.writeVector3d(translation);
					this.writeQuaternionf(transform.rt);
					this.writeVector3d(transform.tr);
					break;
				}
			case TransformType.TT_AffineMatrix:
				{
					// let affineMatrix = new THREE.Matrix3();
					// affineMatrix.set(transform.mt);
					// this.writeMatrix3f(affineMatrix);
					// let translation = new THREE.Vector3(transform.tr);
					// this.writeVector3d(translation);
					this.writeMatrix3f(transform.mt);
					this.writeVector3d(transform.tr);
					break;
				}
			default:
				break;
		}
		/* eslint-enable indent */
	}

	public readPathID(): number[] {
		// Type changed to varint in version 2.
		let pathLength: number = 0;
		if (this.getPackFileVersion() < 2)
			pathLength = this.readU16();
		else
			pathLength = this.readU32V();
		let path = new Array(pathLength);
		for (let i = 0; i < pathLength; i++) {
			if (this.getPackFileVersion() < 2)
				path[i] = this.readU16();
			else
				path[i] = this.readU32V();
		}
		return (path);
	}

	public writePathID(pathID: number[]): void {
		this.writeU32V(pathID.length);
		for (let i = 0; i < pathID.length; i++)
			this.writeU32V(pathID[i]);
	}

	public static pathIDString(pathID: string): string {
		return (pathID.toString().replace(/,/g, ':'));
	}

	public readPackFileReference(): FileReference {
		// Only needed for version 2 or less
		return ({
			manifestID: this.readUTF8String(),
			index: this.readU32V()
		});
	}

}

export default PackFileStream;
