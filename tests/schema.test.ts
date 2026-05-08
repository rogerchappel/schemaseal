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
  assert.equal(findings.filter((finding) => finding.severity === 'error').length, 2);
  assert.equal(findings.some((finding) => finding.code === 'additional_property'), true);
});

test('passes a matching object', () => {
  assert.deepEqual(validate(schema, { name: 'ok', risk: 'low' }, 'fixture.json'), []);
});
