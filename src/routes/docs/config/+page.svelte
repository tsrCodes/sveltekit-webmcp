<script lang="ts">
	import { isSupported, registeredTools, tool } from '#lib/index.js';
	import Code from '../../../docs/Code.svelte';
	import { SET_WEBMCP_SAMPLE } from '../../../docs/snippets.js';
	import Section from '../../../docs/Section.svelte';
	import ToolState from '../../../docs/ToolState.svelte';

	let balance = $state(100);
	const transfer = tool({
		name: 'docs_transfer_points',
		description: 'Move demo points out of the balance',
		consequential: true,
		input: {
			type: 'object',
			properties: { amount: { type: 'integer', minimum: 1, maximum: 50 } },
			required: ['amount']
		},
		execute: ({ amount }) => {
			balance -= Number(amount);
			return `Moved ${String(amount)} points. Balance: ${balance}`;
		}
	});
</script>

<svelte:head><title>App config · sveltekit-webmcp</title></svelte:head>

<h1>App config</h1>

<Section feature="F5" title="setWebMCP()">
	<p>
		Optional app-wide settings, set once in the root layout and passed down through
		<code>createContext</code>, so nothing leaks between users during SSR. Without it you get sane
		defaults: no polyfill, <code>window.confirm</code> for confirmation, no prefix.
	</p>
	<Code lang="svelte" code={SET_WEBMCP_SAMPLE} />
	{#snippet demo()}
		<p class="note">
			This site's layout sets a polyfill, a custom confirm dialog and an error logger. The live tool
			list below (F10) is read from the same config.
		</p>
	{/snippet}
</Section>

<Section feature="F9" title="Confirmation">
	<p>
		Tools marked <code>consequential</code> ask before running. The request carries the tool name,
		its description and the validated input. Declining returns an <code>isError</code> “User
		declined” result. Bring your own dialog; this site uses a native <code>&lt;dialog&gt;</code>.
	</p>
	{#snippet demo()}
		<p>Balance: <strong>{balance}</strong> points</p>
		<button type="button" onclick={() => transfer.call({ amount: 10 })}>Transfer 10 points</button>
		<ToolState tool={transfer} />
	{/snippet}
</Section>

<Section feature="F10" title="registeredTools">
	<p>
		<code>registeredTools.current</code> reads <code>getTools()</code> and stays fresh through
		<code>createSubscriber</code> on <code>toolchange</code>. Use it to show what the agent can do
		here.
	</p>
	{#snippet demo()}
		<ul class="tools">
			{#each registeredTools.current as listed (listed.name)}
				<li><code>{listed.name}</code> <span class="note">{listed.description}</span></li>
			{:else}
				<li class="note">No tools yet.</li>
			{/each}
		</ul>
	{/snippet}
</Section>

<Section feature="F12" title="Polyfill and late injection">
	<p>
		<code>polyfill: true</code> lazy-loads <code>@w3c/webmcp-polyfill</code> in the browser only
		when the native API is missing (install it first). A function lets you load it yourself. Without
		a polyfill the package checks every 500 ms for 10 s, for extensions that inject the API late.
		<code>isSupported.current</code> is reactive.
	</p>
	{#snippet demo()}
		<p>
			isSupported.current: <strong>{isSupported.current}</strong>
			<span class="note">
				({isSupported.current ? 'tools can be registered' : 'no model context yet'})
			</span>
		</p>
	{/snippet}
</Section>

<style>
	.tools {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.2rem;
	}
</style>
