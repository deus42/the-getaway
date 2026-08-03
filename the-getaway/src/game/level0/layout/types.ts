export interface WorldPoint {
  x: number;
  y: number;
}

export type WorldPolygon = WorldPoint[];

export type Level0SurfaceKind =
  | 'road'
  | 'sidewalk'
  | 'crossing'
  | 'alley'
  | 'plaza'
  | 'interior-boundary'
  | 'blocked';

export type Level0AnchorKind =
  | 'safehouse'
  | 'contact'
  | 'entrance'
  | 'terminal'
  | 'camera'
  | 'drone-launch'
  | 'hiding'
  | 'blending'
  | 'objective'
  | 'interaction'
  | 'audio';

export interface Level0Zone {
  id: string;
  name: string;
  polygon: WorldPolygon;
}

export interface Level0TraversalLoop {
  id: string;
  name: string;
  points: WorldPoint[];
  closed: true;
}

export interface Level0SurfaceRegion {
  id: string;
  kind: Level0SurfaceKind;
  polygon: WorldPolygon;
  walkable: boolean;
}

export interface Level0BuildingFootprint {
  id: string;
  polygon: WorldPolygon;
  height: number;
  function: string;
}

export interface Level0Entrance {
  id: string;
  buildingId: string;
  position: WorldPoint;
  facingDegrees: number;
  route: 'public' | 'service' | 'shared';
}

export interface Level0DroneRegion {
  id: string;
  polygon: WorldPolygon;
  launchAnchorId: string;
}

export interface Level0Anchor {
  id: string;
  kind: Level0AnchorKind;
  position: WorldPoint;
  radius: number;
  required: boolean;
  ownerId?: string;
  tags?: string[];
}

export interface Level0LayoutContract {
  id: string;
  schemaVersion: number;
  projection: {
    tileWidth: 64;
    tileHeight: 32;
    orientation: 'isometric-2:1';
  };
  bounds: WorldPolygon;
  zones: Level0Zone[];
  traversalLoops: Level0TraversalLoop[];
  surfaces: Level0SurfaceRegion[];
  buildingFootprints: Level0BuildingFootprint[];
  entrances: Level0Entrance[];
  droneRegions: Level0DroneRegion[];
  anchors: Level0Anchor[];
  occluders: WorldPolygon[];
  semanticMaskIds: string[];
  artLayerIds: string[];
}
