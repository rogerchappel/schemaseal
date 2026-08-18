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
- Validation always uses the original schema and input values. Redaction is enabled by default only for report fields that match common token/key/password/private-key patterns; use `--no-redact` to emit those report fields unchanged.
- Reports are deterministic, including fixed metadata timestamps, so diffs stay quiet.
- Schema drift is reported by comparing local schema hashes against pins.
- Persisted pins are validated completely before use. Pin schemas may be JSON objects or the boolean schemas `true` and `false`; other values are rejected. A malformed config exits nonzero without producing a report and identifies the invalid JSON path (for example, `$.pins[0].schema must be an object or boolean`) so damaged or hand-edited files cannot silently pass checks.

## Limitations

SchemaSeal implements a pragmatic MVP subset of JSON Schema: boolean schemas (`true` accepts every value and `false` rejects every value), `type`, `required`, `properties`, `items`, `enum`, and `additionalProperties: false`. Boolean schemas have the same semantics at the document root and when nested under `properties` or `items`. That is enough for many repo-local quality gates, but it is not a full JSON Schema validator yet.

`enum` supports JSON primitives, arrays, and objects. Object property order is ignored when values are compared, while array order and primitive types remain significant.

`required` is satisfied only by an object's own properties. Names inherited from JavaScript's object prototype, such as `toString` or `constructor`, do not count as present in parsed input.

All supported schema violations are errors, including properties forbidden by `additionalProperties: false`. They make the file fail and produce a nonzero exit by default; use `--fail-on never` when a report-only check must always exit successfully.

## Verification

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Release readiness

Use [docs/release-readiness.md](docs/release-readiness.md) before opening release PRs or tagging a release. The automated flow packs once, verifies npm publication in the dry run, then publishes the same provenance-bearing tarball to npm and the GitHub release after a version tag.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: keep the CLI local-first, fixtures tidy, reports deterministic, and safety behavior obvious.

## License

MIT
