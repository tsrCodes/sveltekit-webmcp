import type { SpecAnnotations } from '#lib/core/annotations.js';
import type { JsonSchema } from '#lib/core/json-validate.js';

/**
 * Local view of the WebMCP draft API. Kept structural so the package has no
 * runtime or type dependency on a particular types package; a test pins it
 * against `webmcp-types` so a spec rename fails CI.
 */
export interface SpecTool {
	name: string;
	title?: string;
	description: string;
	inputSchema?: JsonSchema;
	outputSchema?: JsonSchema;
	annotations?: SpecAnnotations;
	execute: (input: object, options: { signal: AbortSignal }) => unknown;
}

export interface SpecRegisterOptions {
	signal?: AbortSignal;
	exposedTo?: string[];
}

/** A tool as listed by the browser. */
export interface ListedTool {
	name: string;
	title: string;
	description: string;
	inputSchema?: object;
	outputSchema?: object;
	annotations?: SpecAnnotations;
	origin?: string;
}

export interface ModelContextLike extends EventTarget {
	registerTool(tool: SpecTool, options?: SpecRegisterOptions): Promise<void>;
	getTools(options?: { fromOrigins?: string[] }): Promise<ListedTool[]>;
	executeTool(
		tool: ListedTool,
		input?: object,
		options?: { signal?: AbortSignal }
	): Promise<string>;
}

/** Event names of the draft, in one place. */
export const SPEC_EVENTS = {
	change: 'toolchange',
	activated: 'toolactivated',
	cancel: 'toolcancel'
} as const;

/** The document's model context, or `undefined` on the server or in unsupported browsers. */
export function getModelContext(): ModelContextLike | undefined {
	if (typeof document === 'undefined') return undefined;
	return (document as { modelContext?: ModelContextLike }).modelContext ?? undefined;
}

/** Loads a polyfill module. The module may export `installWebMCP()`. */
export type PolyfillLoader = () => Promise<unknown>;

/** Run a polyfill loader when the native API is missing. Returns the context afterwards. */
export async function installPolyfill(
	loader: PolyfillLoader
): Promise<ModelContextLike | undefined> {
	if (typeof document === 'undefined') return undefined;
	if (getModelContext()) return getModelContext();
	const mod = (await loader()) as { installWebMCP?: () => void } | undefined;
	mod?.installWebMCP?.();
	return getModelContext();
}

export interface WaitOptions {
	/** Poll interval in ms. Default 500. */
	interval?: number;
	/** Give up after this many ms. Default 10 000. */
	timeout?: number;
	signal?: AbortSignal;
}

export const LATE_INJECTION_INTERVAL = 500;
export const LATE_INJECTION_TIMEOUT = 10_000;

/**
 * Resolve with the model context as soon as it exists. Covers browser
 * extensions that inject `document.modelContext` after the page loads.
 */
export function waitForModelContext(
	options: WaitOptions = {}
): Promise<ModelContextLike | undefined> {
	const { interval = LATE_INJECTION_INTERVAL, timeout = LATE_INJECTION_TIMEOUT, signal } = options;
	const found = getModelContext();
	if (found || typeof document === 'undefined') return Promise.resolve(found);
	return new Promise((resolve) => {
		const started = Date.now();
		const finish = () => {
			clearInterval(timer);
			signal?.removeEventListener('abort', finish);
			resolve(getModelContext());
		};
		const timer = setInterval(() => {
			if (getModelContext() || Date.now() - started >= timeout) finish();
		}, interval);
		signal?.addEventListener('abort', finish, { once: true });
	});
}

export function listTools(context: ModelContextLike): Promise<ListedTool[]> {
	return context.getTools();
}

/** Execute a listed tool by name. Resolves with the raw JSON string the browser returns. */
export async function executeByName(
	context: ModelContextLike,
	name: string,
	input: object = {},
	signal?: AbortSignal
): Promise<string> {
	const tools = await context.getTools();
	const target = tools.find((tool) => tool.name === name);
	if (!target) throw new Error(`No tool named "${name}" is registered`);
	return context.executeTool(target, input, signal ? { signal } : undefined);
}

function listen(context: ModelContextLike, type: string, handler: (event: Event) => void) {
	context.addEventListener(type, handler);
	return () => context.removeEventListener(type, handler);
}

export function onToolChange(context: ModelContextLike, callback: () => void): () => void {
	return listen(context, SPEC_EVENTS.change, () => callback());
}

function toolNameOf(event: Event): string {
	return (event as Event & { toolName?: string }).toolName ?? '';
}

export function onToolCancel(
	context: ModelContextLike,
	callback: (toolName: string) => void
): () => void {
	return listen(context, SPEC_EVENTS.cancel, (event) => callback(toolNameOf(event)));
}

export function onToolActivated(
	context: ModelContextLike,
	callback: (toolName: string) => void
): () => void {
	return listen(context, SPEC_EVENTS.activated, (event) => callback(toolNameOf(event)));
}
