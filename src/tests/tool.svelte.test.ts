import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import * as z from 'zod';
import {
	callTool,
	mockModelContext,
	waitForTool,
	type MockModelContext
} from '#lib/testing/index.js';
import type { Tool, ToolOptions, ToolSchema } from '#lib/index.js';
import ToolHost from './fixtures/ToolHost.svelte';

type AnyOptions = ToolOptions<ToolSchema | undefined>;

let ctx: MockModelContext;

beforeEach(() => {
	ctx = mockModelContext();
});

afterEach(() => {
	ctx.restore();
	vi.restoreAllMocks();
});

function mount(options: AnyOptions | (() => AnyOptions)) {
	let instance: Tool<ToolSchema | undefined> | undefined;
	const screen = render(ToolHost, { options, onTool: (t) => (instance = t) });
	return { screen, tool: () => instance! };
}

const until = (check: () => boolean) => expect.poll(check, { timeout: 2000 }).toBe(true);

describe('tool()', () => {
	it('registers on mount and unregisters on destroy', async () => {
		const { screen, tool } = mount({ name: 'ping', description: 'Ping', execute: () => 'pong' });
		await waitForTool('ping');
		await until(() => tool().registered);
		expect(screen.container.textContent).toContain('registered');
		screen.unmount();
		expect(ctx.names).toEqual([]);
	});

	it('validates input and returns issues as an error result', async () => {
		const execute = vi.fn(({ text }: { text: string }) => `Added "${text}"`);
		mount({
			name: 'add_todo',
			description: 'Add a todo',
			input: z.object({ text: z.string().min(1) }),
			execute: execute as AnyOptions['execute']
		});
		await waitForTool('add_todo');
		const bad = await callTool('add_todo', { text: '' });
		expect(bad.isError).toBe(true);
		expect(bad.content[0].text).toContain('text:');
		expect(execute).not.toHaveBeenCalled();
		const good = await callTool('add_todo', { text: 'milk' });
		expect(good).toEqual({ content: [{ type: 'text', text: 'Added "milk"' }], isError: false });
	});

	it('sends JSON Schema converted from the Standard Schema', async () => {
		mount({
			name: 'typed',
			description: 'Typed',
			input: z.object({ n: z.number() }),
			readOnly: true,
			execute: () => undefined
		});
		await waitForTool('typed');
		const [listed] = await ctx.getTools();
		expect(listed.inputSchema).toMatchObject({
			type: 'object',
			properties: { n: { type: 'number' } }
		});
		expect(listed.annotations).toEqual({ readOnlyHint: true });
		expect(await callTool('typed', { n: 1 })).toEqual({
			content: [{ type: 'text', text: 'ok' }],
			isError: false
		});
	});

	it('re-registers only when the shape changes', async () => {
		const register = vi.spyOn(ctx, 'registerTool');
		const state = $state({ description: 'First', reply: 'a' });
		const { tool } = mount(() => ({
			name: 'shape',
			description: state.description,
			execute: () => state.reply
		}));
		await waitForTool('shape');
		expect(register).toHaveBeenCalledTimes(1);

		state.reply = 'b';
		flushSync();
		expect(register).toHaveBeenCalledTimes(1);
		expect((await callTool('shape')).content[0].text).toBe('b');

		state.description = 'Second';
		flushSync();
		await expect.poll(() => register.mock.calls.length).toBe(2);
		await until(() => tool().registered);
		const tools = await ctx.getTools();
		expect(tools.map((t) => t.description)).toEqual(['Second']);
		expect(tool().error).toBeUndefined();
	});

	it('unregisters when enabled is false and comes back when true', async () => {
		const state = $state({ enabled: true });
		mount(() => ({ name: 'toggle', description: 'T', enabled: state.enabled, execute: () => 1 }));
		await waitForTool('toggle');
		state.enabled = false;
		flushSync();
		expect(ctx.names).toEqual([]);
		state.enabled = true;
		flushSync();
		await waitForTool('toggle');
	});

	it('normalises results and turns throws into error results', async () => {
		const state = $state<{ value: unknown }>({ value: { a: 1 } });
		mount(() => ({
			name: 'norm',
			description: 'N',
			execute: () => {
				if (state.value instanceof Error) throw state.value;
				return state.value;
			}
		}));
		await waitForTool('norm');
		expect((await callTool('norm')).content[0].text).toBe('{"a":1}');
		state.value = new Error('boom');
		expect(await callTool('norm')).toEqual({
			content: [{ type: 'text', text: 'boom' }],
			isError: true
		});
	});

	it('returns structured output when an output schema is set', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const state = $state<{ value: unknown }>({ value: { total: 3 } });
		mount(() => ({
			name: 'stats',
			description: 'Stats',
			output: z.object({ total: z.number() }),
			execute: () => state.value
		}));
		await waitForTool('stats');
		const [listed] = await ctx.getTools();
		expect(listed.outputSchema).toMatchObject({ type: 'object' });
		const result = await callTool('stats');
		expect(result.structuredContent).toEqual({ total: 3 });
		state.value = { total: 'three' };
		await callTool('stats');
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('does not match its output schema'));
	});

	it('asks for confirmation on consequential tools', async () => {
		const confirm = vi
			.spyOn(window, 'confirm')
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(true);
		mount({ name: 'pay', description: 'Pay', consequential: true, execute: () => 'paid' });
		await waitForTool('pay');
		expect(await callTool('pay', { amount: 1 })).toEqual({
			content: [{ type: 'text', text: 'User declined' }],
			isError: true
		});
		expect((await callTool('pay')).content[0].text).toBe('paid');
		expect(confirm).toHaveBeenCalledTimes(2);
	});

	it('rate limits calls', async () => {
		mount({
			name: 'limited',
			description: 'L',
			limit: { calls: 1, per: '1m' },
			execute: () => 'ok'
		});
		await waitForTool('limited');
		expect((await callTool('limited')).isError).toBe(false);
		const second = await callTool('limited');
		expect(second.isError).toBe(true);
		expect(second.content[0].text).toMatch(/^Rate limited/);
	});

	it('surfaces registration errors', async () => {
		ctx.failNextRegistration(new DOMException('blocked', 'NotAllowedError'));
		const { tool } = mount({ name: 'blocked', description: 'B', execute: () => 1 });
		await until(() => tool().error?.message === 'blocked');
		expect(tool().registered).toBe(false);
	});

	it('rejects invalid tool names', async () => {
		const { tool } = mount({ name: 'bad name!', description: 'B', execute: () => 1 });
		await until(() => tool().error instanceof TypeError);
	});

	it('aborts the execute signal when the agent cancels', async () => {
		let seen: AbortSignal | undefined;
		mount({
			name: 'slow',
			description: 'Slow',
			execute: (_input, { signal }) =>
				new Promise((resolve) => {
					seen = signal;
					signal.addEventListener('abort', () => resolve('stopped'));
				})
		});
		await waitForTool('slow');
		const pending = callTool('slow');
		await until(() => seen !== undefined);
		ctx.cancel('slow');
		expect((await pending).content[0].text).toBe('Cancelled');
		expect(seen?.aborted).toBe(true);
	});

	it('tracks run state and runs locally with call()', async () => {
		const { tool } = mount({ name: 'local', description: 'L', execute: () => 'done' });
		const result = await tool().call({ x: 1 });
		expect(result.content[0].text).toBe('done');
		expect(tool().callCount).toBe(1);
		expect(tool().lastInput).toEqual({ x: 1 });
		expect(tool().lastResult).toEqual(result);
		expect(tool().running).toBe(false);
	});

	it('warns about invisible characters in untrusted output', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		mount({
			name: 'posts',
			description: 'P',
			untrusted: true,
			execute: () => `hi${String.fromCodePoint(0x200b)}there`
		});
		await waitForTool('posts');
		await callTool('posts');
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('U+200B'));
	});
});
