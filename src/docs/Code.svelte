<script lang="ts">
	interface Props {
		code: string;
		lang?: string;
	}

	let { code, lang = 'ts' }: Props = $props();
</script>

<pre data-lang={lang}><code>{code.trim()}</code></pre>

<style>
	pre {
		margin: 0.75rem 0;
		padding: 0.9rem 1rem;
		overflow-x: auto;
		background: var(--code-bg);
		color: var(--code-fg);
		border-radius: var(--radius);
		font: 0.85rem/1.55 var(--mono);
		tab-size: 2;
	}
</style>
