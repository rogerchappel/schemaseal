import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stableStringify } from './crypto.js';
import type { SchemaPin, SchemaSealConfig } from './types.js';

export const DEFAULT_CONFIG_PATH = '.schemaseal/pins.json';

export function emptyConfig(): SchemaSealConfig {
  return { version: 1, pins: [] };
}

function invalidConfig(configPath: string, pointer: string, expectation: string): never {
  throw new Error(`Invalid pins file ${configPath}: ${pointer} ${expectation}.`);
}

function requireString(value: unknown, configPath: string, pointer: string): asserts value is string {
  if (typeof value !== 'string') invalidConfig(configPath, pointer, 'must be a string');
}

function validateConfig(value: unknown, configPath: string): asserts value is SchemaSealConfig {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    invalidConfig(configPath, '$', 'must be an object');
  }
  const config = value as Record<string, unknown>;
  if (config.version !== 1) invalidConfig(configPath, '$.version', 'must equal 1');
  if (!Array.isArray(config.pins)) invalidConfig(configPath, '$.pins', 'must be an array');

  config.pins.forEach((value, index) => {
    const pointer = `$.pins[${index}]`;
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      invalidConfig(configPath, pointer, 'must be an object');
    }
    const pin = value as Record<string, unknown>;
    requireString(pin.name, configPath, `${pointer}.name`);
    requireString(pin.schemaPath, configPath, `${pointer}.schemaPath`);
    requireString(pin.schemaHash, configPath, `${pointer}.schemaHash`);
    if (typeof pin.schema !== 'boolean' && (pin.schema === null || typeof pin.schema !== 'object' || Array.isArray(pin.schema))) {
      invalidConfig(configPath, `${pointer}.schema`, 'must be an object or boolean');
    }
    requireString(pin.pinnedAt, configPath, `${pointer}.pinnedAt`);
    if (typeof pin.schemaBytes !== 'number' || !Number.isSafeInteger(pin.schemaBytes) || pin.schemaBytes < 0) {
      invalidConfig(configPath, `${pointer}.schemaBytes`, 'must be a non-negative safe integer');
    }
    requireString(pin.tool, configPath, `${pointer}.tool`);
  });
}

export async function readConfig(configPath = DEFAULT_CONFIG_PATH): Promise<SchemaSealConfig> {
  try {
    const parsed: unknown = JSON.parse(await readFile(configPath, 'utf8'));
    validateConfig(parsed, configPath);
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyConfig();
    throw error;
  }
}

export async function writeConfig(config: SchemaSealConfig, configPath = DEFAULT_CONFIG_PATH): Promise<void> {
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, stableStringify(config), 'utf8');
}

export function upsertPin(config: SchemaSealConfig, pin: SchemaPin): SchemaSealConfig {
  const pins = config.pins.filter((existing) => existing.name !== pin.name);
  pins.push(pin);
  pins.sort((a, b) => a.name.localeCompare(b.name));
  return { version: 1, pins };
}

export function findPin(config: SchemaSealConfig, nameOrPath?: string): SchemaPin | undefined {
  if (!nameOrPath) return config.pins[0];
  return config.pins.find((pin) => pin.name === nameOrPath || pin.schemaPath === nameOrPath);
}
