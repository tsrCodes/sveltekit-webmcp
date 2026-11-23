<script lang="ts">
	import { registeredTools } from '#lib/index.js';
	import Demo from '#docs/components/Demo.svelte';
</script>

<Demo>
	<ul class="grid gap-1">
		{#each registeredTools.current as listed (listed.name)}
			<li>
				<code class="font-mono text-xs">{listed.name}</code>
				<span class="text-muted-foreground">{listed.description}</span>
			</li>
		{:else}
			<li class="text-muted-foreground">No tools yet.</li>
		{/each}
	</ul>
</Demo>
