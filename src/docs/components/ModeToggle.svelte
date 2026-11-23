<script lang="ts">
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '#docs/components/ui/button/index.js';
</script>

<Button variant="ghost" size="icon" onclick={toggleMode}>
	<SunIcon class="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
	<MoonIcon class="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
	<span class="sr-only">Toggle dark mode</span>
</Button>
