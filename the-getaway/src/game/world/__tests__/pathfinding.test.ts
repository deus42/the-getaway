import { describe, expect, it } from '@jest/globals';
import { performance } from 'perf_hooks';
import { findPath } from '../pathfinding';
import { MapArea, Position, TileType } from '../../interfaces/types';

const createMap = (width: number, height: number): MapArea => {
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      type: TileType.FLOOR,
      position: { x, y },
      isWalkable: true,
      provideCover: false,
    }))
  );

  return {
    id: 'test-area',
    name: 'Test Area',
    zoneId: 'test-zone',
    width,
    height,
    tiles,
    entities: {
      enemies: [],
      npcs: [],
      items: [],
    },
  };
};

const markBlocked = (area: MapArea, blocked: Position[]): void => {
  blocked.forEach(({ x, y }) => {
    const tile = area.tiles[y]?.[x];
    if (tile) {
      tile.isWalkable = false;
    }
  });
};

describe('findPath', () => {
  it('returns an empty path when start equals goal', () => {
    const area = createMap(4, 4);
    const start = { x: 1, y: 1 };
    const path = findPath(start, start, area);

    expect(path).toEqual([]);
  });

  it('returns [] when the destination is blocked', () => {
    const area = createMap(4, 4);
    const start = { x: 0, y: 0 };
    const goal = { x: 3, y: 3 };

    markBlocked(area, [goal]);

    const path = findPath(start, goal, area);
    expect(path).toEqual([]);
  });

  it('finds a route that avoids impassable tiles', () => {
    const area = createMap(5, 5);
    const start = { x: 0, y: 0 };
    const goal = { x: 4, y: 0 };

    // Block the straight corridor; path must detour
    markBlocked(area, [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);

    const path = findPath(start, goal, area);

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual(goal);
    expect(path.some((step) => step.y > 0)).toBe(true);
  });

  it('uses diagonal steps when allowed', () => {
    const area = createMap(3, 3);
    const start = { x: 0, y: 0 };
    const goal = { x: 2, y: 2 };

    const orthogonalOnly = findPath(start, goal, area, { allowDiagonals: false });
    const withDiagonals = findPath(start, goal, area, { allowDiagonals: true });

    expect(orthogonalOnly.length).toBeGreaterThan(withDiagonals.length);
    expect(withDiagonals).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
  });

  it('completes pathfinding on a 50x50 grid within 50 ms', () => {
    const area = createMap(50, 50);
    const start = { x: 0, y: 0 };
    const goal = { x: 49, y: 49 };

    const startTime = performance.now();
    const path = findPath(start, goal, area);
    const duration = performance.now() - startTime;

    expect(path.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50);
  });
});

