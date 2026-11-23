<script lang="ts">
	import type { ToolResult } from '#lib/index.js';
	import { callTool } from '#lib/testing/index.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';
	import Output from '#docs/components/Output.svelte';

	let result = $state.raw<ToolResult | undefined>(undefined);

	async function ask(route: string) {
		result = await callTool('navigate', { route });
	}
</script>

<Demo>
	<div class="flex flex-wrap gap-2">
		<Button onclick={() => ask('/admin')}>Ask for /admin</Button>
		<Button variant="outline" onclick={() => ask('/docs/tools')}>Ask for /docs/tools</Button>
	</div>
	{#if result}
		<Output text={result.content[0]?.text ?? ''} isError={result.isError} />
	{/if}
</Demo>
