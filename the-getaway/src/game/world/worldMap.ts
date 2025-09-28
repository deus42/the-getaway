import { v4 as uuidv4 } from 'uuid';
import { MapArea, Position, TileType, NPC, Item } from '../interfaces/types';
import {
  level0SlumsCoverSpots,
  level0DowntownCoverSpots,
  level0AllCoverSpots,
  level0SlumsBuildings,
  level0DowntownBuildings,
  level0AllBuildings,
  level0SlumsNPCs,
  level0DowntownNPCs,
  level0AllNPCs,
  level0SlumsItems,
  level0DowntownItems,
  level0AllItems,
  LevelBuildingDefinition,
} from '../../content/levels/level0';
import {
  createBasicMapArea,
  addWalls,
  addCover,
  findNearestWalkablePosition,
  getAdjacentWalkablePositions,
} from './grid';

type BuildingDefinition = LevelBuildingDefinition;

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
type NPCBlueprint = Omit<NPC, 'id'>;
type ItemBlueprint = Omit<Item, 'id'>;

const clonePosition = (position: Position): Position => ({ ...position });

const cloneCoverSpots = (spots: Position[]): Position[] =>
  spots.map((spot) => clonePosition(spot));

const cloneBuildingDefinition = (building: BuildingDefinition): BuildingDefinition => ({
  ...building,
  footprint: {
    from: clonePosition(building.footprint.from),
    to: clonePosition(building.footprint.to),
  },
  door: clonePosition(building.door),
  interior: { ...building.interior },
});

const cloneNPCDefinition = (npc: NPCBlueprint): NPCBlueprint => ({
  ...npc,
  position: clonePosition(npc.position),
  routine: npc.routine.map((step) => ({
    ...step,
    position: clonePosition(step.position),
  })),
});

const cloneItemBlueprint = (item: ItemBlueprint): ItemBlueprint => ({
  ...item,
});

const SLUMS_COVER_SPOTS: Position[] = cloneCoverSpots(level0SlumsCoverSpots);
const DOWNTOWN_COVER_SPOTS: Position[] = cloneCoverSpots(level0DowntownCoverSpots);
const CITY_COVER_SPOTS: Position[] = cloneCoverSpots(level0AllCoverSpots);

const SLUMS_BUILDINGS: BuildingDefinition[] = level0SlumsBuildings.map(cloneBuildingDefinition);
const DOWNTOWN_BUILDINGS: BuildingDefinition[] = level0DowntownBuildings.map(cloneBuildingDefinition);
const CITY_BUILDINGS: BuildingDefinition[] = level0AllBuildings.map(cloneBuildingDefinition);

const SLUMS_NPC_BLUEPRINTS: NPCBlueprint[] = level0SlumsNPCs.map(cloneNPCDefinition);
const DOWNTOWN_NPC_BLUEPRINTS: NPCBlueprint[] = level0DowntownNPCs.map(cloneNPCDefinition);
const CITY_NPC_BLUEPRINTS: NPCBlueprint[] = level0AllNPCs.map(cloneNPCDefinition);

const SLUMS_ITEM_BLUEPRINTS: ItemBlueprint[] = level0SlumsItems.map(cloneItemBlueprint);
const DOWNTOWN_ITEM_BLUEPRINTS: ItemBlueprint[] = level0DowntownItems.map(cloneItemBlueprint);
const CITY_ITEM_BLUEPRINTS: ItemBlueprint[] = level0AllItems.map(cloneItemBlueprint);
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
