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
</script>

<dl class="state">
	<dt>name</dt>
	<dd><code>{tool.name}</code></dd>
	<dt>registered</dt>
	<dd>{tool.registered}</dd>
	<dt>running</dt>
	<dd>{tool.running}</dd>
	<dt>callCount</dt>
	<dd>{tool.callCount}</dd>
	<dt>error</dt>
	<dd>{tool.error?.message ?? '—'}</dd>
	<dt>lastResult</dt>
	<dd class={{ error: tool.lastResult?.isError }}>{resultText ?? '—'}</dd>
</dl>

<style>
	.state {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.25rem 1rem;
		margin: 0.75rem 0 0;
		font: 0.85rem/1.4 var(--mono);
	}

	dt {
		color: var(--muted);
	}

	dd {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.error {
		color: var(--danger);
	}
</style>
