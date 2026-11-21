import type { Handle } from '@sveltejs/kit/hooks';

/** Who may use WebMCP tools: `'self'`, `'*'`, or an origin like `'https://example.com'`. */
export type ToolsAllow = 'self' | '*' | (string & {});

export interface WebMCPHandleOptions {
	/** Origin trial token(s) for Chrome or Edge. Each becomes an `Origin-Trial` header. */
	originTrialToken?: string | readonly string[];
	/**
	 * Allow-list for the `tools` Permissions-Policy feature. Default `['self']`.
	 * An empty list turns WebMCP off for the page and its frames.
	 */
	allow?: readonly ToolsAllow[];
}

const POLICY_FEATURE = 'tools';

function policyEntry(entry: ToolsAllow): string {
	if (entry === 'self') return 'self';
	if (entry === '*') return '*';
	const url = new URL(entry);
	return `"${url.origin}"`;
}

/** The `Permissions-Policy` directive for the given allow-list, e.g. `tools=(self)`. */
export function toolsPolicy(allow: readonly ToolsAllow[] = ['self']): string {
	if (allow.includes('*')) return `${POLICY_FEATURE}=*`;
	return `${POLICY_FEATURE}=(${allow.map(policyEntry).join(' ')})`;
}

function mergePolicy(existing: string | null, directive: string): string {
	if (!existing) return directive;
	const hasFeature = existing
		.split(',')
		.some((part) => part.trim().startsWith(`${POLICY_FEATURE}=`));
	return hasFeature ? existing : `${existing}, ${directive}`;
}

function withHeaders(response: Response, apply: (headers: Headers) => void): Response {
	try {
		apply(response.headers);
		return response;
	} catch {
		// Headers of some responses are immutable; copy the response first.
		const copy = new Response(response.body, response);
		apply(copy.headers);
		return copy;
	}
}

/**
 * Sets `Origin-Trial` and `Permissions-Policy: tools=(...)` on HTML
 * responses. An existing `tools` directive set by the app is kept.
 *
 * ```ts
 * export const handle = sequence(webmcpHandle({ originTrialToken: env.WEBMCP_OT }));
 * ```
 */
export function webmcpHandle(options: WebMCPHandleOptions = {}): Handle {
	const directive = toolsPolicy(options.allow);
	const tokens = [options.originTrialToken ?? []].flat().filter((token) => token.length > 0);
	return async ({ event, resolve }) => {
		const response = await resolve(event);
		const type = response.headers.get('content-type') ?? '';
		if (!type.includes('text/html')) return response;
		return withHeaders(response, (headers) => {
			for (const token of tokens) headers.append('Origin-Trial', token);
			headers.set('Permissions-Policy', mergePolicy(headers.get('Permissions-Policy'), directive));
		});
	};
}
