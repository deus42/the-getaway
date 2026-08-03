import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVEL0_LAYOUT_CONTRACT } from '../src/content/levels/level0/layoutContract';
import { validateLevel0LayoutContract } from '../src/game/level0/layout/validator';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..', '..');
const exportedPath = resolve(
  repositoryRoot,
  'art/iso-assets/contracts/level0-layout-contract.json'
);

const errors = validateLevel0LayoutContract(LEVEL0_LAYOUT_CONTRACT);
if (errors.length > 0) {
  throw new Error(`Invalid Level 0 runtime contract:\n${errors.join('\n')}`);
}

const exported = JSON.parse(readFileSync(exportedPath, 'utf8')) as {
  generatedFrom?: unknown;
  purpose?: unknown;
  contract?: unknown;
};
if (JSON.stringify(exported.contract) !== JSON.stringify(LEVEL0_LAYOUT_CONTRACT)) {
  throw new Error(
    'Blender-facing Level 0 layout export is stale. Run yarn layout:level0:export.'
  );
}

console.info(
  `[level0-layout] valid ${LEVEL0_LAYOUT_CONTRACT.id}: ` +
    `${LEVEL0_LAYOUT_CONTRACT.traversalLoops.length} loops, ` +
    `${LEVEL0_LAYOUT_CONTRACT.anchors.length} anchors, ` +
    `${LEVEL0_LAYOUT_CONTRACT.buildingFootprints.length} footprints`
);
