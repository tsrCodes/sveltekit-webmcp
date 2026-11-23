<script lang="ts">
	interface Props {
		text: string;
		isError?: boolean;
	}

	let { text, isError = false }: Props = $props();
</script>

<pre
	class={[
		'max-h-80 overflow-auto rounded-lg border bg-code px-3 py-2 font-mono text-xs leading-5 whitespace-pre-wrap',
		isError && 'text-destructive'
	]}>{text}</pre>
