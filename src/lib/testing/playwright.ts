import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { test as base } from '@playwright/test';
import { fromWire, type ToolResult } from '#lib/core/result.js';

/** Helpers exposed to Playwright tests through the `webmcp` fixture. */
export interface WebMCPFixture {
	/** Names of the tools the page has registered. */
	listTools(): Promise<string[]>;
	/** Wait until the page registers `name`. */
	waitForTool(name: string, timeout?: number): Promise<void>;
	/** Call a tool the way an agent would and get the parsed result. */
	callTool(name: string, input?: object): Promise<ToolResult>;
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
		const listTools = () =>
			page.evaluate(async () => {
				const context = (
					document as unknown as { modelContext?: { getTools(): Promise<{ name: string }[]> } }
				).modelContext;
				return context ? (await context.getTools()).map((tool) => tool.name) : [];
			});
		await use({
			listTools,
			async waitForTool(name, timeout = 5_000) {
				await page.waitForFunction(
					async (toolName) => {
						const context = (
							document as unknown as { modelContext?: { getTools(): Promise<{ name: string }[]> } }
						).modelContext;
						const tools = context ? await context.getTools() : [];
						return tools.some((tool) => tool.name === toolName);
					},
					name,
					{ timeout }
				);
			},
			async callTool(name, input = {}) {
				const raw = await page.evaluate(
					async ([toolName, args]) => {
						type Listed = { name: string };
						const context = (
							document as unknown as {
								modelContext?: {
									getTools(): Promise<Listed[]>;
									executeTool(tool: Listed, input: object): Promise<string>;
								};
							}
						).modelContext;
						if (!context) throw new Error('No document.modelContext on this page');
						const tools = await context.getTools();
						const target = tools.find((tool) => tool.name === toolName);
						if (!target) throw new Error(`No tool named "${toolName}"`);
						return context.executeTool(target, args);
					},
					[name, input] as const
				);
				return fromWire(raw);
			}
		});
	}
});

export { expect } from '@playwright/test';
