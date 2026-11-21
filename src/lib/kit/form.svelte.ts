import { tick } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { getWebMCP } from '#lib/context.js';
import { errorResult } from '#lib/core/result.js';
import { formatIssues, type SchemaIssue, type ToolSchema } from '#lib/core/schema.js';
import { resolveOptions, Tool, type MaybeGetter, type ToolOptions } from '#lib/tool.svelte.js';

/** The parts of a SvelteKit remote `form` this tool needs. */
export interface RemoteFormLike {
	fields: {
		set(value: never): void;
		allIssues(): readonly SchemaIssue[] | undefined;
	};
	submit(): PromiseLike<boolean>;
	readonly result: unknown;
}

export type FormToolOptions<S extends ToolSchema | undefined> = Omit<ToolOptions<S>, 'execute'>;

export const FORM_MESSAGES = {
	submitted: 'Submitted',
	invalid: (details: string) =>
		`The form was not submitted. Fix these fields and try again:\n${details}`
} as const;

/**
 * Fill the form with the agent's input, let the user see it, submit it
 * through the attached form element, then report the result or the
 * field issues so the agent can fix them and retry.
 */
export async function submitRemoteForm(form: RemoteFormLike, input: unknown) {
	form.fields.set(input as never);
	await tick();
	const ok = await form.submit();
	const issues = form.fields.allIssues() ?? [];
	if (!ok || issues.length > 0) {
		const details = issues.length > 0 ? formatIssues(issues) : 'The server rejected the input.';
		return errorResult(FORM_MESSAGES.invalid(details));
	}
	return form.result ?? FORM_MESSAGES.submitted;
}

/**
 * Turn a remote `form` into a tool, as an attachment on its `<form>`.
 * Consequential by default: the user is asked before the agent submits.
 *
 * ```svelte
 * <form {...createPost} {@attach formTool(createPost, { name: 'create_post', description: 'Publish a post', input: postSchema })}>
 * ```
 */
export function formTool<S extends ToolSchema | undefined>(
	form: RemoteFormLike,
	options: MaybeGetter<FormToolOptions<S>>,
	onTool?: (tool: Tool<S>) => void
): Attachment<HTMLFormElement> {
	const config = getWebMCP();
	return (element) => {
		const instance = new Tool<S>(
			() => ({
				consequential: true,
				...resolveOptions(options),
				execute: (input) => submitRemoteForm(form, input)
			}),
			config
		);
		onTool?.(instance);
		instance.bind(element);
	};
}
