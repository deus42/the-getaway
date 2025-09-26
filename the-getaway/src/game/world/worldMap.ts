import { v4 as uuidv4 } from 'uuid';
import { MapArea, Position, TileType, NPC, Item } from '../interfaces/types';
import { createBasicMapArea, addWalls, addCover } from './grid';

export interface MapConnection {
  fromAreaId: string;
  fromPosition: Position;
  toAreaId: string;
  toPosition: Position;
}

const SLUMS_WIDTH = 56;
const SLUMS_HEIGHT = 40;
const SLUMS_DOOR: Position = { x: SLUMS_WIDTH - 1, y: 20 };

const DOWNTOWN_WIDTH = 48;
const DOWNTOWN_HEIGHT = 32;
const DOWNTOWN_DOOR: Position = { x: 0, y: 16 };

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
  { x: 6, y: 18 },
  { x: 12, y: 24 },
  { x: 16, y: 12 },
  { x: 22, y: 26 },
  { x: 26, y: 16 },
  { x: 32, y: 20 },
  { x: 34, y: 28 },
  { x: 40, y: 22 },
  { x: 18, y: 28 },
  { x: 42, y: 16 },
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

const isSlumsAvenue = (x: number, y: number) =>
  y === 18 || y === 19 || x === 18 || x === 34 ||
  (x === 44 && y >= 12 && y <= SLUMS_HEIGHT - 4) ||
  (y === 10 && x >= 12 && x <= 40);

const createSlumsArea = (): MapArea => {
  const area = createBasicMapArea('Slums', SLUMS_WIDTH, SLUMS_HEIGHT);
  const walls: Position[] = [];

  const addBlock = (x1: number, y1: number, x2: number, y2: number) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (!isSlumsAvenue(x, y)) {
          walls.push({ x, y });
        }
      }
    }
  };

  addBlock(4, 6, 12, 16); // Tenement block
  addBlock(6, 24, 14, 34); // Storage yards
  addBlock(20, 6, 30, 16); // Workshops
  addBlock(22, 26, 34, 36); // Housing terraces
  addBlock(36, 10, 40, 20); // Market canopies
  addBlock(42, 24, 52, 34); // Guard depot near exit
  addBlock(14, 12, 16, 32); // Alley partitions
  addBlock(32, 26, 34, 34); // Narrow alleys near depot
  addBlock(24, 16, 28, 20); // Elevated walkway supports

  const withWalls = addWalls(area, walls);
  const withCover = addCover(withWalls, SLUMS_COVER_SPOTS);

  SLUMS_NPC_BLUEPRINTS.forEach((npc) => {
    withCover.entities.npcs.push({ ...npc, id: uuidv4() });
  });
  SLUMS_ITEM_BLUEPRINTS.forEach((item) => {
    withCover.entities.items.push({ ...item, id: uuidv4() });
  });

  const door = withCover.tiles[SLUMS_DOOR.y][SLUMS_DOOR.x];
  door.type = TileType.DOOR;
  door.isWalkable = true;
  return withCover;
};

const isDowntownBoulevard = (x: number, y: number) =>
  y === 15 || y === 16 || x === 22 || x === 36;

const createDowntownArea = (): MapArea => {
  const area = createBasicMapArea('Downtown', DOWNTOWN_WIDTH, DOWNTOWN_HEIGHT);
  const walls: Position[] = [];

  const addBlock = (x1: number, y1: number, x2: number, y2: number) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (!isDowntownBoulevard(x, y)) {
          walls.push({ x, y });
        }
      }
    }
  };

  addBlock(6, 6, 16, 14); // Housing towers
  addBlock(26, 6, 34, 14); // Plaza shops
  addBlock(38, 6, 44, 14); // Admin complex
  addBlock(8, 22, 16, 30); // Transit hub
  addBlock(26, 22, 36, 30); // Corporate campus
  addBlock(38, 22, 44, 28); // Guard staging
  addBlock(18, 10, 20, 28); // Skybridge pylons

  const withWalls = addWalls(area, walls);
  const withCover = addCover(withWalls, DOWNTOWN_COVER_SPOTS);

  DOWNTOWN_NPC_BLUEPRINTS.forEach((npc) => {
    withCover.entities.npcs.push({ ...npc, id: uuidv4() });
  });
  DOWNTOWN_ITEM_BLUEPRINTS.forEach((item) => {
    withCover.entities.items.push({ ...item, id: uuidv4() });
  });

  const door = withCover.tiles[DOWNTOWN_DOOR.y][DOWNTOWN_DOOR.x];
  door.type = TileType.DOOR;
  door.isWalkable = true;
  return withCover;
};

export const slumsArea = createSlumsArea();
export const downtownArea = createDowntownArea();

export const mapAreas: Record<string, MapArea> = {
  [slumsArea.id]: slumsArea,
  [downtownArea.id]: downtownArea,
};

export const SLUMS_COVER_POSITIONS = SLUMS_COVER_SPOTS;

export const mapConnections: MapConnection[] = [
  {
    fromAreaId: slumsArea.id,
    fromPosition: SLUMS_DOOR,
    toAreaId: downtownArea.id,
    toPosition: { x: DOWNTOWN_DOOR.x + 1, y: DOWNTOWN_DOOR.y },
  },
  {
    fromAreaId: downtownArea.id,
    fromPosition: DOWNTOWN_DOOR,
    toAreaId: slumsArea.id,
    toPosition: { x: SLUMS_DOOR.x - 1, y: SLUMS_DOOR.y },
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
