import { 
  createEmptyGrid, 
  createBasicMapArea, 
  createTestMapArea,
  isPositionWalkable, 
  isPositionInBounds,
  getAdjacentWalkablePositions
} from '../game/world/grid';
import { Position, MapArea, TileType } from '../game/interfaces/types';

describe('Grid System', () => {
  let testMap: MapArea;
  
  beforeEach(() => {
    // Create a fresh test map for each test
    testMap = createTestMapArea('Test Map');
  });
  
  test('creates an empty grid of the correct size', () => {
    const width = 5;
    const height = 7;
    const grid = createEmptyGrid(width, height);
    
    expect(grid.length).toBe(height);
    for (let y = 0; y < height; y++) {
      expect(grid[y].length).toBe(width);
    }
  });
  
  test('creates a basic map area with walls around the edges', () => {
    const mapArea = createBasicMapArea('Basic Map', 6, 6);
    
    // Check dimensions
    expect(mapArea.width).toBe(6);
    expect(mapArea.height).toBe(6);
    
    // Check walls on top and bottom edges
    for (let x = 0; x < mapArea.width; x++) {
      expect(mapArea.tiles[0][x].type).toBe(TileType.WALL);
      expect(mapArea.tiles[0][x].isWalkable).toBe(false);
      
      expect(mapArea.tiles[mapArea.height - 1][x].type).toBe(TileType.WALL);
      expect(mapArea.tiles[mapArea.height - 1][x].isWalkable).toBe(false);
    }
    
    // Check walls on left and right edges
    for (let y = 0; y < mapArea.height; y++) {
      expect(mapArea.tiles[y][0].type).toBe(TileType.WALL);
      expect(mapArea.tiles[y][0].isWalkable).toBe(false);
      
      expect(mapArea.tiles[y][mapArea.width - 1].type).toBe(TileType.WALL);
      expect(mapArea.tiles[y][mapArea.width - 1].isWalkable).toBe(false);
    }
    
    // Check center is walkable
    expect(mapArea.tiles[2][2].type).toBe(TileType.FLOOR);
    expect(mapArea.tiles[2][2].isWalkable).toBe(true);
  });
  
  test('test map has correct internal walls and obstacles', () => {
    // Check that test map exists
    expect(testMap).toBeDefined();
    
    // Some vertical wall positions in the middle
    expect(testMap.tiles[2][5].type).toBe(TileType.WALL);
    expect(testMap.tiles[3][5].type).toBe(TileType.WALL);
    expect(testMap.tiles[4][5].type).toBe(TileType.WALL);
    
    // But position (5,5) should be a gap in the wall (floor)
    expect(testMap.tiles[5][5].type).toBe(TileType.FLOOR);
    expect(testMap.tiles[5][5].isWalkable).toBe(true);
    
    // Check for some horizontal wall positions
    expect(testMap.tiles[3][2].type).toBe(TileType.WALL);
    expect(testMap.tiles[3][3].type).toBe(TileType.WALL);
    expect(testMap.tiles[3][4].type).toBe(TileType.WALL);
    
    // Check for cover positions
    const coverPositions = [
      { x: 3, y: 5 },
      { x: 7, y: 2 },
      { x: 2, y: 7 },
      { x: 8, y: 5 }
    ];
    
    coverPositions.forEach(pos => {
      expect(testMap.tiles[pos.y][pos.x].type).toBe(TileType.COVER);
      expect(testMap.tiles[pos.y][pos.x].provideCover).toBe(true);
      expect(testMap.tiles[pos.y][pos.x].isWalkable).toBe(true); // Cover should be walkable
    });
  });
  
  test('bounds checking works correctly', () => {
    // In bounds
    expect(isPositionInBounds({ x: 5, y: 5 }, testMap)).toBe(true);
    
    // Out of bounds
    expect(isPositionInBounds({ x: -1, y: 5 }, testMap)).toBe(false);
    expect(isPositionInBounds({ x: 5, y: -1 }, testMap)).toBe(false);
    expect(isPositionInBounds({ x: testMap.width, y: 5 }, testMap)).toBe(false);
    expect(isPositionInBounds({ x: 5, y: testMap.height }, testMap)).toBe(false);
  });
  
  test('walkable checking handles walls correctly', () => {
    // Walkable floor tile
    expect(isPositionWalkable({ x: 2, y: 5 }, testMap)).toBe(true);
    
    // Wall tile
    expect(isPositionWalkable({ x: 5, y: 3 }, testMap)).toBe(false);
    
    // Cover tile (should be walkable)
    expect(isPositionWalkable({ x: 3, y: 5 }, testMap)).toBe(true);
    
    // Edge wall
    expect(isPositionWalkable({ x: 0, y: 5 }, testMap)).toBe(false);
    
    // Out of bounds
    expect(isPositionWalkable({ x: -1, y: 5 }, testMap)).toBe(false);
  });
  
  test('getAdjacentWalkablePositions returns valid positions', () => {
    const position: Position = { x: 2, y: 5 };
    const adjacentPositions = getAdjacentWalkablePositions(position, testMap);
    
    // Should have at least some adjacent walkable positions
    expect(adjacentPositions.length).toBeGreaterThan(0);
    
    // All returned positions should be walkable
    adjacentPositions.forEach(pos => {
      expect(isPositionWalkable(pos, testMap)).toBe(true);
    });
    
    // Should not include the original position
    expect(adjacentPositions.some(pos => pos.x === position.x && pos.y === position.y)).toBe(false);
    
    // Should only include positions that are one step away
    adjacentPositions.forEach(pos => {
      const dx = Math.abs(pos.x - position.x);
      const dy = Math.abs(pos.y - position.y);
      
      // Should be either horizontal or vertical neighbor (not diagonal)
      expect((dx === 1 && dy === 0) || (dx === 0 && dy === 1)).toBe(true);
    });
  });
}); 