/**
 * Short annotation names used across the package, mapped to the hint names
 * of the WebMCP draft. This is the only file that knows the spec spelling,
 * so a rename in the draft is a one-line change here.
 */
export interface ToolHints {
	/** The tool only reads data. Maps to `readOnlyHint`. */
	readOnly?: boolean;
	/** The tool does something significant or hard to undo. Maps to `consequentialHint`. */
	consequential?: boolean;
	/** The tool may return content written by other users. Maps to `untrustedContentHint`. */
	untrusted?: boolean;
	/** The tool is meant for developer tooling. Maps to `debugging`. */
	debugging?: boolean;
}

/** Annotation object in the shape the WebMCP draft expects. */
export interface SpecAnnotations {
	readOnlyHint?: boolean;
	consequentialHint?: boolean;
	untrustedContentHint?: boolean;
	debugging?: boolean;
}

const HINT_NAMES = {
	readOnly: 'readOnlyHint',
	consequential: 'consequentialHint',
	untrusted: 'untrustedContentHint',
	debugging: 'debugging'
} as const satisfies Record<keyof ToolHints, keyof SpecAnnotations>;

const SHORT_NAMES = Object.keys(HINT_NAMES) as (keyof ToolHints)[];

/**
 * Turn short hint names into spec annotations. Only hints set to `true` are
 * kept, so a tool without hints sends no `annotations` field at all.
 */
export function toSpecAnnotations(hints: ToolHints): SpecAnnotations | undefined {
	const entries = SHORT_NAMES.filter((key) => hints[key] === true).map(
		(key) => [HINT_NAMES[key], true] as const
	);
	return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Read spec annotations back into short names (used by devtools and tests). */
export function fromSpecAnnotations(annotations: SpecAnnotations | undefined): ToolHints {
	if (!annotations) return {};
	const entries = SHORT_NAMES.filter((key) => annotations[HINT_NAMES[key]] === true).map(
		(key) => [key, true] as const
	);
	return Object.fromEntries(entries);
}
