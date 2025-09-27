import { MapArea, MapTile, Position, TileType, Player, Enemy } from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';

// Constants for grid creation
export const DEFAULT_GRID_SIZE = 10;
export const DEFAULT_TILE_SIZE = 64; // pixels

// Create an empty grid
export const createEmptyGrid = (width: number, height: number): MapTile[][] => {
  const grid: MapTile[][] = [];
  
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = {
        type: TileType.FLOOR,
        position: { x, y },
        isWalkable: true,
        provideCover: false
      };
    }
  }
  
  return grid;
};

// Create a basic map area with walls around the edges
export const createBasicMapArea = (
  name: string,
  width: number = DEFAULT_GRID_SIZE,
  height: number = DEFAULT_GRID_SIZE,
  options: { level?: number; objectives?: string[] } = {}
): MapArea => {
  const grid = createEmptyGrid(width, height);
  
  // Add walls around the edges
  for (let x = 0; x < width; x++) {
    grid[0][x].type = TileType.WALL;
    grid[0][x].isWalkable = false;
    
    grid[height - 1][x].type = TileType.WALL;
    grid[height - 1][x].isWalkable = false;
  }
  
  for (let y = 0; y < height; y++) {
    grid[y][0].type = TileType.WALL;
    grid[y][0].isWalkable = false;
    
    grid[y][width - 1].type = TileType.WALL;
    grid[y][width - 1].isWalkable = false;
  }
  
  return {
    id: uuidv4(),
    name,
    level: options.level ?? 0,
    objectives: options.objectives ?? [],
    width,
    height,
    tiles: grid,
    entities: {
      enemies: [],
      npcs: [],
      items: []
    }
  };
};

// Add walls to a map area
export const addWalls = (mapArea: MapArea, wallPositions: Position[]): MapArea => {
  const updatedGrid = [...mapArea.tiles];
  
  for (const pos of wallPositions) {
    if (
      pos.y >= 0 && pos.y < mapArea.height &&
      pos.x >= 0 && pos.x < mapArea.width
    ) {
      updatedGrid[pos.y][pos.x] = {
        ...updatedGrid[pos.y][pos.x],
        type: TileType.WALL,
        isWalkable: false
      };
    }
  }
  
  return {
    ...mapArea,
    tiles: updatedGrid
  };
};

// Add cover to a map area
export const addCover = (mapArea: MapArea, coverPositions: Position[]): MapArea => {
  const updatedGrid = [...mapArea.tiles];
  
  for (const pos of coverPositions) {
    if (
      pos.y >= 0 && pos.y < mapArea.height &&
      pos.x >= 0 && pos.x < mapArea.width
    ) {
      updatedGrid[pos.y][pos.x] = {
        ...updatedGrid[pos.y][pos.x],
        type: TileType.COVER,
        provideCover: true,
        isWalkable: true,
      };
    }
  }
  
  return {
    ...mapArea,
    tiles: updatedGrid
  };
};

// Check if a position is within grid bounds
export const isPositionInBounds = (position: Position, mapArea: MapArea): boolean => {
  return (
    position.x >= 0 && position.x < mapArea.width &&
    position.y >= 0 && position.y < mapArea.height
  );
};

// Check if a position is walkable (considers bounds, tile type, and entities)
export const isPositionWalkable = (
  position: Position,
  mapArea: MapArea,
  player?: Player,
  enemies: Enemy[] = []
): boolean => {
  // 1. Check bounds
  if (!isPositionInBounds(position, mapArea)) {
    return false;
  }
  
  // 2. Check tile walkability
  if (!mapArea.tiles[position.y][position.x].isWalkable) {
    return false;
  }

  // 3. Check if player is at the target position
  if (
    player &&
    player.position.x === position.x &&
    player.position.y === position.y
  ) {
    return false;
  }

  // 4. Check if any enemy is at the target position
  if (
    enemies.some(
      (enemy) => enemy.position.x === position.x && enemy.position.y === position.y
    )
  ) {
    return false;
  }
  
  // If all checks pass, the position is walkable
  return true;
};

// Get all walkable positions adjacent to a position
export const getAdjacentWalkablePositions = (
  position: Position,
  mapArea: MapArea,
  player?: Player,
  enemies: Enemy[] = []
): Position[] => {
  const adjacentPositions = [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 }
  ];
  
  // Filter using the updated isPositionWalkable
  return adjacentPositions.filter((pos) =>
    isPositionWalkable(pos, mapArea, player, enemies)
  );
};

// Get positions that provide cover
export const getCoverPositions = (mapArea: MapArea): Position[] => {
  const coverPositions: Position[] = [];
  
  for (let y = 0; y < mapArea.height; y++) {
    for (let x = 0; x < mapArea.width; x++) {
      if (mapArea.tiles[y][x].provideCover) {
        coverPositions.push({ x, y });
      }
    }
  }
  
  return coverPositions;
};

// Get wall positions (obstacles)
export const getWallPositions = (mapArea: MapArea): Position[] => {
  const wallPositions: Position[] = [];
  
  for (let y = 0; y < mapArea.height; y++) {
    for (let x = 0; x < mapArea.width; x++) {
      if (mapArea.tiles[y][x].type === TileType.WALL) {
        wallPositions.push({ x, y });
      }
    }
  }
  
  return wallPositions;
};

export const findNearestWalkablePosition = (
  start: Position,
  mapArea: MapArea,
  player?: Player,
  enemies: Enemy[] = []
): Position | null => {
  if (isPositionWalkable(start, mapArea, player, enemies)) {
    return start;
  }

  const visited = new Set<string>();
  const queue: Position[] = [start];

  const serialize = (position: Position) => `${position.x},${position.y}`;
  visited.add(serialize(start));

  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    for (const direction of directions) {
      const next: Position = {
        x: current.x + direction.x,
        y: current.y + direction.y,
      };

      const key = serialize(next);
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      if (!isPositionInBounds(next, mapArea)) {
        continue;
      }

      if (isPositionWalkable(next, mapArea, player, enemies)) {
        return next;
      }

      queue.push(next);
    }
  }

  return null;
};

// Convert grid position to pixel position (for rendering)
export const gridToPixel = (position: Position, tileSize: number = DEFAULT_TILE_SIZE): Position => {
  return {
    x: position.x * tileSize,
    y: position.y * tileSize
  };
};

// Convert pixel position to grid position (for input handling)
export const pixelToGrid = (position: Position, tileSize: number = DEFAULT_TILE_SIZE): Position => {
  return {
    x: Math.floor(position.x / tileSize),
    y: Math.floor(position.y / tileSize)
  };
};

export const createTestMapArea = (
  name: string = "Test Area",
  width: number = DEFAULT_GRID_SIZE,
  height: number = DEFAULT_GRID_SIZE
): MapArea => {
  // Start with a basic map area (walls around the edges)
  const mapArea = createBasicMapArea(name, width, height);
  
  // Add internal walls in a maze-like pattern
  const wallPositions: Position[] = [
    // Vertical wall in the middle with a gap
    { x: 5, y: 2 },
    { x: 5, y: 3 },
    { x: 5, y: 4 },
    // Skip y=5 to create a doorway
    { x: 5, y: 6 },
    { x: 5, y: 7 },
    
    // Horizontal wall with a gap
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    // Skip x=5 (already part of vertical wall)
    { x: 6, y: 3 },
    { x: 7, y: 3 },
    
    // Wall in top-left corner
    { x: 2, y: 2 },
    
    // Wall in bottom-right corner
    { x: 7, y: 7 },
    { x: 8, y: 7 },
    { x: 7, y: 8 },
  ];
  
  // Add cover elements
  const coverPositions: Position[] = [
    { x: 3, y: 5 },
    { x: 7, y: 2 },
    { x: 2, y: 7 },
    { x: 8, y: 5 }
  ];
  
  // Add walls and cover to the map
  let updatedMapArea = addWalls(mapArea, wallPositions);
  updatedMapArea = addCover(updatedMapArea, coverPositions);
  
  return updatedMapArea;
};

// NEW FUNCTION: Create an open map area with edge walls and random obstacles
export const createOpenMapArea = (
  name: string,
  width: number = 20, // Default to 20x20
  height: number = 20,
  obstacleDensity: number = 0.1 // Percentage of inner floor tiles to be obstacles
): MapArea => {
  // Start with a basic map area (walls around the edges)
  const mapArea = createBasicMapArea(name, width, height);
  const innerWidth = width - 2;
  const innerHeight = height - 2;
  const numberOfObstacles = Math.floor(innerWidth * innerHeight * obstacleDensity);

  const coverPositions: Position[] = [];
  let placedObstacles = 0;

  // Keep track of placed obstacle locations to avoid duplicates
  const placedLocations = new Set<string>();

  while (placedObstacles < numberOfObstacles) {
    // Generate random coordinates within the inner area (excluding walls)
    const x = Math.floor(Math.random() * innerWidth) + 1;
    const y = Math.floor(Math.random() * innerHeight) + 1;
    const posKey = `${x},${y}`;

    // Check if it's a floor tile and not already an obstacle
    if (mapArea.tiles[y][x].type === TileType.FLOOR && !placedLocations.has(posKey)) {
      coverPositions.push({ x, y });
      placedLocations.add(posKey);
      placedObstacles++;
    }
    
    // Safety break to prevent infinite loops if density is too high / unlucky RNG
    if (placedObstacles >= innerWidth * innerHeight) break; 
  }

  // Add the cover obstacles to the map
  const updatedMapArea = addCover(mapArea, coverPositions);

  return updatedMapArea;
}; 
