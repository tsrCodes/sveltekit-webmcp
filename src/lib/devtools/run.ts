import { executeByName, getModelContext } from '#lib/core/model-context.js';
import { errorMessage, errorResult, fromWire, type ToolResult } from '#lib/core/result.js';

/** Parse the JSON typed into the devtools input box. Empty means `{}`. */
export function parseInput(
	text: string
): { ok: true; value: object } | { ok: false; error: string } {
	const trimmed = text.trim();
	if (trimmed === '') return { ok: true, value: {} };
	try {
		const value: unknown = JSON.parse(trimmed);
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			return { ok: false, error: 'Input must be a JSON object' };
		}
		return { ok: true, value };
	} catch (error) {
		return { ok: false, error: errorMessage(error) };
	}
}

/** Fire a tool the way an agent would, through the model context. */
export async function fireTool(name: string, inputText: string): Promise<ToolResult> {
	const parsed = parseInput(inputText);
	if (!parsed.ok) return errorResult(parsed.error);
	const context = getModelContext();
	if (!context) return errorResult('WebMCP is not available on this page');
	try {
		return fromWire(await executeByName(context, name, parsed.value));
	} catch (error) {
		return errorResult(errorMessage(error));
	}
}

/** A schema as compact, readable JSON for display. */
export function prettyJson(value: unknown): string {
	return value === undefined ? '' : JSON.stringify(value, null, 2);
}
