<script lang="ts">
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';
	import Output from '#docs/components/Output.svelte';

	let output = $state('');
	let nextId = 1;

	async function rpc(method: string, params?: Record<string, unknown>) {
		const response = await fetch('/mcp', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				accept: 'application/json, text/event-stream'
			},
			body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params })
		});
		const type = response.headers.get('content-type') ?? '';
		output = type.includes('application/json')
			? JSON.stringify(await response.json(), null, 2)
			: `HTTP ${response.status} ${await response.text()}`.trim();
	}
</script>

<Demo>
	<div class="flex flex-wrap gap-2">
		<Button variant="outline" onclick={() => rpc('initialize', { protocolVersion: '2025-06-18' })}
			>initialize</Button
		>
		<Button variant="outline" onclick={() => rpc('tools/list')}>tools/list</Button>
		<Button
			onclick={() => rpc('tools/call', { name: 'search_todos', arguments: { query: 'draft' } })}
		>
			tools/call search_todos
		</Button>
	</div>
	{#if output}
		<Output text={output} />
	{/if}
</Demo>
