# Development

## Local loop

```bash
npm install
npm run check
npm test
npm run smoke
```

## Project layout

- `src/cli.ts` parses the command surface.
- `src/pin.ts` writes offline schema pins.
- `src/check.ts` coordinates parsing, validation, drift, and report summaries.
- `src/schema.ts` contains the MVP schema validator.
- `src/render.ts` owns Markdown and JSON output.
- `examples/` contains checked-in fixtures used by tests and smoke scripts.

## Release readiness

Run `bash scripts/validate.sh` before publishing or tagging.
