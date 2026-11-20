import { toSpecAnnotations, type ToolHints } from '#lib/core/annotations.js';
import type { ModelContextLike, SpecTool } from '#lib/core/model-context.js';
import { toJsonSchema, type ToolSchema } from '#lib/core/schema.js';

/** The parts of a tool that agents see. A change here means re-registering. */
export interface ToolShape {
	name: string;
	title?: string;
	description: string;
	input?: ToolSchema;
	output?: ToolSchema;
	hints?: ToolHints;
}

/** A tool shape converted to the spec field names, minus `execute`. */
export type SpecDescriptor = Omit<SpecTool, 'execute'>;

const NAME_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;

/** Throws a `TypeError` when `name` breaks the draft's naming rule. */
export function assertToolName(name: string): void {
	if (!NAME_PATTERN.test(name)) {
		throw new TypeError(
			`Invalid tool name "${name}": use 1-128 ASCII letters, digits, "_", "-" or "."`
		);
	}
}

/** Convert a tool shape into the descriptor sent to `registerTool`. */
export function describeTool(shape: ToolShape, prefix = ''): SpecDescriptor {
	const descriptor: SpecDescriptor = {
		name: `${prefix}${shape.name}`,
		description: shape.description
	};
	const inputSchema = toJsonSchema(shape.input, 'input');
	const outputSchema = toJsonSchema(shape.output, 'output');
	const annotations = toSpecAnnotations(shape.hints ?? {});
	return {
		...descriptor,
		...(shape.title !== undefined && { title: shape.title }),
		...(inputSchema !== undefined && { inputSchema }),
		...(outputSchema !== undefined && { outputSchema }),
		...(annotations !== undefined && { annotations })
	};
}

/**
 * Stable key for a descriptor. Two descriptors with the same key register the
 * same tool, so reactive option getters only re-register when this changes.
 */
export function shapeKey(descriptor: SpecDescriptor): string {
	return JSON.stringify([
		descriptor.name,
		descriptor.title ?? null,
		descriptor.description,
		descriptor.inputSchema ?? null,
		descriptor.outputSchema ?? null,
		descriptor.annotations ?? null
	]);
}

export type SpecExecute = (input: Record<string, unknown>, signal: AbortSignal) => Promise<unknown>;

export interface RegisterOptions {
	/** Aborting this signal unregisters the tool. */
	signal: AbortSignal;
	exposedTo?: string[];
}

/**
 * Register a descriptor with the model context. The returned promise
 * rejects with the browser's error (duplicate name, blocked by policy, bad
 * schema) so callers can surface it.
 */
export async function registerSpecTool(
	context: ModelContextLike,
	descriptor: SpecDescriptor,
	execute: SpecExecute,
	options: RegisterOptions
): Promise<void> {
	assertToolName(descriptor.name);
	const tool: SpecTool = {
		...descriptor,
		execute: (input, { signal }) => execute((input ?? {}) as Record<string, unknown>, signal)
	};
	const exposedTo = options.exposedTo?.length ? { exposedTo: options.exposedTo } : {};
	await context.registerTool(tool, { signal: options.signal, ...exposedTo });
}
