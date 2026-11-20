export { tool, Tool, type ToolOptions, type MaybeGetter } from '#lib/tool.svelte.js';
export { attachTool } from '#lib/attach.svelte.js';
export { setWebMCP, getWebMCP, type WebMCPConfig } from '#lib/context.js';
export { registeredTools } from '#lib/registered.svelte.js';
export { isSupported, ready } from '#lib/support.svelte.js';
export { toolActivity, type ToolCall } from '#lib/activity.svelte.js';
export type { ToolHints } from '#lib/core/annotations.js';
export type { RateLimit, LimitWindow } from '#lib/core/limit.js';
export type { ListedTool, PolyfillLoader } from '#lib/core/model-context.js';
export type { ToolResult, TextContent } from '#lib/core/result.js';
export type { ConfirmHandler, ConfirmRequest, ExecuteContext } from '#lib/core/run.js';
export type {
	ToolSchema,
	JsonSchema,
	InferSchemaInput,
	InferSchemaOutput,
	SchemaIssue
} from '#lib/core/schema.js';
