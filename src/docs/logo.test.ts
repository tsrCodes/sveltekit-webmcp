import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const ORANGE = '#ff3e00';
const TEETH = 8;

function read(name: string): string {
	return readFileSync(`src/docs/assets/${name}`, 'utf8');
}

function count(svg: string, tag: string): number {
	return svg.match(new RegExp(`<${tag}\\b`, 'g'))?.length ?? 0;
}

describe('site logo', () => {
	test('the favicon is a solid gear ring around the mark', () => {
		const svg = read('favicon.svg');
		expect(count(svg, 'circle')).toBe(1);
		expect(svg).toContain(`stroke="${ORANGE}"`);
		expect(count(svg, 'rect')).toBe(TEETH);
		expect(svg).not.toContain('stroke-opacity');
	});

	test('the large logo adds fading signal arcs on both sides', () => {
		const svg = read('logo.svg');
		expect(count(svg, 'rect')).toBe(TEETH);
		const arcs = svg.match(/<path\b[^>]*stroke-opacity[^>]*>/g) ?? [];
		expect(arcs).toHaveLength(4);
	});
});
