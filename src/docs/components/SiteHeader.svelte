<script lang="ts">
	import { resolve } from '$app/paths';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import { Button } from '#docs/components/ui/button/index.js';
	import * as Sheet from '#docs/components/ui/sheet/index.js';
	import DocsNav from './DocsNav.svelte';
	import Logo from './Logo.svelte';
	import ModeToggle from './ModeToggle.svelte';

	const REPO_URL = 'https://github.com/tsrCodes/sveltekit-webmcp';
	let isMenuOpen = $state(false);
</script>

<header class="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
	<div class="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
		<Sheet.Root bind:open={isMenuOpen}>
			<Sheet.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="ghost" size="icon" class="lg:hidden">
						<MenuIcon />
						<span class="sr-only">Open menu</span>
					</Button>
				{/snippet}
			</Sheet.Trigger>
			<Sheet.Content side="left" class="w-72 p-4">
				<Sheet.Title class="mb-4 font-mono text-sm">sveltekit-webmcp</Sheet.Title>
				<DocsNav onnavigate={() => (isMenuOpen = false)} />
			</Sheet.Content>
		</Sheet.Root>
		<a
			href={resolve('/')}
			class="flex items-center gap-2 font-mono text-sm font-bold tracking-tight whitespace-nowrap"
		>
			<Logo size={22} />
			<span>sveltekit-<span class="text-brand">webmcp</span></span>
		</a>
		<nav class="ml-auto flex items-center gap-1" aria-label="Site">
			<Button variant="ghost" size="sm" href={resolve('/docs/[...slug]', { slug: 'tools' })}
				>Docs</Button
			>
			<Button variant="ghost" size="sm" href={REPO_URL} rel="noopener noreferrer">GitHub</Button>
			<ModeToggle />
		</nav>
	</div>
</header>
