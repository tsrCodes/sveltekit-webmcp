<script lang="ts">
	import { tool } from '#lib/index.js';
	import Code from '../../../docs/Code.svelte';
	import Section from '../../../docs/Section.svelte';
	import { DEVTOOLS_SAMPLE } from '../../../docs/snippets.js';

	tool({
		name: 'docs_echo',
		description: 'Echo the input back (try it from the panel)',
		readOnly: true,
		debugging: true,
		input: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
		execute: ({ message }) => `You said: ${String(message)}`
	});
</script>

<svelte:head><title>Devtools · sveltekit-webmcp</title></svelte:head>

<h1>Devtools</h1>

<Section feature="F23" title="<WebMCPDevtools />">
	<p>
		A floating panel that renders only when <code>dev</code> from <code>$app/env</code> is true
		(pass
		<code>force</code> to show it elsewhere, as this site does). It lists live tools, shows recent
		calls with input, result, errors and timing, and lets you fire a tool by hand through the model
		context, the same path an agent takes. Theme it with <code>--webmcp-*</code> custom properties.
	</p>
	<Code lang="svelte" code={DEVTOOLS_SAMPLE} />
	{#snippet demo()}
		<ol class="steps">
			<li>Open the <strong>WebMCP</strong> button at the bottom right.</li>
			<li>Pick <code>docs_echo</code>.</li>
			<li>Enter <code>{'{"message":"hi"}'}</code> and run it. The call shows up under Calls.</li>
		</ol>
	{/snippet}
</Section>

<style>
	.steps {
		margin: 0;
		padding-left: 1.2rem;
	}
</style>
