import { createHash } from 'node:crypto';
import {
  closeSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolvePublishedRoot } from './get205-publication.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const finalRoot = resolvePublishedRoot(
  resolve(repositoryRoot, 'art/blender/get205/.generated')
);
const stagingParent = resolve(repositoryRoot, 'art/blender/get205/.staging');
const generationLock = resolve(stagingParent, 'generation.lock');
const validator = resolve(repositoryRoot, 'the-getaway/scripts/validate-level0-hidzu-plan.ts');
const tsx = resolve(repositoryRoot, 'the-getaway/node_modules/.bin/tsx');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const createCase = (name) => {
  const root = mkdtempSync(resolve(stagingParent, `mutation-${name}-`));
  cpSync(resolve(finalRoot, 'master'), resolve(root, 'master'), { recursive: true });
  cpSync(resolve(finalRoot, 'aligned-export'), resolve(root, 'aligned-export'), { recursive: true });
  cpSync(resolve(finalRoot, 'captures'), resolve(root, 'captures'), { recursive: true });
  cpSync(
    resolve(finalRoot, 'get205-level0-hidzu.blend'),
    resolve(root, 'get205-level0-hidzu.blend')
  );
  cpSync(
    resolve(finalRoot, 'treatment-evidence.json'),
    resolve(root, 'treatment-evidence.json')
  );
  return root;
};

const runValidator = (generatedRoot) => spawnSync(
  tsx,
  [
    validator,
    '--verify-local',
    '--verify-export',
    '--verify-captures',
    '--generated-root',
    generatedRoot,
  ],
  {
    cwd: resolve(repositoryRoot, 'the-getaway'),
    encoding: 'utf8',
  }
);

const updateManifestEvidence = (root) => {
  const manifestPath = resolve(root, 'aligned-export/art-manifest.json');
  const evidencePath = resolve(root, 'treatment-evidence.json');
  const evidence = readJson(evidencePath);
  const record = evidence.outputs.find((entry) => entry.path === 'aligned-export/art-manifest.json');
  if (!record) throw new Error('Mutation fixture lacks aligned-export manifest evidence.');
  record.sha256 = sha256File(manifestPath);
  record.byteSize = statSync(manifestPath).size;
  writeJson(evidencePath, evidence);
};

const expectRejected = (name, mutate, expectedMessage) => {
  const root = createCase(name);
  try {
    mutate(root);
    const result = runValidator(root);
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    if (result.status === 0 || !output.includes(expectedMessage)) {
      throw new Error(
        `GET-205 mutation ${name} was not rejected as expected. ` +
        `status=${result.status}, expected=${expectedMessage}\n${output}`
      );
    }
    console.log(`GET-205 mutation rejected: ${name}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

if (!existsSync(resolve(finalRoot, 'aligned-export/art-manifest.json'))) {
  throw new Error('GET-205 mutation tests require a complete local --mode all output.');
}
mkdirSync(stagingParent, { recursive: true });
let lockDescriptor;
try {
  try {
    lockDescriptor = openSync(generationLock, 'wx');
  } catch (error) {
    throw new Error(`Cannot mutation-test while another GET-205 run owns ${generationLock}`, {
      cause: error,
    });
  }

  expectRejected('missing-tile', (root) => {
    const manifest = readJson(resolve(root, 'aligned-export/art-manifest.json'));
    const semantic = manifest.layers.find((layer) => layer.kind === 'semantic-mask');
    const tile = semantic?.tiles?.[0];
    if (!tile) throw new Error('Mutation fixture lacks a semantic tile.');
    unlinkSync(resolve(root, 'aligned-export', tile.imagePath));
  }, 'Missing GET-205 output evidence artifact');

  expectRejected('missing-authoring-scene', (root) => {
    unlinkSync(resolve(root, 'get205-level0-hidzu.blend'));
  }, 'Missing GET-205 output evidence artifact');

  expectRejected('unregistered-authoring-scene', (root) => {
    unlinkSync(resolve(root, 'get205-level0-hidzu.blend'));
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    evidence.outputs = evidence.outputs.filter(
      (entry) => entry.path !== 'get205-level0-hidzu.blend'
    );
    writeJson(evidencePath, evidence);
  }, 'GET-205 Blender evidence omits the authoring scene');

  expectRejected('semantic-registration', (root) => {
    const manifestPath = resolve(root, 'aligned-export/art-manifest.json');
    const manifest = readJson(manifestPath);
    const semantic = manifest.layers.find((layer) => layer.kind === 'semantic-mask');
    const tile = semantic?.tiles?.[0];
    if (!tile) throw new Error('Mutation fixture lacks a semantic tile.');
    tile.x += 1;
    writeJson(manifestPath, manifest);
    updateManifestEvidence(root);
  }, 'Invalid GET-205 aligned export');

  expectRejected('evidence-hash', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    const record = evidence.outputs.find((entry) => entry.path.endsWith('/ground/0-0.webp'));
    if (!record) throw new Error('Mutation fixture lacks aligned tile evidence.');
    record.sha256 = '0'.repeat(64);
    writeJson(evidencePath, evidence);
  }, 'GET-205 output evidence drifted: aligned-export/environment/level0/t5/ground/0-0.webp');

  expectRejected('overview-evidence-hash', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    const record = evidence.outputs.find((entry) => entry.path === 'master/overview.png');
    if (!record) throw new Error('Mutation fixture lacks overview evidence.');
    record.sha256 = '0'.repeat(64);
    writeJson(evidencePath, evidence);
  }, 'GET-205 output evidence drifted: master/overview.png');

  expectRejected('surface-treatment-digest', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    evidence.surfaceTreatmentDigest = '0'.repeat(64);
    writeJson(evidencePath, evidence);
  }, 'GET-205 surface treatment evidence drifted');

  expectRejected('grammar-binding', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    evidence.grammarBindings[0].glyph = 'unregistered-glyph';
    writeJson(evidencePath, evidence);
  }, 'GET-205 generated grammar bindings drifted');

  expectRejected('public-message', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    evidence.publicMessages[0].copySha256 = '0'.repeat(64);
    writeJson(evidencePath, evidence);
  }, 'GET-205 public-message render evidence drifted');

  expectRejected('rendered-public-message', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    evidence.publicMessages[0].renderedBodySha256 = '0'.repeat(64);
    writeJson(evidencePath, evidence);
  }, 'GET-205 public-message render evidence drifted');

  expectRejected('surveillance-state-cue', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    evidence.surveillanceStateCues[1].silhouette = 'color-only';
    writeJson(evidencePath, evidence);
  }, 'GET-205 surveillance-state cue evidence drifted');

  expectRejected('palette-coverage', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    evidence.paletteCoverage.tokens[0].matchedPixels += 1;
    writeJson(evidencePath, evidence);
  }, 'GET-205 palette coverage evidence drifted');

  expectRejected('addition-containment', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    const anchored = evidence.additionBounds.find((entry) => entry.targetKind === 'anchor');
    if (!anchored) throw new Error('Mutation fixture lacks an anchored addition.');
    anchored.maximum.x += 100;
    writeJson(evidencePath, evidence);
  }, 'GET-205 addition escapes its semantic anchor clearance');

  expectRejected('runtime-promotion', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    evidence.runtimeReady = true;
    writeJson(evidencePath, evidence);
  }, 'GET-205 Blender evidence does not prove the registered additive treatment');

  expectRejected('output-path-confinement', (root) => {
    const evidencePath = resolve(root, 'treatment-evidence.json');
    const evidence = readJson(evidencePath);
    const record = evidence.outputs.find((entry) => entry.path.startsWith('aligned-export/'));
    if (!record) throw new Error('Mutation fixture lacks an aligned output record.');
    record.path = '../outside.png';
    writeJson(evidencePath, evidence);
  }, 'GET-205 output evidence path escapes its ignored root');
} finally {
  if (lockDescriptor !== undefined) {
    closeSync(lockDescriptor);
    if (existsSync(generationLock)) unlinkSync(generationLock);
  }
}
