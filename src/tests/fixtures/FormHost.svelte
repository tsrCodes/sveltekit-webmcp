<script lang="ts">
	import { formTool, type FormToolOptions, type RemoteFormLike } from '#lib/kit/index.js';
	import type { ToolSchema } from '#lib/index.js';

	interface Props {
		form: RemoteFormLike;
		options: FormToolOptions<ToolSchema | undefined>;
	}

	let { form, options }: Props = $props();
</script>

<form {@attach formTool(form, options)}>
	<input name="title" />
	<button>Publish</button>
</form>
