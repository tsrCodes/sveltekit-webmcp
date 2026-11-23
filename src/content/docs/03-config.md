<script lang="ts">
	import Feature from '#docs/components/Feature.svelte';
	import ConfigDemo from '#docs/demos/ConfigDemo.svelte';
	import ConfirmDemo from '#docs/demos/ConfirmDemo.svelte';
	import SupportDemo from '#docs/demos/SupportDemo.svelte';
	import ToolListDemo from '#docs/demos/ToolListDemo.svelte';
</script>

<Feature id="F5" />

Optional app-wide settings, set once in the root layout and passed down through `createContext`, so nothing leaks between users during SSR. Without it you get sane defaults: no polyfill, `window.confirm` for confirmation, no prefix.

```svelte
<!-- +layout.svelte -->
<script lang="ts">
	import { setWebMCP } from 'sveltekit-webmcp';

	setWebMCP({
		polyfill: () => import('@w3c/webmcp-polyfill'), // or true
		prefix: 'shop_',
		confirm: (request) => confirmDialog.ask(request),
		onError: (error, toolName) => console.error(toolName, error),
		exposedTo: []
	});
</script>
```

<ConfigDemo />

<Feature id="F9" />

Tools marked `consequential` ask before running. The request carries the tool name, its description and the validated input. Declining returns an `isError` “User declined” result. Bring your own dialog; this site uses an alert dialog from shadcn-svelte.

<ConfirmDemo />

<Feature id="F10" />

`registeredTools.current` reads `getTools()` and stays fresh through `createSubscriber` on `toolchange`. Use it to show what the agent can do here.

<ToolListDemo />

<Feature id="F12" />

`polyfill: true` lazy-loads `@w3c/webmcp-polyfill` in the browser only when the native API is missing (install it first). A function lets you load it yourself. Without a polyfill the package checks every 500 ms for 10 s, for extensions that inject the API late. `isSupported.current` is reactive.

<SupportDemo />
