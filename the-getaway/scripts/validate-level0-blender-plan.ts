import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVEL0_LAYOUT_CONTRACT } from '../src/content/levels/level0/layoutContract';
import { GET204_CITY_RUNTIME } from '../src/game/level0/art/get204City';
import type {
  Get204FullDistrictRecipe,
} from '../src/game/level0/art/types';
import { validateGet204MissionDistrictRecipe } from '../src/game/level0/art/validator';
import type { WorldPolygon } from '../src/game/level0/layout/types';
import { validateLevel0LayoutContract } from '../src/game/level0/layout/validator';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..', '..');
const appPublicRoot = resolve(repositoryRoot, 'the-getaway/public');
const missionDistrictRecipePath = resolve(
  repositoryRoot,
  'art/blender/get204/manifests/mission-district-rebuild.json'
);
const layoutExportPath = resolve(
  repositoryRoot,
  'art/iso-assets/contracts/level0-layout-contract.json'
);
const generatedMissionRoot = resolve(
  repositoryRoot,
  'art/blender/get204/.generated/mission-district'
);
const missionDistrictMetadataPath = resolve(generatedMissionRoot, 'metadata.json');

interface MissionDistrictMetadata {
  schemaVersion: number;
  id: string;
  ticket: string;
  acceptanceState: string;
  recipe: { path: string; sha256: string };
  references: Get204FullDistrictRecipe['references'];
  architecturalClusters: Array<{
    id: string;
    sourcePrefix: string;
    artSource: string;
    sourceObjectCount: number;
    resolvedScale: number;
    instanceCount: number;
    placementAnchor: string;
    streetWallInsetMeters: number;
    collisionFootprint: WorldPolygon;
    placedDimensionsMeters: [number, number, number];
  }>;
  sourcePropPlacements: Array<{
    id: string;
    sourcePrefix: string;
    objectCount: number;
  }>;
  outputs: Array<{ path: string; sha256: string; bytes: number }>;
  scene: string;
  commitBoundary: Get204FullDistrictRecipe['commitBoundary'];
}

const readJson = <T,>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

const sha256File = (path: string): string => {
  const digest = createHash('sha256');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  const descriptor = openSync(path, 'r');
  try {
    let bytesRead = 0;
    do {
      bytesRead = readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead > 0) digest.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    closeSync(descriptor);
  }
  return digest.digest('hex');
};

const requireFile = (path: string, label: string): void => {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Missing ${label}: ${path}`);
  }
};

const isStrictlyInside = (parent: string, candidate: string): boolean => {
  const fromParent = relative(resolve(parent), resolve(candidate));
  return Boolean(fromParent) &&
    fromParent !== '..' &&
    !fromParent.startsWith(`..${sep}`) &&
    !isAbsolute(fromParent);
};

const resolveWithin = (parent: string, path: string, label: string): string => {
  const resolved = resolve(parent, path);
  if (!isStrictlyInside(parent, resolved)) {
    throw new Error(`${label} escapes its owned root: ${path}`);
  }
  return resolved;
};

const resolveRepositoryPath = (path: string, label: string): string => {
  if (isAbsolute(path)) {
    throw new Error(`${label} must remain repository-relative: ${path}`);
  }
  const resolved = resolve(repositoryRoot, path);
  if (!isStrictlyInside(repositoryRoot, resolved)) {
    throw new Error(`${label} escapes the repository: ${path}`);
  }
  return resolved;
};

const approximatelyEqual = (left: number, right: number, tolerance = 0.000_01): boolean =>
  Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= tolerance;

const exactSet = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length &&
  new Set(actual).size === actual.length &&
  actual.every((entry) => expected.includes(entry));

const polygonsApproximatelyEqual = (
  actual: WorldPolygon,
  expected: WorldPolygon
): boolean => actual.length === expected.length && actual.every((point, index) => {
  const expectedPoint = expected[index];
  return expectedPoint !== undefined &&
    approximatelyEqual(point.x, expectedPoint.x) &&
    approximatelyEqual(point.y, expectedPoint.y);
});

const readPngSize = (path: string): { width: number; height: number } => {
  const header = readFileSync(path).subarray(0, 24);
  if (
    header.length < 24 ||
    header.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
  ) {
    throw new Error(`GET-204 runtime export is not a PNG: ${path}`);
  }
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
};

const verifyExternalSource = (
  recipe: Get204FullDistrictRecipe
): void => {
  const sourceRoot = process.env[recipe.source.sourceRootVariable];
  if (!sourceRoot) {
    throw new Error(
      `--verify-source requires ${recipe.source.sourceRootVariable} to point to the owned Neo Tokyo 2 pack`
    );
  }

  const resolvedSourceRoot = resolve(sourceRoot);
  Object.entries(recipe.source.archives).forEach(([kind, archive]) => {
    const archivePath = resolveWithin(
      resolvedSourceRoot,
      archive.relativePath,
      `GET-204 ${kind} source archive`
    );
    requireFile(archivePath, `recorded Neo Tokyo ${kind} source archive`);
    if (statSync(archivePath).size !== archive.byteSize) {
      throw new Error(`Neo Tokyo ${kind} archive byte size drifted: ${archivePath}`);
    }
    if (sha256File(archivePath) !== archive.sha256) {
      throw new Error(`Neo Tokyo ${kind} archive content hash drifted: ${archivePath}`);
    }
  });

  const textureInventory = recipe.source.archives.textures;
  const textureRoot = resolveWithin(
    resolvedSourceRoot,
    textureInventory.extractedRoot,
    'GET-204 source textures'
  );
  if (!existsSync(textureRoot) || !statSync(textureRoot).isDirectory()) {
    throw new Error(`Missing recorded Neo Tokyo texture directory: ${textureRoot}`);
  }
  const textureFiles = readdirSync(textureRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  if (textureFiles.length !== textureInventory.fileCount) {
    throw new Error(
      `Neo Tokyo texture count drifted: expected ${textureInventory.fileCount}, found ${textureFiles.length}`
    );
  }
  const unreadableTexture = textureFiles.find((relativePath) => {
    const path = resolve(textureRoot, relativePath);
    let descriptor: number | undefined;
    try {
      if (statSync(path).size <= 0) return true;
      descriptor = openSync(path, 'r');
      return readSync(descriptor, Buffer.alloc(1), 0, 1, 0) !== 1;
    } catch {
      return true;
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
    }
  });
  if (unreadableTexture) {
    throw new Error(`Neo Tokyo texture is unreadable: ${resolve(textureRoot, unreadableTexture)}`);
  }
};

const verifyMissionDistrictExport = (recipe: Get204FullDistrictRecipe): void => {
  requireFile(missionDistrictMetadataPath, 'ignored GET-204 mission-district metadata');
  const metadata = readJson<MissionDistrictMetadata>(missionDistrictMetadataPath);
  const recipeRelativePath = relative(repositoryRoot, missionDistrictRecipePath).split(sep).join('/');
  if (
    metadata.schemaVersion !== 2 ||
    metadata.ticket !== 'GET-204' ||
    metadata.id !== recipe.id ||
    metadata.acceptanceState !== recipe.acceptanceState ||
    metadata.recipe.path !== recipeRelativePath ||
    metadata.recipe.sha256 !== sha256File(missionDistrictRecipePath) ||
    JSON.stringify(metadata.references) !== JSON.stringify(recipe.references) ||
    JSON.stringify(metadata.commitBoundary) !== JSON.stringify(recipe.commitBoundary)
  ) {
    throw new Error('GET-204 mission-district metadata drifts from the current recipe.');
  }

  const expectedClusterIds = recipe.architecturalClusters.map(({ id }) => id);
  const measuredClusterIds = metadata.architecturalClusters.map(({ id }) => id);
  if (!exactSet(measuredClusterIds, expectedClusterIds)) {
    throw new Error('GET-204 Blender metadata does not cover every registered city cluster.');
  }
  const runtimeFootprints = new Map(
    LEVEL0_LAYOUT_CONTRACT.buildingFootprints.map((entry) => [entry.id, entry.polygon])
  );
  const measuredClusters = new Map(
    metadata.architecturalClusters.map((entry) => [entry.id, entry])
  );
  recipe.architecturalClusters.forEach((cluster) => {
    const measured = measuredClusters.get(cluster.id);
    const runtimeFootprint = runtimeFootprints.get(cluster.id);
    const sourceBounds = recipe.source.structuralPlanBoundsMeters[cluster.sourcePrefix];
    const rotation = ((cluster.rotationDegrees % 360) + 360) % 360;
    const swapPlanAxes = rotation === 90 || rotation === 270;
    const expectedWidth = sourceBounds
      ? (swapPlanAxes ? sourceBounds.depth : sourceBounds.width) * cluster.uniformScale
      : Number.NaN;
    const expectedDepth = sourceBounds
      ? (swapPlanAxes ? sourceBounds.width : sourceBounds.depth) * cluster.uniformScale
      : Number.NaN;
    if (
      !measured ||
      !runtimeFootprint ||
      !sourceBounds ||
      measured.sourcePrefix !== cluster.sourcePrefix ||
      measured.artSource !== cluster.artSource ||
      measured.sourceObjectCount < 1 ||
      measured.instanceCount !== 1 ||
      measured.placementAnchor !== cluster.placementAnchor ||
      !approximatelyEqual(measured.resolvedScale, cluster.uniformScale) ||
      !approximatelyEqual(
        measured.streetWallInsetMeters,
        cluster.streetWallInsetMeters
      ) ||
      !approximatelyEqual(measured.placedDimensionsMeters[0], expectedWidth, 0.025) ||
      !approximatelyEqual(measured.placedDimensionsMeters[1], expectedDepth, 0.025) ||
      !polygonsApproximatelyEqual(measured.collisionFootprint, runtimeFootprint)
    ) {
      throw new Error(`GET-204 Blender/runtime cluster evidence drifted: ${cluster.id}`);
    }
  });

  const expectedPropIds = recipe.sourcePropPlacements.map(({ id }) => id);
  const measuredPropIds = metadata.sourcePropPlacements.map(({ id }) => id);
  if (!exactSet(measuredPropIds, expectedPropIds)) {
    throw new Error('GET-204 Blender metadata does not cover every registered source prop.');
  }
  const measuredProps = new Map(
    metadata.sourcePropPlacements.map((entry) => [entry.id, entry])
  );
  recipe.sourcePropPlacements.forEach((prop) => {
    const measured = measuredProps.get(prop.id);
    if (
      !measured ||
      measured.sourcePrefix !== prop.sourcePrefix ||
      measured.objectCount < 1
    ) {
      throw new Error(`GET-204 Blender source-prop evidence drifted: ${prop.id}`);
    }
  });

  const scenePath = resolveRepositoryPath(metadata.scene, 'GET-204 Blender scene');
  if (!isStrictlyInside(generatedMissionRoot, scenePath)) {
    throw new Error('GET-204 Blender scene escapes the ignored mission-district root.');
  }
  requireFile(scenePath, 'ignored GET-204 Blender scene');

  if (metadata.outputs.length === 0) {
    throw new Error('GET-204 Blender metadata records no authoring output.');
  }
  metadata.outputs.forEach((output) => {
    const path = resolveRepositoryPath(output.path, 'GET-204 Blender output');
    if (!isStrictlyInside(generatedMissionRoot, path)) {
      throw new Error(`GET-204 Blender output escapes its ignored root: ${output.path}`);
    }
    requireFile(path, 'GET-204 Blender output');
    if (
      output.bytes !== statSync(path).size ||
      output.sha256 !== sha256File(path)
    ) {
      throw new Error(`GET-204 Blender output content drifted: ${output.path}`);
    }
  });

  if (!exactSet(GET204_CITY_RUNTIME.layers.map(({ view }) => view), ['overview', 'close'])) {
    throw new Error('GET-204 runtime export must provide one overview and one close layer.');
  }
  GET204_CITY_RUNTIME.layers.forEach((layer) => {
    const path = resolveWithin(appPublicRoot, layer.path, 'GET-204 runtime layer');
    requireFile(path, 'tracked GET-204 runtime layer');
    const dimensions = readPngSize(path);
    if (dimensions.width !== layer.width || dimensions.height !== layer.height) {
      throw new Error(`GET-204 runtime layer dimensions drifted: ${layer.path}`);
    }
  });
};

const recipe = readJson<Get204FullDistrictRecipe>(missionDistrictRecipePath);
const layoutExport = readJson<{ contract?: unknown }>(layoutExportPath);

const layoutErrors = validateLevel0LayoutContract(LEVEL0_LAYOUT_CONTRACT);
if (layoutErrors.length > 0) {
  throw new Error(`Invalid runtime Level 0 layout:\n${layoutErrors.join('\n')}`);
}
if (JSON.stringify(layoutExport.contract) !== JSON.stringify(LEVEL0_LAYOUT_CONTRACT)) {
  throw new Error('Blender-facing Level 0 layout export is stale. Run yarn layout:level0:export.');
}

const planErrors = validateGet204MissionDistrictRecipe(recipe);
if (planErrors.length > 0) {
  throw new Error(`Invalid GET-204 mission-district plan:\n${planErrors.join('\n')}`);
}

if (process.argv.includes('--verify-source')) {
  verifyExternalSource(recipe);
}
if (process.argv.includes('--verify-export')) {
  verifyMissionDistrictExport(recipe);
}

console.info(
  `[level0-art] valid ${recipe.id}: ${recipe.composition.urbanBlocks.length} blocks, ` +
    `${recipe.architecturalClusters.length} named-source clusters, ` +
    `${recipe.sourcePropPlacements.length} source props` +
    (process.argv.includes('--verify-source') ? ', external source verified' : '') +
    (process.argv.includes('--verify-export') ? ', Blender/runtime export verified' : '')
);
