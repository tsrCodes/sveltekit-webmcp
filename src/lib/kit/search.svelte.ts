import type { JsonSchema } from '#lib/core/schema.js';
import { tool, type Tool, type ToolOptions } from '#lib/tool.svelte.js';

export interface SearchInput {
	query: string;
	limit?: number;
}

export interface SearchToolOptions<Out> extends Partial<
	Omit<ToolOptions<undefined>, 'execute' | 'input'>
> {
	/**
	 * Run the search. A plain function or a remote `query` both work:
	 * `search: (input) => searchPosts(input)`.
	 */
	search: (input: SearchInput, signal: AbortSignal) => Out | PromiseLike<Out>;
	/** Largest `limit` the agent may ask for. Default 20. */
	maxLimit?: number;
}

export const DEFAULT_SEARCH_LIMIT = 20;

export function searchSchema(maxLimit = DEFAULT_SEARCH_LIMIT): JsonSchema {
	return {
		type: 'object',
		properties: {
			query: { type: 'string', minLength: 1, description: 'What to search for' },
			limit: {
				type: 'integer',
				minimum: 1,
				maximum: maxLimit,
				description: `How many results to return (1-${maxLimit})`
			}
		},
		required: ['query'],
		additionalProperties: false
	};
}

/**
 * Site search as a tool, with input `{ query, limit? }`. Read-only; results
 * often contain user-written text, so pass `untrusted: true` when they do.
 *
 * ```ts
 * searchTool({ description: 'Search blog posts', search: ({ query }) => searchPosts(query) });
 * ```
 */
export function searchTool<Out>(options: SearchToolOptions<Out>): Tool<JsonSchema, Out> {
	const { search, maxLimit, ...rest } = options;
	return tool<JsonSchema, Out>(() => ({
		name: 'search',
		description: 'Search this site',
		readOnly: true,
		...rest,
		input: searchSchema(maxLimit),
		execute: async (input, { signal }) => await search(input as unknown as SearchInput, signal)
	}));
}
