<script lang="ts">
	import type { ToolResult } from '#lib/index.js';

	/** The run-state fields every tool instance exposes. */
	interface RunState {
		readonly name: string;
		readonly registered: boolean;
		readonly running: boolean;
		readonly callCount: number;
		readonly error: Error | undefined;
		readonly lastResult: ToolResult | undefined;
	}

	interface Props {
		tool: RunState;
	}

	let { tool }: Props = $props();
	const resultText = $derived(tool.lastResult?.content.map((block) => block.text).join('\n'));
	const rows = $derived([
		['name', tool.name],
		['registered', String(tool.registered)],
		['running', String(tool.running)],
		['callCount', String(tool.callCount)],
		['error', tool.error?.message ?? '—']
	]);
</script>

<dl
	class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs"
>
	{#each rows as [label, value] (label)}
		<dt class="text-muted-foreground">{label}</dt>
		<dd class="break-words">{value}</dd>
	{/each}
	<dt class="text-muted-foreground">lastResult</dt>
	<dd class={['break-words whitespace-pre-wrap', tool.lastResult?.isError && 'text-destructive']}>
		{resultText ?? '—'}
	</dd>
</dl>
