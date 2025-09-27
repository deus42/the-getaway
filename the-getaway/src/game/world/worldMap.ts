import { v4 as uuidv4 } from 'uuid';
import { MapArea, Position, TileType, NPC, Item } from '../interfaces/types';
import {
  createBasicMapArea,
  addWalls,
  addCover,
  findNearestWalkablePosition,
  getAdjacentWalkablePositions,
} from './grid';

interface BuildingDefinition {
  id: string;
  name: string;
  footprint: { from: Position; to: Position };
  door: Position;
  interior: { width: number; height: number };
}

interface GeneratedArea {
  area: MapArea;
  connections: MapConnection[];
  interiorAreas: MapArea[];
}

interface InteriorSpec {
  area: MapArea;
  entryPosition: Position;
  doorPosition: Position;
}

export interface MapConnection {
  fromAreaId: string;
  fromPosition: Position;
  toAreaId: string;
  toPosition: Position;
}

const DOWNTOWN_WIDTH = 144;
const DOWNTOWN_HEIGHT = 108;

const SLUMS_COVER_SPOTS: Position[] = [
  { x: 12, y: 20 },
  { x: 18, y: 14 },
  { x: 24, y: 24 },
  { x: 28, y: 30 },
  { x: 34, y: 22 },
  { x: 40, y: 28 },
  { x: 8, y: 24 },
  { x: 14, y: 32 },
  { x: 22, y: 8 },
  { x: 30, y: 10 },
  { x: 44, y: 24 },
  { x: 48, y: 32 },
  { x: 36, y: 12 },
  { x: 50, y: 18 },
  { x: 18, y: 34 },
  { x: 10, y: 12 },
];

const DOWNTOWN_COVER_SPOTS: Position[] = [
  { x: 12, y: 18 },
  { x: 20, y: 20 },
  { x: 42, y: 18 },
  { x: 52, y: 20 },
  { x: 74, y: 18 },
  { x: 84, y: 20 },
  { x: 106, y: 18 },
  { x: 118, y: 20 },
  { x: 14, y: 40 },
  { x: 22, y: 44 },
  { x: 44, y: 38 },
  { x: 56, y: 44 },
  { x: 76, y: 40 },
  { x: 88, y: 44 },
  { x: 108, y: 38 },
  { x: 120, y: 44 },
  { x: 16, y: 68 },
  { x: 26, y: 70 },
  { x: 46, y: 66 },
  { x: 58, y: 68 },
  { x: 80, y: 66 },
  { x: 92, y: 68 },
  { x: 112, y: 66 },
  { x: 124, y: 68 },
  { x: 18, y: 94 },
  { x: 30, y: 96 },
  { x: 48, y: 94 },
  { x: 62, y: 92 },
  { x: 82, y: 94 },
  { x: 100, y: 92 },
  { x: 116, y: 96 },
  { x: 132, y: 94 },
];

const CITY_COVER_SPOTS: Position[] = [
  ...SLUMS_COVER_SPOTS,
  ...DOWNTOWN_COVER_SPOTS,
];

const SLUMS_BUILDINGS: BuildingDefinition[] = [
  {
    id: 'slums_tenement',
    name: 'Riverside Tenement',
    footprint: { from: { x: 4, y: 6 }, to: { x: 12, y: 16 } },
    door: { x: 8, y: 16 },
    interior: { width: 12, height: 8 },
  },
  {
    id: 'slums_storage',
    name: 'Delta Storage Yard',
    footprint: { from: { x: 6, y: 24 }, to: { x: 14, y: 34 } },
    door: { x: 10, y: 24 },
    interior: { width: 10, height: 8 },
  },
  {
    id: 'slums_workshop',
    name: 'Ordnance Workshops',
    footprint: { from: { x: 20, y: 6 }, to: { x: 30, y: 16 } },
    door: { x: 25, y: 6 },
    interior: { width: 12, height: 8 },
  },
  {
    id: 'slums_terraces',
    name: 'Stacked Terraces',
    footprint: { from: { x: 22, y: 26 }, to: { x: 34, y: 36 } },
    door: { x: 28, y: 26 },
    interior: { width: 12, height: 10 },
  },
  {
    id: 'slums_market',
    name: 'Night Market Canopy',
    footprint: { from: { x: 36, y: 10 }, to: { x: 40, y: 20 } },
    door: { x: 38, y: 20 },
    interior: { width: 8, height: 6 },
  },
  {
    id: 'slums_depot',
    name: 'Depot Barracks',
    footprint: { from: { x: 42, y: 24 }, to: { x: 52, y: 34 } },
    door: { x: 47, y: 24 },
    interior: { width: 14, height: 10 },
  },
];

const DOWNTOWN_BUILDINGS: BuildingDefinition[] = [
  {
    id: 'downtown_arcology',
    name: 'Arcology Spires',
    footprint: { from: { x: 6, y: 6 }, to: { x: 30, y: 22 } },
    door: { x: 18, y: 26 },
    interior: { width: 18, height: 10 },
  },
  {
    id: 'downtown_exchange',
    name: 'Grand Exchange',
    footprint: { from: { x: 40, y: 8 }, to: { x: 66, y: 22 } },
    door: { x: 54, y: 26 },
    interior: { width: 20, height: 10 },
  },
  {
    id: 'downtown_conclave',
    name: 'Magistrate Conclave',
    footprint: { from: { x: 76, y: 8 }, to: { x: 102, y: 22 } },
    door: { x: 90, y: 26 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_embassy',
    name: 'Embassy Row',
    footprint: { from: { x: 112, y: 8 }, to: { x: 138, y: 22 } },
    door: { x: 126, y: 26 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_archives',
    name: 'Civic Archives',
    footprint: { from: { x: 6, y: 32 }, to: { x: 30, y: 48 } },
    door: { x: 18, y: 56 },
    interior: { width: 16, height: 10 },
  },
  {
    id: 'downtown_transit',
    name: 'Transit Nexus',
    footprint: { from: { x: 40, y: 32 }, to: { x: 66, y: 48 } },
    door: { x: 54, y: 56 },
    interior: { width: 20, height: 12 },
  },
  {
    id: 'downtown_research',
    name: 'Research Core',
    footprint: { from: { x: 76, y: 32 }, to: { x: 102, y: 48 } },
    door: { x: 90, y: 56 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_embassy_plaza',
    name: 'Embassy Plaza',
    footprint: { from: { x: 112, y: 32 }, to: { x: 138, y: 48 } },
    door: { x: 126, y: 56 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_residential',
    name: 'Residential Terraces',
    footprint: { from: { x: 6, y: 60 }, to: { x: 30, y: 78 } },
    door: { x: 18, y: 86 },
    interior: { width: 16, height: 12 },
  },
  {
    id: 'downtown_citadel',
    name: 'Security Citadel',
    footprint: { from: { x: 40, y: 60 }, to: { x: 66, y: 78 } },
    door: { x: 54, y: 86 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_biotech_garden',
    name: 'Biotech Gardens',
    footprint: { from: { x: 76, y: 60 }, to: { x: 102, y: 78 } },
    door: { x: 90, y: 86 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_aerial_port',
    name: 'Aerostat Port',
    footprint: { from: { x: 112, y: 60 }, to: { x: 138, y: 78 } },
    door: { x: 126, y: 86 },
    interior: { width: 18, height: 12 },
  },
  {
    id: 'downtown_theatre',
    name: 'Holo Theatre',
    footprint: { from: { x: 6, y: 84 }, to: { x: 34, y: 102 } },
    door: { x: 18, y: 86 },
    interior: { width: 16, height: 10 },
  },
  {
    id: 'downtown_barracks',
    name: 'Sentry Barracks',
    footprint: { from: { x: 40, y: 84 }, to: { x: 70, y: 102 } },
    door: { x: 54, y: 86 },
    interior: { width: 16, height: 10 },
  },
  {
    id: 'downtown_logistics',
    name: 'Harbor Logistics',
    footprint: { from: { x: 76, y: 84 }, to: { x: 106, y: 102 } },
    door: { x: 90, y: 86 },
    interior: { width: 18, height: 10 },
  },
  {
    id: 'downtown_solar_farm',
    name: 'Solar Farm Annex',
    footprint: { from: { x: 112, y: 84 }, to: { x: 138, y: 102 } },
    door: { x: 126, y: 86 },
    interior: { width: 14, height: 10 },
  },
];

const SLUMS_NPC_BLUEPRINTS: Array<Omit<NPC, 'id'>> = [
  {
    name: 'Lira the Smuggler',
    position: { x: 26, y: 20 },
    health: 12,
    maxHealth: 12,
    routine: [
      { position: { x: 26, y: 20 }, timeOfDay: 'day', duration: 240 },
      { position: { x: 30, y: 26 }, timeOfDay: 'evening', duration: 240 },
      { position: { x: 22, y: 19 }, timeOfDay: 'night', duration: 240 },
    ],
    dialogueId: 'npc_lira_vendor',
    isInteractive: true,
  },
  {
    name: 'Orn Patrol Sentry',
    position: { x: 46, y: 28 },
    health: 20,
    maxHealth: 20,
    routine: [
      { position: { x: 46, y: 28 }, timeOfDay: 'day', duration: 180 },
      { position: { x: 50, y: 20 }, timeOfDay: 'evening', duration: 180 },
      { position: { x: 40, y: 34 }, timeOfDay: 'night', duration: 180 },
    ],
    dialogueId: 'npc_guard_orn',
    isInteractive: false,
  },
];

const SLUMS_ITEM_BLUEPRINTS: Array<Omit<Item, 'id'>> = [
  {
    name: 'Abandoned Medkit',
    description: 'A half-stocked medkit tucked beside a market stall.',
    weight: 2,
    value: 40,
    isQuestItem: false,
  },
  {
    name: 'Encrypted Datapad',
    description: 'Contains black market manifests guarded by Lira.',
    weight: 1,
    value: 150,
    isQuestItem: true,
  },
];

const DOWNTOWN_NPC_BLUEPRINTS: Array<Omit<NPC, 'id'>> = [
  {
    name: 'Archivist Naila',
    position: { x: 28, y: 14 },
    health: 14,
    maxHealth: 14,
    routine: [
      { position: { x: 28, y: 14 }, timeOfDay: 'day', duration: 300 },
      { position: { x: 32, y: 24 }, timeOfDay: 'evening', duration: 300 },
    ],
    dialogueId: 'npc_archivist_naila',
    isInteractive: true,
  },
  {
    name: 'Courier Brant',
    position: { x: 14, y: 24 },
    health: 16,
    maxHealth: 16,
    routine: [
      { position: { x: 14, y: 24 }, timeOfDay: 'day', duration: 180 },
      { position: { x: 10, y: 16 }, timeOfDay: 'evening', duration: 180 },
      { position: { x: 34, y: 16 }, timeOfDay: 'night', duration: 180 },
    ],
    dialogueId: 'npc_courier_brant',
    isInteractive: true,
  },
];

const DOWNTOWN_ITEM_BLUEPRINTS: Array<Omit<Item, 'id'>> = [
  {
    name: 'Corporate Keycard',
    description: 'Security clearance stolen from a tower executive.',
    weight: 0.2,
    value: 200,
    isQuestItem: true,
  },
  {
    name: 'Transit Tokens',
    description: 'Old metro tokens. Some merchants still barter for them.',
    weight: 0.5,
    value: 30,
    isQuestItem: false,
  },
];

const CITY_BUILDINGS: BuildingDefinition[] = [
  ...SLUMS_BUILDINGS,
  ...DOWNTOWN_BUILDINGS,
];

const CITY_NPC_BLUEPRINTS: Array<Omit<NPC, 'id'>> = [
  ...SLUMS_NPC_BLUEPRINTS,
  ...DOWNTOWN_NPC_BLUEPRINTS,
];

const CITY_ITEM_BLUEPRINTS: Array<Omit<Item, 'id'>> = [
  ...SLUMS_ITEM_BLUEPRINTS,
  ...DOWNTOWN_ITEM_BLUEPRINTS,
];

const createInteriorArea = (name: string, width: number, height: number, level: number): InteriorSpec => {
  const interior = createBasicMapArea(name, width, height, {
    level,
    isInterior: true,
  });
  const doorPosition: Position = { x: Math.floor(width / 2), y: height - 1 };
  const entryPosition: Position = {
    x: doorPosition.x,
    y: Math.max(1, doorPosition.y - 1),
  };

  const doorTile = interior.tiles[doorPosition.y][doorPosition.x];
  doorTile.type = TileType.DOOR;
  doorTile.isWalkable = true;

  return {
    area: interior,
    entryPosition,
    doorPosition,
  };
};

const applyBuildingConnections = (
  hostArea: MapArea,
  settlementName: string,
  buildings: BuildingDefinition[]
): { connections: MapConnection[]; interiors: MapArea[] } => {
  const connections: MapConnection[] = [];
  const interiors: MapArea[] = [];

  buildings.forEach((building) => {
    const doorTile = hostArea.tiles[building.door.y]?.[building.door.x];

    if (!doorTile) {
      return;
    }

    doorTile.type = TileType.DOOR;
    doorTile.isWalkable = true;

    const interiorSpec = createInteriorArea(
      `${settlementName} :: ${building.name}`,
      building.interior.width,
      building.interior.height,
      hostArea.level ?? 0
    );

    interiors.push(interiorSpec.area);

    connections.push({
      fromAreaId: hostArea.id,
      fromPosition: { ...building.door },
      toAreaId: interiorSpec.area.id,
      toPosition: { ...interiorSpec.entryPosition },
    });

    connections.push({
      fromAreaId: interiorSpec.area.id,
      fromPosition: { ...interiorSpec.doorPosition },
      toAreaId: hostArea.id,
      toPosition: { ...building.door },
    });
  });

  return { connections, interiors };
};

const isCityBoulevard = (x: number, y: number) =>
  y === 26 || y === 56 || y === 86 || x === 36 || x === 72 || x === 108;

const LEVEL_ZERO_OBJECTIVES = [
  'Survey the Slums perimeter and mark hostile patrols',
  'Establish contact with Lira the Smuggler',
  'Secure shelter before curfew sweeps begin',
];

const createCityArea = (): GeneratedArea => {
  const area = createBasicMapArea('Downtown', DOWNTOWN_WIDTH, DOWNTOWN_HEIGHT, {
    level: 0,
    objectives: LEVEL_ZERO_OBJECTIVES,
  });
  const walls: Position[] = [];

  const addBlock = (x1: number, y1: number, x2: number, y2: number) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (!isCityBoulevard(x, y)) {
          walls.push({ x, y });
        }
      }
    }
  };

  CITY_BUILDINGS.forEach((building) => {
    addBlock(
      building.footprint.from.x,
      building.footprint.from.y,
      building.footprint.to.x,
      building.footprint.to.y
    );
  });

  const withWalls = addWalls(area, walls);

  const coverSpotsOnWalkableTiles = CITY_COVER_SPOTS.filter((position) => {
    const tile = withWalls.tiles[position.y]?.[position.x];

    if (!tile) {
      return false;
    }

    return tile.isWalkable;
  });

  const withCover = addCover(withWalls, coverSpotsOnWalkableTiles);

  const isTileOpen = (position: Position): boolean => {
    const tile = withCover.tiles[position.y]?.[position.x];
    if (!tile) {
      return false;
    }

    return tile.isWalkable && tile.type !== TileType.DOOR && tile.type !== TileType.WALL;
  };

  const resolveOpenPosition = (seed: Position): Position | null => {
    const nearest = findNearestWalkablePosition(seed, withCover) ?? seed;

    if (isTileOpen(nearest)) {
      return nearest;
    }

    const adjacent = getAdjacentWalkablePositions(nearest, withCover);
    const fallback = adjacent.find((candidate) => isTileOpen(candidate));
    return fallback ?? null;
  };

  CITY_NPC_BLUEPRINTS.forEach((npcBlueprint) => {
    const position = resolveOpenPosition(npcBlueprint.position);

    if (!position) {
      return;
    }

    withCover.entities.npcs.push({
      ...npcBlueprint,
      id: uuidv4(),
      position,
    });
  });

  CITY_ITEM_BLUEPRINTS.forEach((itemBlueprint) => {
    withCover.entities.items.push({ ...itemBlueprint, id: uuidv4() });
  });

  const { connections, interiors } = applyBuildingConnections(
    withCover,
    'Downtown',
    CITY_BUILDINGS
  );

  interiors.forEach((interior) => {
    interior.level = interior.level ?? 0;
    interior.objectives = interior.objectives ?? [];
  });

  return {
    area: withCover,
    connections,
    interiorAreas: interiors,
  };
};

const cityResult = createCityArea();

export const slumsArea = cityResult.area;
export const downtownArea = cityResult.area;

const interiorAreas = [...cityResult.interiorAreas];

export const mapAreas: Record<string, MapArea> = interiorAreas.reduce(
  (acc, interior) => {
    acc[interior.id] = interior;
    return acc;
  },
  {
    [slumsArea.id]: slumsArea,
  } as Record<string, MapArea>
);

export const SLUMS_COVER_POSITIONS = CITY_COVER_SPOTS;

export const mapConnections: MapConnection[] = [...cityResult.connections];

export const getConnectionForPosition = (
  areaId: string,
  position: Position
): MapConnection | undefined => {
  return mapConnections.find(
    (c) =>
      c.fromAreaId === areaId &&
      c.fromPosition.x === position.x &&
      c.fromPosition.y === position.y
  );
};
