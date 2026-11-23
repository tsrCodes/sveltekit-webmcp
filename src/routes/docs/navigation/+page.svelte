<script lang="ts">
	import { searchTool } from '#lib/kit/index.js';
	import { callTool } from '#lib/testing/index.js';
	import type { ToolResult } from '#lib/index.js';
	import { DOC_PAGES } from '../../../docs/features.js';
	import Code from '../../../docs/Code.svelte';
	import Section from '../../../docs/Section.svelte';
	import ToolState from '../../../docs/ToolState.svelte';

	let { data } = $props();

	const index = DOC_PAGES.flatMap((doc) =>
		doc.features.map((feature) => ({ page: doc.path, ...feature }))
	);

	const search = searchTool({
		name: 'docs_search',
		description: 'Search the sveltekit-webmcp docs by feature name or summary',
		search: ({ query, limit = 5 }) => {
			const needle = query.toLowerCase();
			return index
				.filter((entry) => `${entry.title} ${entry.summary}`.toLowerCase().includes(needle))
				.slice(0, limit);
		}
	});

	let query = $state('schema');
	let contextResult = $state.raw<ToolResult | undefined>(undefined);
	let navigateResult = $state.raw<ToolResult | undefined>(undefined);
</script>

<svelte:head><title>Navigation and context · sveltekit-webmcp</title></svelte:head>

<h1>Navigation and context</h1>

<Section feature="F16" title="navigateTool()">
	<p>
		Register once in the root layout. The input is built from an allow-list of route ids plus
		params; the path is made with <code>resolve()</code> and opened with <code>goto()</code>. The
		agent can only go where the app allows.
	</p>
	<Code
		code={`navigateTool({
  routes: {
    '/': { description: 'Home' },
    '/blog/[slug]': { description: 'A blog post' }
  }
});`}
	/>
	{#snippet demo()}
		<div class="row">
			<button
				type="button"
				onclick={async () => (navigateResult = await callTool('navigate', { route: '/admin' }))}
				>Ask for /admin</button
			>
			<button
				type="button"
				class="secondary"
				onclick={async () =>
					(navigateResult = await callTool('navigate', { route: '/docs/tools' }))}
				>Ask for /docs/tools</button
			>
		</div>
		{#if navigateResult}
			<pre class={['out', navigateResult.isError && 'error']}>{navigateResult.content[0]
					?.text}</pre>
		{/if}
	{/snippet}
</Section>

<Section feature="F17" title="pageContextTool()">
	<p>
		Returns an allow-listed slice of <code>page</code> from <code>$app/state</code>: route id,
		params, title, and only the data keys you name. It never dumps all of <code>page.data</code>.
	</p>
	<Code
		code={`pageContextTool({ fields: { routeId: true, params: true, title: true, data: ['product'] } });`}
	/>
	{#snippet demo()}
		<p class="note">
			This page loads <code>product</code> and <code>internalNotes</code> (“{data.internalNotes}”).
			Only
			<code>product</code> is shared.
		</p>
		<button type="button" onclick={async () => (contextResult = await callTool('get_page_context'))}
			>Read page context as the agent</button
		>
		{#if contextResult}
			<pre class="out">{contextResult.content[0]?.text}</pre>
		{/if}
	{/snippet}
</Section>

<Section feature="F18" title="searchTool()">
	<p>
		Pass a search callback or a remote query. The tool takes <code>{'{ query, limit? }'}</code> and
		is read-only. Results often hold user-written text; add <code>untrusted: true</code> when they do.
	</p>
	<Code
		code={`searchTool({
  description: 'Search blog posts',
  search: ({ query, limit }) => searchPosts({ query, limit })
});`}
	/>
	{#snippet demo()}
		<form
			class="row"
			onsubmit={(event) => {
				event.preventDefault();
				search.call({ query });
			}}
		>
			<input bind:value={query} aria-label="Search the docs" style:flex="1" />
			<button type="submit">Search</button>
		</form>
		<ToolState tool={search} />
	{/snippet}
</Section>

<style>
	.out {
		background: var(--code-bg);
		color: var(--code-fg);
		padding: 0.6rem 0.8rem;
		border-radius: 8px;
		font: 0.85rem/1.5 var(--mono);
		white-space: pre-wrap;
	}

	.out.error {
		color: #ff8a80;
	}
</style>
