import { untrack } from 'svelte';
import { recordCall } from '#lib/activity.svelte.js';
import { getWebMCP, type WebMCPConfig } from '#lib/context.js';
import type { ToolHints } from '#lib/core/annotations.js';
import { devWarn } from '#lib/core/dev.js';
import { createLimiter, type Limiter, type RateLimit } from '#lib/core/limit.js';
import { onToolCancel } from '#lib/core/model-context.js';
import { describeTool, registerSpecTool, shapeKey } from '#lib/core/register.js';
import { toWire, type ToolResult } from '#lib/core/result.js';
import { runTool, type ExecuteContext, type RunPlan } from '#lib/core/run.js';
import { lacksJsonSchema, type InferSchemaOutput, type ToolSchema } from '#lib/core/schema.js';
import { ready } from '#lib/support.svelte.js';

/** Options for `tool()` and `attachTool()`. */
export interface ToolOptions<
	S extends ToolSchema | undefined = undefined,
	R = unknown
> extends ToolHints {
	/** 1-128 characters: letters, digits, `_`, `-`, `.`. The app prefix is added in front. */
	name: string;
	title?: string;
	/** What the tool does, written for the agent. */
	description: string;
	/** Input schema. Input is validated before `execute` runs. */
	input?: S;
	/** Output schema. Sent to agents and checked in development. */
	output?: ToolSchema;
	/** `false` unregisters the tool. Default `true`. */
	enabled?: boolean;
	/** Client-side rate limit, e.g. `{ calls: 10, per: '1m' }`. */
	limit?: RateLimit;
	/** Origins allowed to call this tool across frames. Overrides the app setting. */
	exposedTo?: string[];
	execute: (input: InferSchemaOutput<S>, context: ExecuteContext) => R | PromiseLike<R>;
}

/** Options as a plain object or a getter. A getter is tracked. */
export type MaybeGetter<T> = T | (() => T);

/** Read options given as an object or a getter. */
export function resolveOptions<T>(source: MaybeGetter<T>): T {
	return typeof source === 'function' ? (source as () => T)() : source;
}

function asError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}

/**
 * A registered tool with reactive run state. Create it with `tool()` or
 * `attachTool()`; you rarely construct it yourself.
 */
export class Tool<S extends ToolSchema | undefined = undefined, R = unknown> {
	/** `true` while the browser has the tool. */
	registered = $state(false);
	/** `true` while a call is in flight. */
	running = $state(false);
	/** Last registration or execution error. */
	error = $state<Error | undefined>(undefined);
	/** Number of finished calls. */
	callCount = $state(0);
	lastResult = $state.raw<ToolResult | undefined>(undefined);
	lastInput = $state.raw<unknown>(undefined);

	#source: MaybeGetter<ToolOptions<S, R>>;
	#config: WebMCPConfig;
	#options = $derived.by(() => resolveOptions(this.#source));
	#descriptor = $derived.by(() =>
		describeTool({ ...this.#options, hints: this.#options }, this.#config.prefix)
	);
	#limiter = $derived<Limiter | undefined>(
		this.#options.limit ? createLimiter(this.#options.limit) : undefined
	);
	#element: Element | undefined;
	// Bookkeeping only; never read in a reactive context.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#executions = new Set<AbortController>();

	/** Stable key of the agent-visible shape; re-registration happens when it changes. */
	readonly key = $derived(shapeKey(this.#descriptor));
	readonly enabled = $derived(this.#options.enabled !== false);

	constructor(source: MaybeGetter<ToolOptions<S, R>>, config: WebMCPConfig = {}) {
		this.#source = source;
		this.#config = config;
	}

	/** Full tool name, prefix included. */
	get name(): string {
		return this.#descriptor.name;
	}

	get description(): string {
		return this.#descriptor.description;
	}

	#plan(): RunPlan {
		const options = untrack(() => this.#options);
		return {
			name: this.name,
			description: options.description,
			input: options.input,
			output: options.output,
			hints: options,
			limiter: untrack(() => this.#limiter),
			confirm: this.#config.confirm,
			element: this.#element,
			execute: options.execute
		};
	}

	async #run(input: unknown, signal: AbortSignal): Promise<ToolResult> {
		const controller = new AbortController();
		this.#executions.add(controller);
		this.running = true;
		this.lastInput = input;
		const startedAt = Date.now();
		try {
			const plan = this.#plan();
			const result = await runTool(plan, input, AbortSignal.any([signal, controller.signal]));
			recordCall({
				toolName: plan.name,
				input,
				result,
				startedAt,
				durationMs: Date.now() - startedAt
			});
			this.lastResult = result;
			this.callCount += 1;
			if (result.isError) this.#report(new Error(result.content[0]?.text ?? 'Tool failed'));
			else this.error = undefined;
			return result;
		} finally {
			this.#executions.delete(controller);
			this.running = this.#executions.size > 0;
		}
	}

	#report(error: Error): void {
		this.error = error;
		this.#config.onError?.(error, this.name);
	}

	/** Run the tool locally through the same validation path agents use. */
	call(input: unknown = {}, signal: AbortSignal = new AbortController().signal) {
		return this.#run(input, signal);
	}

	/** Abort every call in flight (agent cancel, unmount). */
	cancel(): void {
		for (const controller of this.#executions) controller.abort();
	}

	/**
	 * Register with the browser and return a cleanup that unregisters. Called
	 * from an effect or attachment; reads nothing reactive.
	 */
	connect(element?: Element): () => void {
		this.#element = element;
		const registration = new AbortController();
		const descriptor = untrack(() => this.#descriptor);
		const exposedTo = untrack(() => this.#options.exposedTo) ?? this.#config.exposedTo;
		const input = untrack(() => this.#options.input);
		if (lacksJsonSchema(input)) {
			devWarn(`Tool "${descriptor.name}": input schema has no JSON Schema form; agents get none.`);
		}
		let stopCancel: (() => void) | undefined;
		const start = async () => {
			const context = await ready(this.#config);
			if (!context || registration.signal.aborted) return;
			stopCancel = onToolCancel(context, (name) => {
				if (name === descriptor.name) this.cancel();
			});
			const execute = async (raw: Record<string, unknown>, signal: AbortSignal) =>
				toWire(await this.#run(raw, signal));
			await registerSpecTool(context, descriptor, execute, {
				signal: registration.signal,
				exposedTo
			});
			if (registration.signal.aborted) return;
			this.registered = true;
			this.error = undefined;
		};
		start().catch((error: unknown) => {
			if (!registration.signal.aborted) this.#report(asError(error));
		});
		return () => {
			registration.abort();
			stopCancel?.();
			this.cancel();
			this.registered = false;
		};
	}

	/**
	 * Keep the tool registered while the current effect lives. Re-registers
	 * only when the shape key or `enabled` changes.
	 */
	bind(element?: Element): void {
		$effect(() => {
			void this.key;
			if (!this.enabled) return;
			return untrack(() => this.connect(element));
		});
	}
}

/**
 * Register a WebMCP tool for the lifetime of the current component.
 * Options can be an object or a getter; `execute` is always read fresh.
 */
export function tool<S extends ToolSchema | undefined = undefined, R = unknown>(
	options: MaybeGetter<ToolOptions<S, R>>
): Tool<S, R> {
	const instance = new Tool(options, getWebMCP());
	instance.bind();
	return instance;
}
