import type { ToolSchema } from '#lib/core/schema.js';
import {
	remoteArg,
	withoutToArg,
	type RemoteCallable,
	type RemoteToolOptions
} from '#lib/kit/bridge.js';
import { resolveOptions, tool, type MaybeGetter, type Tool } from '#lib/tool.svelte.js';

/**
 * Expose a remote `command` as a tool. The input schema is checked on the
 * client for the agent's benefit; the server validates again. Because the
 * real command runs, single-flight refreshes keep working.
 *
 * ```ts
 * commandTool(addTodo, { name: 'add_todo', description: 'Add a todo', input: addTodoSchema });
 * ```
 */
export function commandTool<S extends ToolSchema | undefined, Arg, Out>(
	command: RemoteCallable<Arg, Out>,
	options: MaybeGetter<RemoteToolOptions<S, Arg>>
): Tool<S, Out> {
	return tool<S, Out>(() => {
		const current = resolveOptions(options);
		return {
			...withoutToArg(current),
			execute: (input) => command(remoteArg(current, input) as Arg)
		};
	});
}
