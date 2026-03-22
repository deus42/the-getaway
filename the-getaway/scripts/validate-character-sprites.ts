import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type CharacterSpriteManifestEntry,
  type CharacterSpriteSheetMetrics,
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_STATES,
} from '../src/content/characters/spriteManifest';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const CHARACTER_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'characters');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

type PngHeader = {
  width: number;
  height: number;
  colorType: number;
};

const readPngHeader = async (filePath: string): Promise<PngHeader> => {
  const file = await fs.readFile(filePath);
  if (!file.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`Invalid PNG signature for ${filePath}`);
  }

  const chunkType = file.subarray(12, 16).toString('ascii');
  if (chunkType !== 'IHDR') {
    throw new Error(`Missing IHDR chunk for ${filePath}`);
  }

  return {
    width: file.readUInt32BE(16),
    height: file.readUInt32BE(20),
    colorType: file[25],
  };
};

const assertMetrics = (
  entry: CharacterSpriteManifestEntry,
  metrics: CharacterSpriteSheetMetrics,
  errors: string[]
): void => {
  if (metrics.frameWidth !== entry.frameSize.width || metrics.frameHeight !== entry.frameSize.height) {
    errors.push(
      `${entry.spriteSetId}: metrics frame size ${metrics.frameWidth}x${metrics.frameHeight} does not match manifest ${entry.frameSize.width}x${entry.frameSize.height}`
    );
  }

  if (
    metrics.origin.x !== entry.origin.x ||
    metrics.origin.y !== entry.origin.y ||
    metrics.footAnchorTolerancePx !== entry.footAnchorTolerancePx
  ) {
    errors.push(`${entry.spriteSetId}: metrics origin/tolerance drifted from manifest`);
  }
};

const validateEntry = async (
  entry: CharacterSpriteManifestEntry,
  errors: string[]
): Promise<void> => {
  const baseDir = path.join(CHARACTER_OUTPUT_DIR, entry.spriteSetId);
  const metricsPath = path.join(baseDir, 'sheet-metrics.json');
  const metrics = JSON.parse(await fs.readFile(metricsPath, 'utf8')) as CharacterSpriteSheetMetrics;
  assertMetrics(entry, metrics, errors);

  for (const state of CHARACTER_SPRITE_STATES) {
    for (const direction of CHARACTER_SPRITE_DIRECTIONS) {
      const filePath = path.join(baseDir, `${state}-${direction}.png`);
      const header = await readPngHeader(filePath);
      if (header.width !== entry.frameSize.width * entry.frameCount) {
        errors.push(
          `${entry.spriteSetId}/${state}-${direction}: expected ${entry.frameSize.width * entry.frameCount}px width for 4 frames, got ${header.width}`
        );
      }
      if (header.height !== entry.frameSize.height) {
        errors.push(
          `${entry.spriteSetId}/${state}-${direction}: expected ${entry.frameSize.height}px height, got ${header.height}`
        );
      }
      if (![4, 6].includes(header.colorType)) {
        errors.push(
          `${entry.spriteSetId}/${state}-${direction}: PNG color type ${header.colorType} does not include transparency`
        );
      }

      const anchors = metrics.states[state]?.[direction]?.frameFootAnchorsPx;
      if (!Array.isArray(anchors) || anchors.length !== entry.frameCount) {
        errors.push(`${entry.spriteSetId}/${state}-${direction}: expected ${entry.frameCount} frame anchor samples`);
        continue;
      }

      const minAnchor = Math.min(...anchors);
      const maxAnchor = Math.max(...anchors);
      if (maxAnchor - minAnchor > entry.footAnchorTolerancePx) {
        errors.push(
          `${entry.spriteSetId}/${state}-${direction}: foot anchor drift ${maxAnchor - minAnchor}px exceeds tolerance ${entry.footAnchorTolerancePx}px`
        );
      }
    }
  }
};

const main = async (): Promise<void> => {
  const errors: string[] = [];

  for (const entry of CHARACTER_SPRITE_MANIFEST) {
    await validateEntry(entry, errors);
  }

  if (errors.length > 0) {
    console.error('[sprites] Validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(
    `[sprites] Validated ${CHARACTER_SPRITE_MANIFEST.length} sprite sets in ${CHARACTER_OUTPUT_DIR}`
  );
};

void main();
