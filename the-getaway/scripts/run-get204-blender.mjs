import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const blender = process.env.BLENDER_BIN ?? '/Users/deus/Tools/Blender.app/Contents/MacOS/Blender';
const sourceRoot = process.env.GETAWAY_NEO_TOKYO_ROOT;
const modeIndex = process.argv.indexOf('--mode');
const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : 'preview';
const allowedModes = new Set(['preview', 'captures', 'exports', 'all']);
const catalogProps = process.argv.includes('--catalog-props');
const catalogBuildings = process.argv.includes('--catalog-buildings');
const inventoryOnly = process.argv.includes('--inventory-only');

if (!existsSync(blender)) {
  throw new Error(`Blender executable not found: ${blender}`);
}
if (!sourceRoot) {
  throw new Error('Set GETAWAY_NEO_TOKYO_ROOT to the owned Neo Tokyo 2 pack before generation.');
}
if (catalogProps && catalogBuildings) {
  throw new Error('Choose only one GET-204 catalog mode.');
}
if (!catalogProps && !catalogBuildings && (!mode || !allowedModes.has(mode))) {
  throw new Error(`Invalid GET-204 render mode: ${mode ?? '<missing>'}`);
}

const runValidation = (verifyExport = false) => {
  const tsx = resolve(repositoryRoot, 'the-getaway/node_modules/.bin/tsx');
  const validator = resolve(repositoryRoot, 'the-getaway/scripts/validate-level0-blender-plan.ts');
  const args = [validator, '--verify-source'];
  if (verifyExport) args.push('--verify-export');
  const validation = spawnSync(tsx, args, {
    cwd: resolve(repositoryRoot, 'the-getaway'),
    env: { ...process.env, GETAWAY_NEO_TOKYO_ROOT: sourceRoot },
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (validation.error) throw validation.error;
  if (validation.status !== 0) process.exit(validation.status ?? 1);
};

if (!catalogProps && !catalogBuildings) {
  runValidation();
}

let scriptPath = 'art/blender/get204/scripts/build_level0_master_scene.py';
if (catalogProps) scriptPath = 'art/blender/get204/scripts/build_level0_prop_catalog.py';
if (catalogBuildings) scriptPath = 'art/blender/get204/scripts/build_level0_source_catalog.py';
const script = resolve(repositoryRoot, scriptPath);
const scriptArguments = [
  '--repo-root',
  repositoryRoot,
  '--source-root',
  sourceRoot,
];
if (catalogBuildings && inventoryOnly) scriptArguments.push('--inventory-only');
if (!catalogProps && !catalogBuildings) scriptArguments.push('--mode', mode);
const result = spawnSync(
  blender,
  [
    '--background',
    '--factory-startup',
    '--python',
    script,
    '--',
    ...scriptArguments,
  ],
  { cwd: repositoryRoot, encoding: 'utf8', stdio: 'inherit' }
);

if (result.error) throw result.error;
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
if (!catalogProps && !catalogBuildings && (mode === 'exports' || mode === 'all')) {
  runValidation(true);
}
