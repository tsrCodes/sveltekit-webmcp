<script lang="ts">
	import {
		tool,
		type MaybeGetter,
		type Tool,
		type ToolOptions,
		type ToolSchema
	} from '#lib/index.js';

	interface Props {
		options: MaybeGetter<ToolOptions<ToolSchema | undefined>>;
		onTool?: (instance: Tool<ToolSchema | undefined>) => void;
	}

	let { options, onTool }: Props = $props();

	// svelte-ignore state_referenced_locally
	const instance = tool(options);
	// svelte-ignore state_referenced_locally
	onTool?.(instance);
</script>

<p data-testid="status">{instance.registered ? 'registered' : 'idle'}</p>
<p data-testid="calls">{instance.callCount}</p>
