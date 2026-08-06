import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import type { CharacterSpriteDirection } from '../../../content/characters/spriteManifest';
import type {
  Level0BuildingFootprint,
  Level0LayoutContract,
  Level0SurfaceRegion,
  WorldPoint,
  WorldPolygon,
} from '../layout/types';
import { isPointInPolygon } from '../layout/validator';

export const GET204_GATE1_QUERY_VALUE = 'get204-1';

export type Get204Gate1LayerKind =
  | 'ground'
  | 'architecture-back'
  | 'architecture-front';

export interface Get204Gate1Layer {
  id: string;
  kind: Get204Gate1LayerKind;
  view: 'close' | 'overview';
  textureKey: string;
  path: string;
  depth: number;
  occluderId?: string;
}

export interface Get204Gate1Occluder {
  id: string;
  polygon: WorldPolygon;
  fadedAlpha: number;
}

export interface Get204Gate1PopulationActor {
  id: string;
  kind: 'civilian' | 'security' | 'drone';
  spriteSetId?: string;
  textureKey?: string;
  path?: string;
  position: WorldPoint;
  facing: CharacterSpriteDirection;
  worldScaleMultiplier: number;
  blocksMovement: boolean;
}

export interface Get204VisualBlocker {
  id: string;
  polygonPx: WorldPolygon;
}

export interface Get204Gate1ProofPoint extends WorldPoint {
  role: 'road' | 'sidewalk' | 'controlled-threshold' | 'service-seam' | 'foreground-occlusion';
}

const rect = (left: number, top: number, right: number, bottom: number): WorldPolygon => [
  { x: left, y: top },
  { x: right, y: top },
  { x: right, y: bottom },
  { x: left, y: bottom },
];

const GET204_CANVAS_PIXEL_ORIGIN = { x: -240, y: -862 } as const;

export const get204ArtPixelToLayout = (pixel: WorldPoint): WorldPoint => {
  const difference =
    (pixel.x - GET204_CANVAS_PIXEL_ORIGIN.x) /
    (LEVEL0_LAYOUT_CONTRACT.projection.tileWidth / 2);
  const sum =
    (pixel.y - GET204_CANVAS_PIXEL_ORIGIN.y) /
    (LEVEL0_LAYOUT_CONTRACT.projection.tileHeight / 2);
  return {
    x: (sum + difference) / 2,
    y: (sum - difference) / 2,
  };
};

const candidateSurface = (
  id: string,
  kind: Level0SurfaceRegion['kind'],
  left: number,
  top: number,
  right: number,
  bottom: number
): Level0SurfaceRegion => ({
  id,
  kind,
  polygon: rect(left, top, right, bottom),
  walkable: true,
});

const candidateBuildingFromArtPolygon = (
  id: string,
  polygonPx: WorldPolygon,
  height: number,
  functionName = 'get204-visible-architecture'
): Level0BuildingFootprint => ({
  id,
  function: functionName,
  polygon: polygonPx.map(get204ArtPixelToLayout),
  height,
});

const candidateActorBlocker = (
  actor: Get204Gate1PopulationActor
): Level0BuildingFootprint => ({
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

export const GET204_GATE1_REGION = rect(35, 7.5, 84, 47.8);

const GET204_RUNTIME_POPULATION: readonly Get204Gate1PopulationActor[] = [
  {
    id: 'get204.civilian.commuter',
    kind: 'civilian',
    textureKey: 'level0:get204-population:commuter-woman',
    path: 'environment/level0/get204-city-v2/population/commuter-woman.png',
    position: get204ArtPixelToLayout({ x: 608, y: 510 }),
    facing: 'south-east',
    worldScaleMultiplier: 0.9,
    blocksMovement: true,
  },
  {
    id: 'get204.civilian.delivery',
    kind: 'civilian',
    textureKey: 'level0:get204-population:delivery-worker',
    path: 'environment/level0/get204-city-v2/population/delivery-worker.png',
    position: get204ArtPixelToLayout({ x: 690, y: 480 }),
    facing: 'south-east',
    worldScaleMultiplier: 0.92,
    blocksMovement: true,
  },
  {
    id: 'get204.civilian.office-worker',
    kind: 'civilian',
    textureKey: 'level0:get204-population:office-worker',
    path: 'environment/level0/get204-city-v2/population/office-worker.png',
    position: get204ArtPixelToLayout({ x: 925, y: 390 }),
    facing: 'south-west',
    worldScaleMultiplier: 0.91,
    blocksMovement: true,
  },
  {
    id: 'get204.civilian.older-neighbor',
    kind: 'civilian',
    textureKey: 'level0:get204-population:older-neighbor',
    path: 'environment/level0/get204-city-v2/population/older-neighbor.png',
    position: get204ArtPixelToLayout({ x: 1015, y: 470 }),
    facing: 'north-west',
    worldScaleMultiplier: 0.9,
    blocksMovement: true,
  },
  {
    id: 'get204.security.public-entry',
    kind: 'security',
    textureKey: 'level0:get204-population:hidzu-security-man',
    path: 'environment/level0/get204-city-v2/population/hidzu-security-man.png',
    position: get204ArtPixelToLayout({ x: 1080, y: 330 }),
    facing: 'south-east',
    worldScaleMultiplier: 0.92,
    blocksMovement: true,
  },
  {
    id: 'get204.security.service-entry',
    kind: 'security',
    textureKey: 'level0:get204-population:hidzu-security-woman',
    path: 'environment/level0/get204-city-v2/population/hidzu-security-woman.png',
    position: get204ArtPixelToLayout({ x: 1160, y: 365 }),
    facing: 'south-west',
    worldScaleMultiplier: 0.92,
    blocksMovement: true,
  },
  {
    id: 'get204.drone.verifier',
    kind: 'drone',
    position: get204ArtPixelToLayout({ x: 1020, y: 285 }),
    facing: 'south-west',
    worldScaleMultiplier: 1,
    blocksMovement: false,
  },
];

const GET204_WORLD_LAYERS: readonly Get204Gate1Layer[] = [
  {
    id: 'get204-production-district-overview',
    kind: 'architecture-back',
    view: 'overview',
    textureKey: 'level0:get204-city-v2:overview',
    path: 'environment/level0/get204-city-v2/overview-nopeople-matte-v3.png',
    depth: 39,
  },
  {
    id: 'get204-production-district-close',
    kind: 'architecture-back',
    view: 'close',
    textureKey: 'level0:get204-city-v2:close',
    path: 'environment/level0/get204-city-v2/close-nopeople-matte-v2.png',
    depth: 40,
  },
];

const GET204_WORLD_OCCLUDERS: readonly Get204Gate1Occluder[] = [];

const GATE1_BUILDING_FOOTPRINTS: Level0BuildingFootprint[] = [
  candidateBuildingFromArtPolygon(
    'get204.building.north-west-public',
    [{ x: 0, y: 334 }, { x: 429, y: 120 }, { x: 935, y: 373 }, { x: 506, y: 587 }],
    8.6
  ),
  candidateBuildingFromArtPolygon(
    'get204.building.north-east-controlled',
    [{ x: 1328, y: 146 }, { x: 1648, y: 306 }, { x: 1296, y: 482 }, { x: 976, y: 322 }],
    9.4
  ),
  candidateBuildingFromArtPolygon(
    'get204.building.south-east-service',
    [{ x: 1456, y: 626 }, { x: 1808, y: 802 }, { x: 1072, y: 1170 }, { x: 720, y: 994 }],
    9.0
  ),
  candidateBuildingFromArtPolygon(
    'get204.building.south-west-public',
    [{ x: -272, y: 274 }, { x: 432, y: 626 }, { x: 48, y: 818 }, { x: -656, y: 466 }],
    8.4
  ),
  candidateBuildingFromArtPolygon(
    'get204.prop.transit-shelter',
    [{ x: 240, y: 626 }, { x: 560, y: 786 }, { x: 400, y: 866 }, { x: 80, y: 706 }],
    2.4,
    'get204-visible-public-realm-obstacle'
  ),
  candidateBuildingFromArtPolygon(
    'get204.prop.parked-bus',
    [{ x: 48, y: 402 }, { x: 240, y: 498 }, { x: 80, y: 578 }, { x: -112, y: 482 }],
    2.8,
    'get204-visible-public-realm-obstacle'
  ),
];

export const GET204_VISUAL_BLOCKERS = [
  {
    id: 'get204.visual-blocker.north-west-building',
    polygonPx: [
      { x: 0, y: 0 },
      { x: 780, y: 0 },
      { x: 870, y: 360 },
      { x: 730, y: 470 },
      { x: 520, y: 575 },
      { x: 0, y: 335 },
    ],
  },
  {
    id: 'get204.visual-blocker.north-east-logistics',
    polygonPx: [
      { x: 780, y: 0 },
      { x: 1586, y: 0 },
      { x: 1586, y: 350 },
      { x: 1450, y: 420 },
      { x: 1325, y: 360 },
      { x: 1210, y: 310 },
      { x: 1100, y: 370 },
      { x: 930, y: 300 },
    ],
  },
  {
    id: 'get204.visual-blocker.south-east-building',
    polygonPx: [
      { x: 1320, y: 280 },
      { x: 1586, y: 310 },
      { x: 1586, y: 992 },
      { x: 1280, y: 992 },
      { x: 1080, y: 785 },
      { x: 1120, y: 620 },
      { x: 1260, y: 520 },
    ],
  },
  {
    id: 'get204.visual-blocker.south-west-building',
    polygonPx: [
      { x: 0, y: 400 },
      { x: 150, y: 455 },
      { x: 480, y: 630 },
      { x: 540, y: 992 },
      { x: 0, y: 992 },
    ],
  },
  {
    id: 'get204.visual-blocker.transit-shelter',
    polygonPx: [
      { x: 95, y: 600 },
      { x: 265, y: 575 },
      { x: 455, y: 685 },
      { x: 470, y: 825 },
      { x: 310, y: 900 },
      { x: 95, y: 790 },
    ],
  },
  {
    id: 'get204.visual-blocker.parked-bus',
    polygonPx: [
      { x: 0, y: 420 },
      { x: 165, y: 440 },
      { x: 250, y: 535 },
      { x: 155, y: 610 },
      { x: 0, y: 560 },
    ],
  },
] as const satisfies readonly Get204VisualBlocker[];

export const isGet204VisualPixelBlocked = (pixel: WorldPoint): boolean =>
  GET204_VISUAL_BLOCKERS.some((blocker) => isPointInPolygon(pixel, blocker.polygonPx));

const GATE1_SURFACES: Level0SurfaceRegion[] = [
  candidateSurface('get204.surface.road.public', 'road', 35, 28.5, 82, 31.5),
  candidateSurface('get204.surface.road.controlled', 'road', 57.8, 8, 60.8, 28.5),
  candidateSurface('get204.surface.road.south-link', 'road', 57.4, 31.5, 61, 43),
  candidateSurface('get204.surface.road.background', 'road', 35, 12, 82, 15),
  candidateSurface('get204.surface.road.foreground', 'road', 35, 43, 82, 46),
  candidateSurface('get204.surface.alley.service', 'alley', 70.8, 19, 82, 28.5),
  candidateSurface('get204.surface.sidewalk.public-north', 'sidewalk', 35, 26.55, 82, 28.5),
  candidateSurface('get204.surface.sidewalk.public-south', 'sidewalk', 35, 31.5, 82, 33.45),
  candidateSurface('get204.surface.sidewalk.controlled-west', 'sidewalk', 55.9, 8, 57.8, 28.5),
  candidateSurface('get204.surface.sidewalk.controlled-east', 'sidewalk', 60.8, 8, 62.7, 28.5),
  candidateSurface('get204.surface.threshold-apron', 'plaza', 60.8, 24.2, 70.8, 28.5),
  candidateSurface('get204.surface.sidewalk.south-link-west', 'sidewalk', 55.55, 31.5, 57.4, 43),
  candidateSurface('get204.surface.sidewalk.south-link-east', 'sidewalk', 61, 31.5, 62.85, 43),
  candidateSurface('get204.surface.sidewalk.background-north', 'sidewalk', 35, 10.2, 82, 12),
  candidateSurface('get204.surface.sidewalk.background-south', 'sidewalk', 35, 15, 82, 16.8),
  candidateSurface('get204.surface.sidewalk.foreground-north', 'sidewalk', 35, 41.2, 82, 43),
  candidateSurface('get204.surface.sidewalk.foreground-south', 'sidewalk', 35, 46, 82, 47.8),
];

/**
 * Live-candidate collision replaces the obsolete greybox footprints with
 * plate-measured architecture/public-realm blockers and the current static
 * presentation actors. It remains a reversible GET-204 candidate until the
 * accepted city is promoted into the shared layout contract.
 */
export const GET204_GATE1_MOVEMENT_CONTRACT: Level0LayoutContract = {
  ...LEVEL0_LAYOUT_CONTRACT,
  id: 'level0-get204-live-candidate-v2',
  bounds: GET204_GATE1_REGION,
  surfaces: [...LEVEL0_LAYOUT_CONTRACT.surfaces, ...GATE1_SURFACES],
  buildingFootprints: [
    ...GATE1_BUILDING_FOOTPRINTS,
    ...GET204_RUNTIME_POPULATION
      .filter((actor) => actor.blocksMovement)
      .map(candidateActorBlocker),
  ],
  occluders: [
    ...GATE1_BUILDING_FOOTPRINTS.map((footprint) => footprint.polygon),
    ...GET204_RUNTIME_POPULATION
      .filter((actor) => actor.blocksMovement)
      .map(candidateActorBlocker)
      .map((footprint) => footprint.polygon),
  ],
  artLayerIds: [
    ...LEVEL0_LAYOUT_CONTRACT.artLayerIds,
    'layer.get204.gate1.ground',
    'layer.get204.gate1.architecture-back',
    'layer.get204.gate1.front-south-west',
    'layer.get204.gate1.front-south-east',
  ],
};

/**
 * Candidate live-art registration for GET-204 Gate 1. The art is active on
 * the normal Level 0 path. The query parameter only moves a fresh proof run to
 * the authored intersection; it never enables a separate scene.
 */
export const GET204_GATE1_VISUAL = {
  id: 'get204-production-district-v2',
  runtimeEnabled: true,
  projection: { ...LEVEL0_LAYOUT_CONTRACT.projection },
  canvas: {
    width: 1586,
    height: 992,
    pixelOrigin: GET204_CANVAS_PIXEL_ORIGIN,
  },
  overviewCanvas: {
    width: 1586,
    height: 992,
  },
  proofStart: { x: 59.2, y: 27.2 },
  defaultZoom: 1.48,
  maxZoom: 1.84,
  zoomBlend: {
    overviewOnlyProgress: 0.16,
    closeOnlyProgress: 0.62,
  },
  actorScreenHeightTargetPx: { min: 115, max: 150 },
  layers: GET204_WORLD_LAYERS,
  occluders: GET204_WORLD_OCCLUDERS,
  populationOwnership: 'runtime-authored-proof',
  population: GET204_RUNTIME_POPULATION,
  proofPath: [
    { role: 'road', x: 59, y: 30 },
    { role: 'sidewalk', x: 60.4, y: 27.6 },
    { role: 'controlled-threshold', x: 61.4, y: 24.7 },
    { role: 'service-seam', x: 65.4, y: 25.4 },
    { role: 'foreground-occlusion', x: 57.5, y: 34.2 },
  ] satisfies readonly Get204Gate1ProofPoint[],
} as const;

export const GET204_OVERVIEW_PLAYER_WORLD_SCALE = 0.55;
export const GET204_CLOSE_PLAYER_WORLD_SCALE = 1.8;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * The overview is a 16:10 master plate. Use a cover fit so every supported
 * viewport remains inside authored city art instead of revealing legacy
 * geometry or a board edge. 16:9 viewports crop only the quiet vertical
 * perimeter while preserving the full district width.
 */
export const resolveGet204OverviewFitZoom = (
  viewportWidth: number,
  viewportHeight: number
): number => Math.max(
  0.6,
  viewportWidth / GET204_GATE1_VISUAL.overviewCanvas.width,
  viewportHeight / GET204_GATE1_VISUAL.overviewCanvas.height
);

export const resolveGet204WorldViewBlend = (
  zoom: number,
  minimumZoom = resolveGet204OverviewFitZoom(1440, 900)
): { overviewAlpha: number; closeAlpha: number; playerWorldScale: number } => {
  const { overviewOnlyProgress, closeOnlyProgress } = GET204_GATE1_VISUAL.zoomBlend;
  const zoomRange = Math.max(0.001, GET204_GATE1_VISUAL.defaultZoom - minimumZoom);
  const zoomProgress = clamp01((zoom - minimumZoom) / zoomRange);
  const closeAlpha = clamp01(
    (zoomProgress - overviewOnlyProgress) /
    (closeOnlyProgress - overviewOnlyProgress)
  );
  return {
    overviewAlpha: 1 - closeAlpha,
    closeAlpha,
    playerWorldScale:
      GET204_OVERVIEW_PLAYER_WORLD_SCALE +
      (GET204_CLOSE_PLAYER_WORLD_SCALE - GET204_OVERVIEW_PLAYER_WORLD_SCALE) * closeAlpha,
  };
};

export const isGet204Gate1ProofRequested = (search?: string): boolean => {
  const source = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  return new URLSearchParams(source).get('visualGate') === GET204_GATE1_QUERY_VALUE;
};

export const resolveGet204Gate1LayerTopLeft = (sceneOrigin: WorldPoint): WorldPoint => ({
  x: sceneOrigin.x - GET204_GATE1_VISUAL.canvas.pixelOrigin.x,
  y: sceneOrigin.y - GET204_GATE1_VISUAL.canvas.pixelOrigin.y,
});

export const resolveGet204Gate1StartPosition = (
  fallback: WorldPoint,
  search?: string
): WorldPoint => isGet204Gate1ProofRequested(search)
  ? { ...GET204_GATE1_VISUAL.proofStart }
  : { ...fallback };

export const resolveGet204Gate1OccluderAlpha = (
  occluderId: string,
  playerPosition: WorldPoint
): number => {
  const occluder = GET204_GATE1_VISUAL.occluders.find((entry) => entry.id === occluderId);
  return occluder && isPointInPolygon(playerPosition, occluder.polygon)
    ? occluder.fadedAlpha
    : 1;
};
