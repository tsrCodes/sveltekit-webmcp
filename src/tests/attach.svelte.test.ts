import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import {
	callTool,
	mockModelContext,
	waitForTool,
	type MockModelContext
} from '#lib/testing/index.js';
import AttachHost from './fixtures/AttachHost.svelte';
import WithConfig from './fixtures/WithConfig.svelte';

let ctx: MockModelContext;

beforeEach(() => {
	ctx = mockModelContext();
});

afterEach(() => ctx.restore());

describe('attachTool()', () => {
	it('registers one tool per rendered element and passes the element', async () => {
		const onOpen = vi.fn();
		const items = [
			{ id: 1, label: 'One' },
			{ id: 2, label: 'Two' }
		];
		const screen = render(AttachHost, { items, onOpen });
		await waitForTool('open_item_1');
		await waitForTool('open_item_2');
		const result = await callTool('open_item_2');
		expect(result.content[0].text).toBe('Opened Two');
		expect(onOpen).toHaveBeenCalledWith(items[1], expect.any(HTMLButtonElement));
		expect((onOpen.mock.calls[0][1] as HTMLElement).textContent).toBe('Two');

		await screen.rerender({ items: [items[0]] });
		await expect.poll(() => ctx.names).toEqual(['open_item_1']);
		screen.unmount();
		expect(ctx.names).toEqual([]);
	});

	it('reads app config from setWebMCP in a parent', async () => {
		render(WithConfig, { config: { prefix: 'shop_' }, items: [{ id: 7, label: 'Seven' }] });
		await waitForTool('shop_open_item_7');
		expect(ctx.names).toEqual(['shop_open_item_7']);
	});
});
