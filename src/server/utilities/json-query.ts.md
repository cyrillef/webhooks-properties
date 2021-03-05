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

let tokenizedCache: any = {}

class JsonQuery {

	constructor(query: string, options?: any) {
		// extract params for ['test[param=?]', 'value'] type queries
		let params = options && options.params || null;
		if (!tokenizedCache[query])
			tokenizedCache[query] = tokenize(query, true);
		return (handleQuery(tokenizedCache[query], options, params));
	}



	private lastParent(query: string) {
		const last = query.parents[query.parents.length - 1];
		if (last)
			return (last ? last.value : null);
	}

	private handleQuery(tokens, options, params) {
		const state = new State(options, params, handleQuery);
		for (let i = 0; i < tokens.length; i++)
			if (handleToken(tokens[i], state))
				break;
		// flush
		handleToken(null, state);
		// set databind hooks
		if (state.currentItem instanceof Object) {
			state.addReference(state.currentItem);
		} else {
			let parentObject = getLastParentObject(state.currentParents);
			if (parentObject)
				state.addReference(parentObject);
		}
		return ({
			value: state.currentItem,
			key: state.currentKey,
			references: state.currentReferences,
			parents: state.currentParents
		});
	}

	private handleToken(token, state) {
		// state: setCurrent, getValue, getValues, resetCurrent, deepQuery, rootContext, currentItem, currentKey, options, filters
		if (token === null) {
			// process end of query
			if (!state.currentItem && state.options.force)
				state.force(state.options.force);
		} else if (token.values) {
			if (state.currentItem) {
				let keys = Object.keys(state.currentItem);
				let values = [];
				keys.forEach(function (key) {
					if (token.deep && Array.isArray(state.currentItem[key])) {
						state.currentItem[key].forEach(function (item) {
							values.push(item);
						})
					} else {
						values.push(state.currentItem[key]);
					}
				})
				state.setCurrent(keys, values);
			} else {
				state.setCurrent(keys, []);
			}
		} else if (token.get) {
			let key = state.getValue(token.get);
			if (shouldOverride(state, key)) {
				state.setCurrent(key, state.override[key]);
			} else {
				if (state.currentItem || (state.options.force && state.force({}))) {
					if (isDeepAccessor(state.currentItem, key) || token.multiple) {
						let values = state.currentItem.map(function (item) {
							return (item[key]);
						}).filter(isDefined);
						values = Array.prototype.concat.apply([], values); // flatten
						state.setCurrent(key, values);
					} else {
						state.setCurrent(key, state.currentItem[key]);
					}
				} else {
					state.setCurrent(key, null);
				}
			}
		} else if (token.select) {
			if (Array.isArray(state.currentItem) || (state.options.force && state.force([]))) {
				let match = (token.boolean ? token.select : [token]).map(function (part) {
					if (part.op === ':') {
						let key = state.getValue(part.select[0]);
						return ({
							func: function (item) {
								if (key) {
									item = item[key];
								}
								return (state.getValueFrom(part.select[1], item));
							},
							negate: part.negate,
							booleanOp: part.booleanOp
						});
					} else {
						let selector = state.getValues(part.select);
						if (!state.options.allowRegexp && part.op === '~' && selector[1] instanceof RegExp)
							throw new Error('options.allowRegexp is not enabled.');
						return ({
							key: selector[0],
							value: selector[1],
							negate: part.negate,
							booleanOp: part.booleanOp,
							op: part.op
						});
					}
				});

				if (token.multiple) {
					let keys = [];
					let value = [];
					state.currentItem.forEach(function (item, i) {
						if (matches(item, match)) {
							keys.push(i);
							value.push(item);
						}
					});
					state.setCurrent(keys, value);
				} else {
					if (!state.currentItem.some(function (item, i) {
						if (matches(item, match)) {
							state.setCurrent(i, item);
							return (true);
						}
					})) {
						state.setCurrent(null, null);
					}
				}
			} else {
				state.setCurrent(null, null);
			}
		} else if (token.root) {
			state.resetCurrent();
			if (token.args && token.args.length) {
				state.setCurrent(null, state.getValue(token.args[0]));
			} else {
				state.setCurrent(null, state.rootContext);
			}
		} else if (token.parent) {
			state.resetCurrent();
			state.setCurrent(null, state.options.parent);
		} else if (token.or) {
			if (state.currentItem) {
				return (true);
			} else {
				state.resetCurrent();
				state.setCurrent(null, state.context);
			}
		} else if (token.filter) {
			let helper = state.getLocal(token.filter) || state.getGlobal(token.filter);
			if (typeof helper === 'function') {
				// function(input, args...)
				let values = state.getValues(token.args || []);
				let result = helper.apply(state.options, [state.currentItem].concat(values));
				state.setCurrent(null, result);
			} else {
				// fallback to old filters
				let filter = state.getFilter(token.filter);
				if (typeof filter === 'function') {
					let values = state.getValues(token.args || []);
					let result = filter.call(state.options, state.currentItem, { args: values, state: state, data: state.rootContext });
					state.setCurrent(null, result);
				}
			}
		} else if (token.deep) {
			if (state.currentItem) {
				if (token.deep.length === 0) {
					return;
				}

				let result = state.deepQuery(state.currentItem, token.deep, state.options);
				if (result) {
					state.setCurrent(result.key, result.value);
					for (let i = 0; i < result.parents.length; i++) {
						state.currentParents.push(result.parents[i]);
					}
				} else {
					state.setCurrent(null, null);
				}
			} else {
				state.currentItem = null;
			}
		}
	}

	private matches(item, parts) {
		let result = false
		for (let i = 0; i < parts.length; i++) {
			let opts = parts[i]
			let r = false
			if (opts.func) {
				r = opts.func(item)
			} else if (opts.op === '~') {
				if (opts.value instanceof RegExp) {
					r = item[opts.key] && !!item[opts.key].match(opts.value)
				} else {
					r = item[opts.key] && !!~item[opts.key].indexOf(opts.value)
				}
			} else if (opts.op === '=') {
				if ((item[opts.key] === true && opts.value === 'true') || (item[opts.key] === false && opts.value === 'false')) {
					r = true
				} else {
					r = item[opts.key] == opts.value
				}
			} else if (opts.op === '>') {
				r = item[opts.key] > opts.value
			} else if (opts.op === '<') {
				r = item[opts.key] < opts.value
			} else if (opts.op === '>=') {
				r = item[opts.key] >= opts.value
			} else if (opts.op === '<=') {
				r = item[opts.key] <= opts.value
			}

			if (opts.negate) {
				r = !r
			}
			if (opts.booleanOp === '&') {
				result = result && r
			} else if (opts.booleanOp === '|') {
				result = result || r
			} else {
				result = r
			}
		}

		return (result
	}

	private isDefined(value) {
		return (typeof value !== 'undefined'
	}

	private shouldOverride(state, key) {
		return (state.override && state.currentItem === state.rootContext && state.override[key] !== undefined
	}

	private isDeepAccessor(currentItem, key) {
		return (currentItem instanceof Array && parseInt(key) != key
	}

	private getLastParentObject(parents) {
		for (let i = 0; i < parents.length; i++) {
			if (!(parents[i + 1]) || !(parents[i + 1].value instanceof Object)) {
				return (parents[i].value
			}
		}
	}

}

export default JsonQuery;
