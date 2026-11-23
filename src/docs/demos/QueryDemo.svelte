<script lang="ts">
	import { queryTool } from '#lib/kit/index.js';
	import { getTodos } from '../../demo/demo.remote.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';
	import ToolState from '#docs/components/ToolState.svelte';

	const listTodosTool = queryTool(getTodos, {
		name: 'docs_remote_list_todos',
		description: 'List the todos stored on the server'
	});
</script>

<Demo>
	<div><Button onclick={() => listTodosTool.call()}>Run the query tool</Button></div>
	<ToolState tool={listTodosTool} />
</Demo>
