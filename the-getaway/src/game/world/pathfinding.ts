import { Position, MapArea, Player, Enemy, NPC } from '../interfaces/types';
import { isPositionWalkable } from './grid';

interface FindPathOptions {
  allowDiagonals?: boolean;
  player?: Player;
  enemies?: Enemy[];
  blockedPositions?: Position[];
  npcs?: NPC[];
  ignoreNpcIds?: string[];
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

  const {
    player,
    enemies = [],
    blockedPositions = [],
    npcs = [],
    ignoreNpcIds = [],
  } = options;

  const blockedSet = new Set(blockedPositions.map(serialize));

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
        if (blockedSet.has(key)) {
          continue;
        }
        if (
          !isPositionWalkable(next, mapArea, player, enemies, {
            npcs,
            ignoreNpcIds,
          })
        ) {
          continue;
        }
      } else {
        // For the target tile we still want to prevent landing on enemies, NPCs, or player
        const occupiedByPlayer = player
          ? player.position.x === next.x && player.position.y === next.y
          : false;

        const occupiedByEnemy = enemies.some(
          (enemy) => enemy.position.x === next.x && enemy.position.y === next.y
        );

        const occupiedByNpc = npcs.some(
          (npc) =>
            !ignoreNpcIds.includes(npc.id) &&
            npc.position.x === next.x &&
            npc.position.y === next.y
        );

        if (occupiedByPlayer || occupiedByEnemy || occupiedByNpc) {
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
