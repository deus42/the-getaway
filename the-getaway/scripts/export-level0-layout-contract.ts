import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVEL0_LAYOUT_CONTRACT } from '../src/content/levels/level0/layoutContract';
import { validateLevel0LayoutContract } from '../src/game/level0/layout/validator';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..', '..');
const outputPath = resolve(
  repositoryRoot,
  'art/iso-assets/contracts/level0-layout-contract.json'
);

const errors = validateLevel0LayoutContract(LEVEL0_LAYOUT_CONTRACT);
if (errors.length > 0) {
  throw new Error(`Refusing to export invalid Level 0 layout:\n${errors.join('\n')}`);
}

const exportPayload = {
  generatedFrom: 'the-getaway/src/content/levels/level0/layoutContract.ts',
  purpose: 'Shared authoring input for Blender and runtime-alignment validation',
  contract: LEVEL0_LAYOUT_CONTRACT,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(exportPayload, null, 2)}\n`, 'utf8');
console.info(`[level0-layout] exported ${LEVEL0_LAYOUT_CONTRACT.id} -> ${outputPath}`);
