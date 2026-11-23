<script lang="ts">
	import type { Confirmer } from './confirmer.svelte.js';

	interface Props {
		confirmer: Confirmer;
	}

	let { confirmer }: Props = $props();

	// Open and close the native dialog as requests come and go.
	function syncOpen(dialog: HTMLDialogElement) {
		if (confirmer.request && !dialog.open) dialog.showModal();
		if (!confirmer.request && dialog.open) dialog.close();
	}
</script>

<dialog {@attach syncOpen} oncancel={() => confirmer.answer(false)} aria-labelledby="confirm-title">
	{#if confirmer.request}
		<h2 id="confirm-title">Allow the agent to run <code>{confirmer.request.toolName}</code>?</h2>
		<p>{confirmer.request.description}</p>
		<pre>{JSON.stringify(confirmer.request.input, null, 2)}</pre>
		<div class="actions">
			<button type="button" class="secondary" onclick={() => confirmer.answer(false)}
				>Decline</button
			>
			<button type="button" onclick={() => confirmer.answer(true)}>Allow</button>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--fg);
		max-width: min(440px, calc(100vw - 2rem));
		padding: 1.25rem;
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
	}

	h2 {
		font-size: 1.1rem;
		margin: 0 0 0.5rem;
	}

	pre {
		background: var(--code-bg);
		color: var(--code-fg);
		padding: 0.6rem;
		border-radius: 6px;
		font: 0.8rem/1.4 var(--mono);
		overflow-x: auto;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
</style>
