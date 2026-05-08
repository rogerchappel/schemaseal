#!/usr/bin/env node
import { run } from './cli.js';

run().then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`schemaseal: ${message}\n`);
  process.exitCode = 1;
});

export { run } from './cli.js';
export { checkFiles } from './check.js';
export { pinSchema } from './pin.js';
