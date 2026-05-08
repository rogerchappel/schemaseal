# Contributing to SchemaSeal

Thanks for helping make schema checks calmer and more trustworthy.

## Development

```bash
npm install
npm run check
npm test
npm run smoke
```

## Principles

- Keep runtime behavior local-first and offline.
- Do not add telemetry or surprise network calls.
- Prefer deterministic output over clever output.
- Add fixtures for every behavior change.
- Keep redaction conservative and on by default.
- Make failures actionable for humans reading CI logs.

## Pull request checklist

- [ ] Tests or fixtures cover the change.
- [ ] `npm run check` passes.
- [ ] `npm test` passes.
- [ ] `npm run smoke` passes when CLI behavior changes.
- [ ] Documentation changed when flags or output changed.

## Commit style

Use small, meaningful commits. Conventional-ish prefixes (`feat:`, `fix:`, `docs:`, `test:`, `chore:`) are welcome but not mandatory.

## Security

Please do not include real secrets in issues, fixtures, or reports. If you find a vulnerability, follow [SECURITY.md](SECURITY.md).
