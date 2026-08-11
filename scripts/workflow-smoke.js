import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import YAML from 'yaml';

const workflows = {
  release: '.github/workflows/release.yml',
  dryRun: '.github/workflows/release-dry-run.yml',
};

async function loadWorkflow(path) {
  const source = await readFile(path, 'utf8');
  const workflow = YAML.parse(source);
  const job = Object.values(workflow.jobs)[0];
  return { source, steps: job.steps };
}

function runCommands(steps) {
  return steps.flatMap((step) => (typeof step.run === 'string' ? [step.run] : []));
}

function assertSinglePack(commands, label) {
  const packCommands = commands.filter((command) => /\bnpm pack\b/.test(command));
  assert.equal(packCommands.length, 1, `${label} must pack exactly once`);
}

const release = await loadWorkflow(workflows.release);
const dryRun = await loadWorkflow(workflows.dryRun);
const releaseCommands = runCommands(release.steps);
const dryRunCommands = runCommands(dryRun.steps);
const artifactReference = '${{ steps.pack.outputs.tarball }}';

assertSinglePack(releaseCommands, 'release workflow');
assertSinglePack(dryRunCommands, 'release dry run');
assert.ok(releaseCommands.some((command) => /npm install --global npm@11/.test(command)),
  'release workflow must install an npm version with trusted publishing support');

const publish = releaseCommands.find((command) => /\bnpm publish\b/.test(command));
assert.ok(publish, 'release workflow must publish to npm');
assert.match(publish, /npm publish "\$\{\{ steps\.pack\.outputs\.tarball \}\}" --access public --provenance/,
  'release workflow must publish the packed artifact publicly with provenance');

const githubRelease = releaseCommands.find((command) => /\bgh release create\b/.test(command));
assert.ok(githubRelease?.includes(artifactReference),
  'GitHub release must attach the same packed artifact');

const dryRunPublish = dryRunCommands.find((command) => /\bnpm publish\b/.test(command));
assert.ok(dryRunPublish, 'release dry run must exercise npm publication');
assert.match(dryRunPublish, /npm publish "\$\{\{ steps\.pack\.outputs\.tarball \}\}" --dry-run --access public/,
  'release dry run must dry-run publish the packed artifact publicly');

for (const [label, workflow] of Object.entries({ release, dryRun })) {
  const packStep = workflow.steps.find((step) => step.id === 'pack');
  assert.ok(packStep?.run.includes('GITHUB_OUTPUT'), `${label} pack step must expose its artifact`);
}

console.log('Release workflows reuse one packed artifact for npm and GitHub publication.');
