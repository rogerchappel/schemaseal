import path from 'node:path';
import { readConfig, upsertPin, writeConfig } from './config.js';
import { sha256File } from './crypto.js';
import { parseData } from './io.js';
import { redactValue } from './redact.js';
import type { SchemaPin } from './types.js';

export interface PinOptions {
  name: string;
  configPath: string;
  redact: boolean;
}

export async function pinSchema(schemaPath: string, options: PinOptions): Promise<SchemaPin> {
  const file = await sha256File(schemaPath);
  const schema = parseData(file.text, schemaPath);
  const pin: SchemaPin = {
    name: options.name,
    schemaPath: path.relative(process.cwd(), schemaPath).split(path.sep).join('/'),
    schemaHash: file.hash,
    schema: options.redact ? redactValue(schema) : schema,
    pinnedAt: '1970-01-01T00:00:00.000Z',
    schemaBytes: file.bytes,
    tool: 'schemaseal@0.1.0'
  };
  const config = await readConfig(options.configPath);
  await writeConfig(upsertPin(config, pin), options.configPath);
  return pin;
}
