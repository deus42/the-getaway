import { MapArea, MapTile, Position, TileType } from '../interfaces/types';
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
  height: number = DEFAULT_GRID_SIZE
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
        provideCover: true
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

// Check if a position is walkable
export const isPositionWalkable = (position: Position, mapArea: MapArea): boolean => {
  if (!isPositionInBounds(position, mapArea)) {
    return false;
  }
  
  return mapArea.tiles[position.y][position.x].isWalkable;
};

// Get all walkable positions adjacent to a position
export const getAdjacentWalkablePositions = (position: Position, mapArea: MapArea): Position[] => {
  const adjacentPositions = [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 }
  ];
  
  return adjacentPositions.filter(pos => isPositionWalkable(pos, mapArea));
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