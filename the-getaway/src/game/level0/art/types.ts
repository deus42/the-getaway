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

export type Get204ReferenceRole =
  | 'approved-composition-previsualization'
  | 'quality-look-target'
  | 'close-play-target'
  | 'overview-density-target';

export type Get204SubdistrictId =
  | 'safehouse-backstreets'
  | 'public-transit-commercial'
  | 'logistics-civic-control';

export type Get204ClusterRole =
  | 'continuous-frontage'
  | 'corner-anchor'
  | 'safehouse-frontage'
  | 'transit-frontage'
  | 'service-frontage'
  | 'controlled-threshold'
  | 'district-landmark';

export type Get204PlacementAnchor =
  | 'north-west'
  | 'north-east'
  | 'south-west'
  | 'south-east';

export interface Get204VisualReference {
  role: Get204ReferenceRole;
  path: string;
  sha256: string;
  authority: string;
}

export interface Get204CandidateSubdistrict {
  id: Get204SubdistrictId;
  name: string;
  playerPromise: string;
  bounds: WorldPolygon;
  identityClusterIds: string[];
}

export interface Get204CandidateTraversalLoop {
  id: string;
  name: string;
  subdistrictIds: Get204SubdistrictId[];
  points: WorldPoint[];
  closed: true;
}

export interface Get204StreetSegment {
  id: string;
  kind: 'controlled-boulevard' | 'ordinary-street' | 'service-alley';
  centerline: WorldPoint[];
  widthLayoutUnits: number;
  gameplayPurpose: string;
}

export interface Get204RegisteredArchitecturalCluster {
  id: string;
  blockId: string;
  subdistrictId: Get204SubdistrictId;
  role: Get204ClusterRole;
  artSource: 'owned-kit';
  sourcePrefix: string;
  sourceCollection: string;
  layoutPosition: WorldPoint;
  rotationDegrees: number;
  uniformScale: number;
  placementAnchor: Get204PlacementAnchor;
  streetWallInsetMeters: number;
  verticalCropMeters?: number;
  cropRectangle: { x: number; y: number; width: number; height: number };
  sceneTopLeft: WorldPoint;
  depthAnchor: WorldPoint;
  footprint: WorldPolygon;
  localOcclusionPolygon: WorldPolygon;
  runtimePath: string;
}

export interface Get204SourcePropPlacement {
  id: string;
  sourcePrefix: string;
  position: WorldPoint;
  rotationDegrees: number;
  uniformScale: number;
  mountLiftMeters: number;
  layer: 'details';
}

export interface Get204SemanticAnchor {
  id: string;
  kind:
    | 'safehouse'
    | 'contact'
    | 'entrance'
    | 'terminal'
    | 'camera'
    | 'drone-launch'
    | 'hiding'
    | 'blending'
    | 'objective'
    | 'audio'
    | 'interaction';
  position: WorldPoint;
  radius: number;
  ownerId?: string;
}

/**
 * Authoring and proof contract for the four-block GET-204 source rebuild. The
 * accepted Blender candidate promotes its geometry into the shared layout only
 * after the requester approves the rendered close and overview pair.
 */
export interface Get204FullDistrictRecipe {
  schemaVersion: 3;
  id: string;
  ticket: 'GET-204';
  acceptanceState: 'FOUR_BLOCK_BLENDER_SOURCE_CANDIDATE';
  usage: 'candidate-evidence';
  references: Get204VisualReference[];
  source: {
    vendor: 'KitBash3D';
    kit: 'Neo Tokyo 2';
    sourceRootVariable: 'GETAWAY_NEO_TOKYO_ROOT';
    format: 'FBX';
    textureSearchRoots: ['Textures', 'jpeg images', 'c4d/tex'];
    objectSuffixExclusions: Record<string, string[]>;
    rawSourceCommitted: false;
  };
  coordinateSystem: {
    layoutUnitMeters: number;
    projection: {
      tileWidth: 64;
      tileHeight: 32;
      orientation: 'isometric-2:1';
      azimuthDegrees: 45;
      elevationDegrees: 30;
    };
    bounds: WorldPolygon;
  };
  composition: {
    subdistricts: Get204CandidateSubdistrict[];
    urbanBlocks: Array<{
      id: string;
      subdistrictId: Get204SubdistrictId;
      polygon: WorldPolygon;
      clusterIds: string[];
      streetEdgeIds: string[];
    }>;
    traversalLoops: Get204CandidateTraversalLoop[];
    density: {
      minimumVisibleBuildingInstances: number;
      maximumVisibleBuildingInstances: number;
      blockClusterPolicy: 'four-mission-blocks-with-named-kit-provenance';
      croppedKitHeroFrontageCount: number;
      minimumBuiltFootprintRatio: number;
      minimumDistinctSourceRoots: number;
      maximumSourceReuse: number;
      maximumTallLandmarks: number;
    };
    openSpaces: Array<{
      id: string;
      gameplayOwner: string;
      areaLayoutUnits: number;
      polygon: WorldPolygon;
    }>;
  };
  streetHierarchy: {
    controlledBoulevards: Get204StreetSegment[];
    ordinaryStreets: Get204StreetSegment[];
    serviceAlleys: Get204StreetSegment[];
    publicRealmKinds: string[];
  };
  camera: {
    runtimeDefaultZoom: number;
    runtimeMaximumZoom: number;
    manualOverviewZoom: number;
    followOffsetScenePixels: number;
    actorScreenHeightTargetPx: {
      viewport: '1440x900';
      min: number;
      max: number;
    };
    proofStarts: Record<Get204SubdistrictId, WorldPoint>;
    proofOccluderClusterIds: Record<Get204SubdistrictId, string[]>;
  };
  architecturalClusters: Get204RegisteredArchitecturalCluster[];
  sourcePropPlacements: Get204SourcePropPlacement[];
  semanticGeometry: {
    walkable: Array<{ id: string; kind: string; polygon: WorldPolygon }>;
    blockedClusterIds: string[];
    anchors: Get204SemanticAnchor[];
  };
  populationStaging: {
    proofScaleFigures: number;
    bakedEnvironmentActorCount: 0;
    runtimeActorPolicy: 'separate-runtime-actors';
    unarmedVerifierDrones: 1;
  };
  lighting: {
    baseState: 'blue-hour';
    alignedStates: Level0LightingState[];
    keyDirection: 'upper-left';
    practicals: 'visible-emitter-owned';
  };
  export: {
    strategy: 'tiled-ground-plus-cropped-registered-master-scene-clusters';
    canvas: {
      width: number;
      height: number;
      pixelOrigin: WorldPoint;
      groundTileSize: number;
    };
    allowFullCanvasTransparentForegroundLayers: false;
    maximumClusterDimension: number;
    runtimeRoot: 'environment/level0/get204-city';
  };
  runtime: {
    enablement: 'normal-level0-path';
    fallbackPolicy: 'fail-visible-on-required-candidate-asset';
    runtimeIdentity: 'get204-four-block-source-candidate-v1';
    prohibitedQueryValues: string[];
    prohibitedFallbackProfiles: string[];
  };
  commitBoundary: {
    permitted: string[];
    prohibited: string[];
  };
}
