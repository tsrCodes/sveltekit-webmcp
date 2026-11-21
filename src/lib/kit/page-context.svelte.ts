import { page } from '$app/state';
import { tool, type Tool, type ToolOptions } from '#lib/tool.svelte.js';

/** Which parts of the page the agent may read. Everything is off by default. */
export interface PageContextFields {
	routeId?: boolean;
	params?: boolean;
	/** Pathname and search params (never the hash). */
	url?: boolean;
	/** `document.title`. */
	title?: boolean;
	/** Keys of `page.data` to include. All other keys stay private. */
	data?: readonly string[];
}

export interface PageContextToolOptions extends Partial<
	Omit<ToolOptions<undefined>, 'execute' | 'input'>
> {
	fields: PageContextFields;
}

/** The page fields the tool reads. Matches the shape of `page` from `$app/state`. */
export interface PageSnapshot {
	route: { id: string | null };
	params: Record<string, string>;
	url: { pathname: string; searchParams: { entries(): Iterable<[string, string]> } };
	data: Record<string, unknown>;
}

/** Pick the allowed slice of a page. Never copies data keys that were not listed. */
export function pickPageContext(
	snapshot: PageSnapshot,
	fields: PageContextFields,
	title?: string
): Record<string, unknown> {
	const data = Object.fromEntries(
		(fields.data ?? [])
			.filter((key) => Object.hasOwn(snapshot.data, key))
			.map((key) => [key, snapshot.data[key]])
	);
	return {
		...(fields.routeId && { routeId: snapshot.route.id }),
		...(fields.params && { params: { ...snapshot.params } }),
		...(fields.url && {
			url: {
				pathname: snapshot.url.pathname,
				search: Object.fromEntries(snapshot.url.searchParams.entries())
			}
		}),
		...(fields.title && { title: title ?? '' }),
		...(fields.data && { data })
	};
}

/**
 * Tell the agent what is on screen: an allow-listed slice of `page` from
 * `$app/state`. Read-only. Nothing is shared unless you opt in per field.
 *
 * ```ts
 * pageContextTool({ fields: { routeId: true, params: true, title: true, data: ['product'] } });
 * ```
 */
export function pageContextTool(options: PageContextToolOptions): Tool<undefined> {
	const { fields, ...rest } = options;
	return tool(() => ({
		name: 'get_page_context',
		description: 'Describe the page the user is looking at',
		readOnly: true,
		...rest,
		execute: () =>
			pickPageContext(page, fields, typeof document === 'undefined' ? '' : document.title)
	}));
}
