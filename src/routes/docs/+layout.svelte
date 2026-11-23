<script lang="ts">
	import type { Snippet } from 'svelte';
	import DocsNav from '#docs/components/DocsNav.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="mx-auto flex w-full max-w-7xl gap-8 px-4 sm:px-6">
	<aside
		class="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r py-8 pr-4 lg:block"
		aria-label="Docs"
	>
		<p class="mb-2 px-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
			Guide
		</p>
		<DocsNav />
	</aside>
	<div class="min-w-0 flex-1">
		{@render children()}
	</div>
</div>
