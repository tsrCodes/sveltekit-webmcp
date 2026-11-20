import type { Attachment } from 'svelte/attachments';
import { getWebMCP } from '#lib/context.js';
import type { ToolSchema } from '#lib/core/schema.js';
import { Tool, type MaybeGetter, type ToolOptions } from '#lib/tool.svelte.js';

/**
 * Tie a tool to an element: registered while the element is rendered,
 * unregistered when `{#if}` or `{#each}` removes it. `execute` receives the
 * element as `context.element`.
 *
 * ```svelte
 * <button {@attach attachTool(() => ({ name: 'open', description: 'Open it', execute: () => open() }))}>
 * ```
 */
export function attachTool<S extends ToolSchema | undefined = undefined, R = unknown>(
	options: MaybeGetter<ToolOptions<S, R>>,
	onTool?: (tool: Tool<S, R>) => void
): Attachment<Element> {
	const config = getWebMCP();
	return (element) => {
		const instance = new Tool(options, config);
		onTool?.(instance);
		instance.bind(element);
	};
}
