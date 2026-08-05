import candidateRecipeJson from '../../../../../art/blender/get204/manifests/full-district-rebuild.json';
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
  id: 'level0-get204-full-district-candidate-v1',
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
    {
      id: 'surface.get204.sidewalk-west-spine',
      kind: 'sidewalk',
      polygon: rect(18.5, 1, 25.5, 65),
      walkable: true,
    },
    {
      id: 'surface.get204.sidewalk-controlled-spine',
      kind: 'sidewalk',
      polygon: rect(50, 1, 58.5, 65),
      walkable: true,
    },
    {
      id: 'surface.get204.crossing-hero',
      kind: 'crossing',
      polygon: rect(51, 18.5, 57, 23.5),
      walkable: true,
    },
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
      polygon: rect(54, 18, 89, 47),
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

export const GET204_CITY_RUNTIME = {
  id: GET204_CITY_RECIPE.runtime.runtimeIdentity,
  // This remains authoring evidence until one registered master-scene export
  // replaces the requester-accepted close/overview plate runtime.
  runtimeEnabled: false,
  projection: GET204_CITY_LAYOUT.projection,
  canvas: GET204_CITY_RECIPE.export.canvas,
  defaultZoom: GET204_CITY_RECIPE.camera.runtimeDefaultZoom,
  maximumZoom: GET204_CITY_RECIPE.camera.runtimeMaximumZoom,
  manualOverviewZoom: GET204_CITY_RECIPE.camera.manualOverviewZoom,
  actorScreenHeightTargetPx: {
    min: GET204_CITY_RECIPE.camera.actorScreenHeightTargetPx.min,
    max: GET204_CITY_RECIPE.camera.actorScreenHeightTargetPx.max,
  },
  proofStarts: GET204_CITY_RECIPE.camera.proofStarts,
  groundTiles: createGroundTiles(),
  clusters: GET204_CITY_RECIPE.architecturalClusters.map((cluster) => ({
    ...cluster,
    textureKey: `level0:get204-city:${cluster.id}`,
    depth: resolveGet204CityClusterDepth(cluster.depthAnchor),
  })) satisfies Get204CityRuntimeCluster[],
} as const;

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
