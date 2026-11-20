import { createSubscriber } from 'svelte/reactivity';
import { getWebMCP } from '#lib/context.js';
import { listTools, onToolChange, type ListedTool } from '#lib/core/model-context.js';
import { ready } from '#lib/support.svelte.js';

/**
 * Live list of the tools the browser knows about on this page, from
 * `getTools()`, kept fresh by listening to `toolchange`.
 */
class RegisteredTools {
	#tools: ListedTool[] = [];
	#subscribe = createSubscriber((update) => {
		let stopped = false;
		let stopListening: (() => void) | undefined;
		let latest = 0;
		const refresh = async () => {
			const request = ++latest;
			const context = await ready(getWebMCP());
			if (!context || stopped) return;
			const tools = await listTools(context);
			// A newer refresh started meanwhile; its answer wins.
			if (stopped || request !== latest) return;
			this.#tools = tools;
			update();
		};
		ready(getWebMCP()).then((context) => {
			if (!context || stopped) return;
			stopListening = onToolChange(context, () => void refresh());
			void refresh();
		});
		return () => {
			stopped = true;
			stopListening?.();
		};
	});

	/** The current tools. Empty on the server and before the first read resolves. */
	get current(): readonly ListedTool[] {
		this.#subscribe();
		return this.#tools;
	}
}

export const registeredTools = new RegisteredTools();
