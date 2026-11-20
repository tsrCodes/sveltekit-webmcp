import type { SchemaIssue } from '#lib/core/schema.js';

/** A plain JSON Schema object, as sent to agents. */
export type JsonSchema = Record<string, unknown>;

type Path = readonly (string | number)[];

const TYPE_CHECKS: Record<string, (value: unknown) => boolean> = {
	string: (value) => typeof value === 'string',
	number: (value) => typeof value === 'number' && Number.isFinite(value),
	integer: (value) => Number.isInteger(value),
	boolean: (value) => typeof value === 'boolean',
	null: (value) => value === null,
	array: (value) => Array.isArray(value),
	object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
};

function issue(message: string, path: Path): SchemaIssue {
	return { message, path: [...path] };
}

function checkType(schema: JsonSchema, value: unknown, path: Path): SchemaIssue[] {
	const types = schema.type === undefined ? [] : [schema.type].flat();
	if (types.length === 0) return [];
	const ok = types.some((type) => TYPE_CHECKS[String(type)]?.(value) ?? false);
	return ok ? [] : [issue(`Expected ${types.join(' or ')}`, path)];
}

function checkValues(schema: JsonSchema, value: unknown, path: Path): SchemaIssue[] {
	const issues: SchemaIssue[] = [];
	if ('const' in schema && value !== schema.const) {
		issues.push(issue(`Expected ${JSON.stringify(schema.const)}`, path));
	}
	if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
		const options = schema.enum.map((option) => JSON.stringify(option)).join(', ');
		issues.push(issue(`Expected one of ${options}`, path));
	}
	if (typeof value === 'string') {
		if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
			issues.push(issue(`Expected at least ${schema.minLength} characters`, path));
		}
		if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
			issues.push(issue(`Expected at most ${schema.maxLength} characters`, path));
		}
	}
	if (typeof value === 'number') {
		if (typeof schema.minimum === 'number' && value < schema.minimum) {
			issues.push(issue(`Expected a number >= ${schema.minimum}`, path));
		}
		if (typeof schema.maximum === 'number' && value > schema.maximum) {
			issues.push(issue(`Expected a number <= ${schema.maximum}`, path));
		}
	}
	return issues;
}

function checkObject(
	schema: JsonSchema,
	value: Record<string, unknown>,
	path: Path
): SchemaIssue[] {
	const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
	const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
	const missing = required
		.filter((key) => value[key] === undefined)
		.map((key) => issue('Required', [...path, key]));
	const nested = Object.entries(properties)
		.filter(([key]) => value[key] !== undefined)
		.flatMap(([key, child]) => validateJsonSchema(child, value[key], [...path, key]));
	const extra =
		schema.additionalProperties === false
			? Object.keys(value)
					.filter((key) => !(key in properties))
					.map((key) => issue('Unknown property', [...path, key]))
			: [];
	return [...missing, ...nested, ...extra];
}

/**
 * Small JSON Schema checker for tools that pass a raw schema instead of a
 * Standard Schema. It covers the keywords agents commonly rely on (type,
 * required, properties, items, enum, const, length and range limits). For
 * anything richer, pass a Standard Schema library such as Zod or Valibot.
 */
export function validateJsonSchema(
	schema: JsonSchema,
	value: unknown,
	path: Path = []
): SchemaIssue[] {
	const typeIssues = checkType(schema, value, path);
	if (typeIssues.length > 0) return typeIssues;
	const issues = checkValues(schema, value, path);
	if (TYPE_CHECKS.object(value) && (schema.properties || schema.required)) {
		issues.push(...checkObject(schema, value as Record<string, unknown>, path));
	}
	if (Array.isArray(value) && typeof schema.items === 'object' && schema.items !== null) {
		const items = schema.items as JsonSchema;
		issues.push(
			...value.flatMap((item, index) => validateJsonSchema(items, item, [...path, index]))
		);
	}
	return issues;
}
