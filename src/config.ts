import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stableStringify } from './crypto.js';
import type { SchemaPin, SchemaSealConfig } from './types.js';

export const DEFAULT_CONFIG_PATH = '.schemaseal/pins.json';

export function emptyConfig(): SchemaSealConfig {
  return { version: 1, pins: [] };
}

export async function readConfig(configPath = DEFAULT_CONFIG_PATH): Promise<SchemaSealConfig> {
  try {
    const parsed = JSON.parse(await readFile(configPath, 'utf8')) as SchemaSealConfig;
    if (parsed.version !== 1 || !Array.isArray(parsed.pins)) throw new Error('invalid pins file');
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
