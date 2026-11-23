<script lang="ts">
	import Feature from '#docs/components/Feature.svelte';
	import ToolsDemos from '#docs/demos/tools/ToolsDemos.svelte';
	import { ToolsDemo } from '#docs/demos/tools/tools-demo.svelte.js';

	const demo = new ToolsDemo();
</script>

Every demo on this page registers a real tool. Open the WebMCP panel (bottom right) to see them and run them the way an agent would.

<Feature id="F1" />

Call `tool()` during component init. It registers on mount and unregisters on destroy. Input is validated before `execute`; bad input comes back as an `isError` result listing the issues, so the agent can retry.

```ts
const addTodo = tool({
	name: 'add_todo',
	description: 'Add an item to the todo list',
	input: toStandardJsonSchema(v.object({ text: v.pipe(v.string(), v.minLength(1)) })),
	execute: ({ text }) => {
		todos.push(text);
		return `Added "${text}"`;
	}
});
```

<ToolsDemos {demo} feature="F1" />

<Feature id="F2" />

Pass a getter instead of an object. The tool re-registers only when its agent-visible shape (name, title, description, schemas, annotations) changes. `execute` is always read fresh, so closures over `$state` never go stale.

```ts
const counter = tool(() => ({
	name: 'increment',
	description: t('tools.increment'), // locale change -> re-register
	enabled, // F3
	execute: () => `Counter is now ${++count}`
}));
```

<ToolsDemos {demo} feature="F2" />

<Feature id="F3" />

`enabled: false` unregisters the tool; `true` registers it again.

<ToolsDemos {demo} feature="F3" />

<Feature id="F6" />

Each tool has `registered`, `running`, `error` and `callCount` as `$state`, and `lastResult`/`lastInput` as `$state.raw`. `tool.call(input)` runs it through the same validation path.

<ToolsDemos {demo} feature="F6" />

<Feature id="F7" />

Return a string for text, an object for JSON text, or nothing for `"ok"`. Throwing gives an `isError` result, never an unhandled rejection. With an `output` schema the raw object is returned as structured content and checked in development. `execute` also receives a `signal` that aborts on cancel or unmount.

<ToolsDemos {demo} feature="F7" />

<Feature id="F8" />

Short names map to the draft's hints in one place: `readOnly` → `readOnlyHint`, `consequential` → `consequentialHint`, `untrusted` → `untrustedContentHint`, `debugging` → `debugging`.

<ToolsDemos {demo} feature="F8" />

<Feature id="F11" />

If the browser rejects a registration (duplicate name, blocked by policy, bad schema) the tool's `error` is set and `onError` from `setWebMCP()` is called.

<ToolsDemos {demo} feature="F11" />

<Feature id="F21" />

`limit: { calls: 3, per: '10s' }` turns extra calls into an `isError` “Rate limited” result. This is client side; server limits stay your job.

<ToolsDemos {demo} feature="F21" />

<Feature id="F22" />

`untrusted: true` marks tools that return user-written text. In development a warning is logged when the result contains invisible Unicode, a common way to hide instructions.

<ToolsDemos {demo} feature="F22" />
