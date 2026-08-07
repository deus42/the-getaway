import candidateRecipeJson from '../../../../../art/blender/get204/manifests/mission-district-rebuild.json';
import type {
  Get204FullDistrictRecipe,
  Get204RegisteredArchitecturalCluster,
} from './types';
import type {
  Level0Anchor,
  Level0AnchorKind,
  Level0BuildingFootprint,
  Level0LayoutContract,
  Level0SurfaceKind,
  Level0SurfaceRegion,
  WorldPoint,
  WorldPolygon,
} from '../layout/types';
import { isPointInPolygon } from '../layout/validator';
import type { CharacterSpriteDirection } from '../../../content/characters/spriteManifest';

export const GET204_CITY_RECIPE = candidateRecipeJson as unknown as Get204FullDistrictRecipe;

export interface Get204CityGroundTile {
  id: string;
  textureKey: string;
  path: string;
  sceneTopLeft: WorldPoint;
  width: number;
  height: number;
}

export interface Get204CityRuntimeCluster extends Get204RegisteredArchitecturalCluster {
  textureKey: string;
  depth: number;
}

export interface Get204CityRuntimeLayer {
  id: string;
  kind: 'architecture-back' | 'architecture-front' | 'identity-treatment';
  view: 'overview' | 'close';
  textureKey: string;
  path: string;
  depth: number;
  width: number;
  height: number;
  renderZoom: number;
  targetLayout: WorldPoint;
  focusPixel: WorldPoint;
  peopleBakedIntoPlate: false;
  colorSource?: 'registered-stable-runtime-plate';
  sha256?: string;
  sourceCrop?: {
    readonly left: number;
    readonly top: number;
  };
  occlusion?: {
    readonly clusterId: string;
    readonly mode: 'hard';
  };
}

export interface Get204CityZoomPresentation {
  readonly geometryMode: 'dual-registered-plate-crossfade' | 'single-registered-plate';
  readonly actorScaleMode: 'screen-compensated' | 'world-locked';
  readonly actorWorldScale: number;
  readonly actorVisibility: 'zoom-fade' | 'always';
  readonly cameraFollowMode: 'overview-to-player' | 'player-locked';
}

export interface Get204CityRuntimeVisual {
  readonly id: string;
  readonly runtimeEnabled: true;
  readonly projection: typeof GET204_CITY_LAYOUT.projection;
  readonly canvas: typeof GET204_CITY_RECIPE.export.canvas;
  readonly overviewCanvas: { readonly width: number; readonly height: number };
  readonly defaultZoom: number;
  readonly maxZoom: number;
  readonly maximumZoom: number;
  readonly manualOverviewZoom: number;
  readonly actorScreenHeightTargetPx: {
    readonly min: number;
    readonly max: number;
  };
  readonly proofStarts: typeof GET204_CITY_RECIPE.camera.proofStarts;
  readonly proofStart: WorldPoint;
  readonly closeRegion: WorldPolygon;
  readonly zoomBlend: { readonly closeStart: number; readonly closeComplete: number };
  readonly zoomPresentation: Get204CityZoomPresentation;
  readonly layers: readonly Get204CityRuntimeLayer[];
  readonly occluders: readonly unknown[];
  readonly populationOwnership: 'separate-runtime-actors';
  readonly population: readonly Get204CityPopulationActor[];
  readonly groundTiles: readonly Get204CityGroundTile[];
  readonly clusters: readonly Get204CityRuntimeCluster[];
}

export interface Get204CityPopulationActor {
  id: string;
  kind: 'civilian' | 'security' | 'drone';
  spriteSetId?: string;
  position: WorldPoint;
  facing: CharacterSpriteDirection;
  worldScaleMultiplier: number;
  blocksMovement: boolean;
}

const rect = (left: number, top: number, right: number, bottom: number): WorldPolygon => [
  { x: left, y: top },
  { x: right, y: top },
  { x: right, y: bottom },
  { x: left, y: bottom },
];

const clusterHeight = (sourcePrefix: string): number => {
  if (sourcePrefix.startsWith('Large')) return 14;
  if (sourcePrefix.startsWith('Medium')) return 10;
  return 7;
};

const buildingFootprints: Level0BuildingFootprint[] =
  GET204_CITY_RECIPE.architecturalClusters.map((cluster) => ({
    id: cluster.id,
    polygon: cluster.footprint,
    height: clusterHeight(cluster.sourcePrefix),
    function: `${cluster.subdistrictId}:${cluster.role}`,
  }));

const surfaceKind = (kind: string): Level0SurfaceKind => {
  if (kind === 'alley') return 'alley';
  if (kind === 'sidewalk') return 'sidewalk';
  if (kind === 'crossing') return 'crossing';
  if (kind === 'plaza') return 'plaza';
  return 'road';
};

const semanticSurfaces: Level0SurfaceRegion[] =
  GET204_CITY_RECIPE.semanticGeometry.walkable.map((region) => ({
    id: region.id,
    kind: surfaceKind(region.kind),
    polygon: region.polygon,
    walkable: true,
  }));

const candidateAnchorKind = (
  kind: Get204FullDistrictRecipe['semanticGeometry']['anchors'][number]['kind']
): Level0AnchorKind => kind;

const nonWalkableDeviceKinds = new Set<Level0AnchorKind>(['camera']);
const anchors: Level0Anchor[] = GET204_CITY_RECIPE.semanticGeometry.anchors.map((anchor) => ({
  id: anchor.id,
  kind: candidateAnchorKind(anchor.kind),
  position: anchor.position,
  radius: anchor.radius,
  required: !nonWalkableDeviceKinds.has(candidateAnchorKind(anchor.kind)),
  ownerId: anchor.ownerId,
}));

const entranceAnchor = (id: string): Level0Anchor => {
  const anchor = anchors.find((candidate) => candidate.id === id);
  if (!anchor) throw new Error(`GET-204 candidate is missing entrance anchor ${id}`);
  return anchor;
};

export const GET204_CITY_LAYOUT: Level0LayoutContract = {
  id: 'level0-get204-four-block-source-candidate-v1',
  schemaVersion: 3,
  projection: {
    tileWidth: 64,
    tileHeight: 32,
    orientation: 'isometric-2:1',
  },
  bounds: GET204_CITY_RECIPE.coordinateSystem.bounds,
  zones: GET204_CITY_RECIPE.composition.subdistricts.map((subdistrict) => ({
    id: `zone.${subdistrict.id}`,
    name: subdistrict.name,
    polygon: subdistrict.bounds,
  })),
  traversalLoops: GET204_CITY_RECIPE.composition.traversalLoops.map((loop) => ({
    id: loop.id,
    name: loop.name,
    points: loop.points,
    closed: true,
  })),
  surfaces: [
    {
      id: 'surface.get204.complete-public-realm',
      kind: 'plaza',
      polygon: GET204_CITY_RECIPE.coordinateSystem.bounds,
      walkable: true,
    },
    ...semanticSurfaces,
  ],
  buildingFootprints,
  entrances: [
    {
      id: 'entrance.logistics.public',
      buildingId: entranceAnchor('entrance.logistics.public').ownerId!,
      position: entranceAnchor('entrance.logistics.public').position,
      facingDegrees: 225,
      route: 'public',
    },
    {
      id: 'entrance.logistics.service',
      buildingId: entranceAnchor('entrance.logistics.service').ownerId!,
      position: entranceAnchor('entrance.logistics.service').position,
      facingDegrees: 315,
      route: 'service',
    },
    {
      id: 'entrance.safehouse',
      buildingId: entranceAnchor('entrance.safehouse').ownerId!,
      position: entranceAnchor('entrance.safehouse').position,
      facingDegrees: 135,
      route: 'shared',
    },
  ],
  droneRegions: [
    {
      id: 'drone.region.logistics-verification',
      polygon: rect(29, 0, 58, 44),
      launchAnchorId: 'drone.launch',
    },
  ],
  anchors,
  occluders: buildingFootprints.map((footprint) => footprint.polygon),
  semanticMaskIds: [
    'mask.level0.get204.walkable',
    'mask.level0.get204.blocked',
    'mask.level0.get204.occlusion',
    'mask.level0.get204.interaction',
    'mask.level0.get204.surveillance',
  ],
  artLayerIds: [
    'layer.get204-city.ground',
    'layer.get204-city.architecture',
    'layer.get204-city.lighting',
  ],
};

const createGroundTiles = (): Get204CityGroundTile[] => {
  const { width, height, groundTileSize } = GET204_CITY_RECIPE.export.canvas;
  const columns = Math.ceil(width / groundTileSize);
  const rows = Math.ceil(height / groundTileSize);
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const tileWidth = Math.min(groundTileSize, width - column * groundTileSize);
    const tileHeight = Math.min(groundTileSize, height - row * groundTileSize);
    return {
      id: `get204-city-ground-${column}-${row}`,
      textureKey: `level0:get204-city:ground:${column}:${row}`,
      path: `environment/level0/get204-city/ground-${column}-${row}.webp`,
      sceneTopLeft: { x: column * groundTileSize, y: row * groundTileSize },
      width: tileWidth,
      height: tileHeight,
    };
  });
};

export const resolveGet204CityClusterDepth = (anchor: WorldPoint): number =>
  4_000 + Math.round((anchor.x + anchor.y) * 100);

const CLOSE_TREATMENT_SCALE = 1586 / 1440;
const OVERVIEW_RUNTIME_RENDER_ZOOM = 1.28;
const BLENDER_CAMERA_ELEVATION_RADIANS = Math.PI / 6;
const BLENDER_CAMERA_TARGET_HEIGHT_METERS = 4;
const LAYOUT_UNIT_METERS = GET204_CITY_RECIPE.coordinateSystem.layoutUnitMeters;
const PIXELS_PER_METER = (
  GET204_CITY_RECIPE.coordinateSystem.projection.tileWidth / 2
) * Math.SQRT2 / LAYOUT_UNIT_METERS;

const groundFocusY = (height: number, renderZoom: number): number =>
  height / 2 +
  GET204_CITY_RECIPE.camera.followOffsetScenePixels +
  BLENDER_CAMERA_TARGET_HEIGHT_METERS *
    PIXELS_PER_METER *
    renderZoom *
    Math.cos(BLENDER_CAMERA_ELEVATION_RADIANS);

export const resolveGet204CityRenderFocusPixel = (
  width: number,
  height: number,
  renderZoom: number
): WorldPoint => ({
  x: width / 2,
  y: groundFocusY(height, renderZoom),
});

const runtimeLayers: readonly Get204CityRuntimeLayer[] = [
  {
    id: 'layer.get204-city.overview.people-free',
    kind: 'architecture-back',
    view: 'overview',
    textureKey: 'level0:get204-city:overview:source-people-free:4k:v1',
    path: 'environment/level0/get204-city/overview-source-people-free-4k-v1.png',
    depth: 39,
    width: 4096,
    height: 2304,
    renderZoom: OVERVIEW_RUNTIME_RENDER_ZOOM,
    targetLayout: { x: 29, y: 22 },
    focusPixel: resolveGet204CityRenderFocusPixel(
      4096,
      2304,
      OVERVIEW_RUNTIME_RENDER_ZOOM
    ),
    peopleBakedIntoPlate: false,
  },
  {
    id: 'layer.get204-city.close.people-free',
    kind: 'architecture-back',
    view: 'close',
    textureKey: 'level0:get204-city:close:people-free:v1',
    path: 'environment/level0/get204-city/close-people-free-v1.png',
    depth: 40,
    width: 1586,
    height: 992,
    renderZoom: GET204_CITY_RECIPE.camera.runtimeDefaultZoom * CLOSE_TREATMENT_SCALE,
    targetLayout: { ...GET204_CITY_RECIPE.camera.proofStarts['public-transit-commercial'] },
    focusPixel: {
      x: 793,
      y: groundFocusY(900, GET204_CITY_RECIPE.camera.runtimeDefaultZoom) *
        CLOSE_TREATMENT_SCALE,
    },
    peopleBakedIntoPlate: false,
  },
];

const runtimePopulation: readonly Get204CityPopulationActor[] = [
  {
    id: 'get204.civilian.transit-a',
    kind: 'civilian',
    spriteSetId: 'civilian_transit',
    position: { x: 24.15, y: 20.95 },
    facing: 'south-east',
    worldScaleMultiplier: 0.94,
    blocksMovement: false,
  },
  {
    id: 'get204.civilian.transit-b',
    kind: 'civilian',
    spriteSetId: 'civilian_transit',
    position: { x: 26.2, y: 21.3 },
    facing: 'south-west',
    worldScaleMultiplier: 0.92,
    blocksMovement: false,
  },
  {
    id: 'get204.civilian.service',
    kind: 'civilian',
    spriteSetId: 'civilian_service',
    position: { x: 42.5, y: 34.5 },
    facing: 'south-east',
    worldScaleMultiplier: 0.96,
    blocksMovement: false,
  },
  {
    id: 'get204.civilian.delivery',
    kind: 'civilian',
    spriteSetId: 'civilian_delivery',
    position: { x: 27, y: 21 },
    facing: 'south-east',
    worldScaleMultiplier: 0.96,
    blocksMovement: false,
  },
  {
    id: 'get204.security.public-entry',
    kind: 'security',
    spriteSetId: 'security_hidzu_identity',
    position: { x: 31.25, y: 21.7 },
    facing: 'south-west',
    worldScaleMultiplier: 1,
    blocksMovement: true,
  },
  {
    id: 'get204.security.service-entry',
    kind: 'security',
    spriteSetId: 'security_hidzu_service',
    position: { x: 44.5, y: 14.35 },
    facing: 'south-east',
    worldScaleMultiplier: 1,
    blocksMovement: true,
  },
  {
    id: 'get204.drone.verifier',
    kind: 'drone',
    position: { x: 52, y: 20.62 },
    facing: 'south-west',
    worldScaleMultiplier: 0.85,
    blocksMovement: false,
  },
];

const actorFootprint = (actor: Get204CityPopulationActor): Level0BuildingFootprint => ({
  id: `get204.population-blocker.${actor.id}`,
  function: 'get204-runtime-actor-occupancy',
  polygon: rect(
    actor.position.x - 0.24,
    actor.position.y - 0.24,
    actor.position.x + 0.24,
    actor.position.y + 0.24
  ),
  height: 1.8,
});

export const GET204_CITY_MOVEMENT_CONTRACT: Level0LayoutContract = {
  ...GET204_CITY_LAYOUT,
  id: 'level0-get204-four-block-runtime-v1',
  buildingFootprints: [
    ...GET204_CITY_LAYOUT.buildingFootprints,
    ...runtimePopulation.filter(({ blocksMovement }) => blocksMovement).map(actorFootprint),
  ],
};

export const GET204_CITY_RUNTIME: Get204CityRuntimeVisual = {
  id: GET204_CITY_RECIPE.runtime.runtimeIdentity,
  runtimeEnabled: true,
  projection: GET204_CITY_LAYOUT.projection,
  canvas: GET204_CITY_RECIPE.export.canvas,
  overviewCanvas: { width: 4096, height: 2304 },
  defaultZoom: 2,
  maxZoom: GET204_CITY_RECIPE.camera.runtimeMaximumZoom,
  maximumZoom: GET204_CITY_RECIPE.camera.runtimeMaximumZoom,
  manualOverviewZoom: GET204_CITY_RECIPE.camera.manualOverviewZoom,
  actorScreenHeightTargetPx: {
    min: GET204_CITY_RECIPE.camera.actorScreenHeightTargetPx.min,
    max: GET204_CITY_RECIPE.camera.actorScreenHeightTargetPx.max,
  },
  proofStarts: GET204_CITY_RECIPE.camera.proofStarts,
  proofStart: { ...GET204_CITY_RECIPE.camera.proofStarts['public-transit-commercial'] },
  closeRegion: rect(17.5, 14.5, 33, 29.5),
  zoomBlend: {
    closeStart: 1.5,
    closeComplete: 2,
  },
  zoomPresentation: {
    geometryMode: 'dual-registered-plate-crossfade',
    actorScaleMode: 'screen-compensated',
    actorWorldScale: 0.64,
    actorVisibility: 'zoom-fade',
    cameraFollowMode: 'overview-to-player',
  },
  layers: runtimeLayers,
  occluders: [] as const,
  populationOwnership: 'separate-runtime-actors',
  population: runtimePopulation,
  groundTiles: createGroundTiles(),
  clusters: GET204_CITY_RECIPE.architecturalClusters.map((cluster) => ({
    ...cluster,
    textureKey: `level0:get204-city:${cluster.id}`,
    depth: resolveGet204CityClusterDepth(cluster.depthAnchor),
  })) satisfies Get204CityRuntimeCluster[],
} as const;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const resolveGet204CityLayerTopLeft = (
  targetScene: WorldPoint,
  layer: Get204CityRuntimeLayer
): WorldPoint => ({
  x: targetScene.x - layer.focusPixel.x / layer.renderZoom,
  y: targetScene.y - layer.focusPixel.y / layer.renderZoom,
});

export interface Get204CityOverviewBounds {
  readonly targetLayout: WorldPoint;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export const resolveGet204CityOverviewBounds = (
  visual: Get204CityRuntimeVisual = GET204_CITY_RUNTIME
): Get204CityOverviewBounds => {
  const layers = visual.layers.filter(
    ({ kind, view }) => kind === 'architecture-back' && view === 'overview'
  );
  const reference = layers[0];
  if (!reference) throw new Error(`Visual ${visual.id} has no overview architecture`);

  const bounds = layers.map((layer) => {
    const deltaX = layer.targetLayout.x - reference.targetLayout.x;
    const deltaY = layer.targetLayout.y - reference.targetLayout.y;
    const targetOffset = {
      x: (deltaX - deltaY) * visual.projection.tileWidth / 2,
      y: (deltaX + deltaY) * visual.projection.tileHeight / 2,
    };
    const left = targetOffset.x - layer.focusPixel.x / layer.renderZoom;
    const top = targetOffset.y - layer.focusPixel.y / layer.renderZoom;
    return {
      left,
      top,
      right: left + layer.width / layer.renderZoom,
      bottom: top + layer.height / layer.renderZoom,
    };
  });
  const left = Math.min(...bounds.map((bound) => bound.left));
  const top = Math.min(...bounds.map((bound) => bound.top));
  const right = Math.max(...bounds.map((bound) => bound.right));
  const bottom = Math.max(...bounds.map((bound) => bound.bottom));
  return {
    targetLayout: { ...reference.targetLayout },
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
};

export const resolveGet204CityOverviewFitZoom = (
  viewportWidth: number,
  viewportHeight: number,
  visual: Get204CityRuntimeVisual = GET204_CITY_RUNTIME
): number => {
  const overview = resolveGet204CityOverviewBounds(visual);
  return Math.max(
    visual.manualOverviewZoom,
    viewportWidth / overview.width,
    viewportHeight / overview.height
  );
};

export const resolveGet204CityStartPosition = (
  fallback: WorldPoint,
  search?: string
): WorldPoint => {
  const source = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  return new URLSearchParams(source).get('visualGate') === 'get204-1'
    ? { ...GET204_CITY_RUNTIME.proofStart }
    : { ...fallback };
};

export const resolveGet204CityInitialZoom = (
  _search?: string,
  visual: Get204CityRuntimeVisual = GET204_CITY_RUNTIME
): number => visual.defaultZoom;

export const resolveGet204CityWorldViewBlend = (
  zoom: number,
  visualOrLegacyPlayerPosition: Get204CityRuntimeVisual | WorldPoint = GET204_CITY_RUNTIME
): {
  overviewAlpha: number;
  closeAlpha: number;
  actorAlpha: number;
  playerWorldScale: number;
} => {
  const visual = 'zoomPresentation' in visualOrLegacyPlayerPosition
    ? visualOrLegacyPlayerPosition
    : GET204_CITY_RUNTIME;
  if (visual.zoomPresentation.geometryMode === 'single-registered-plate') {
    return {
      overviewAlpha: 1,
      closeAlpha: 0,
      actorAlpha: 1,
      playerWorldScale: visual.zoomPresentation.actorWorldScale,
    };
  }
  const { closeStart, closeComplete } = GET204_CITY_RUNTIME.zoomBlend;
  const closeAlpha = clamp01((zoom - closeStart) / (closeComplete - closeStart));
  return {
    // The full registered source export stays underneath the local close
    // treatment so camera bounds never expose a black seam.
    overviewAlpha: 1,
    closeAlpha,
    actorAlpha: visual.zoomPresentation.actorVisibility === 'always'
      ? 1
      : clamp01((zoom - 0.68) / 0.42),
    playerWorldScale: visual.zoomPresentation.actorScaleMode === 'world-locked'
      ? visual.zoomPresentation.actorWorldScale
      : Math.max(0.42, Math.min(0.95, 1.25 / Math.max(0.5, zoom))),
  };
};

export const resolveGet204CityRegisteredTopLeft = (
  sceneOrigin: WorldPoint,
  registeredTopLeft: WorldPoint
): WorldPoint => ({
  x: sceneOrigin.x - GET204_CITY_RECIPE.export.canvas.pixelOrigin.x + registeredTopLeft.x,
  y: sceneOrigin.y - GET204_CITY_RECIPE.export.canvas.pixelOrigin.y + registeredTopLeft.y,
});

export const resolveGet204CityClusterAlpha = (
  clusterId: string,
  playerPosition: WorldPoint
): number => {
  const cluster = GET204_CITY_RECIPE.architecturalClusters.find(
    (candidate) => candidate.id === clusterId
  );
  return cluster && isPointInPolygon(playerPosition, cluster.localOcclusionPolygon)
    ? 0.22
    : 1;
};
