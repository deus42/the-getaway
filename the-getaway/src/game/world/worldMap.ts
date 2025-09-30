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

// NYC-inspired grid: Avenues (vertical, 3 tiles wide) and Streets (horizontal, 2 tiles wide)
const isAvenue = (x: number) => {
  // Avenues at x=24-26, x=60-62, x=96-98, x=132-134 (3 tiles wide)
  return (x >= 24 && x <= 26) || (x >= 60 && x <= 62) ||
         (x >= 96 && x <= 98) || (x >= 132 && x <= 134);
};

const isStreet = (y: number) => {
  // Streets at y=20-21, y=44-45, y=68-69, y=92-93 (2 tiles wide)
  return (y >= 20 && y <= 21) || (y >= 44 && y <= 45) ||
         (y >= 68 && y <= 69) || (y >= 92 && y <= 93);
};

const isCityBoulevard = (x: number, y: number) => isAvenue(x) || isStreet(y);


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
    const { from, to } = building.footprint;

    for (let y = from.y; y <= to.y; y++) {
      for (let x = from.x; x <= to.x; x++) {
        const tile = hostArea.tiles[y]?.[x];

        if (!tile) {
          continue;
        }

        if (tile.type === TileType.DOOR) {
          tile.type = TileType.WALL;
          tile.isWalkable = false;
        }
      }
    }

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
