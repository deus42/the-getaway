import { Position, MapArea, Player, Enemy } from '../interfaces/types';
import { isPositionWalkable } from './grid';

interface FindPathOptions {
  allowDiagonals?: boolean;
  player?: Player;
  enemies?: Enemy[];
}

const serialize = (position: Position): string => `${position.x},${position.y}`;

export const findPath = (
  start: Position,
  goal: Position,
  mapArea: MapArea,
  options: FindPathOptions = {}
): Position[] => {
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  const directions = options.allowDiagonals
    ? [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
      ]
    : [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];

  const visited = new Set<string>();
  const queue: Array<{ position: Position; path: Position[] }> = [
    { position: start, path: [] },
  ];

  visited.add(serialize(start));

  const { player, enemies = [] } = options;

  const inBounds = (pos: Position) =>
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x < mapArea.width &&
    pos.y < mapArea.height;

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    for (const offset of directions) {
      const next: Position = {
        x: current.position.x + offset.x,
        y: current.position.y + offset.y,
      };

      if (!inBounds(next)) {
        continue;
      }

      const key = serialize(next);

      if (visited.has(key)) {
        continue;
      }

      const isGoal = next.x === goal.x && next.y === goal.y;
      const tile = mapArea.tiles[next.y][next.x];

      if (!tile || !tile.isWalkable) {
        continue;
      }

      if (!isGoal) {
        if (!isPositionWalkable(next, mapArea, player, enemies)) {
          continue;
        }
      } else {
        // For the target tile we still want to prevent landing on enemies
        const occupiedByEnemy = enemies.some(
          (enemy) => enemy.position.x === next.x && enemy.position.y === next.y
        );

        if (occupiedByEnemy) {
          continue;
        }
      }

      const pathToNext = [...current.path, next];

      if (isGoal) {
        return pathToNext;
      }

      visited.add(key);
      queue.push({ position: next, path: pathToNext });
    }
  }

  return [];
};
