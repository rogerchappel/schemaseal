# Output Contract

SchemaSeal output is meant to be deterministic and scriptable.

## Markdown

Markdown reports contain:

1. Tool and schema metadata.
2. Summary counts.
3. Per-file findings.
4. Pinned schema drift status.

## JSON

JSON reports use stable key ordering and a fixed `generatedAt` timestamp. This keeps snapshots and CI diffs reproducible.

## Exit codes

- `--fail-on error` exits non-zero when any error finding exists.
- `--fail-on warning` exits non-zero when any warning or error finding exists.
- `--fail-on never` always exits zero after producing a report.
