import type { WorldPoint, WorldPolygon } from '../layout/types';

export type Level0SourceAssetCategory = 'large' | 'medium' | 'small' | 'public-realm';
export type Level0SourceUpAxis = 'Y' | 'Z';
export type Level0ArtPhase = 'unchanged-kit-composition';
export type Level0LightingState = 'dusk' | 'blue-hour' | 'curfew';
export type Level0FrontageEdge = 'north' | 'south' | 'east' | 'west';
export type Level0ArtLayerKind =
  | 'ground'
  | 'architecture-back'
  | 'architecture-front'
  | 'lighting-foundation'
  | 'semantic-mask';

export interface Level0SelectedSourceAsset {
  id: string;
  sourcePrefix: string;
  category: Level0SourceAssetCategory;
  sourceObjectPattern: string;
  sourceUpAxis: Level0SourceUpAxis;
  normalize: {
    groundContact: 'measured-bounds-min-z' | 'source-catalog-plane';
    center: 'measured-ground-bounds-center';
    sourceUnitsPerMeter: number;
    sourceGroundDatumMeters?: number;
  };
  measuredStructuralBoundsMeters: {
    width: number;
    depth: number;
    height: number;
  };
  excludedObjectSuffixes: string[];
}

export interface Level0SourceManifest {
  schemaVersion: 1;
  ticket: 'GET-204';
  vendor: 'KitBash3D';
  kit: 'Neo Tokyo 2';
  sourceRootVariable: 'GETAWAY_NEO_TOKYO_ROOT';
  archiveRelativePath: string;
  archiveSha256: string;
  archiveBytes: number;
  format: 'FBX';
  sourceObjectCount: number;
  geometryMember: {
    path: string;
    sha256: string;
    byteSize: number;
    importer: 'bpy.ops.import_scene.fbx';
    globalScale: number;
    axisForward: '-Z';
    axisUp: 'Y';
  };
  textures: {
    sourceRelativePath: string;
    sourceFileCount: number;
    contentSha256: string;
    relinkDirectory: 'KB3DTextures';
  };
  ownership: {
    basis: 'requester-asserted-owned';
    assertedAt: string;
    exactEntitlementEvidence: 'unavailable' | 'verified';
    evidenceReference?: string;
    generalTermsUrl: string;
  };
  commitBoundary: {
    permitted: string[];
    prohibited: string[];
  };
  selectedAssets: Level0SelectedSourceAsset[];
}

export interface Level0RecipeLayer {
  id: string;
  kind: Level0ArtLayerKind;
  state?: Level0LightingState;
  maskId?: string;
  fallbackLayerId: string;
}

export interface Level0BuildingPlacement {
  id: string;
  footprintId: string;
  assetId: string;
  role: 'street-wall' | 'logistics-landmark' | 'safehouse-shell';
  layoutPosition: WorldPoint;
  rotationDegrees: number;
  uniformScale: number;
  targetHeightMeters: number;
  footprintFill: number;
  frontageEdges: Level0FrontageEdge[];
}

export interface Level0PropPlacement {
  id: string;
  assetId: string;
  anchorId: string;
  role: 'terminal' | 'hiding' | 'blending' | 'entrance';
  layoutPosition: WorldPoint;
  rotationDegrees: number;
  uniformScale: number;
  mountLiftMeters?: number;
}

export interface Level0SceneRecipe {
  schemaVersion: 1;
  id: string;
  ticket: 'GET-204';
  phase: Level0ArtPhase;
  layout: {
    contractId: string;
    schemaVersion: number;
    contractPath: string;
    contractSha256: string;
    bounds: WorldPolygon;
    traversalLoopIds: string[];
    buildingFootprintIds: string[];
    entranceIds: string[];
    anchorIds: string[];
    semanticMaskIds: string[];
  };
  coordinateSystem: {
    layoutUnitMeters: number;
    blenderUpAxis: 'Z';
    origin: { x: number; y: number; z: number };
  };
  camera: {
    type: 'orthographic';
    sensorFit: 'vertical';
    azimuthDegrees: number;
    elevationDegrees: number;
    tileWidth: number;
    tileHeight: number;
    followOffsetScenePixels: number;
    defaultZoom: number;
    minimumZoom: number;
  };
  lighting: {
    direction: 'upper-left';
    states: Level0LightingState[];
    treatment: string;
  };
  publicRealm: {
    surfaceIds: string[];
    authoredKinds: string[];
    buildingLotTreatment: 'structure-bounds';
  };
  buildingPlacements: Level0BuildingPlacement[];
  propPlacements: Level0PropPlacement[];
  entranceProof: Array<{
    entranceId: string;
    buildingId: string;
    position: WorldPoint;
    minimumClearWidthMeters: number;
  }>;
  actorScaleProof: Array<{
    id: string;
    anchorId: string;
    heightMeters: number;
    minimumSilhouetteWidthMeters: number;
  }>;
  alignedExport: {
    canvas: {
      width: number;
      height: number;
      pixelOrigin: WorldPoint;
      tileSize: number;
    };
    budget: {
      maxTotalBytes: number;
      maxTileBytes: number;
    };
    fallbackProfile: 'level0-greybox';
  };
  layers: Level0RecipeLayer[];
  captures: Array<{
    id: string;
    width: number;
    height: number;
    zoom: number;
    framing: 'default' | 'minimum';
    targetAnchorId: string;
  }>;
  exclusions: string[];
}

export interface Level0ArtTile {
  id: string;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imagePath: string;
  sha256: string;
  byteSize: number;
}

export interface Level0ArtLayer {
  id: string;
  kind: Level0ArtLayerKind;
  state?: Level0LightingState;
  maskId?: string;
  tiles: Level0ArtTile[];
  fallbackLayerId: string;
}

/**
 * Registration metadata for flattened, tiled Level 0 derivatives. Ignored local
 * evidence uses the same contract before entitlement-backed runtime promotion.
 * Gameplay geometry remains owned by Level0LayoutContract.
 */
export interface Level0ArtManifest {
  schemaVersion: 1;
  id: string;
  usage: 'local-evidence' | 'runtime';
  recipeId: string;
  layoutContractId: string;
  projection: {
    tileWidth: 64;
    tileHeight: 32;
    orientation: 'isometric-2:1';
  };
  worldOrigin: WorldPoint;
  canvas: {
    width: number;
    height: number;
    pixelOrigin: WorldPoint;
    tileSize: number;
    columns: number;
    rows: number;
  };
  budget: {
    maxTotalBytes: number;
    maxTileBytes: number;
    measuredTotalBytes: number;
  };
  layers: Level0ArtLayer[];
  anchorMetadata: {
    path: string;
    sha256: string;
    count: number;
  };
  fallbackProfile: 'level0-greybox';
}

export interface Level0ArtBundle {
  source: Level0SourceManifest;
  recipe: Level0SceneRecipe;
  art: Level0ArtManifest;
}
