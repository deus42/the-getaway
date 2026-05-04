import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const blenderBinary = process.env.BLENDER_BIN ?? '/Applications/Blender.app/Contents/MacOS/Blender';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const repoRoot = resolve(appRoot, '..');
const blenderScript = resolve(repoRoot, 'art/blender/get155/create_get155_iso_noir_template.py');

const expectedFrames = [
  'building_art_deco_a',
  'prop_crate_a',
  'prop_streetlight_a',
  'prop_neon_sign_a',
];

const expectedFiles = [
  resolve(repoRoot, 'art/blender/get155/get155_iso_noir_template.blend'),
  resolve(repoRoot, 'art/blender/get155/get155_preview_manifest.json'),
  resolve(appRoot, 'public/atlases/get155_preview.png'),
  resolve(appRoot, 'public/atlases/get155_preview.json'),
  ...expectedFrames.map((frame) => resolve(repoRoot, `art/blender/get155/renders/${frame}.png`)),
];

const fail = (message) => {
  console.error(`[GET-155] ${message}`);
  process.exit(1);
};

if (!existsSync(blenderBinary)) {
  fail(`Blender binary not found at ${blenderBinary}. Set BLENDER_BIN to override.`);
}

if (!existsSync(blenderScript)) {
  fail(`Blender script not found at ${blenderScript}.`);
}

console.log(`[GET-155] Running Blender generator: ${blenderBinary}`);
const result = spawnSync(
  blenderBinary,
  ['--background', '--python', blenderScript, '--', '--repo-root', repoRoot],
  {
    cwd: repoRoot,
    stdio: 'inherit',
  }
);

if (result.error) {
  fail(result.error.message);
}

if (result.status !== 0) {
  fail(`Blender exited with status ${result.status}.`);
}

for (const filePath of expectedFiles) {
  if (!existsSync(filePath)) {
    fail(`Expected generated file is missing: ${filePath}`);
  }
}

const atlasJsonPath = resolve(appRoot, 'public/atlases/get155_preview.json');
const manifestPath = resolve(repoRoot, 'art/blender/get155/get155_preview_manifest.json');
const atlasJson = JSON.parse(readFileSync(atlasJsonPath, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

for (const frameName of expectedFrames) {
  if (!atlasJson.frames?.[frameName]) {
    fail(`Atlas JSON is missing frame "${frameName}".`);
  }
  if (!manifest.frames?.[frameName]) {
    fail(`Manifest is missing frame "${frameName}".`);
  }
}

console.log('[GET-155] Generated Blender template and preview atlas.');
console.log(`[GET-155] Atlas: ${atlasJsonPath}`);
console.log(`[GET-155] Manifest: ${manifestPath}`);
