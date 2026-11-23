<script lang="ts">
	import Feature from '#docs/components/Feature.svelte';
	import CommandDemo from '#docs/demos/CommandDemo.svelte';
	import FormDemo from '#docs/demos/FormDemo.svelte';
	import QueryDemo from '#docs/demos/QueryDemo.svelte';
</script>

These tools call real SvelteKit remote functions. Schemas live in a shared module, because Kit does not allow exporting them from a `.remote.ts` file.

<Feature id="F13" />

The schema is checked on the client for the agent's benefit; the server validates again. Because the real command runs, single-flight refreshes keep working: the list below updates after each call.

```ts
// todos.schema.ts
export const addTodoSchema = z.object({ text: z.string().min(1) });

// todos.remote.ts
export const addTodo = command(addTodoSchema, async ({ text }) => {
	/* db */
});

// +page.svelte
commandTool(addTodo, {
	name: 'add_todo',
	description: 'Add a todo',
	input: addTodoSchema,
	consequential: true
});
```

<CommandDemo />

<Feature id="F14" />

Same shape, read-only by default, returns the awaited query value. Works with `query.batch` too. Use `toArg` for queries that take a plain value.

```ts
queryTool(getTodos, { name: 'list_todos', description: 'List todos' });
```

<QueryDemo />

<Feature id="F15" />

An attachment on the form. When the agent calls it, the fields are filled (the user sees it happen), the form is submitted through the element, and the tool returns `result`, or the field issues as an `isError` result so the agent can fix them and retry. Consequential by default.

```svelte
<form
	{...createPost}
	{@attach formTool(createPost, {
		name: 'create_post',
		description: 'Write and publish a blog post',
		input: postSchema
	})}
>
	<input {...createPost.fields.title.as('text')} />
	<textarea {...createPost.fields.content.as('text')}></textarea>
	<button>Publish</button>
</form>
```

<FormDemo />
