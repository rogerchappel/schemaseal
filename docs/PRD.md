# SchemaSeal PRD

Status: in-progress

## Summary

SchemaSeal is a local-first TypeScript CLI that pins JSON/YAML schema expectations and checks local files for schema drift with offline snapshots. It is built for developers and agentic coding loops that need deterministic evidence, tidy fixtures, and no surprise network calls. It is intentionally smaller than a registry: schema checks you can trust in a repo.

## Source attribution

Created during the twice-daily OSS factory run on 2026-05-08. Web search was attempted for current developer-tool pain points, but the configured search provider returned an authentication/plan error, so this PRD is based on local OSS factory context, recurring agent workflow needs, and general public patterns around reproducible CLI tooling.

## Target users

- Developers maintaining config-heavy repos, MCP servers, and agent manifests
- OSS maintainers who want small, scriptable quality gates.
- Agent operators who need auditable local artifacts rather than hidden SaaS state.

## Problem

Modern agent-assisted development produces lots of local evidence: commands, fixtures, logs, diffs, prompts, and generated files. Teams need a compact tool that turns that evidence into reviewable outputs without uploading source code or requiring brittle bespoke scripts.

## Goals

- Provide a useful MVP through a single memorable CLI.
- Work completely offline by default.
- Read from fixtures and local files, then write deterministic reports.
- Redact obvious secrets before output.
- Exit non-zero when configured quality gates fail.
- Include practical examples and tests that another developer can run immediately.

## Non-goals

- Hosted dashboard or account system.
- LLM calls in the V1 path.
- Replacing full CI platforms or observability systems.
- Mutating source files unless the command explicitly writes to an output path.

## V1 CLI

```bash
schemaseal pin schemas/tool.schema.json --name tool-config\nschemaseal check examples/*.json --schema schemas/tool.schema.json --report schema-report.md
```

## Functional requirements

1. Accept JSON, JSONL, Markdown, and/or plain-text fixture input where appropriate.
2. Produce stable Markdown and JSON outputs.
3. Support `--fail-on` or equivalent threshold flags for local CI usage.
4. Include `--redact` enabled by default for common token/key patterns.
5. Include `--examples` or documented examples with copy-paste commands.
6. Include fixtures under `examples/` and tests under `tests/`.
7. Avoid telemetry, external network calls, or hidden file writes.

## Acceptance criteria

- `npm test`, `npm run check`, `npm run build`, and `npm run smoke` pass.
- `bash scripts/validate.sh` passes when present.
- At least one real CLI smoke uses a checked-in fixture.
- README explains why the tool exists, quick start, examples, safety model, and limitations.
- GitHub repository is public under `rogerchappel/schemaseal` with useful description and topics.

## Suggested implementation waves

1. Scaffold TypeScript CLI with StackForge and planning docs.
2. Add parser/core module for deterministic analysis.
3. Add renderer module for Markdown and JSON output.
4. Add CLI flags, fixtures, and tests.
5. Add smoke scripts and validation docs.
6. Polish README, package metadata, topics, branch protection, and release-readiness notes.
