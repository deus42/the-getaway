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

interface OpenNode {
  position: Position;
  parentKey: string | null;
  direction: { x: number; y: number } | null;
  g: number;
  h: number;
  f: number;
  turnPenalty: number;
}

export const findPath = (
  start: Position,
  goal: Position,
  mapArea: MapArea,
  options: FindPathOptions = {}
): Position[] => {
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  const allowDiagonals = options.allowDiagonals === true;
  const directions = allowDiagonals
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

  const heuristic = (from: Position): number => {
    const dx = Math.abs(goal.x - from.x);
    const dy = Math.abs(goal.y - from.y);
    return allowDiagonals ? Math.max(dx, dy) : dx + dy;
  };

  const compareNodes = (left: OpenNode, right: OpenNode): number => {
    if (left.f !== right.f) {
      return left.f - right.f;
    }

    if (left.h !== right.h) {
      return left.h - right.h;
    }

    if (left.turnPenalty !== right.turnPenalty) {
      return left.turnPenalty - right.turnPenalty;
    }

    if (left.position.y !== right.position.y) {
      return left.position.y - right.position.y;
    }

    return left.position.x - right.position.x;
  };

  const startKey = serialize(start);
  const goalKey = serialize(goal);
  const open = new Map<string, OpenNode>();
  const closed = new Set<string>();
  const nodeByKey = new Map<string, OpenNode>();

  const startNode: OpenNode = {
    position: start,
    parentKey: null,
    direction: null,
    g: 0,
    h: heuristic(start),
    f: heuristic(start),
    turnPenalty: 0,
  };
  open.set(startKey, startNode);
  nodeByKey.set(startKey, startNode);

  const reconstructPath = (): Position[] => {
    const path: Position[] = [];
    let cursorKey = goalKey;

    while (cursorKey !== startKey) {
      const node = nodeByKey.get(cursorKey);
      if (!node) {
        return [];
      }
      path.push(node.position);
      if (!node.parentKey) {
        return [];
      }
      cursorKey = node.parentKey;
    }

    return path.reverse();
  };

  const pickBestOpenNode = (): OpenNode | null => {
    let best: OpenNode | null = null;
    open.forEach((node) => {
      if (!best || compareNodes(node, best) < 0) {
        best = node;
      }
    });
    return best;
  };

  while (open.size > 0) {
    const current = pickBestOpenNode();
    if (!current) {
      break;
    }

    const currentKey = serialize(current.position);
    open.delete(currentKey);
    closed.add(currentKey);

    if (currentKey === goalKey) {
      return reconstructPath();
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

      if (closed.has(key)) {
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

      const moveDirection = { x: offset.x, y: offset.y };
      const turnPenalty =
        current.direction &&
        (current.direction.x !== moveDirection.x || current.direction.y !== moveDirection.y)
          ? 0.001
          : 0;

      const tentativeG = current.g + 1;
      const tentativeH = heuristic(next);
      const tentativeF = tentativeG + tentativeH + turnPenalty;
      const existing = open.get(key);

      if (existing && tentativeG > existing.g) {
        continue;
      }

      if (
        existing &&
        tentativeG === existing.g &&
        compareNodes(
          {
            ...existing,
            parentKey: currentKey,
            direction: moveDirection,
            g: tentativeG,
            h: tentativeH,
            f: tentativeF,
            turnPenalty,
          },
          existing
        ) >= 0
      ) {
        continue;
      }

      const nextNode: OpenNode = {
        position: next,
        parentKey: currentKey,
        direction: moveDirection,
        g: tentativeG,
        h: tentativeH,
        f: tentativeF,
        turnPenalty,
      };
      open.set(key, nextNode);
      nodeByKey.set(key, nextNode);
    }
  }

  return [];
};
