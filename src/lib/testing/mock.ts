import {
	SPEC_EVENTS,
	SPEC_PROPERTY,
	type ListedTool,
	type ModelContextLike,
	type SpecRegisterOptions,
	type SpecTool
} from '#lib/core/model-context.js';
import { refreshSupport } from '#lib/support.svelte.js';

/** A fake `document.modelContext` for unit and component tests. */
export interface MockModelContext extends ModelContextLike {
	/** Names of the tools registered right now. */
	readonly names: string[];
	/** Send `toolcancel` for `name` and abort its running calls. */
	cancel(name: string): void;
	/** Make the next `registerTool` call reject with this error. */
	failNextRegistration(error: Error): void;
	/** Remove the fake and put back whatever was there before. */
	restore(): void;
}

interface Entry {
	tool: SpecTool;
	runs: Set<AbortController>;
}

function invalidState(message: string): DOMException {
	return new DOMException(message, 'InvalidStateError');
}

function nameEvent(type: string, toolName: string): Event {
	return Object.assign(new Event(type), { toolName });
}

class FakeModelContext extends EventTarget implements ModelContextLike {
	#tools = new Map<string, Entry>();
	#nextError: Error | undefined;

	get names(): string[] {
		return [...this.#tools.keys()];
	}

	#listed(entry: Entry): ListedTool {
		const { name, title = '', description, inputSchema, outputSchema, annotations } = entry.tool;
		return {
			name,
			title,
			description,
			inputSchema,
			outputSchema,
			annotations,
			origin: location.origin
		};
	}

	async registerTool(tool: SpecTool, options: SpecRegisterOptions = {}): Promise<void> {
		const pendingError = this.#nextError;
		this.#nextError = undefined;
		if (pendingError) throw pendingError;
		if (options.signal?.aborted) return;
		if (this.#tools.has(tool.name)) {
			throw invalidState(`Tool "${tool.name}" is already registered`);
		}
		const { execute, ...meta } = tool;
		const entry: Entry = { tool: { ...structuredClone(meta), execute }, runs: new Set() };
		this.#tools.set(tool.name, entry);
		options.signal?.addEventListener('abort', () => {
			if (this.#tools.get(tool.name) !== entry) return;
			this.#tools.delete(tool.name);
			this.dispatchEvent(new Event(SPEC_EVENTS.change));
		});
		this.dispatchEvent(new Event(SPEC_EVENTS.change));
	}

	async getTools(): Promise<ListedTool[]> {
		return [...this.#tools.values()].map((entry) => this.#listed(entry));
	}

	async executeTool(
		tool: ListedTool,
		input: object = {},
		options: { signal?: AbortSignal } = {}
	): Promise<string> {
		const entry = this.#tools.get(tool.name);
		if (!entry) throw invalidState(`Tool "${tool.name}" is not registered`);
		const run = new AbortController();
		const signal = options.signal ? AbortSignal.any([options.signal, run.signal]) : run.signal;
		entry.runs.add(run);
		this.dispatchEvent(nameEvent(SPEC_EVENTS.activated, tool.name));
		try {
			const value = await entry.tool.execute(structuredClone(input), { signal });
			return JSON.stringify(value ?? null);
		} finally {
			entry.runs.delete(run);
		}
	}

	cancel(name: string): void {
		this.dispatchEvent(nameEvent(SPEC_EVENTS.cancel, name));
		for (const run of this.#tools.get(name)?.runs ?? []) run.abort();
	}

	failNextRegistration(error: Error): void {
		this.#nextError = error;
	}
}

/**
 * Install a fake `document.modelContext`. Behaves like the draft: duplicate
 * names reject, aborting the registration signal removes the tool, and
 * `toolchange`, `toolactivated` and `toolcancel` are dispatched.
 */
export function mockModelContext(): MockModelContext {
	const previous = Object.getOwnPropertyDescriptor(document, SPEC_PROPERTY);
	const fake = new FakeModelContext();
	Object.defineProperty(document, SPEC_PROPERTY, { value: fake, configurable: true });
	refreshSupport();
	return Object.assign(fake, {
		restore() {
			if (previous) Object.defineProperty(document, SPEC_PROPERTY, previous);
			else Reflect.deleteProperty(document, SPEC_PROPERTY);
			refreshSupport();
		}
	});
}
