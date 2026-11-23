/** Extra load data for docs pages whose demos need it, keyed by slug. */
export const PAGE_DATA: Record<string, Record<string, unknown>> = {
	navigation: {
		// Shared with agents through pageContextTool (data: ['product']).
		product: { name: 'Desk lamp', price: 39, inStock: true },
		// Not listed in `data`, so agents never see it.
		internalNotes: 'Supplier margin 42%'
	}
};
