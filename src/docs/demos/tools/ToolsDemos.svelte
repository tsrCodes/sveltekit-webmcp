<script lang="ts">
	import { Button } from '#docs/components/ui/button/index.js';
	import { Checkbox } from '#docs/components/ui/checkbox/index.js';
	import { Input } from '#docs/components/ui/input/index.js';
	import { Label } from '#docs/components/ui/label/index.js';
	import Demo from '#docs/components/Demo.svelte';
	import ToolState from '#docs/components/ToolState.svelte';
	import type { ToolsDemo } from './tools-demo.svelte.js';

	interface Props {
		demo: ToolsDemo;
		feature: 'F1' | 'F2' | 'F3' | 'F6' | 'F7' | 'F8' | 'F11' | 'F21' | 'F22';
	}

	let { demo, feature }: Props = $props();
	let draft = $state('');

	async function submitTodo(event: SubmitEvent) {
		event.preventDefault();
		const result = await demo.addTodo.call({ text: draft });
		// Keep the text on a failed call so the user can fix it.
		if (!result.isError) draft = '';
	}
</script>

<Demo>
	{#if feature === 'F1'}
		<p class="text-muted-foreground">
			{demo.addTodo.registered ? 'Agent ready' : 'Waiting for WebMCP…'}
		</p>
		<ul class="list-disc pl-5">
			{#each demo.todos as todo, index (`${index}:${todo}`)}
				<li>{todo}</li>
			{/each}
		</ul>
		<form class="grid gap-2" onsubmit={submitTodo}>
			<Label for="new-todo" class="text-muted-foreground">
				Run it locally with <code class="font-mono">addTodo.call()</code>
			</Label>
			<div class="flex gap-2">
				<Input id="new-todo" bind:value={draft} placeholder="New todo" />
				<Button type="submit">Add</Button>
			</div>
		</form>
	{:else if feature === 'F2'}
		<div class="flex flex-wrap items-center gap-3">
			<Button variant="outline" onclick={demo.toggleLang}>Language: {demo.lang}</Button>
			<span class="text-muted-foreground">
				Description sent to agents: “{demo.counter.description}”
			</span>
		</div>
		<p>Count: {demo.count}</p>
	{:else if feature === 'F3'}
		<div class="flex items-center gap-2">
			<Checkbox id="counter-enabled" bind:checked={demo.enabled} />
			<Label for="counter-enabled">Counter tool enabled</Label>
		</div>
		<p class="text-muted-foreground">registered: {demo.counter.registered}</p>
	{:else if feature === 'F6'}
		<div class="flex flex-wrap gap-2">
			<Button onclick={() => demo.addTodo.call({ text: '' })}>Call with empty text</Button>
			<Button variant="outline" onclick={() => demo.addTodo.call({ text: 'Ship v1' })}>
				Call with “Ship v1”
			</Button>
		</div>
		<ToolState tool={demo.addTodo} />
	{:else if feature === 'F7'}
		<div><Button onclick={() => demo.stats.call()}>Run docs_todo_stats</Button></div>
		<ToolState tool={demo.stats} />
	{:else if feature === 'F8'}
		<p class="text-muted-foreground">
			<code class="font-mono">docs_clear_todos</code> is consequential, so running it asks first (F9).
		</p>
		<div><Button onclick={() => demo.clearTodos.call()}>Clear todos</Button></div>
		<ToolState tool={demo.clearTodos} />
	{:else if feature === 'F11'}
		<p class="text-muted-foreground">
			This page registers <code class="font-mono">docs_add_todo</code> twice on purpose.
		</p>
		<ToolState tool={demo.duplicate} />
	{:else if feature === 'F21'}
		<div><Button onclick={() => demo.dice.call()}>Roll</Button></div>
		<ToolState tool={demo.dice} />
	{:else if feature === 'F22'}
		<div><Button onclick={() => demo.comments.call()}>Read comments</Button></div>
		<p class="text-muted-foreground">Check the browser console for the warning.</p>
		<ToolState tool={demo.comments} />
	{/if}
</Demo>
