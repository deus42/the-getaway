import { v4 as uuidv4 } from 'uuid';
import { MapArea, Position, TileType, NPC, Item } from '../interfaces/types';
import { Locale } from '../../content/locales';
import { getLevel0Content } from '../../content/levels/level0';
import { LevelBuildingDefinition } from '../../content/levels/level0/types';
import {
  createBasicMapArea,
  addWalls,
  addCover,
  findNearestWalkablePosition,
  getAdjacentWalkablePositions,
} from './grid';

type NPCBlueprint = Omit<NPC, 'id'>;
type ItemBlueprint = Omit<Item, 'id'>;

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

const isCityBoulevard = (x: number, y: number) =>
  y === 26 || y === 56 || y === 86 || x === 36 || x === 72 || x === 108;


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
  buildings: LevelBuildingDefinition[]
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

interface BuildWorldParams {
  locale: Locale;
}

const createCityArea = (
  areaName: string,
  objectives: string[],
  buildings: LevelBuildingDefinition[],
  coverSpots: Position[],
  npcBlueprints: NPCBlueprint[],
  itemBlueprints: ItemBlueprint[]
): GeneratedArea => {
  const area = createBasicMapArea(areaName, DOWNTOWN_WIDTH, DOWNTOWN_HEIGHT, {
    level: 0,
    objectives,
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

  buildings.forEach((building) => {
    addBlock(
      building.footprint.from.x,
      building.footprint.from.y,
      building.footprint.to.x,
      building.footprint.to.y
    );
  });

  const withWalls = addWalls(area, walls);

  const coverSpotsOnWalkableTiles = coverSpots.filter((position) => {
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

  npcBlueprints.forEach((npcBlueprint) => {
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

  itemBlueprints.forEach((itemBlueprint) => {
    withCover.entities.items.push({ ...itemBlueprint, id: uuidv4() });
  });

  const { connections, interiors } = applyBuildingConnections(
    withCover,
    areaName,
    buildings
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

export interface BuiltWorldResources {
  slumsArea: MapArea;
  mapAreas: Record<string, MapArea>;
  connections: MapConnection[];
}

export const buildWorldResources = ({ locale }: BuildWorldParams): BuiltWorldResources => {
  const content = getLevel0Content(locale);

  const cityResult = createCityArea(
    content.world.areaName,
    content.world.objectives,
    content.buildingDefinitions,
    content.coverSpots.all,
    content.npcBlueprints,
    content.itemBlueprints
  );

  const slumsArea = cityResult.area;
  const interiorAreas = [...cityResult.interiorAreas];

  const mapAreas: Record<string, MapArea> = interiorAreas.reduce(
    (acc, interior) => {
      acc[interior.id] = interior;
      return acc;
    },
    {
      [slumsArea.id]: slumsArea,
    } as Record<string, MapArea>
  );

  return {
    slumsArea,
    mapAreas,
    connections: [...cityResult.connections],
  };
};
