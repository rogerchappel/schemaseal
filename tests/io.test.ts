import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseData } from '../src/io.js';

test('JSONL ignores empty and whitespace-only LF and CRLF records', () => {
  assert.deepEqual(parseData('{"id":1}\n   \n\t\n{"id":2}\n', 'records.jsonl'), [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(parseData('{"id":1}\r\n \t \r\n{"id":2}\r\n', 'records.jsonl'), [{ id: 1 }, { id: 2 }]);
});

test('JSONL parse failures identify the input file and physical line', () => {
  assert.throws(
    () => parseData('{"id":1}\n   \nnot-json\n', 'fixtures/records.jsonl'),
    { message: 'Invalid JSONL record in fixtures/records.jsonl at line 3.' }
  );
});

test('CLI exits nonzero with a deterministic malformed JSONL diagnostic', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'schemaseal-jsonl-'));
  const dataPath = path.join(root, 'records.jsonl');
  const schemaPath = path.join(root, 'schema.json');
  await writeFile(dataPath, '{"id":1}\n \n{"id":\n');
  await writeFile(schemaPath, '{"type":"object"}\n');

  const result = spawnSync(process.execPath, ['dist/src/index.js', 'check', dataPath, '--schema', schemaPath], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, `schemaseal: Invalid JSONL record in ${dataPath} at line 3.\n`);
});
