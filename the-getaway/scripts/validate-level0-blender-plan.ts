import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVEL0_LAYOUT_CONTRACT } from '../src/content/levels/level0/layoutContract';
import type {
  Level0ArtManifest,
  Level0SceneRecipe,
  Level0SourceManifest,
} from '../src/game/level0/art/types';
import {
  validateLevel0ArtBundle,
  validateLevel0SourceAndRecipe,
} from '../src/game/level0/art/validator';
import { validateLevel0LayoutContract } from '../src/game/level0/layout/validator';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..', '..');
const sourceManifestPath = resolve(
  repositoryRoot,
  'art/blender/get204/manifests/source-manifest.json'
);
const sceneRecipePath = resolve(
  repositoryRoot,
  'art/blender/get204/manifests/scene-recipe.json'
);
const layoutExportPath = resolve(
  repositoryRoot,
  'art/iso-assets/contracts/level0-layout-contract.json'
);
const alignedExportRoot = resolve(
  repositoryRoot,
  'art/blender/get204/.generated/aligned-export'
);
const alignedArtManifestPath = resolve(alignedExportRoot, 'art-manifest.json');

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

const sha256File = (path: string): string => sha256(readFileSync(path));

const approximatelyEqual = (left: number, right: number): boolean =>
  Math.abs(left - right) <= 0.000_001;

const verifyExternalSource = (source: Level0SourceManifest): void => {
  const sourceRoot = process.env[source.sourceRootVariable];
  if (!sourceRoot) {
    throw new Error(
      `--verify-source requires ${source.sourceRootVariable} to point to the owned Neo Tokyo 2 pack`
    );
  }

  const archivePath = resolve(sourceRoot, source.archiveRelativePath);
  if (!existsSync(archivePath) || !statSync(archivePath).isFile()) {
    throw new Error(`Missing recorded Neo Tokyo source archive: ${archivePath}`);
  }
  if (statSync(archivePath).size !== source.archiveBytes) {
    throw new Error(`Neo Tokyo source archive byte size drifted: ${archivePath}`);
  }
  if (sha256File(archivePath) !== source.archiveSha256) {
    throw new Error(`Neo Tokyo source archive content hash drifted: ${archivePath}`);
  }

  const textureRoot = resolve(sourceRoot, source.textures.sourceRelativePath);
  if (!existsSync(textureRoot) || !statSync(textureRoot).isDirectory()) {
    throw new Error(`Missing recorded Neo Tokyo texture directory: ${textureRoot}`);
  }
  const textureFiles = readdirSync(textureRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  if (textureFiles.length !== source.textures.sourceFileCount) {
    throw new Error(
      `Neo Tokyo texture count drifted: expected ${source.textures.sourceFileCount}, found ${textureFiles.length}`
    );
  }
  const textureDigest = createHash('sha256');
  textureFiles.forEach((relativePath) => {
    textureDigest.update(relativePath);
    textureDigest.update('\0');
    textureDigest.update(sha256File(resolve(textureRoot, relativePath)));
    textureDigest.update('\n');
  });
  if (textureDigest.digest('hex') !== source.textures.contentSha256) {
    throw new Error(`Neo Tokyo texture content digest drifted: ${textureRoot}`);
  }
};

const verifyAlignedExport = (
  source: Level0SourceManifest,
  recipe: Level0SceneRecipe
): void => {
  if (!existsSync(alignedArtManifestPath) || !statSync(alignedArtManifestPath).isFile()) {
    throw new Error(`Missing ignored GET-204 aligned export manifest: ${alignedArtManifestPath}`);
  }
  const art = readJson<Level0ArtManifest>(alignedArtManifestPath);
  const bundleErrors = validateLevel0ArtBundle(
    { source, recipe, art },
    LEVEL0_LAYOUT_CONTRACT
  );
  if (bundleErrors.length > 0) {
    throw new Error(`Invalid GET-204 aligned export:\n${bundleErrors.join('\n')}`);
  }

  const resolveExportFile = (relativePath: string): string => {
    const path = resolve(alignedExportRoot, relativePath);
    if (!path.startsWith(`${alignedExportRoot}/`)) {
      throw new Error(`Aligned export path escapes its ignored root: ${relativePath}`);
    }
    return path;
  };
  let measuredTotalBytes = 0;
  art.layers.flatMap((layer) => layer.tiles).forEach((tile) => {
    const path = resolveExportFile(tile.imagePath);
    if (!existsSync(path) || !statSync(path).isFile()) {
      throw new Error(`Missing aligned export tile: ${path}`);
    }
    const byteSize = statSync(path).size;
    if (byteSize !== tile.byteSize || sha256File(path) !== tile.sha256) {
      throw new Error(`Aligned export tile content drifted: ${path}`);
    }
    measuredTotalBytes += byteSize;
  });
  if (measuredTotalBytes !== art.budget.measuredTotalBytes) {
    throw new Error('Aligned export measured byte total drifted from the manifest.');
  }

  const anchorPath = resolveExportFile(art.anchorMetadata.path);
  if (
    !existsSync(anchorPath) ||
    !statSync(anchorPath).isFile() ||
    sha256File(anchorPath) !== art.anchorMetadata.sha256
  ) {
    throw new Error(`Aligned anchor metadata content drifted: ${anchorPath}`);
  }
  const anchorPayload = readJson<{
    projection?: {
      tileWidth?: number;
      tileHeight?: number;
      orientation?: string;
      pixelOrigin?: { x?: number; y?: number };
    };
    anchors?: Array<{
      id?: string;
      kind?: string;
      required?: boolean;
      radiusLayoutUnits?: number;
      layoutPosition?: { x?: number; y?: number };
      worldPositionMeters?: { x?: number; y?: number; z?: number };
      pixelPosition?: { x?: number; y?: number };
      ownerId?: string;
      tags?: string[];
    }>;
  }>(anchorPath);
  if (anchorPayload.anchors?.length !== art.anchorMetadata.count) {
    throw new Error('Aligned anchor metadata count drifted from the manifest.');
  }
  const projection = anchorPayload.projection;
  if (
    projection?.tileWidth !== recipe.camera.tileWidth ||
    projection?.tileHeight !== recipe.camera.tileHeight ||
    projection?.orientation !== 'isometric-2:1' ||
    !approximatelyEqual(
      projection?.pixelOrigin?.x ?? Number.NaN,
      recipe.alignedExport.canvas.pixelOrigin.x
    ) ||
    !approximatelyEqual(
      projection?.pixelOrigin?.y ?? Number.NaN,
      recipe.alignedExport.canvas.pixelOrigin.y
    )
  ) {
    throw new Error('Aligned anchor projection metadata drifts from the scene recipe.');
  }
  const anchorsById = new Map(anchorPayload.anchors?.map((anchor) => [anchor.id, anchor]));
  if (
    anchorsById.size !== LEVEL0_LAYOUT_CONTRACT.anchors.length ||
    anchorsById.has(undefined)
  ) {
    throw new Error('Aligned anchor metadata IDs drift from the Level 0 layout contract.');
  }
  const unit = recipe.coordinateSystem.layoutUnitMeters;
  const halfTileWidth = recipe.camera.tileWidth / 2;
  const halfTileHeight = recipe.camera.tileHeight / 2;
  LEVEL0_LAYOUT_CONTRACT.anchors.forEach((expected) => {
    const actual = anchorsById.get(expected.id);
    const expectedPixel = {
      x:
        (expected.position.x - expected.position.y) * halfTileWidth +
        recipe.alignedExport.canvas.pixelOrigin.x,
      y:
        (expected.position.x + expected.position.y) * halfTileHeight +
        recipe.alignedExport.canvas.pixelOrigin.y,
    };
    if (
      !actual ||
      actual.kind !== expected.kind ||
      actual.required !== expected.required ||
      !approximatelyEqual(actual.radiusLayoutUnits ?? Number.NaN, expected.radius) ||
      !approximatelyEqual(actual.layoutPosition?.x ?? Number.NaN, expected.position.x) ||
      !approximatelyEqual(actual.layoutPosition?.y ?? Number.NaN, expected.position.y) ||
      !approximatelyEqual(actual.worldPositionMeters?.x ?? Number.NaN, expected.position.x * unit) ||
      !approximatelyEqual(actual.worldPositionMeters?.y ?? Number.NaN, expected.position.y * unit) ||
      !approximatelyEqual(actual.worldPositionMeters?.z ?? Number.NaN, 0) ||
      !approximatelyEqual(actual.pixelPosition?.x ?? Number.NaN, expectedPixel.x) ||
      !approximatelyEqual(actual.pixelPosition?.y ?? Number.NaN, expectedPixel.y) ||
      actual.ownerId !== expected.ownerId ||
      JSON.stringify(actual.tags ?? []) !== JSON.stringify(expected.tags ?? [])
    ) {
      throw new Error(`Aligned anchor metadata drifts for ${expected.id}.`);
    }
  });
};

const source = readJson<Level0SourceManifest>(sourceManifestPath);
const recipe = readJson<Level0SceneRecipe>(sceneRecipePath);
const layoutExportBytes = readFileSync(layoutExportPath);
const layoutExport = JSON.parse(layoutExportBytes.toString('utf8')) as { contract?: unknown };

const layoutErrors = validateLevel0LayoutContract(LEVEL0_LAYOUT_CONTRACT);
if (layoutErrors.length > 0) {
  throw new Error(`Invalid runtime Level 0 layout:\n${layoutErrors.join('\n')}`);
}
if (JSON.stringify(layoutExport.contract) !== JSON.stringify(LEVEL0_LAYOUT_CONTRACT)) {
  throw new Error('Blender-facing Level 0 layout export is stale. Run yarn layout:level0:export.');
}
if (sha256(layoutExportBytes) !== recipe.layout.contractSha256) {
  throw new Error('GET-204 scene recipe references a stale Level 0 layout-export hash.');
}

const planErrors = validateLevel0SourceAndRecipe(source, recipe, LEVEL0_LAYOUT_CONTRACT);
if (planErrors.length > 0) {
  throw new Error(`Invalid GET-204 Blender source/scene plan:\n${planErrors.join('\n')}`);
}

if (process.argv.includes('--verify-source')) {
  verifyExternalSource(source);
}
if (process.argv.includes('--verify-export')) {
  verifyAlignedExport(source, recipe);
}

console.info(
  `[level0-art] valid ${recipe.id}: ${source.selectedAssets.length} selected source roots, ` +
    `${recipe.buildingPlacements.length} buildings, ${recipe.propPlacements.length} gameplay props, ` +
    `${recipe.layers.length} aligned layers` +
    (process.argv.includes('--verify-source') ? ', external source verified' : '') +
    (process.argv.includes('--verify-export') ? ', ignored aligned export verified' : '')
);
