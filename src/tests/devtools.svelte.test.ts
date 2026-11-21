import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { WebMCPDevtools } from '#lib/devtools/index.js';
import { fireTool, parseInput } from '#lib/devtools/run.js';
import { tool } from '#lib/index.js';
import { mockModelContext, waitForTool, type MockModelContext } from '#lib/testing/index.js';
import Setup from './fixtures/Setup.svelte';

let ctx: MockModelContext;

beforeEach(() => {
	ctx = mockModelContext();
});

afterEach(() => ctx.restore());

describe('<WebMCPDevtools />', () => {
	it('lists tools, fires one by hand and logs the call', async () => {
		render(Setup, {
			setup: () =>
				tool({
					name: 'greet',
					description: 'Say hello',
					input: {
						type: 'object',
						properties: { who: { type: 'string' } },
						required: ['who']
					},
					readOnly: true,
					execute: ({ who }) => `Hello ${String(who)}`
				})
		});
		await waitForTool('greet');
		render(WebMCPDevtools, { force: true });

		const toggle = page.getByRole('button', { name: /WebMCP/ });
		await expect.element(toggle).toHaveTextContent('WebMCP · 1');
		await toggle.click();
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
		await expect.element(page.getByText('Model context available')).toBeInTheDocument();

		await page.getByRole('button', { name: /greet/ }).click();
		await expect.element(page.getByText('Say hello')).toBeInTheDocument();
		await page.getByLabelText('Input (JSON)').fill('{"who":"Oggy"}');
		await page.getByRole('button', { name: 'Run greet' }).click();
		await expect.element(page.getByText('Hello Oggy').first()).toBeInTheDocument();
		await expect.element(page.getByText(/ok · \d+ms/)).toBeInTheDocument();

		await page.getByRole('button', { name: 'Clear' }).click();
		await expect.element(page.getByText('No calls yet.')).toBeInTheDocument();
	});

	it('shows an empty state and stays hidden until opened', async () => {
		render(WebMCPDevtools, { force: true, position: 'bottom-left' });
		await expect.element(page.getByText('No tools registered.')).not.toBeInTheDocument();
		await page.getByRole('button', { name: /WebMCP/ }).click();
		await expect.element(page.getByText('No tools registered.')).toBeInTheDocument();
	});
});

describe('devtools helpers', () => {
	it('parses input text', () => {
		expect(parseInput('')).toEqual({ ok: true, value: {} });
		expect(parseInput('[1]')).toEqual({ ok: false, error: 'Input must be a JSON object' });
		expect(parseInput('{bad').ok).toBe(false);
	});

	it('reports problems as error results', async () => {
		expect((await fireTool('x', 'nope')).isError).toBe(true);
		expect((await fireTool('missing', '{}')).content[0].text).toContain('No tool named');
		ctx.restore();
		expect((await fireTool('x', '{}')).content[0].text).toContain('not available');
		ctx = mockModelContext();
	});
});
