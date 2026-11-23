<script lang="ts">
	import { attachTool } from '#lib/index.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';

	interface Marker {
		id: number;
		label: string;
	}

	const PLACES = ['Reykjavik', 'Hanoi', 'Cusco', 'Tbilisi', 'Valparaíso'];
	const FIRST_ADDED_ID = 4;

	let markers = $state<Marker[]>([
		{ id: 1, label: 'Lisbon' },
		{ id: 2, label: 'Kyoto' },
		{ id: 3, label: 'Oaxaca' }
	]);
	let nextId = FIRST_ADDED_ID;
	let opened = $state<string | undefined>(undefined);

	function addMarker() {
		markers.push({ id: nextId, label: PLACES[(nextId - FIRST_ADDED_ID) % PLACES.length] });
		nextId += 1;
	}

	function removeMarker(id: number) {
		markers = markers.filter((marker) => marker.id !== id);
	}
</script>

<Demo>
	<ul class="grid gap-2">
		{#each markers as marker (marker.id)}
			<li class="flex items-center gap-2">
				<Button
					variant={opened === marker.label ? 'default' : 'outline'}
					class={[opened === marker.label && 'bg-brand text-brand-foreground hover:bg-brand/90']}
					onclick={() => (opened = marker.label)}
					{@attach attachTool(() => ({
						name: `docs_open_marker_${marker.id}`,
						description: `Open the popup for ${marker.label}`,
						execute: (_input, { element }) => {
							element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
							opened = marker.label;
							return `Opened ${marker.label}`;
						}
					}))}>{marker.label}</Button
				>
				<Button variant="ghost" onclick={() => removeMarker(marker.id)}>Remove</Button>
			</li>
		{/each}
	</ul>
	<div class="flex flex-wrap items-center gap-3">
		<Button onclick={addMarker}>Add marker</Button>
		<span class="text-muted-foreground" aria-live="polite">
			{opened ? `Popup open: ${opened}` : 'No popup open'}
		</span>
	</div>
</Demo>
