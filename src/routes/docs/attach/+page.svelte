<script lang="ts">
	import { attachTool } from '#lib/index.js';
	import Code from '../../../docs/Code.svelte';
	import Section from '../../../docs/Section.svelte';

	interface Marker {
		id: number;
		label: string;
	}

	let markers = $state<Marker[]>([
		{ id: 1, label: 'Lisbon' },
		{ id: 2, label: 'Kyoto' },
		{ id: 3, label: 'Oaxaca' }
	]);
	let nextId = 4;
	let opened = $state<string | undefined>(undefined);
	const places = ['Reykjavik', 'Hanoi', 'Cusco', 'Tbilisi', 'Valparaíso'];

	function addMarker() {
		markers.push({ id: nextId, label: places[(nextId - 4) % places.length] });
		nextId += 1;
	}

	function removeMarker(id: number) {
		markers = markers.filter((marker) => marker.id !== id);
	}
</script>

<svelte:head><title>Attachments · sveltekit-webmcp</title></svelte:head>

<h1>Attachments</h1>

<Section feature="F4" title="attachTool()">
	<p>
		A tool can live with an element. Rendered means registered; removed by <code>{'{#if}'}</code> or
		<code>{'{#each}'}</code> means unregistered, so per-item tools come for free. The element is
		passed to <code>execute</code> as <code>context.element</code>, handy for scrolling it into view
		or focusing it.
	</p>
	<Code
		lang="svelte"
		code={`{#each markers as marker (marker.id)}
  <button {@attach attachTool(() => ({
    name: \`open_marker_\${marker.id}\`,
    description: \`Open popup for \${marker.label}\`,
    execute: (_input, { element }) => {
      element?.scrollIntoView({ block: 'center' });
      return open(marker);
    }
  }))}>{marker.label}</button>
{/each}`}
	/>
	{#snippet demo()}
		<ul class="markers">
			{#each markers as marker (marker.id)}
				<li class="row">
					<button
						type="button"
						class={['marker', opened === marker.label && 'open']}
						onclick={() => (opened = marker.label)}
						{@attach attachTool(() => ({
							name: `docs_open_marker_${marker.id}`,
							description: `Open the popup for ${marker.label}`,
							execute: (_input, { element }) => {
								element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
								opened = marker.label;
								return `Opened ${marker.label}`;
							}
						}))}>{marker.label}</button
					>
					<button type="button" class="secondary" onclick={() => removeMarker(marker.id)}
						>Remove</button
					>
				</li>
			{/each}
		</ul>
		<div class="row">
			<button type="button" onclick={addMarker}>Add marker</button>
			<span class="note" aria-live="polite"
				>{opened ? `Popup open: ${opened}` : 'No popup open'}</span
			>
		</div>
	{/snippet}
</Section>

<style>
	.markers {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 0.4rem;
	}

	.marker.open {
		background: var(--accent);
		color: var(--accent-ink);
	}
</style>
