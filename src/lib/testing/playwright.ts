import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { test as base } from '@playwright/test';
import { SPEC_METHODS, SPEC_PROPERTY } from '#lib/core/model-context.js';
import { fromWire } from '#lib/core/result.js';
import { withErrorFlag, type TestToolResult } from '#lib/testing/call.js';

/** Helpers exposed to Playwright tests through the `webmcp` fixture. */
export interface WebMCPFixture {
	/** Names of the tools the page has registered. */
	listTools(): Promise<string[]>;
	/** Wait until the page registers `name`. */
	waitForTool(name: string, timeout?: number): Promise<void>;
	/** Call a tool the way an agent would and get the parsed result. */
	callTool(name: string, input?: object): Promise<TestToolResult>;
}

const NAMES = { property: SPEC_PROPERTY, list: SPEC_METHODS.list, execute: SPEC_METHODS.execute };

type SpecNames = typeof NAMES;

interface PageRequest {
	names: SpecNames;
	action: 'list' | 'call';
	toolName?: string;
	input?: object;
}

/**
 * Runs inside the page, so it must not reference anything outside its own
 * body. Spec names arrive as arguments from `core/`.
 */
async function inPage(request: PageRequest): Promise<string[] | string> {
	type Listed = { name: string };
	type Context = Record<string, (...args: unknown[]) => Promise<unknown>>;
	const { names } = request;
	const context = (document as unknown as Record<string, Context | undefined>)[names.property];
	if (!context) {
		if (request.action === 'list') return [];
		throw new Error('No model context on this page');
	}
	const tools = (await context[names.list]()) as Listed[];
	if (request.action === 'list') return tools.map((tool) => tool.name);
	const target = tools.find((tool) => tool.name === request.toolName);
	if (!target) throw new Error(`No tool named "${request.toolName}"`);
	return (await context[names.execute](target, request.input ?? {})) as string;
}

function polyfillSource(): string {
	const require = createRequire(import.meta.url);
	const entry = require.resolve('@w3c/webmcp-polyfill');
	return readFileSync(join(dirname(entry), 'polyfill.js'), 'utf8');
}

/**
 * Playwright `test` with a `webmcp` fixture. Every page gets the WebMCP
 * polyfill before any app script runs; the polyfill never replaces a native
 * API. Turn it off with `test.use({ webmcpPolyfill: false })` to test only
 * against the browser's own implementation.
 */
export const test = base.extend<{ webmcp: WebMCPFixture; webmcpPolyfill: boolean }>({
	webmcpPolyfill: [true, { option: true }],
	webmcp: async ({ page, webmcpPolyfill }, use) => {
		if (webmcpPolyfill) await page.addInitScript({ content: polyfillSource() });
		const listTools = async () =>
			(await page.evaluate(inPage, {
				names: NAMES,
				action: 'list'
			} satisfies PageRequest)) as string[];
		await use({
			listTools,
			async waitForTool(name, timeout = 5_000) {
				const started = Date.now();
				while (!(await listTools()).includes(name)) {
					if (Date.now() - started > timeout) {
						throw new Error(`Tool "${name}" was not registered within ${timeout}ms`);
					}
					await page.waitForTimeout(50);
				}
			},
			async callTool(name, input = {}) {
				const raw = await page.evaluate(inPage, {
					names: NAMES,
					action: 'call',
					toolName: name,
					input
				} satisfies PageRequest);
				return withErrorFlag(fromWire(raw));
			}
		});
	}
});

export { expect } from '@playwright/test';
export type { TestToolResult } from '#lib/testing/call.js';
