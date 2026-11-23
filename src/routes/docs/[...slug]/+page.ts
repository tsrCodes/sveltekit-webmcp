import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Component } from 'svelte';
import { DOC_PAGES, docNeighbours, findDocPage } from '#docs/features.js';
import { PAGE_DATA } from '../../../demo/page-data.js';
import type { PageLoad } from './$types';

// Files are `NN-slug.md`: the number keeps them in reading order, and stops
// `server.md` from looking like a server-only module to Kit.
const PAGES = import.meta.glob<{ default: Component }>('/src/content/docs/*.md');

function findPageModule(slug: string) {
	const key = Object.keys(PAGES).find((path) => path.endsWith(`-${slug}.md`));
	return key ? PAGES[key] : undefined;
}

export const load: PageLoad = async ({ params }) => {
	if (params.slug === '') redirect(307, resolve('/docs/[...slug]', { slug: DOC_PAGES[0].slug }));
	const doc = findDocPage(params.slug);
	const loadPage = findPageModule(params.slug);
	if (!doc || !loadPage) error(404, 'Not found');
	const module = await loadPage();
	return {
		...PAGE_DATA[doc.slug],
		doc,
		neighbours: docNeighbours(doc.slug),
		content: module.default
	};
};
