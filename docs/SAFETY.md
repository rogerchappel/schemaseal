# Safety Notes

SchemaSeal is designed for reviewable local evidence.

## No surprise network calls

The CLI does not fetch remote schemas, upload files, call LLMs, or emit telemetry. GitHub Actions and publishing tools may use the network, but runtime schema checks do not.

## Write behavior

- `pin` writes to `.schemaseal/pins.json` unless `--config` is set.
- `check` writes only when `--report` is set.
- Existing reports are overwritten only at the explicit output path.

## Redaction

Validation always uses the original schema and input values so redaction cannot change a result. Stored pins are exact schema snapshots because changing a schema can weaken or corrupt its constraints. Redaction is enabled by default when building reports and targets matching report fields and token/private-key patterns; `--no-redact` leaves report fields unchanged. It is not a substitute for secret scanning. Treat reports as safer, not magically safe.
