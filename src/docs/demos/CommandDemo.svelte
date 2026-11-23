<script lang="ts">
	import { commandTool } from '#lib/kit/index.js';
	import { addTodo, getTodos } from '../../demo/demo.remote.js';
	import { addTodoSchema } from '../../demo/schemas.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';
	import ToolState from '#docs/components/ToolState.svelte';

	const TODO_SUFFIX_RANGE = 1000;

	const addTodoTool = commandTool(addTodo, {
		name: 'docs_remote_add_todo',
		description: 'Add a todo on the server',
		input: addTodoSchema,
		consequential: true
	});
</script>

<Demo>
	<div>
		<Button onclick={() => addTodoTool.call({ text: `Todo #${Date.now() % TODO_SUFFIX_RANGE}` })}>
			Add a todo through the tool
		</Button>
	</div>
	<ToolState tool={addTodoTool} />
	<svelte:boundary>
		<ul class="list-disc pl-5">
			{#each await getTodos() as todo (todo.id)}
				<li>{todo.text}</li>
			{/each}
		</ul>
		{#snippet pending()}<p class="text-muted-foreground">Loading todos…</p>{/snippet}
	</svelte:boundary>
</Demo>
