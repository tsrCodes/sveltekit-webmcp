<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="not-prose my-6 rounded-xl border bg-card p-4 text-sm text-card-foreground shadow-xs">
	<p
		class="mb-3 font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase"
	>
		Live demo
	</p>
	<div class="grid gap-3">
		{@render children()}
	</div>
</div>
