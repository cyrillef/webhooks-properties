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
import * as _util from 'util';
import * as moment from 'moment';
import Utils from '../utilities/utils';
import Forge2Legged from '../server/forge-oauth-2legged';

const _fsReadDir = _util.promisify(_fs.readdir);

export enum AttributeType {
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

export enum AttributeFieldIndex {
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
export enum AttributeFlags {
	afHidden = 1 << 0, // Attribute will not be displayed in default GUI property views.
	afDontIndex = 1 << 1, // Attribute will not be indexed by the search service.
	afDirectStorage = 1 << 2, // Attribute is not worth de-duplicating (e.g. vertex data or dbId reference)
	afReadOnly = 1 << 3 // Attribute is read-only (used when writing back to the design model, in e.g. Revit)
}

export interface PropertiesCache {
	lastVisited: moment.Moment,

	[index: string]: any,
}

export abstract class PropertiesUtils {

	public static readonly SVFMime = 'application/autodesk-svf';
	public static readonly SVF2Mime = 'application/autodesk-svf2';
	public static readonly F2DMime = 'application/autodesk-f2d';
	public static readonly BubbleMimes = [PropertiesUtils.SVFMime, PropertiesUtils.SVF2Mime, PropertiesUtils.F2DMime];

	protected cachePath: string = null;
	protected cacheDuration: moment.Duration = moment.duration(5, 'minutes');
	protected cacheCleanupJob: NodeJS.Timeout = null;

	protected cache: PropertiesCache = {} as PropertiesCache;

	protected constructor(cachePath: string, cacheDuration: number = null) {
		this.cachePath = _path.resolve(__dirname, '../..', cachePath);
		if (cacheDuration)
			this.cacheDuration = moment.duration(cacheDuration);
		this.cacheCleanupJob = setInterval(this.releaseAll.bind(this), this.cacheDuration.asMilliseconds() / 2);
	}

	public static singleton(cachePath: string /*= AppSettings.cacheFolder*/): PropertiesUtils { return (null); }

	public abstract /*async*/ get(urn: string, guid: string, region: string /*= Forge.DerivativesApi.RegionEnum.US*/): Promise<PropertiesCache>;
	// { return (this.loadInCache(urn, guid, region)); }

	public getPath(urn: string): string {
		return (_path.resolve(this.cachePath, urn));
	}

	public async dispose(): Promise<void> {
		clearInterval(this.cacheCleanupJob);
		this.cacheCleanupJob = null;
		await this.releaseAll(false);
	}

	private async releaseAll(clearOnDisk: boolean = false): Promise<void> {
		try {
			const self = this;
			const jobs: Promise<void>[] = [];

			Object.keys(this.cache).map((key: string): any => {
				const [urn, dbname]: string[] = key.split('|');
				const dbs: any = self.cache[key].dbs;
				let guid: string = null;
				for (let i = 0; i < Object.keys(dbs).length; i++) {
					guid = Object.keys(dbs)[i];
					const name: string = PropertiesUtils.dbname(urn, guid, dbs);
					if (name === dbname)
						break;
					guid = null;
				}
				jobs.push(self.release(key, guid, clearOnDisk))
			});
			await Promise.all(jobs)
		} catch (ex) {
		}
	}

	public async release(urn: string, guid: string, clearOnDisk: boolean = true): Promise<void> {
		try {
			if (!clearOnDisk) // We released the cache in the derived class
				return;
			// This is dangerous, but we only can delete all.
			const cachePath: string = PropertiesUtils.prototype.getPath.call(this, urn);
			const cacheDir: string[] = await _fsReadDir(cachePath);
			const isEmpty: boolean = cacheDir.length === 0;
			if (isEmpty)
				await Utils.rimraf(cachePath);
		} catch (ex) { }
	}

	public abstract /*async*/ loadInCache(urn: string, guid: string, region: string /*= Forge.DerivativesApi.RegionEnum.US*/): Promise<PropertiesCache>;

	protected abstract /*async*/ loadFromForge(urn: string, guid: string, region: string /*= Forge.DerivativesApi.RegionEnum.US*/): Promise<PropertiesCache>;

	public static deleteInternals(node: any): void {
		// __parent__
		// __child__
		// __viewable_in__
		// __externalref__
		// ...
		const regex = new RegExp('^__(\\w+)__$');
		const keys = Object.keys(node.properties);
		keys
			.filter((key: string): boolean => regex.test(key))
			.map((key: string): any => delete node.properties[key]);
		//delete elt.properties.Other;
	}

	public static findInManifest = (manifest: any, key: string, matches: string[]): any[] => {
		return (PropertiesUtils._findInManifest(
			manifest,
			(entry: any): boolean => (entry.hasOwnProperty(key) && matches.includes(entry[key]))
		));
	}

	public static _findInManifest = (manifest: any, testCallBack: (entry: any) => boolean): any[] => {
		let items: any[] = [];
		const iterateChildren = (parent: any): void => {
			const from: any = parent.children || parent.derivatives;
			if (!from)
				return;
			const entries: any[] = from.filter((elt: any): any => testCallBack(elt));
			items = [...items, ...entries];
			if (entries && entries.length) // we can stop here (no more in children)
				return;
			from.map((children: any): void => iterateChildren(children));
		};
		iterateChildren(manifest);
		return (items);
	}

	public static findViewablesInManifest = (manifest: any): any => {
		const guids: any = {};
		const items: any[] = PropertiesUtils._findInManifest(
			manifest,
			(entry: any): boolean => (entry.role && ['2d', '3d'].includes(entry.role) && entry.viewableID)
		)
		items.map((elt: any): void => {
			const svf: any = elt.children.filter((elt: any): any => PropertiesUtils.BubbleMimes.includes(elt.mime))[0];
			guids[svf.guid] = [elt.viewableID, elt.name];
		});
		return (guids);
	}

	public static findDBEntriesInManifest = (manifest: any, possibles: string[]): any[] => {
		const dbNodes: any[] = [];
		const iterateChildren = (parent: any): boolean => {
			const from: any = parent.children || parent.derivatives;
			if (!from)
				return (false);
			const entries: any[] = from.filter((elt: any): any => elt.mime && possibles.includes(elt.mime));
			if (entries && entries.length) {
				const viewableEntry: any = from.filter((elt: any): any => PropertiesUtils.BubbleMimes.includes(elt.mime))[0];
				entries[0].guid = (viewableEntry && viewableEntry.guid) || entries[0].guid;
				dbNodes.push(entries[0]);
				return (true);
			}
			const bs: boolean[] = from.map((children: any): boolean => iterateChildren(children));
			const found: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator || currentValue, false);
			return (found);
		};
		iterateChildren(manifest);
		return (dbNodes);
	}

	public static findEntriesInManifest = (manifest: any, possibles: string[]): any[] => {
		const dbNodes: any[] = [];
		const iterateChildren = (parent: any): boolean => {
			const from: any = parent.children || parent.derivatives;
			if (!from)
				return (false);
			const entries: any[] = from.filter((elt: any): any => elt.mime && possibles.includes(elt.mime));
			if (entries && entries.length) {
				dbNodes.push(entries[0]);
				return (true);
			}
			const bs: boolean[] = from.map((children: any): boolean => iterateChildren(children));
			const found: boolean = bs.reduce((accumulator: boolean, currentValue: boolean): boolean => accumulator || currentValue, false);
			return (found);
		};
		iterateChildren(manifest);
		return (dbNodes);
	}

	protected abstract /*async*/ saveDBs(urn: string, dbs: any): Promise<any>;
	protected abstract /*async*/ loadDBs(urn: string): Promise<any>;

	protected abstract /*async*/ saveGuids(urn: string, guids: any): Promise<any>;
	protected abstract /*async*/ loadGuids(urn: string): Promise<any>;

	public static makeDBName(urn: string, dbname: string): string {
		return (`${urn}|${dbname}`);
	}

	public static exploseKeys(key: string): string[] {
		return (key.split('|'));
	}

	protected static defaultGUID(guids: any): string {
		return (Object.keys(guids)[0]);
	}

	protected static dbname(urn: string, guid: string, dbs: any, which: number = 0): string {
		if (!dbs.hasOwnProperty(guid) || dbs[guid].length <= which)
			return ('');
		return (dbs[guid][which]);
	}

	protected abstract resolvedFilename(urn: string, guid: string, dbs: any, which: number /*= 0*/): string;

}

export default PropertiesUtils;
