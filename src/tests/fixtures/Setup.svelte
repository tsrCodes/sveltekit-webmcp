<script lang="ts">
	interface Props {
		/** Runs during component init, where tool() and friends may be called. */
		setup: () => void;
	}

	let { setup }: Props = $props();

	// svelte-ignore state_referenced_locally
	setup();
</script>
