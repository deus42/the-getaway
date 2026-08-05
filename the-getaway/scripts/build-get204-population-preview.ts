import fs from 'node:fs/promises';
import path from 'node:path';
import {
  decodeRgbaPng,
  encodeRgbaPng,
  extractRgbaRegion,
  measureAlpha,
  resizeRgbaBilinear,
  type RgbaImage,
} from './lib/rgbaPng';

const APP_ROOT = path.resolve(import.meta.dirname, '..');
const REPOSITORY_ROOT = path.resolve(APP_ROOT, '..');
const SOURCE_PATH = path.join(
  REPOSITORY_ROOT,
  'art',
  'actors',
  'get204',
  'source',
  'get204-population-atlas-green-v1.png'
);
const OUTPUT_DIRECTORY = path.join(
  APP_ROOT,
  'public',
  'environment',
  'level0',
  'get204-city-v2',
  'population'
);
const PROOF_PATH = path.join(
  REPOSITORY_ROOT,
  'art',
  'actors',
  'get204',
  'processed',
  'get204-population-runtime-proof-v1.png'
);

const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 96;
const TARGET_ALPHA_HEIGHT = 68;
const TARGET_FOOT_ROW = 90;

const ACTORS = [
  { id: 'commuter-woman', column: 0, row: 0 },
  { id: 'delivery-worker', column: 1, row: 0 },
  { id: 'office-worker', column: 2, row: 0 },
  { id: 'older-neighbor', column: 0, row: 1 },
  { id: 'hidzu-security-man', column: 1, row: 1 },
  { id: 'hidzu-security-woman', column: 2, row: 1 },
] as const;

const createTransparentImage = (width: number, height: number): RgbaImage => ({
  width,
  height,
  data: new Uint8Array(width * height * 4),
});

const blit = (target: RgbaImage, source: RgbaImage, x: number, y: number): void => {
  for (let row = 0; row < source.height; row += 1) {
    const targetY = y + row;
    if (targetY < 0 || targetY >= target.height) continue;
    const sourceStart = row * source.width * 4;
    const targetStart = (targetY * target.width + x) * 4;
    target.data.set(source.data.subarray(sourceStart, sourceStart + source.width * 4), targetStart);
  }
};

const removeChromaGreen = (image: RgbaImage): void => {
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const red = image.data[offset]!;
    const green = image.data[offset + 1]!;
    const blue = image.data[offset + 2]!;
    const dominance = green - Math.max(red, blue);

    if (green > 80 && dominance > 18) {
      const retainedAlpha = Math.max(0, Math.min(1, (90 - dominance) / 72));
      image.data[offset + 3] = Math.round(image.data[offset + 3]! * retainedAlpha);
      image.data[offset + 1] = Math.min(green, Math.max(red, blue) + 6);
    }

    if (image.data[offset + 3]! < 8) {
      image.data[offset] = 0;
      image.data[offset + 1] = 0;
      image.data[offset + 2] = 0;
      image.data[offset + 3] = 0;
    }
  }
};

const normalizeActor = (cell: RgbaImage): RgbaImage => {
  removeChromaGreen(cell);
  const measured = measureAlpha(cell, 12);
  if (measured.alphaPixelCount === 0) throw new Error('Population cell has no visible actor');

  const pad = 4;
  const bounds = measured.alphaBounds;
  const cropX = Math.max(0, bounds.x - pad);
  const cropY = Math.max(0, bounds.y - pad);
  const cropRight = Math.min(cell.width, bounds.x + bounds.width + pad);
  const cropBottom = Math.min(cell.height, bounds.y + bounds.height + pad);
  const cropped = extractRgbaRegion(
    cell,
    cropX,
    cropY,
    cropRight - cropX,
    cropBottom - cropY
  );
  const targetWidth = Math.max(
    1,
    Math.min(56, Math.round((cropped.width / cropped.height) * TARGET_ALPHA_HEIGHT))
  );
  const resized = resizeRgbaBilinear(cropped, targetWidth, TARGET_ALPHA_HEIGHT);
  const resizedMetrics = measureAlpha(resized, 8);
  const frame = createTransparentImage(FRAME_WIDTH, FRAME_HEIGHT);
  blit(
    frame,
    resized,
    Math.round((FRAME_WIDTH - targetWidth) / 2),
    TARGET_FOOT_ROW - resizedMetrics.footContactRowPx
  );
  return frame;
};

const main = async (): Promise<void> => {
  const atlas = decodeRgbaPng(await fs.readFile(SOURCE_PATH));
  if (atlas.width % 3 !== 0 || atlas.height % 2 !== 0) {
    throw new Error(`Expected a 3x2 atlas, received ${atlas.width}x${atlas.height}`);
  }

  const cellWidth = atlas.width / 3;
  const cellHeight = atlas.height / 2;
  const proof = createTransparentImage(FRAME_WIDTH * 3, FRAME_HEIGHT * 2);
  await fs.mkdir(OUTPUT_DIRECTORY, { recursive: true });
  await fs.mkdir(path.dirname(PROOF_PATH), { recursive: true });

  for (const actor of ACTORS) {
    const cell = extractRgbaRegion(
      atlas,
      actor.column * cellWidth,
      actor.row * cellHeight,
      cellWidth,
      cellHeight
    );
    const normalized = normalizeActor(cell);
    await fs.writeFile(
      path.join(OUTPUT_DIRECTORY, `${actor.id}.png`),
      encodeRgbaPng(normalized)
    );
    blit(proof, normalized, actor.column * FRAME_WIDTH, actor.row * FRAME_HEIGHT);
  }

  await fs.writeFile(PROOF_PATH, encodeRgbaPng(proof));
};

await main();
