/** A text block, in the same shape MCP uses for tool results. */
export interface TextContent {
	type: 'text';
	text: string;
}

/**
 * Normalised tool result. Agents read `content`; tools with an output
 * schema also carry the raw value in `structuredContent`.
 */
export interface ToolResult {
	content: TextContent[];
	structuredContent?: unknown;
	isError?: boolean;
}

const OK_TEXT = 'ok';

function text(value: string): TextContent {
	return { type: 'text', text: value };
}

export function isToolResult(value: unknown): value is ToolResult {
	if (typeof value !== 'object' || value === null) return false;
	const content = (value as { content?: unknown }).content;
	return (
		Array.isArray(content) &&
		content.every(
			(block) =>
				typeof block === 'object' &&
				block !== null &&
				(block as TextContent).type === 'text' &&
				typeof (block as TextContent).text === 'string'
		)
	);
}

function stringify(value: unknown): string {
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
}

export function textResult(value: string): ToolResult {
	return { content: [text(value)] };
}

export function errorResult(message: string): ToolResult {
	return { content: [text(message)], isError: true };
}

/** Readable message for anything thrown. */
export function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message || error.name;
	if (typeof error === 'string') return error;
	return stringify(error);
}

/**
 * Turn whatever `execute` returned into a `ToolResult`:
 * string -> text, `undefined` -> "ok", anything else -> JSON text.
 * When the tool declares an output schema, objects also go in
 * `structuredContent`. A value that already is a `ToolResult` passes through.
 */
export function normalizeResult(value: unknown, structured = false): ToolResult {
	if (isToolResult(value)) return value;
	if (value === undefined) return textResult(OK_TEXT);
	if (typeof value === 'string') return textResult(value);
	const result = textResult(stringify(value));
	return structured ? { ...result, structuredContent: value } : result;
}

/**
 * What the spec `execute` callback hands back to the browser. A successful
 * structured result is returned raw so it matches the declared
 * `outputSchema`; everything else is returned as the `ToolResult` object.
 */
export function toWire(result: ToolResult): unknown {
	if (!result.isError && result.structuredContent !== undefined) return result.structuredContent;
	return result;
}

/** Read a value returned by `executeTool()` (a JSON string) back into a `ToolResult`. */
export function fromWire(raw: unknown): ToolResult {
	let value = raw;
	if (typeof raw === 'string') {
		try {
			value = JSON.parse(raw);
		} catch {
			return textResult(raw);
		}
	}
	return normalizeResult(value, typeof value === 'object' && value !== null);
}

// Zero-width, bidi control, word-joiner and Unicode tag characters. These can
// hide instructions from people while agents still read them.
const INVISIBLE_RANGES: readonly (readonly [number, number])[] = [
	[0x200b, 0x200f],
	[0x202a, 0x202e],
	[0x2060, 0x2064],
	[0x2066, 0x2069],
	[0xfeff, 0xfeff],
	[0xe0000, 0xe007f]
];

function isInvisible(codePoint: number): boolean {
	return INVISIBLE_RANGES.some(([from, to]) => codePoint >= from && codePoint <= to);
}

/** Code points of invisible characters found in `value`, as `U+XXXX` strings. */
export function findInvisibleChars(value: string): string[] {
	const codes = [...value]
		.map((char) => char.codePointAt(0) ?? 0)
		.filter(isInvisible)
		.map((code) => `U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
	return [...new Set(codes)];
}

/** All text of a result joined, for checks such as invisible characters. */
export function resultText(result: ToolResult): string {
	return result.content.map((block) => block.text).join('\n');
}
