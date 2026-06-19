# SchemaSeal

SchemaSeal is a small local-first CLI for sealing schema expectations in a repo. It pins JSON/YAML schemas, checks local files offline, and writes deterministic Markdown or JSON reports that are easy to paste into PRs, agent handoffs, and CI logs.

It is not a registry, not a dashboard, and not a sneaky cloud service. It is a careful little wax seal for config-heavy projects.

## Why it exists

Agent-assisted development creates lots of config churn: tool manifests, MCP configs, workflow YAML, fixtures, package metadata, and generated evidence. SchemaSeal gives maintainers a repeatable way to answer:

- Did this file still match the schema?
- Did the pinned schema drift?
- Can I show the result without leaking obvious tokens?
- Can CI fail on the same evidence I can inspect locally?

## Install

```bash
npm install
npm run build
```

For local development, run the CLI through `node dist/src/index.js` after building.

## Quick start

```bash
npm run build
node dist/src/index.js pin examples/schemas/tool.schema.json --name tool-config
node dist/src/index.js check examples/configs/good.json examples/configs/good.yaml --name tool-config --report reports/schema-report.md
```

Use a schema directly without a pin:

```bash
node dist/src/index.js check examples/configs/good.json \
  --schema examples/schemas/tool.schema.json \
  --format json \
  --report reports/schema-report.json
```

Fail CI on warnings as well as errors:

```bash
node dist/src/index.js check examples/configs/*.json --schema examples/schemas/tool.schema.json --fail-on warning
```

## Commands

### `schemaseal pin <schema>`

Stores a deterministic schema snapshot in `.schemaseal/pins.json`.

Options:

- `--name <name>`: stable pin name.
- `--config <path>`: alternate pins file.
- `--no-redact`: disable default redaction while storing the schema snapshot.

### `schemaseal check <files...>`

Checks JSON, YAML, JSONL, Markdown, or plain-text inputs against a pinned or direct schema.

Options:

- `--name <pin>`: use a named pin.
- `--schema <path>`: use a schema file directly.
- `--format markdown|json`: report format; default is Markdown.
- `--report <path>`: write report to a file; default is stdout.
- `--fail-on error|warning|never`: exit threshold; default is `error`.
- `--config <path>`: alternate pins file.
- `--no-redact`: disable default redaction.

## Safety model

- Offline by design: the CLI performs no telemetry, registry lookups, or hidden network calls.
- Safe IO: `pin` writes only the configured pins file; `check` writes only when `--report` is provided.
- Redaction is enabled by default for common token/key/password/private-key patterns.
- Reports are deterministic, including fixed metadata timestamps, so diffs stay quiet.
- Schema drift is reported by comparing local schema hashes against pins.

## Limitations

SchemaSeal implements a pragmatic MVP subset of JSON Schema: `type`, `required`, `properties`, `items`, `enum`, and `additionalProperties: false`. That is enough for many repo-local quality gates, but it is not a full JSON Schema validator yet.

## Verification

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Release readiness

Use [docs/release-readiness.md](docs/release-readiness.md) before opening release PRs or tagging a release.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: keep the CLI local-first, fixtures tidy, reports deterministic, and safety behavior obvious.

## License

MIT
