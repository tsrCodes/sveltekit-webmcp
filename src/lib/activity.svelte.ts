import type { ToolResult } from '#lib/core/result.js';

/** One finished tool call, as shown in devtools. */
export interface ToolCall {
	id: number;
	toolName: string;
	input: unknown;
	result: ToolResult;
	startedAt: number;
	durationMs: number;
}

const MAX_CALLS = 50;

let calls = $state.raw<ToolCall[]>([]);
let nextId = 1;

/** Record a call. Browser only; the server keeps nothing. */
export function recordCall(call: Omit<ToolCall, 'id'>): void {
	if (typeof document === 'undefined') return;
	calls = [{ ...call, id: nextId++ }, ...calls].slice(0, MAX_CALLS);
}

/** Recent calls in this page, newest first. Reactive. */
export const toolActivity = {
	get calls(): readonly ToolCall[] {
		return calls;
	},
	clear(): void {
		calls = [];
	}
};
