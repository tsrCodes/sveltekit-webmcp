<script lang="ts">
	import Feature from '#docs/components/Feature.svelte';
	import TestingDemo from '#docs/demos/TestingDemo.svelte';
</script>

<Feature id="F24" />

`sveltekit-webmcp/testing` gives you `mockModelContext()`, a fake `document.modelContext` that behaves like the draft, and `callTool()`, which calls a tool the way an agent would. `sveltekit-webmcp/testing/playwright` exports a `test` with a `webmcp` fixture that loads the polyfill into every page.

```ts
import { render } from 'vitest-browser-svelte';
import { mockModelContext, callTool, waitForTool } from 'sveltekit-webmcp/testing';
import TodoPage from './+page.svelte';

test('add_todo adds an item', async () => {
	const ctx = mockModelContext(); // installs a fake document.modelContext
	render(TodoPage);
	await waitForTool('add_todo');
	const res = await callTool('add_todo', { text: 'milk' });
	expect(res.isError).toBe(false);
	ctx.restore();
});
```

```ts
import { test, expect } from 'sveltekit-webmcp/testing/playwright';

test('agent can add a todo', async ({ page, webmcp }) => {
	await page.goto('/todos');
	await webmcp.waitForTool('add_todo');
	const result = await webmcp.callTool('add_todo', { text: 'milk' });
	expect(result.content[0].text).toContain('milk');
});
```

<TestingDemo />
