import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	WEBMCP_OT: {
		description: 'Origin trial token for WebMCP in Chrome or Edge (optional)',
		schema: (value) => value ?? ''
	}
});
