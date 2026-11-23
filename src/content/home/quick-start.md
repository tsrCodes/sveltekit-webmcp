```svelte
<script lang="ts">
	import { tool } from 'sveltekit-webmcp';
	import * as z from 'zod';

	let todos = $state<string[]>([]);

	const addTodo = tool({
		name: 'add_todo',
		description: 'Add an item to the todo list',
		input: z.object({ text: z.string().min(1) }),
		execute: ({ text }) => {
			todos.push(text);
			return `Added "${text}"`;
		}
	});
</script>

{#if addTodo.registered}<p>Agent ready</p>{/if}
```
