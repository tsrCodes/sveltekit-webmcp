<!--
@component
Floating WebMCP panel for development. Lists the tools on the page, shows
recent calls, and lets you fire a tool by hand. Renders only in dev unless
`force` is set. Theme it with the `--webmcp-*` custom properties.
-->
<script lang="ts">
	import { dev } from '$app/env';
	import { toolActivity, type ToolCall } from '#lib/activity.svelte.js';
	import { fromSpecAnnotations } from '#lib/core/annotations.js';
	import type { ListedTool } from '#lib/core/model-context.js';
	import type { ToolResult } from '#lib/core/result.js';
	import { fireTool, prettyJson } from '#lib/devtools/run.js';
	import { registeredTools } from '#lib/registered.svelte.js';
	import { isSupported } from '#lib/support.svelte.js';

	interface Props {
		/** Show the panel outside dev builds (docs, demos). */
		force?: boolean;
		/** Panel open state. */
		open?: boolean;
		position?: 'bottom-right' | 'bottom-left';
	}

	let { force = false, open = $bindable(false), position = 'bottom-right' }: Props = $props();

	const panelId = $props.id();
	let selected = $state<string | undefined>(undefined);
	let inputText = $state('{}');
	let running = $state(false);
	let manualResult = $state.raw<ToolResult | undefined>(undefined);

	const tools = $derived(registeredTools.current);
	const current = $derived(tools.find((tool) => tool.name === selected));

	function select(name: string) {
		selected = name;
		inputText = '{}';
		manualResult = undefined;
	}

	async function fire(event: SubmitEvent) {
		event.preventDefault();
		if (!current) return;
		running = true;
		try {
			manualResult = await fireTool(current.name, inputText);
		} finally {
			running = false;
		}
	}

	function hints(tool: ListedTool): string[] {
		return Object.keys(fromSpecAnnotations(tool.annotations));
	}
</script>

{#snippet resultView(result: ToolResult)}
	<pre class={['result', result.isError && 'error']}>{result.content
			.map((block) => block.text)
			.join('\n')}</pre>
{/snippet}

{#snippet toolRow(tool: ListedTool)}
	<li>
		<button
			type="button"
			class={['tool', tool.name === selected && 'active']}
			aria-pressed={tool.name === selected}
			onclick={() => select(tool.name)}
		>
			<span class="name">{tool.name}</span>
			{#each hints(tool) as hint (hint)}
				<span class="hint">{hint}</span>
			{/each}
		</button>
	</li>
{/snippet}

{#snippet callRow(call: ToolCall)}
	<li class="call">
		<div class="call-head">
			<span class="name">{call.toolName}</span>
			<span class={['status', call.result.isError && 'error']}>
				{call.result.isError ? 'error' : 'ok'} · {call.durationMs}ms
			</span>
		</div>
		<pre class="input">{prettyJson(call.input)}</pre>
		{@render resultView(call.result)}
	</li>
{/snippet}

{#if dev || force}
	<div class={['webmcp-devtools', position]}>
		<button
			type="button"
			class="toggle"
			aria-expanded={open}
			aria-controls={panelId}
			onclick={() => (open = !open)}
		>
			WebMCP · {tools.length}
		</button>

		{#if open}
			<section id={panelId} class="panel" aria-label="WebMCP devtools">
				<p class="support">
					{isSupported.current ? 'Model context available' : 'No model context on this page'}
				</p>

				<h2>Tools</h2>
				{#if tools.length === 0}
					<p class="empty">No tools registered.</p>
				{:else}
					<ul class="tools">
						{#each tools as tool (tool.name)}
							{@render toolRow(tool)}
						{/each}
					</ul>
				{/if}

				{#if current}
					<form class="fire" onsubmit={fire}>
						<p class="description">{current.description}</p>
						{#if current.inputSchema}
							<details>
								<summary>Input schema</summary>
								<pre>{prettyJson(current.inputSchema)}</pre>
							</details>
						{/if}
						<label>
							Input (JSON)
							<textarea bind:value={inputText} rows="4" spellcheck="false"></textarea>
						</label>
						<button type="submit" disabled={running}>
							{running ? 'Running…' : `Run ${current.name}`}
						</button>
						{#if manualResult}
							{@render resultView(manualResult)}
						{/if}
					</form>
				{/if}

				<div class="calls-head">
					<h2>Calls</h2>
					{#if toolActivity.calls.length > 0}
						<button type="button" class="clear" onclick={() => toolActivity.clear()}>Clear</button>
					{/if}
				</div>
				{#if toolActivity.calls.length === 0}
					<p class="empty">No calls yet.</p>
				{:else}
					<ol class="calls">
						{#each toolActivity.calls as call (call.id)}
							{@render callRow(call)}
						{/each}
					</ol>
				{/if}
			</section>
		{/if}
	</div>
{/if}

<style>
	.webmcp-devtools {
		--_bg: var(--webmcp-bg, #111418);
		--_fg: var(--webmcp-fg, #e8eaed);
		--_muted: var(--webmcp-muted, #9aa0a6);
		--_accent: var(--webmcp-accent, #ff6a3d);
		--_error: var(--webmcp-error, #ff6b6b);
		--_border: var(--webmcp-border, #2b3036);
		--_radius: var(--webmcp-radius, 10px);
		--_font: var(--webmcp-font, ui-sans-serif, system-ui, sans-serif);
		--_mono: var(--webmcp-mono, ui-monospace, SFMono-Regular, Menlo, monospace);

		position: fixed;
		bottom: 16px;
		z-index: var(--webmcp-z, 2147483000);
		font: 13px/1.4 var(--_font);
		color: var(--_fg);
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
	}

	.bottom-right {
		right: 16px;
	}

	.bottom-left {
		left: 16px;
		align-items: flex-start;
	}

	button {
		font: inherit;
		color: inherit;
		cursor: pointer;
	}

	.toggle {
		background: var(--_bg);
		border: 1px solid var(--_border);
		border-radius: 999px;
		padding: 6px 12px;
		font-weight: 600;
	}

	.toggle:focus-visible,
	.tool:focus-visible,
	.fire button:focus-visible {
		outline: 2px solid var(--_accent);
		outline-offset: 2px;
	}

	.panel {
		background: var(--_bg);
		border: 1px solid var(--_border);
		border-radius: var(--_radius);
		width: min(380px, calc(100vw - 32px));
		max-height: min(70vh, 640px);
		overflow: auto;
		padding: 12px;
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.35);
	}

	h2 {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--_muted);
		margin: 12px 0 6px;
	}

	.support,
	.empty,
	.description {
		color: var(--_muted);
		margin: 0;
	}

	ul,
	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 4px;
	}

	.tool {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		text-align: left;
		background: transparent;
		border: 1px solid var(--_border);
		border-radius: 6px;
		padding: 6px 8px;
	}

	.tool.active {
		border-color: var(--_accent);
	}

	.name {
		font-family: var(--_mono);
		font-weight: 600;
	}

	.hint {
		font-size: 11px;
		color: var(--_accent);
		border: 1px solid currentColor;
		border-radius: 999px;
		padding: 0 6px;
	}

	.fire {
		display: grid;
		gap: 8px;
		margin-top: 10px;
	}

	label {
		display: grid;
		gap: 4px;
		color: var(--_muted);
	}

	textarea,
	pre {
		font: 12px/1.4 var(--_mono);
		background: rgb(255 255 255 / 0.04);
		color: var(--_fg);
		border: 1px solid var(--_border);
		border-radius: 6px;
		padding: 6px 8px;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.fire button,
	.clear {
		justify-self: start;
		background: var(--_accent);
		color: #111;
		border: 0;
		border-radius: 6px;
		padding: 6px 10px;
		font-weight: 600;
	}

	.fire button:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.calls-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.clear {
		padding: 2px 8px;
	}

	.call {
		display: grid;
		gap: 4px;
		border-top: 1px solid var(--_border);
		padding-top: 6px;
	}

	.call-head {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}

	.status {
		color: var(--_muted);
	}

	.error {
		color: var(--_error);
	}

	@media (prefers-reduced-motion: no-preference) {
		.tool,
		.toggle {
			transition: border-color 120ms ease;
		}
	}
</style>
