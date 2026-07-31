import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkFiles } from '../src/check.js';

test('checks JSON and YAML fixtures deterministically', async () => {
  const report = await checkFiles(['examples/configs/good.json', 'examples/configs/good.yaml'], {
    schemaPath: 'examples/schemas/tool.schema.json',
    configPath: '.schemaseal/test-pins.json',
    redact: true
  });
  assert.equal(report.summary.checked, 2);
  assert.equal(report.summary.failed, 0);
  assert.equal(report.generatedAt, '1970-01-01T00:00:00.000Z');
});

test('reports schema violations for bad fixture', async () => {
  const report = await checkFiles(['examples/configs/bad.json'], {
    schemaPath: 'examples/schemas/tool.schema.json',
    configPath: '.schemaseal/test-pins.json',
    redact: true
  });
  assert.equal(report.summary.failed, 1);
  assert.equal(report.summary.errors >= 1, true);
});

test('fails a file whose only violation is an additional property', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-check-'));
  context.after(() => rm(directory, { recursive: true }));
  const file = join(directory, 'extra.json');
  await writeFile(file, JSON.stringify({ name: 'ok', version: '1', tools: [], unexpected: true }));

  const report = await checkFiles([file], {
    schemaPath: 'examples/schemas/tool.schema.json',
    configPath: '.schemaseal/test-pins.json',
    redact: true
  });

  assert.equal(report.files[0].ok, false);
  assert.deepEqual(report.summary, { checked: 1, passed: 0, failed: 1, findings: 1, errors: 1, warnings: 0 });
});
