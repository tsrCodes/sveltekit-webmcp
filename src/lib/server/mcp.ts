import type { RequestEvent } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import type { ToolHints } from '#lib/core/annotations.js';
import { createLimiter, type Limiter, type RateLimit } from '#lib/core/limit.js';
import { assertToolName } from '#lib/core/register.js';
import { runTool } from '#lib/core/run.js';
import { toJsonSchema, type InferSchemaOutput, type ToolSchema } from '#lib/core/schema.js';
import {
	asRequest,
	RPC_ERRORS,
	rpcError,
	rpcResult,
	RpcFailure,
	type RpcRequest
} from '#lib/server/jsonrpc.js';

/** A tool served to non-browser agents over MCP. */
export interface ServerTool<
	S extends ToolSchema | undefined = ToolSchema | undefined
> extends ToolHints {
	name: string;
	title?: string;
	description: string;
	input?: S;
	output?: ToolSchema;
	/** Must be `true` for the tool to be served. Nothing is exposed by accident. */
	server: boolean;
	/** Per-process rate limit. Per-user limits stay the app's job. */
	limit?: RateLimit;
	/** Runs on the server with the request event, so `locals` carries your auth. */
	execute: (input: InferSchemaOutput<S>, event: RequestEvent) => unknown;
}

/** A server tool of any input type, as accepted by `mcpHandle()`. */
export type AnyServerTool = Omit<ServerTool, 'input' | 'execute'> & {
	input?: ToolSchema;
	execute: (input: never, event: RequestEvent) => unknown;
};

/** Define a server tool with the input type inferred from its schema. */
export function serverTool<S extends ToolSchema | undefined = undefined>(
	tool: ServerTool<S>
): ServerTool<S> {
	return tool;
}

export interface McpHandleOptions {
	/** Endpoint path. Default `/mcp`. */
	path?: string;
	tools: readonly AnyServerTool[];
	/** Decide who may call the endpoint, e.g. `({ locals }) => !!locals.user`. Default: everyone. */
	authorize?: (event: RequestEvent) => boolean | Promise<boolean>;
	/** Extra origins allowed to call from a browser. Same-origin is always allowed. */
	allowedOrigins?: readonly string[];
	/** Reported to clients in `serverInfo`. */
	name?: string;
	version?: string;
	instructions?: string;
}

export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

interface Entry {
	tool: AnyServerTool;
	limiter?: Limiter;
}

function mcpAnnotations(tool: AnyServerTool) {
	const annotations = {
		...(tool.title !== undefined && { title: tool.title }),
		...(tool.readOnly && { readOnlyHint: true }),
		...(tool.consequential && { destructiveHint: true }),
		...(tool.untrusted && { openWorldHint: true })
	};
	return Object.keys(annotations).length > 0 ? annotations : undefined;
}

function listEntry(tool: AnyServerTool) {
	const schema = toJsonSchema(tool.input) ?? {};
	const outputSchema = toJsonSchema(tool.output, 'output');
	const annotations = mcpAnnotations(tool);
	return {
		name: tool.name,
		...(tool.title !== undefined && { title: tool.title }),
		description: tool.description,
		inputSchema: { type: 'object', properties: {}, ...schema },
		...(outputSchema !== undefined && { outputSchema }),
		...(annotations !== undefined && { annotations })
	};
}

function negotiate(requested: unknown): string {
	return typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
		? requested
		: SUPPORTED_PROTOCOL_VERSIONS[0];
}

function originAllowed(event: RequestEvent, allowed: readonly string[]): boolean {
	const origin = event.request.headers.get('origin');
	return !origin || origin === event.url.origin || allowed.includes(origin);
}

async function callTool(
	entry: Entry | undefined,
	params: RpcRequest['params'],
	event: RequestEvent
) {
	if (!entry) throw new RpcFailure({ ...RPC_ERRORS.invalidParams, message: 'Unknown tool' });
	const { tool } = entry;
	const execute = tool.execute as (input: unknown, event: RequestEvent) => unknown;
	return runTool(
		{
			name: tool.name,
			description: tool.description,
			input: tool.input,
			output: tool.output,
			hints: tool,
			limiter: entry.limiter,
			// The agent's own client asks the user; the app's authorize() guards access.
			confirm: () => true,
			execute: (input: unknown) => execute(input, event)
		},
		params?.arguments ?? {},
		event.request.signal
	);
}

/**
 * Serve server tools to non-browser agents over MCP Streamable HTTP
 * (JSON responses, no SSE). Only tools marked `server: true` are listed.
 *
 * ```ts
 * export const handle = sequence(auth, mcpHandle({ tools: [getPostsTool], authorize: ({ locals }) => !!locals.user }));
 * ```
 */
export function mcpHandle(options: McpHandleOptions): Handle {
	const path = options.path ?? '/mcp';
	const served = options.tools.filter((tool) => tool.server === true);
	served.forEach((tool) => assertToolName(tool.name));
	const entries = new Map<string, Entry>(
		served.map((tool) => [
			tool.name,
			{ tool, limiter: tool.limit ? createLimiter(tool.limit) : undefined }
		])
	);
	const serverInfo = {
		name: options.name ?? 'sveltekit-webmcp',
		version: options.version ?? '1.0.0'
	};

	const dispatch = async (request: RpcRequest, event: RequestEvent): Promise<unknown> => {
		switch (request.method) {
			case 'initialize':
				return {
					protocolVersion: negotiate(request.params?.protocolVersion),
					capabilities: { tools: { listChanged: false } },
					serverInfo,
					...(options.instructions && { instructions: options.instructions })
				};
			case 'ping':
				return {};
			case 'tools/list':
				return { tools: served.map(listEntry) };
			case 'tools/call':
				return callTool(entries.get(String(request.params?.name)), request.params, event);
			default:
				throw new RpcFailure(RPC_ERRORS.methodNotFound);
		}
	};

	return async ({ event, resolve }) => {
		if (event.url.pathname !== path) return resolve(event);
		if (event.request.method !== 'POST') {
			return new Response(null, { status: 405, headers: { allow: 'POST' } });
		}
		if (!originAllowed(event, options.allowedOrigins ?? [])) {
			return new Response('Forbidden origin', { status: 403 });
		}
		if (options.authorize && !(await options.authorize(event))) {
			return new Response('Unauthorized', { status: 401 });
		}
		let body: unknown;
		try {
			body = await event.request.json();
		} catch {
			return rpcError(null, RPC_ERRORS.parse, 400);
		}
		const request = asRequest(body);
		if (!request) return rpcError(null, RPC_ERRORS.invalidRequest, 400);
		if (request.id === undefined || request.id === null) return new Response(null, { status: 202 });
		try {
			return rpcResult(request.id, await dispatch(request, event));
		} catch (error) {
			if (error instanceof RpcFailure) return rpcError(request.id, error.error);
			throw error;
		}
	};
}
