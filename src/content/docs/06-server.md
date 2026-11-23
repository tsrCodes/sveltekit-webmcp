<script lang="ts">
	import Feature from '#docs/components/Feature.svelte';
	import HeadersDemo from '#docs/demos/HeadersDemo.svelte';
	import McpDemo from '#docs/demos/McpDemo.svelte';
</script>

<Feature id="F19" />

Adds `Origin-Trial` (for the Chrome and Edge origin trials) and `Permissions-Policy: tools=(self)` to HTML responses. An existing `tools` directive set by your app wins.

```ts
// hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { WEBMCP_OT } from '$app/env/private';
import { webmcpHandle } from 'sveltekit-webmcp/server';

export const handle = sequence(webmcpHandle({ originTrialToken: WEBMCP_OT, allow: ['self'] }));
```

<HeadersDemo />

<Feature id="F20" />

The same tools for non-browser agents: a Streamable HTTP MCP endpoint at `/mcp` (JSON responses). Only tools marked `server: true` are listed. Each tool gets the request event, so your existing `handle` and `locals` decide access; pass `authorize` to guard the endpoint. Calls share the browser tools' validation, rate limits and result shape.

```ts
export const handle = sequence(
	auth,
	mcpHandle({
		tools: [
			serverTool({
				name: 'list_todos',
				description: 'List todos',
				readOnly: true,
				server: true,
				execute: (_input, event) => db.todos(event.locals.user)
			}),
			serverTool({
				name: 'search_todos',
				description: 'Search todos',
				input: searchTodosSchema,
				readOnly: true,
				server: true,
				execute: (input) => searchTodos(input) // a remote query works too
			})
		],
		authorize: ({ locals }) => !!locals.user
	})
);
```

<McpDemo />
