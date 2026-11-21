import { createContext, onDestroy } from 'svelte';
import type { PolyfillLoader, WaitOptions } from '#lib/core/model-context.js';
import type { ConfirmHandler } from '#lib/core/run.js';

/** App-wide settings, set once with `setWebMCP()` in a root layout. */
export interface WebMCPConfig {
	/**
	 * Load `@w3c/webmcp-polyfill` when the browser has no native API.
	 * `true` imports the package (install it first); a function lets you
	 * load any polyfill yourself, e.g. `() => import('@w3c/webmcp-polyfill')`.
	 */
	polyfill?: boolean | PolyfillLoader;
	/** Prefix added to every tool name, e.g. `'shop_'`. */
	prefix?: string;
	/** Asked before any consequential tool runs. Defaults to `window.confirm`. */
	confirm?: ConfirmHandler;
	/** Called when registering or running a tool fails. */
	onError?: (error: Error, toolName: string) => void;
	/** Origins allowed to call tools across frames. Default: none. */
	exposedTo?: string[];
	/**
	 * Keep checking for a model context injected later (browser extensions).
	 * Default: check every 500 ms for 10 s. `false` turns it off.
	 */
	lateInjection?: boolean | WaitOptions;
}

const [getContextValue, setContextValue, hasContextValue] = createContext<WebMCPConfig>();

// Attachments and event handlers run outside component initialisation, where
// context cannot be read. In the browser there is one user per page, so the
// last config set there is kept as a fallback. On the server this is never
// written, so nothing leaks between requests.
let browserConfig: WebMCPConfig | undefined;

/** Set app-wide WebMCP settings for this component and its children. */
export function setWebMCP(config: WebMCPConfig = {}): WebMCPConfig {
	const value = setContextValue(config);
	if (typeof document !== 'undefined') {
		browserConfig = config;
		onDestroy(() => {
			if (browserConfig === config) browserConfig = undefined;
		});
	}
	return value;
}

/**
 * Read the settings from `setWebMCP()`. Works during component init, and
 * in the browser anywhere else. Returns defaults when nothing was set.
 */
export function getWebMCP(): WebMCPConfig {
	try {
		if (hasContextValue()) return getContextValue();
	} catch {
		// Called outside component initialisation; use the browser fallback.
	}
	return browserConfig ?? {};
}
