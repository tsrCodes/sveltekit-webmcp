import { describe, expect, expectTypeOf, it } from 'vitest';
import type { WebMCP } from 'webmcp-types';
import type { SpecAnnotations } from '#lib/core/annotations.js';
import { SPEC_EVENTS, type ModelContextLike } from '#lib/core/model-context.js';

// Pinned to `webmcp-types`. If the draft renames a method, an option, an
// annotation or an event, `pnpm check` and this test fail here, and the fix
// lives in `src/lib/core/` only.
describe('spec drift guard', () => {
	it('our model context view matches the draft types', () => {
		expectTypeOf<WebMCP.ModelContext['registerTool']>().toBeFunction();
		expectTypeOf<WebMCP.ModelContext['getTools']>().toBeFunction();
		expectTypeOf<WebMCP.ModelContext['executeTool']>().toBeFunction();
		expectTypeOf<keyof ModelContextLike>().toExtend<keyof WebMCP.ModelContext>();
		expectTypeOf<WebMCP.ModelContextRegisterToolOptions>().toHaveProperty('signal');
		expectTypeOf<WebMCP.ModelContextRegisterToolOptions>().toHaveProperty('exposedTo');
		expectTypeOf<WebMCP.ToolExecuteCallbackOptions>().toHaveProperty('signal');
		expect(true).toBe(true);
	});

	it('annotation names match the draft', () => {
		expectTypeOf<Required<SpecAnnotations>>().toEqualTypeOf<Required<WebMCP.ToolAnnotations>>();
		expect(true).toBe(true);
	});

	it('event names match the draft', () => {
		const names: (keyof WebMCP.ModelContextEventMap)[] = Object.values(SPEC_EVENTS);
		expect(names.sort()).toEqual(['toolactivated', 'toolcancel', 'toolchange']);
	});

	it('tool fields match the draft', () => {
		type Fields = Exclude<keyof WebMCP.ModelContextTool, 'execute'>;
		expectTypeOf<Fields>().toEqualTypeOf<
			'name' | 'title' | 'description' | 'inputSchema' | 'outputSchema' | 'annotations'
		>();
		expect(true).toBe(true);
	});
});
