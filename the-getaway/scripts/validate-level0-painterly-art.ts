import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';

const APP_ROOT = path.resolve(import.meta.dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');
const SOURCE_DIR = path.join(REPO_ROOT, 'art', 'painterly', 'level0');
const BUILDING_DIR = path.join(APP_ROOT, 'public', 'buildings', 'level0');
const METRICS_PATH = path.join(SOURCE_DIR, 'building-export-metrics.json');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const EXPECTED_BUILDING_COUNT = 9;

type BuildingMetric = {
  width: number;
  height: number;
};

type PngImage = {
  width: number;
  height: number;
  colorType: number;
  pixels: Buffer;
  channels: number;
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const paethPredictor = (left: number, above: number, upperLeft: number): number => {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  if (aboveDistance <= upperLeftDistance) {
    return above;
  }
  return upperLeft;
};

const decodePng = (file: Buffer, label: string): PngImage => {
  if (!file.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error(`${label} has an invalid PNG signature`);
  }

  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let compressionMethod = -1;
  let filterMethod = -1;
  let interlaceMethod = -1;
  let sawHeader = false;
  let sawEnd = false;
  const imageDataChunks: Buffer[] = [];

  while (offset + 12 <= file.length) {
    const chunkLength = file.readUInt32BE(offset);
    const chunkType = file.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + chunkLength;
    const chunkEnd = dataEnd + 4;

    if (chunkEnd > file.length) {
      throw new Error(`${label} contains a truncated ${chunkType || 'unknown'} chunk`);
    }

    if (chunkType === 'IHDR') {
      if (sawHeader || chunkLength !== 13 || offset !== PNG_SIGNATURE.length) {
        throw new Error(`${label} has an invalid IHDR chunk`);
      }
      width = file.readUInt32BE(dataStart);
      height = file.readUInt32BE(dataStart + 4);
      bitDepth = file[dataStart + 8];
      colorType = file[dataStart + 9];
      compressionMethod = file[dataStart + 10];
      filterMethod = file[dataStart + 11];
      interlaceMethod = file[dataStart + 12];
      sawHeader = true;
    } else if (chunkType === 'IDAT') {
      imageDataChunks.push(file.subarray(dataStart, dataEnd));
    } else if (chunkType === 'IEND') {
      sawEnd = true;
      break;
    }

    offset = chunkEnd;
  }

  if (!sawHeader || !sawEnd || imageDataChunks.length === 0 || width === 0 || height === 0) {
    throw new Error(`${label} is missing required PNG image chunks`);
  }
  if (bitDepth !== 8 || ![2, 4, 6].includes(colorType)) {
    throw new Error(`${label} uses unsupported PNG bit depth/color type ${bitDepth}/${colorType}`);
  }
  if (compressionMethod !== 0 || filterMethod !== 0 || interlaceMethod !== 0) {
    throw new Error(`${label} uses unsupported PNG compression, filter, or interlace settings`);
  }

  const channels = colorType === 6 ? 4 : colorType === 4 ? 2 : 3;
  const rowLength = width * channels;
  const inflated = inflateSync(Buffer.concat(imageDataChunks));
  const expectedLength = height * (rowLength + 1);
  if (inflated.length !== expectedLength) {
    throw new Error(
      `${label} decoded to ${inflated.length} bytes; expected ${expectedLength}`
    );
  }

  const pixels = Buffer.alloc(width * height * channels);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;
    if (filterType > 4) {
      throw new Error(`${label} uses unsupported PNG row filter ${filterType}`);
    }

    const rowOffset = y * rowLength;
    const previousRowOffset = rowOffset - rowLength;
    for (let x = 0; x < rowLength; x += 1) {
      const encoded = inflated[sourceOffset];
      sourceOffset += 1;
      const left = x >= channels ? pixels[rowOffset + x - channels] : 0;
      const above = y > 0 ? pixels[previousRowOffset + x] : 0;
      const upperLeft = y > 0 && x >= channels
        ? pixels[previousRowOffset + x - channels]
        : 0;

      let predictor = 0;
      if (filterType === 1) predictor = left;
      if (filterType === 2) predictor = above;
      if (filterType === 3) predictor = Math.floor((left + above) / 2);
      if (filterType === 4) predictor = paethPredictor(left, above, upperLeft);
      pixels[rowOffset + x] = (encoded + predictor) & 0xff;
    }
  }

  return { width, height, colorType, pixels, channels };
};

const assertVisibleAlphaContent = (image: PngImage, label: string): void => {
  if (![4, 6].includes(image.colorType)) {
    throw new Error(`${label} does not contain an alpha channel`);
  }

  const alphaOffset = image.channels - 1;
  let hasVisiblePixel = false;
  let hasTransparentPixel = false;
  for (let offset = alphaOffset; offset < image.pixels.length; offset += image.channels) {
    const alpha = image.pixels[offset];
    hasVisiblePixel ||= alpha > 0;
    hasTransparentPixel ||= alpha < 255;
    if (hasVisiblePixel && hasTransparentPixel) break;
  }

  if (!hasVisiblePixel) {
    throw new Error(`${label} has no visible pixel content`);
  }
  if (!hasTransparentPixel) {
    throw new Error(`${label} has no transparent pixels`);
  }
};

const readMetrics = async (): Promise<Record<string, BuildingMetric>> => {
  const parsed = JSON.parse(await fs.readFile(METRICS_PATH, 'utf8')) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('building-export-metrics.json must contain an object');
  }

  const metrics: Record<string, BuildingMetric> = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`${id} has invalid metrics`);
    }
    const width = Reflect.get(value, 'width');
    const height = Reflect.get(value, 'height');
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
      throw new Error(`${id} has invalid width/height metrics`);
    }
    metrics[id] = { width: width as number, height: height as number };
  }
  return metrics;
};

const validateSourceComposites = async (errors: string[]): Promise<void> => {
  const sourceNames = [
    'building-block-composites-alpha.png',
    'building-block-composites-chroma.png',
  ];
  const images: PngImage[] = [];

  for (const sourceName of sourceNames) {
    try {
      const sourcePath = path.join(SOURCE_DIR, sourceName);
      const image = decodePng(await fs.readFile(sourcePath), sourceName);
      images.push(image);
      if (sourceName.endsWith('-alpha.png')) {
        assertVisibleAlphaContent(image, sourceName);
      }
    } catch (error) {
      errors.push(describeError(error));
    }
  }

  if (
    images.length === sourceNames.length &&
    (images[0].width !== images[1].width || images[0].height !== images[1].height)
  ) {
    errors.push('source composite dimensions do not match');
  }
};

const validateBuildings = async (
  metrics: Record<string, BuildingMetric>,
  errors: string[]
): Promise<void> => {
  const ids = Object.keys(metrics).sort();
  if (ids.length !== EXPECTED_BUILDING_COUNT) {
    errors.push(`expected ${EXPECTED_BUILDING_COUNT} building metrics, found ${ids.length}`);
  }

  try {
    const actualNames = (await fs.readdir(BUILDING_DIR))
      .filter((name) => name.endsWith('.png'))
      .sort();
    const expectedNames = ids.map((id) => `${id}.png`);
    if (actualNames.join('\n') !== expectedNames.join('\n')) {
      errors.push(
        `building filenames do not match metrics (expected: ${expectedNames.join(', ')}; actual: ${actualNames.join(', ')})`
      );
    }
  } catch (error) {
    errors.push(`cannot read building output directory: ${describeError(error)}`);
  }

  for (const id of ids) {
    try {
      const filename = `${id}.png`;
      const image = decodePng(await fs.readFile(path.join(BUILDING_DIR, filename)), filename);
      assertVisibleAlphaContent(image, filename);
      const metric = metrics[id];
      if (image.width !== metric.width || image.height !== metric.height) {
        errors.push(
          `${filename} is ${image.width}x${image.height}; metrics require ${metric.width}x${metric.height}`
        );
      }
    } catch (error) {
      errors.push(describeError(error));
    }
  }
};

const main = async (): Promise<void> => {
  const errors: string[] = [];
  let metrics: Record<string, BuildingMetric> = {};

  try {
    metrics = await readMetrics();
  } catch (error) {
    errors.push(`cannot read building metrics: ${describeError(error)}`);
  }

  await validateSourceComposites(errors);
  await validateBuildings(metrics, errors);

  if (errors.length > 0) {
    console.error('[level0-art] Validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(
    `[level0-art] Validated ${Object.keys(metrics).length} painterly buildings and 2 source composites`
  );
};

void main();
