import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function cli(...args: string[]) {
  return spawnSync(process.execPath, ['dist/src/index.js', ...args], { encoding: 'utf8' });
}

test('rejects malformed options before IO', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-options-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const schema = join(directory, 'schema.json');
  const data = join(directory, 'data.json');
  const config = join(directory, 'pins.json');
  await writeFile(schema, JSON.stringify({ type: 'object' }));
  await writeFile(data, '{}');

  for (const [args, message] of [
    [['check', data, '--schema', schema, '--bogus', 'value'], /Unknown option --bogus/],
    [['check', data, '--schema', schema, '--schema', schema], /Option --schema may only be specified once/],
    [['check', data, '--schema', schema, '--name', 'pin'], /--schema and --name cannot be used together/]
  ] as const) {
    const result = cli(...args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, message);
  }

  for (const option of ['name', 'config', 'schema', 'format', 'report', 'fail-on']) {
    const result = cli('check', data, `--${option}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(`Option --${option} requires a value`));
  }

  const missingName = cli('pin', schema, '--name', '--config', config);
  assert.notEqual(missingName.status, 0);
  assert.match(missingName.stderr, /Option --name requires a value/);
  await assert.rejects(readFile(config), /ENOENT/);
});

test('enforces command boundaries while preserving valid forms', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-boundaries-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const schema = join(directory, 'schema.json');
  const data = join(directory, 'data.json');
  const config = join(directory, 'pins.json');
  await writeFile(schema, JSON.stringify({ type: 'object' }));
  await writeFile(data, '{}');

  const stray = cli('pin', schema, 'extra', '--config', config);
  assert.notEqual(stray.status, 0);
  assert.match(stray.stderr, /pin accepts exactly one schema path/);
  await assert.rejects(readFile(config), /ENOENT/);

  const wrongCommand = cli('pin', schema, '--format', 'json');
  assert.notEqual(wrongCommand.status, 0);
  assert.match(wrongCommand.stderr, /Option --format is not valid for pin/);

  assert.equal(cli('pin', schema, '--name=fixture', '--config', config, '--no-redact').status, 0);
  assert.equal(cli('check', data, '--name', 'fixture', '--config', config, '--format=json', '--fail-on', 'never').status, 0);
  assert.equal(cli('check', data, '--schema', schema, '--help').status, 0);
});

test('additional property violations fail by default but respect --fail-on never', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-'));
  context.after(() => rm(directory, { recursive: true }));
  const schema = join(directory, 'schema.json');
  const data = join(directory, 'data.json');
  await writeFile(schema, JSON.stringify({ type: 'object', properties: { name: { type: 'string' } }, additionalProperties: false }));
  await writeFile(data, JSON.stringify({ name: 'ok', unexpected: true }));

  const run = (...args: string[]) => spawnSync(process.execPath, ['dist/src/index.js', 'check', data, '--schema', schema, '--format', 'json', ...args], { encoding: 'utf8' });
  const defaultResult = run();
  assert.equal(defaultResult.status, 1, defaultResult.stderr);
  const report = JSON.parse(defaultResult.stdout);
  assert.deepEqual(report.summary, { checked: 1, passed: 0, failed: 1, findings: 1, errors: 1, warnings: 0 });
  assert.equal(report.files[0].findings[0].code, 'additional_property');
  assert.equal(report.files[0].findings[0].severity, 'error');

  const neverResult = run('--fail-on', 'never');
  assert.equal(neverResult.status, 0, neverResult.stderr);
  assert.deepEqual(JSON.parse(neverResult.stdout).summary, report.summary);
});

test('reports inherited property names as missing when required', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-'));
  context.after(() => rm(directory, { recursive: true }));
  const schema = join(directory, 'schema.json');
  const data = join(directory, 'data.json');
  await writeFile(schema, JSON.stringify({ type: 'object', required: ['toString', 'constructor'] }));
  await writeFile(data, JSON.stringify({}));

  const result = spawnSync(process.execPath, ['dist/src/index.js', 'check', data, '--schema', schema, '--format', 'json'], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.summary, { checked: 1, passed: 0, failed: 1, findings: 2, errors: 2, warnings: 0 });
  assert.deepEqual(report.files[0].findings.map((finding: { code: string; path: string }) => [finding.code, finding.path]), [
    ['required_missing', '$.constructor'],
    ['required_missing', '$.toString']
  ]);
});

test('rejects unsupported report formats', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-'));
  context.after(() => rm(directory, { recursive: true }));
  const schema = join(directory, 'schema.json');
  const data = join(directory, 'data.json');
  await writeFile(schema, JSON.stringify({ type: 'object' }));
  await writeFile(data, JSON.stringify({}));

  const result = spawnSync(process.execPath, ['dist/src/index.js', 'check', data, '--schema', schema, '--format', 'xml'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported --format "xml"\. Expected markdown or json\./);
  assert.equal(result.stdout, '');
});

test('rejects unsupported failure thresholds', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-'));
  context.after(() => rm(directory, { recursive: true }));
  const schema = join(directory, 'schema.json');
  const data = join(directory, 'data.json');
  await writeFile(schema, JSON.stringify({ type: 'object' }));
  await writeFile(data, JSON.stringify({}));

  const result = spawnSync(process.execPath, ['dist/src/index.js', 'check', data, '--schema', schema, '--fail-on', 'typo'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported --fail-on "typo"\. Expected error, warning, or never\./);
  assert.equal(result.stdout, '');
});

test('default pinning preserves secret-named schemas and fails invalid data', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-pin-'));
  context.after(() => rm(directory, { recursive: true }));
  const schema = join(directory, 'schema.json');
  const data = join(directory, 'data.json');
  const config = join(directory, 'pins.json');
  await writeFile(schema, JSON.stringify({ type: 'object', required: ['password'], properties: { password: { type: 'string' } } }));
  await writeFile(data, JSON.stringify({ password: 123 }));

  const pin = spawnSync(process.execPath, ['dist/src/index.js', 'pin', schema, '--name', 'credentials', '--config', config], { encoding: 'utf8' });
  assert.equal(pin.status, 0, pin.stderr);
  const stored = JSON.parse(await readFile(config, 'utf8'));
  assert.deepEqual(stored.pins[0].schema.properties.password, { type: 'string' });

  const check = spawnSync(process.execPath, ['dist/src/index.js', 'check', data, '--name', 'credentials', '--config', config, '--format', 'json'], { encoding: 'utf8' });
  assert.equal(check.status, 1, check.stderr);
  assert.equal(JSON.parse(check.stdout).files[0].findings[0].code, 'type_mismatch');
});

test('malformed pins fail cleanly instead of passing validation', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-config-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const data = join(directory, 'data.json');
  const config = join(directory, 'pins.json');
  await writeFile(data, '{}');

  for (const [value, message] of [
    [null, /Invalid pins file .*: \$ must be an object\./],
    [{ version: 1, pins: [{ name: 'incomplete', schemaPath: 'missing.json', schemaHash: 'abc' }] }, /\$\.pins\[0\]\.schema must be an object/]
  ] as const) {
    await writeFile(config, JSON.stringify(value));
    const result = cli('check', data, '--config', config, '--name', 'incomplete', '--format', 'json', '--fail-on', 'never');
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, message);
    assert.doesNotMatch(result.stderr, /TypeError|Cannot read properties/);
  }
});

test('--no-redact preserves the same pin and validation semantics', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemaseal-cli-no-redact-'));
  context.after(() => rm(directory, { recursive: true }));
  const schema = join(directory, 'schema.json');
  const data = join(directory, 'data.json');
  const config = join(directory, 'pins.json');
  await writeFile(schema, JSON.stringify({ type: 'object', properties: { token: { type: 'number' } } }));
  await writeFile(data, JSON.stringify({ token: 'not-a-number' }));

  const pin = spawnSync(process.execPath, ['dist/src/index.js', 'pin', schema, '--name', 'tokens', '--config', config, '--no-redact'], { encoding: 'utf8' });
  assert.equal(pin.status, 0, pin.stderr);
  const check = spawnSync(process.execPath, ['dist/src/index.js', 'check', data, '--name', 'tokens', '--config', config, '--format', 'json', '--no-redact'], { encoding: 'utf8' });
  assert.equal(check.status, 1, check.stderr);
  assert.equal(JSON.parse(check.stdout).files[0].findings[0].code, 'type_mismatch');
});
