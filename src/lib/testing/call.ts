import { executeByName, getModelContext } from '#lib/core/model-context.js';
import { fromWire, type ToolResult } from '#lib/core/result.js';

export interface CallToolOptions {
	signal?: AbortSignal;
}

/**
 * Call a registered tool the way an agent would, through
 * `document.modelContext`, and read the answer back as a `ToolResult`.
 */
export async function callTool(
	name: string,
	input: object = {},
	options: CallToolOptions = {}
): Promise<ToolResult> {
	const context = getModelContext();
	if (!context) throw new Error('No document.modelContext. Call mockModelContext() first.');
	const raw = await executeByName(context, name, input, options.signal);
	return fromWire(raw);
}

/** Wait until a tool with this name is registered (registration is async). */
export async function waitForTool(name: string, timeout = 2_000): Promise<void> {
	const started = Date.now();
	while (Date.now() - started < timeout) {
		const context = getModelContext();
		const tools = context ? await context.getTools() : [];
		if (tools.some((tool) => tool.name === name)) return;
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
	throw new Error(`Tool "${name}" was not registered within ${timeout}ms`);
}
