import fs from 'node:fs/promises';
import path from 'node:path';

import { getLevel0Content } from '../src/content/levels/level0';

const outputPath = path.resolve(
  import.meta.dirname,
  '..',
  '..',
  'art',
  'painterly',
  'level0',
  'level0-building-footprints.json'
);

const footprints = Object.fromEntries(
  getLevel0Content('en').buildingDefinitions.map((building) => [
    building.id,
    {
      widthTiles: building.footprint.to.x - building.footprint.from.x + 1,
      depthTiles: building.footprint.to.y - building.footprint.from.y + 1,
    },
  ])
);

await fs.writeFile(outputPath, `${JSON.stringify(footprints, null, 2)}\n`, 'utf8');
console.log(`[level0-art] Exported ${Object.keys(footprints).length} runtime footprints`);
