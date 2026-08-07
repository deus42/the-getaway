import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptRoot, '..');
const repositoryRoot = resolve(appRoot, '..');
const sourceRoot = resolve(
  repositoryRoot,
  'art/blender/get205/.generated/four-block-baked-v3/runtime'
);
const sourceScene = 'art/blender/get205/.generated/four-block-baked-v3/master/get205-four-block-baked-v3.blend';
const sourcePlate = resolve(sourceRoot, 'stable-people-free-6400x3600.png');
const sourceForegroundMetadata = resolve(sourceRoot, 'foreground-layers.json');
const publicRoot = resolve(
  appRoot,
  'public/environment/level0/get205-hidzu-production-v1'
);
const manifestPath = resolve(
  repositoryRoot,
  'art/blender/get205/manifests/four-block-runtime-production.json'
);
const cwebp = process.env.CWEBP_BIN ?? 'cwebp';
const publicPrefix = 'environment/level0/get205-hidzu-production-v1';

const assertSafeOutputRoot = () => {
  if (!publicRoot.endsWith('/get205-hidzu-production-v1')) {
    throw new Error(`Refusing to replace unexpected asset root: ${publicRoot}`);
  }
};

const digest = (path) =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

const runCwebp = (input, output, options = []) => {
  mkdirSync(dirname(output), { recursive: true });
  execFileSync(cwebp, ['-quiet', '-q', '95', '-m', '6', ...options, input, '-o', output], {
    stdio: 'inherit',
  });
};

const toPublicPath = (absolute) =>
  `${publicPrefix}/${relative(publicRoot, absolute).replaceAll('\\', '/')}`;

const assetRecord = (absolute, metadata) => ({
  ...metadata,
  path: toPublicPath(absolute),
  sha256: digest(absolute),
  bytes: statSync(absolute).size,
});

const requireSource = (path) => {
  if (!existsSync(path)) throw new Error(`Missing accepted Blender derivative: ${path}`);
};

requireSource(sourcePlate);
requireSource(sourceForegroundMetadata);
assertSafeOutputRoot();
rmSync(publicRoot, { recursive: true, force: true });
mkdirSync(publicRoot, { recursive: true });

const foregroundEntries = JSON.parse(readFileSync(sourceForegroundMetadata, 'utf8'));
const desktopAssets = [];
const desktopTiles = [
  { id: 'north-west', left: 0, top: 0, width: 3202, height: 1802 },
  { id: 'north-east', left: 3198, top: 0, width: 3202, height: 1802 },
  { id: 'south-west', left: 0, top: 1798, width: 3202, height: 1802 },
  { id: 'south-east', left: 3198, top: 1798, width: 3202, height: 1802 },
];

for (const tile of desktopTiles) {
  const output = resolve(publicRoot, `desktop/background-${tile.id}.webp`);
  runCwebp(sourcePlate, output, [
    '-crop',
    String(tile.left),
    String(tile.top),
    String(tile.width),
    String(tile.height),
  ]);
  desktopAssets.push(assetRecord(output, {
    ...tile,
    id: `background.${tile.id}`,
    role: 'architecture-back',
  }));
}

for (const entry of foregroundEntries) {
  const fileName = `${entry.clusterId.replaceAll('.', '-')}.webp`;
  const source = resolve(repositoryRoot, entry.path);
  const output = resolve(publicRoot, 'desktop/foreground', fileName);
  requireSource(source);
  runCwebp(source, output);
  desktopAssets.push(assetRecord(output, {
    id: `foreground.${entry.clusterId}`,
    role: 'architecture-front',
    clusterId: entry.clusterId,
    left: entry.crop.left,
    top: entry.crop.top,
    width: entry.crop.width,
    height: entry.crop.height,
    depthAnchor: entry.depthAnchor,
  }));
}

const mobileAssets = [];
const mobileBackground = resolve(publicRoot, 'mobile/background.webp');
runCwebp(sourcePlate, mobileBackground, ['-resize', '3200', '1800']);
mobileAssets.push(assetRecord(mobileBackground, {
  id: 'background.full',
  role: 'architecture-back',
  left: 0,
  top: 0,
  width: 3200,
  height: 1800,
}));

for (const entry of foregroundEntries) {
  const fileName = `${entry.clusterId.replaceAll('.', '-')}.webp`;
  const source = resolve(repositoryRoot, entry.path);
  const output = resolve(publicRoot, 'mobile/foreground', fileName);
  const width = Math.max(1, Math.round(entry.crop.width / 2));
  const height = Math.max(1, Math.round(entry.crop.height / 2));
  runCwebp(source, output, ['-resize', String(width), String(height)]);
  mobileAssets.push(assetRecord(output, {
    id: `foreground.${entry.clusterId}`,
    role: 'architecture-front',
    clusterId: entry.clusterId,
    left: Math.round(entry.crop.left / 2),
    top: Math.round(entry.crop.top / 2),
    width,
    height,
    depthAnchor: entry.depthAnchor,
  }));
}

const manifest = {
  schemaVersion: 1,
  id: 'get205-hidzu-production-v1',
  ticket: 'GET-205',
  source: {
    pack: 'KitBash3D Neo Tokyo 2',
    scene: sourceScene,
    stablePlate: relative(repositoryRoot, sourcePlate).replaceAll('\\', '/'),
    stablePlateSha256: digest(sourcePlate),
    peopleBakedIntoPlate: false,
    authoring: 'blender-baked-kitbash-master',
  },
  profiles: [
    {
      id: 'desktop',
      selection: 'viewport-width-greater-than-820',
      fullPlate: { width: 6400, height: 3600 },
      renderZoom: 2,
      initialZoom: 2,
      assets: desktopAssets,
    },
    {
      id: 'mobile',
      selection: 'viewport-width-at-most-820',
      fullPlate: { width: 3200, height: 1800 },
      renderZoom: 1,
      initialZoom: 1.05,
      assets: mobileAssets,
    },
  ],
};

mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
copyFileSync(manifestPath, resolve(publicRoot, 'manifest.json'));

const allAssets = [...desktopAssets, ...mobileAssets];
const largest = Math.max(...allAssets.map(({ bytes }) => bytes));
const total = allAssets.reduce((sum, { bytes }) => sum + bytes, 0);
console.log(
  `GET-205 production assets: ${allAssets.length} files, ${total} bytes total, ${largest} bytes largest`
);
