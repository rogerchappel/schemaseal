import { findPin, readConfig } from './config.js';
import { sha256File } from './crypto.js';
import { schemaDrift } from './drift.js';
import { parseData } from './io.js';
import { redactValue } from './redact.js';
import { validate } from './schema.js';
import type { CheckOptions, CheckReport, FileCheckResult, SchemaPin } from './types.js';

export async function checkFiles(files: string[], options: CheckOptions): Promise<CheckReport> {
  const config = await readConfig(options.configPath);
  let pin: SchemaPin | undefined;
  if (options.schemaPath) {
    pin = {
      name: options.schemaName ?? options.schemaPath,
      schemaPath: options.schemaPath,
      schemaHash: (await sha256File(options.schemaPath)).hash,
      schema: parseData((await sha256File(options.schemaPath)).text, options.schemaPath),
      pinnedAt: '1970-01-01T00:00:00.000Z',
      schemaBytes: (await sha256File(options.schemaPath)).bytes,
      tool: 'schemaseal@0.1.0'
    };
  } else {
    pin = findPin(config, options.schemaName);
  }
  if (!pin) throw new Error('No schema selected. Run `schemaseal pin <schema>` or pass --schema.');

  const results: FileCheckResult[] = [];
  for (const file of [...files].sort()) {
    const raw = await sha256File(file);
    const data = options.redact ? redactValue(parseData(raw.text, file)) : parseData(raw.text, file);
    const findings = validate(pin.schema, data, file).sort((a, b) => `${a.file}:${a.path}:${a.code}`.localeCompare(`${b.file}:${b.path}:${b.code}`));
    results.push({ file, ok: findings.every((finding) => finding.severity !== 'error'), hash: raw.hash, bytes: raw.bytes, findings });
  }
  const drift = await schemaDrift(config.pins);
  const errors = results.flatMap((result) => result.findings).filter((finding) => finding.severity === 'error').length;
  const warnings = results.flatMap((result) => result.findings).filter((finding) => finding.severity === 'warning').length;
  return {
    tool: 'schemaseal',
    version: '0.1.0',
    generatedAt: '1970-01-01T00:00:00.000Z',
    schema: { name: pin.name, path: pin.schemaPath, hash: pin.schemaHash },
    files: results,
    drift,
    summary: { checked: results.length, passed: results.filter((result) => result.ok).length, failed: results.filter((result) => !result.ok).length, findings: errors + warnings, errors, warnings }
  };
}
