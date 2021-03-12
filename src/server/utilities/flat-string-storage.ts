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

export class FlatStringStorage {

	private buf: Uint8Array = null;
	private idx: number[] = [];
	private next: number = 0;

	constructor(initial: any) {
		if (initial) {
			this.buf = initial.buf;
			this.idx = initial.idx;
			this.next = initial.next;
		} else {
			this.buf = new Uint8Array(256);
			this.next = 0;
			this.idx = [0];
		}
	}

	public allocate(len: number): void {
		if (this.buf.length - this.next < len) {
			const nsz: number = Math.max(this.buf.length * 3 / 2, this.buf.length + len);
			const nb: Uint8Array = new Uint8Array(nsz);
			nb.set(this.buf);
			this.buf = nb;
		}
	}

	public add(st: string): number {
		if (st === null || (typeof st === 'undefined'))
			return (0);

		if (!st.length) {
			this.idx.push(this.next);
			return (this.idx.length - 1);
		}

		const len: number = FlatStringStorage.utf16to8(st, null);
		this.allocate(len);
		this.next += FlatStringStorage.utf16to8(st, this.buf, this.next);
		this.idx.push(this.next);
		return (this.idx.length - 1);
	}

	public get(index: number): string {
		if (!index)
			return (undefined);

		const start: number = this.idx[index - 1];
		const end: number = this.idx[index];
		if (start === end)
			return ('');
		return (FlatStringStorage.utf8BlobToStr(this.buf, start, end - start));
	}

	public flatten(): Int32Array {
		//return (FlatStringStorage.arrayToBuffer(this.idx));
		//TODO: we could also clip this.buf to the actually used size, but that requires reallocation
		return (null);
	}

	// Utils

	public static utf16to8(str: string, array: Uint8Array, start?: number): number {
		let j = start || 0;
		const len = str.length;

		if (array) {
			for (let i = 0; i < len; i++) {
				const c: number = str.charCodeAt(i);
				if ((c >= 0x0001) && (c <= 0x007F)) {
					array[j++] = c;
				} else if (c > 0x07FF) {
					array[j++] = 0xE0 | ((c >> 12) & 0x0F);
					array[j++] = 0x80 | ((c >> 6) & 0x3F);
					array[j++] = 0x80 | ((c >> 0) & 0x3F);
				} else {
					array[j++] = 0xC0 | ((c >> 6) & 0x1F);
					array[j++] = 0x80 | ((c >> 0) & 0x3F);
				}
			}
		} else {
			// If no output buffer is passed in, estimate the required
			// buffer size and return that.
			for (let i = 0; i < len; i++) {
				const c: number = str.charCodeAt(i);
				if ((c >= 0x0001) && (c <= 0x007F))
					j++;
				else if (c > 0x07FF)
					j += 3;
				else
					j += 2;
			}
		}

		return (j - (start || 0));
	}

	public static utf8BlobToStr(array: Uint8Array, start: number, length: number) {
		let out: string = '';
		const len: number = length;
		let i: number = 0;
		while (i < len) {
			const c: number = array[start + i++];
			switch (c >> 4) {
				case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
					// 0xxxxxxx
					out += String.fromCharCode(c);
					break;
				case 12: case 13:
					// 110x xxxx   10xx xxxx
					const char2: number = array[start + i++];
					out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
					break;
				case 14:
					// 1110 xxxx  10xx xxxx  10xx xxxx
					const char2_: number = array[start + i++];
					const char3 = array[start + i++];
					out += String.fromCharCode(((c & 0x0F) << 12) |
						((char2_ & 0x3F) << 6) |
						((char3 & 0x3F) << 0));
					break;
			}
		}

		return (out);
	}

	public static arrayToBuffer(arr: Uint8Array): Int32Array {
		const b: Int32Array = new Int32Array(arr.length);
		b.set(arr);
		return (b) ;
		//return (Buffer.from(b));
	}

}

export default FlatStringStorage;
