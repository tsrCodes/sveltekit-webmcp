import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const ORANGE = '#ff3e00';
// Two angle brackets, the wrench shaft and the wrench head.
const STROKES = 4;

function read(name: string): string {
	return readFileSync(`src/docs/assets/${name}`, 'utf8');
}

function strokeWidths(svg: string): number[] {
	return [...svg.matchAll(/stroke-width="([\d.]+)"/g)].map(([, width]) => Number(width));
}

describe.each(['favicon.svg', 'logo.svg'])('%s', (name) => {
	test('draws </> with a wrench as the slash, in the brand orange', () => {
		const svg = read(name);
		expect(svg).toContain(`stroke="${ORANGE}"`);
		expect(svg.match(/<path\b/g)).toHaveLength(STROKES);
	});

	test('is our own mark, with no third-party logo inside', () => {
		expect(read(name)).not.toMatch(/<svg\b[^>]*viewBox="0 0 107 128"/);
	});
});

test('the favicon uses heavier strokes so it still reads in a browser tab', () => {
	const small = Math.min(...strokeWidths(read('favicon.svg')));
	const large = Math.max(...strokeWidths(read('logo.svg')));
	expect(small).toBeGreaterThan(large);
});
