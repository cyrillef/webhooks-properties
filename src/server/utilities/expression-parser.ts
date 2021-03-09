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

import { strict } from "assert";

export enum TokenType {
	PAR_OPEN = 40, // '('.charCodeAt(0);
	PAR_CLOSE = 41, // ')'.charCodeAt(0),
	OP_NOT = 33, // '!'.charCodeAt(0),
	BINARY_AND = 38, // '&'.charCodeAt(0),
	BINARY_OR = 124, // '|'.charCodeAt(0),
	SINGLE_QUOTE = 39, // "'".charCodeAt(0),
	DOUBLE_QUOTE = 34, // '"'.charCodeAt(0),

	// GREATER_THAN = 62, // >
	// LESS_THAN = 6, // <
	// AROUND = 126, // ~

	ASSIGN = '=', // this one should stack with previous op, to solve the ASSIN rule
	AND = 'AND',
	OR = 'OR',
	NOT = 'NOT',
	EQUAL = '==',
	NOT_EQUAL = '!=', // careful with OP_NOT
	GREATER_THAN = '>',
	GREATER_OR_EQUAL = '>=', // careful with GREATER_THAN
	LESS_THAN = '<',
	LESS_OR_EQUAL = '<=', // careful with LESS_THAN
	LIKE = '~=',

	LITERAL = 'LITERAL',
	END = 'END',
	LEAF = 'LEAF',
	ATOMIC = 'ATOMIC',
}

export interface Literal {
	type: TokenType;
	value: string;
}

export class Tokenizer {

	protected static TokenizerRules: any[] = [
		{ op: TokenType.AND, assignOP: TokenType.BINARY_AND, value: '&' },
		{ op: TokenType.OR, assignOP: TokenType.BINARY_OR, value: '|' },
		{ op: TokenType.NOT, assignOP: TokenType.OP_NOT, value: '!' },
		{ op: TokenType.EQUAL }, // must be before ASSIGN
		{ op: TokenType.NOT_EQUAL }, // will never hit since OP_NOT
		{ op: TokenType.GREATER_THAN },
		{ op: TokenType.GREATER_OR_EQUAL }, // will never hit since GREATER_THAN
		{ op: TokenType.LESS_THAN },
		{ op: TokenType.LESS_OR_EQUAL }, // will never hit since LESS_THAN
		{ op: TokenType.LIKE }, // must be before ASSIGN
		{ op: TokenType.ASSIGN, run: Tokenizer.equalRule },

	];

	protected constructor() {
	}

	protected static standardRule(rule: any, _literal: string, tokens: Literal[]): Literal {
		_literal = _literal.trim();
		const len: number = (rule.op as string).length;
		if ((_literal.slice(-len).toUpperCase() as TokenType) === rule.op) {
			const op: TokenType = _literal.slice(-len).toUpperCase() as TokenType;
			_literal = _literal.slice(0, -len);
			if (_literal)
				Tokenizer.stackLiteral(_literal, tokens);
			const node: Literal = {
				type: rule.assignOP || rule.op,
				value: rule.value || (rule.op as string)
			};
			tokens.push(node);
			return (node);
		}
		return (null);
	}

	protected static equalRule(rule: any, _literal: string, tokens: Literal[]): Literal {
		// TokenType.GREATER_OR_EQUAL
		// TokenType.LESS_OR_EQUAL
		// TokenType.NOT_EQUAL
		if (tokens.length === 0 || _literal !== '=')
			return (null);
		const previous: Literal = tokens.slice(-1)[0];
		switch (previous.type) {
			case TokenType.GREATER_THAN:
				previous.type = TokenType.GREATER_OR_EQUAL;
				previous.value = TokenType.GREATER_OR_EQUAL as string;
				return (previous);
			case TokenType.LESS_THAN:
				previous.type = TokenType.LESS_OR_EQUAL;
				previous.value = TokenType.LESS_OR_EQUAL as string;
				return (previous);
			case TokenType.OP_NOT:
				previous.type = TokenType.NOT_EQUAL;
				previous.value = TokenType.NOT_EQUAL as string;
				return (previous);
		}
		return (null);
	}

	protected static stackLiteral(_literal: string, tokens: Literal[]): Literal {
		const node: Literal = {
			type: TokenType.LITERAL,
			value: _literal.trim(),
		};
		if (node.value === '')
			return (null);
		tokens.push(node);
		return (node);
	}

	protected static addToLiteral(_literal: string, char: string, inString: boolean, tokens: Literal[]): string {
		_literal += char;
		if (inString)
			return (_literal);

		const len = Tokenizer.TokenizerRules.length;
		for (let i = 0; i < len; i++) {
			const rule: any = Tokenizer.TokenizerRules[i];
			const run = rule.run || Tokenizer.standardRule;
			const node = run(rule, _literal, tokens);
			if (node !== null) {
				_literal = '';
				break
			}
		}

		return (_literal);
	}

	public static parse(exp: string): Literal[] {
		let inString: boolean = false;
		let literal: string = '';
		const tokens: Literal[] = [];
		for (const char of exp) {
			const code = char.charCodeAt(0);
			switch (code) {
				case TokenType.PAR_OPEN:
				case TokenType.PAR_CLOSE:
				case TokenType.OP_NOT:
				case TokenType.BINARY_AND:
				case TokenType.BINARY_OR:
					if (!inString) {
						if (literal) {
							Tokenizer.stackLiteral(literal, tokens);
							literal = '';
						}

						tokens.push({
							type: code,
							value: char
						});
					} else {
						literal = Tokenizer.addToLiteral(literal, char, inString, tokens);
					}
					break;
				case TokenType.SINGLE_QUOTE:
				case TokenType.DOUBLE_QUOTE:
					inString = !inString;
				default:
					literal = Tokenizer.addToLiteral(literal, char, inString, tokens);
					break;
			}
		}

		if (literal)
			Tokenizer.stackLiteral(literal, tokens);

		return (tokens);
	}

}

export class ExpressionNode {

	protected op: TokenType = null;
	protected left: ExpressionNode = null;
	protected right: ExpressionNode = null;
	protected literal: Literal = null;

	constructor(op: TokenType, left: ExpressionNode, right: ExpressionNode = null, literal: Literal = null) {
		this.op = op;
		this.left = left;
		this.right = right;
		this.literal = literal;
	}

	public get isLeaf(): boolean {
		return (this.op === TokenType.LEAF);
	}

	public get isAtomic(): boolean {
		return (this.isLeaf || (this.op === TokenType.OP_NOT && this.left.isLeaf));
	}

	public getLiteralValue(): Literal {
		return (this.literal);
	}

	public static CreateAnd(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
		return (new ExpressionNode(TokenType.BINARY_AND, left, right));
	}

	public static CreateNot(exp: ExpressionNode): ExpressionNode {
		return (new ExpressionNode(TokenType.OP_NOT, exp));
	}

	public static CreateOr(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
		return (new ExpressionNode(TokenType.BINARY_OR, left, right));
	}

	public static CreateLiteral(lit: Literal): ExpressionNode {
		return (new ExpressionNode(TokenType.LEAF, null, null, lit));
	}

}

export class ExpressionEval {

	protected constructor() {
	}

	// (Dimensions.Length == 7.292) and (Identity Data.GLOBALID ~= "3K.*")
	// %28Dimensions.Length%20%3D%3D%207.292%29%20and%20%28Identity%20Data.GLOBALID%20~%3D%20%223K.%2A%22%29%0A%0A

	// (Dimensions.Length == 7.292) and (Identity Data.GLOBALID ~= "3K.*") and (objectid == 773)
	// %28Dimensions.Length%20%3D%3D%207.292%29%20and%20%28Identity%20Data.GLOBALID%20~%3D%20%223K.%2A%22%29%20and%20%28objectid%20%3D%3D%20773%29

	// !(Dimensions.Length == 7.292) and (Identity Data.GLOBALID ~= "3K.*")
	// %21%28Dimensions.Length%20%3D%3D%207.292%29%20and%20%28Identity%20Data.GLOBALID%20~%3D%20%223K.%2A%22%29

	// !(Dimensions.Length == 7.292) & (Identity Data.GLOBALID ~= "3K.*")
	// %21%28Dimensions.Length%20%3D%3D%207.292%29%20%26%20%28Identity%20Data.GLOBALID%20~%3D%20%223K.%2A%22%29

	public static eval(obj: any, tokens: Literal[]): boolean {
		let lastIsNot: boolean = false;
		let st: string = '';
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			switch (token.type) {
				case TokenType.PAR_OPEN:
					st += '(';
					break;
				case TokenType.PAR_CLOSE:
					st += ')';
					break;
				case TokenType.LITERAL:
					let value: boolean = true;
					if (lastIsNot) {
						const val: any = ExpressionEval.GetValue(obj, tokens[i + 1].value.split('.'));
						value = (val && val !== tokens[i + 1].value);
						i += 1;
					} else {
						value = ExpressionEval.eval2Op(obj, tokens[i + 1], token, tokens[i + 2]);
						i += 2;
					}
					st += value.toString();
					break;
				case TokenType.OP_NOT:
				case TokenType.NOT:
					st += '!';
					lastIsNot = true;
					continue; // ! important
				case TokenType.BINARY_AND:
				case TokenType.AND:
					st += '&&';
					break;
				case TokenType.BINARY_OR:
				case TokenType.OR:
					st += '||';
					break;
				default:
					break;
			}
			lastIsNot = false;
		}
		const test: string = st.replace(/[true|false]/g, '').replace(/[!()>=<~&|'"]/g, '').trim();
		if (test === '')
			return (eval(st)); // this is a security issue if we do not do the test above!
		return (false);
	}

	public static eval2Op(obj: any, op: Literal, lhs: Literal, rhs: Literal): boolean {
		const lhsPath: string[] = lhs.value.split('.');
		const rhsPath: string[] = rhs.value.split('.');
		const lhsValue: any = ExpressionEval.GetValue(obj, lhsPath);
		let rhsValue: any = ExpressionEval.GetValue(obj, rhsPath);

		switch (op.type) {
			case TokenType.EQUAL:
				return (lhsValue == rhsValue);
			case TokenType.NOT_EQUAL:
				return (lhsValue != rhsValue);
			case TokenType.GREATER_THAN:
				return (lhsValue > rhsValue);
			case TokenType.GREATER_OR_EQUAL:
				return (lhsValue >= rhsValue);
			case TokenType.LESS_THAN:
				return (lhsValue < rhsValue);
			case TokenType.LESS_OR_EQUAL:
				return (lhsValue <= rhsValue);
			case TokenType.LIKE:
				// SQL Wildcard Characters in queries
				// Symbol	Description	Example
				// %	Represents zero or more characters						bl% finds bl, black, blue, and blob
				// _	Represents a single character							h_t finds hot, hat, and hit
				// []	Represents any single character within the brackets		h[oa]t finds hot and hat, but not hit
				// ^	Represents any character not in the brackets			h[^oa]t finds hit, but not hot and hat
				// -	Represents a range of characters						c[a-b]t finds cat and cbt
				//rhsValue = rhsValue.replace(/%/g, '.*').replace(/_/g, '.{1}');
				const regex: RegExp = new RegExp(rhsValue);
				return (regex.test(lhsValue));
		}

		return (false);
	}

	public static evalLogicalOp(op: Literal, lhs: boolean, rhs?: boolean): boolean {
		switch (op.type) {
			case TokenType.OP_NOT:
			case TokenType.NOT:
				return (!lhs);
			case TokenType.BINARY_AND:
			case TokenType.AND:
				return (lhs && rhs);
			case TokenType.BINARY_OR:
			case TokenType.OR:
				return (lhs || rhs);
		}
		return (true);
	}

	protected static GetValue(obj: any, path: string[]): any {
		const pathPlus: string[] = ['properties', ...path];
		const result: any = ExpressionEval._GetValue_(obj, pathPlus);
		if (result && typeof result !== 'object' && result.substring(0, 11) !== 'properties.')
			return (result);
		return (ExpressionEval._GetValue_(obj, path));
	}

	protected static _GetValue_(obj: any, path: string[]): any {
		let value: any = obj;
		for (let i = 0; i < path.length; i++) {
			if (!value.hasOwnProperty(path[i])) {
				value = path.join('.');
				if (value[0] === "'" || value[0] === '"')
					value = value.substring(1, value.length - 1);
				return (value);
			}
			value = value[path[i]];
		}
		return (value);
	}

	public static literalList(tokens: Literal[]): string[] {
		let lastIsNot: boolean = false;
		let st: string[] = [];
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			switch (token.type) {
				case TokenType.LITERAL:
					st.push(tokens[i].value);
					if (lastIsNot)
						i += 1;
					else
						i += 2;
					break;
				case TokenType.OP_NOT:
				case TokenType.NOT:
					lastIsNot = true;
					continue; // ! important
			}
			lastIsNot = false;
		}
		return (st);
	}

}

export class ExpressionParser {

	protected constructor() {
	}

	public static parse(exp: string): Literal[] {
		const tokens: Literal[] = Tokenizer.parse(exp);
		return (tokens);
	}


}

export default ExpressionParser;
