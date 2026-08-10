# Release readiness

Use this checklist before cutting a release or asking for a release review.

## Local verification

```sh
npm install
npm run check
npm run test
npm run smoke
npm run package:smoke
npm run release:check
```

## Package contents

Run `npm run package:smoke` when available and review the dry-run file list for only the built runtime, README, license, and other intentional release assets.

## Publication flow

The release dry run packs the package once and passes that exact tarball to `npm publish --dry-run --access public`. A version tag runs the same checks, packs once, publishes that tarball to npm using trusted publishing with provenance, and attaches the identical artifact to the GitHub release.

`npm run workflow:smoke` guards this handoff and fails if either workflow repacks or stops reusing the packed artifact.

## Notes

- Keep README examples aligned with the fixture-backed smoke command.
- Do not tag a release until CI and the release dry run are green on the release branch.
- Update CHANGELOG.md with user-facing changes before tagging.
