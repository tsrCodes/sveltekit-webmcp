<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { DOC_PAGES } from '#docs/features.js';

	interface Props {
		/** Called after a link is followed, so the mobile sheet can close. */
		onnavigate?: () => void;
	}

	let { onnavigate }: Props = $props();
</script>

<ul class="grid gap-0.5 text-sm">
	{#each DOC_PAGES as doc (doc.slug)}
		{@const href = resolve('/docs/[...slug]', { slug: doc.slug })}
		{@const isCurrent = page.url.pathname === href}
		<li>
			<a
				{href}
				onclick={onnavigate}
				aria-current={isCurrent ? 'page' : undefined}
				class={[
					'block rounded-md px-2.5 py-1.5 transition-colors',
					isCurrent
						? 'bg-accent font-medium text-foreground'
						: 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
				]}
			>
				{doc.title}
			</a>
		</li>
	{/each}
</ul>
