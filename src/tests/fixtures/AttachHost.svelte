<script lang="ts">
	import { attachTool } from '#lib/index.js';

	interface Item {
		id: number;
		label: string;
	}

	interface Props {
		items: Item[];
		onOpen?: (item: Item, element: Element | undefined) => void;
	}

	let { items, onOpen }: Props = $props();
</script>

<ul>
	{#each items as item (item.id)}
		<li>
			<button
				{@attach attachTool(() => ({
					name: `open_item_${item.id}`,
					description: `Open ${item.label}`,
					execute: (_input, { element }) => {
						onOpen?.(item, element);
						return `Opened ${item.label}`;
					}
				}))}>{item.label}</button
			>
		</li>
	{/each}
</ul>
