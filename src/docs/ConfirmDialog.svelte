<script lang="ts">
	import * as AlertDialog from '#docs/components/ui/alert-dialog/index.js';
	import type { Confirmer } from './confirmer.svelte.js';

	interface Props {
		confirmer: Confirmer;
	}

	let { confirmer }: Props = $props();

	// Escape, an outside click or Decline all close the dialog, and all mean "no".
	function onOpenChange(open: boolean) {
		if (!open && confirmer.request) confirmer.answer(false);
	}
</script>

<AlertDialog.Root open={confirmer.request !== undefined} {onOpenChange}>
	<AlertDialog.Content class="sm:max-w-md">
		{#if confirmer.request}
			<AlertDialog.Header>
				<AlertDialog.Title>
					Allow the agent to run <code class="font-mono">{confirmer.request.toolName}</code>?
				</AlertDialog.Title>
				<AlertDialog.Description>{confirmer.request.description}</AlertDialog.Description>
			</AlertDialog.Header>
			<pre
				class="max-h-48 overflow-auto rounded-lg border bg-code p-3 font-mono text-xs">{JSON.stringify(
					confirmer.request.input,
					null,
					2
				)}</pre>
			<AlertDialog.Footer>
				<AlertDialog.Cancel onclick={() => confirmer.answer(false)}>Decline</AlertDialog.Cancel>
				<AlertDialog.Action onclick={() => confirmer.answer(true)}>Allow</AlertDialog.Action>
			</AlertDialog.Footer>
		{/if}
	</AlertDialog.Content>
</AlertDialog.Root>
