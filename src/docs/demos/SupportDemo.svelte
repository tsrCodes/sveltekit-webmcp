<script lang="ts">
	import { isSupported } from '#lib/index.js';
	import Demo from '#docs/components/Demo.svelte';
</script>

<Demo>
	<p>
		isSupported.current: <strong>{isSupported.current}</strong>
		<span class="text-muted-foreground">
			({isSupported.current ? 'tools can be registered' : 'no model context yet'})
		</span>
	</p>
</Demo>
