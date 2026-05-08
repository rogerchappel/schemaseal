import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type { JsonValue } from './types.js';

export async function readDataFile(filePath: string): Promise<JsonValue> {
  const text = await readFile(filePath, 'utf8');
  return parseData(text, filePath);
}

export function parseData(text: string, filePath = '<input>'): JsonValue {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.jsonl')) {
    return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)) as JsonValue;
  }
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return YAML.parse(text) as JsonValue;
  if (lower.endsWith('.json') || lower.endsWith('.schema')) return JSON.parse(text) as JsonValue;
  if (lower.endsWith('.md') || lower.endsWith('.txt')) return text as JsonValue;
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return YAML.parse(text) as JsonValue;
  }
}

export async function writeOutput(outputPath: string | undefined, text: string): Promise<void> {
  if (!outputPath || outputPath === '-') {
    process.stdout.write(text);
    return;
  }
  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, text, 'utf8');
}

export function normalizePath(input: string): string {
  return input.split(path.sep).join('/');
}
