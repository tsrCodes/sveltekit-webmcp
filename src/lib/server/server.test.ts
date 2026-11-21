import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import * as z from 'zod';
import { mcpHandle, serverTool, toolsPolicy, webmcpHandle } from '#lib/server/index.js';

type HandleInput = Parameters<ReturnType<typeof webmcpHandle>>[0];

function event(url: string, init: RequestInit = {}): RequestEvent {
	const request = new Request(url, init);
	return { request, url: new URL(url), locals: {} } as unknown as RequestEvent;
}

function run(
	handle: ReturnType<typeof webmcpHandle>,
	e: RequestEvent,
	response = new Response('<html></html>', { headers: { 'content-type': 'text/html' } })
) {
	const resolve = vi.fn(async () => response);
	return { result: handle({ event: e, resolve } as unknown as HandleInput), resolve };
}

describe('webmcpHandle', () => {
	it('builds the tools policy', () => {
		expect(toolsPolicy()).toBe('tools=(self)');
		expect(toolsPolicy(['self', 'https://a.example/x'])).toBe('tools=(self "https://a.example")');
		expect(toolsPolicy([])).toBe('tools=()');
		expect(toolsPolicy(['*'])).toBe('tools=*');
	});

	it('adds headers to HTML responses only', async () => {
		const handle = webmcpHandle({ originTrialToken: ['one', 'two'] });
		const html = await run(handle, event('https://site.test/')).result;
		expect(html.headers.get('permissions-policy')).toBe('tools=(self)');
		expect(html.headers.get('origin-trial')).toBe('one, two');
		const json = await run(
			handle,
			event('https://site.test/api'),
			new Response('{}', { headers: { 'content-type': 'application/json' } })
		).result;
		expect(json.headers.get('permissions-policy')).toBeNull();
	});

	it('merges with an existing policy and keeps an existing tools directive', async () => {
		const handle = webmcpHandle();
		const merged = await run(
			handle,
			event('https://site.test/'),
			new Response('', {
				headers: { 'content-type': 'text/html', 'permissions-policy': 'camera=()' }
			})
		).result;
		expect(merged.headers.get('permissions-policy')).toBe('camera=(), tools=(self)');
		const kept = await run(
			handle,
			event('https://site.test/'),
			new Response('', {
				headers: { 'content-type': 'text/html', 'permissions-policy': 'tools=()' }
			})
		).result;
		expect(kept.headers.get('permissions-policy')).toBe('tools=()');
	});

	it('copies responses with immutable headers', async () => {
		const response = Response.redirect('https://site.test/next', 302);
		Object.defineProperty(response.headers, 'get', {
			value: (name: string) => (name === 'content-type' ? 'text/html' : null)
		});
		const result = await run(webmcpHandle(), event('https://site.test/'), response).result;
		expect(result.headers.get('permissions-policy')).toBe('tools=(self)');
	});
});

const echo = serverTool({
	name: 'echo',
	description: 'Echo text',
	input: z.object({ text: z.string() }),
	readOnly: true,
	server: true,
	execute: ({ text }, e) => `${text} from ${e.url.pathname}`
});

const hidden = serverTool({
	name: 'hidden',
	description: 'Not served',
	server: false,
	execute: () => 1
});

function rpc(handle: ReturnType<typeof mcpHandle>, body: unknown, init: RequestInit = {}) {
	const e = event('https://site.test/mcp', {
		method: 'POST',
		body: typeof body === 'string' ? body : JSON.stringify(body),
		...init
	});
	return run(handle, e).result;
}

describe('mcpHandle', () => {
	const handle = mcpHandle({ tools: [echo, hidden] });

	it('passes other paths through', async () => {
		const { result, resolve } = run(handle, event('https://site.test/'));
		await result;
		expect(resolve).toHaveBeenCalled();
	});

	it('initializes with a negotiated protocol version', async () => {
		const response = await rpc(handle, {
			jsonrpc: '2.0',
			id: 1,
			method: 'initialize',
			params: { protocolVersion: '2025-06-18' }
		});
		const body = await response.json();
		expect(body.result.protocolVersion).toBe('2025-06-18');
		expect(body.result.capabilities).toEqual({ tools: { listChanged: false } });
		const fallback = await (
			await rpc(handle, {
				jsonrpc: '2.0',
				id: 2,
				method: 'initialize',
				params: { protocolVersion: 'x' }
			})
		).json();
		expect(fallback.result.protocolVersion).toBe('2025-11-25');
	});

	it('lists only tools marked server: true', async () => {
		const body = await (await rpc(handle, { jsonrpc: '2.0', id: 1, method: 'tools/list' })).json();
		expect(body.result.tools).toHaveLength(1);
		expect(body.result.tools[0]).toMatchObject({
			name: 'echo',
			inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
			annotations: { readOnlyHint: true }
		});
	});

	it('calls tools with validation and the request event', async () => {
		const ok = await (
			await rpc(handle, {
				jsonrpc: '2.0',
				id: 'a',
				method: 'tools/call',
				params: { name: 'echo', arguments: { text: 'hi' } }
			})
		).json();
		expect(ok).toEqual({
			jsonrpc: '2.0',
			id: 'a',
			result: { content: [{ type: 'text', text: 'hi from /mcp' }] }
		});
		const bad = await (
			await rpc(handle, {
				jsonrpc: '2.0',
				id: 'b',
				method: 'tools/call',
				params: { name: 'echo', arguments: { text: 1 } }
			})
		).json();
		expect(bad.result.isError).toBe(true);
		const unknown = await (
			await rpc(handle, {
				jsonrpc: '2.0',
				id: 'c',
				method: 'tools/call',
				params: { name: 'hidden' }
			})
		).json();
		expect(unknown.error.code).toBe(-32602);
	});

	it('answers ping, notifications and unknown methods', async () => {
		expect(
			(await (await rpc(handle, { jsonrpc: '2.0', id: 1, method: 'ping' })).json()).result
		).toEqual({});
		expect(
			(await rpc(handle, { jsonrpc: '2.0', method: 'notifications/initialized' })).status
		).toBe(202);
		const missing = await (await rpc(handle, { jsonrpc: '2.0', id: 1, method: 'nope' })).json();
		expect(missing.error.code).toBe(-32601);
	});

	it('rejects bad requests', async () => {
		expect((await rpc(handle, 'not json')).status).toBe(400);
		expect((await rpc(handle, [{ jsonrpc: '2.0', id: 1, method: 'ping' }])).status).toBe(400);
		expect((await rpc(handle, { jsonrpc: '1.0', id: 1, method: 'ping' })).status).toBe(400);
		expect((await rpc(handle, { jsonrpc: '2.0', id: {}, method: 'ping' })).status).toBe(400);
		expect((await rpc(handle, { jsonrpc: '2.0', id: 1, method: 'ping', params: 3 })).status).toBe(
			400
		);
		const get = await run(handle, event('https://site.test/mcp')).result;
		expect(get.status).toBe(405);
	});

	it('checks origin and authorization', async () => {
		const guarded = mcpHandle({
			tools: [echo],
			authorize: (e) => e.request.headers.get('authorization') === 'Bearer ok',
			allowedOrigins: ['https://agent.test']
		});
		const body = { jsonrpc: '2.0', id: 1, method: 'ping' };
		expect((await rpc(guarded, body, { headers: { origin: 'https://evil.test' } })).status).toBe(
			403
		);
		expect((await rpc(guarded, body)).status).toBe(401);
		const allowed = await rpc(guarded, body, {
			headers: { origin: 'https://agent.test', authorization: 'Bearer ok' }
		});
		expect(allowed.status).toBe(200);
	});

	it('rate limits per tool and rejects bad names at setup', async () => {
		const limited = mcpHandle({
			tools: [{ ...echo, limit: { calls: 1, per: '1m' } } as never]
		});
		const call = {
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: { name: 'echo', arguments: { text: 'a' } }
		};
		await rpc(limited, call);
		const second = await (await rpc(limited, call)).json();
		expect(second.result.content[0].text).toMatch(/^Rate limited/);
		expect(() => mcpHandle({ tools: [{ ...echo, name: 'bad name' } as never] })).toThrow(TypeError);
	});
});
