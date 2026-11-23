<script lang="ts">
	// The F1 sample from the spec, as written.
	import { tool } from '#lib/index.js';
	import * as v from 'valibot';
	import { toStandardJsonSchema } from '@valibot/to-json-schema';

	let todos = $state<string[]>([]);

	const addTodo = tool({
		name: 'add_todo',
		description: 'Add an item to the todo list',
		input: toStandardJsonSchema(v.object({ text: v.pipe(v.string(), v.minLength(1)) })),
		execute: ({ text }) => {
			todos.push(text);
			return `Added "${text}"`;
		}
	});
</script>

{#if addTodo.registered}<p>Agent ready</p>{/if}
<ul>
	{#each todos as todo, index (index)}
		<li>{todo}</li>
	{/each}
</ul>
