import { expect, test } from 'sveltekit-webmcp/testing/playwright';

test('home page has WebMCP running and the footer credit', async ({ page, webmcp }) => {
	await page.goto('/');
	await webmcp.waitForTool('navigate');
	await expect(page.getByText(/WebMCP is running on this page/)).toBeVisible();
	const credit = page.getByRole('link', { name: 'Oggy' });
	await expect(credit).toHaveAttribute('href', 'https://github.com/tsrCodes');
});

test('an agent adds a todo, and bad input comes back as an error', async ({ page, webmcp }) => {
	await page.goto('/docs/tools');
	await webmcp.waitForTool('docs_add_todo');
	const ok = await webmcp.callTool('docs_add_todo', { text: 'Buy milk' });
	expect(ok.content[0].text).toBe('Added "Buy milk"');
	await expect(page.getByRole('listitem').filter({ hasText: 'Buy milk' })).toBeVisible();
	const bad = await webmcp.callTool('docs_add_todo', { text: '' });
	expect(bad.isError).toBe(true);
});

test('consequential tools wait for the confirm dialog', async ({ page, webmcp }) => {
	await page.goto('/docs/config');
	await webmcp.waitForTool('docs_transfer_points');
	const [declined] = await Promise.all([
		webmcp.callTool('docs_transfer_points', { amount: 5 }),
		page.getByRole('button', { name: 'Decline' }).click()
	]);
	expect(declined.content[0].text).toBe('User declined');
	const [allowed] = await Promise.all([
		webmcp.callTool('docs_transfer_points', { amount: 5 }),
		page.getByRole('button', { name: 'Allow' }).click()
	]);
	expect(allowed.content[0].text).toContain('Balance: 95');
});

test('attachTool registers per element', async ({ page, webmcp }) => {
	await page.goto('/docs/attach');
	await webmcp.waitForTool('docs_open_marker_2');
	const result = await webmcp.callTool('docs_open_marker_2');
	expect(result.content[0].text).toBe('Opened Kyoto');
	await page.getByRole('button', { name: 'Remove' }).nth(1).click();
	await expect.poll(() => webmcp.listTools()).not.toContain('docs_open_marker_2');
});

test('remote form and command tools run the real remote functions', async ({ page, webmcp }) => {
	await page.goto('/docs/kit');
	await webmcp.waitForTool('docs_create_post');
	const [post] = await Promise.all([
		webmcp.callTool('docs_create_post', {
			title: 'Agent post',
			content: 'Written by an agent through formTool.'
		}),
		page.getByRole('button', { name: 'Allow' }).click()
	]);
	expect(post.content[0].text).toContain('"title":"Agent post"');
	await expect(page.getByLabel('Title')).toHaveValue('Agent post');

	const [todo] = await Promise.all([
		webmcp.callTool('docs_remote_add_todo', { text: 'From the e2e agent' }),
		page.getByRole('button', { name: 'Allow' }).click()
	]);
	expect(todo.isError).toBeUndefined();
	await expect(page.getByText('From the e2e agent', { exact: true })).toBeVisible();
});

test('navigation is allow-listed and page context is opt-in', async ({ page, webmcp }) => {
	await page.goto('/docs/navigation');
	await webmcp.waitForTool('get_page_context');
	const context = await webmcp.callTool('get_page_context');
	expect(context.content[0].text).toContain('Desk lamp');
	expect(context.content[0].text).not.toContain('Supplier margin');
	expect((await webmcp.callTool('navigate', { route: '/admin' })).isError).toBe(true);
	await webmcp.callTool('navigate', { route: '/docs/server' });
	await expect(page).toHaveURL(/\/docs\/server$/);
});

test('server sets headers and serves MCP', async ({ request }) => {
	const html = await request.get('/');
	expect(html.headers()['permissions-policy']).toBe('tools=(self)');
	const list = await request.post('/mcp', {
		data: { jsonrpc: '2.0', id: 1, method: 'tools/list' }
	});
	const body = await list.json();
	expect(body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
		'list_todos',
		'search_todos'
	]);
});

test('devtools fires a tool by hand', async ({ page, webmcp }) => {
	await page.goto('/docs/devtools');
	await webmcp.waitForTool('docs_echo');
	await page.getByRole('button', { name: /^WebMCP/ }).click();
	await page.getByRole('button', { name: /docs_echo/ }).click();
	await page.getByLabel('Input (JSON)').fill('{"message":"hi"}');
	await page.getByRole('button', { name: 'Run docs_echo' }).click();
	await expect(page.getByText('You said: hi').first()).toBeVisible();
});
