<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		feature: string;
		title: string;
		children: Snippet;
		demo?: Snippet;
	}

	let { feature, title, children, demo }: Props = $props();
	const headingId = $derived(`${feature.toLowerCase()}-heading`);
</script>

<section id={feature.toLowerCase()} aria-labelledby={headingId}>
	<h2 id={headingId}><span class="badge">{feature}</span> {title}</h2>
	{@render children()}
	{#if demo}
		<div class="demo">
			<p class="demo-label">Live demo</p>
			{@render demo()}
		</div>
	{/if}
</section>

<style>
	section {
		padding-block: 1.5rem;
		border-top: 1px solid var(--line);
		scroll-margin-top: 4rem;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 1.35rem;
		margin: 0 0 0.75rem;
	}

	.badge {
		font: 600 0.75rem/1 var(--mono);
		color: var(--accent-ink);
		background: var(--accent);
		border-radius: 999px;
		padding: 0.3rem 0.55rem;
	}

	.demo {
		margin-top: 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 1rem;
		background: var(--surface);
	}

	.demo-label {
		margin: 0 0 0.75rem;
		font: 600 0.7rem/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
</style>
