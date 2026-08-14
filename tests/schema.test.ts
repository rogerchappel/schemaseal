import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/schema.js';

const schema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: { name: { type: 'string' }, risk: { type: 'string', enum: ['low', 'high'] } }
};

test('validates required type enum and additional property findings', () => {
  const findings = validate(schema, { name: 7, risk: 'tiny', extra: true }, 'fixture.json');
  assert.equal(findings.filter((finding) => finding.severity === 'error').length, 3);
  assert.equal(findings.find((finding) => finding.code === 'additional_property')?.severity, 'error');
});

test('treats an extra-only violation as an error', () => {
  assert.deepEqual(validate(schema, { name: 'ok', extra: true }, 'fixture.json'), [{
    severity: 'error',
    code: 'additional_property',
    file: 'fixture.json',
    path: '$.extra',
    message: 'Property "extra" is not declared in schema.'
  }]);
});

test('passes a matching object', () => {
  assert.deepEqual(validate(schema, { name: 'ok', risk: 'low' }, 'fixture.json'), []);
});

test('applies boolean schemas at the root', () => {
  assert.deepEqual(validate(true, { any: 'value' }, 'fixture.json'), []);
  assert.deepEqual(validate(false, { any: 'value' }, 'fixture.json'), [{
    severity: 'error',
    code: 'false_schema',
    file: 'fixture.json',
    path: '$',
    message: 'Value is rejected by the false schema.'
  }]);
});

test('applies boolean schemas to object properties', () => {
  assert.deepEqual(validate({ properties: { allowed: true, blocked: false } }, {
    allowed: 'anything',
    blocked: 123
  }, 'fixture.json'), [{
    severity: 'error',
    code: 'false_schema',
    file: 'fixture.json',
    path: '$.blocked',
    message: 'Value is rejected by the false schema.'
  }]);
});

test('applies boolean schemas to array items', () => {
  assert.deepEqual(validate({ type: 'array', items: true }, [1, 'two'], 'fixture.json'), []);
  assert.deepEqual(validate({ type: 'array', items: false }, [1, 'two'], 'fixture.json'), [
    {
      severity: 'error',
      code: 'false_schema',
      file: 'fixture.json',
      path: '$[0]',
      message: 'Value is rejected by the false schema.'
    },
    {
      severity: 'error',
      code: 'false_schema',
      file: 'fixture.json',
      path: '$[1]',
      message: 'Value is rejected by the false schema.'
    }
  ]);
});

test('requires own properties when names collide with Object.prototype', () => {
  for (const key of ['toString', 'constructor']) {
    assert.deepEqual(validate({ type: 'object', required: [key] }, {}, 'fixture.json'), [{
      severity: 'error',
      code: 'required_missing',
      file: 'fixture.json',
      path: `$.${key}`,
      message: `Required property "${key}" is missing.`
    }]);
  }
});

test('accepts explicitly supplied own properties with inherited names', () => {
  assert.deepEqual(validate({ type: 'object', required: ['toString', 'constructor'] }, {
    toString: 'value',
    constructor: null
  }, 'fixture.json'), []);
});

test('accepts positive and negative integral numbers as integers', () => {
  const integerSchema = { type: 'integer' };
  assert.deepEqual(validate(integerSchema, 7, 'fixture.json'), []);
  assert.deepEqual(validate(integerSchema, -7, 'fixture.json'), []);
});

test('rejects non-integral numbers as integers', () => {
  assert.deepEqual(validate({ type: 'integer' }, 1.5, 'fixture.json'), [{
    severity: 'error',
    code: 'type_mismatch',
    file: 'fixture.json',
    path: '$',
    message: 'Expected integer but found number.',
    expected: 'integer',
    actual: 'number'
  }]);
});

test('continues to accept integral and non-integral numbers as numbers', () => {
  const numberSchema = { type: 'number' };
  assert.deepEqual(validate(numberSchema, 7, 'fixture.json'), []);
  assert.deepEqual(validate(numberSchema, -1.5, 'fixture.json'), []);
});

test('matches enum objects regardless of property order', () => {
  const enumSchema = {
    enum: [{ name: 'example', metadata: { enabled: true, labels: ['stable', 'local'] } }]
  };

  assert.deepEqual(validate(enumSchema, {
    metadata: { labels: ['stable', 'local'], enabled: true },
    name: 'example'
  }, 'fixture.json'), []);
});

test('preserves array order and primitive distinctions in enum values', () => {
  const cases = [
    { schema: { enum: [[1, 2]] }, data: [2, 1] },
    { schema: { enum: [{ value: 1 }] }, data: { value: '1' } },
    { schema: { enum: [false] }, data: 0 },
    { schema: { enum: [null] }, data: false }
  ];

  for (const { schema: enumSchema, data } of cases) {
    assert.equal(validate(enumSchema, data, 'fixture.json')[0]?.code, 'enum_mismatch');
  }
});
