<script lang="ts">
	import { searchTool } from '#lib/kit/index.js';
	import { DOC_PAGES } from '#docs/features.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import { Input } from '#docs/components/ui/input/index.js';
	import Demo from '#docs/components/Demo.svelte';
	import ToolState from '#docs/components/ToolState.svelte';

	const DEFAULT_LIMIT = 5;
	const index = DOC_PAGES.flatMap((doc) =>
		doc.features.map((feature) => ({ page: `/docs/${doc.slug}`, ...feature }))
	);

	const search = searchTool({
		name: 'docs_search',
		description: 'Search the sveltekit-webmcp docs by feature name or summary',
		search: ({ query, limit = DEFAULT_LIMIT }) => {
			const needle = query.toLowerCase();
			return index
				.filter((entry) => `${entry.title} ${entry.summary}`.toLowerCase().includes(needle))
				.slice(0, limit);
		}
	});

	let query = $state('schema');
</script>

<Demo>
	<form
		class="flex gap-2"
		onsubmit={(event) => {
			event.preventDefault();
			search.call({ query });
		}}
	>
		<Input bind:value={query} aria-label="Search the docs" />
		<Button type="submit">Search</Button>
	</form>
	<ToolState tool={search} />
</Demo>
