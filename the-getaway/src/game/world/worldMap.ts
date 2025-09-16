import { MapArea, Position, TileType } from '../interfaces/types';
import { createBasicMapArea, addWalls } from './grid';

export interface MapConnection {
  fromAreaId: string;
  fromPosition: Position;
  toAreaId: string;
  toPosition: Position;
}

const createSlumsArea = (): MapArea => {
  const area = createBasicMapArea('Slums', 20, 20);
  const walls: Position[] = [];

  for (let x = 4; x <= 6; x++) {
    for (let y = 4; y <= 8; y++) {
      walls.push({ x, y });
    }
  }

  for (let x = 12; x <= 15; x++) {
    for (let y = 10; y <= 13; y++) {
      walls.push({ x, y });
    }
  }

  const withWalls = addWalls(area, walls);
  // Door to Downtown on the east edge
  const door = withWalls.tiles[10][19];
  door.type = TileType.DOOR;
  door.isWalkable = true;
  return withWalls;
};

const createDowntownArea = (): MapArea => {
  const area = createBasicMapArea('Downtown', 20, 20);
  const walls: Position[] = [];

  for (let x = 5; x <= 8; x++) {
    for (let y = 5; y <= 7; y++) {
      walls.push({ x, y });
    }
  }

  for (let x = 14; x <= 17; x++) {
    for (let y = 2; y <= 5; y++) {
      walls.push({ x, y });
    }
  }

  const withWalls = addWalls(area, walls);
  // Door to Slums on the west edge
  const door = withWalls.tiles[10][0];
  door.type = TileType.DOOR;
  door.isWalkable = true;
  return withWalls;
};

export const slumsArea = createSlumsArea();
export const downtownArea = createDowntownArea();

export const mapAreas: Record<string, MapArea> = {
  [slumsArea.id]: slumsArea,
  [downtownArea.id]: downtownArea,
};

export const mapConnections: MapConnection[] = [
  {
    fromAreaId: slumsArea.id,
    fromPosition: { x: 19, y: 10 },
    toAreaId: downtownArea.id,
    toPosition: { x: 1, y: 10 },
  },
  {
    fromAreaId: downtownArea.id,
    fromPosition: { x: 0, y: 10 },
    toAreaId: slumsArea.id,
    toPosition: { x: 18, y: 10 },
  },
];

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
