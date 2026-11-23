// Code samples that contain <script> tags. They cannot live inside a
// .svelte file's script block, where a closing script tag would end it.
const open = '<' + 'script lang="ts">';
const close = '</' + 'script>';

export const SET_WEBMCP_SAMPLE = `<!-- +layout.svelte -->
${open}
  import { setWebMCP } from 'sveltekit-webmcp';

  setWebMCP({
    polyfill: () => import('@w3c/webmcp-polyfill'), // or true
    prefix: 'shop_',
    confirm: (request) => confirmDialog.ask(request),
    onError: (error, toolName) => console.error(toolName, error),
    exposedTo: []
  });
${close}`;

export const DEVTOOLS_SAMPLE = `<!-- +layout.svelte -->
${open}
  import { WebMCPDevtools } from 'sveltekit-webmcp/devtools';
${close}

<WebMCPDevtools />
<!-- theme it -->
<WebMCPDevtools --webmcp-accent="hotpink" --webmcp-bg="#fff" --webmcp-fg="#111" />`;

export const COMPONENT_TEST_SAMPLE = `import { render } from 'vitest-browser-svelte';
import { mockModelContext, callTool, waitForTool } from 'sveltekit-webmcp/testing';
import TodoPage from './+page.svelte';

test('add_todo adds an item', async () => {
  const ctx = mockModelContext(); // installs a fake document.modelContext
  render(TodoPage);
  await waitForTool('add_todo');
  const res = await callTool('add_todo', { text: 'milk' });
  expect(res.isError).toBeUndefined();
  ctx.restore();
});`;

export const PLAYWRIGHT_SAMPLE = `import { test, expect } from 'sveltekit-webmcp/testing/playwright';

test('agent can add a todo', async ({ page, webmcp }) => {
  await page.goto('/todos');
  await webmcp.waitForTool('add_todo');
  const result = await webmcp.callTool('add_todo', { text: 'milk' });
  expect(result.content[0].text).toContain('milk');
});`;

export const QUICK_START_SAMPLE = `${open}
  import { tool } from 'sveltekit-webmcp';
  import * as z from 'zod';

  let todos = $state<string[]>([]);

  const addTodo = tool({
    name: 'add_todo',
    description: 'Add an item to the todo list',
    input: z.object({ text: z.string().min(1) }),
    execute: ({ text }) => {
      todos.push(text);
      return \`Added "\${text}"\`;
    }
  });
${close}

{#if addTodo.registered}<p>Agent ready</p>{/if}`;
