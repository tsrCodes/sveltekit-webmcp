import type { ToolSchema } from '#lib/core/schema.js';
import {
	remoteArg,
	withoutToArg,
	type RemoteCallable,
	type RemoteToolOptions
} from '#lib/kit/bridge.js';
import { resolveOptions, tool, type MaybeGetter, type Tool } from '#lib/tool.svelte.js';

/**
 * Expose a remote `query` (or `query.batch`) as a read-only tool. The tool
 * returns the awaited query value.
 *
 * ```ts
 * queryTool(getPost, { name: 'get_post', description: 'Read a post', input: slugSchema, toArg: ({ slug }) => slug });
 * ```
 */
export function queryTool<S extends ToolSchema | undefined, Arg, Out>(
	query: RemoteCallable<Arg, Out>,
	options: MaybeGetter<RemoteToolOptions<S, Arg>>
): Tool<S, Out> {
	return tool<S, Out>(() => {
		const current = resolveOptions(options);
		return {
			readOnly: true,
			...withoutToArg(current),
			execute: async (input) => await query(remoteArg(current, input) as Arg)
		};
	});
}
