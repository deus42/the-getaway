import { findPath } from '../game/world/pathfinding';
import { MapArea, TileType, Position } from '../game/interfaces/types';

const createMapArea = (width: number, height: number): MapArea => {
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

describe('findPath', () => {
  it('avoids blocked positions when computing routes', () => {
    const area = createMapArea(5, 5);
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 4, y: 0 };

    const freePath = findPath(start, goal, area);
    expect(freePath.length).toBeGreaterThan(0);
    expect(freePath[freePath.length - 1]).toEqual(goal);

    const blockedPath = findPath(start, goal, area, {
      blockedPositions: [{ x: 3, y: 0 }, { x: 4, y: 0 }],
    });
    expect(blockedPath.length).toBeGreaterThan(0);
    const intermediateSteps = blockedPath.slice(0, -1);
    expect(intermediateSteps.every((step) => step.x !== 3 || step.y !== 0)).toBe(true);
    expect(blockedPath[blockedPath.length - 1]).toEqual(goal);
  });

  it('keeps deterministic ordering for diagonal-capable routes', () => {
    const area = createMapArea(6, 6);
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 4, y: 4 };

    const first = findPath(start, goal, area, { allowDiagonals: true });
    const second = findPath(start, goal, area, { allowDiagonals: true });

    expect(first).toEqual(second);
    expect(first[first.length - 1]).toEqual(goal);
  });
});
