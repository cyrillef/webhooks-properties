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

export class JsonDiff {

	private lhs: any = null;
	private rhs: any = null;
	private keys: string[] = []; // keys to order array of objects, per level.
	private compares: any = null;
	private diffs: Map<string, string> = null;

	constructor(lhs: string | object, rhs: string | object, keys?: string[], compares?: any) {
		try {
			this.keys = keys || [''];
			// Make copies
			this.lhs = JSON.parse(typeof lhs === 'string' ? lhs : JSON.stringify(lhs as any));
			this.rhs = JSON.parse(typeof rhs === 'string' ? rhs : JSON.stringify(rhs as any));
			if (compares)
				this.compares = compares;
			this.compare();
		} catch (ex) {
		}
	}

	public get areEquals(): boolean {
		return (this.diffs === null);
	}

	protected orderKey(level: number): string {
		return (this.keys.length >= level + 1 ? this.keys[level] : this.keys[0]);
	}

	protected compare(bStrict: boolean = false): boolean {
		if (!this.lhs || !this.rhs)
			return (false);
		// First iterate each side, and order elements if an object (we do not reorder arrays, unless their content is objects)
		if (this.lhs instanceof Object || (Array.isArray(this.lhs) && this.lhs.length > 0 && typeof this.lhs[0] === 'object'))
			this.reorderObject(this.lhs, 0);
		if (this.rhs instanceof Object || (Array.isArray(this.rhs) && this.rhs.length > 0 && typeof this.rhs[0] === 'object'))
			this.reorderObject(this.rhs, 0);

		// Atomics and objects are easy to compare, Arrays are more complicated
		this.compareObjects(this.lhs, this.rhs, '', '//');

		return (this.areEquals);
	}

	protected reorderObject(obj: any, level: number): any {
		const self = this;
		if (typeof obj !== 'object')
			return (obj);
		if (Array.isArray(obj))
			return (this.reorderArray(obj, level));

		const keys = Object.keys(obj).sort();
		keys.map((key: string): void => {
			const item = obj[key];
			delete obj[key];
			obj[key] = self.reorderObject(item, level + 1);
		});
		return (obj);
	}

	protected reorderArray(obj: any, level: number): any {
		const self = this;
		if (!Array.isArray(obj) || obj.length === 0 || typeof obj[0] !== 'object') // we do not reorder arrays, unless their content is objects
			return (obj);

		if (Array.isArray(obj[0]))
			return (obj.map((elt: any): any => self.reorderArray(elt, level + 1)));

		if (!this.keys || this.keys.length === 0)
			return (obj);
		const orderKey: string = this.orderKey(level);
		if (orderKey !== '')
			obj = obj.sort((a: any, b: any): number => {
				if (a[orderKey] === b[orderKey])
					return (0);
				if (a[orderKey] < b[orderKey])
					return (-1);
				return (1);
			});
		obj = obj.map((elt: any): any => self.reorderObject(elt, level + 1));

		return (obj);
	}

	protected compareObjects(lhs: any, rhs: any, key: number | string, path: string): boolean {
		const self = this;
		if (lhs === undefined)
			return (this.logDiff(path, 'missing on left'));
		if (rhs === undefined)
			return (this.logDiff(path, 'missing on right'));
		if (this.compares && this.compares[key]) {
			const result: number = this.compares[key](lhs, rhs);
			if (result === 0)
				return (true);
		} else if (lhs === rhs) { // atomics
			return (true);
		}
		// they must have the exact same prototype chain, the closest we can do is test there constructor.
		if (lhs.constructor !== rhs.constructor)
			return (this.logDiff(path, 'not of the same type'));
		if (typeof lhs !== 'object' || typeof rhs !== 'object') // object or array
			return (this.logDiff(path, `not equal`));

		if (Array.isArray(lhs))
			return (this.compareArrays(lhs, rhs, path));

		// Compare left to right
		const Left2Right: boolean = Object.keys(lhs).sort()
			.map((key: string): boolean => self.compareObjects(lhs[key], rhs[key], key, `${path}${key}/`))
			.filter((res: boolean) => res)
			.length > 0;
		// Compare right to left ( but no repeat copmaraisons, we only need to detect missing keys )
		const Right2Left: boolean = Object.keys(rhs).sort()
			.map((key: string): boolean => (!lhs.hasOwnProperty(key) ? self.logDiff(`${path}${key}/`, 'missing on left') : true))
			.filter((res: boolean) => res)
			.length > 0;

		return (Left2Right && Right2Left);
	}

	protected compareArrays(lhs: any, rhs: any, path: string): boolean {
		const self = this;
		if (!Array.isArray(lhs) || !Array.isArray(lhs))
			return (false); // should not happen

		if (lhs.length > 0 && Array.isArray(lhs[0])) {
			return (lhs
				.map((elt: any, index: number): any => self.compareObjects(elt, rhs[index], index, `${path}${index}/`))
				.filter((res: boolean) => res)
				.length > 0
			);
		}

		if (lhs.length > 0 && typeof lhs[0] === 'object') {
			const level: number = path.split('/').length - 4;
			const orderKey: string = this.orderKey(level);
			lhs.map((elt: any, index: number): any => {
				let findElt: any = -1;
				if (orderKey !== '')
					findElt = rhs.filter((relt: any): boolean => elt[orderKey] === relt[orderKey]);
				else
					findElt = rhs.length > index ? [rhs[index]] : [];

				if (!findElt || findElt.length === 0)
					return (self.logDiff(`${path}[${orderKey}=${elt[orderKey || index]}]`, 'missing on right'));
				return (self.compareObjects(elt, findElt[0], orderKey || index, `${path}[${orderKey || index}=${elt[orderKey || index]}]`));
			});
		}
		if (rhs.length > 0 && typeof rhs[0] === 'object') {
			const level: number = path.split('/').length - 4;
			const orderKey: string = this.orderKey(level);
			rhs.map((elt: any, index: number): any => {
				let findElt: any = -1;
				if (orderKey !== '')
					findElt = lhs.filter((lelt: any): boolean => elt[orderKey] === lelt[orderKey]);
				else
					findElt = lhs.length > index ? [lhs[index]] : [];

				if (!findElt || findElt.length === 0)
					return (self.logDiff(`${path}[${orderKey}=${elt[orderKey || index]}]`, 'missing on left'));
				return (true); // no need to compare again
			});
		}

		// good enough for atomics
		if (lhs.length !== rhs.length)
			this.logDiff(path, 'warning: arrays do not have the same length');
		if (lhs.length > 0 && typeof lhs[0] === 'object' /*&& rhs.length > 0 && typeof rhs[0] === 'object'*/)
			return (true);
		if (JSON.stringify(lhs) !== JSON.stringify(rhs))
			return (this.logDiff(path, 'arrays content are different'));
		return (true);
	}

	protected logDiff(path: string, msg: string): boolean {
		if (this.diffs === null)
			this.diffs = new Map<string, string>();

		if (!this.diffs.get(path))
			this.diffs.set(path, msg);

		return (false); // always
	}

	public toString(indent: number = 0): string {
		if (this.diffs === null)
			return ('');
		const obj: any = {}
		for (let [k, v] of this.diffs.entries())
			obj[k] = v;
		return (JSON.stringify(obj, null, indent));
	}

	// Utils

	public static sortObjectProperties(obj: any, keys?: string[]): any {
		const jsonDiff: JsonDiff = new JsonDiff({}, {}, keys);
		jsonDiff.reorderObject(obj, 0);
		return (obj);
	}

}

export default JsonDiff