<script lang="ts">
	import { formTool } from '#lib/kit/index.js';
	import { createPost } from '../../demo/demo.remote.js';
	import { postSchema } from '../../demo/schemas.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import { Input } from '#docs/components/ui/input/index.js';
	import { Label } from '#docs/components/ui/label/index.js';
	import { Textarea } from '#docs/components/ui/textarea/index.js';
	import Demo from '#docs/components/Demo.svelte';

	const post = createPost.preflight(postSchema);
</script>

{#snippet issues(list: { message: string }[] | undefined)}
	{#each list ?? [] as issue (issue.message)}
		<p class="text-destructive">{issue.message}</p>
	{/each}
{/snippet}

<Demo>
	<form
		class="grid gap-3"
		{...post}
		{@attach formTool(post, {
			name: 'docs_create_post',
			description: 'Write and publish a demo blog post',
			input: postSchema
		})}
	>
		<div class="grid gap-1.5">
			<Label for="post-title">Title</Label>
			<Input id="post-title" {...post.fields.title.as('text')} />
			{@render issues(post.fields.title.issues())}
		</div>
		<div class="grid gap-1.5">
			<Label for="post-content">Content</Label>
			<Textarea id="post-content" rows={3} {...post.fields.content.as('text')} />
			{@render issues(post.fields.content.issues())}
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<Button type="submit" disabled={!!post.pending}>Publish</Button>
			{#if post.result}
				<span class="text-muted-foreground" aria-live="polite">
					Published “{post.result.title}”
				</span>
			{/if}
		</div>
	</form>
</Demo>
