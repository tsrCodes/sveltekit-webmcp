<script lang="ts">
	import { tool } from '#lib/index.js';
	import { Button } from '#docs/components/ui/button/index.js';
	import Demo from '#docs/components/Demo.svelte';
	import ToolState from '#docs/components/ToolState.svelte';

	let balance = $state(100);
	const transfer = tool({
		name: 'docs_transfer_points',
		description: 'Move demo points out of the balance',
		consequential: true,
		input: {
			type: 'object',
			properties: { amount: { type: 'integer', minimum: 1, maximum: 50 } },
			required: ['amount']
		},
		execute: ({ amount }) => {
			if (Number(amount) > balance) throw new Error(`Only ${balance} points left`);
			balance -= Number(amount);
			return `Moved ${String(amount)} points. Balance: ${balance}`;
		}
	});
</script>

<Demo>
	<p>Balance: <strong>{balance}</strong> points</p>
	<div><Button onclick={() => transfer.call({ amount: 10 })}>Transfer 10 points</Button></div>
	<ToolState tool={transfer} />
</Demo>
