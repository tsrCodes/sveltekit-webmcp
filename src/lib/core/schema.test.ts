import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { toStandardJsonSchema } from '@valibot/to-json-schema';
import * as z from 'zod';
import { validateJsonSchema } from '#lib/core/json-validate.js';
import { formatIssues, lacksJsonSchema, toJsonSchema, validate } from '#lib/core/schema.js';

describe('toJsonSchema', () => {
	it('converts Zod (Standard JSON Schema) input and output', () => {
		const schema = z.object({ text: z.string().min(1) });
		expect(toJsonSchema(schema)).toMatchObject({
			type: 'object',
			properties: { text: { type: 'string', minLength: 1 } },
			required: ['text']
		});
		expect(toJsonSchema(schema, 'output')).toMatchObject({ type: 'object' });
	});

	it('converts Valibot through @valibot/to-json-schema', () => {
		const schema = toStandardJsonSchema(v.object({ id: v.number() }));
		expect(toJsonSchema(schema)).toMatchObject({ properties: { id: { type: 'number' } } });
	});

	it('passes raw JSON Schema through and handles missing schemas', () => {
		const raw = { type: 'object', properties: {} };
		expect(toJsonSchema(raw)).toBe(raw);
		expect(toJsonSchema(undefined)).toBeUndefined();
		expect(lacksJsonSchema(undefined)).toBe(false);
	});

	it('reports Standard Schemas without a JSON form', () => {
		const plain = v.object({ id: v.number() });
		expect(toJsonSchema(plain)).toBeUndefined();
		expect(lacksJsonSchema(plain)).toBe(true);
	});

	it('falls back to draft-07 when 2020-12 is unsupported', () => {
		const picky = {
			'~standard': {
				version: 1 as const,
				vendor: 'test',
				jsonSchema: {
					input: ({ target }: { target: string }) => {
						if (target !== 'draft-07') throw new Error('unsupported');
						return { type: 'string' };
					},
					output: () => {
						throw new Error('never');
					}
				}
			}
		};
		expect(toJsonSchema(picky)).toEqual({ type: 'string' });
		expect(toJsonSchema(picky, 'output')).toBeUndefined();
	});
});

describe('validate', () => {
	it('uses the Standard Schema validator and keeps transforms', async () => {
		const schema = z.object({ n: z.coerce.number() });
		expect(await validate(schema, { n: '4' })).toEqual({ success: true, value: { n: 4 } });
		const failed = await validate(schema, { n: 'x' });
		expect(failed.success).toBe(false);
		if (!failed.success) expect(failed.issues[0].path).toEqual(['n']);
	});

	it('validates raw JSON Schema with the built-in checker', async () => {
		const schema = { type: 'object', required: ['a'], properties: { a: { type: 'string' } } };
		expect(await validate(schema, { a: 'x' })).toEqual({ success: true, value: { a: 'x' } });
		expect(await validate(schema, {})).toEqual({
			success: false,
			issues: [{ message: 'Required', path: ['a'] }]
		});
	});

	it('accepts anything without a schema', async () => {
		expect(await validate(undefined, 5)).toEqual({ success: true, value: 5 });
	});

	it('skips validation for typed-only schemas with no JSON form', async () => {
		const typed = { '~standard': { version: 1 as const, vendor: 'x' } };
		expect(await validate(typed, 1)).toEqual({ success: true, value: 1 });
	});
});

describe('validateJsonSchema', () => {
	it('checks types, enums, const and limits', () => {
		expect(validateJsonSchema({ type: 'integer' }, 1.5)).toHaveLength(1);
		expect(validateJsonSchema({ type: ['string', 'null'] }, null)).toEqual([]);
		expect(validateJsonSchema({ enum: ['a', 'b'] }, 'c')[0].message).toContain('"a", "b"');
		expect(validateJsonSchema({ const: 3 }, 4)).toHaveLength(1);
		expect(validateJsonSchema({ type: 'string', minLength: 2, maxLength: 3 }, 'a')).toHaveLength(1);
		expect(validateJsonSchema({ type: 'string', maxLength: 3 }, 'abcd')).toHaveLength(1);
		expect(validateJsonSchema({ type: 'number', minimum: 1, maximum: 2 }, 3)).toHaveLength(1);
		expect(validateJsonSchema({ type: 'number', minimum: 1 }, 0)).toHaveLength(1);
		expect(validateJsonSchema({ type: 'boolean' }, true)).toEqual([]);
	});

	it('walks nested objects and arrays', () => {
		const schema = {
			type: 'object',
			additionalProperties: false,
			properties: {
				tags: { type: 'array', items: { type: 'string' } }
			}
		};
		expect(validateJsonSchema(schema, { tags: ['a', 2], extra: true })).toEqual([
			{ message: 'Expected string', path: ['tags', 1] },
			{ message: 'Unknown property', path: ['extra'] }
		]);
	});
});

describe('formatIssues', () => {
	it('prints one issue per line with paths', () => {
		expect(formatIssues([{ message: 'Required', path: ['a', 0] }, { message: 'Bad' }])).toBe(
			'a.0: Required\nBad'
		);
	});
});
