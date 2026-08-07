import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_STATES,
  NON_WORLD_CHARACTER_PRESENTATIONS,
  type CharacterSpriteDirection,
  type CharacterSpriteFrameMetrics,
  type CharacterSpriteManifestEntry,
  type CharacterSpriteSheetMetrics,
  type CharacterSpriteState,
} from '../src/content/characters/spriteManifest';
import {
  decodeRgbaPng,
  encodeRgbaPng,
  extractAlphaComponent,
  extractRgbaRegion,
  findAlphaComponents,
  measureAlpha,
  resizeRgbaBilinear,
  sha256Hex,
  type RgbaImage,
} from './lib/rgbaPng';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const REPOSITORY_ROOT = path.resolve(ROOT_DIR, '..');
const BUILD_MODE = process.argv.includes('--check')
  ? 'check'
  : process.argv.includes('--publish')
    ? 'publish'
    : null;
if (!BUILD_MODE || (process.argv.includes('--check') && process.argv.includes('--publish'))) {
  throw new Error('Use exactly one generation mode: --publish or --check');
}

const STAGING_ROOT = path.join(
  REPOSITORY_ROOT,
  'art',
  'actors',
  'get206',
  '.staging',
  `${process.pid}`
);
const STAGING_APP_ROOT = path.join(STAGING_ROOT, 'the-getaway');
const CHARACTER_OUTPUT_DIR = path.join(STAGING_APP_ROOT, 'public', 'characters');
const PORTRAIT_OUTPUT_DIR = path.join(STAGING_APP_ROOT, 'public', 'portraits', 'level0');
const PROOF_OUTPUT_DIR = path.join(STAGING_ROOT, 'art', 'actors', 'get206', 'proof');
const FINAL_CHARACTER_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'characters');
const FINAL_PORTRAIT_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'portraits', 'level0');
const FINAL_PROOF_OUTPUT_DIR = path.join(REPOSITORY_ROOT, 'art', 'actors', 'get206', 'proof');
const RECIPE_PATH = path.join(
  REPOSITORY_ROOT,
  'art',
  'actors',
  'get206',
  'manifests',
  'grounded-actor-recipe.json'
);
const INTEGRITY_TS_PATH = path.join(
  STAGING_APP_ROOT,
  'src',
  'content',
  'characters',
  'generatedActorAssetIntegrity.ts'
);
const FINAL_INTEGRITY_TS_PATH = path.join(
  ROOT_DIR,
  'src',
  'content',
  'characters',
  'generatedActorAssetIntegrity.ts'
);
const INTEGRITY_JSON_PATH = path.join(CHARACTER_OUTPUT_DIR, 'actor-asset-integrity.json');

type SourceLayout = 'template-eight' | 'seven-plus-north-strip';

interface SourceFileRecipe {
  path: string;
  sha256: string;
}

interface SpriteSourceRecipe extends SourceFileRecipe {
  layout: SourceLayout;
  northOverride?: SourceFileRecipe;
}

interface ActorRecipeEntry {
  spriteSource: SpriteSourceRecipe;
  portraitCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ActorRecipe {
  schemaVersion: 2;
  recipeId: string;
  sourceWorkflow: {
    kind: 'ai-assisted-raster-generation';
    tool: string;
    generatedOn: string;
    ownership: 'project-generated';
    normalization: 'deterministic-repository-pipeline';
  };
  spriteReference: SourceFileRecipe & { id: string };
  portraitReference: SourceFileRecipe & { id: string };
  presentations: {
    takahiroBroadcast: SourceFileRecipe & { background: 'opaque' };
    georgeAr: SourceFileRecipe & { background: 'chroma-key-green' };
  };
  renderContract: {
    frameWidth: 64;
    frameHeight: 96;
    frameCount: 4;
    sourceNormalization: {
      targetAlphaHeightPx: number;
      maxAlphaWidthPx: number;
      footRowPx: number;
      sourceFigureExtraction: {
        authoredColumns: 4;
        authoredRows: 7;
        minimumComponentPixels: number;
        maxDetachedComponentPixels: number;
      };
      chromaKey: {
        greenDominance: number;
        minimumGreen: number;
        softEdgePx: number;
      };
    };
  };
  actors: Record<string, ActorRecipeEntry>;
}

interface LoadedActorSource {
  rows: RgbaImage[][];
  northOverrideRows?: RgbaImage[][];
}

interface IntegrityRecord {
  sha256: string;
  compressedBytes: number;
  decodedBytes: number;
}

interface ActorIntegrityRecord {
  portrait: IntegrityRecord;
  sheets: Record<string, IntegrityRecord>;
  metrics: IntegrityRecord;
}

interface BuiltActor {
  integrity: ActorIntegrityRecord;
  portrait: RgbaImage;
  sampleSheets: Record<CharacterSpriteState, RgbaImage>;
  directionFrames: Record<CharacterSpriteDirection, RgbaImage>;
}

interface ProvenanceFileRecord {
  path: string;
  sha256: string;
}

interface ActorAssetProvenance {
  recipeId: string;
  recipe: ProvenanceFileRecord;
  generator: ProvenanceFileRecord;
  pngLibrary: ProvenanceFileRecord;
  spriteReference: ProvenanceFileRecord & { id: string };
  portraitReference: ProvenanceFileRecord & { id: string };
}

interface GeneratedTarget {
  label: string;
  stagedPath: string;
  finalPath: string;
}

const RECIPE = JSON.parse(readFileSync(RECIPE_PATH, 'utf8')) as ActorRecipe;
if (RECIPE.schemaVersion !== 2) {
  throw new Error(`Expected grounded actor recipe schemaVersion 2, got ${RECIPE.schemaVersion}`);
}
const ACTOR_RECIPE_ID = RECIPE.recipeId;
const SPRITE_REFERENCE_PATH = path.resolve(REPOSITORY_ROOT, RECIPE.spriteReference.path);
const PORTRAIT_REFERENCE_PATH = path.resolve(REPOSITORY_ROOT, RECIPE.portraitReference.path);

const GENERATED_TARGETS: readonly GeneratedTarget[] = [
  {
    label: 'characters',
    stagedPath: CHARACTER_OUTPUT_DIR,
    finalPath: FINAL_CHARACTER_OUTPUT_DIR,
  },
  {
    label: 'portraits',
    stagedPath: PORTRAIT_OUTPUT_DIR,
    finalPath: FINAL_PORTRAIT_OUTPUT_DIR,
  },
  {
    label: 'proof',
    stagedPath: PROOF_OUTPUT_DIR,
    finalPath: FINAL_PROOF_OUTPUT_DIR,
  },
  {
    label: 'generated-integrity-module',
    stagedPath: INTEGRITY_TS_PATH,
    finalPath: FINAL_INTEGRITY_TS_PATH,
  },
];

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value));

const assertSafeRepositorySourcePath = (relativePath: string): string => {
  if (
    path.isAbsolute(relativePath) ||
    relativePath.includes('..') ||
    !relativePath.startsWith('art/actors/') ||
    path.extname(relativePath).toLowerCase() !== '.png'
  ) {
    throw new Error(`Unsafe actor source path: ${JSON.stringify(relativePath)}`);
  }
  const resolved = path.resolve(REPOSITORY_ROOT, relativePath);
  const sourceRoot = `${path.resolve(REPOSITORY_ROOT, 'art', 'actors')}${path.sep}`;
  if (!resolved.startsWith(sourceRoot)) {
    throw new Error(`Actor source escapes the source root: ${JSON.stringify(relativePath)}`);
  }
  return resolved;
};

const readVerifiedPng = async (source: SourceFileRecipe, label: string): Promise<RgbaImage> => {
  const resolved = assertSafeRepositorySourcePath(source.path);
  const buffer = await fs.readFile(resolved);
  const actualSha256 = sha256Hex(buffer);
  if (actualSha256 !== source.sha256) {
    throw new Error(`${label} hash mismatch: expected ${source.sha256}, got ${actualSha256}`);
  }
  return decodeRgbaPng(buffer);
};

const chromaKeyGreen = (source: RgbaImage): RgbaImage => {
  const image: RgbaImage = {
    width: source.width,
    height: source.height,
    data: new Uint8Array(source.data),
  };
  const { greenDominance, minimumGreen, softEdgePx } =
    RECIPE.renderContract.sourceNormalization.chromaKey;
  const feather = 0.22 + softEdgePx * 0.04;

  for (let offset = 0; offset < image.data.length; offset += 4) {
    const red = image.data[offset];
    const green = image.data[offset + 1];
    const blue = image.data[offset + 2];
    const alpha = image.data[offset + 3];
    const competingChannel = Math.max(red, blue, 1);
    const dominance = green / competingChannel;
    if (green >= minimumGreen && dominance >= greenDominance) {
      const strength = clamp((dominance - greenDominance) / feather, 0, 1);
      image.data[offset + 3] = Math.round(alpha * (1 - strength));
    }

    if (image.data[offset + 3] > 0 && green > competingChannel) {
      image.data[offset + 1] = Math.min(green, competingChannel + 12);
    }
  }
  return image;
};

const componentCenter = (component: {
  alphaBounds: { x: number; y: number; width: number; height: number };
}): { x: number; y: number } => ({
  x: component.alphaBounds.x + component.alphaBounds.width / 2,
  y: component.alphaBounds.y + component.alphaBounds.height / 2,
});

const extractAuthoredAtlasRows = (
  source: RgbaImage,
  rowCount: number,
  label: string
): RgbaImage[][] => {
  const keyed = chromaKeyGreen(source);
  const { authoredColumns, minimumComponentPixels } =
    RECIPE.renderContract.sourceNormalization.sourceFigureExtraction;
  const expectedFigureCount = authoredColumns * rowCount;
  const candidates = findAlphaComponents(keyed)
    .filter((component) => component.alphaPixelCount >= minimumComponentPixels)
    .sort((left, right) => {
      const leftCenter = componentCenter(left);
      const rightCenter = componentCenter(right);
      return leftCenter.y - rightCenter.y || leftCenter.x - rightCenter.x;
    });

  if (candidates.length < expectedFigureCount) {
    throw new Error(
      `${label} contains ${candidates.length} complete keyed figures; expected at least ${expectedFigureCount}`
    );
  }

  const selected = candidates.slice(0, expectedFigureCount);
  const rows: RgbaImage[][] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const components = selected
      .slice(rowIndex * authoredColumns, (rowIndex + 1) * authoredColumns)
      .sort((left, right) => componentCenter(left).x - componentCenter(right).x);
    if (components.length !== authoredColumns) {
      throw new Error(
        `${label} row ${rowIndex} contains ${components.length} keyed figures; expected ${authoredColumns}`
      );
    }
    rows.push(components.map((component) => extractAlphaComponent(keyed, component)));
  }
  return rows;
};

const cropToAlpha = (source: RgbaImage, alphaThreshold = 8): RgbaImage => {
  const measurement = measureAlpha(source, alphaThreshold);
  const { x, y, width, height } = measurement.alphaBounds;
  if (width <= 0 || height <= 0) throw new Error('Source frame became empty after chroma key');
  return extractRgbaRegion(source, x, y, width, height);
};

const blit = (target: RgbaImage, source: RgbaImage, targetX: number, targetY: number): void => {
  for (let y = 0; y < source.height; y += 1) {
    const outputY = targetY + y;
    if (outputY < 0 || outputY >= target.height) continue;
    for (let x = 0; x < source.width; x += 1) {
      const outputX = targetX + x;
      if (outputX < 0 || outputX >= target.width) continue;
      const sourceOffset = (y * source.width + x) * 4;
      const targetOffset = (outputY * target.width + outputX) * 4;
      target.data.set(source.data.subarray(sourceOffset, sourceOffset + 4), targetOffset);
    }
  }
};

const composite = (target: RgbaImage, source: RgbaImage, targetX: number, targetY: number): void => {
  for (let y = 0; y < source.height; y += 1) {
    const outputY = targetY + y;
    if (outputY < 0 || outputY >= target.height) continue;
    for (let x = 0; x < source.width; x += 1) {
      const outputX = targetX + x;
      if (outputX < 0 || outputX >= target.width) continue;
      const sourceOffset = (y * source.width + x) * 4;
      const targetOffset = (outputY * target.width + outputX) * 4;
      const sourceAlpha = source.data[sourceOffset + 3] / 255;
      const targetAlpha = target.data[targetOffset + 3] / 255;
      const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
      if (outputAlpha <= 0) continue;
      for (let channel = 0; channel < 3; channel += 1) {
        target.data[targetOffset + channel] = Math.round(
          (source.data[sourceOffset + channel] * sourceAlpha +
            target.data[targetOffset + channel] * targetAlpha * (1 - sourceAlpha)) /
            outputAlpha
        );
      }
      target.data[targetOffset + 3] = Math.round(outputAlpha * 255);
    }
  }
};

const normalizeWorldFrame = (sourceCell: RgbaImage): RgbaImage => {
  const cropped = cropToAlpha(sourceCell);
  const { targetAlphaHeightPx, maxAlphaWidthPx, footRowPx } =
    RECIPE.renderContract.sourceNormalization;
  const scale = Math.min(
    targetAlphaHeightPx / cropped.height,
    maxAlphaWidthPx / cropped.width
  );
  const width = Math.max(1, Math.round(cropped.width * scale));
  const height = Math.max(1, Math.round(cropped.height * scale));
  const resized = resizeRgbaBilinear(cropped, width, height);
  const resizedMeasurement = measureAlpha(resized);
  if (resizedMeasurement.footContactRowPx < 0) {
    throw new Error('Normalized source frame contains no visible actor pixels');
  }

  const output: RgbaImage = {
    width: RECIPE.renderContract.frameWidth,
    height: RECIPE.renderContract.frameHeight,
    data: new Uint8Array(
      RECIPE.renderContract.frameWidth * RECIPE.renderContract.frameHeight * 4
    ),
  };
  const centerX = resizedMeasurement.alphaBounds.x + resizedMeasurement.alphaBounds.width / 2;
  const targetX = Math.round(output.width / 2 - centerX);
  const targetY = footRowPx - resizedMeasurement.footContactRowPx;
  blit(output, resized, targetX, targetY);
  return output;
};

const mirrorHorizontal = (source: RgbaImage): RgbaImage => {
  const output: RgbaImage = {
    width: source.width,
    height: source.height,
    data: new Uint8Array(source.data.length),
  };
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceOffset = (y * source.width + x) * 4;
      const targetOffset = (y * source.width + (source.width - 1 - x)) * 4;
      output.data.set(source.data.subarray(sourceOffset, sourceOffset + 4), targetOffset);
    }
  }
  return output;
};

const translateFrame = (source: RgbaImage, offsetX: number, offsetY: number): RgbaImage => {
  const output: RgbaImage = {
    width: source.width,
    height: source.height,
    data: new Uint8Array(source.data.length),
  };
  blit(output, source, offsetX, offsetY);
  return output;
};

const TEMPLATE_ROW_BY_DIRECTION: Record<CharacterSpriteDirection, number> = {
  north: 4,
  'north-east': 3,
  east: 2,
  'south-east': 1,
  south: 0,
  'south-west': 1,
  west: 6,
  'north-west': 5,
};

const shouldMirrorTemplateDirection = (direction: CharacterSpriteDirection): boolean =>
  direction === 'south-east';

const sevenRowSourceDirection = (
  direction: CharacterSpriteDirection
): { row: number; mirror: boolean; northOverride: boolean } => {
  switch (direction) {
    case 'south':
      return { row: 0, mirror: false, northOverride: false };
    case 'south-west':
      return { row: 1, mirror: false, northOverride: false };
    case 'south-east':
      return { row: 1, mirror: true, northOverride: false };
    case 'east':
      return { row: 2, mirror: false, northOverride: false };
    case 'west':
      return { row: 2, mirror: true, northOverride: false };
    case 'north-east':
      return { row: 3, mirror: false, northOverride: false };
    case 'north-west':
      return { row: 3, mirror: true, northOverride: false };
    case 'north':
      return { row: 0, mirror: false, northOverride: true };
  }
};

const extractMoveFrames = (
  source: LoadedActorSource,
  recipe: SpriteSourceRecipe,
  direction: CharacterSpriteDirection
): RgbaImage[] => {
  const frames: RgbaImage[] = [];
  if (recipe.layout === 'template-eight') {
    const row = TEMPLATE_ROW_BY_DIRECTION[direction];
    for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
      const sourceFrame = source.rows[row]?.[frameIndex];
      if (!sourceFrame) throw new Error(`Template source is missing row ${row}, frame ${frameIndex}`);
      const normalized = normalizeWorldFrame(sourceFrame);
      frames.push(shouldMirrorTemplateDirection(direction) ? mirrorHorizontal(normalized) : normalized);
    }
    return frames;
  }

  const selection = sevenRowSourceDirection(direction);
  const selectedRows = selection.northOverride ? source.northOverrideRows : source.rows;
  if (!selectedRows) throw new Error('Seven-row actor source is missing its north override');
  for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
    const sourceFrame = selectedRows[selection.row]?.[frameIndex];
    if (!sourceFrame) {
      throw new Error(`Seven-row source is missing row ${selection.row}, frame ${frameIndex}`);
    }
    const normalized = normalizeWorldFrame(sourceFrame);
    frames.push(selection.mirror ? mirrorHorizontal(normalized) : normalized);
  }
  return frames;
};

const interactionDirectionSign = (direction: CharacterSpriteDirection): number => {
  if (direction.includes('east')) return 1;
  if (direction.includes('west')) return -1;
  return 1;
};

const deriveStateFrames = (
  moveFrames: readonly RgbaImage[],
  state: CharacterSpriteState,
  direction: CharacterSpriteDirection
): RgbaImage[] => {
  if (state === 'move') return [...moveFrames];
  const base = moveFrames[1];
  if (!base) throw new Error(`Missing neutral source frame for ${state}-${direction}`);
  if (state === 'idle') {
    return [
      translateFrame(base, 0, 0),
      translateFrame(base, 0, -1),
      translateFrame(base, 0, 0),
      translateFrame(base, 0, 0),
    ];
  }
  const sign = interactionDirectionSign(direction);
  return [
    translateFrame(base, 0, 0),
    translateFrame(base, sign, 0),
    translateFrame(base, sign * 2, -1),
    translateFrame(base, sign, 0),
  ];
};

const createSheet = (frames: readonly RgbaImage[]): {
  image: RgbaImage;
  frames: CharacterSpriteFrameMetrics[];
} => {
  if (frames.length !== 4) throw new Error(`Expected four actor frames, got ${frames.length}`);
  const image: RgbaImage = {
    width: RECIPE.renderContract.frameWidth * RECIPE.renderContract.frameCount,
    height: RECIPE.renderContract.frameHeight,
    data: new Uint8Array(
      RECIPE.renderContract.frameWidth *
        RECIPE.renderContract.frameCount *
        RECIPE.renderContract.frameHeight *
        4
    ),
  };
  frames.forEach((frame, frameIndex) => {
    blit(image, frame, frameIndex * RECIPE.renderContract.frameWidth, 0);
  });
  return { image, frames: frames.map((frame) => measureAlpha(frame)) };
};

const deriveReferencePortrait = (
  board: RgbaImage,
  actorId: string,
  crop: ActorRecipeEntry['portraitCrop']
): RgbaImage => {
  const { x, y, width, height } = crop;
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > board.width || y + height > board.height) {
    throw new Error(`Portrait crop for ${actorId} is outside the portrait reference board`);
  }
  return resizeRgbaBilinear(extractRgbaRegion(board, x, y, width, height), 256, 256);
};

const normalizeGeorgePresentation = (source: RgbaImage): RgbaImage => {
  const cropped = cropToAlpha(chromaKeyGreen(source));
  const scale = Math.min(200 / cropped.width, 200 / cropped.height);
  const width = Math.max(1, Math.round(cropped.width * scale));
  const height = Math.max(1, Math.round(cropped.height * scale));
  const resized = resizeRgbaBilinear(cropped, width, height);
  const output: RgbaImage = { width: 256, height: 256, data: new Uint8Array(256 * 256 * 4) };
  blit(output, resized, Math.round((256 - width) / 2), 230 - height);
  return output;
};

const fillImage = (width: number, height: number, hex: number): RgbaImage => {
  const image: RgbaImage = { width, height, data: new Uint8Array(width * height * 4) };
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    image.data[offset] = (hex >> 16) & 0xff;
    image.data[offset + 1] = (hex >> 8) & 0xff;
    image.data[offset + 2] = hex & 0xff;
    image.data[offset + 3] = 255;
  }
  return image;
};

const writePng = async (filePath: string, image: RgbaImage): Promise<IntegrityRecord> => {
  const png = encodeRgbaPng(image);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, png);
  return {
    sha256: sha256Hex(png),
    compressedBytes: png.length,
    decodedBytes: image.width * image.height * 4,
  };
};

const writeJson = async (filePath: string, value: unknown): Promise<IntegrityRecord> => {
  const buffer = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return {
    sha256: sha256Hex(buffer),
    compressedBytes: buffer.length,
    decodedBytes: buffer.length,
  };
};

const buildActor = async (
  entry: CharacterSpriteManifestEntry,
  actorRecipe: ActorRecipeEntry,
  source: LoadedActorSource,
  portraitReferenceBoard: RgbaImage
): Promise<BuiltActor> => {
  const actorDir = path.join(CHARACTER_OUTPUT_DIR, entry.spriteSetId);
  const states = {} as CharacterSpriteSheetMetrics['states'];
  const sheetIntegrity: Record<string, IntegrityRecord> = {};
  const sampleSheets = {} as Record<CharacterSpriteState, RgbaImage>;
  const directionFrames = {} as Record<CharacterSpriteDirection, RgbaImage>;

  for (const direction of CHARACTER_SPRITE_DIRECTIONS) {
    const moveFrames = extractMoveFrames(source, actorRecipe.spriteSource, direction);
    for (const state of CHARACTER_SPRITE_STATES) {
      states[state] ??= {} as CharacterSpriteSheetMetrics['states'][CharacterSpriteState];
      const sheet = createSheet(deriveStateFrames(moveFrames, state, direction));
      const key = `${state}-${direction}`;
      states[state][direction] = { frames: sheet.frames };
      sheetIntegrity[key] = await writePng(path.join(actorDir, `${key}.png`), sheet.image);
      if (direction === 'south-east') sampleSheets[state] = sheet.image;
      if (state === 'idle') {
        directionFrames[direction] = extractRgbaRegion(sheet.image, 64, 0, 64, 96);
      }
    }
  }

  const metrics: CharacterSpriteSheetMetrics = {
    schemaVersion: 2,
    actorId: entry.actorId,
    frameWidth: 64,
    frameHeight: 96,
    origin: { x: 0.5, y: 0.92 },
    alphaOccupancy: entry.alphaOccupancy,
    states,
  };
  const metricsIntegrity = await writeJson(path.join(actorDir, 'sheet-metrics.json'), metrics);
  const portrait = deriveReferencePortrait(
    portraitReferenceBoard,
    entry.actorId,
    actorRecipe.portraitCrop
  );
  const portraitIntegrity = await writePng(
    path.join(PORTRAIT_OUTPUT_DIR, `${entry.actorId}.png`),
    portrait
  );

  return {
    integrity: {
      portrait: portraitIntegrity,
      sheets: sheetIntegrity,
      metrics: metricsIntegrity,
    },
    portrait,
    sampleSheets,
    directionFrames,
  };
};

const composeProofBoards = async (
  built: Record<string, BuiltActor>,
  takahiro: RgbaImage,
  george: RgbaImage
): Promise<Record<string, IntegrityRecord>> => {
  const proofIntegrity: Record<string, IntegrityRecord> = {};
  const actorBoard = fillImage(1280, 384, 0x17191a);
  CHARACTER_SPRITE_MANIFEST.forEach((entry, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const cellX = column * 320;
    const cellY = row * 128;
    composite(actorBoard, resizeRgbaBilinear(built[entry.actorId].portrait, 120, 120), cellX + 4, cellY + 4);
    CHARACTER_SPRITE_STATES.forEach((state, stateIndex) => {
      const frame = extractRgbaRegion(built[entry.actorId].sampleSheets[state], 64, 0, 64, 96);
      composite(actorBoard, frame, cellX + 124 + stateIndex * 64, cellY + 16);
    });
  });
  proofIntegrity.actorRoster = await writePng(
    path.join(PROOF_OUTPUT_DIR, 'actor-roster-board.png'),
    actorBoard
  );

  const portraitBoard = fillImage(512, 512, 0x17191a);
  const portraits = [
    ...CHARACTER_SPRITE_MANIFEST.map((entry) => built[entry.actorId].portrait),
    takahiro,
    george,
  ];
  portraits.forEach((portrait, index) => {
    composite(
      portraitBoard,
      resizeRgbaBilinear(portrait, 128, 128),
      (index % 4) * 128,
      Math.floor(index / 4) * 128
    );
  });
  proofIntegrity.portraitRoster = await writePng(
    path.join(PROOF_OUTPUT_DIR, 'portrait-roster-board.png'),
    portraitBoard
  );

  const directionBoard = fillImage(512, 1152, 0x17191a);
  CHARACTER_SPRITE_MANIFEST.forEach((entry, actorIndex) => {
    CHARACTER_SPRITE_DIRECTIONS.forEach((direction, directionIndex) => {
      composite(
        directionBoard,
        built[entry.actorId].directionFrames[direction],
        directionIndex * 64,
        actorIndex * 96
      );
    });
  });
  proofIntegrity.actorDirections = await writePng(
    path.join(PROOF_OUTPUT_DIR, 'actor-direction-board.png'),
    directionBoard
  );

  const animationBoard = fillImage(768, 1152, 0x17191a);
  CHARACTER_SPRITE_MANIFEST.forEach((entry, actorIndex) => {
    CHARACTER_SPRITE_STATES.forEach((state, stateIndex) => {
      const sheet = built[entry.actorId].sampleSheets[state];
      for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
        composite(
          animationBoard,
          extractRgbaRegion(sheet, frameIndex * 64, 0, 64, 96),
          stateIndex * 256 + frameIndex * 64,
          actorIndex * 96
        );
      }
    });
  });
  proofIntegrity.actorAnimations = await writePng(
    path.join(PROOF_OUTPUT_DIR, 'actor-animation-board.png'),
    animationBoard
  );
  return proofIntegrity;
};

const renderIntegrityModule = (
  actorIntegrity: Record<string, ActorIntegrityRecord>,
  nonWorldIntegrity: Record<string, IntegrityRecord>,
  provenance: ActorAssetProvenance
): string => {
  const portraits = Object.fromEntries(
    Object.entries(actorIntegrity).map(([actorId, value]) => [actorId, value.portrait])
  );
  return `// Generated by scripts/generate-grounded-character-assets.ts. Do not edit by hand.\n\nexport interface GeneratedAssetIntegrity {\n  sha256: string;\n  compressedBytes: number;\n  decodedBytes: number;\n}\n\nexport const GENERATED_ACTOR_PROVENANCE = ${JSON.stringify(
    provenance,
    null,
    2
  )} as const;\n\nexport const ACTOR_PORTRAIT_INTEGRITY: Record<string, GeneratedAssetIntegrity> = ${JSON.stringify(
    portraits,
    null,
    2
  )};\n\nexport const NON_WORLD_PRESENTATION_INTEGRITY: Record<string, GeneratedAssetIntegrity> = ${JSON.stringify(
    nonWorldIntegrity,
    null,
    2
  )};\n`;
};

const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const collectFileHashes = async (
  targetPath: string,
  relativePath = ''
): Promise<Record<string, string>> => {
  const stat = await fs.lstat(targetPath);
  if (stat.isFile()) {
    return { [relativePath || '.']: sha256Hex(await fs.readFile(targetPath)) };
  }
  if (!stat.isDirectory()) {
    throw new Error(`Generated target is not a regular file or directory: ${targetPath}`);
  }
  const hashes: Record<string, string> = {};
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    Object.assign(
      hashes,
      await collectFileHashes(path.join(targetPath, entry.name), childRelativePath)
    );
  }
  return hashes;
};

const checkGeneratedOutputs = async (): Promise<void> => {
  for (const target of GENERATED_TARGETS) {
    if (!(await pathExists(target.finalPath))) {
      throw new Error(`${target.label}: published output is missing`);
    }
    const staged = await collectFileHashes(target.stagedPath);
    const published = await collectFileHashes(target.finalPath);
    if (JSON.stringify(staged) !== JSON.stringify(published)) {
      throw new Error(`${target.label}: published output does not match deterministic regeneration`);
    }
  }
};

const publishGeneratedOutputs = async (): Promise<void> => {
  const backupRoot = path.join(STAGING_ROOT, '.backup');
  const backups = new Map<string, string>();
  const published: GeneratedTarget[] = [];
  await fs.mkdir(backupRoot, { recursive: true });
  try {
    for (const target of GENERATED_TARGETS) {
      await fs.mkdir(path.dirname(target.finalPath), { recursive: true });
      if (await pathExists(target.finalPath)) {
        const backupPath = path.join(backupRoot, target.label);
        await fs.rename(target.finalPath, backupPath);
        backups.set(target.finalPath, backupPath);
      }
    }
    for (const target of GENERATED_TARGETS) {
      await fs.rename(target.stagedPath, target.finalPath);
      published.push(target);
    }
  } catch (error) {
    for (const target of [...published].reverse()) {
      await fs.rm(target.finalPath, { recursive: true, force: true });
    }
    for (const [finalPath, backupPath] of [...backups.entries()].reverse()) {
      if (await pathExists(backupPath)) await fs.rename(backupPath, finalPath);
    }
    throw error;
  }
  await fs.rm(backupRoot, { recursive: true, force: true });
};

const main = async (): Promise<void> => {
  const generatorPath = path.resolve(import.meta.dirname, 'generate-grounded-character-assets.ts');
  const pngLibraryPath = path.resolve(import.meta.dirname, 'lib', 'rgbaPng.ts');
  const [spriteReference, portraitReference, recipeSource, generatorSource, pngLibrarySource] =
    await Promise.all([
      fs.readFile(SPRITE_REFERENCE_PATH),
      fs.readFile(PORTRAIT_REFERENCE_PATH),
      fs.readFile(RECIPE_PATH),
      fs.readFile(generatorPath),
      fs.readFile(pngLibraryPath),
    ]);
  const spriteReferenceSha256 = sha256Hex(spriteReference);
  if (spriteReferenceSha256 !== RECIPE.spriteReference.sha256) {
    throw new Error(`Cast reference hash mismatch: ${spriteReferenceSha256}`);
  }
  const portraitReferenceSha256 = sha256Hex(portraitReference);
  if (portraitReferenceSha256 !== RECIPE.portraitReference.sha256) {
    throw new Error(`Portrait reference hash mismatch: ${portraitReferenceSha256}`);
  }

  const manifestActorIds = CHARACTER_SPRITE_MANIFEST.map((entry) => entry.actorId);
  const recipeActorIds = Object.keys(RECIPE.actors);
  if (JSON.stringify(recipeActorIds) !== JSON.stringify(manifestActorIds)) {
    throw new Error('Actor recipe order/roster does not exactly match the runtime manifest');
  }

  const actorSources: Record<string, LoadedActorSource> = {};
  for (const actorId of manifestActorIds) {
    const spriteSource = RECIPE.actors[actorId].spriteSource;
    const sourceAtlas = await readVerifiedPng(spriteSource, `${actorId} source atlas`);
    const northOverride = spriteSource.northOverride
      ? await readVerifiedPng(spriteSource.northOverride, `${actorId} north source atlas`)
      : undefined;
    actorSources[actorId] = {
      rows: extractAuthoredAtlasRows(
        sourceAtlas,
        RECIPE.renderContract.sourceNormalization.sourceFigureExtraction.authoredRows,
        `${actorId} source atlas`
      ),
      northOverrideRows: northOverride
        ? extractAuthoredAtlasRows(northOverride, 1, `${actorId} north source atlas`)
        : undefined,
    };
    if (
      spriteSource.layout === 'seven-plus-north-strip' &&
      !actorSources[actorId].northOverrideRows
    ) {
      throw new Error(`${actorId} requires a hashed north override source`);
    }
  }

  const [takahiroSource, georgeSource] = await Promise.all([
    readVerifiedPng(RECIPE.presentations.takahiroBroadcast, 'Takahiro broadcast source'),
    readVerifiedPng(RECIPE.presentations.georgeAr, 'George AR source'),
  ]);

  const provenance: ActorAssetProvenance = {
    recipeId: ACTOR_RECIPE_ID,
    recipe: {
      path: path.relative(REPOSITORY_ROOT, RECIPE_PATH),
      sha256: sha256Hex(recipeSource),
    },
    generator: {
      path: path.relative(REPOSITORY_ROOT, generatorPath),
      sha256: sha256Hex(generatorSource),
    },
    pngLibrary: {
      path: path.relative(REPOSITORY_ROOT, pngLibraryPath),
      sha256: sha256Hex(pngLibrarySource),
    },
    spriteReference: {
      id: RECIPE.spriteReference.id,
      path: path.relative(REPOSITORY_ROOT, SPRITE_REFERENCE_PATH),
      sha256: spriteReferenceSha256,
    },
    portraitReference: {
      id: RECIPE.portraitReference.id,
      path: path.relative(REPOSITORY_ROOT, PORTRAIT_REFERENCE_PATH),
      sha256: portraitReferenceSha256,
    },
  };

  const portraitReferenceBoard = decodeRgbaPng(portraitReference);
  const actorIntegrity: Record<string, ActorIntegrityRecord> = {};
  const built: Record<string, BuiltActor> = {};
  for (const entry of CHARACTER_SPRITE_MANIFEST) {
    const actor = await buildActor(
      entry,
      RECIPE.actors[entry.actorId],
      actorSources[entry.actorId],
      portraitReferenceBoard
    );
    actorIntegrity[entry.actorId] = actor.integrity;
    built[entry.actorId] = actor;
  }

  const takahiro = resizeRgbaBilinear(takahiroSource, 256, 256);
  const george = normalizeGeorgePresentation(georgeSource);
  const nonWorldIntegrity = {
    takahiroBroadcast: await writePng(
      path.join(STAGING_APP_ROOT, 'public', NON_WORLD_CHARACTER_PRESENTATIONS.takahiroBroadcast.path),
      takahiro
    ),
    georgeAr: await writePng(
      path.join(STAGING_APP_ROOT, 'public', NON_WORLD_CHARACTER_PRESENTATIONS.georgeAr.path),
      george
    ),
  };

  const proofIntegrity = await composeProofBoards(built, takahiro, george);
  const proofManifest = {
    schemaVersion: 1,
    recipeId: ACTOR_RECIPE_ID,
    identityOrder: manifestActorIds,
    states: CHARACTER_SPRITE_STATES,
    directions: CHARACTER_SPRITE_DIRECTIONS,
    images: {
      actorRoster: { path: 'actor-roster-board.png', ...proofIntegrity.actorRoster },
      portraitRoster: { path: 'portrait-roster-board.png', ...proofIntegrity.portraitRoster },
      actorDirections: { path: 'actor-direction-board.png', ...proofIntegrity.actorDirections },
      actorAnimations: { path: 'actor-animation-board.png', ...proofIntegrity.actorAnimations },
    },
    inspectionStatus: 'pending-human-review',
  };
  const proofManifestIntegrity = await writeJson(
    path.join(PROOF_OUTPUT_DIR, 'proof-manifest.json'),
    proofManifest
  );

  const integrityPayload = {
    schemaVersion: 2,
    provenance,
    actors: actorIntegrity,
    nonWorldPresentations: nonWorldIntegrity,
    proof: {
      images: proofIntegrity,
      manifest: proofManifestIntegrity,
    },
  };
  await writeJson(INTEGRITY_JSON_PATH, integrityPayload);
  await fs.mkdir(path.dirname(INTEGRITY_TS_PATH), { recursive: true });
  await fs.writeFile(
    INTEGRITY_TS_PATH,
    renderIntegrityModule(actorIntegrity, nonWorldIntegrity, provenance),
    'utf8'
  );

  if (BUILD_MODE === 'check') await checkGeneratedOutputs();
  else await publishGeneratedOutputs();

  const sheetCount =
    CHARACTER_SPRITE_MANIFEST.length *
    CHARACTER_SPRITE_STATES.length *
    CHARACTER_SPRITE_DIRECTIONS.length;
  console.log(
    `[sprites] ${BUILD_MODE === 'check' ? 'Verified' : 'Published'} ${CHARACTER_SPRITE_MANIFEST.length} source-backed actors, ${sheetCount} sheets, 12 portraits, Takahiro, George, and proof boards`
  );
};

void main().finally(async () => {
  await fs.rm(STAGING_ROOT, { recursive: true, force: true });
});
