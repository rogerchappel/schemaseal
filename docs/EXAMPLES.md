# Examples

## Pin a schema

```bash
node dist/src/index.js pin examples/schemas/tool.schema.json --name tool-config
```

## Check JSON and YAML together

```bash
node dist/src/index.js check examples/configs/good.json examples/configs/good.yaml --name tool-config --report reports/schema-report.md
```

## Emit JSON for automation

```bash
node dist/src/index.js check examples/configs/good.json --schema examples/schemas/tool.schema.json --format json
```

## Keep CI strict

```bash
node dist/src/index.js check examples/configs/*.json --schema examples/schemas/tool.schema.json --fail-on warning
```
