<script lang="ts">
	import { page } from '$app/state';
	import type { ToolResult } from '#lib/index.js';
	import { callTool } from '#lib/testing/index.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';
	import Output from '#docs/components/Output.svelte';

	let result = $state.raw<ToolResult | undefined>(undefined);
</script>

<Demo>
	<p class="text-muted-foreground">
		This page loads <code class="font-mono">product</code> and
		<code class="font-mono">internalNotes</code> (“{page.data.internalNotes}”). Only
		<code class="font-mono">product</code> is shared.
	</p>
	<div>
		<Button onclick={async () => (result = await callTool('get_page_context'))}>
			Read page context as the agent
		</Button>
	</div>
	{#if result}
		<Output text={result.content[0]?.text ?? ''} />
	{/if}
</Demo>
