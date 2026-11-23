import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	// Shared with agents through pageContextTool (data: ['product']).
	product: { name: 'Desk lamp', price: 39, inStock: true },
	// Not listed in `data`, so agents never see it.
	internalNotes: 'Supplier margin 42%'
});
