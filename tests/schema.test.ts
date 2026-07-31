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
