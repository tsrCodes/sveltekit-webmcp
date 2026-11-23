<script lang="ts">
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';

	let headers = $state<{ policy: string | null; trial: string | null } | undefined>(undefined);

	async function readHeaders() {
		const response = await fetch(location.href, { headers: { accept: 'text/html' } });
		headers = {
			policy: response.headers.get('permissions-policy'),
			trial: response.headers.get('origin-trial')
		};
	}
</script>

<Demo>
	<div><Button onclick={readHeaders}>Read this page's headers</Button></div>
	{#if headers}
		<dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 font-mono text-xs">
			<dt class="text-muted-foreground">Permissions-Policy</dt>
			<dd>{headers.policy ?? '(none)'}</dd>
			<dt class="text-muted-foreground">Origin-Trial</dt>
			<dd>{headers.trial ? 'set' : '(not set: no WEBMCP_OT in this environment)'}</dd>
		</dl>
	{/if}
</Demo>
