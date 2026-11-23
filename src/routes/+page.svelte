<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { isSupported, registeredTools } from '#lib/index.js';
	import { Badge } from '#docs/components/ui/badge/index.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import { DOC_PAGES } from '#docs/features.js';
	import Install from '../content/home/install.md';
	import QuickStart from '../content/home/quick-start.md';

	const ENTRY_POINTS = [
		{
			path: 'sveltekit-webmcp',
			exports: ['tool', 'attachTool', 'setWebMCP', 'getWebMCP', 'registeredTools', 'isSupported']
		},
		{
			path: 'sveltekit-webmcp/kit',
			exports: [
				'commandTool',
				'queryTool',
				'formTool',
				'navigateTool',
				'pageContextTool',
				'searchTool'
			]
		},
		{ path: 'sveltekit-webmcp/server', exports: ['webmcpHandle', 'mcpHandle', 'serverTool'] },
		{ path: 'sveltekit-webmcp/devtools', exports: ['WebMCPDevtools'] },
		{ path: 'sveltekit-webmcp/testing', exports: ['mockModelContext', 'callTool', 'waitForTool'] },
		{ path: 'sveltekit-webmcp/testing/playwright', exports: ['test (with a webmcp fixture)'] }
	];
</script>

<svelte:head><title>sveltekit-webmcp</title></svelte:head>

<div class="mx-auto w-full max-w-5xl px-4 sm:px-6">
	<section class="py-16 sm:py-24">
		<p
			class="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground"
			aria-live="polite"
		>
			<span
				class={[
					'size-2 rounded-full',
					isSupported.current ? 'bg-success' : 'animate-pulse bg-muted-foreground'
				]}
			></span>
			{#if isSupported.current}
				WebMCP is running on this page with {registeredTools.current.length} tools.
			{:else}
				Waiting for WebMCP…
			{/if}
		</p>
		<h1 class="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
			WebMCP for <span class="text-brand">SvelteKit</span>
		</h1>
		<p class="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
			Let AI agents use your app through tools you define. Runes, attachments and remote functions,
			the Svelte way.
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			<Button size="lg" href={resolve('/docs/[...slug]', { slug: 'tools' })}>
				Read the docs <ArrowRightIcon />
			</Button>
			<Button
				size="lg"
				variant="outline"
				href="https://github.com/tsrCodes/sveltekit-webmcp"
				rel="noopener noreferrer">View on GitHub</Button
			>
		</div>
	</section>

	<section class="docs-prose grid gap-10 pb-16 lg:grid-cols-2">
		<div>
			<h2 class="text-2xl font-semibold tracking-tight">Install</h2>
			<Install />
			<p class="text-sm text-muted-foreground">
				Optional: <code>pnpm add @w3c/webmcp-polyfill</code> for browsers without the native API. WebMCP
				is a W3C Community Group draft and runs in a Chrome and Edge origin trial today.
			</p>
			<h2 class="mt-10 text-2xl font-semibold tracking-tight">Entry points</h2>
			<table>
				<thead>
					<tr><th scope="col">Import</th><th scope="col">Contents</th></tr>
				</thead>
				<tbody>
					{#each ENTRY_POINTS as entry (entry.path)}
						<tr>
							<td><code>{entry.path}</code></td>
							<td>{entry.exports.join(', ')}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div>
			<h2 class="text-2xl font-semibold tracking-tight">Quick start</h2>
			<QuickStart />
		</div>
	</section>

	<section class="pb-24">
		<h2 class="text-2xl font-semibold tracking-tight">Features</h2>
		<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each DOC_PAGES as doc (doc.slug)}
				<a
					class="group rounded-xl border bg-card p-4 transition-colors hover:border-brand"
					href={resolve('/docs/[...slug]', { slug: doc.slug })}
				>
					<h3 class="font-semibold group-hover:text-brand">{doc.title}</h3>
					<ul class="mt-2 grid gap-1 text-sm text-muted-foreground">
						{#each doc.features as feature (feature.id)}
							<li class="flex items-baseline gap-2">
								<Badge variant="outline" class="font-mono text-[10px]">{feature.id}</Badge>
								{feature.title}
							</li>
						{/each}
					</ul>
				</a>
			{/each}
		</div>
	</section>
</div>
