/** Docs pages and the features each one demonstrates. */
export interface Feature {
	id: string;
	title: string;
	summary: string;
}

export interface DocPage {
	/** The part after `/docs/`; the page lives in `src/content/docs/NN-<slug>.md`. */
	slug: string;
	title: string;
	description: string;
	features: Feature[];
}

export const DOC_PAGES: DocPage[] = [
	{
		slug: 'tools',
		title: 'Tools',
		description: 'tool(), reactive options, results, limits',
		features: [
			{ id: 'F1', title: 'tool()', summary: 'Register a tool from a component.' },
			{
				id: 'F2',
				title: 'Reactive options',
				summary: 'Getters re-register only when the shape changes.'
			},
			{ id: 'F3', title: 'enabled', summary: 'Turn a tool off and on.' },
			{
				id: 'F6',
				title: 'Run state',
				summary: 'registered, running, error, callCount, lastResult.'
			},
			{
				id: 'F7',
				title: 'Results and output schema',
				summary: 'Normalised results, checked output.'
			},
			{ id: 'F8', title: 'Annotations', summary: 'readOnly, consequential, untrusted, debugging.' },
			{
				id: 'F11',
				title: 'Error surfacing',
				summary: 'Failed registrations set error and call onError.'
			},
			{ id: 'F21', title: 'Rate limits', summary: 'Per-tool client-side limits.' },
			{ id: 'F22', title: 'Untrusted output', summary: 'Warns about invisible Unicode.' }
		]
	},
	{
		slug: 'attach',
		title: 'Attachments',
		description: 'attachTool() demos',
		features: [{ id: 'F4', title: 'attachTool()', summary: 'Tools that live with an element.' }]
	},
	{
		slug: 'config',
		title: 'App config',
		description: 'setWebMCP(), confirmation, live tool list',
		features: [
			{ id: 'F5', title: 'setWebMCP()', summary: 'App-wide settings through context.' },
			{ id: 'F9', title: 'Confirmation', summary: 'Ask the user before consequential tools.' },
			{ id: 'F10', title: 'registeredTools', summary: 'Live list of tools on the page.' },
			{ id: 'F12', title: 'Polyfill and late injection', summary: 'Works before browsers ship it.' }
		]
	},
	{
		slug: 'kit',
		title: 'Remote functions',
		description: 'Remote command, query and form tools',
		features: [
			{ id: 'F13', title: 'commandTool()', summary: 'A remote command as a tool.' },
			{ id: 'F14', title: 'queryTool()', summary: 'A remote query as a read-only tool.' },
			{ id: 'F15', title: 'formTool()', summary: 'A remote form the agent fills in.' }
		]
	},
	{
		slug: 'navigation',
		title: 'Navigation and context',
		description: 'Navigation, page context and search',
		features: [
			{ id: 'F16', title: 'navigateTool()', summary: 'Allow-listed route navigation.' },
			{ id: 'F17', title: 'pageContextTool()', summary: 'An opt-in slice of the current page.' },
			{ id: 'F18', title: 'searchTool()', summary: 'Site search with { query, limit }.' }
		]
	},
	{
		slug: 'server',
		title: 'Server',
		description: 'Response headers and the MCP endpoint',
		features: [
			{
				id: 'F19',
				title: 'webmcpHandle()',
				summary: 'Origin-Trial and Permissions-Policy headers.'
			},
			{ id: 'F20', title: 'mcpHandle()', summary: 'The same tools for non-browser agents.' }
		]
	},
	{
		slug: 'devtools',
		title: 'Devtools',
		description: 'The devtools panel',
		features: [{ id: 'F23', title: '<WebMCPDevtools />', summary: 'See and fire tools in dev.' }]
	},
	{
		slug: 'testing',
		title: 'Testing',
		description: 'Testing helpers',
		features: [
			{
				id: 'F24',
				title: 'Testing entry',
				summary: 'mockModelContext, callTool, Playwright fixture.'
			}
		]
	}
];

/** The docs page for a slug, if there is one. */
export function findDocPage(slug: string): DocPage | undefined {
	return DOC_PAGES.find((doc) => doc.slug === slug);
}

/** The pages before and after this one, for the prev/next links. */
export function docNeighbours(slug: string): { previous?: DocPage; next?: DocPage } {
	const index = DOC_PAGES.findIndex((doc) => doc.slug === slug);
	if (index === -1) return {};
	return { previous: DOC_PAGES[index - 1], next: DOC_PAGES[index + 1] };
}

/** A feature by its id (`F1`…`F24`). Throws on a typo, so a broken page fails the build. */
export function findFeature(id: string): Feature {
	const feature = DOC_PAGES.flatMap((doc) => doc.features).find((entry) => entry.id === id);
	if (!feature) throw new Error(`Unknown feature ${id}`);
	return feature;
}
