import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const ORANGE = '#ff3e00';
const GREY = '#8a8a8a';

function read(name: string): string {
	return readFileSync(new URL(`./assets/${name}`, import.meta.url), 'utf8');
}

function strokeWidth(svg: string): number {
	return Number(svg.match(/stroke-width="([\d.]+)"/)?.[1]);
}

describe.each(['favicon.svg', 'logo.svg'])('%s', (name) => {
	test('draws a grey page and an orange agent joined by <>', () => {
		const svg = read(name);
		expect(svg).toMatch(new RegExp(`<rect\\b[^>]*stroke="${GREY}"`));
		expect(svg).toMatch(new RegExp(`<circle\\b[^>]*stroke="${ORANGE}"`));
		expect(svg.match(new RegExp(`<path\\b[^>]*stroke="${ORANGE}"`, 'g'))).toHaveLength(2);
	});

	test('is our own mark, with no third-party logo inside', () => {
		expect(read(name)).not.toMatch(/<svg\b[^>]*viewBox="0 0 107 128"/);
	});
});

test('the favicon uses heavier strokes so it still reads in a browser tab', () => {
	expect(strokeWidth(read('favicon.svg'))).toBeGreaterThan(strokeWidth(read('logo.svg')));
});
