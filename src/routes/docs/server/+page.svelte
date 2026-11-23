<script lang="ts">
	import Code from '../../../docs/Code.svelte';
	import Section from '../../../docs/Section.svelte';

	let headers = $state<{ policy: string | null; trial: string | null } | undefined>(undefined);
	let rpcOutput = $state('');

	async function readHeaders() {
		const response = await fetch(location.href, { headers: { accept: 'text/html' } });
		headers = {
			policy: response.headers.get('permissions-policy'),
			trial: response.headers.get('origin-trial')
		};
	}

	let nextId = 1;
	async function rpc(method: string, params?: Record<string, unknown>) {
		const response = await fetch('/mcp', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				accept: 'application/json, text/event-stream'
			},
			body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params })
		});
		const type = response.headers.get('content-type') ?? '';
		rpcOutput = type.includes('application/json')
			? JSON.stringify(await response.json(), null, 2)
			: `HTTP ${response.status} ${await response.text()}`.trim();
	}
</script>

<svelte:head><title>Server · sveltekit-webmcp</title></svelte:head>

<h1>Server</h1>

<Section feature="F19" title="webmcpHandle()">
	<p>
		Adds <code>Origin-Trial</code> (for the Chrome and Edge origin trials) and
		<code>Permissions-Policy: tools=(self)</code> to HTML responses. An existing <code>tools</code>
		directive set by your app wins.
	</p>
	<Code
		code={`// hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { WEBMCP_OT } from '$app/env/private';
import { webmcpHandle } from 'sveltekit-webmcp/server';

export const handle = sequence(webmcpHandle({ originTrialToken: WEBMCP_OT, allow: ['self'] }));`}
	/>
	{#snippet demo()}
		<button type="button" onclick={readHeaders}>Read this page's headers</button>
		{#if headers}
			<dl>
				<dt>Permissions-Policy</dt>
				<dd><code>{headers.policy ?? '(none)'}</code></dd>
				<dt>Origin-Trial</dt>
				<dd>
					<code>{headers.trial ? 'set' : '(not set: no WEBMCP_OT in this environment)'}</code>
				</dd>
			</dl>
		{/if}
	{/snippet}
</Section>

<Section feature="F20" title="mcpHandle()">
	<p>
		The same tools for non-browser agents: a Streamable HTTP MCP endpoint at <code>/mcp</code> (JSON
		responses). Only tools marked <code>server: true</code> are listed. Each tool gets the request
		event, so your existing <code>handle</code> and <code>locals</code> decide access; pass
		<code>authorize</code> to guard the endpoint. Calls share the browser tools' validation, rate limits
		and result shape.
	</p>
	<Code
		code={`export const handle = sequence(
  auth,
  mcpHandle({
    tools: [
      serverTool({
        name: 'list_todos',
        description: 'List todos',
        readOnly: true,
        server: true,
        execute: (_input, event) => db.todos(event.locals.user)
      })
    ],
    authorize: ({ locals }) => !!locals.user
  })
);`}
	/>
	{#snippet demo()}
		<div class="row">
			<button type="button" onclick={() => rpc('initialize', { protocolVersion: '2025-06-18' })}
				>initialize</button
			>
			<button type="button" onclick={() => rpc('tools/list')}>tools/list</button>
			<button
				type="button"
				onclick={() => rpc('tools/call', { name: 'search_todos', arguments: { query: 'draft' } })}
				>tools/call search_todos</button
			>
		</div>
		{#if rpcOutput}
			<pre class="out">{rpcOutput}</pre>
		{/if}
	{/snippet}
</Section>

<style>
	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.25rem 1rem;
	}

	dd {
		margin: 0;
	}

	.out {
		background: var(--code-bg);
		color: var(--code-fg);
		padding: 0.6rem 0.8rem;
		border-radius: 8px;
		font: 0.8rem/1.5 var(--mono);
		max-height: 22rem;
		overflow: auto;
	}
</style>
