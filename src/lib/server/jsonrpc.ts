// Throws if this module is ever imported in the browser.
import '$app/server';
/** JSON-RPC 2.0 plumbing for the MCP endpoint. */

export type RequestId = string | number;

export interface RpcRequest {
	jsonrpc: '2.0';
	id?: RequestId | null;
	method: string;
	params?: Record<string, unknown>;
}

export const RPC_ERRORS = {
	parse: { code: -32700, message: 'Parse error' },
	invalidRequest: { code: -32600, message: 'Invalid Request' },
	methodNotFound: { code: -32601, message: 'Method not found' },
	invalidParams: { code: -32602, message: 'Invalid params' }
} as const;

export interface RpcError {
	code: number;
	message: string;
}

export class RpcFailure extends Error {
	constructor(readonly error: RpcError) {
		super(error.message);
	}
}

const JSON_HEADERS = { 'content-type': 'application/json' };

export function rpcResult(id: RequestId | null, result: unknown): Response {
	return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), { headers: JSON_HEADERS });
}

export function rpcError(id: RequestId | null, error: RpcError, status = 200): Response {
	return new Response(JSON.stringify({ jsonrpc: '2.0', id, error }), {
		status,
		headers: JSON_HEADERS
	});
}

/** Narrow an unknown body to a single JSON-RPC request, or `undefined`. */
export function asRequest(body: unknown): RpcRequest | undefined {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined;
	const candidate = body as Partial<RpcRequest>;
	if (candidate.jsonrpc !== '2.0' || typeof candidate.method !== 'string') return undefined;
	const { id } = candidate;
	if (id !== undefined && id !== null && typeof id !== 'string' && typeof id !== 'number') {
		return undefined;
	}
	const { params } = candidate;
	if (params !== undefined && (typeof params !== 'object' || params === null)) return undefined;
	return candidate as RpcRequest;
}
