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

import * as superagent from 'superagent';
import * as moment from 'moment';
import * as Forge from 'forge-apis';
import AppSettings from './app-settings';
import * as util from 'util';
import * as _fs from 'fs';
import * as _path from 'path';
import JsonDiff from './json-diff';
import * as diffx from 'deep-diff';
import { REPL_MODE_SLOPPY } from 'repl';

const _fsWriteFile = util.promisify(_fs.writeFile);

(Object as any).equals = (x: any, y: any, path: string = './') => {
	if (x === y) // if both x and y are null or undefined and exactly the same
		return (true);

	// if they are not strictly equal, they both need to be Objects
	if (!(x instanceof Object) || !(y instanceof Object))
		return (console.log(`- diff @ ${path}`), false);
	// they must have the exact same prototype chain, the closest we can do is test there constructor.
	if (x.constructor !== y.constructor)
		return (console.log(`- diff @ ${path}`), false);

	for (let p in x) {
		// other properties were tested using x.constructor === y.constructor
		if (!x.hasOwnProperty(p))
			continue;
		// allows to compare x[ p ] and y[ p ] when set to undefined
		if (!y.hasOwnProperty(p))
			return (console.log(`- diff @ ${path}`), false);
		if (x[p] === y[p]) // if they have the same strict value or identity then they are equal
			continue;
		// Numbers, Strings, Functions, Booleans must be strictly equal
		if (typeof (x[p]) !== 'object')
			return (console.log(`- diff @ ${path}`), false);
		// Objects and Arrays must be tested recursively
		if (!(Object as any).equals(x[p], y[p], `${path}${p}/`))
			return (/*console.log(`${path}${p} are different`),*/ false);
	}

	for (let p in y) {
		if (y.hasOwnProperty(p) && !x.hasOwnProperty(p))
			return (console.log(`- diff @ ${path}`), false);
		// allows x[ p ] to be set to undefined
	}
	return (true);
};

interface TestParams {
	model: string;
	urn: string;
	guid: string;
	diff: any;
};

class TreePropertiesTestsController {

	public static readonly DEFAULT_PROFILE: string = 'master';

	public static objects: any = {
		master: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTWFzdGVyJTIwLSUyMFBsYW50M0QuZHdn', // Master - Plant3D.dwg
			guids: [
				'e30bd031-d13a-a976-9153-78100829986a', // 3d
				'b7bb12b1-f832-5005-ca30-a0e6b00f9da5', // 2d
			],
			objid: 24,
			diffs: {
				tree: {
					'e30bd031-d13a-a976-9153-78100829986a': {},
					'b7bb12b1-f832-5005-ca30-a0e6b00f9da5': {},
				},
				properties: {
					'e30bd031-d13a-a976-9153-78100829986a': {},
					'b7bb12b1-f832-5005-ca30-a0e6b00f9da5': {},
				},
			},
		},
		pier9: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvUDlfTWFjaGluZVNob3BfRmluYWwucnZ0', // P9_MachineShop_Final.rvt
			guids: [
				'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf', type: 'resource'
				//'ee578c34-41d4-83e7-fd72-1c18a453c3b9', // 3d role: 'graphics', mime: 'application/autodesk-svf2', type: 'resource'
				'6fda4fe6-0ceb-4525-a86d-20be4000dab5', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
				'e67f2035-8010-3ff5-e399-b9c9217c2366', // 2d role: 'graphics', mime: 'application/autodesk-f2d', type: 'resource',
			],
			objid: 1,
			diffs: {
				tree: {
					'ee578c34-41d4-83e7-fd72-1c18a453c3b9': {},
					'6fda4fe6-0ceb-4525-a86d-20be4000dab5': {
						"//data/objects/[objectid=1]objects/[objectid=15]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=3184]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=3203]": "missing on left",
						"//data/objects/[objectid=1]objects/": "warning: arrays do not have the same length",
						"//data/objects/": "arrays content are different"
					},
					'e67f2035-8010-3ff5-e399-b9c9217c2366': {
						"//data/objects/[objectid=1]objects/[objectid=15]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=1953]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=1958]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=3184]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=3203]": "missing on left",
						"//data/objects/[objectid=1]objects/": "warning: arrays do not have the same length",
						"//data/objects/": "arrays content are different"
					},
				},
				properties: {
					'ee578c34-41d4-83e7-fd72-1c18a453c3b9': {},
					'6fda4fe6-0ceb-4525-a86d-20be4000dab5': {},
					'e67f2035-8010-3ff5-e399-b9c9217c2366': {},
				},
			},
		},
		ModelIfc: { // oZZ0CN7qXTGAiqSbmEhLlmYcKXt0YVoU
			urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS1tb2RlbHMvTW9kZWwuaWZj', // Model.ifc
			guids: [
				'cee12842-7fc5-40eb-a4c0-4a446293782d',
			],
			objid: 1,
			diffs: {
				tree: {
					'cee12842-7fc5-40eb-a4c0-4a446293782d': {
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=296]objects/[objectid=297]objects/[objectid=298]objects/[objectid=299]objects/[objectid=300]objects/[objectid=294]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=296]objects/[objectid=297]objects/[objectid=298]objects/[objectid=299]objects/[objectid=300]objects/[objectid=295]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=296]objects/[objectid=297]objects/[objectid=298]objects/[objectid=299]objects/[objectid=300]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=296]objects/[objectid=297]objects/[objectid=298]objects/[objectid=299]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=296]objects/[objectid=297]objects/[objectid=298]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=296]objects/[objectid=297]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=296]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=303]objects/[objectid=304]objects/[objectid=305]objects/[objectid=306]objects/[objectid=307]objects/[objectid=294]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=303]objects/[objectid=304]objects/[objectid=305]objects/[objectid=306]objects/[objectid=307]objects/[objectid=295]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=303]objects/[objectid=304]objects/[objectid=305]objects/[objectid=306]objects/[objectid=307]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=303]objects/[objectid=304]objects/[objectid=305]objects/[objectid=306]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=303]objects/[objectid=304]objects/[objectid=305]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=303]objects/[objectid=304]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=303]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=121]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/[objectid=129]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1576]objects/[objectid=1577]objects/[objectid=1578]objects/[objectid=1579]objects/[objectid=1580]objects/[objectid=1574]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1576]objects/[objectid=1577]objects/[objectid=1578]objects/[objectid=1579]objects/[objectid=1580]objects/[objectid=1575]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1576]objects/[objectid=1577]objects/[objectid=1578]objects/[objectid=1579]objects/[objectid=1580]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1576]objects/[objectid=1577]objects/[objectid=1578]objects/[objectid=1579]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1576]objects/[objectid=1577]objects/[objectid=1578]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1576]objects/[objectid=1577]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1576]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1586]objects/[objectid=1587]objects/[objectid=1588]objects/[objectid=1589]objects/[objectid=1590]objects/[objectid=1574]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1586]objects/[objectid=1587]objects/[objectid=1588]objects/[objectid=1589]objects/[objectid=1590]objects/[objectid=1575]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1586]objects/[objectid=1587]objects/[objectid=1588]objects/[objectid=1589]objects/[objectid=1590]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1586]objects/[objectid=1587]objects/[objectid=1588]objects/[objectid=1589]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1586]objects/[objectid=1587]objects/[objectid=1588]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1586]objects/[objectid=1587]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/[objectid=1586]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1465]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1931]objects/[objectid=1932]objects/[objectid=1933]objects/[objectid=1934]objects/[objectid=1935]objects/[objectid=1928]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1931]objects/[objectid=1932]objects/[objectid=1933]objects/[objectid=1934]objects/[objectid=1935]objects/[objectid=1929]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1931]objects/[objectid=1932]objects/[objectid=1933]objects/[objectid=1934]objects/[objectid=1935]objects/[objectid=1930]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1931]objects/[objectid=1932]objects/[objectid=1933]objects/[objectid=1934]objects/[objectid=1935]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1931]objects/[objectid=1932]objects/[objectid=1933]objects/[objectid=1934]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1931]objects/[objectid=1932]objects/[objectid=1933]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1931]objects/[objectid=1932]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1931]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2117]objects/[objectid=2118]objects/[objectid=2119]objects/[objectid=2120]objects/[objectid=2121]objects/[objectid=2115]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2117]objects/[objectid=2118]objects/[objectid=2119]objects/[objectid=2120]objects/[objectid=2121]objects/[objectid=2116]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2117]objects/[objectid=2118]objects/[objectid=2119]objects/[objectid=2120]objects/[objectid=2121]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2117]objects/[objectid=2118]objects/[objectid=2119]objects/[objectid=2120]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2117]objects/[objectid=2118]objects/[objectid=2119]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2117]objects/[objectid=2118]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2117]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2124]objects/[objectid=2125]objects/[objectid=2126]objects/[objectid=2127]objects/[objectid=2128]objects/[objectid=2115]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2124]objects/[objectid=2125]objects/[objectid=2126]objects/[objectid=2127]objects/[objectid=2128]objects/[objectid=2116]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2124]objects/[objectid=2125]objects/[objectid=2126]objects/[objectid=2127]objects/[objectid=2128]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2124]objects/[objectid=2125]objects/[objectid=2126]objects/[objectid=2127]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2124]objects/[objectid=2125]objects/[objectid=2126]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2124]objects/[objectid=2125]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=2124]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/[objectid=1464]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=1427]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4708]objects/[objectid=4709]objects/[objectid=4710]objects/[objectid=4711]objects/[objectid=4712]objects/[objectid=4713]objects/[objectid=4706]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4708]objects/[objectid=4709]objects/[objectid=4710]objects/[objectid=4711]objects/[objectid=4712]objects/[objectid=4713]objects/[objectid=4707]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4708]objects/[objectid=4709]objects/[objectid=4710]objects/[objectid=4711]objects/[objectid=4712]objects/[objectid=4713]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4708]objects/[objectid=4709]objects/[objectid=4710]objects/[objectid=4711]objects/[objectid=4712]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4708]objects/[objectid=4709]objects/[objectid=4710]objects/[objectid=4711]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4708]objects/[objectid=4709]objects/[objectid=4710]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4708]objects/[objectid=4709]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4708]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4716]objects/[objectid=4717]objects/[objectid=4718]objects/[objectid=4719]objects/[objectid=4720]objects/[objectid=4721]objects/[objectid=4706]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4716]objects/[objectid=4717]objects/[objectid=4718]objects/[objectid=4719]objects/[objectid=4720]objects/[objectid=4721]objects/[objectid=4707]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4716]objects/[objectid=4717]objects/[objectid=4718]objects/[objectid=4719]objects/[objectid=4720]objects/[objectid=4721]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4716]objects/[objectid=4717]objects/[objectid=4718]objects/[objectid=4719]objects/[objectid=4720]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4716]objects/[objectid=4717]objects/[objectid=4718]objects/[objectid=4719]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4716]objects/[objectid=4717]objects/[objectid=4718]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4716]objects/[objectid=4717]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4716]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4724]objects/[objectid=4725]objects/[objectid=4726]objects/[objectid=4727]objects/[objectid=4728]objects/[objectid=4729]objects/[objectid=4706]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4724]objects/[objectid=4725]objects/[objectid=4726]objects/[objectid=4727]objects/[objectid=4728]objects/[objectid=4729]objects/[objectid=4707]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4724]objects/[objectid=4725]objects/[objectid=4726]objects/[objectid=4727]objects/[objectid=4728]objects/[objectid=4729]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4724]objects/[objectid=4725]objects/[objectid=4726]objects/[objectid=4727]objects/[objectid=4728]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4724]objects/[objectid=4725]objects/[objectid=4726]objects/[objectid=4727]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4724]objects/[objectid=4725]objects/[objectid=4726]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4724]objects/[objectid=4725]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4724]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4864]objects/[objectid=4865]objects/[objectid=4866]objects/[objectid=4867]objects/[objectid=4868]objects/[objectid=1914]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4864]objects/[objectid=4865]objects/[objectid=4866]objects/[objectid=4867]objects/[objectid=4868]objects/[objectid=1915]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4864]objects/[objectid=4865]objects/[objectid=4866]objects/[objectid=4867]objects/[objectid=4868]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4864]objects/[objectid=4865]objects/[objectid=4866]objects/[objectid=4867]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4864]objects/[objectid=4865]objects/[objectid=4866]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4864]objects/[objectid=4865]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4864]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4871]objects/[objectid=4872]objects/[objectid=4873]objects/[objectid=4874]objects/[objectid=4875]objects/[objectid=1944]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4871]objects/[objectid=4872]objects/[objectid=4873]objects/[objectid=4874]objects/[objectid=4875]objects/[objectid=1945]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4871]objects/[objectid=4872]objects/[objectid=4873]objects/[objectid=4874]objects/[objectid=4875]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4871]objects/[objectid=4872]objects/[objectid=4873]objects/[objectid=4874]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4871]objects/[objectid=4872]objects/[objectid=4873]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4871]objects/[objectid=4872]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4871]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4878]objects/[objectid=4879]objects/[objectid=4880]objects/[objectid=4881]objects/[objectid=4882]objects/[objectid=1914]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4878]objects/[objectid=4879]objects/[objectid=4880]objects/[objectid=4881]objects/[objectid=4882]objects/[objectid=1915]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4878]objects/[objectid=4879]objects/[objectid=4880]objects/[objectid=4881]objects/[objectid=4882]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4878]objects/[objectid=4879]objects/[objectid=4880]objects/[objectid=4881]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4878]objects/[objectid=4879]objects/[objectid=4880]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4878]objects/[objectid=4879]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4878]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4885]objects/[objectid=4886]objects/[objectid=4887]objects/[objectid=4888]objects/[objectid=4889]objects/[objectid=1914]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4885]objects/[objectid=4886]objects/[objectid=4887]objects/[objectid=4888]objects/[objectid=4889]objects/[objectid=1915]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4885]objects/[objectid=4886]objects/[objectid=4887]objects/[objectid=4888]objects/[objectid=4889]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4885]objects/[objectid=4886]objects/[objectid=4887]objects/[objectid=4888]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4885]objects/[objectid=4886]objects/[objectid=4887]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4885]objects/[objectid=4886]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4885]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4892]objects/[objectid=4893]objects/[objectid=4894]objects/[objectid=4895]objects/[objectid=4896]objects/[objectid=1921]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4892]objects/[objectid=4893]objects/[objectid=4894]objects/[objectid=4895]objects/[objectid=4896]objects/[objectid=1922]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4892]objects/[objectid=4893]objects/[objectid=4894]objects/[objectid=4895]objects/[objectid=4896]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4892]objects/[objectid=4893]objects/[objectid=4894]objects/[objectid=4895]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4892]objects/[objectid=4893]objects/[objectid=4894]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4892]objects/[objectid=4893]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4892]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4899]objects/[objectid=4900]objects/[objectid=4901]objects/[objectid=4902]objects/[objectid=4903]objects/[objectid=2096]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4899]objects/[objectid=4900]objects/[objectid=4901]objects/[objectid=4902]objects/[objectid=4903]objects/[objectid=2097]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4899]objects/[objectid=4900]objects/[objectid=4901]objects/[objectid=4902]objects/[objectid=4903]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4899]objects/[objectid=4900]objects/[objectid=4901]objects/[objectid=4902]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4899]objects/[objectid=4900]objects/[objectid=4901]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4899]objects/[objectid=4900]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4899]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4913]objects/[objectid=4914]objects/[objectid=4915]objects/[objectid=4916]objects/[objectid=4917]objects/[objectid=4911]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4913]objects/[objectid=4914]objects/[objectid=4915]objects/[objectid=4916]objects/[objectid=4917]objects/[objectid=4912]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4913]objects/[objectid=4914]objects/[objectid=4915]objects/[objectid=4916]objects/[objectid=4917]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4913]objects/[objectid=4914]objects/[objectid=4915]objects/[objectid=4916]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4913]objects/[objectid=4914]objects/[objectid=4915]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4913]objects/[objectid=4914]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4913]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4932]objects/[objectid=4933]objects/[objectid=4934]objects/[objectid=4935]objects/[objectid=4936]objects/[objectid=2074]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4932]objects/[objectid=4933]objects/[objectid=4934]objects/[objectid=4935]objects/[objectid=4936]objects/[objectid=2075]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4932]objects/[objectid=4933]objects/[objectid=4934]objects/[objectid=4935]objects/[objectid=4936]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4932]objects/[objectid=4933]objects/[objectid=4934]objects/[objectid=4935]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4932]objects/[objectid=4933]objects/[objectid=4934]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4932]objects/[objectid=4933]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4932]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4939]objects/[objectid=4940]objects/[objectid=4941]objects/[objectid=4942]objects/[objectid=4943]objects/[objectid=2074]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4939]objects/[objectid=4940]objects/[objectid=4941]objects/[objectid=4942]objects/[objectid=4943]objects/[objectid=2075]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4939]objects/[objectid=4940]objects/[objectid=4941]objects/[objectid=4942]objects/[objectid=4943]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4939]objects/[objectid=4940]objects/[objectid=4941]objects/[objectid=4942]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4939]objects/[objectid=4940]objects/[objectid=4941]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4939]objects/[objectid=4940]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4939]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4946]objects/[objectid=4947]objects/[objectid=4948]objects/[objectid=4949]objects/[objectid=4950]objects/[objectid=2081]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4946]objects/[objectid=4947]objects/[objectid=4948]objects/[objectid=4949]objects/[objectid=4950]objects/[objectid=2082]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4946]objects/[objectid=4947]objects/[objectid=4948]objects/[objectid=4949]objects/[objectid=4950]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4946]objects/[objectid=4947]objects/[objectid=4948]objects/[objectid=4949]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4946]objects/[objectid=4947]objects/[objectid=4948]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4946]objects/[objectid=4947]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4946]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4957]objects/[objectid=4958]objects/[objectid=4959]objects/[objectid=4960]objects/[objectid=4961]objects/[objectid=2074]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4957]objects/[objectid=4958]objects/[objectid=4959]objects/[objectid=4960]objects/[objectid=4961]objects/[objectid=2075]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4957]objects/[objectid=4958]objects/[objectid=4959]objects/[objectid=4960]objects/[objectid=4961]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4957]objects/[objectid=4958]objects/[objectid=4959]objects/[objectid=4960]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4957]objects/[objectid=4958]objects/[objectid=4959]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4957]objects/[objectid=4958]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4957]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4964]objects/[objectid=4965]objects/[objectid=4966]objects/[objectid=4967]objects/[objectid=4968]objects/[objectid=2081]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4964]objects/[objectid=4965]objects/[objectid=4966]objects/[objectid=4967]objects/[objectid=4968]objects/[objectid=2082]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4964]objects/[objectid=4965]objects/[objectid=4966]objects/[objectid=4967]objects/[objectid=4968]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4964]objects/[objectid=4965]objects/[objectid=4966]objects/[objectid=4967]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4964]objects/[objectid=4965]objects/[objectid=4966]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4964]objects/[objectid=4965]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4964]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4971]objects/[objectid=4972]objects/[objectid=4973]objects/[objectid=4974]objects/[objectid=4975]objects/[objectid=2074]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4971]objects/[objectid=4972]objects/[objectid=4973]objects/[objectid=4974]objects/[objectid=4975]objects/[objectid=2075]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4971]objects/[objectid=4972]objects/[objectid=4973]objects/[objectid=4974]objects/[objectid=4975]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4971]objects/[objectid=4972]objects/[objectid=4973]objects/[objectid=4974]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4971]objects/[objectid=4972]objects/[objectid=4973]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4971]objects/[objectid=4972]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4971]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4978]objects/[objectid=4979]objects/[objectid=4980]objects/[objectid=4981]objects/[objectid=4982]objects/[objectid=2103]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4978]objects/[objectid=4979]objects/[objectid=4980]objects/[objectid=4981]objects/[objectid=4982]objects/[objectid=2104]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4978]objects/[objectid=4979]objects/[objectid=4980]objects/[objectid=4981]objects/[objectid=4982]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4978]objects/[objectid=4979]objects/[objectid=4980]objects/[objectid=4981]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4978]objects/[objectid=4979]objects/[objectid=4980]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4978]objects/[objectid=4979]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=4978]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=5040]objects/[objectid=5041]objects/[objectid=5042]objects/[objectid=5043]objects/[objectid=5044]objects/[objectid=4706]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=5040]objects/[objectid=5041]objects/[objectid=5042]objects/[objectid=5043]objects/[objectid=5044]objects/[objectid=4707]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=5040]objects/[objectid=5041]objects/[objectid=5042]objects/[objectid=5043]objects/[objectid=5044]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=5040]objects/[objectid=5041]objects/[objectid=5042]objects/[objectid=5043]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=5040]objects/[objectid=5041]objects/[objectid=5042]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=5040]objects/[objectid=5041]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=5040]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/[objectid=5039]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=4699]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6715]objects/[objectid=6727]objects/[objectid=6728]objects/[objectid=6729]objects/[objectid=6730]objects/[objectid=6731]objects/[objectid=6725]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6715]objects/[objectid=6727]objects/[objectid=6728]objects/[objectid=6729]objects/[objectid=6730]objects/[objectid=6731]objects/[objectid=6726]": "missing on left",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6715]objects/[objectid=6727]objects/[objectid=6728]objects/[objectid=6729]objects/[objectid=6730]objects/[objectid=6731]objects/": "warning: arrays do not have the same length",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6715]objects/[objectid=6727]objects/[objectid=6728]objects/[objectid=6729]objects/[objectid=6730]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6715]objects/[objectid=6727]objects/[objectid=6728]objects/[objectid=6729]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6715]objects/[objectid=6727]objects/[objectid=6728]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6715]objects/[objectid=6727]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/[objectid=6715]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/[objectid=5]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/[objectid=3]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/[objectid=2]objects/": "arrays content are different",
						"//data/objects/[objectid=1]objects/": "arrays content are different",
						"//data/objects/": "arrays content are different"
					},
				},
				properties: {
					'cee12842-7fc5-40eb-a4c0-4a446293782d': {},
				},
			},
		},
		// dxf: { // rOlB7GtsAOmuvm6XqPAILp83ARMymAfL
		// 	urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y3lyaWxsZS0yMDIxL2FyYWIuZHhm',
		// 	guids: [
		// 		'115d2418-de8a-46bf-852a-b23ef9338de2', // 2d
		// 	],
		// 	objid: 109,
		// 	diffs: {
		// 		'115d2418-de8a-46bf-852a-b23ef9338de2': {},
		// 	},
		// },
	};

	public constructor() {
	}

	private static sleep(milliseconds: number): Promise<any> {
		return (new Promise((resolve: (value?: any) => void) => setTimeout(resolve, milliseconds)));
	}

	private async request(url: string, message: string, diff: string, fn?: string): Promise<void> {
		try {
			const jobs: Promise<any>[] = [
				superagent('GET', url + '/forge'),
				superagent('GET', url),
			];
			const results: any[] = await Promise.all(jobs);
			const obj0 = JSON.parse(results[0].text);
			const obj1 = JSON.parse(results[1].text);

			// obj1.data.objects[0].objects = obj1.data.objects[0].objects.filter ((elt: any): boolean => {
			// 	return (
			// 		elt.name !== 'Schedule Graphics' 
			// 		&& elt.name !== 'Title Blocks' 
			// 		&& elt.name !== ''

			// 		&& elt.name !== 'Survey Point'
			// 		&& elt.name !== 'Project Base Point'
			// 	);
			// });

			const cmp: JsonDiff = new JsonDiff(obj0, obj1, ['objectid']);
			if (cmp.areEquals || (diff && diff === cmp.toString()))
				console.log(`${message} ok`);
			else
				console.warn(`${message} `, cmp.toString(4));
			console.log(' ');

			if (fn) {
				await _fsWriteFile(`${fn}-forge.json`, Buffer.from(JSON.stringify(obj0, null, 4)));
				await _fsWriteFile(`${fn}-db.json`, Buffer.from(JSON.stringify(obj1, null, 4)));
			}
		} catch (ex) {
			console.error(`failed - ${ex.message}`);
		}
	}

	public async help(index: string = ''): Promise<void> {
		console.log(`comamnds: help, list, all, run <model>`)
		this.list();
	}

	public async list(index: string = ''): Promise<void> {
		console.log('models: ', Object.keys(TreePropertiesTestsController.objects));
	}

	public async all(index: string = ''): Promise<void> {
		const self = this;

		const runTest = async (model: string): Promise<void> => {
			await self.run(model);
		};

		const runTests = (models: string[]): Promise<void> => {
			return (models.reduce((p, test): Promise<void> => {
				return (p.then((): Promise<void> => runTest(test)));
			}, Promise.resolve())); // initial
		};

		const toTest: string[] = Object.keys(TreePropertiesTestsController.objects);
		await runTests(toTest);
	}

	// public async run(index: string = ''): Promise<void> {
	// 	const models: string[] = Object.keys(TreePropertiesTestsController.objects);
	// 	if (models.indexOf(index) === -1)
	// 		return (console.log(`model ${index} does not exist!`));

	// 	const self = this;
	// 	const urn: string = TreePropertiesTestsController.objects[index].urn;
	// 	const jobs: Promise<void>[] = TreePropertiesTestsController.objects[index].guids.map(async (guid: string): Promise<void> => {
	// 		const diff: string = JSON.stringify(TreePropertiesTestsController.objects.pier9.diffs.tree[guid]);
	// 		return (self.request(`http://localhost:3001/tree/${urn}/guids/${guid}`, `tree ${urn} ${guid}`, diff, _path.resolve(__dirname, `tree-${urn}-${guid}`)));
	// 	});
	// 	await Promise.all(jobs);
	// }

	public async run(index: string = ''): Promise<void> {
		const self = this;
		const models: string[] = Object.keys(TreePropertiesTestsController.objects);
		if (models.indexOf(index) === -1)
			return (console.log(`model ${index} does not exist!`));

		const model: any = TreePropertiesTestsController.objects[index];
		const urn: string = model.urn;

		const runTest = async (test: TestParams): Promise<void> => {
			let diff: string = JSON.stringify(TreePropertiesTestsController.objects[test.model].diffs.tree[test.guid]);
			await self.request(`http://localhost:3001/tree/${test.urn}/guids/${test.guid}`, `Tree\n  urn  = ${test.urn}\n  guid = ${test.guid}\n  Result: `, diff, _path.resolve(__dirname, `tree-${test.urn}-${test.guid}`));

			diff = JSON.stringify(TreePropertiesTestsController.objects[test.model].diffs.properties[test.guid]);
			await self.request(`http://localhost:3001/properties/${test.urn}/guids/${test.guid}`, `Properties\n  Result: `, diff, _path.resolve(__dirname, `tree-${test.urn}-${test.guid}`));
		};

		const runTests = (tests: TestParams[]): Promise<void> => {
			return (tests.reduce((p, test): Promise<void> => {
				return (p.then((): Promise<void> => runTest(test)));
			}, Promise.resolve())); // initial
		};

		const toTest: TestParams[] = model.guids.map((guid: string): TestParams => {
			return ({
				model: index,
				urn: urn,
				guid: guid,
				diff: model.diffs[guid],
			});
		});
		await runTests(toTest);
	}

}


const run = async (fctName: string, index: string) => {
	const controller: TreePropertiesTestsController = new TreePropertiesTestsController();
	const fct = (controller as any)[fctName || 'help'];
	if (fct)
		await (fct.bind(controller))(index);

	process.exit(0);
};

run(process.argv[2], process.argv[3] || '0');