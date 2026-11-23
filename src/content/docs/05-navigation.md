<script lang="ts">
	import Feature from '#docs/components/Feature.svelte';
	import NavigateDemo from '#docs/demos/NavigateDemo.svelte';
	import PageContextDemo from '#docs/demos/PageContextDemo.svelte';
	import SearchDemo from '#docs/demos/SearchDemo.svelte';
</script>

<Feature id="F16" />

Register once in the root layout. The input is built from an allow-list of route ids plus params; the path is made with `resolve()` and opened with `goto()`. The agent can only go where the app allows. Pass `resolvePath` when the paths agents see differ from your route ids, as this site does for its catch-all docs route.

```ts
navigateTool({
	routes: {
		'/': { description: 'Home' },
		'/blog/[slug]': { description: 'A blog post' }
	}
});
```

<NavigateDemo />

<Feature id="F17" />

Returns an allow-listed slice of `page` from `$app/state`: route id, params, title, and only the data keys you name. It never dumps all of `page.data`.

```ts
pageContextTool({ fields: { routeId: true, params: true, title: true, data: ['product'] } });
```

<PageContextDemo />

<Feature id="F18" />

Pass a search callback or a remote query. The tool takes `{ query, limit? }` and is read-only. Results often hold user-written text; add `untrusted: true` when they do.

```ts
searchTool({
	description: 'Search blog posts',
	search: ({ query, limit }) => searchPosts({ query, limit })
});
```

<SearchDemo />
