<script lang="ts">
	import Feature from '#docs/components/Feature.svelte';
	import AttachDemo from '#docs/demos/AttachDemo.svelte';
</script>

<Feature id="F4" />

A tool can live with an element. Rendered means registered; removed by `{#if}` or `{#each}` means unregistered, so per-item tools come for free. The element is passed to `execute` as `context.element`, handy for scrolling it into view or focusing it.

```svelte
{#each markers as marker (marker.id)}
	<button
		{@attach attachTool(() => ({
			name: `open_marker_${marker.id}`,
			description: `Open popup for ${marker.label}`,
			execute: (_input, { element }) => {
				element?.scrollIntoView({ block: 'center' });
				return open(marker);
			}
		}))}>{marker.label}</button
	>
{/each}
```

<AttachDemo />
