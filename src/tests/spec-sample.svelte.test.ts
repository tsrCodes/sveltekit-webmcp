import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { mockModelContext, callTool } from '#lib/testing/index.js';
import TodoPage from './fixtures/TodoPage.svelte';

// The F24 sample from the spec, as written.
test('add_todo adds an item', async () => {
	const ctx = mockModelContext(); // installs fake document.modelContext
	render(TodoPage);
	const res = await callTool('add_todo', { text: 'milk' });
	expect(res.isError).toBe(false);
	await expect.element(page.getByText('milk')).toBeInTheDocument();
	await expect.element(page.getByText('Agent ready')).toBeInTheDocument();
	ctx.restore();
});
