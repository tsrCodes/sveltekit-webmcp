/** Docs pages and the features each one demonstrates. */
export interface Feature {
	id: string;
	title: string;
	summary: string;
}

export interface DocPage {
	path:
		| '/docs/tools'
		| '/docs/attach'
		| '/docs/config'
		| '/docs/kit'
		| '/docs/navigation'
		| '/docs/server'
		| '/docs/devtools'
		| '/docs/testing';
	title: string;
	features: Feature[];
}

export const DOC_PAGES: DocPage[] = [
	{
		path: '/docs/tools',
		title: 'Tools',
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
		path: '/docs/attach',
		title: 'Attachments',
		features: [{ id: 'F4', title: 'attachTool()', summary: 'Tools that live with an element.' }]
	},
	{
		path: '/docs/config',
		title: 'App config',
		features: [
			{ id: 'F5', title: 'setWebMCP()', summary: 'App-wide settings through context.' },
			{ id: 'F9', title: 'Confirmation', summary: 'Ask the user before consequential tools.' },
			{ id: 'F10', title: 'registeredTools', summary: 'Live list of tools on the page.' },
			{ id: 'F12', title: 'Polyfill and late injection', summary: 'Works before browsers ship it.' }
		]
	},
	{
		path: '/docs/kit',
		title: 'Remote functions',
		features: [
			{ id: 'F13', title: 'commandTool()', summary: 'A remote command as a tool.' },
			{ id: 'F14', title: 'queryTool()', summary: 'A remote query as a read-only tool.' },
			{ id: 'F15', title: 'formTool()', summary: 'A remote form the agent fills in.' }
		]
	},
	{
		path: '/docs/navigation',
		title: 'Navigation and context',
		features: [
			{ id: 'F16', title: 'navigateTool()', summary: 'Allow-listed route navigation.' },
			{ id: 'F17', title: 'pageContextTool()', summary: 'An opt-in slice of the current page.' },
			{ id: 'F18', title: 'searchTool()', summary: 'Site search with { query, limit }.' }
		]
	},
	{
		path: '/docs/server',
		title: 'Server',
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
		path: '/docs/devtools',
		title: 'Devtools',
		features: [{ id: 'F23', title: '<WebMCPDevtools />', summary: 'See and fire tools in dev.' }]
	},
	{
		path: '/docs/testing',
		title: 'Testing',
		features: [
			{
				id: 'F24',
				title: 'Testing entry',
				summary: 'mockModelContext, callTool, Playwright fixture.'
			}
		]
	}
];
