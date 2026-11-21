import type { InferSchemaOutput, ToolSchema } from '#lib/core/schema.js';
import type { ToolOptions } from '#lib/tool.svelte.js';

/** A remote `command` or `query` as seen from the client: call it, await it. */
export type RemoteCallable<Arg = never, Out = unknown> = (arg: Arg) => PromiseLike<Out>;

/** Options for tools that wrap a remote function. `execute` is provided for you. */
export interface RemoteToolOptions<S extends ToolSchema | undefined, Arg = unknown> extends Omit<
	ToolOptions<S>,
	'execute'
> {
	/**
	 * Turn the agent's input object into the remote function's argument.
	 * Default: the validated input as-is, or no argument when the tool has no
	 * input schema. Use it for remote functions that take a plain value,
	 * e.g. `toArg: ({ slug }) => slug`.
	 */
	toArg?: (input: InferSchemaOutput<S>) => Arg;
}

/** The argument to pass to the remote function for this input. */
export function remoteArg<S extends ToolSchema | undefined, Arg>(
	options: RemoteToolOptions<S, Arg>,
	input: InferSchemaOutput<S>
): Arg | undefined {
	if (options.toArg) return options.toArg(input);
	return options.input === undefined ? undefined : (input as Arg);
}

/** Split remote options into tool options without `toArg`. */
export function withoutToArg<S extends ToolSchema | undefined, Arg>(
	options: RemoteToolOptions<S, Arg>
): Omit<RemoteToolOptions<S, Arg>, 'toArg'> {
	const { toArg: _toArg, ...rest } = options;
	void _toArg;
	return rest;
}
