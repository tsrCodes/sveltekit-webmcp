<script lang="ts">
	import { commandTool, formTool, queryTool } from '#lib/kit/index.js';
	import { addTodo, createPost, getTodos } from '../../../demo/demo.remote.js';
	import { addTodoSchema, postSchema } from '../../../demo/schemas.js';
	import Code from '../../../docs/Code.svelte';
	import Section from '../../../docs/Section.svelte';
	import ToolState from '../../../docs/ToolState.svelte';

	const addTodoTool = commandTool(addTodo, {
		name: 'docs_remote_add_todo',
		description: 'Add a todo on the server',
		input: addTodoSchema,
		consequential: true
	});

	const listTodosTool = queryTool(getTodos, {
		name: 'docs_remote_list_todos',
		description: 'List the todos stored on the server'
	});

	const post = createPost.preflight(postSchema);
</script>

<svelte:head><title>Remote functions · sveltekit-webmcp</title></svelte:head>

<h1>Remote functions</h1>
<p>
	These tools call real SvelteKit remote functions. Schemas live in a shared module, because Kit
	does not allow exporting them from a <code>.remote.ts</code> file.
</p>

<Section feature="F13" title="commandTool()">
	<p>
		The schema is checked on the client for the agent's benefit; the server validates again. Because
		the real command runs, single-flight refreshes keep working: the list below updates after each
		call.
	</p>
	<Code
		code={`// todos.schema.ts
export const addTodoSchema = z.object({ text: z.string().min(1) });

// todos.remote.ts
export const addTodo = command(addTodoSchema, async ({ text }) => { /* db */ });

// +page.svelte
commandTool(addTodo, {
  name: 'add_todo',
  description: 'Add a todo',
  input: addTodoSchema,
  consequential: true
});`}
	/>
	{#snippet demo()}
		<button type="button" onclick={() => addTodoTool.call({ text: `Todo #${Date.now() % 1000}` })}
			>Add a todo through the tool</button
		>
		<ToolState tool={addTodoTool} />
		<svelte:boundary>
			<ul>
				{#each await getTodos() as todo (todo.id)}
					<li>{todo.text}</li>
				{/each}
			</ul>
			{#snippet pending()}<p class="note">Loading todos…</p>{/snippet}
		</svelte:boundary>
	{/snippet}
</Section>

<Section feature="F14" title="queryTool()">
	<p>
		Same shape, read-only by default, returns the awaited query value. Works with
		<code>query.batch</code> too. Use <code>toArg</code> for queries that take a plain value.
	</p>
	<Code code={`queryTool(getTodos, { name: 'list_todos', description: 'List todos' });`} />
	{#snippet demo()}
		<button type="button" onclick={() => listTodosTool.call()}>Run the query tool</button>
		<ToolState tool={listTodosTool} />
	{/snippet}
</Section>

<Section feature="F15" title="formTool()">
	<p>
		An attachment on the form. When the agent calls it, the fields are filled (the user sees it
		happen), the form is submitted through the element, and the tool returns <code>result</code>, or
		the field issues as an <code>isError</code> result so the agent can fix them and retry. Consequential
		by default.
	</p>
	<Code
		lang="svelte"
		code={`<form {...createPost} {@attach formTool(createPost, {
  name: 'create_post',
  description: 'Write and publish a blog post',
  input: postSchema
})}>
  <input {...createPost.fields.title.as('text')} />
  <textarea {...createPost.fields.content.as('text')}></textarea>
  <button>Publish</button>
</form>`}
	/>
	{#snippet demo()}
		<form
			class="stack"
			{...post}
			{@attach formTool(post, {
				name: 'docs_create_post',
				description: 'Write and publish a demo blog post',
				input: postSchema
			})}
		>
			<label class="stack">
				Title
				<input {...post.fields.title.as('text')} />
			</label>
			{#each post.fields.title.issues() ?? [] as issue (issue.message)}
				<p class="issue">{issue.message}</p>
			{/each}
			<label class="stack">
				Content
				<textarea rows="3" {...post.fields.content.as('text')}></textarea>
			</label>
			{#each post.fields.content.issues() ?? [] as issue (issue.message)}
				<p class="issue">{issue.message}</p>
			{/each}
			<div class="row">
				<button disabled={!!post.pending}>Publish</button>
				{#if post.result}
					<span class="note" aria-live="polite">Published “{post.result.title}”</span>
				{/if}
			</div>
		</form>
	{/snippet}
</Section>

<style>
	.issue {
		color: var(--danger);
		margin: 0;
		font-size: 0.9rem;
	}
</style>
