import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkFiles } from '../src/check.js';
import { pinSchema } from '../src/pin.js';

const secretNamedSchema = {
  type: 'object',
  required: ['password', 'token', 'apiKey', 'secret'],
  properties: {
    password: { type: 'string' },
    token: { type: 'string' },
    apiKey: { type: 'string' },
    secret: { type: 'string' }
  }
};

test('stores a semantically faithful and deterministic schema pin', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-pin-'));
  context.after(() => rm(directory, { recursive: true }));
  const schemaPath = join(directory, 'schema.json');
  const firstConfig = join(directory, 'first.json');
  const secondConfig = join(directory, 'second.json');
  await writeFile(schemaPath, JSON.stringify(secretNamedSchema));

  const first = await pinSchema(schemaPath, { name: 'credentials', configPath: firstConfig, redact: true });
  const second = await pinSchema(schemaPath, { name: 'credentials', configPath: secondConfig, redact: false });

  assert.deepEqual(first.schema, secretNamedSchema);
  assert.deepEqual(second.schema, secretNamedSchema);
  assert.equal(await readFile(firstConfig, 'utf8'), await readFile(secondConfig, 'utf8'));
});

test('validates original values through a default-redaction pin', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-pin-check-'));
  context.after(() => rm(directory, { recursive: true }));
  const schemaPath = join(directory, 'schema.json');
  const configPath = join(directory, 'pins.json');
  const dataPath = join(directory, 'data.json');
  await writeFile(schemaPath, JSON.stringify(secretNamedSchema));
  await writeFile(dataPath, JSON.stringify({ password: 123, token: 'ok', apiKey: 'ok', secret: 'ok' }));
  await pinSchema(schemaPath, { name: 'credentials', configPath, redact: true });

  const report = await checkFiles([dataPath], { schemaName: 'credentials', configPath, redact: true });

  assert.equal(report.summary.errors, 1);
  assert.equal(report.files[0].findings[0].code, 'type_mismatch');
  assert.equal(report.files[0].findings[0].path, '$.password');
});
