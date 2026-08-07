import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type CharacterSpriteFrameMetrics,
  type CharacterSpriteManifestEntry,
  type CharacterSpriteSheetMetrics,
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_STATES,
  NON_WORLD_CHARACTER_PRESENTATIONS,
} from '../../src/content/characters/spriteManifest';
import {
  decodeRgbaPng,
  extractRgbaRegion,
  findAlphaComponents,
  measureAlpha,
  sha256Hex,
  type RgbaImage,
} from './rgbaPng';

interface IntegrityFileRecord {
  sha256: string;
  compressedBytes: number;
  decodedBytes: number;
}

interface ActorIntegrityRecord {
  portrait: IntegrityFileRecord;
  sheets: Record<string, IntegrityFileRecord>;
  metrics: IntegrityFileRecord;
}

interface ProvenanceFileRecord {
  path: string;
  sha256: string;
}

interface ReferenceProvenanceRecord extends ProvenanceFileRecord {
  id: string;
}

interface ActorAssetProvenance {
  recipeId: string;
  recipe: ProvenanceFileRecord;
  generator: ProvenanceFileRecord;
  pngLibrary: ProvenanceFileRecord;
  spriteReference: ReferenceProvenanceRecord;
  portraitReference: ReferenceProvenanceRecord;
}

interface ProofIntegrityRecord {
  images: Record<string, IntegrityFileRecord>;
  manifest: IntegrityFileRecord;
}

interface ActorAssetIntegrity {
  schemaVersion: number;
  provenance: ActorAssetProvenance;
  actors: Record<string, ActorIntegrityRecord>;
  nonWorldPresentations: Record<string, IntegrityFileRecord>;
  proof: ProofIntegrityRecord;
}

interface ReferenceMetadata {
  schemaVersion: number;
  referenceId: string;
  image: string;
  sha256: string;
  layout?: {
    identityOrder?: string[];
  };
}

export interface CharacterAssetValidationOptions {
  appRoot?: string;
  repositoryRoot?: string;
}

export interface CharacterAssetValidationSummary {
  actors: number;
  sheets: number;
  frames: number;
  portraits: number;
  nonWorldPresentations: number;
  compressedBytes: number;
  decodedBytes: number;
}

export interface CharacterAssetValidationReport {
  errors: string[];
  summary: CharacterAssetValidationSummary;
  appRoot: string;
}

const EXPECTED_RECIPE_ID = 'get206-grounded-actor-v3';
const MAX_DETACHED_COMPONENT_PIXELS = 5;
const EXPECTED_RECIPE_PATH = path.join(
  'art',
  'actors',
  'get206',
  'manifests',
  'grounded-actor-recipe.json'
);
const EXPECTED_GENERATOR_PATH = path.join(
  'the-getaway',
  'scripts',
  'generate-grounded-character-assets.ts'
);
const EXPECTED_PNG_LIBRARY_PATH = path.join('the-getaway', 'scripts', 'lib', 'rgbaPng.ts');
const EXPECTED_REFERENCE_DIRECTORY = path.join('art', 'actors', 'get206', 'references');
const EXPECTED_REFERENCES = {
  spriteReference: {
    id: 'get206-grounded-cast-board-v1',
    file: 'grounded-cast-board-v1.png',
    metadataFile: 'grounded-cast-board-v1.json',
    width: 1369,
    height: 1149,
  },
  portraitReference: {
    id: 'get206-grounded-portrait-board-v1',
    file: 'grounded-portrait-board-v1.png',
    metadataFile: 'grounded-portrait-board-v1.json',
    width: 1448,
    height: 1086,
  },
} as const;
const EXPECTED_PROOF_DIRECTORY = path.join('art', 'actors', 'get206', 'proof');
const EXPECTED_PROOF_IMAGES = {
  actorRoster: { file: 'actor-roster-board.png', width: 1280, height: 384 },
  portraitRoster: { file: 'portrait-roster-board.png', width: 512, height: 512 },
  actorDirections: { file: 'actor-direction-board.png', width: 512, height: 1152 },
  actorAnimations: { file: 'actor-animation-board.png', width: 768, height: 1152 },
} as const;
const EXPECTED_INTEGRITY_KEYS = [
  'actors',
  'nonWorldPresentations',
  'proof',
  'provenance',
  'schemaVersion',
];
const EXPECTED_FILE_RECORD_KEYS = ['compressedBytes', 'decodedBytes', 'sha256'] as const;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const sorted = (values: Iterable<string>): string[] => [...values].sort();

const sameStrings = (actual: Iterable<string>, expected: Iterable<string>): boolean => {
  const actualSorted = sorted(actual);
  const expectedSorted = sorted(expected);
  return (
    actualSorted.length === expectedSorted.length &&
    actualSorted.every((value, index) => value === expectedSorted[index])
  );
};

const formatKeyDiff = (actual: Iterable<string>, expected: Iterable<string>): string => {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = sorted([...expectedSet].filter((value) => !actualSet.has(value)));
  const extra = sorted([...actualSet].filter((value) => !expectedSet.has(value)));
  return [missing.length > 0 ? `missing [${missing.join(', ')}]` : '', extra.length > 0 ? `extra [${extra.join(', ')}]` : '']
    .filter(Boolean)
    .join('; ');
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const assertExactKeys = (
  label: string,
  value: unknown,
  expectedKeys: Iterable<string>,
  errors: string[]
): value is Record<string, unknown> => {
  if (!isRecord(value)) {
    errors.push(`${label}: expected an object`);
    return false;
  }

  const actualKeys = Object.keys(value);
  if (!sameStrings(actualKeys, expectedKeys)) {
    errors.push(`${label}: inventory shape mismatch (${formatKeyDiff(actualKeys, expectedKeys)})`);
    return false;
  }
  return true;
};

const assertFileRecord = (
  label: string,
  value: unknown,
  errors: string[]
): value is IntegrityFileRecord => {
  if (!assertExactKeys(label, value, EXPECTED_FILE_RECORD_KEYS, errors)) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(record.sha256)) {
    errors.push(`${label}: expected a lowercase SHA-256 digest`);
  }
  for (const key of ['compressedBytes', 'decodedBytes'] as const) {
    if (!Number.isInteger(record[key]) || (record[key] as number) <= 0) {
      errors.push(`${label}: ${key} must be a positive integer`);
    }
  }
  return true;
};

const isSafeRuntimePath = (relativePath: string): boolean => {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes('\\') || relativePath.includes('\0')) {
    return false;
  }
  const segments = relativePath.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
};

const validateRuntimePath = (label: string, relativePath: string, errors: string[]): boolean => {
  if (!isSafeRuntimePath(relativePath)) {
    errors.push(`${label}: unsafe runtime path ${JSON.stringify(relativePath)}`);
    return false;
  }
  return true;
};

const isWithin = (root: string, target: string): boolean => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

const readBuffer = async (filePath: string, label: string, errors: string[]): Promise<Buffer | undefined> => {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    errors.push(`${label}: cannot read ${filePath} (${error instanceof Error ? error.message : String(error)})`);
    return undefined;
  }
};

const readJson = async <T>(filePath: string, label: string, errors: string[]): Promise<T | undefined> => {
  const buffer = await readBuffer(filePath, label, errors);
  if (!buffer) return undefined;
  try {
    return JSON.parse(buffer.toString('utf8')) as T;
  } catch (error) {
    errors.push(`${label}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return undefined;
  }
};

const listDirectory = async (directory: string, label: string, errors: string[]): Promise<string[] | undefined> => {
  try {
    return await fs.readdir(directory);
  } catch (error) {
    errors.push(`${label}: cannot list ${directory} (${error instanceof Error ? error.message : String(error)})`);
    return undefined;
  }
};

const validateExactDirectory = async (
  directory: string,
  label: string,
  expectedNames: Iterable<string>,
  errors: string[]
): Promise<void> => {
  const names = await listDirectory(directory, label, errors);
  if (names && !sameStrings(names, expectedNames)) {
    errors.push(`${label}: unexpected inventory (${formatKeyDiff(names, expectedNames)})`);
  }
};

const validateIntegrityBytes = (
  label: string,
  buffer: Buffer,
  integrity: IntegrityFileRecord,
  errors: string[],
  decodedBytes?: number
): void => {
  const actualHash = sha256Hex(buffer);
  if (actualHash !== integrity.sha256) {
    errors.push(`${label}: SHA-256 mismatch; expected ${integrity.sha256}, got ${actualHash}`);
  }
  if (buffer.length !== integrity.compressedBytes) {
    errors.push(`${label}: compressed byte mismatch; expected ${integrity.compressedBytes}, got ${buffer.length}`);
  }
  if (decodedBytes !== undefined && decodedBytes !== integrity.decodedBytes) {
    errors.push(`${label}: decoded byte mismatch; expected ${integrity.decodedBytes}, got ${decodedBytes}`);
  }
};

const validateGeneratedIntegrityRecord = (
  label: string,
  generated: Pick<IntegrityFileRecord, (typeof EXPECTED_FILE_RECORD_KEYS)[number]>,
  central: IntegrityFileRecord,
  errors: string[]
): void => {
  for (const field of EXPECTED_FILE_RECORD_KEYS) {
    if (generated[field] !== central[field]) {
      errors.push(
        `${label}: generated TypeScript ${field} does not match central integrity; ` +
        `expected ${central[field]}, got ${generated[field]}`
      );
    }
  }
};

const pngCrc32 = (buffer: Buffer): number => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = PNG_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const validatePngStructure = (label: string, buffer: Buffer, errors: string[]): boolean => {
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    errors.push(`${label}: invalid PNG signature`);
    return false;
  }

  let offset = PNG_SIGNATURE.length;
  let chunkIndex = 0;
  let idatCount = 0;
  let foundEnd = false;
  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) {
      errors.push(`${label}: truncated PNG chunk header`);
      return false;
    }
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcOffset = dataEnd;
    if (crcOffset + 4 > buffer.length) {
      errors.push(`${label}: truncated PNG chunk payload`);
      return false;
    }
    const type = buffer.subarray(typeStart, dataStart).toString('ascii');
    if (chunkIndex === 0 && type !== 'IHDR') {
      errors.push(`${label}: first PNG chunk must be IHDR`);
      return false;
    }
    const expectedCrc = buffer.readUInt32BE(crcOffset);
    const actualCrc = pngCrc32(buffer.subarray(typeStart, dataEnd));
    if (actualCrc !== expectedCrc) {
      errors.push(
        `${label}: PNG ${type} CRC mismatch; expected ${expectedCrc.toString(16).padStart(8, '0')}, got ${actualCrc.toString(16).padStart(8, '0')}`
      );
      return false;
    }
    if (type === 'IDAT') idatCount += 1;
    offset = crcOffset + 4;
    chunkIndex += 1;
    if (type === 'IEND') {
      foundEnd = true;
      break;
    }
  }
  if (!foundEnd || idatCount === 0) {
    errors.push(`${label}: PNG requires IDAT data and a terminal IEND chunk`);
    return false;
  }
  if (offset !== buffer.length) {
    errors.push(`${label}: PNG contains trailing bytes after IEND`);
    return false;
  }
  return true;
};

const decodePng = (
  label: string,
  buffer: Buffer,
  integrity: IntegrityFileRecord,
  errors: string[]
): RgbaImage | undefined => {
  if (!validatePngStructure(label, buffer, errors)) return undefined;
  let image: RgbaImage;
  try {
    image = decodeRgbaPng(buffer);
  } catch (error) {
    errors.push(`${label}: PNG decode failed (${error instanceof Error ? error.message : String(error)})`);
    return undefined;
  }
  validateIntegrityBytes(label, buffer, integrity, errors, image.data.length);
  return image;
};

const validatePngDimensions = (
  label: string,
  image: RgbaImage,
  width: number,
  height: number,
  errors: string[]
): void => {
  if (image.width !== width || image.height !== height) {
    errors.push(`${label}: expected ${width}x${height}, got ${image.width}x${image.height}`);
  }
};

const validateOpaque = (label: string, image: RgbaImage, errors: string[]): void => {
  for (let index = 3; index < image.data.length; index += 4) {
    if (image.data[index] !== 255) {
      errors.push(`${label}: expected an opaque background; alpha ${image.data[index]} found at pixel ${(index - 3) / 4}`);
      return;
    }
  }
};

const validateTransparentPresentation = (
  label: string,
  image: RgbaImage,
  safeArea: { x: number; y: number; width: number; height: number },
  errors: string[]
): void => {
  let hasTransparentPixel = false;
  let hasVisiblePixel = false;
  for (let index = 3; index < image.data.length; index += 4) {
    hasTransparentPixel ||= image.data[index] === 0;
    hasVisiblePixel ||= image.data[index] >= 8;
  }
  if (!hasTransparentPixel || !hasVisiblePixel) {
    errors.push(`${label}: transparent presentation must contain both transparent and visible pixels`);
    return;
  }

  const measurement = measureAlpha(image);
  const minX = Math.floor(safeArea.x * image.width);
  const minY = Math.floor(safeArea.y * image.height);
  const maxX = Math.ceil((safeArea.x + safeArea.width) * image.width) - 1;
  const maxY = Math.ceil((safeArea.y + safeArea.height) * image.height) - 1;
  const boundsMaxX = measurement.alphaBounds.x + measurement.alphaBounds.width - 1;
  const boundsMaxY = measurement.alphaBounds.y + measurement.alphaBounds.height - 1;
  if (
    measurement.alphaBounds.x < minX ||
    measurement.alphaBounds.y < minY ||
    boundsMaxX > maxX ||
    boundsMaxY > maxY
  ) {
    errors.push(
      `${label}: visible alpha bounds ${JSON.stringify(measurement.alphaBounds)} exceed the authored safe area`
    );
  }
};

const validateSafeArea = (
  label: string,
  safeArea: { x: number; y: number; width: number; height: number },
  errors: string[]
): void => {
  const expected = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  if (JSON.stringify(safeArea) !== JSON.stringify(expected)) {
    errors.push(`${label}: safe area drifted from ${JSON.stringify(expected)}`);
  }
};

const validateFrameMetricShape = (
  label: string,
  metric: CharacterSpriteFrameMetrics,
  errors: string[]
): void => {
  assertExactKeys(label, metric, ['alphaBounds', 'alphaPixelCount', 'footContactRowPx'], errors);
  assertExactKeys(`${label}.alphaBounds`, metric?.alphaBounds, ['height', 'width', 'x', 'y'], errors);
};

const compareMeasurement = (
  label: string,
  actual: CharacterSpriteFrameMetrics,
  declared: CharacterSpriteFrameMetrics,
  errors: string[]
): void => {
  if (JSON.stringify(actual.alphaBounds) !== JSON.stringify(declared.alphaBounds)) {
    errors.push(
      `${label}: alpha bounds mismatch; metrics ${JSON.stringify(declared.alphaBounds)}, pixels ${JSON.stringify(actual.alphaBounds)}`
    );
  }
  if (actual.alphaPixelCount !== declared.alphaPixelCount) {
    errors.push(
      `${label}: alpha pixel count mismatch; metrics ${declared.alphaPixelCount}, pixels ${actual.alphaPixelCount}`
    );
  }
  if (actual.footContactRowPx !== declared.footContactRowPx) {
    errors.push(
      `${label}: foot row mismatch; metrics ${declared.footContactRowPx}, pixels ${actual.footContactRowPx}`
    );
  }
};

const validateMetricsHeader = (
  entry: CharacterSpriteManifestEntry,
  metrics: CharacterSpriteSheetMetrics,
  errors: string[]
): void => {
  const label = `${entry.spriteSetId}/sheet-metrics.json`;
  assertExactKeys(
    label,
    metrics,
    ['actorId', 'alphaOccupancy', 'frameHeight', 'frameWidth', 'origin', 'schemaVersion', 'states'],
    errors
  );
  if (metrics.schemaVersion !== 2) errors.push(`${label}: expected schemaVersion 2`);
  if (metrics.actorId !== entry.actorId) errors.push(`${label}: actorId must be ${entry.actorId}`);
  if (metrics.frameWidth !== entry.frameSize.width || metrics.frameHeight !== entry.frameSize.height) {
    errors.push(`${label}: frame size drifted from ${entry.frameSize.width}x${entry.frameSize.height}`);
  }
  if (JSON.stringify(metrics.origin) !== JSON.stringify(entry.origin)) {
    errors.push(`${label}: origin drifted from manifest`);
  }
  if (JSON.stringify(metrics.alphaOccupancy) !== JSON.stringify(entry.alphaOccupancy)) {
    errors.push(`${label}: alpha occupancy contract drifted from manifest`);
  }
  if (isRecord(metrics.states) && !sameStrings(Object.keys(metrics.states), CHARACTER_SPRITE_STATES)) {
    errors.push(
      `${label}: state matrix mismatch (${formatKeyDiff(Object.keys(metrics.states), CHARACTER_SPRITE_STATES)})`
    );
  }
};

const validateActor = async (
  entry: CharacterSpriteManifestEntry,
  integrity: ActorIntegrityRecord,
  appRoot: string,
  errors: string[],
  summary: CharacterAssetValidationSummary
): Promise<void> => {
  const actorLabel = entry.spriteSetId;
  const expectedSheetKeys = CHARACTER_SPRITE_STATES.flatMap((state) =>
    CHARACTER_SPRITE_DIRECTIONS.map((direction) => `${state}-${direction}`)
  );
  const expectedActorFiles = [...expectedSheetKeys.map((key) => `${key}.png`), 'sheet-metrics.json'];

  if (!validateRuntimePath(`${actorLabel}: spriteSetId`, entry.spriteSetId, errors)) return;
  const actorDirectory = path.join(appRoot, 'public', 'characters', entry.spriteSetId);
  await validateExactDirectory(actorDirectory, actorLabel, expectedActorFiles, errors);

  if (!assertExactKeys(`${actorLabel}: integrity`, integrity, ['metrics', 'portrait', 'sheets'], errors)) {
    return;
  }
  if (!assertFileRecord(`${actorLabel}: portrait integrity`, integrity.portrait, errors)) return;
  validateGeneratedIntegrityRecord(
    `${actorLabel}: portrait`,
    entry.portrait,
    integrity.portrait,
    errors
  );
  if (!assertFileRecord(`${actorLabel}: metrics integrity`, integrity.metrics, errors)) return;
  if (!isRecord(integrity.sheets)) {
    errors.push(`${actorLabel}: sheets integrity must be an object`);
    return;
  }
  const integritySheetKeys = Object.keys(integrity.sheets);
  if (!sameStrings(integritySheetKeys, expectedSheetKeys)) {
    errors.push(
      `${actorLabel}: sheet integrity matrix mismatch (${formatKeyDiff(integritySheetKeys, expectedSheetKeys)})`
    );
  }
  for (const key of integritySheetKeys) {
    if (!isSafeRuntimePath(`${key}.png`)) {
      errors.push(`${actorLabel}: unsafe sheet inventory key ${JSON.stringify(key)}`);
    }
    assertFileRecord(`${actorLabel}/${key}: integrity`, integrity.sheets[key], errors);
  }

  const metricsPath = path.join(actorDirectory, 'sheet-metrics.json');
  const metricsBuffer = await readBuffer(metricsPath, `${actorLabel}/sheet-metrics.json`, errors);
  const metrics = metricsBuffer
    ? await readJson<CharacterSpriteSheetMetrics>(metricsPath, `${actorLabel}/sheet-metrics.json`, errors)
    : undefined;
  if (metricsBuffer) {
    validateIntegrityBytes(
      `${actorLabel}/sheet-metrics.json`,
      metricsBuffer,
      integrity.metrics,
      errors,
      metricsBuffer.length
    );
  }
  if (metrics) validateMetricsHeader(entry, metrics, errors);

  for (const state of CHARACTER_SPRITE_STATES) {
    const stateMetrics = metrics?.states?.[state];
    if (stateMetrics && !sameStrings(Object.keys(stateMetrics), CHARACTER_SPRITE_DIRECTIONS)) {
      errors.push(
        `${actorLabel}/${state}: direction matrix mismatch (${formatKeyDiff(Object.keys(stateMetrics), CHARACTER_SPRITE_DIRECTIONS)})`
      );
    }

    for (const direction of CHARACTER_SPRITE_DIRECTIONS) {
      const sheetKey = `${state}-${direction}`;
      const label = `${actorLabel}/${sheetKey}`;
      const sheetIntegrity = integrity.sheets[sheetKey];
      if (!sheetIntegrity || !assertFileRecord(`${label}: integrity`, sheetIntegrity, errors)) continue;
      const buffer = await readBuffer(path.join(actorDirectory, `${sheetKey}.png`), label, errors);
      if (!buffer) continue;
      const sheet = decodePng(label, buffer, sheetIntegrity, errors);
      if (!sheet) continue;
      validatePngDimensions(
        label,
        sheet,
        entry.frameSize.width * entry.frameCount,
        entry.frameSize.height,
        errors
      );
      if (
        sheet.width !== entry.frameSize.width * entry.frameCount ||
        sheet.height !== entry.frameSize.height
      ) {
        continue;
      }

      const frames = stateMetrics?.[direction]?.frames;
      if (!Array.isArray(frames) || frames.length !== entry.frameCount) {
        errors.push(`${label}: expected exactly ${entry.frameCount} frame metrics`);
        continue;
      }

      const footRows: number[] = [];
      for (let frameIndex = 0; frameIndex < entry.frameCount; frameIndex += 1) {
        const frameLabel = `${label}#${frameIndex}`;
        const declared = frames[frameIndex];
        if (!declared || !isRecord(declared)) {
          errors.push(`${frameLabel}: missing frame metrics`);
          continue;
        }
        validateFrameMetricShape(frameLabel, declared, errors);
        const frame = extractRgbaRegion(
          sheet,
          frameIndex * entry.frameSize.width,
          0,
          entry.frameSize.width,
          entry.frameSize.height
        );
        const measured = measureAlpha(frame);
        compareMeasurement(frameLabel, measured, declared, errors);
        const alphaComponents = findAlphaComponents(frame).sort(
          (left, right) => right.alphaPixelCount - left.alphaPixelCount
        );
        const largestDetachedComponent = alphaComponents[1]?.alphaPixelCount ?? 0;
        if (largestDetachedComponent > MAX_DETACHED_COMPONENT_PIXELS) {
          errors.push(
            `${frameLabel}: detached alpha component ${largestDetachedComponent}px exceeds ${MAX_DETACHED_COMPONENT_PIXELS}px`
          );
        }
        if (measured.alphaPixelCount <= 0) errors.push(`${frameLabel}: frame is fully transparent`);
        if (
          measured.alphaBounds.height < entry.alphaOccupancy.minHeightPx ||
          measured.alphaBounds.height > entry.alphaOccupancy.maxHeightPx
        ) {
          errors.push(
            `${frameLabel}: alpha height ${measured.alphaBounds.height}px is outside ${entry.alphaOccupancy.minHeightPx}-${entry.alphaOccupancy.maxHeightPx}px`
          );
        }
        if (
          Math.abs(measured.footContactRowPx - entry.alphaOccupancy.footRowPx) >
          entry.alphaOccupancy.tolerancePx
        ) {
          errors.push(
            `${frameLabel}: foot row ${measured.footContactRowPx}px exceeds ${entry.alphaOccupancy.footRowPx}±${entry.alphaOccupancy.tolerancePx}px`
          );
        }
        footRows.push(measured.footContactRowPx);
        summary.frames += 1;
      }
      if (
        footRows.length === entry.frameCount &&
        Math.max(...footRows) - Math.min(...footRows) > entry.footAnchorTolerancePx
      ) {
        errors.push(
          `${label}: frame-to-frame foot drift ${Math.max(...footRows) - Math.min(...footRows)}px exceeds ${entry.footAnchorTolerancePx}px`
        );
      }
      summary.sheets += 1;
      summary.compressedBytes += buffer.length;
      summary.decodedBytes += sheet.data.length;
    }
  }

  const expectedPortraitPath = `portraits/level0/${entry.actorId}.png`;
  if (!validateRuntimePath(`${actorLabel}: portrait`, entry.portrait.path, errors)) return;
  if (entry.portrait.path !== expectedPortraitPath) {
    errors.push(`${actorLabel}: portrait path must be ${expectedPortraitPath}`);
  }
  validateSafeArea(`${actorLabel}: portrait`, entry.portrait.safeArea, errors);
  const portraitBuffer = await readBuffer(
    path.join(appRoot, 'public', entry.portrait.path),
    `${actorLabel}: portrait`,
    errors
  );
  if (portraitBuffer) {
    const portrait = decodePng(`${actorLabel}: portrait`, portraitBuffer, integrity.portrait, errors);
    if (portrait) {
      validatePngDimensions(
        `${actorLabel}: portrait`,
        portrait,
        entry.portrait.dimensions.width,
        entry.portrait.dimensions.height,
        errors
      );
      validateOpaque(`${actorLabel}: portrait`, portrait, errors);
      summary.portraits += 1;
      summary.compressedBytes += portraitBuffer.length;
      summary.decodedBytes += portrait.data.length;
    }
  }

  summary.actors += 1;
};

const validateProvenanceFile = async (
  label: string,
  record: ProvenanceFileRecord,
  repositoryRoot: string,
  expectedRelativePath: string,
  errors: string[]
): Promise<Buffer | undefined> => {
  if (!assertExactKeys(label, record, ['path', 'sha256'], errors)) return undefined;
  if (typeof record.path !== 'string' || typeof record.sha256 !== 'string') {
    errors.push(`${label}: path and sha256 must be strings`);
    return undefined;
  }
  if (!validateRuntimePath(`${label}: path`, record.path, errors)) return undefined;
  const absolutePath = path.resolve(repositoryRoot, record.path);
  const expectedPath = path.resolve(repositoryRoot, expectedRelativePath);
  if (!isWithin(repositoryRoot, absolutePath)) {
    errors.push(`${label}: unsafe provenance path ${JSON.stringify(record.path)}`);
    return undefined;
  }
  if (absolutePath !== expectedPath) {
    errors.push(`${label}: expected canonical path ${expectedRelativePath}, got ${record.path}`);
  }
  const buffer = await readBuffer(absolutePath, label, errors);
  if (buffer) {
    const actualHash = sha256Hex(buffer);
    if (actualHash !== record.sha256) {
      errors.push(`${label}: SHA-256 mismatch; expected ${record.sha256}, got ${actualHash}`);
    }
  }
  return buffer;
};

const validateReferenceMetadata = async (
  label: string,
  reference: ReferenceProvenanceRecord,
  expected: (typeof EXPECTED_REFERENCES)[keyof typeof EXPECTED_REFERENCES],
  repositoryRoot: string,
  errors: string[]
): Promise<void> => {
  if (!assertExactKeys(label, reference, ['id', 'path', 'sha256'], errors)) return;
  if (reference.id !== expected.id) errors.push(`${label}: expected reference ID ${expected.id}`);
  const relativePath = path.join(EXPECTED_REFERENCE_DIRECTORY, expected.file);
  const buffer = await validateProvenanceFile(
    label,
    { path: reference.path, sha256: reference.sha256 },
    repositoryRoot,
    relativePath,
    errors
  );
  if (buffer) {
    if (validatePngStructure(label, buffer, errors)) {
      try {
        const image = decodeRgbaPng(buffer);
        validatePngDimensions(label, image, expected.width, expected.height, errors);
      } catch (error) {
        errors.push(`${label}: PNG decode failed (${error instanceof Error ? error.message : String(error)})`);
      }
    }
  }

  const metadataPath = path.join(repositoryRoot, EXPECTED_REFERENCE_DIRECTORY, expected.metadataFile);
  const metadata = await readJson<ReferenceMetadata>(metadataPath, `${label} metadata`, errors);
  if (!metadata) return;
  assertExactKeys(
    `${label} metadata`,
    metadata,
    ['dimensions', 'image', 'inspection', 'layout', 'referenceId', 'schemaVersion', 'sha256', 'status', 'visualContract'],
    errors
  );
  if (metadata.schemaVersion !== 1) errors.push(`${label} metadata: expected schemaVersion 1`);
  if (metadata.referenceId !== expected.id) errors.push(`${label} metadata: referenceId drifted`);
  if (metadata.image !== expected.file) errors.push(`${label} metadata: image must be ${expected.file}`);
  if (metadata.sha256 !== reference.sha256) {
    errors.push(`${label} metadata: SHA-256 does not match central provenance`);
  }
  const expectedActorIds = CHARACTER_SPRITE_MANIFEST.map((entry) => entry.actorId);
  const identityOrder = metadata.layout?.identityOrder;
  if (!Array.isArray(identityOrder) || !sameStrings(identityOrder, expectedActorIds)) {
    errors.push(`${label} metadata: identityOrder must contain the exact 12 actor IDs`);
  } else if (identityOrder.some((actorId, index) => actorId !== expectedActorIds[index])) {
    errors.push(`${label} metadata: identityOrder drifted from the canonical roster order`);
  }
};

const validateRecipeSourceFile = async (
  label: string,
  value: unknown,
  repositoryRoot: string,
  errors: string[]
): Promise<void> => {
  if (!assertExactKeys(label, value, ['path', 'sha256'], errors)) return;
  if (typeof value.path !== 'string' || typeof value.sha256 !== 'string') {
    errors.push(`${label}: path and sha256 must be strings`);
    return;
  }
  if (!validateRuntimePath(`${label}: path`, value.path, errors)) return;
  if (
    !value.path.startsWith('art/actors/get204/source/') &&
    !value.path.startsWith('art/actors/get206/source/')
  ) {
    errors.push(`${label}: source must live under the versioned GET-204/GET-206 actor source roots`);
    return;
  }
  if (path.extname(value.path).toLowerCase() !== '.png') {
    errors.push(`${label}: source must be a PNG`);
    return;
  }
  if (!/^[a-f0-9]{64}$/.test(value.sha256)) {
    errors.push(`${label}: expected a lowercase SHA-256 digest`);
    return;
  }
  const absolutePath = path.resolve(repositoryRoot, value.path);
  if (!isWithin(path.resolve(repositoryRoot, 'art', 'actors'), absolutePath)) {
    errors.push(`${label}: unsafe source path ${JSON.stringify(value.path)}`);
    return;
  }
  const buffer = await readBuffer(absolutePath, label, errors);
  if (!buffer) return;
  const actualSha256 = sha256Hex(buffer);
  if (actualSha256 !== value.sha256) {
    errors.push(`${label}: SHA-256 mismatch; expected ${value.sha256}, got ${actualSha256}`);
  }
  if (!validatePngStructure(label, buffer, errors)) return;
  try {
    decodeRgbaPng(buffer);
  } catch (error) {
    errors.push(`${label}: PNG decode failed (${error instanceof Error ? error.message : String(error)})`);
  }
};

const validateRecipe = async (
  buffer: Buffer,
  provenance: ActorAssetProvenance,
  repositoryRoot: string,
  errors: string[]
): Promise<void> => {
  let recipe: Record<string, unknown>;
  try {
    recipe = JSON.parse(buffer.toString('utf8')) as Record<string, unknown>;
  } catch (error) {
    errors.push(`recipe: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return;
  }
  if (
    !assertExactKeys(
      'recipe',
      recipe,
      [
        'actors',
        'portraitReference',
        'presentations',
        'recipeId',
        'renderContract',
        'schemaVersion',
        'sourceWorkflow',
        'spriteReference',
      ],
      errors
    )
  ) {
    return;
  }
  if (recipe.schemaVersion !== 2) errors.push('recipe: expected schemaVersion 2');
  if (recipe.recipeId !== EXPECTED_RECIPE_ID || recipe.recipeId !== provenance.recipeId) {
    errors.push(`recipe: expected recipeId ${EXPECTED_RECIPE_ID}`);
  }
  const expectedSourceWorkflow = {
    kind: 'ai-assisted-raster-generation',
    tool: 'OpenAI image generation tool (image_gen)',
    generatedOn: '2026-08-07',
    ownership: 'project-generated',
    normalization: 'deterministic-repository-pipeline',
  };
  if (JSON.stringify(recipe.sourceWorkflow) !== JSON.stringify(expectedSourceWorkflow)) {
    errors.push('recipe: sourceWorkflow must record the authored actor-source origin');
  }
  const expectedActorIds = CHARACTER_SPRITE_MANIFEST.map((entry) => entry.actorId);
  if (!isRecord(recipe.actors) || !sameStrings(Object.keys(recipe.actors), expectedActorIds)) {
    errors.push('recipe: actors must contain the exact 12 actor IDs');
  } else if (Object.keys(recipe.actors).some((actorId, index) => actorId !== expectedActorIds[index])) {
    errors.push('recipe: actor order drifted from the canonical roster');
  }
  const expectedRenderContract = {
    supersample: 4,
    frameWidth: 64,
    frameHeight: 96,
    frameCount: 4,
    states: [...CHARACTER_SPRITE_STATES],
    directions: [...CHARACTER_SPRITE_DIRECTIONS],
    origin: { x: 0.5, y: 0.92 },
    alphaHeightPx: { min: 54, max: 64 },
    footRowPx: 88,
    footTolerancePx: 2,
    portraitDimensions: { width: 256, height: 256 },
    portraitSafeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    sourceNormalization: {
      targetAlphaHeightPx: 62,
      maxAlphaWidthPx: 54,
      footRowPx: 88,
      sourceFigureExtraction: {
        authoredColumns: 4,
        authoredRows: 7,
        minimumComponentPixels: 1000,
        maxDetachedComponentPixels: 5,
      },
      chromaKey: { greenDominance: 1.18, minimumGreen: 72, softEdgePx: 1 },
    },
  };
  if (JSON.stringify(recipe.renderContract) !== JSON.stringify(expectedRenderContract)) {
    errors.push('recipe: renderContract drifted from the canonical 12×3×8×4 asset contract');
  }
  for (const key of ['spriteReference', 'portraitReference'] as const) {
    const recipeReference = recipe[key];
    const provenanceReference = provenance[key];
    if (
      !isRecord(recipeReference) ||
      recipeReference.id !== provenanceReference.id ||
      recipeReference.path !== provenanceReference.path ||
      recipeReference.sha256 !== provenanceReference.sha256
    ) {
      errors.push(`recipe: ${key} does not match central provenance`);
    }
  }

  if (isRecord(recipe.actors)) {
    for (const actorId of expectedActorIds) {
      const actor = recipe.actors[actorId];
      if (!isRecord(actor) || !isRecord(actor.spriteSource)) {
        errors.push(`recipe: ${actorId} must define spriteSource provenance`);
        continue;
      }
      const source = actor.spriteSource;
      const expectedKeys = source.layout === 'seven-plus-north-strip'
        ? ['layout', 'northOverride', 'path', 'sha256']
        : ['layout', 'path', 'sha256'];
      if (!assertExactKeys(`recipe: ${actorId}.spriteSource`, source, expectedKeys, errors)) {
        continue;
      }
      if (!['template-eight', 'seven-plus-north-strip'].includes(String(source.layout))) {
        errors.push(`recipe: ${actorId}.spriteSource has an unsupported layout`);
        continue;
      }
      await validateRecipeSourceFile(
        `recipe: ${actorId}.spriteSource`,
        { path: source.path, sha256: source.sha256 },
        repositoryRoot,
        errors
      );
      if (source.layout === 'seven-plus-north-strip') {
        await validateRecipeSourceFile(
          `recipe: ${actorId}.spriteSource.northOverride`,
          source.northOverride,
          repositoryRoot,
          errors
        );
      }
    }
  }

  if (!assertExactKeys('recipe: presentations', recipe.presentations, ['georgeAr', 'takahiroBroadcast'], errors)) {
    return;
  }
  for (const [presentationId, expectedBackground] of [
    ['takahiroBroadcast', 'opaque'],
    ['georgeAr', 'chroma-key-green'],
  ] as const) {
    const presentation = recipe.presentations[presentationId];
    if (!assertExactKeys(
      `recipe: presentations.${presentationId}`,
      presentation,
      ['background', 'path', 'sha256'],
      errors
    )) {
      continue;
    }
    if (presentation.background !== expectedBackground) {
      errors.push(`recipe: presentations.${presentationId} background drifted`);
    }
    await validateRecipeSourceFile(
      `recipe: presentations.${presentationId}`,
      { path: presentation.path, sha256: presentation.sha256 },
      repositoryRoot,
      errors
    );
  }
};

const validateManifestProvenance = (
  label: string,
  manifestProvenance: CharacterSpriteManifestEntry['provenance'],
  central: ActorAssetProvenance,
  errors: string[]
): void => {
  const expected = {
    recipeId: central.recipeId,
    recipeSha256: central.recipe.sha256,
    generatorSha256: central.generator.sha256,
    pngLibrarySha256: central.pngLibrary.sha256,
    spriteReferenceId: central.spriteReference.id,
    spriteReferenceSha256: central.spriteReference.sha256,
    portraitReferenceId: central.portraitReference.id,
    portraitReferenceSha256: central.portraitReference.sha256,
  };
  if (JSON.stringify(manifestProvenance) !== JSON.stringify(expected)) {
    errors.push(`${label}: runtime manifest provenance does not match central integrity provenance`);
  }
};

const validateProvenance = async (
  provenance: ActorAssetProvenance,
  repositoryRoot: string,
  errors: string[]
): Promise<void> => {
  if (
    !assertExactKeys(
      'provenance',
      provenance,
      ['generator', 'pngLibrary', 'portraitReference', 'recipe', 'recipeId', 'spriteReference'],
      errors
    )
  ) {
    return;
  }
  if (provenance.recipeId !== EXPECTED_RECIPE_ID) {
    errors.push(`provenance: expected recipeId ${EXPECTED_RECIPE_ID}`);
  }
  const recipeBuffer = await validateProvenanceFile(
    'recipe',
    provenance.recipe,
    repositoryRoot,
    EXPECTED_RECIPE_PATH,
    errors
  );
  await validateProvenanceFile(
    'generator',
    provenance.generator,
    repositoryRoot,
    EXPECTED_GENERATOR_PATH,
    errors
  );
  await validateProvenanceFile(
    'pngLibrary',
    provenance.pngLibrary,
    repositoryRoot,
    EXPECTED_PNG_LIBRARY_PATH,
    errors
  );
  await validateReferenceMetadata(
    'spriteReference',
    provenance.spriteReference,
    EXPECTED_REFERENCES.spriteReference,
    repositoryRoot,
    errors
  );
  await validateReferenceMetadata(
    'portraitReference',
    provenance.portraitReference,
    EXPECTED_REFERENCES.portraitReference,
    repositoryRoot,
    errors
  );
  if (recipeBuffer) await validateRecipe(recipeBuffer, provenance, repositoryRoot, errors);

  for (const entry of CHARACTER_SPRITE_MANIFEST) {
    validateManifestProvenance(entry.actorId, entry.provenance, provenance, errors);
  }
  for (const [key, presentation] of Object.entries(NON_WORLD_CHARACTER_PRESENTATIONS)) {
    validateManifestProvenance(key, presentation.provenance, provenance, errors);
  }
};

const validateProof = async (
  proof: ProofIntegrityRecord,
  repositoryRoot: string,
  errors: string[]
): Promise<void> => {
  if (!assertExactKeys('proof', proof, ['images', 'manifest'], errors)) return;
  if (!isRecord(proof.images)) {
    errors.push('proof.images: expected an object');
    return;
  }
  const expectedImageKeys = Object.keys(EXPECTED_PROOF_IMAGES);
  if (!sameStrings(Object.keys(proof.images), expectedImageKeys)) {
    errors.push(`proof.images: inventory mismatch (${formatKeyDiff(Object.keys(proof.images), expectedImageKeys)})`);
  }
  if (!assertFileRecord('proof.manifest', proof.manifest, errors)) return;

  const proofDirectory = path.join(repositoryRoot, EXPECTED_PROOF_DIRECTORY);
  await validateExactDirectory(
    proofDirectory,
    'proof directory',
    [...Object.values(EXPECTED_PROOF_IMAGES).map((entry) => entry.file), 'proof-manifest.json'],
    errors
  );
  const manifestPath = path.join(proofDirectory, 'proof-manifest.json');
  const manifestBuffer = await readBuffer(manifestPath, 'proof.manifest', errors);
  if (!manifestBuffer) return;
  validateIntegrityBytes('proof.manifest', manifestBuffer, proof.manifest, errors, manifestBuffer.length);

  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(manifestBuffer.toString('utf8')) as Record<string, unknown>;
  } catch (error) {
    errors.push(`proof.manifest: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return;
  }
  if (
    !assertExactKeys(
      'proof.manifest',
      manifest,
      ['directions', 'identityOrder', 'images', 'inspectionStatus', 'recipeId', 'schemaVersion', 'states'],
      errors
    )
  ) {
    return;
  }
  if (manifest.schemaVersion !== 1) errors.push('proof.manifest: expected schemaVersion 1');
  if (manifest.recipeId !== EXPECTED_RECIPE_ID) {
    errors.push(`proof.manifest: expected recipeId ${EXPECTED_RECIPE_ID}`);
  }
  if (
    manifest.inspectionStatus !== 'pending-human-review' &&
    manifest.inspectionStatus !== 'accepted'
  ) {
    errors.push('proof.manifest: inspectionStatus must be pending-human-review or accepted');
  }
  const expectedActorIds = CHARACTER_SPRITE_MANIFEST.map((entry) => entry.actorId);
  if (JSON.stringify(manifest.identityOrder) !== JSON.stringify(expectedActorIds)) {
    errors.push('proof.manifest: identityOrder drifted from the canonical roster order');
  }
  if (JSON.stringify(manifest.states) !== JSON.stringify(CHARACTER_SPRITE_STATES)) {
    errors.push('proof.manifest: states drifted from the three-state contract');
  }
  if (JSON.stringify(manifest.directions) !== JSON.stringify(CHARACTER_SPRITE_DIRECTIONS)) {
    errors.push('proof.manifest: directions drifted from the eight-direction contract');
  }
  if (!isRecord(manifest.images) || !sameStrings(Object.keys(manifest.images), expectedImageKeys)) {
    errors.push('proof.manifest: images must contain the exact proof image inventory');
    return;
  }

  for (const key of expectedImageKeys) {
    const expected = EXPECTED_PROOF_IMAGES[key as keyof typeof EXPECTED_PROOF_IMAGES];
    const centralRecord = proof.images[key];
    const manifestRecord = manifest.images[key];
    if (!centralRecord || !assertFileRecord(`proof.${key}`, centralRecord, errors)) continue;
    if (
      !assertExactKeys(
        `proof.manifest.images.${key}`,
        manifestRecord,
        ['compressedBytes', 'decodedBytes', 'path', 'sha256'],
        errors
      )
    ) {
      continue;
    }
    if (manifestRecord.path !== expected.file) {
      errors.push(`proof.manifest.images.${key}: expected path ${expected.file}`);
    }
    for (const field of EXPECTED_FILE_RECORD_KEYS) {
      if (manifestRecord[field] !== centralRecord[field as keyof IntegrityFileRecord]) {
        errors.push(`proof.manifest.images.${key}: ${field} does not match central proof integrity`);
      }
    }
    const buffer = await readBuffer(path.join(proofDirectory, expected.file), `proof.${key}`, errors);
    if (!buffer) continue;
    const image = decodePng(`proof.${key}`, buffer, centralRecord, errors);
    if (image) validatePngDimensions(`proof.${key}`, image, expected.width, expected.height, errors);
  }
};

const validateNonWorldPresentations = async (
  integrity: Record<string, IntegrityFileRecord>,
  appRoot: string,
  errors: string[],
  summary: CharacterAssetValidationSummary
): Promise<void> => {
  const expectedKeys = Object.keys(NON_WORLD_CHARACTER_PRESENTATIONS);
  if (!sameStrings(Object.keys(integrity), expectedKeys)) {
    errors.push(
      `non-world integrity inventory mismatch (${formatKeyDiff(Object.keys(integrity), expectedKeys)})`
    );
  }

  for (const key of expectedKeys) {
    const presentation = NON_WORLD_CHARACTER_PRESENTATIONS[key as keyof typeof NON_WORLD_CHARACTER_PRESENTATIONS];
    const record = integrity[key];
    if (!record || !assertFileRecord(`${key}: integrity`, record, errors)) continue;
    validateGeneratedIntegrityRecord(`${key}: presentation`, presentation, record, errors);
    if (!validateRuntimePath(`${key}: path`, presentation.path, errors)) continue;
    validateSafeArea(key, presentation.safeArea, errors);
    if (presentation.provenance.recipeId !== EXPECTED_RECIPE_ID) {
      errors.push(`${key}: recipe provenance drifted from ${EXPECTED_RECIPE_ID}`);
    }
    const buffer = await readBuffer(path.join(appRoot, 'public', presentation.path), key, errors);
    if (!buffer) continue;
    const image = decodePng(key, buffer, record, errors);
    if (!image) continue;
    validatePngDimensions(key, image, presentation.dimensions.width, presentation.dimensions.height, errors);
    if (presentation.background === 'opaque') {
      validateOpaque(key, image, errors);
    } else {
      validateTransparentPresentation(key, image, presentation.safeArea, errors);
    }
    summary.nonWorldPresentations += 1;
    summary.compressedBytes += buffer.length;
    summary.decodedBytes += image.data.length;
  }
};

export const validateCharacterAssets = async (
  options: CharacterAssetValidationOptions = {}
): Promise<CharacterAssetValidationReport> => {
  const appRoot = path.resolve(options.appRoot ?? path.resolve(import.meta.dirname, '../..'));
  const repositoryRoot = path.resolve(options.repositoryRoot ?? path.resolve(appRoot, '..'));
  const errors: string[] = [];
  const summary: CharacterAssetValidationSummary = {
    actors: 0,
    sheets: 0,
    frames: 0,
    portraits: 0,
    nonWorldPresentations: 0,
    compressedBytes: 0,
    decodedBytes: 0,
  };

  if (!isWithin(repositoryRoot, appRoot)) {
    errors.push(`app root ${appRoot} must be inside repository root ${repositoryRoot}`);
    return { errors, summary, appRoot };
  }

  const integrityPath = path.join(appRoot, 'public', 'characters', 'actor-asset-integrity.json');
  const inventory = await readJson<ActorAssetIntegrity>(integrityPath, 'central integrity inventory', errors);
  if (!inventory) return { errors, summary, appRoot };
  if (!assertExactKeys('central integrity inventory', inventory, EXPECTED_INTEGRITY_KEYS, errors)) {
    return { errors, summary, appRoot };
  }
  if (inventory.schemaVersion !== 2) errors.push('central integrity inventory: expected schemaVersion 2');
  if (!isRecord(inventory.actors)) {
    errors.push('central integrity inventory: actors must be an object');
    return { errors, summary, appRoot };
  }
  if (!isRecord(inventory.nonWorldPresentations)) {
    errors.push('central integrity inventory: nonWorldPresentations must be an object');
    return { errors, summary, appRoot };
  }
  if (!isRecord(inventory.provenance)) {
    errors.push('central integrity inventory: provenance must be an object');
    return { errors, summary, appRoot };
  }
  if (!isRecord(inventory.proof)) {
    errors.push('central integrity inventory: proof must be an object');
    return { errors, summary, appRoot };
  }

  if (CHARACTER_SPRITE_MANIFEST.length !== 12) {
    errors.push(`runtime manifest: expected exactly 12 actors, got ${CHARACTER_SPRITE_MANIFEST.length}`);
  }
  if (CHARACTER_SPRITE_STATES.length !== 3) {
    errors.push(`runtime manifest: expected exactly 3 states, got ${CHARACTER_SPRITE_STATES.length}`);
  }
  if (CHARACTER_SPRITE_DIRECTIONS.length !== 8) {
    errors.push(`runtime manifest: expected exactly 8 directions, got ${CHARACTER_SPRITE_DIRECTIONS.length}`);
  }
  for (const entry of CHARACTER_SPRITE_MANIFEST) {
    if (entry.frameCount !== 4) {
      errors.push(`${entry.actorId}: expected exactly 4 frames per sheet`);
    }
  }

  const expectedActorIds = CHARACTER_SPRITE_MANIFEST.map((entry) => entry.actorId);
  if (!sameStrings(Object.keys(inventory.actors), expectedActorIds)) {
    errors.push(
      `central actor inventory mismatch (${formatKeyDiff(Object.keys(inventory.actors), expectedActorIds)})`
    );
  }

  await validateExactDirectory(
    path.join(appRoot, 'public', 'characters'),
    'public/characters',
    [...expectedActorIds, 'actor-asset-integrity.json', 'george'],
    errors
  );
  await validateExactDirectory(
    path.join(appRoot, 'public', 'portraits', 'level0'),
    'public/portraits/level0',
    [
      ...CHARACTER_SPRITE_MANIFEST.map((entry) => path.basename(entry.portrait.path)),
      path.basename(NON_WORLD_CHARACTER_PRESENTATIONS.takahiroBroadcast.path),
    ],
    errors
  );
  await validateExactDirectory(
    path.join(appRoot, 'public', 'characters', 'george'),
    'public/characters/george',
    [path.basename(NON_WORLD_CHARACTER_PRESENTATIONS.georgeAr.path)],
    errors
  );

  await validateProvenance(inventory.provenance, repositoryRoot, errors);
  await validateProof(inventory.proof, repositoryRoot, errors);

  for (const entry of CHARACTER_SPRITE_MANIFEST) {
    const actorIntegrity = inventory.actors[entry.actorId];
    if (!actorIntegrity) {
      errors.push(`${entry.actorId}: missing central integrity record`);
      continue;
    }
    await validateActor(entry, actorIntegrity, appRoot, errors, summary);
  }

  await validateNonWorldPresentations(
    inventory.nonWorldPresentations,
    appRoot,
    errors,
    summary
  );

  return { errors, summary, appRoot };
};
