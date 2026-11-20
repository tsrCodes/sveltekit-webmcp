<script lang="ts">
	import { setWebMCP, type WebMCPConfig } from '#lib/index.js';
	import AttachHost from './AttachHost.svelte';

	interface Props {
		config: WebMCPConfig;
		items: { id: number; label: string }[];
	}

	let { config, items }: Props = $props();

	// svelte-ignore state_referenced_locally
	setWebMCP(config);
</script>

<AttachHost {items} />
