<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { setWebMCP } from '#lib/index.js';
	import { navigateTool, pageContextTool } from '#lib/kit/index.js';
	import { WebMCPDevtools } from '#lib/devtools/index.js';
	import ConfirmDialog from '../docs/ConfirmDialog.svelte';
	import { Confirmer } from '../docs/confirmer.svelte.js';
	import { DOC_PAGES } from '../docs/features.js';

	let { children }: { children: Snippet } = $props();

	const confirmer = new Confirmer();

	setWebMCP({
		polyfill: () => import('@w3c/webmcp-polyfill'),
		confirm: confirmer.ask,
		onError: (error, toolName) => console.error(`[webmcp] ${toolName || 'setup'}:`, error)
	});

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
		}
	});

	pageContextTool({ fields: { routeId: true, params: true, title: true, data: ['product'] } });
</script>

<svelte:head>
	<meta name="description" content="WebMCP for SvelteKit: expose page tools to AI agents." />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="site-header">
	<a class="brand" href={resolve('/')}>sveltekit-webmcp</a>
	<nav aria-label="Docs">
		<ul>
			{#each DOC_PAGES as doc (doc.path)}
				<li>
					<a
						href={resolve(doc.path)}
						aria-current={page.url.pathname === doc.path ? 'page' : undefined}>{doc.title}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
</header>

<main id="main">
	{@render children()}
</main>

<footer class="site-footer">
	<p>Handcrafted by <a href="https://github.com/tsrCodes" rel="noopener noreferrer">Oggy</a></p>
</footer>

<ConfirmDialog {confirmer} />
<WebMCPDevtools force />

<style>
	:global {
		:root {
			--bg: #fbfaf8;
			--fg: #1b1d21;
			--muted: #5f6570;
			--line: #e3e0da;
			--surface: #ffffff;
			--accent: #ff6a3d;
			--accent-ink: #1b1d21;
			--danger: #c62828;
			--code-bg: #16181d;
			--code-fg: #e8eaed;
			--radius: 12px;
			--sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
			--mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			color-scheme: light dark;
		}

		@media (prefers-color-scheme: dark) {
			:root {
				--bg: #0f1114;
				--fg: #e8eaed;
				--muted: #9aa0a6;
				--line: #262a30;
				--surface: #15181c;
				--danger: #ff6b6b;
				--code-bg: #0a0b0d;
			}
		}

		*,
		*::before,
		*::after {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			background: var(--bg);
			color: var(--fg);
			font: 16px/1.6 var(--sans);
			-webkit-font-smoothing: antialiased;
		}

		a {
			color: inherit;
			text-underline-offset: 3px;
		}

		code {
			font-family: var(--mono);
			font-size: 0.9em;
		}

		:not(pre) > code {
			background: color-mix(in srgb, var(--accent) 12%, transparent);
			padding: 0.1em 0.35em;
			border-radius: 4px;
		}

		button,
		input,
		textarea,
		select {
			font: inherit;
		}

		main button,
		dialog button {
			background: var(--fg);
			color: var(--bg);
			border: 0;
			border-radius: 8px;
			padding: 0.45rem 0.9rem;
			cursor: pointer;
		}

		main button.secondary,
		dialog button.secondary {
			background: transparent;
			color: var(--fg);
			border: 1px solid var(--line);
		}

		main button:disabled {
			opacity: 0.55;
			cursor: not-allowed;
		}

		main input:not([type='checkbox']),
		main textarea {
			border: 1px solid var(--line);
			background: var(--bg);
			color: var(--fg);
			border-radius: 8px;
			padding: 0.45rem 0.6rem;
			width: 100%;
		}

		:focus-visible {
			outline: 2px solid var(--accent);
			outline-offset: 2px;
		}

		.row {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem;
		}

		.stack {
			display: grid;
			gap: 0.6rem;
		}

		.note {
			color: var(--muted);
			font-size: 0.92rem;
		}
	}

	.skip {
		position: absolute;
		left: -9999px;
	}

	.skip:focus {
		left: 1rem;
		top: 1rem;
		z-index: 10;
		background: var(--bg);
		padding: 0.5rem 0.75rem;
	}

	.site-header {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.5rem;
		padding: 0.75rem clamp(1rem, 4vw, 2.5rem);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--line);
	}

	.brand {
		font: 700 1rem/1 var(--mono);
		text-decoration: none;
	}

	nav ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		list-style: none;
		margin: 0;
		padding: 0;
		font-size: 0.92rem;
	}

	nav a {
		text-decoration: none;
		color: var(--muted);
	}

	nav a[aria-current='page'],
	nav a:hover {
		color: var(--fg);
	}

	main {
		max-width: 52rem;
		margin: 0 auto;
		padding: 2rem clamp(1rem, 4vw, 2.5rem) 4rem;
	}

	.site-footer {
		border-top: 1px solid var(--line);
		padding: 1.5rem;
		text-align: center;
		color: var(--muted);
		font-size: 0.9rem;
	}
</style>
