import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';

import { LEVEL0_BUILDING_ART_BY_ID } from '../src/content/environment/level0BuildingArtManifest';
import { LEVEL0_SURROUND_ART_MANIFEST } from '../src/content/environment/level0SurroundArtManifest';
import { getLevel0Content } from '../src/content/levels/level0';
import {
  createCenteredBuildingFootprint,
  isPointInsideConvexFootprint,
  projectContainedBuildingSourcePoint,
  type ContainedBuildingPoint,
} from '../src/game/visual/world/containedBuildingGeometry';

const APP_ROOT = path.resolve(import.meta.dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');
const SOURCE_DIR = path.join(REPO_ROOT, 'art', 'painterly', 'level0');
const BUILDING_DIR = path.join(APP_ROOT, 'public', 'buildings', 'level0');
const METRICS_PATH = path.join(SOURCE_DIR, 'building-export-metrics.json');
const RUNTIME_METRICS_PATH = path.join(
  APP_ROOT,
  'src',
  'content',
  'environment',
  'level0BuildingArtMetrics.json'
);
const SURROUND_DIR = path.join(BUILDING_DIR, 'surround');
const SURROUND_METRICS_PATH = path.join(SOURCE_DIR, 'surround-export-metrics.json');
const RUNTIME_SURROUND_METRICS_PATH = path.join(
  APP_ROOT,
  'src',
  'content',
  'environment',
  'level0SurroundArtMetrics.json'
);
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const EXPECTED_BUILDING_COUNT = 9;
const EXPECTED_SURROUND_COUNT = 9;

// Registration parameters mirrored from build_runtime_assets.py — the
// validator independently re-measures each runtime PNG and cross-checks the
// generated metrics, so drift between the two implementations fails CI.
const ALPHA_THRESHOLD = 36;
const BASE_PLATE_SCAN_BAND = 0.4;
const REMEASURE_TOLERANCE_PX = 2;
const ORIGIN_TOLERANCE = 0.005;
const MAGENTA_FRINGE_MIN_CHANNEL = 24;
const MAGENTA_FRINGE_MAX_RED_BLUE_IMBALANCE = 0.5;
const MAGENTA_FRINGE_MAX_GREEN_RATIO = 0.35;
const GROUND_CAST_MAX_CHANNEL = 120;
const GROUND_CAST_MIN_CHANNEL = 16;
const GROUND_CAST_MAX_CYAN_PIXELS = 256;
const GROUND_CAST_MAX_PURPLE_PIXELS = 250;
const TECH_CYAN_GROUND_WAIVER = 'block_3_3';

type BasePlateMetric = {
  tipX: number;
  tipY: number;
  cornerY: number;
  leftX: number;
  rightX: number;
  widthPx: number;
  aspect: number;
  containedFootprintFill?: number;
  sourceFootprint?: {
    widthTiles: number;
    depthTiles: number;
  };
};

type BuildingMetric = {
  width: number;
  height: number;
  basePlate?: BasePlateMetric;
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

const assertNoSaturatedMagentaFringe = (image: PngImage, label: string): void => {
  if (image.channels < 4) {
    throw new Error(`${label} must be RGBA for magenta-fringe validation`);
  }

  let fringePixels = 0;
  for (let index = 0; index < image.width * image.height; index += 1) {
    const base = index * image.channels;
    const red = image.pixels[base];
    const green = image.pixels[base + 1];
    const blue = image.pixels[base + 2];
    const alpha = image.pixels[base + image.channels - 1];
    const magentaFloor = Math.min(red, blue);
    const redBluePeak = Math.max(red, blue);
    if (
      alpha > ALPHA_THRESHOLD &&
      magentaFloor > MAGENTA_FRINGE_MIN_CHANNEL &&
      Math.abs(red - blue) / Math.max(1, redBluePeak) < MAGENTA_FRINGE_MAX_RED_BLUE_IMBALANCE &&
      green / magentaFloor < MAGENTA_FRINGE_MAX_GREEN_RATIO
    ) {
      fringePixels += 1;
    }
  }

  if (fringePixels > 0) {
    throw new Error(
      `${label} contains ${fringePixels} visible saturated magenta fringe pixels; rerun chroma_to_alpha.py`
    );
  }
};

const assertNoGroundContactColorCast = (
  image: PngImage,
  id: string,
  cornerY: number
): void => {
  let cyanPixels = 0;
  let purplePixels = 0;
  for (let y = cornerY; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const base = (y * image.width + x) * image.channels;
      const red = image.pixels[base];
      const green = image.pixels[base + 1];
      const blue = image.pixels[base + 2];
      const alpha = image.pixels[base + image.channels - 1];
      if (alpha <= ALPHA_THRESHOLD || Math.max(red, green, blue) >= GROUND_CAST_MAX_CHANNEL) {
        continue;
      }

      if (
        blue > green * 1.25 &&
        red > green * 1.12 &&
        Math.min(red, blue) > GROUND_CAST_MIN_CHANNEL
      ) {
        purplePixels += 1;
      }
      if (
        id !== TECH_CYAN_GROUND_WAIVER &&
        green > red * 1.22 &&
        blue > red * 1.22 &&
        Math.min(green, blue) > GROUND_CAST_MIN_CHANNEL
      ) {
        cyanPixels += 1;
      }
    }
  }

  if (
    cyanPixels > GROUND_CAST_MAX_CYAN_PIXELS ||
    purplePixels > GROUND_CAST_MAX_PURPLE_PIXELS
  ) {
    throw new Error(
      `${id} lower podium contains a colored ground cast (${cyanPixels} cyan, ${purplePixels} purple pixels); rebuild the neutral ground-contact normalization`
    );
  }
};

const parseBasePlate = (id: string, value: unknown): BasePlateMetric => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${id} is missing basePlate registration metrics`);
  }
  const fields = ['tipX', 'tipY', 'cornerY', 'leftX', 'rightX', 'widthPx', 'aspect'] as const;
  const plate = {} as Record<(typeof fields)[number], number>;
  for (const field of fields) {
    const fieldValue = Reflect.get(value, field);
    if (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue)) {
      throw new Error(`${id} basePlate.${field} is missing or not a number`);
    }
    plate[field] = fieldValue;
  }
  const sourceFootprintValue = Reflect.get(value, 'sourceFootprint');
  const containedFootprintFill = Reflect.get(value, 'containedFootprintFill');
  const containedFill =
    typeof containedFootprintFill === 'number' && Number.isFinite(containedFootprintFill)
      ? containedFootprintFill
      : undefined;
  if (sourceFootprintValue !== undefined) {
    if (
      typeof sourceFootprintValue !== 'object' ||
      sourceFootprintValue === null ||
      Array.isArray(sourceFootprintValue)
    ) {
      throw new Error(`${id} basePlate.sourceFootprint is invalid`);
    }
    const widthTiles = Reflect.get(sourceFootprintValue, 'widthTiles');
    const depthTiles = Reflect.get(sourceFootprintValue, 'depthTiles');
    if (
      !Number.isInteger(widthTiles) ||
      (widthTiles as number) <= 0 ||
      !Number.isInteger(depthTiles) ||
      (depthTiles as number) <= 0
    ) {
      throw new Error(`${id} basePlate.sourceFootprint must contain positive tile dimensions`);
    }
    return {
      ...plate,
      containedFootprintFill: containedFill,
      sourceFootprint: {
        widthTiles: widthTiles as number,
        depthTiles: depthTiles as number,
      },
    };
  }
  return plate;
};

const readMetrics = async (
  metricsPath = METRICS_PATH,
  label = 'building-export-metrics.json'
): Promise<Record<string, BuildingMetric>> => {
  const parsed = JSON.parse(await fs.readFile(metricsPath, 'utf8')) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} must contain an object`);
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
    metrics[id] = {
      width: width as number,
      height: height as number,
      basePlate: parseBasePlate(id, Reflect.get(value, 'basePlate')),
    };
  }
  return metrics;
};

const validateRuntimeMetricsCopy = async (errors: string[]): Promise<void> => {
  try {
    const artSide = await fs.readFile(METRICS_PATH, 'utf8');
    const runtimeSide = await fs.readFile(RUNTIME_METRICS_PATH, 'utf8');
    if (artSide !== runtimeSide) {
      errors.push(
        'src/content/environment/level0BuildingArtMetrics.json differs from art/painterly/level0/building-export-metrics.json — rerun build_runtime_assets.py'
      );
    }
  } catch (error) {
    errors.push(`cannot compare runtime metrics copy: ${describeError(error)}`);
  }
};

const validateSurroundAssets = async (errors: string[]): Promise<void> => {
  let metrics: Record<string, BuildingMetric> = {};
  try {
    metrics = await readMetrics(SURROUND_METRICS_PATH, 'surround-export-metrics.json');
  } catch (error) {
    errors.push(`cannot read surround metrics: ${describeError(error)}`);
    return;
  }

  const ids = Object.keys(metrics).sort();
  if (ids.length !== EXPECTED_SURROUND_COUNT) {
    errors.push(`expected ${EXPECTED_SURROUND_COUNT} surround metrics, found ${ids.length}`);
  }
  if (LEVEL0_SURROUND_ART_MANIFEST.length !== EXPECTED_SURROUND_COUNT) {
    errors.push(
      `expected ${EXPECTED_SURROUND_COUNT} surround manifest entries, found ${LEVEL0_SURROUND_ART_MANIFEST.length}`
    );
  }

  try {
    const artSide = await fs.readFile(SURROUND_METRICS_PATH, 'utf8');
    const runtimeSide = await fs.readFile(RUNTIME_SURROUND_METRICS_PATH, 'utf8');
    if (artSide !== runtimeSide) {
      errors.push('runtime surround metrics differ from art-side metrics — rerun --surround-only');
    }
  } catch (error) {
    errors.push(`cannot compare surround metrics copy: ${describeError(error)}`);
  }

  for (let index = 0; index < EXPECTED_SURROUND_COUNT; index += 1) {
    const id = `surround_${index}`;
    const metric = metrics[id];
    const entry = LEVEL0_SURROUND_ART_MANIFEST[index];
    if (!metric || !entry) {
      errors.push(`${id} is missing runtime metrics or manifest metadata`);
      continue;
    }

    try {
      const filename = `${index}.png`;
      const image = decodePng(await fs.readFile(path.join(SURROUND_DIR, filename)), filename);
      assertVisibleAlphaContent(image, filename);
      if (image.width !== metric.width || image.height !== metric.height) {
        errors.push(`${filename} dimensions differ from surround metrics`);
      }
      const measured = measureBasePlate(image);
      const recorded = metric.basePlate;
      if (!recorded) {
        errors.push(`${id} is missing base registration`);
        continue;
      }
      if (
        Math.abs(recorded.tipX - measured.tipX) > REMEASURE_TOLERANCE_PX ||
        Math.abs(recorded.tipY - measured.tipY) > REMEASURE_TOLERANCE_PX ||
        Math.abs(recorded.widthPx - measured.widthPx) > REMEASURE_TOLERANCE_PX
      ) {
        errors.push(`${id} registration drifted — rerun --surround-only`);
      }
      if (
        Math.abs(entry.origin.x - recorded.tipX / metric.width) > ORIGIN_TOLERANCE ||
        Math.abs(entry.origin.y - recorded.tipY / metric.height) > ORIGIN_TOLERANCE
      ) {
        errors.push(`${id} manifest origin does not match its measured south tip`);
      }
    } catch (error) {
      errors.push(describeError(error));
    }
  }

  for (const sourceName of [
    'building-surround-composites-alpha.png',
    'building-surround-composites-chroma.png',
  ]) {
    try {
      const image = decodePng(await fs.readFile(path.join(SOURCE_DIR, sourceName)), sourceName);
      if (sourceName.endsWith('-alpha.png')) {
        assertVisibleAlphaContent(image, sourceName);
      }
    } catch (error) {
      errors.push(describeError(error));
    }
  }
};

const measureBasePlate = (image: PngImage): BasePlateMetric => {
  const alphaOffset = image.channels - 1;
  const rowExtents: Array<{ left: number; right: number } | null> = [];

  for (let y = 0; y < image.height; y += 1) {
    let left = -1;
    let right = -1;
    const rowStart = y * image.width * image.channels;
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.pixels[rowStart + x * image.channels + alphaOffset];
      if (alpha > ALPHA_THRESHOLD) {
        if (left === -1) left = x;
        right = x;
      }
    }
    rowExtents.push(left === -1 ? null : { left, right });
  }

  const opaqueRows: number[] = [];
  rowExtents.forEach((extent, y) => {
    if (extent) opaqueRows.push(y);
  });
  if (opaqueRows.length === 0) {
    throw new Error('image is fully transparent');
  }

  const topY = opaqueRows[0];
  const tipY = opaqueRows[opaqueRows.length - 1];
  const tipExtent = rowExtents[tipY]!;
  const tipX = (tipExtent.left + tipExtent.right) / 2;

  const contentHeight = tipY - topY + 1;
  const bandStart = Math.max(topY, tipY - Math.floor(contentHeight * BASE_PLATE_SCAN_BAND));
  let maxSpan = -1;
  for (let y = bandStart; y <= tipY; y += 1) {
    const extent = rowExtents[y];
    if (extent) {
      maxSpan = Math.max(maxSpan, extent.right - extent.left);
    }
  }
  let cornerY = tipY;
  for (let y = bandStart; y <= tipY; y += 1) {
    const extent = rowExtents[y];
    if (extent && extent.right - extent.left >= maxSpan * 0.98) {
      cornerY = y;
      break;
    }
  }

  const cornerExtent = rowExtents[cornerY]!;
  const widthPx = cornerExtent.right - cornerExtent.left;
  return {
    tipX,
    tipY,
    cornerY,
    leftX: cornerExtent.left,
    rightX: cornerExtent.right,
    widthPx,
    aspect: widthPx / Math.max(1, tipY - cornerY),
  };
};

const validateRegistration = (
  id: string,
  metric: BuildingMetric,
  image: PngImage,
  errors: string[]
): void => {
  const recorded = metric.basePlate;
  if (!recorded) {
    return;
  }

  assertNoGroundContactColorCast(image, id, recorded.cornerY);

  const measured = measureBasePlate(image);
  const deltas: Array<[string, number, number]> = [
    ['tipX', recorded.tipX, measured.tipX],
    ['tipY', recorded.tipY, measured.tipY],
    ['cornerY', recorded.cornerY, measured.cornerY],
    ['widthPx', recorded.widthPx, measured.widthPx],
  ];
  for (const [field, expected, actual] of deltas) {
    if (Math.abs(expected - actual) > REMEASURE_TOLERANCE_PX) {
      errors.push(
        `${id} basePlate.${field} drifted: metrics say ${expected}, re-measure says ${actual} — rerun build_runtime_assets.py`
      );
    }
  }

  const manifestEntry = LEVEL0_BUILDING_ART_BY_ID[id as keyof typeof LEVEL0_BUILDING_ART_BY_ID];
  if (!manifestEntry) {
    errors.push(`${id} has metrics but no manifest entry`);
    return;
  }

  // The generated landmark is a contained superstructure on top of an exact
  // runtime-drawn footprint plate. Register its measured base center to the
  // parcel centroid, then validate ground-contact alpha against the actual
  // polygon; never distort near-square source architecture into a non-square
  // parcel.
  const expectedOriginX = ((recorded.leftX + recorded.rightX) / 2) / metric.width;
  const expectedOriginY = recorded.cornerY / metric.height;
  if (Math.abs(manifestEntry.origin.x - expectedOriginX) > ORIGIN_TOLERANCE) {
    errors.push(
      `${id} manifest origin.x ${manifestEntry.origin.x.toFixed(4)} does not match measured base center ${expectedOriginX.toFixed(4)}`
    );
  }
  if (Math.abs(manifestEntry.origin.y - expectedOriginY) > ORIGIN_TOLERANCE) {
    errors.push(
      `${id} manifest origin.y ${manifestEntry.origin.y.toFixed(4)} does not match measured base center ${expectedOriginY.toFixed(4)}`
    );
  }

  const building = getLevel0Content('en').buildingDefinitions.find((candidate) => candidate.id === id);
  if (!building) {
    errors.push(`${id} has art metrics but no runtime building definition`);
    return;
  }
  const widthTiles = building.footprint.to.x - building.footprint.from.x + 1;
  const depthTiles = building.footprint.to.y - building.footprint.from.y + 1;
  if (
    recorded.sourceFootprint?.widthTiles !== widthTiles ||
    recorded.sourceFootprint?.depthTiles !== depthTiles
  ) {
    errors.push(
      `${id} footprint contract drifted: metrics say ${recorded.sourceFootprint?.widthTiles ?? '?'}x${recorded.sourceFootprint?.depthTiles ?? '?'}, runtime is ${widthTiles}x${depthTiles} — rerun yarn art:level0:build`
    );
  }
  if (manifestEntry.footprintFit.anchor !== 'contained-superstructure') {
    errors.push(`${id} must use contained-superstructure placement`);
  }
  if (manifestEntry.footprintFit.sourceContainmentWidthPx !== metric.width) {
    errors.push(`${id} containment width must equal the full alpha-cropped image width`);
  }
  const footprintFill = manifestEntry.footprintFit.footprintFill;
  if (!(footprintFill >= 0.75 && footprintFill <= 1)) {
    errors.push(`${id} footprint fill ${footprintFill} must remain within [0.75, 1]`);
  }
  if (recorded.containedFootprintFill === undefined) {
    errors.push(`${id} metrics are missing containedFootprintFill — rerun yarn art:level0:build`);
  } else if (Math.abs(footprintFill - recorded.containedFootprintFill) > 1e-6) {
    errors.push(
      `${id} manifest fill ${footprintFill} does not match generated fill ${recorded.containedFootprintFill}`
    );
  }

  const footprint = createCenteredBuildingFootprint({
    widthTiles,
    depthTiles,
    tileWidth: 64,
  });
  const alphaOffset = image.channels - 1;
  const sourceBaseCenterX = (recorded.leftX + recorded.rightX) / 2;
  const sourcePoints: ContainedBuildingPoint[] = [];
  for (let y = recorded.cornerY; y < image.height; y += 1) {
    const rowStart = y * image.width * image.channels;
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.pixels[rowStart + x * image.channels + alphaOffset];
      if (alpha > ALPHA_THRESHOLD) {
        sourcePoints.push({
          x: x + 0.5 - sourceBaseCenterX,
          y: y + 0.5 - recorded.cornerY,
        });
      }
    }
  }

  const countOutsideAtFill = (fill: number): number =>
    sourcePoints.reduce((count, sourcePoint) => {
      const projected = projectContainedBuildingSourcePoint({
        sourcePoint,
        sourceContainmentWidthPx: metric.width,
        footprintFill: fill,
        footprint,
      });
      return count + (isPointInsideConvexFootprint(projected, footprint) ? 0 : 1);
    }, 0);

  const outsideCount = countOutsideAtFill(footprintFill);
  if (outsideCount > 0) {
    errors.push(`${id} lower alpha base spills ${outsideCount} pixels outside its runtime footprint`);
  }

  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const middle = (low + high) / 2;
    if (countOutsideAtFill(middle) === 0) {
      low = middle;
    } else {
      high = middle;
    }
  }
  const expectedFill = Math.floor((low + 1e-9) * 100) / 100;
  if (
    recorded.containedFootprintFill !== undefined &&
    Math.abs(recorded.containedFootprintFill - expectedFill) > 1e-6
  ) {
    errors.push(
      `${id} generated fill ${recorded.containedFootprintFill} is stale; alpha geometry requires ${expectedFill}`
    );
  }
};

const validateManifestCoverage = (
  metrics: Record<string, BuildingMetric>,
  errors: string[]
): void => {
  try {
    const buildings = getLevel0Content('en').buildingDefinitions;
    for (const building of buildings) {
      if (!metrics[building.id]) {
        errors.push(`${building.id} is defined in level0 content but has no art metrics`);
      }
      if (!LEVEL0_BUILDING_ART_BY_ID[building.id as keyof typeof LEVEL0_BUILDING_ART_BY_ID]) {
        errors.push(`${building.id} is defined in level0 content but has no manifest entry`);
      }
    }
  } catch (error) {
    errors.push(`cannot load level0 building definitions: ${describeError(error)}`);
  }
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
        assertNoSaturatedMagentaFringe(image, sourceName);
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
      assertNoSaturatedMagentaFringe(image, filename);
      const metric = metrics[id];
      if (image.width !== metric.width || image.height !== metric.height) {
        errors.push(
          `${filename} is ${image.width}x${image.height}; metrics require ${metric.width}x${metric.height}`
        );
      }
      validateRegistration(id, metric, image, errors);
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
  await validateRuntimeMetricsCopy(errors);
  await validateSurroundAssets(errors);
  validateManifestCoverage(metrics, errors);

  if (errors.length > 0) {
    console.error('[level0-art] Validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(
    `[level0-art] Validated ${Object.keys(metrics).length} painterly landmarks, ${EXPECTED_SURROUND_COUNT} surround buildings, and 4 source composites`
  );
};

void main();
