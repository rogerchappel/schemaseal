import test from 'node:test';
import assert from 'node:assert/strict';
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
