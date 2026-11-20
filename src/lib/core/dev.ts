const env = (import.meta as { env?: { DEV?: boolean } }).env;

/** True in Vite dev builds and in tests. */
export const isDev: boolean = env?.DEV === true;

/** Warn once per message, only in development. */
const seen = new Set<string>();

export function devWarn(message: string): void {
	if (!isDev || seen.has(message)) return;
	seen.add(message);
	console.warn(`[sveltekit-webmcp] ${message}`);
}
