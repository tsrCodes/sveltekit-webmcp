import { describe, expect, it } from 'vitest';
import { pickPageContext } from '#lib/kit/page-context.svelte.js';
import { remoteArg, withoutToArg } from '#lib/kit/bridge.js';
import { checkNavigation, navigateSchema, routeIds, routeParams } from '#lib/kit/routes.js';

describe('routes', () => {
	it('reads required, optional, rest and matcher params', () => {
		expect(routeParams('/')).toEqual({ required: [], optional: [] });
		expect(routeParams('/[lang=locale]/blog/[slug]/[[page]]/[...rest]')).toEqual({
			required: ['lang', 'slug', 'rest'],
			optional: ['page']
		});
	});

	it('accepts arrays or maps of routes', () => {
		expect(routeIds(['/a', '/b'])).toEqual(['/a', '/b']);
		expect(routeIds({ '/c': { description: 'C' } })).toEqual(['/c']);
		expect(navigateSchema(['/a'])).toMatchObject({
			required: ['route'],
			properties: { route: { enum: ['/a'] } }
		});
	});

	it('checks navigation requests', () => {
		const routes = ['/blog/[slug]/[[page]]'];
		expect(checkNavigation(routes, '/nope')).toBe('Route "/nope" is not allowed');
		expect(checkNavigation(routes, routes[0], { slug: 'a', page: '2' })).toBeUndefined();
		expect(checkNavigation(routes, routes[0], { slug: 'a', extra: 'x' })).toBe(
			'Unknown params for /blog/[slug]/[[page]]: extra'
		);
	});
});

describe('pickPageContext', () => {
	const snapshot = {
		route: { id: '/shop/[id]' },
		params: { id: '42' },
		url: new URL('https://example.com/shop/42?color=red#reviews'),
		data: { product: { name: 'Lamp' }, session: { token: 'secret' } }
	};

	it('returns only the fields that were opted in', () => {
		expect(pickPageContext(snapshot, {})).toEqual({});
		expect(
			pickPageContext(
				snapshot,
				{ routeId: true, params: true, url: true, title: true, data: ['product', 'missing'] },
				'Lamp - Shop'
			)
		).toEqual({
			routeId: '/shop/[id]',
			params: { id: '42' },
			url: { pathname: '/shop/42', search: { color: 'red' } },
			title: 'Lamp - Shop',
			data: { product: { name: 'Lamp' } }
		});
	});
});

describe('remote helpers', () => {
	it('passes input, nothing, or a mapped argument', () => {
		expect(remoteArg({ name: 'a', description: 'a' }, { x: 1 } as never)).toBeUndefined();
		expect(remoteArg({ name: 'a', description: 'a', input: { type: 'object' } }, { x: 1 })).toEqual(
			{ x: 1 }
		);
		expect(
			remoteArg(
				{ name: 'a', description: 'a', input: { type: 'object' }, toArg: (i) => i.x },
				{ x: 1 }
			)
		).toBe(1);
		expect(withoutToArg({ name: 'a', description: 'a', toArg: () => 1 })).toEqual({
			name: 'a',
			description: 'a'
		});
	});
});
