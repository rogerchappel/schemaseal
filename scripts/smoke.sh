#!/usr/bin/env bash
set -euo pipefail

rm -rf .schemaseal/smoke reports
node dist/src/index.js pin examples/schemas/tool.schema.json --name tool-config --config .schemaseal/smoke/pins.json
node dist/src/index.js check examples/configs/good.json examples/configs/good.yaml --name tool-config --config .schemaseal/smoke/pins.json --report reports/schema-report.md
node dist/src/index.js check examples/configs/good.json --schema examples/schemas/tool.schema.json --format json --report reports/schema-report.json
if node dist/src/index.js check examples/configs/bad.json --schema examples/schemas/tool.schema.json --fail-on error > reports/bad-report.md; then
  echo "expected bad fixture to fail" >&2
  exit 1
fi
grep -q "SchemaSeal Report" reports/schema-report.md
grep -q '"failed": 0' reports/schema-report.json
grep -q "enum_mismatch" reports/bad-report.md
