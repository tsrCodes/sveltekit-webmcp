import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import * as z from 'zod';
import { commandTool, navigateTool, queryTool, searchTool } from '#lib/kit/index.js';
import type { RemoteFormLike } from '#lib/kit/index.js';
import { setWebMCP } from '#lib/index.js';
import {
	callTool,
	mockModelContext,
	waitForTool,
	type MockModelContext
} from '#lib/testing/index.js';
import FormHost from './fixtures/FormHost.svelte';
import Setup from './fixtures/Setup.svelte';

let ctx: MockModelContext;

beforeEach(() => {
	ctx = mockModelContext();
});

afterEach(() => ctx.restore());

const annotationsOf = async (name: string) =>
	(await ctx.getTools()).find((tool) => tool.name === name)?.annotations;

describe('commandTool()', () => {
	it('calls the remote command with the validated input', async () => {
		const addTodo = vi.fn(async (input: { text: string }) => ({ id: 1, ...input }));
		render(Setup, {
			setup: () => {
				setWebMCP({ confirm: () => true });
				commandTool(addTodo, {
					name: 'add_todo',
					description: 'Add a todo',
					input: z.object({ text: z.string() }),
					consequential: true
				});
			}
		});
		await waitForTool('add_todo');
		expect(await annotationsOf('add_todo')).toEqual({ consequentialHint: true });
		const result = await callTool('add_todo', { text: 'milk' });
		expect(result.content[0].text).toBe('{"id":1,"text":"milk"}');
		expect(addTodo).toHaveBeenCalledWith({ text: 'milk' });
		expect((await callTool('add_todo', { text: 1 })).isError).toBe(true);
	});

	it('maps input to a plain argument with toArg', async () => {
		const like = vi.fn(async (id: string) => `liked ${id}`);
		render(Setup, {
			setup: () =>
				commandTool(like, {
					name: 'like',
					description: 'Like',
					input: z.object({ id: z.string() }),
					toArg: ({ id }) => id
				})
		});
		await waitForTool('like');
		expect((await callTool('like', { id: 'a' })).content[0].text).toBe('liked a');
	});
});

describe('queryTool()', () => {
	it('is read-only and returns the awaited query value', async () => {
		const getCount = vi.fn(() => Promise.resolve(3));
		render(Setup, {
			setup: () => queryTool(getCount, { name: 'count', description: 'Count todos' })
		});
		await waitForTool('count');
		expect(await annotationsOf('count')).toEqual({ readOnlyHint: true });
		expect((await callTool('count')).content[0].text).toBe('3');
		expect(getCount).toHaveBeenCalledWith(undefined);
	});
});

describe('formTool()', () => {
	function fakeForm(outcome: { ok: boolean; issues?: { message: string; path: string[] }[] }) {
		let filled: unknown;
		const form: RemoteFormLike & { filled: () => unknown } = {
			fields: {
				set: (value: never) => {
					filled = value;
				},
				allIssues: () => outcome.issues
			},
			submit: async () => outcome.ok,
			result: outcome.ok ? { slug: 'hello' } : undefined,
			filled: () => filled
		};
		return form;
	}

	it('fills, submits and returns the form result', async () => {
		const form = fakeForm({ ok: true });
		const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
		render(FormHost, { form, options: { name: 'create_post', description: 'Write a post' } });
		await waitForTool('create_post');
		expect(await annotationsOf('create_post')).toEqual({ consequentialHint: true });
		const result = await callTool('create_post', { title: 'Hello' });
		expect(result.content[0].text).toBe('{"slug":"hello"}');
		expect(form.filled()).toEqual({ title: 'Hello' });
		expect(confirm).toHaveBeenCalled();
		confirm.mockRestore();
	});

	it('returns field issues so the agent can retry', async () => {
		const form = fakeForm({ ok: false, issues: [{ message: 'Too short', path: ['title'] }] });
		render(FormHost, {
			form,
			options: { name: 'create_post', description: 'Write a post', consequential: false }
		});
		await waitForTool('create_post');
		const result = await callTool('create_post', { title: 'x' });
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('title: Too short');
	});

	it('reports a server rejection without issues', async () => {
		const form = fakeForm({ ok: false });
		render(FormHost, {
			form,
			options: { name: 'create_post', description: 'Write a post', consequential: false }
		});
		await waitForTool('create_post');
		expect((await callTool('create_post', {})).content[0].text).toContain('rejected');
	});
});

describe('navigateTool()', () => {
	it('only goes to allowed routes, with params filled in', async () => {
		const navigate = vi.fn(async () => {});
		render(Setup, {
			setup: () =>
				navigateTool({
					routes: { '/': { description: 'Home' }, '/blog/[slug]': { description: 'A post' } },
					resolvePath: (route, params) => route.replace('[slug]', params.slug ?? ''),
					navigate
				})
		});
		await waitForTool('navigate');
		const [listed] = await ctx.getTools();
		expect(JSON.stringify(listed.inputSchema)).toContain('/blog/[slug] (params: slug): A post');
		expect((await callTool('navigate', { route: '/admin' })).isError).toBe(true);
		expect((await callTool('navigate', { route: '/blog/[slug]' })).content[0].text).toContain(
			'Missing params'
		);
		const ok = await callTool('navigate', { route: '/blog/[slug]', params: { slug: 'hi' } });
		expect(ok.content[0].text).toBe('Navigated to /blog/hi');
		expect(navigate).toHaveBeenCalledWith('/blog/hi');
	});
});

describe('searchTool()', () => {
	it('wraps a search callback with a { query, limit } schema', async () => {
		const search = vi.fn(async ({ query }: { query: string }) => [`result for ${query}`]);
		render(Setup, { setup: () => searchTool({ search, maxLimit: 5 }) });
		await waitForTool('search');
		const [listed] = await ctx.getTools();
		expect(listed.inputSchema).toMatchObject({ properties: { limit: { maximum: 5 } } });
		expect((await callTool('search', { query: 'svelte' })).content[0].text).toBe(
			'["result for svelte"]'
		);
		expect((await callTool('search', { query: 'x', limit: 50 })).isError).toBe(true);
		expect(search).toHaveBeenCalledTimes(1);
	});
});
