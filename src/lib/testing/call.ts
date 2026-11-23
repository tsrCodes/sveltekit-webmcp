import { executeByName, getModelContext, listTools } from '#lib/core/model-context.js';
import { fromWire, type ToolResult } from '#lib/core/result.js';

export interface CallToolOptions {
	signal?: AbortSignal;
	/** How long to wait for the tool to be registered first. Default 2000 ms. */
	timeout?: number;
}

const DEFAULT_WAIT_MS = 2_000;

/** A tool result as tests see it: `isError` is always a boolean. */
export interface TestToolResult extends ToolResult {
	isError: boolean;
}

/** Make `isError` explicit so tests can assert `toBe(false)`. */
export function withErrorFlag(result: ToolResult): TestToolResult {
	return { ...result, isError: result.isError === true };
}

/**
 * Call a registered tool the way an agent would, through the page's model
 * context, and read the answer back as a result.
 */
export async function callTool(
	name: string,
	input: object = {},
	options: CallToolOptions = {}
): Promise<TestToolResult> {
	if (!getModelContext()) {
		throw new Error('No model context on the page. Call mockModelContext() first.');
	}
	// Registration is async; give a freshly rendered component a moment.
	await waitForTool(name, options.timeout ?? DEFAULT_WAIT_MS);
	const context = getModelContext();
	if (!context) throw new Error('The model context went away while waiting for the tool.');
	const raw = await executeByName(context, name, input, options.signal);
	return withErrorFlag(fromWire(raw));
}

/** Wait until a tool with this name is registered (registration is async). */
export async function waitForTool(name: string, timeout = DEFAULT_WAIT_MS): Promise<void> {
	const started = Date.now();
	while (Date.now() - started < timeout) {
		const context = getModelContext();
		const tools = context ? await listTools(context) : [];
		if (tools.some((tool) => tool.name === name)) return;
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
	throw new Error(`Tool "${name}" was not registered within ${timeout}ms`);
}
