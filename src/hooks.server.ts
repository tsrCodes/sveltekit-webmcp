import { sequence } from '@sveltejs/kit/hooks';
import { WEBMCP_OT } from '$app/env/private';
import { mcpHandle, webmcpHandle } from '#lib/server/index.js';
import { serverTools } from './demo/server-tools.js';

export const handle = sequence(
	webmcpHandle({ originTrialToken: WEBMCP_OT, allow: ['self'] }),
	mcpHandle({ tools: serverTools, name: 'sveltekit-webmcp-docs' })
);
