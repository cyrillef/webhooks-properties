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

import * as _path from 'path';
import * as moment from 'moment';
import * as Forge from 'forge-apis';

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

	protected cachePath: string = null;
	protected cacheDuration: moment.Duration = moment.duration(20, 'minutes');
	protected cacheCleanupJob: NodeJS.Timeout = null;

	protected cache: PropertiesCache = {} as PropertiesCache;

	protected constructor(cachePath: string, cacheDuration: number = null) {
		this.cachePath = _path.resolve(__dirname, '../..', cachePath);
		if (cacheDuration)
			this.cacheDuration = moment.duration(cacheDuration);
		this.cacheCleanupJob = setInterval(this.releaseAll.bind(this), this.cacheDuration.asMilliseconds());
	}

	public static singleton(cachePath: string /*= AppSettings.cacheFolder*/): PropertiesUtils { return (null); }

	public abstract /*async*/ get(urn: string, region: string /*= Forge.DerivativesApi.RegionEnum.US*/): Promise<PropertiesCache>;
	// { return (this.loadInCache(urn, region)); }

	public getPath(urn: string): string {
		return (_path.resolve(this.cachePath, urn));
	}

	public async dispose(): Promise<void> {
		clearInterval(this.cacheCleanupJob);
		this.cacheCleanupJob = null;
		await this.releaseAll();
	}

	private async releaseAll(): Promise<void> {
		try {
			const self = this;
			const jobs: Promise<void>[] = [];
			Object.keys(this.cache).map((urn: string): any => jobs.push(self.release(urn, false)));
			await Promise.all(jobs)
		} catch (ex) {
		}
	}

	public abstract /*async*/ release(urn: string, clearOnDisk: boolean /*= true*/): Promise<void>;

	public abstract /*async*/ loadInCache(urn: string, region: string /*= Forge.DerivativesApi.RegionEnum.US*/): Promise<PropertiesCache>;

	protected abstract /*async*/ loadFromForge(urn: string, region: string /*= Forge.DerivativesApi.RegionEnum.US*/): Promise<PropertiesCache>;

	public static deleteInternals(node: any): void {
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

}

export default PropertiesUtils;
