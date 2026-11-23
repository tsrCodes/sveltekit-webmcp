<script lang="ts">
	import Feature from '#docs/components/Feature.svelte';
	import DevtoolsDemo from '#docs/demos/DevtoolsDemo.svelte';
</script>

<Feature id="F23" />

A floating panel that renders only when `dev` from `$app/env` is true (pass `force` to show it elsewhere, as this site does). It lists live tools, shows recent calls with input, result, errors and timing, and lets you fire a tool by hand through the model context, the same path an agent takes. Theme it with `--webmcp-*` custom properties.

```svelte
<!-- +layout.svelte -->
<script lang="ts">
	import { WebMCPDevtools } from 'sveltekit-webmcp/devtools';
</script>

<WebMCPDevtools />
<!-- theme it -->
<WebMCPDevtools --webmcp-accent="hotpink" --webmcp-bg="#fff" --webmcp-fg="#111" />
```

<DevtoolsDemo />
