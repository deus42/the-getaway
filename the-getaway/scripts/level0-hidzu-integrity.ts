import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Level0LayoutContract } from '../src/game/level0/layout/types';
import type {
  Level0ArtManifest,
  Level0SceneRecipe,
  Level0SourceManifest,
} from '../src/game/level0/art/types';
import type { Level0HidzuTreatmentEvidence } from '../src/game/level0/art/hidzuTypes';

export interface Get204MasterSceneMetadata {
  schemaVersion: number;
  ticket: string;
  scene: string;
  recipe: {
    id: string;
    layoutContractId: string;
    layoutContractSha256: string;
    camera: Level0SceneRecipe['camera'];
  };
  layout: {
    bounds: Level0LayoutContract['bounds'];
    traversalLoopIds: string[];
    surfaceCount: number;
    footprintCount: number;
    anchorCount: number;
  };
  source: {
    exactEntitlementEvidence: 'unavailable' | 'verified';
  };
  buildingPlacements: Array<{
    placementId: string;
    assetId: string;
    transformedBoundsMeters: {
      minimum: [number, number, number];
      maximum: [number, number, number];
      dimensions: [number, number, number];
    };
    layoutPosition: { x: number; y: number };
    rotationDegrees: number;
    uniformScale: number;
  }>;
  gameplayPropPlacements: Array<{
    placementId: string;
    assetId: string;
    anchorId: string;
    role: string;
    transformedBoundsMeters: {
      minimum: [number, number, number];
      maximum: [number, number, number];
      dimensions: [number, number, number];
    };
    layoutPosition: { x: number; y: number };
    rotationDegrees: number;
    uniformScale: number;
    mountLiftMeters: number;
  }>;
}

const sortObject = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortObject(child)])
    );
  }
  return value;
};

export const sha256Bytes = (bytes: Buffer | string): string =>
  createHash('sha256').update(bytes).digest('hex');

export const sha256File = (path: string): string => sha256Bytes(readFileSync(path));

export const sha256CanonicalJson = (value: unknown): string =>
  sha256Bytes(JSON.stringify(sortObject(value)));

export const semanticMaskRegistrationDigest = (art: Level0ArtManifest): string =>
  sha256CanonicalJson(
    art.layers
      .filter((layer) => layer.kind === 'semantic-mask')
      .map((layer) => ({
        id: layer.id,
        kind: layer.kind,
        maskId: layer.maskId,
        fallbackLayerId: layer.fallbackLayerId,
        tiles: layer.tiles.map((tile) => ({
          id: tile.id,
          column: tile.column,
          row: tile.row,
          x: tile.x,
          y: tile.y,
          width: tile.width,
          height: tile.height,
          imagePath: tile.imagePath,
          sha256: tile.sha256,
          byteSize: tile.byteSize,
        })),
      }))
  );

export const createLevel0HidzuTreatmentEvidence = (
  paths: {
    sourceManifest: string;
    sceneRecipe: string;
    layoutContract: string;
    masterScene: string;
    masterSceneMetadata: string;
    baseArtManifest: string;
    reference: string;
    visualGrammar: string;
  },
  recipe: Level0SceneRecipe,
  layout: Level0LayoutContract,
  metadata: Get204MasterSceneMetadata
): Level0HidzuTreatmentEvidence => {
  const source = JSON.parse(readFileSync(paths.sourceManifest, 'utf8')) as Level0SourceManifest;
  const baseArt = JSON.parse(readFileSync(paths.baseArtManifest, 'utf8')) as Level0ArtManifest;
  if (metadata.source.exactEntitlementEvidence !== source.ownership.exactEntitlementEvidence) {
    throw new Error('GET-204 metadata entitlement state drifts from the tracked source manifest.');
  }
  const buildingTransformDigest = sha256CanonicalJson({
    recipe: recipe.buildingPlacements,
    measured: metadata.buildingPlacements,
  });
  const propTransformDigest = sha256CanonicalJson({
    recipe: recipe.propPlacements,
    measured: metadata.gameplayPropPlacements,
  });
  const cameraDigest = sha256CanonicalJson({
    recipe: recipe.camera,
    measured: metadata.recipe.camera,
  });
  const canvasDigest = sha256CanonicalJson(recipe.alignedExport.canvas);
  const anchorDigest = sha256CanonicalJson(layout.anchors);
  const semanticMaskDigest = sha256CanonicalJson(layout.semanticMaskIds);
  const geometrySignature = sha256CanonicalJson({
    layoutContractId: layout.id,
    bounds: layout.bounds,
    traversalLoops: layout.traversalLoops,
    surfaces: layout.surfaces,
    buildingFootprints: layout.buildingFootprints,
    entrances: layout.entrances,
    buildingTransformDigest,
    propTransformDigest,
    cameraDigest,
    canvasDigest,
    anchorDigest,
    semanticMaskDigest,
  });

  return {
    sourceManifestSha256: sha256File(paths.sourceManifest),
    sceneRecipeSha256: sha256File(paths.sceneRecipe),
    layoutContractSha256: sha256File(paths.layoutContract),
    masterSceneSha256: sha256File(paths.masterScene),
    masterSceneMetadataSha256: sha256File(paths.masterSceneMetadata),
    baseArtManifestSha256: sha256File(paths.baseArtManifest),
    semanticMaskRegistrationDigest: semanticMaskRegistrationDigest(baseArt),
    referenceSha256: sha256File(paths.reference),
    visualGrammarSha256: sha256File(paths.visualGrammar),
    geometrySignature,
    buildingTransformDigest,
    propTransformDigest,
    cameraDigest,
    canvasDigest,
    anchorDigest,
    semanticMaskDigest,
    exactEntitlementEvidence: source.ownership.exactEntitlementEvidence,
  };
};
