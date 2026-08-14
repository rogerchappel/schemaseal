import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readConfig } from '../src/config.js';

const validPin = {
  name: 'tool',
  schemaPath: 'schema.json',
  schemaHash: 'abc123',
  schema: { type: 'object' },
  pinnedAt: '1970-01-01T00:00:00.000Z',
  schemaBytes: 17,
  tool: 'schemaseal@0.1.0'
};

test('reads a complete pins file', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-config-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const configPath = join(directory, 'pins.json');
  const config = { version: 1, pins: [validPin] };
  await writeFile(configPath, JSON.stringify(config));
  assert.deepEqual(await readConfig(configPath), config);
});

test('rejects null and incomplete pins with path-specific errors', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-config-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const configPath = join(directory, 'pins.json');

  const cases: Array<[unknown, RegExp]> = [
    [null, /\$ must be an object/],
    [{ version: 1, pins: [null] }, /\$\.pins\[0\] must be an object/],
    ...Object.keys(validPin).map((field) => {
      const incomplete = { ...validPin } as Record<string, unknown>;
      delete incomplete[field];
      return [{ version: 1, pins: [incomplete] }, new RegExp(`\\$\\.pins\\[0\\]\\.${field} must be`)] as [unknown, RegExp];
    })
  ];

  for (const [value, message] of cases) {
    await writeFile(configPath, JSON.stringify(value));
    await assert.rejects(readConfig(configPath), message);
  }
});

test('rejects invalid root, pin, schema, and metadata types', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-config-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const configPath = join(directory, 'pins.json');
  const cases: Array<[unknown, RegExp]> = [
    [{ version: '1', pins: [] }, /\$\.version must equal 1/],
    [{ version: 1, pins: {} }, /\$\.pins must be an array/],
    [{ version: 1, pins: [{ ...validPin, schema: [] }] }, /\.schema must be an object/],
    [{ version: 1, pins: [{ ...validPin, schemaHash: 123 }] }, /\.schemaHash must be a string/],
    [{ version: 1, pins: [{ ...validPin, schemaBytes: -1 }] }, /\.schemaBytes must be a non-negative safe integer/]
  ];

  for (const [value, message] of cases) {
    await writeFile(configPath, JSON.stringify(value));
    await assert.rejects(readConfig(configPath), message);
  }
});
