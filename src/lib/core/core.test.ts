import { describe, expect, it } from 'vitest';
import { fromSpecAnnotations, toSpecAnnotations } from '#lib/core/annotations.js';
import { createLimiter, parseWindow } from '#lib/core/limit.js';
import { assertToolName, describeTool, shapeKey } from '#lib/core/register.js';
import {
	errorMessage,
	findInvisibleChars,
	fromWire,
	isToolResult,
	normalizeResult,
	toWire
} from '#lib/core/result.js';
import { getModelContext, waitForModelContext } from '#lib/core/model-context.js';

describe('annotations', () => {
	it('maps short names to spec hints and back', () => {
		const spec = toSpecAnnotations({ readOnly: true, consequential: false, untrusted: true });
		expect(spec).toEqual({ readOnlyHint: true, untrustedContentHint: true });
		expect(fromSpecAnnotations(spec)).toEqual({ readOnly: true, untrusted: true });
	});

	it('returns undefined when no hint is set', () => {
		expect(toSpecAnnotations({})).toBeUndefined();
		expect(fromSpecAnnotations(undefined)).toEqual({});
	});
});

describe('limiter', () => {
	it('parses windows', () => {
		expect(parseWindow('1m')).toBe(60_000);
		expect(parseWindow('30s')).toBe(30_000);
		expect(parseWindow('250ms')).toBe(250);
		expect(parseWindow('2h')).toBe(7_200_000);
		expect(parseWindow('1d')).toBe(86_400_000);
		expect(parseWindow(500)).toBe(500);
		expect(() => parseWindow('soon' as '1m')).toThrow(RangeError);
		expect(() => parseWindow(0)).toThrow(RangeError);
	});

	it('allows `calls` per sliding window', () => {
		const limiter = createLimiter({ calls: 2, per: '1s' });
		expect(limiter.take(0)).toBe(true);
		expect(limiter.take(100)).toBe(true);
		expect(limiter.take(200)).toBe(false);
		expect(limiter.retryAfter(200)).toBe(800);
		expect(limiter.take(1000)).toBe(true);
		expect(limiter.retryAfter(1001)).toBe(99);
		limiter.reset();
		expect(limiter.retryAfter(1001)).toBe(0);
	});

	it('rejects bad call counts', () => {
		expect(() => createLimiter({ calls: 0, per: '1s' })).toThrow(RangeError);
	});
});

describe('register', () => {
	it('describes a tool with prefix, schemas and annotations', () => {
		const descriptor = describeTool(
			{
				name: 'add',
				title: 'Add',
				description: 'Add a thing',
				input: { type: 'object', properties: { a: { type: 'number' } } },
				hints: { readOnly: true }
			},
			'shop_'
		);
		expect(descriptor).toEqual({
			name: 'shop_add',
			title: 'Add',
			description: 'Add a thing',
			inputSchema: { type: 'object', properties: { a: { type: 'number' } } },
			annotations: { readOnlyHint: true }
		});
	});

	it('keys equal shapes the same and different shapes differently', () => {
		const a = describeTool({ name: 'x', description: 'one' });
		const b = describeTool({ name: 'x', description: 'one' });
		const c = describeTool({ name: 'x', description: 'two' });
		expect(shapeKey(a)).toBe(shapeKey(b));
		expect(shapeKey(a)).not.toBe(shapeKey(c));
	});

	it('enforces the tool name rule', () => {
		expect(() => assertToolName('ok_name.v-1')).not.toThrow();
		expect(() => assertToolName('')).toThrow(TypeError);
		expect(() => assertToolName('has space')).toThrow(TypeError);
		expect(() => assertToolName('a'.repeat(129))).toThrow(TypeError);
	});
});

describe('result', () => {
	it('normalises return values', () => {
		expect(normalizeResult(undefined)).toEqual({ content: [{ type: 'text', text: 'ok' }] });
		expect(normalizeResult('hi')).toEqual({ content: [{ type: 'text', text: 'hi' }] });
		expect(normalizeResult({ a: 1 })).toEqual({ content: [{ type: 'text', text: '{"a":1}' }] });
		expect(normalizeResult({ a: 1 }, true).structuredContent).toEqual({ a: 1 });
		const passthrough = { content: [{ type: 'text' as const, text: 'x' }], isError: true };
		expect(normalizeResult(passthrough)).toBe(passthrough);
	});

	it('survives values JSON cannot encode', () => {
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		expect(normalizeResult(cyclic).content[0].text).toBe('[object Object]');
		expect(normalizeResult(10n).content[0].text).toBe('10');
	});

	it('round-trips through the wire format', () => {
		const structured = normalizeResult({ total: 2 }, true);
		expect(toWire(structured)).toEqual({ total: 2 });
		expect(fromWire(JSON.stringify(toWire(structured))).structuredContent).toEqual({ total: 2 });
		const text = normalizeResult('hello');
		expect(fromWire(JSON.stringify(toWire(text)))).toEqual(text);
		expect(fromWire('not json')).toEqual({ content: [{ type: 'text', text: 'not json' }] });
		expect(fromWire('"plain"')).toEqual({ content: [{ type: 'text', text: 'plain' }] });
	});

	it('recognises tool results', () => {
		expect(isToolResult({ content: [{ type: 'text', text: 'a' }] })).toBe(true);
		expect(isToolResult({ content: [{ type: 'image' }] })).toBe(false);
		expect(isToolResult(null)).toBe(false);
	});

	it('reads error messages from anything', () => {
		expect(errorMessage(new Error('boom'))).toBe('boom');
		expect(errorMessage(new TypeError())).toBe('TypeError');
		expect(errorMessage('plain')).toBe('plain');
		expect(errorMessage({ code: 1 })).toBe('{"code":1}');
	});

	it('finds invisible characters', () => {
		expect(findInvisibleChars('clean text')).toEqual([]);
		expect(
			findInvisibleChars(
				`a${String.fromCodePoint(0x200b)}b${String.fromCodePoint(0x200b)}c${String.fromCodePoint(0x202e)}d${String.fromCodePoint(0xe0041)}`
			)
		).toEqual(['U+200B', 'U+202E', 'U+E0041']);
	});
});

describe('model context on the server', () => {
	it('is absent without a document', async () => {
		expect(getModelContext()).toBeUndefined();
		await expect(waitForModelContext()).resolves.toBeUndefined();
	});
});
