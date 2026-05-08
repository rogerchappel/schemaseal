export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface SchemaPin {
  name: string;
  schemaPath: string;
  schemaHash: string;
  schema: JsonValue;
  pinnedAt: string;
  schemaBytes: number;
  tool: string;
}

export interface SchemaSealConfig {
  version: 1;
  pins: SchemaPin[];
}

export type Severity = 'info' | 'warning' | 'error';

export interface Finding {
  severity: Severity;
  code: string;
  file: string;
  path: string;
  message: string;
  expected?: string;
  actual?: string;
}

export interface FileCheckResult {
  file: string;
  ok: boolean;
  hash: string;
  bytes: number;
  findings: Finding[];
}

export interface DriftEntry {
  pinName: string;
  schemaPath: string;
  pinnedHash: string;
  currentHash: string | null;
  status: 'same' | 'changed' | 'missing';
}

export interface CheckReport {
  tool: 'schemaseal';
  version: string;
  generatedAt: string;
  schema: {
    name: string;
    path: string;
    hash: string;
  };
  files: FileCheckResult[];
  drift: DriftEntry[];
  summary: {
    checked: number;
    passed: number;
    failed: number;
    findings: number;
    errors: number;
    warnings: number;
  };
}

export interface CheckOptions {
  schemaPath?: string;
  schemaName?: string;
  configPath: string;
  redact: boolean;
}
