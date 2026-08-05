import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_STATES,
  type CharacterSpriteDirection,
  type CharacterSpriteFrameMetrics,
  type CharacterSpriteSheetMetrics,
  type CharacterSpriteState,
} from '../src/content/characters/spriteManifest';
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
  'processed',
  'player-civilian-01-walk-alpha-v1.png'
);
const OUTPUT_DIRECTORY = path.join(
  APP_ROOT,
  'public',
  'characters',
  'player_civilian_01'
);
const PROOF_PATH = path.join(
  REPOSITORY_ROOT,
  'art',
  'actors',
  'get204',
  'processed',
  'player-civilian-01-runtime-proof-v1.png'
);
const INTEGRITY_PATH = path.join(
  APP_ROOT,
  'public',
  'characters',
  'actor-asset-integrity.json'
);

const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 96;
const FRAME_COUNT = 4;
const TARGET_ALPHA_HEIGHT = 62;
const TARGET_FOOT_ROW = 88;

// Rows are mapped by their visible screen-facing direction, not by prompt order.
const SOURCE_ROW_BY_DIRECTION: Record<CharacterSpriteDirection, number> = {
  north: 4,
  'north-east': 3,
  east: 2,
  'south-east': 7,
  south: 0,
  'south-west': 1,
  west: 6,
  'north-west': 5,
};

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

const removeResidualGreenSpill = (image: RgbaImage): void => {
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const alpha = image.data[offset + 3]!;
    if (alpha < 8) {
      image.data[offset] = 0;
      image.data[offset + 1] = 0;
      image.data[offset + 2] = 0;
      image.data[offset + 3] = 0;
      continue;
    }
    const red = image.data[offset]!;
    const green = image.data[offset + 1]!;
    const blue = image.data[offset + 2]!;
    const neutralCeiling = Math.max(red, blue) + 5;
    if (green > neutralCeiling && green > red * 1.12 && green > blue * 1.18) {
      image.data[offset + 1] = Math.min(255, neutralCeiling);
    }
  }
};

const extractSourceCell = (
  atlas: RgbaImage,
  row: number,
  column: number
): RgbaImage => {
  const x0 = Math.round((column * atlas.width) / FRAME_COUNT);
  const x1 = Math.round(((column + 1) * atlas.width) / FRAME_COUNT);
  const y0 = Math.round((row * atlas.height) / CHARACTER_SPRITE_DIRECTIONS.length);
  const y1 = Math.round(((row + 1) * atlas.height) / CHARACTER_SPRITE_DIRECTIONS.length);
  return extractRgbaRegion(atlas, x0, y0, x1 - x0, y1 - y0);
};

const normalizeCell = (cell: RgbaImage): RgbaImage => {
  removeResidualGreenSpill(cell);
  const measured = measureAlpha(cell, 12);
  if (measured.alphaPixelCount === 0) throw new Error('Generated source cell has no visible actor');
  const bounds = measured.alphaBounds;
  const pad = 2;
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
  const targetHeight = TARGET_ALPHA_HEIGHT;
  const targetWidth = Math.max(
    1,
    Math.min(54, Math.round((cropped.width / cropped.height) * targetHeight))
  );
  const resized = resizeRgbaBilinear(cropped, targetWidth, targetHeight);
  const resizedMetrics = measureAlpha(resized, 8);
  const frame = createTransparentImage(FRAME_WIDTH, FRAME_HEIGHT);
  const targetX = Math.round((FRAME_WIDTH - targetWidth) / 2);
  const targetY = TARGET_FOOT_ROW - resizedMetrics.footContactRowPx;
  blit(frame, resized, targetX, targetY);
  return frame;
};

const composeSheet = (frames: readonly RgbaImage[]): RgbaImage => {
  const sheet = createTransparentImage(FRAME_WIDTH * FRAME_COUNT, FRAME_HEIGHT);
  frames.forEach((frame, index) => blit(sheet, frame, index * FRAME_WIDTH, 0));
  return sheet;
};

const cloneImage = (image: RgbaImage): RgbaImage => ({
  width: image.width,
  height: image.height,
  data: new Uint8Array(image.data),
});

const buildStateFrames = (
  moveFrames: readonly RgbaImage[],
  state: CharacterSpriteState
): RgbaImage[] => {
  if (state === 'move') return moveFrames.map(cloneImage);
  const neutral = moveFrames[1] ?? moveFrames[0]!;
  return Array.from({ length: FRAME_COUNT }, () => cloneImage(neutral));
};

const writePng = async (filePath: string, image: RgbaImage): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, encodeRgbaPng(image));
};

interface IntegrityFileRecord {
  sha256: string;
  compressedBytes: number;
  decodedBytes: number;
}

interface CharacterIntegrityInventory {
  actors: Record<string, {
    portrait: IntegrityFileRecord;
    sheets: Record<string, IntegrityFileRecord>;
    metrics: IntegrityFileRecord;
  }>;
}

const readIntegrityRecord = async (
  filePath: string,
  decodedBytes: number
): Promise<IntegrityFileRecord> => {
  const buffer = await fs.readFile(filePath);
  return {
    sha256: createHash('sha256').update(buffer).digest('hex'),
    compressedBytes: buffer.length,
    decodedBytes,
  };
};

const updatePlayerIntegrity = async (): Promise<void> => {
  const inventory = JSON.parse(
    await fs.readFile(INTEGRITY_PATH, 'utf8')
  ) as CharacterIntegrityInventory;
  const playerIntegrity = inventory.actors.player_civilian_01;
  if (!playerIntegrity) {
    throw new Error('Central character integrity is missing player_civilian_01');
  }

  for (const state of CHARACTER_SPRITE_STATES) {
    for (const direction of CHARACTER_SPRITE_DIRECTIONS) {
      const sheetKey = `${state}-${direction}`;
      playerIntegrity.sheets[sheetKey] = await readIntegrityRecord(
        path.join(OUTPUT_DIRECTORY, `${sheetKey}.png`),
        FRAME_WIDTH * FRAME_COUNT * FRAME_HEIGHT * 4
      );
    }
  }

  const metricsPath = path.join(OUTPUT_DIRECTORY, 'sheet-metrics.json');
  const metricsBuffer = await fs.readFile(metricsPath);
  playerIntegrity.metrics = {
    sha256: createHash('sha256').update(metricsBuffer).digest('hex'),
    compressedBytes: metricsBuffer.length,
    decodedBytes: metricsBuffer.length,
  };
  await fs.writeFile(INTEGRITY_PATH, `${JSON.stringify(inventory, null, 2)}\n`);
};

const main = async (): Promise<void> => {
  const atlas = decodeRgbaPng(await fs.readFile(SOURCE_PATH));
  const states = {} as CharacterSpriteSheetMetrics['states'];
  const southProofSheets: RgbaImage[] = [];

  for (const state of CHARACTER_SPRITE_STATES) {
    states[state] = {} as CharacterSpriteSheetMetrics['states'][CharacterSpriteState];
    for (const direction of CHARACTER_SPRITE_DIRECTIONS) {
      const sourceRow = SOURCE_ROW_BY_DIRECTION[direction];
      const moveFrames = Array.from({ length: FRAME_COUNT }, (_, column) =>
        normalizeCell(extractSourceCell(atlas, sourceRow, column))
      );
      const frames = buildStateFrames(moveFrames, state);
      const sheet = composeSheet(frames);
      const metrics = frames.map((frame): CharacterSpriteFrameMetrics => measureAlpha(frame, 8));
      states[state][direction] = { frames: metrics };
      await writePng(path.join(OUTPUT_DIRECTORY, `${state}-${direction}.png`), sheet);
      if (direction === 'south') southProofSheets.push(sheet);
    }
  }

  const metrics: CharacterSpriteSheetMetrics = {
    schemaVersion: 2,
    actorId: 'player_civilian_01',
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    origin: { x: 0.5, y: 0.92 },
    alphaOccupancy: {
      minHeightPx: 54,
      maxHeightPx: 64,
      footRowPx: TARGET_FOOT_ROW,
      tolerancePx: 2,
    },
    states,
  };
  await fs.writeFile(
    path.join(OUTPUT_DIRECTORY, 'sheet-metrics.json'),
    `${JSON.stringify(metrics, null, 2)}\n`
  );
  await updatePlayerIntegrity();

  const proof = createTransparentImage(FRAME_WIDTH * FRAME_COUNT, FRAME_HEIGHT * 3);
  southProofSheets.forEach((sheet, row) => blit(proof, sheet, 0, row * FRAME_HEIGHT));
  await writePng(PROOF_PATH, proof);
};

await main();
