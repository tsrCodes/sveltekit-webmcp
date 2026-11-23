<script lang="ts">
	import { Badge } from '#docs/components/ui/badge/index.js';
	import { findFeature } from '#docs/features.js';

	interface Props {
		/** Feature id from the spec, `F1` to `F24`. */
		id: string;
	}

	let { id }: Props = $props();
	const feature = $derived(findFeature(id));
</script>

<h2
	id={id.toLowerCase()}
	class="mt-14 mb-4 flex scroll-m-20 items-center gap-2.5 border-t pt-10 text-2xl font-semibold tracking-tight"
>
	<Badge class="bg-brand font-mono text-brand-foreground">{id}</Badge>
	{feature.title}
</h2>
