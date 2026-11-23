import { createHighlighter, type Highlighter } from 'shiki';

// Runs at build time inside the mdsvex preprocessor, so Shiki never reaches the browser.
const LANGUAGES = ['svelte', 'ts', 'js', 'bash', 'json', 'html', 'css'] as const;
const ALIASES: Record<string, string> = { sh: 'bash', shell: 'bash', typescript: 'ts' };
const THEMES = { light: 'github-light', dark: 'github-dark' } as const;

let highlighter: Promise<Highlighter> | undefined;

function pickLanguage(lang: string | null | undefined): string {
	const name = lang ? (ALIASES[lang] ?? lang) : 'text';
	return (LANGUAGES as readonly string[]).includes(name) ? name : 'text';
}

/** Shiki HTML carrying light and dark colours as CSS variables. */
export async function highlightCode(code: string, lang?: string | null): Promise<string> {
	highlighter ??= createHighlighter({ themes: Object.values(THEMES), langs: [...LANGUAGES] });
	const shiki = await highlighter;
	return shiki.codeToHtml(code.trim(), {
		lang: pickLanguage(lang),
		themes: THEMES,
		defaultColor: false
	});
}

/**
 * mdsvex `highlighter`. The result is Svelte markup, so the HTML goes in through
 * `{@html}`; `$` becomes an entity so text like `$app/env/private` never shows up
 * as a module specifier in the compiled page.
 */
export async function highlightMarkdown(code: string, lang?: string | null): Promise<string> {
	const html = await highlightCode(code, lang);
	return `{@html ${JSON.stringify(html.replaceAll('$', '&#36;'))}}`;
}
