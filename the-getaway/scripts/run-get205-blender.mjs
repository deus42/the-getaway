import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  renameSync,
  rmSync,
  unlinkSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { publishValidatedRun } from './get205-publication.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const blender = process.env.BLENDER_BIN ?? '/Users/deus/Tools/Blender.app/Contents/MacOS/Blender';
const baseScene = resolve(repositoryRoot, 'art/blender/get204/.generated/get204-level0-master.blend');
const get205Root = resolve(repositoryRoot, 'art/blender/get205');
const finalGeneratedRoot = resolve(get205Root, '.generated');
const stagingParent = resolve(get205Root, '.staging');
const trialsRoot = resolve(finalGeneratedRoot, 'trials');
const lockPath = resolve(stagingParent, 'generation.lock');
const modeIndex = process.argv.indexOf('--mode');
const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : 'preview';
const captureIndex = process.argv.indexOf('--capture-id');
const captureId = captureIndex >= 0 ? process.argv[captureIndex + 1] : undefined;
const allowedModes = new Set(['preview', 'captures', 'exports', 'all']);
const safeCaptureId = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

if (!existsSync(blender)) {
  throw new Error(`Blender executable not found: ${blender}`);
}
if (!existsSync(baseScene)) {
  throw new Error(
    'Missing ignored GET-204 master scene. Rebuild GET-204 locally before applying GET-205.'
  );
}
if (!mode || !allowedModes.has(mode)) {
  throw new Error(`Invalid GET-205 render mode: ${mode ?? '<missing>'}`);
}
if (captureId && (mode !== 'captures' || !safeCaptureId.test(captureId))) {
  throw new Error(`GET-205 capture filter is invalid for ${mode}: ${captureId}`);
}

const runValidation = ({
  verifyExport = false,
  verifyCaptures = false,
  generatedRoot,
} = {}) => {
  const tsx = resolve(repositoryRoot, 'the-getaway/node_modules/.bin/tsx');
  const validator = resolve(repositoryRoot, 'the-getaway/scripts/validate-level0-hidzu-plan.ts');
  const args = [validator, '--verify-local'];
  if (verifyExport) args.push('--verify-export');
  if (verifyCaptures) args.push('--verify-captures');
  if (generatedRoot) args.push('--generated-root', generatedRoot);
  const validation = spawnSync(tsx, args, {
    cwd: resolve(repositoryRoot, 'the-getaway'),
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (validation.error) throw validation.error;
  if (validation.status !== 0) {
    throw new Error(`GET-205 validation exited with status ${validation.status ?? 1}`);
  }
};

const runT4PrerequisiteValidation = () => {
  const tsx = resolve(repositoryRoot, 'the-getaway/node_modules/.bin/tsx');
  const validator = resolve(repositoryRoot, 'the-getaway/scripts/validate-level0-blender-plan.ts');
  const validation = spawnSync(
    tsx,
    [validator, '--verify-source', '--verify-export'],
    {
      cwd: resolve(repositoryRoot, 'the-getaway'),
      encoding: 'utf8',
      stdio: 'inherit',
    }
  );
  if (validation.error) throw validation.error;
  if (validation.status !== 0) {
    throw new Error(`GET-204 prerequisite validation exited with status ${validation.status ?? 1}`);
  }
};

mkdirSync(stagingParent, { recursive: true });
let lockDescriptor;
let stagingRoot;
try {
  try {
    lockDescriptor = openSync(lockPath, 'wx');
  } catch (error) {
    throw new Error(`Another GET-205 generation run owns ${lockPath}`, { cause: error });
  }
  stagingRoot = mkdtempSync(resolve(stagingParent, 'run-'));
  runT4PrerequisiteValidation();
  runValidation();

  const script = resolve(repositoryRoot, 'art/blender/get205/scripts/build_level0_hidzu_scene.py');
  const result = spawnSync(
    blender,
    [
      '--background',
      '--factory-startup',
      '--python',
      script,
      '--',
      '--repo-root',
      repositoryRoot,
      '--mode',
      mode,
      '--generated-root',
      stagingRoot,
      ...(captureId ? ['--capture-id', captureId] : []),
    ],
    { cwd: repositoryRoot, encoding: 'utf8', stdio: 'inherit' }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`GET-205 Blender generation exited with status ${result.status ?? 1}`);
  }

  const verifyExport = ['exports', 'all'].includes(mode);
  const verifyCaptures = ['captures', 'all'].includes(mode) && !captureId;
  if (verifyExport || verifyCaptures) {
    runValidation({ verifyExport, verifyCaptures, generatedRoot: stagingRoot });
  }
  if (mode === 'all') {
    const publishedRoot = publishValidatedRun({
      generatedRoot: finalGeneratedRoot,
      stagingParent,
      stagingRoot,
      validatePublished: (root) => runValidation({
        verifyExport: true,
        verifyCaptures: true,
        generatedRoot: root,
      }),
      validateCurrent: () => runValidation({
        verifyExport: true,
        verifyCaptures: true,
      }),
    });
    stagingRoot = undefined;
    console.log(
      `GET-205 complete run published through atomic current pointer: output=${publishedRoot}`
    );
  } else {
    mkdirSync(trialsRoot, { recursive: true });
    const trialRoot = resolve(trialsRoot, basename(stagingRoot));
    renameSync(stagingRoot, trialRoot);
    stagingRoot = undefined;
    console.log(
      `GET-205 partial ${mode} run retained as noncanonical trial: output=${trialRoot}`
    );
  }
} finally {
  if (stagingRoot && existsSync(stagingRoot)) {
    rmSync(stagingRoot, { recursive: true, force: true });
  }
  if (lockDescriptor !== undefined) {
    closeSync(lockDescriptor);
    if (existsSync(lockPath)) unlinkSync(lockPath);
  }
}
