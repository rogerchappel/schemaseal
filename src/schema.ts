import type { Finding, JsonValue } from './types.js';

type SchemaObject = Record<string, unknown>;

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function schemaType(schema: SchemaObject): string[] | undefined {
  const raw = schema.type;
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw) && raw.every((item) => typeof item === 'string')) return raw as string[];
  return undefined;
}

export function validate(schema: JsonValue, data: JsonValue, file: string): Finding[] {
  return validateAt(schema, data, file, '$');
}

function validateAt(schema: JsonValue, data: JsonValue, file: string, pointer: string): Finding[] {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return [];
  const schemaObj = schema as SchemaObject;
  const findings: Finding[] = [];
  const allowedTypes = schemaType(schemaObj);
  const actualType = typeOf(data);
  if (allowedTypes && !allowedTypes.includes(actualType)) {
    findings.push({ severity: 'error', code: 'type_mismatch', file, path: pointer, message: `Expected ${allowedTypes.join(' or ')} but found ${actualType}.`, expected: allowedTypes.join('|'), actual: actualType });
    return findings;
  }

  if (schemaObj.enum && Array.isArray(schemaObj.enum) && !schemaObj.enum.some((item) => JSON.stringify(item) === JSON.stringify(data))) {
    findings.push({ severity: 'error', code: 'enum_mismatch', file, path: pointer, message: 'Value is not in the allowed enum set.' });
  }

  if (actualType === 'object') {
    const objectData = data as Record<string, JsonValue>;
    const required = Array.isArray(schemaObj.required) ? schemaObj.required.filter((item): item is string => typeof item === 'string') : [];
    for (const key of required.sort()) {
      if (!(key in objectData)) findings.push({ severity: 'error', code: 'required_missing', file, path: `${pointer}.${key}`, message: `Required property "${key}" is missing.` });
    }
    const properties = schemaObj.properties && typeof schemaObj.properties === 'object' && !Array.isArray(schemaObj.properties) ? schemaObj.properties as Record<string, JsonValue> : {};
    for (const key of Object.keys(objectData).sort()) {
      if (properties[key]) findings.push(...validateAt(properties[key], objectData[key], file, `${pointer}.${key}`));
      else if (schemaObj.additionalProperties === false) findings.push({ severity: 'warning', code: 'additional_property', file, path: `${pointer}.${key}`, message: `Property "${key}" is not declared in schema.` });
    }
  }

  if (actualType === 'array' && schemaObj.items) {
    (data as JsonValue[]).forEach((item, index) => findings.push(...validateAt(schemaObj.items as JsonValue, item, file, `${pointer}[${index}]`)));
  }

  return findings;
}
