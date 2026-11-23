<script lang="ts">
	import mark from '#docs/assets/favicon.svg';
	import full from '#docs/assets/logo.svg';

	type Variant = 'mark' | 'full';

	let {
		variant = 'mark',
		size = 24,
		class: className
	}: { variant?: Variant; size?: number; class?: string } = $props();

	// Both draw a page <> agent link; `mark` has heavier strokes for small sizes.
	const src = $derived(variant === 'full' ? full : mark);
</script>

<img {src} alt="" width={size} height={size} class={className} />
