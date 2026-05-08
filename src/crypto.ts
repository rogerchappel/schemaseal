import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export function sha256Text(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value), null, 2) + '\n';
}

export function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) output[key] = sortValue(input[key]);
    return output;
  }
  return value;
}

export async function sha256File(path: string): Promise<{ hash: string; bytes: number; text: string }> {
  const text = await readFile(path, 'utf8');
  return { hash: sha256Text(text), bytes: Buffer.byteLength(text), text };
}
