import type {
	StandardJSONSchemaV1,
	StandardSchemaV1,
	StandardTypedV1
} from '@standard-schema/spec';
import { devWarn } from '#lib/core/dev.js';
import { validateJsonSchema, type JsonSchema } from '#lib/core/json-validate.js';

export type { JsonSchema };

/**
 * Anything a tool accepts as `input` or `output`: a Standard Schema (Zod,
 * ArkType, Valibot...), a Standard JSON Schema, or a raw JSON Schema object.
 */
export type ToolSchema = StandardTypedV1 | JsonSchema;

/** Value a schema produces after validation. Raw JSON Schemas give a loose record. */
export type InferSchemaOutput<S> = S extends StandardTypedV1
	? StandardTypedV1.InferOutput<S>
	: Record<string, unknown>;

/** Value a schema accepts before validation. */
export type InferSchemaInput<S> = S extends StandardTypedV1
	? StandardTypedV1.InferInput<S>
	: Record<string, unknown>;

export interface SchemaIssue {
	message: string;
	path?: (string | number)[];
}

export type ValidationResult<T> =
	{ success: true; value: T } | { success: false; issues: SchemaIssue[] };

const JSON_SCHEMA_TARGETS = ['draft-2020-12', 'draft-07'] as const;

function isStandard(schema: ToolSchema): schema is StandardTypedV1 {
	return typeof schema === 'object' && schema !== null && '~standard' in schema;
}

function hasValidate(schema: StandardTypedV1): schema is StandardSchemaV1 {
	return typeof (schema as StandardSchemaV1)['~standard'].validate === 'function';
}

function hasJsonSchema(schema: StandardTypedV1): schema is StandardJSONSchemaV1 {
	const converter = (schema as StandardJSONSchemaV1)['~standard'].jsonSchema;
	return typeof converter?.input === 'function';
}

function pathKey(segment: PropertyKey | StandardSchemaV1.PathSegment): string | number {
	const key = typeof segment === 'object' ? segment.key : segment;
	return typeof key === 'number' ? key : String(key);
}

function toIssue(issue: StandardSchemaV1.Issue): SchemaIssue {
	return issue.path && issue.path.length > 0
		? { message: issue.message, path: issue.path.map(pathKey) }
		: { message: issue.message };
}

/**
 * Convert a schema to JSON Schema for agents. Returns `undefined` when the
 * schema has no JSON Schema form (a Standard Schema without the JSON
 * extension), in which case the tool is registered without a schema.
 */
export function toJsonSchema(
	schema: ToolSchema | undefined,
	direction: 'input' | 'output' = 'input'
): JsonSchema | undefined {
	if (schema === undefined) return undefined;
	if (!isStandard(schema)) return schema;
	if (!hasJsonSchema(schema)) return undefined;
	const convert = schema['~standard'].jsonSchema[direction];
	for (const target of JSON_SCHEMA_TARGETS) {
		try {
			return convert({ target });
		} catch {
			// The library may not support this target; try the next one.
		}
	}
	return undefined;
}

/** True when the schema cannot be sent to agents as JSON Schema. */
export function lacksJsonSchema(schema: ToolSchema | undefined): boolean {
	return schema !== undefined && toJsonSchema(schema) === undefined;
}

/**
 * Validate a value. Standard Schemas use their own validator; raw JSON
 * Schemas (and JSON-only Standard Schemas) use the built-in checker.
 */
export async function validate<T = unknown>(
	schema: ToolSchema | undefined,
	value: unknown
): Promise<ValidationResult<T>> {
	if (schema === undefined) return { success: true, value: value as T };
	if (isStandard(schema) && hasValidate(schema)) {
		const result = await schema['~standard'].validate(value);
		return result.issues
			? { success: false, issues: result.issues.map(toIssue) }
			: { success: true, value: result.value as T };
	}
	const json = toJsonSchema(schema);
	if (json === undefined) {
		devWarn('A schema has neither a validator nor a JSON Schema form; input is not validated.');
		return { success: true, value: value as T };
	}
	const issues = validateJsonSchema(json, value);
	return issues.length > 0 ? { success: false, issues } : { success: true, value: value as T };
}

/** One line per issue, with the field path first, for agent-facing messages. */
export function formatIssues(issues: readonly SchemaIssue[]): string {
	return issues
		.map((issue) =>
			issue.path && issue.path.length > 0
				? `${issue.path.join('.')}: ${issue.message}`
				: issue.message
		)
		.join('\n');
}
