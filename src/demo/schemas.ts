// Shared schemas. SvelteKit does not allow exporting them from a .remote.ts
// file, so the remote functions and the tools both import them from here.
import * as z from 'zod';

export const addTodoSchema = z.object({
	text: z.string().trim().min(1).max(120).describe('What to do')
});

export const searchTodosSchema = z.object({
	query: z.string().min(1).max(60),
	limit: z.number().int().min(1).max(20).default(5)
});

export const postSchema = z.object({
	title: z.string().trim().min(3, 'Title needs at least 3 characters').max(80),
	content: z.string().trim().min(10, 'Write at least 10 characters').max(2000)
});
