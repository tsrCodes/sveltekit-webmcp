<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { Button } from '#docs/components/ui/button/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const Content = $derived(data.content);
	const { previous, next } = $derived(data.neighbours);
</script>

<svelte:head>
	<title>{data.doc.title} · sveltekit-webmcp</title>
	<meta name="description" content={data.doc.description} />
</svelte:head>

<div class="flex gap-10">
	<article class="min-w-0 flex-1 py-8">
		<h1 class="text-4xl font-semibold tracking-tight">{data.doc.title}</h1>
		<p class="mt-2 text-lg text-muted-foreground">{data.doc.description}</p>
		<div class="docs-prose mt-6">
			<Content />
		</div>
		<nav class="mt-14 flex items-center gap-2 border-t pt-6" aria-label="Pager">
			{#if previous}
				<Button variant="outline" href={resolve('/docs/[...slug]', { slug: previous.slug })}>
					<ArrowLeftIcon />
					{previous.title}
				</Button>
			{/if}
			{#if next}
				<Button
					variant="outline"
					class="ml-auto"
					href={resolve('/docs/[...slug]', { slug: next.slug })}
				>
					{next.title}
					<ArrowRightIcon />
				</Button>
			{/if}
		</nav>
	</article>
	<aside class="sticky top-20 hidden h-fit w-52 shrink-0 py-8 xl:block" aria-label="On this page">
		<p class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
			On this page
		</p>
		<ul class="grid gap-1.5 text-sm">
			{#each data.doc.features as feature (feature.id)}
				<li>
					<a class="text-muted-foreground hover:text-foreground" href="#{feature.id.toLowerCase()}">
						<span class="font-mono text-xs text-brand">{feature.id}</span>
						{feature.title}
					</a>
				</li>
			{/each}
		</ul>
	</aside>
</div>
