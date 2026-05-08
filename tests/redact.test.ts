import test from 'node:test';
import assert from 'node:assert/strict';
import { redactText, redactValue } from '../src/redact.js';

test('redacts obvious token text', () => {
  assert.equal(redactText('token: ghp_123456789012345678901234567890123456'), 'token=<redacted>');
});

test('redacts secret-like object keys', () => {
  assert.deepEqual(redactValue({ apiKey: 'abc', nested: { password: 'pw', ok: true } }), { apiKey: '<redacted>', nested: { password: '<redacted>', ok: true } });
});
