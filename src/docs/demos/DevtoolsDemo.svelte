<script lang="ts">
	import { tool } from '#lib/index.js';
	import Demo from '#docs/components/Demo.svelte';

	tool({
		name: 'docs_echo',
		description: 'Echo the input back (try it from the panel)',
		readOnly: true,
		debugging: true,
		input: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
		execute: ({ message }) => `You said: ${String(message)}`
	});
</script>

<Demo>
	<ol class="list-decimal space-y-1 pl-5">
		<li>Open the <strong>WebMCP</strong> button at the bottom right.</li>
		<li>Pick <code class="font-mono">docs_echo</code>.</li>
		<li>
			Enter <code class="font-mono">{'{"message":"hi"}'}</code> and run it. The call shows up under Calls.
		</li>
	</ol>
</Demo>
