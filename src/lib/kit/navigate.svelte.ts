import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { RouteId } from '$app/types';
import { errorResult } from '#lib/core/result.js';
import type { JsonSchema } from '#lib/core/schema.js';
import { checkNavigation, navigateSchema, type RouteAllowList } from '#lib/kit/routes.js';
import { tool, type Tool, type ToolOptions } from '#lib/tool.svelte.js';

export interface NavigateToolOptions<R extends string> extends Partial<
	Omit<ToolOptions<undefined>, 'execute' | 'input'>
> {
	/** Routes the agent may open: route ids, or route ids mapped to a description. */
	routes: RouteAllowList<R>;
	/** Build the URL. Default: `resolve()` from `$app/paths`. */
	resolvePath?: (route: R, params: Record<string, string>) => string;
	/** Go there. Default: `goto()` from `$app/navigation`. */
	navigate?: (path: string) => Promise<void>;
}

interface NavigateInput {
	route: string;
	params?: Record<string, string>;
}

function defaultResolve(route: string, params: Record<string, string>): string {
	return (resolve as (route: string, params?: Record<string, string>) => string)(route, params);
}

/**
 * Let the agent move around the app, but only to routes you list. Register
 * it once in the root layout.
 *
 * ```ts
 * navigateTool({ routes: { '/': { description: 'Home' }, '/blog/[slug]': { description: 'A post' } } });
 * ```
 */
export function navigateTool<R extends RouteId | (string & {}) = RouteId>(
	options: NavigateToolOptions<R>
): Tool<JsonSchema> {
	const { routes, resolvePath, navigate, ...rest } = options;
	return tool(() => ({
		name: 'navigate',
		description: 'Open a page of this site',
		...rest,
		input: navigateSchema(routes),
		execute: async (raw) => {
			const { route, params = {} } = raw as unknown as NavigateInput;
			const problem = checkNavigation(routes, route, params);
			if (problem) return errorResult(problem);
			const path = (resolvePath ?? defaultResolve)(route as R, params);
			// `path` already went through resolve() (or the app's own resolver).
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await (navigate ?? ((target: string) => goto(target)))(path);
			return `Navigated to ${path}`;
		}
	}));
}
