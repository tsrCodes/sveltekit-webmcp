import type { JsonSchema } from '#lib/core/schema.js';

/** One allowed destination for the agent. */
export interface RouteEntry {
	/** What the agent finds on this page. */
	description?: string;
}

export type RouteAllowList<R extends string = string> =
	readonly R[] | Partial<Record<R, RouteEntry>>;

const PARAM = /\[\[?(?:\.\.\.)?([^\]=]+)(?:=[^\]]+)?\]\]?/g;

/** Parameter names in a route id, split into required and optional. */
export function routeParams(routeId: string): { required: string[]; optional: string[] } {
	const required: string[] = [];
	const optional: string[] = [];
	for (const match of routeId.matchAll(PARAM)) {
		(match[0].startsWith('[[') ? optional : required).push(match[1]);
	}
	return { required, optional };
}

export function routeIds<R extends string>(routes: RouteAllowList<R>): R[] {
	return (Array.isArray(routes) ? [...routes] : Object.keys(routes)) as R[];
}

function describeRoute(routeId: string, entry: RouteEntry | undefined): string {
	const { required, optional } = routeParams(routeId);
	const params = [...required, ...optional.map((name) => `${name}?`)];
	const suffix = params.length > 0 ? ` (params: ${params.join(', ')})` : '';
	return `${routeId}${suffix}${entry?.description ? `: ${entry.description}` : ''}`;
}

/** Input schema for the navigate tool, listing the allowed routes. */
export function navigateSchema<R extends string>(routes: RouteAllowList<R>): JsonSchema {
	const ids = routeIds(routes);
	const entries: Partial<Record<R, RouteEntry>> = Array.isArray(routes)
		? {}
		: (routes as Partial<Record<R, RouteEntry>>);
	return {
		type: 'object',
		properties: {
			route: {
				type: 'string',
				enum: ids,
				description: `Where to go. One of:\n${ids.map((id) => `- ${describeRoute(id, entries[id])}`).join('\n')}`
			},
			params: {
				type: 'object',
				description: 'Values for the [param] segments of the route',
				additionalProperties: { type: 'string' }
			}
		},
		required: ['route'],
		additionalProperties: false
	};
}

/**
 * Check a navigation request against the allow-list. Returns an error
 * message, or `undefined` when the request is fine.
 */
export function checkNavigation<R extends string>(
	routes: RouteAllowList<R>,
	route: string,
	params: Record<string, string> = {}
): string | undefined {
	if (!routeIds(routes).includes(route as R)) return `Route "${route}" is not allowed`;
	const { required, optional } = routeParams(route);
	const missing = required.filter((name) => !params[name]);
	if (missing.length > 0) return `Missing params for ${route}: ${missing.join(', ')}`;
	const known = new Set([...required, ...optional]);
	const unknown = Object.keys(params).filter((name) => !known.has(name));
	if (unknown.length > 0) return `Unknown params for ${route}: ${unknown.join(', ')}`;
	return undefined;
}
