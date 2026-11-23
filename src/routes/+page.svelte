<script lang="ts">
	import { resolve } from '$app/paths';
	import { isSupported, registeredTools } from '#lib/index.js';
	import Code from '../docs/Code.svelte';
	import { DOC_PAGES } from '../docs/features.js';
	import { QUICK_START_SAMPLE } from '../docs/snippets.js';
</script>

<svelte:head><title>sveltekit-webmcp</title></svelte:head>

<section class="hero">
	<h1>WebMCP for SvelteKit</h1>
	<p class="lead">
		Let AI agents use your app through tools you define. Runes, attachments and remote functions,
		the Svelte way.
	</p>
	<p class="status" aria-live="polite">
		{#if isSupported.current}
			WebMCP is running on this page with {registeredTools.current.length} tools.
		{:else}
			Waiting for WebMCP…
		{/if}
	</p>
</section>

<h2>Install</h2>
<Code lang="sh" code="pnpm add sveltekit-webmcp @standard-schema/spec" />
<p class="note">
	Optional: <code>pnpm add @w3c/webmcp-polyfill</code> for browsers without the native API. WebMCP is
	a W3C Community Group draft and runs in a Chrome and Edge origin trial today.
</p>

<h2>Quick start</h2>
<Code lang="svelte" code={QUICK_START_SAMPLE} />

<h2>Entry points</h2>
<table>
	<thead>
		<tr><th scope="col">Import</th><th scope="col">Contents</th></tr>
	</thead>
	<tbody>
		<tr
			><td><code>sveltekit-webmcp</code></td><td
				><code>tool</code>, <code>attachTool</code>, <code>setWebMCP</code>, <code>getWebMCP</code>,
				<code>registeredTools</code>, <code>isSupported</code></td
			></tr
		>
		<tr
			><td><code>sveltekit-webmcp/kit</code></td><td
				><code>commandTool</code>, <code>queryTool</code>, <code>formTool</code>,
				<code>navigateTool</code>, <code>pageContextTool</code>, <code>searchTool</code></td
			></tr
		>
		<tr
			><td><code>sveltekit-webmcp/server</code></td><td
				><code>webmcpHandle</code>, <code>mcpHandle</code>, <code>serverTool</code></td
			></tr
		>
		<tr><td><code>sveltekit-webmcp/devtools</code></td><td><code>WebMCPDevtools</code></td></tr>
		<tr
			><td><code>sveltekit-webmcp/testing</code></td><td
				><code>mockModelContext</code>, <code>callTool</code>, <code>waitForTool</code></td
			></tr
		>
		<tr
			><td><code>sveltekit-webmcp/testing/playwright</code></td><td
				><code>test</code> with a <code>webmcp</code> fixture</td
			></tr
		>
	</tbody>
</table>

<h2>Features</h2>
<div class="grid">
	{#each DOC_PAGES as doc (doc.path)}
		<a class="card" href={resolve(doc.path)}>
			<h3>{doc.title}</h3>
			<ul>
				{#each doc.features as feature (feature.id)}
					<li><span class="id">{feature.id}</span> {feature.title}</li>
				{/each}
			</ul>
		</a>
	{/each}
</div>

<style>
	.hero {
		padding-block: 2rem 1rem;
	}

	h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		line-height: 1.1;
		margin: 0 0 0.75rem;
		letter-spacing: -0.02em;
	}

	.lead {
		font-size: 1.15rem;
		color: var(--muted);
		max-width: 38rem;
	}

	.status {
		display: inline-block;
		font: 0.85rem/1.4 var(--mono);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.3rem 0.8rem;
	}

	h2 {
		margin-top: 2.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.5rem;
		border-bottom: 1px solid var(--line);
		vertical-align: top;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.75rem;
	}

	.card {
		display: block;
		text-decoration: none;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 1rem;
		background: var(--surface);
	}

	.card:hover {
		border-color: var(--accent);
	}

	.card h3 {
		margin: 0 0 0.5rem;
	}

	.card ul {
		list-style: none;
		margin: 0;
		padding: 0;
		font-size: 0.9rem;
		color: var(--muted);
	}

	.id {
		font: 600 0.75rem var(--mono);
		color: var(--accent);
	}
</style>
