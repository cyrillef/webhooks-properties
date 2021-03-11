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

import * as zlib from 'zlib';
import { Sequelize, Model, DataTypes, QueryTypes } from 'sequelize';
import e = require('express');

export interface SqlPropertiesSources {
	path2SqlDB: string,
	sequelize: Sequelize,
	guids: any,

	[index: string]: any,
}

export class SqlProperties {

	private sequelize: Sequelize = null;

	constructor(sequelize: Sequelize) {
		this.sequelize = sequelize;
	}

	public static get dbNames(): string[] {
		// The file list for property databse tables is fixed, no need to go to the server to find out
		return (['_objects_eav', '_objects_val', '_objects_attr', '_objects_id']);
		// otherwise, do this
		// await this.sequelize.getQueryInterface().showAllSchemas();
	}

	public async idMax(): Promise<number> {
		try {
			const objs: object[] = await this.sequelize.query('select count(distinct(id)) from _objects_id;', { type: QueryTypes.SELECT, logging: false });
			const idMax: number = Object.values(objs[0])[0];
			return (idMax);
		} catch (ex) {
			console.error(ex);
			return (0);
		}
	}

	public async selectQuery(query: string): Promise<object[]> {
		try {
			const objs: object[] = await this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false });
			return (objs);
		} catch (ex) {
			console.error(ex);
		}
	}

	public async selectQueries(queries: string[]): Promise<object[][]> {
		try {
			const jobs: Promise<object[]>[] = queries.map((query: string): Promise<object[]> => this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false }));
			const results: object[][] = await Promise.all(jobs);
			return (results);
		} catch (ex) {
			console.error(ex);
		}
	}

	public async load(path2SqlDB: string): Promise<void> {
		this.sequelize = new Sequelize({
			dialect: 'sqlite',
			storage: path2SqlDB
		});
	}

	public async loadDB(sequelize: Sequelize): Promise<void> {
		this.sequelize = sequelize;
	}

	public async read(dbId: number, keepHidden: boolean, keepInternals: boolean): Promise<any> {
		const result: any = {
			objectid: dbId,
			name: '',
			externalId: null,
			properties: {}
		};

		let parent: number = await this._read(dbId, result, keepHidden, keepInternals);
		if (keepInternals === false)
			//delete result.properties.__internal__;
			SqlProperties.deleteInternals(result);

		//while ( parent !== null && parent !== 1 )
		//	parent =this._read (parent, result) ;
		//result.properties =Object.keys (result.properties).map ((elt) => result.properties [elt]) ;
		return (result);
	}

	private async _read(dbId: number, result: any, keepHidden: boolean = false, keepInternals: boolean = false): Promise<number> {
		let parent: number = null;
		const query: string = `
		select 
			_objects_id.external_id, _objects_attr.flags,
			_objects_attr.category, ifnull(_objects_attr.display_name, _objects_attr.name) as name,
			_objects_attr.data_type, _objects_attr.data_type_context, _objects_val.value, _objects_attr.data_type_context
		from _objects_eav
		left join _objects_id on _objects_id.id = _objects_eav.entity_id
		left join _objects_attr on _objects_attr.id = _objects_eav.attribute_id
		left join _objects_val on _objects_val.id = _objects_eav.value_id
		where _objects_eav.entity_id = ${dbId}
		order by _objects_eav.entity_id, _objects_attr.category, _objects_attr.name;`;
		const results: object[] = await this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false });

		for (let i = 0; i < results.length; i++) {
			const elt: any = results[i];
			result.externalId = elt.external_id;
			let category: string = elt.category || '__internal__';
			let key: string = `${elt.category}/${elt.name}`;
			// if ( key === '__parent__/parent' ) {
			// 	parent =parseInt (elt.value) ;
			// 	result.parents.push (parent) ;
			// 	continue ;
			// }
			if (key === '__instanceof__/instanceof_objid') {
				// Allright, we need to read the definition
				await this._read(parseInt(elt.value), result, keepHidden, keepInternals);
				continue;
			}
			if (key === '__viewable_in__/viewable_in'
				|| key === '__parent__/parent'
				|| key === '__child__/child'
				|| key === '__node_flags__/node_flags'
				|| key === '__document__/schema_name'
				|| key === '__document__/schema_version'
				|| key === '__document__/is_doc_property'
			) {
				category = '__internal__';
			}
			if (key === '__name__/name') {
				if (result.name === '')
					result.name = elt.value;
				continue;
			}
			if (!result.properties.hasOwnProperty(category))
				result.properties[category] = {};

			key = elt.name;
			let value: string = elt.value;
			if (elt.data_type_context !== null)
				value += ' ' + elt.data_type_context;
			try { value = value.trimEnd(); } catch (ex) { }

			// In theory should we should also mark as hidden if in parent, child, viewable or externalRef category
			if (!(category === '__internal__' && keepInternals) && !(category !== '__internal__' && keepHidden))
				if (elt.flags & 1)
					continue;

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

	private static deleteInternals(node: any) {
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

	public async findRootNodes(): Promise<number[]> {
		// First find Attr indexes for child and parent
		let query: string = `
		select _objects_attr.id, _objects_attr.name
		from _objects_attr
		where (_objects_attr.name = 'child' and _objects_attr.category = '__child__') or (_objects_attr.name = 'parent' and _objects_attr.category = '__parent__')
		order by _objects_attr.name;`;
		let results: object[] = await this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false });
		const childAttr: number = (results[0] as any).id;
		const parentAttr: number = (results[1] as any).id;

		// First method
		// query= `
		// select distinct(_objects_eav.entity_id) as id
		// from _objects_eav
		// where _objects_eav.attribute_id = ${parentAttr};`;
		// results = await this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false });
		// const idWithParents: number[] = results.map((elt: any): number => elt.id);

		// query = `
		// select distinct(_objects_eav.entity_id) as id
		// from _objects_eav
		// where _objects_eav.attribute_id = ${childAttr};`;
		// results = await this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false });
		// const idWithChildren: number[] = results.map((elt: any): number => elt.id);

		// // No parent, but children
		// const difference = idWithChildren.filter((x: number): boolean => !idWithParents.includes(x));

		// Second method (faster)
		query = `
		select _objects_eav.entity_id, count(_objects_eav.entity_id) as nb, sum(case when _objects_eav.attribute_id = 3 then 1 else 0 end) as nbp
		from _objects_eav
		where _objects_eav.attribute_id = ${childAttr} or _objects_eav.attribute_id = ${parentAttr}
		group by _objects_eav.entity_id;`;
		results = await this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false });
		const difference: number[] = results.map((elt: any): number => elt.nbp === 0 ? elt.entity_id : null).filter((elt: any): boolean => elt !== null);

		return (difference);
	}

	public async buildTree(viewable_in: string, withProperties: boolean, keepHidden: boolean, keepInternals: boolean): Promise<any> {
		const nodeIds: number[] = await this.findRootNodes();

		// Gets objId, external_id, category - name - viewable_in - child
		let query: string = `
		select
			_objects_eav.entity_id,
			_objects_id.external_id,
			_objects_attr.category,
			ifnull(_objects_attr.display_name, _objects_attr.name) as name,
			_objects_val.value
		from _objects_eav
		left join _objects_id on _objects_id.id = _objects_eav.entity_id
		left join _objects_attr on _objects_attr.id = _objects_eav.attribute_id
		left join _objects_val on _objects_val.id = _objects_eav.value_id
		where
			   (name = 'parent' and _objects_attr.category = '__parent__')
		 	or (name = 'name' and _objects_attr.category = '__name__')
			or (name = 'instanceof_objid' and _objects_attr.category = '__instanceof__')
			or (name = 'viewable_in' and _objects_attr.category = '__viewable_in__')
		order by _objects_eav.entity_id, name desc, _objects_val.value;`;
		//(name = 'child' and _objects_attr.category = '__child__')
		let results: object[] = await this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false });

		const rootId: number = nodeIds[0];
		const nodes: any = {};
		const refObjIds: any = {};
		for (let i = 0; i < results.length;) {
			try {
				// We sorted entries as viewable_in -> parent (root node have no parent) -> instanceof_objid -> name // -> child (might have 0, 1 or more children)
				const objId: number = (results[i] as any).entity_id;
				//const external_id: number = (results[i] as any).external_id;
				const nodeViewableIn: string = (results[i++] as any).value;
				const nodeParent: number = results[i] && (results[i] as any).name === 'parent' ? parseInt((results[i++] as any).value) : null;
				const refObjId: number = results[i] && (results[i] as any).name === 'instanceof_objid' ? parseInt((results[i++] as any).value) : null;
				let nodeName: string = results[i] && (results[i] as any).name === 'name' ? (results[i++] as any).value : null;
				// const nodeChild: number[] = [];
				// while (i < results.length && results[i] && (results[i] as any).name === 'child')
				// 	nodeChild.push(parseInt((results[i++] as any).value));

				if (refObjId) {
					if (nodes[refObjId]) {
						nodeName = nodes[refObjId].name;
					} else {
						if (!refObjIds[refObjId])
							refObjIds[refObjId] = [];
						refObjIds[refObjId].push(objId);
					}
				}
				if (refObjIds[objId]) {
					refObjIds[objId].map((eltId: number): string => nodes[eltId].name = nodeName);
					delete refObjIds[objId];
				}
				if (!nodes[objId]) {
					nodes[objId] = {
						//externalId: external_id,
						name: nodeName,
						objectid: objId,
						//viewable_in: nodeViewableIn,
					};
				} else {
					//nodes[objId].externalId = external_id;
					nodes[objId].name = nodeName;
					nodes[objId].objectid = objId;
					//nodes[objId].viewable_in = nodeViewableIn;
				}
				if (nodeParent && nodeViewableIn === viewable_in) {
					let parent: any = nodes[nodeParent];
					if (!parent)
						parent = nodes[nodeParent] = {
							//externalId: null,
							name: null,
							objectid: nodeParent,
							//viewable_in: null,
						};
					if (!parent.objects)
						parent.objects = [];
					parent.objects.push(nodes[objId]);
				}
			} catch (ex) {
				console.error(ex);
				break;
			}
		}

		if (withProperties) {
			const keys: string[] = Object.keys(nodes);
			for (let i = 0; i < keys.length; i++) {
				const node: any = nodes[keys[i]];
				node.properties = {};
				const propNode: any = await this._read(node.objectid, node, keepHidden, keepInternals);
			}
		}
		return (nodes[rootId]);
	}

	public async search(search: string): Promise<any> {
		let query: string = `
		select
			_objects_id.external_id, _objects_attr.flags,
			_objects_attr.category, ifnull(_objects_attr.display_name, _objects_attr.name) as name,
			_objects_attr.data_type, _objects_attr.data_type_context, _objects_val.value, _objects_attr.data_type_context
		from _objects_eav
		left join _objects_id on _objects_id.id = _objects_eav.entity_id
		left join _objects_attr on _objects_attr.id = _objects_eav.attribute_id
		left join _objects_val on _objects_val.id = _objects_eav.value_id
		where ${search}
		order by _objects_eav.entity_id, _objects_attr.category, _objects_attr.name;`;
		let results: object[] = await this.sequelize.query(query, { type: QueryTypes.SELECT, logging: false });
		const idWithParents: number[] = results.map((elt: any): number => elt.id);

	}

}

export default SqlProperties;