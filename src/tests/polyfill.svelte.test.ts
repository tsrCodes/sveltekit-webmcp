import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { isSupported, ready, type Tool, type ToolSchema } from '#lib/index.js';
import { callTool, waitForTool } from '#lib/testing/index.js';
import ToolHost from './fixtures/ToolHost.svelte';

// Runs against the official polyfill instead of the mock, to check the
// library agrees with a real implementation of the draft.
describe('with @w3c/webmcp-polyfill', () => {
	it('installs the polyfill on demand and flips isSupported', async () => {
		expect(isSupported.current).toBe(false);
		const context = await ready({ polyfill: true, lateInjection: false });
		expect(context).toBeDefined();
		expect(isSupported.current).toBe(true);
	});

	it('re-registers a renamed description without a duplicate-name error', async () => {
		await ready({ polyfill: true });
		const state = $state({ description: 'Before' });
		let instance: Tool<ToolSchema | undefined> | undefined;
		render(ToolHost, {
			options: () => ({
				name: 'poly_echo',
				description: state.description,
				execute: (input) => input
			}),
			onTool: (t) => (instance = t)
		});
		await waitForTool('poly_echo');
		state.description = 'After';
		flushSync();
		await expect
			.poll(async () => (await document.modelContext!.getTools()).map((t) => t.description))
			.toEqual(['After']);
		await expect.poll(() => instance?.registered).toBe(true);
		expect(instance?.error).toBeUndefined();
		const result = await callTool('poly_echo', { hello: 'world' });
		expect(result.content[0].text).toBe('{"hello":"world"}');
	});
});
