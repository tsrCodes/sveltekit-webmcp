<script lang="ts">
	import { tool, type ToolResult } from '#lib/index.js';
	import { callTool } from '#lib/testing/index.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';

	interface Check {
		name: string;
		passed: boolean;
		detail: string;
	}

	let items = $state<string[]>([]);
	let checks = $state.raw<Check[]>([]);

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

<Demo>
	<p class="text-muted-foreground">
		These checks use <code class="font-mono">callTool()</code> against the real tool on this page.
	</p>
	<div><Button onclick={runChecks}>Run checks</Button></div>
	{#if checks.length > 0}
		<ul class="grid gap-1">
			{#each checks as item (item.name)}
				<li class={item.passed ? 'text-success' : 'text-destructive'}>
					{item.passed ? '✓' : '✗'}
					{item.name} <span class="text-muted-foreground">({item.detail})</span>
				</li>
			{/each}
		</ul>
	{/if}
	<p class="text-muted-foreground">Items: {items.join(', ') || 'none yet'}</p>
</Demo>
