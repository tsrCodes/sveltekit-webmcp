import type { WebMCPConfig } from '#lib/context.js';
import {
	getModelContext,
	installPolyfill,
	waitForModelContext,
	type ModelContextLike,
	type PolyfillLoader
} from '#lib/core/model-context.js';

const loadOfficialPolyfill: PolyfillLoader = () => import('@w3c/webmcp-polyfill');

let version = $state(0);
let pending: Promise<ModelContextLike | undefined> | undefined;

function polyfillLoader(config: WebMCPConfig): PolyfillLoader | undefined {
	if (typeof config.polyfill === 'function') return config.polyfill;
	return config.polyfill === true ? loadOfficialPolyfill : undefined;
}

let polyfillAttempt: Promise<void> | undefined;

// Start the polyfill as soon as any caller asks for one, even if an earlier
// caller without a polyfill is already waiting: that waiter polls and picks
// the installed context up.
function startPolyfill(config: WebMCPConfig): Promise<void> | undefined {
	const loader = polyfillLoader(config);
	if (!loader || polyfillAttempt) return polyfillAttempt;
	polyfillAttempt = installPolyfill(loader).then(
		() => undefined,
		(error: unknown) => {
			polyfillAttempt = undefined;
			config.onError?.(error instanceof Error ? error : new Error(String(error)), '');
		}
	);
	return polyfillAttempt;
}

async function resolveContext(config: WebMCPConfig): Promise<ModelContextLike | undefined> {
	await startPolyfill(config);
	const installed = getModelContext();
	if (installed || config.lateInjection === false) return installed;
	const options = typeof config.lateInjection === 'object' ? config.lateInjection : {};
	return waitForModelContext(options);
}

/**
 * Resolve the model context: native API, then polyfill, then a short wait
 * for late injection. Browser only; resolves `undefined` on the server or
 * when nothing shows up.
 */
export function ready(config: WebMCPConfig = {}): Promise<ModelContextLike | undefined> {
	const existing = getModelContext();
	if (existing) return Promise.resolve(existing);
	if (typeof document === 'undefined') return Promise.resolve(undefined);
	void startPolyfill(config);
	pending ??= resolveContext(config).finally(() => {
		pending = undefined;
		version += 1;
	});
	return pending;
}

/** Reactive: `isSupported.current` is `true` once a model context exists. */
export const isSupported = {
	get current(): boolean {
		void version;
		return getModelContext() !== undefined;
	}
};

/** Re-check support (used by tests and the mock to wake readers). */
export function refreshSupport(): void {
	version += 1;
}
