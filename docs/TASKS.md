# SchemaSeal TASKS

## Wave 1 — Scaffold and project shape
- [x] Scaffold OSS TypeScript CLI with StackForge.
- [x] Copy the PRD into `docs/PRD.md`.
- [x] Configure package metadata, TypeScript, and local validation scripts.

## Wave 2 — Core CLI MVP
- [x] Implement `schemaseal pin` for offline schema snapshots.
- [x] Implement `schemaseal check` for JSON, YAML, JSONL, Markdown, and text inputs.
- [x] Produce deterministic Markdown and JSON reports.
- [x] Detect pinned-schema drift from local files.
- [x] Redact common secrets by default.

## Wave 3 — Evidence and safety
- [x] Add checked-in schemas and good/bad fixtures.
- [x] Add node:test coverage for validation, redaction, and reports.
- [x] Add a real CLI smoke script using fixtures.
- [x] Document local-first safety behavior and limitations.

## Wave 4 — OSS readiness
- [x] Write README, contributing guidance, examples, and release notes.
- [x] Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `bash scripts/validate.sh`.
- [x] Push public GitHub repository.
- [x] Set GitHub description/topics.
- [x] Attempt best-effort branch protection for `main`.
