# SchemaSeal Orchestration

SchemaSeal was built as a local-first OSS factory project. The orchestration intent is deliberately boring: deterministic files, small commits, no hidden network calls in the CLI path, and easy verification by humans or agents.

## Build sequence

1. StackForge scaffolded the `oss-cli` repo shape from `docs/PRD.md`.
2. The TypeScript package was configured with npm scripts and a lockfile.
3. Core modules were added in small layers: hashing, parsing, redaction, config, schema validation, drift, reports, and CLI wiring.
4. Fixtures, tests, smoke scripts, and docs were added before publishing.
5. Verification commands were run locally.
6. The repo was pushed directly to `main` as `rogerchappel/schemaseal`.

## Local gates

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Safety invariants

- The CLI performs no telemetry or registry calls.
- `pin` writes only the configured pins file.
- `check` writes only when `--report` is provided.
- Redaction is on by default and can be disabled only with `--no-redact`.
- Reports use a fixed timestamp to keep fixture and CI diffs stable.
