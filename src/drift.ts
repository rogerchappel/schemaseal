import { access } from 'node:fs/promises';
import { sha256File } from './crypto.js';
import type { DriftEntry, SchemaPin } from './types.js';

export async function schemaDrift(pins: SchemaPin[]): Promise<DriftEntry[]> {
  const entries: DriftEntry[] = [];
  for (const pin of [...pins].sort((a, b) => a.name.localeCompare(b.name))) {
    let currentHash: string | null = null;
    let status: DriftEntry['status'] = 'missing';
    try {
      await access(pin.schemaPath);
      currentHash = (await sha256File(pin.schemaPath)).hash;
      status = currentHash === pin.schemaHash ? 'same' : 'changed';
    } catch {
      status = 'missing';
    }
    entries.push({ pinName: pin.name, schemaPath: pin.schemaPath, pinnedHash: pin.schemaHash, currentHash, status });
  }
  return entries;
}
