# Safety Notes

SchemaSeal is designed for reviewable local evidence.

## No surprise network calls

The CLI does not fetch remote schemas, upload files, call LLMs, or emit telemetry. GitHub Actions and publishing tools may use the network, but runtime schema checks do not.

## Write behavior

- `pin` writes to `.schemaseal/pins.json` unless `--config` is set.
- `check` writes only when `--report` is set.
- Existing reports are overwritten only at the explicit output path.

## Redaction

Redaction is enabled by default. It targets common key names and token/private-key patterns, but it is not a substitute for secret scanning. Treat reports as safer, not magically safe.
