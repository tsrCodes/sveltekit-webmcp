<script lang="ts">
	import { tool, type ToolResult } from '#lib/index.js';
	import { callTool } from '#lib/testing/index.js';
	import Code from '../../../docs/Code.svelte';
	import Section from '../../../docs/Section.svelte';
	import { COMPONENT_TEST_SAMPLE, PLAYWRIGHT_SAMPLE } from '../../../docs/snippets.js';

	let items = $state<string[]>([]);
	tool({
		name: 'docs_testing_add',
		description: 'Add an item to the testing demo list',
		input: {
			type: 'object',
			properties: { text: { type: 'string', minLength: 1 } },
			required: ['text']
		},
		execute: ({ text }) => {
			items.push(String(text));
			return `Added "${String(text)}"`;
		}
	});

	interface Check {
		name: string;
		passed: boolean;
		detail: string;
	}

	let checks = $state.raw<Check[]>([]);

	function check(name: string, result: ToolResult, expectError: boolean): Check {
		const passed = Boolean(result.isError) === expectError;
		return { name, passed, detail: result.content[0]?.text ?? '' };
	}

	async function runChecks() {
		checks = [
			check('valid input succeeds', await callTool('docs_testing_add', { text: 'milk' }), false),
			check('empty text is rejected', await callTool('docs_testing_add', { text: '' }), true)
		];
	}
</script>

<svelte:head><title>Testing · sveltekit-webmcp</title></svelte:head>

<h1>Testing</h1>

<Section feature="F24" title="Testing entry">
	<p>
		<code>sveltekit-webmcp/testing</code> gives you <code>mockModelContext()</code>, a fake
		<code>document.modelContext</code> that behaves like the draft, and <code>callTool()</code>,
		which calls a tool the way an agent would. <code>sveltekit-webmcp/testing/playwright</code>
		exports a
		<code>test</code> with a <code>webmcp</code> fixture that loads the polyfill into every page.
	</p>
	<Code code={COMPONENT_TEST_SAMPLE} />
	<Code code={PLAYWRIGHT_SAMPLE} />
	{#snippet demo()}
		<p class="note">
			These checks use <code>callTool()</code> against the real tool on this page.
		</p>
		<button type="button" onclick={runChecks}>Run checks</button>
		{#if checks.length > 0}
			<ul class="checks">
				{#each checks as item (item.name)}
					<li class={item.passed ? 'pass' : 'fail'}>
						{item.passed ? '✓' : '✗'}
						{item.name} <span class="note">({item.detail})</span>
					</li>
				{/each}
			</ul>
		{/if}
		<p class="note">Items: {items.join(', ') || 'none yet'}</p>
	{/snippet}
</Section>

<style>
	.checks {
		list-style: none;
		padding: 0;
	}

	.pass {
		color: #2e7d32;
	}

	.fail {
		color: var(--danger);
	}
</style>
