<script lang="ts">
	import './layout.css';
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { ModeWatcher } from 'mode-watcher';
	import { setWebMCP } from '#lib/index.js';
	import { navigateTool, pageContextTool } from '#lib/kit/index.js';
	import { WebMCPDevtools } from '#lib/devtools/index.js';
	import ConfirmDialog from '#docs/ConfirmDialog.svelte';
	import { Confirmer } from '#docs/confirmer.svelte.js';
	import SiteFooter from '#docs/components/SiteFooter.svelte';
	import SiteHeader from '#docs/components/SiteHeader.svelte';
	import favicon from '#docs/assets/favicon.svg';

	let { children }: { children: Snippet } = $props();

	const confirmer = new Confirmer();
	const DOCS_PREFIX = '/docs/';

	setWebMCP({
		polyfill: () => import('@w3c/webmcp-polyfill'),
		confirm: confirmer.ask,
		onError: (error, toolName) => console.error(`[webmcp] ${toolName || 'setup'}:`, error)
	});

	// Agents see plain paths; every docs page is one catch-all route underneath.
	navigateTool({
		routes: {
			'/': { description: 'Home: what the package is and how to install it' },
			'/docs/tools': { description: 'tool(), reactive options, results, limits' },
			'/docs/attach': { description: 'attachTool() demos' },
			'/docs/config': { description: 'setWebMCP(), confirmation, live tool list' },
			'/docs/kit': { description: 'Remote command, query and form tools' },
			'/docs/navigation': { description: 'Navigation, page context and search' },
			'/docs/server': { description: 'Response headers and the MCP endpoint' },
			'/docs/devtools': { description: 'The devtools panel' },
			'/docs/testing': { description: 'Testing helpers' }
		},
		resolvePath: (route) =>
			route.startsWith(DOCS_PREFIX)
				? resolve('/docs/[...slug]', { slug: route.slice(DOCS_PREFIX.length) })
				: resolve('/')
	});

	pageContextTool({ fields: { routeId: true, params: true, title: true, data: ['product'] } });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content="WebMCP for SvelteKit: expose page tools to AI agents." />
</svelte:head>

<ModeWatcher />

<a
	class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
	href="#main">Skip to content</a
>

<div class="flex min-h-svh flex-col">
	<SiteHeader />
	<main id="main" class="flex flex-1 flex-col">
		{@render children()}
	</main>
	<SiteFooter />
</div>

<ConfirmDialog {confirmer} />
<WebMCPDevtools force />
