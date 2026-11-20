import type { ToolHints } from '#lib/core/annotations.js';
import { devWarn } from '#lib/core/dev.js';
import type { Limiter } from '#lib/core/limit.js';
import {
	errorMessage,
	errorResult,
	findInvisibleChars,
	normalizeResult,
	resultText,
	type ToolResult
} from '#lib/core/result.js';
import { formatIssues, validate, type ToolSchema } from '#lib/core/schema.js';

/** What `confirm` receives before a consequential tool runs. */
export interface ConfirmRequest {
	toolName: string;
	description: string;
	input: unknown;
}

export type ConfirmHandler = (request: ConfirmRequest) => boolean | Promise<boolean>;

/** Second argument of every `execute` callback. */
export interface ExecuteContext {
	/** Aborts when the agent cancels the call or the tool unmounts. */
	signal: AbortSignal;
	/** The element the tool is attached to, for attachment-based tools. */
	element?: Element;
}

export interface RunPlan {
	/** Full tool name, prefix included. */
	name: string;
	description: string;
	input?: ToolSchema;
	output?: ToolSchema;
	hints: ToolHints;
	limiter?: Limiter;
	confirm?: ConfirmHandler;
	element?: Element;
	execute: (input: never, context: ExecuteContext) => unknown;
}

export const MESSAGES = {
	declined: 'User declined',
	cancelled: 'Cancelled',
	rateLimited: (seconds: number) => `Rate limited. Try again in ${seconds}s.`,
	invalidInput: (details: string) => `Invalid input:\n${details}`
} as const;

function defaultConfirm(request: ConfirmRequest): boolean {
	if (typeof window === 'undefined' || typeof window.confirm !== 'function') return false;
	const input = JSON.stringify(request.input, null, 2);
	return window.confirm(
		`Allow the AI agent to run "${request.toolName}"?\n\n${request.description}\n\nInput:\n${input}`
	);
}

async function checkOutput(plan: RunPlan, result: ToolResult): Promise<void> {
	if (!plan.output || result.isError) return;
	const checked = await validate(plan.output, result.structuredContent ?? resultText(result));
	if (!checked.success) {
		devWarn(
			`Tool "${plan.name}" returned a value that does not match its output schema:\n${formatIssues(checked.issues)}`
		);
	}
}

function checkUntrusted(plan: RunPlan, result: ToolResult): void {
	if (!plan.hints.untrusted) return;
	const found = findInvisibleChars(resultText(result));
	if (found.length > 0) {
		devWarn(
			`Tool "${plan.name}" returned invisible Unicode characters (${found.join(', ')}). ` +
				'They can hide instructions from users; consider stripping them.'
		);
	}
}

async function guard(plan: RunPlan, input: unknown): Promise<ToolResult | { input: unknown }> {
	if (plan.limiter && !plan.limiter.take()) {
		return errorResult(MESSAGES.rateLimited(Math.ceil(plan.limiter.retryAfter() / 1000)));
	}
	const checked = await validate(plan.input, input ?? {});
	if (!checked.success) return errorResult(MESSAGES.invalidInput(formatIssues(checked.issues)));
	if (plan.hints.consequential) {
		const request = { toolName: plan.name, description: plan.description, input: checked.value };
		const allowed = await (plan.confirm ?? defaultConfirm)(request);
		if (!allowed) return errorResult(MESSAGES.declined);
	}
	return { input: checked.value };
}

/**
 * The single path every call takes, from an agent or from `tool.call()`:
 * rate limit, input validation, confirmation, execute, normalise, checks.
 * Never throws; failures come back as `isError` results the agent can read.
 */
export async function runTool(
	plan: RunPlan,
	rawInput: unknown,
	signal: AbortSignal
): Promise<ToolResult> {
	try {
		const guarded = await guard(plan, rawInput);
		if (!('input' in guarded)) return guarded;
		if (signal.aborted) return errorResult(MESSAGES.cancelled);
		const execute = plan.execute as (input: unknown, context: ExecuteContext) => unknown;
		const context: ExecuteContext = plan.element ? { signal, element: plan.element } : { signal };
		const value = await execute(guarded.input, context);
		if (signal.aborted) return errorResult(MESSAGES.cancelled);
		const result = normalizeResult(value, plan.output !== undefined);
		await checkOutput(plan, result);
		checkUntrusted(plan, result);
		return result;
	} catch (error) {
		if (signal.aborted) return errorResult(MESSAGES.cancelled);
		return errorResult(errorMessage(error));
	}
}
