import {
  Enemy,
  MapArea,
  NPC,
  Player,
  Position,
  AlertLevel,
  EnemyAiState,
} from '../interfaces/types';
import {
  calculateManhattanDistance,
  isInAttackRange,
  canMoveToPosition,
  executeMove,
  executeAttack,
  applyMovementOrientation,
  DEFAULT_ATTACK_COST,
} from './combatSystem';
import { findPath } from '../world/pathfinding';
import { isPositionInBounds, isPositionWalkable } from '../world/grid';
import { isPlayerVisible } from './perception';
import { createNpcFsmController } from '../ai/fsm/controller';
import {
  NpcContext,
  NpcFsmSnapshot,
  NpcFsmStepMetadata,
  NpcStateHandlers,
} from '../ai/fsm/types';
import { createNpcRng, hashString } from '../ai/fsm/random';
import {
  guardArchetypeCatalog,
  getGuardArchetype,
  GuardArchetypeDefinition,
  DEFAULT_GUARD_ARCHETYPE_ID,
} from '../../content/ai/guardArchetypes';

type EnemyActionResult = { enemy: Enemy; player: Player; action: string; isCritical?: boolean };

const computeSuppressionRatio = (enemy: Enemy): number => {
  const suppression = enemy.suppression ?? 0;
  if (suppression <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, suppression / 100));
};

const buildNpcContext = ({
  enemy,
  player,
  mapArea,
  squad,
  npcs,
  hasLineOfSight,
  now,
}: {
  enemy: Enemy;
  player: Player;
  mapArea: MapArea;
  squad: Enemy[];
  npcs: NPC[];
  hasLineOfSight: boolean;
  now: number;
}): NpcContext => ({
  enemy,
  player,
  mapArea,
  squad,
  civilians: npcs,
  hasLineOfSight,
  distanceToPlayer: calculateManhattanDistance(enemy.position, player.position),
  tookRecentDamage: enemy.health < enemy.maxHealth,
  healthRatio: enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 0,
  suppressionRatio: computeSuppressionRatio(enemy),
  alertLevel: enemy.alertLevel,
  lastKnownPlayerPosition: enemy.lastKnownPlayerPosition,
  directorIntensity: undefined,
  now,
});

const snapshotFromEnemy = (
  enemy: Enemy,
  fallbackState: EnemyAiState
): NpcFsmSnapshot => ({
  currentState: enemy.aiState ?? fallbackState,
  lastTransitionAt: enemy.aiLastTransitionAt ?? 0,
  cooldowns: enemy.aiCooldowns ?? {},
  personalitySeed: enemy.aiPersonalitySeed ?? hashString(enemy.id),
});

const applyAiSnapshotToEnemy = (
  enemy: Enemy,
  profileId: string,
  snapshot: NpcFsmSnapshot,
  metadata: NpcFsmStepMetadata
): Enemy => ({
  ...enemy,
  aiProfileId: profileId,
  aiState: snapshot.currentState,
  aiLastTransitionAt: snapshot.lastTransitionAt,
  aiCooldowns: snapshot.cooldowns,
  aiPersonalitySeed: snapshot.personalitySeed,
  aiTelemetry: {
    state: metadata.selectedState,
    previousState: metadata.previousState,
    weights: { ...metadata.weights },
    utilities: { ...metadata.utilityBreakdown },
    updatedAt: metadata.now,
  },
});

const performAttack = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  coverPositions: Position[]
): EnemyActionResult | null => {
  if (!isInAttackRange(enemy.position, player.position, enemy.attackRange)) {
    return null;
  }

  if (enemy.actionPoints < DEFAULT_ATTACK_COST) {
    return {
      enemy: { ...enemy, actionPoints: 0 },
      player,
      action: 'no_ap',
    };
  }

  const playerBehindCover = coverPositions.some(
    (cover) => cover.x === player.position.x && cover.y === player.position.y
  );

  const attackResult = executeAttack(enemy, player, {
    isBehindCover: playerBehindCover,
    mapArea,
  });

  let updatedEnemy = enemy;
  let updatedPlayer = player;

  if (attackResult.newAttacker.id === enemy.id) {
    updatedEnemy = attackResult.newAttacker as Enemy;
  }

  if (attackResult.newTarget.id === player.id) {
    updatedPlayer = attackResult.newTarget as Player;
  }

  const action = attackResult.success ? 'attack' : 'attack_missed';

  return {
    enemy: updatedEnemy,
    player: updatedPlayer,
    action,
    isCritical: attackResult.isCritical,
  };
};

const moveTowardTarget = (
  enemy: Enemy,
  target: Position,
  mapArea: MapArea,
  player: Player,
  enemies: Enemy[],
  npcs: NPC[]
): Position | null => {
  if (!isPositionInBounds(target, mapArea)) {
    return null;
  }

  const otherEnemies = enemies.filter((candidate) => candidate.id !== enemy.id);

  const path = findPath(enemy.position, target, mapArea, {
    player,
    enemies: otherEnemies,
    npcs,
  });

  if (path.length === 0) {
    return null;
  }

  return path[0];
};

const performChase = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  enemies: Enemy[],
  npcs: NPC[]
): EnemyActionResult | null => {
  const nextMove = moveTowardPlayer(enemy, player, mapArea, enemies, npcs);
  if (!nextMove) {
    return null;
  }

  const movedEnemy = executeMove(enemy, nextMove) as Enemy;
  const orientedEnemy = applyMovementOrientation(movedEnemy, enemy.position, mapArea);

  return {
    enemy: orientedEnemy,
    player,
    action: 'move',
  };
};

const performSeekCover = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  enemies: Enemy[],
  coverPositions: Position[],
  npcs: NPC[]
): EnemyActionResult | null => {
  const coverMove = seekCover(enemy, player, mapArea, enemies, coverPositions, npcs);
  if (!coverMove) {
    return null;
  }

  const movedEnemy = executeMove(enemy, coverMove) as Enemy;
  const orientedEnemy = applyMovementOrientation(movedEnemy, enemy.position, mapArea);

  return {
    enemy: orientedEnemy,
    player,
    action: 'seek_cover',
  };
};

const performSearch = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  enemies: Enemy[],
  npcs: NPC[]
): EnemyActionResult | null => {
  if (!enemy.lastKnownPlayerPosition) {
    return null;
  }

  const nextMove = moveTowardTarget(
    enemy,
    enemy.lastKnownPlayerPosition,
    mapArea,
    player,
    enemies,
    npcs
  );

  if (!nextMove) {
    return null;
  }

  const movedEnemy = executeMove(enemy, nextMove) as Enemy;
  const orientedEnemy = applyMovementOrientation(movedEnemy, enemy.position, mapArea);

  return {
    enemy: orientedEnemy,
    player,
    action: 'search',
  };
};

const performInspectNoise = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  enemies: Enemy[],
  _npcs: NPC[],
  rngSeed: string,
  personalitySeed: number
): EnemyActionResult | null => {
  const adjacentPositions = getAdjacentPositions(enemy.position);
  const otherEnemies = enemies.filter((candidate) => candidate.id !== enemy.id);
  const validMoves = adjacentPositions.filter((candidate) =>
    canMoveToPosition(enemy, candidate, mapArea, player, otherEnemies)
  );

  if (validMoves.length === 0) {
    return null;
  }

  const rng = createNpcRng(rngSeed, personalitySeed);
  const selectedIndex = Math.floor(rng.nextInRange(0, validMoves.length));
  const target = validMoves[selectedIndex] ?? validMoves[0];

  const movedEnemy = executeMove(enemy, target) as Enemy;
  const orientedEnemy = applyMovementOrientation(movedEnemy, enemy.position, mapArea);

  return {
    enemy: orientedEnemy,
    player,
    action: 'inspect_noise',
  };
};

const performIdle = (enemy: Enemy, player: Player): EnemyActionResult => ({
  enemy: {
    ...enemy,
    actionPoints: Math.max(0, enemy.actionPoints - 1),
  },
  player,
  action: 'idle',
});

const resolveActionForState = (
  state: EnemyAiState,
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  enemies: Enemy[],
  npcs: NPC[],
  coverPositions: Position[],
  metadata: NpcFsmStepMetadata
): EnemyActionResult | null => {
  switch (state) {
    case 'attack':
      return performAttack(enemy, player, mapArea, coverPositions);
    case 'chase':
      return performChase(enemy, player, mapArea, enemies, npcs);
    case 'search':
      return performSearch(enemy, player, mapArea, enemies, npcs);
    case 'inspectNoise':
      return performInspectNoise(
        enemy,
        player,
        mapArea,
        enemies,
        npcs,
        `${enemy.id}:${metadata.selectedState}:${metadata.now}`,
        hashString(enemy.id)
      );
    case 'flee':
    case 'panic':
      return performSeekCover(enemy, player, mapArea, enemies, coverPositions, npcs);
    case 'patrol':
      if ((enemy.alertLevel ?? AlertLevel.IDLE) >= AlertLevel.SUSPICIOUS) {
        return performChase(enemy, player, mapArea, enemies, npcs);
      }
      return performInspectNoise(
        enemy,
        player,
        mapArea,
        enemies,
        npcs,
        `${enemy.id}:patrol:${metadata.now}`,
        hashString(enemy.id)
      );
    case 'idle':
      return performIdle(enemy, player);
    default:
      return null;
  }
};

const fallbackAction = (
  enemy: Enemy,
  player: Player
): EnemyActionResult => ({
  enemy: {
    ...enemy,
    actionPoints: 0,
  },
  player,
  action: 'no_valid_move',
});

const ensureArchetype = (profileId?: string): GuardArchetypeDefinition => {
  if (profileId) {
    const explicit = getGuardArchetype(profileId);
    if (explicit) {
      return explicit;
    }
  }
  return (
    guardArchetypeCatalog[DEFAULT_GUARD_ARCHETYPE_ID] ?? Object.values(guardArchetypeCatalog)[0]
  );
};

export const determineEnemyMove = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  enemies: Enemy[],
  coverPositions: Position[],
  npcs: NPC[] = [],
  now: number = Date.now()
): EnemyActionResult => {
  let updatedEnemy = { ...enemy };
  let updatedPlayer = { ...player };

  if (enemy.health <= 0) {
    return {
      enemy: updatedEnemy,
      player: updatedPlayer,
      action: 'dead',
    };
  }

  if (enemy.actionPoints <= 0) {
    return {
      enemy: updatedEnemy,
      player: updatedPlayer,
      action: 'no_ap',
    };
  }

  if (isInAttackRange(enemy.position, player.position, enemy.attackRange)) {
    const immediateAttack = performAttack(enemy, updatedPlayer, mapArea, coverPositions);
    if (immediateAttack) {
      return immediateAttack;
    }
  }

  const archetype = ensureArchetype(enemy.aiProfileId);
  const snapshot = snapshotFromEnemy(enemy, archetype.fsm.initialState);
  const controller = createNpcFsmController(archetype.fsm, snapshot);

  const hasLineOfSight = isPlayerVisible(enemy, player, mapArea);
  const squad = enemies.filter((candidate) => candidate.id !== enemy.id);
  const context = buildNpcContext({
    enemy,
    player,
    mapArea,
    squad,
    npcs,
    hasLineOfSight,
    now,
  });

  let requestedState: EnemyAiState | null = null;
  const handlers: NpcStateHandlers = {
    idle: () => {
      requestedState = 'idle';
    },
    patrol: () => {
      requestedState = 'patrol';
    },
    chase: () => {
      requestedState = 'chase';
    },
    search: () => {
      requestedState = 'search';
    },
    attack: () => {
      requestedState = 'attack';
    },
    inspectNoise: () => {
      requestedState = 'inspectNoise';
    },
    flee: () => {
      requestedState = 'flee';
    },
    panic: () => {
      requestedState = 'panic';
    },
  };

  const { state, metadata } = controller.step(context, handlers);
  const resolvedState = requestedState ?? state;

  let result =
    resolveActionForState(
      resolvedState,
      enemy,
      updatedPlayer,
      mapArea,
      enemies,
      npcs,
      coverPositions,
      metadata
    ) ?? null;

  if (!result) {
    // Fallback to a deterministic ladder mirroring legacy behaviour
    result =
      performAttack(enemy, updatedPlayer, mapArea, coverPositions) ??
      performChase(enemy, updatedPlayer, mapArea, enemies, npcs) ??
      performSeekCover(enemy, updatedPlayer, mapArea, enemies, coverPositions, npcs) ??
      fallbackAction(enemy, updatedPlayer);
  }

  if (context.hasLineOfSight) {
    const enemyForReevaluation = result.enemy ?? enemy;
    const targetInRange = isInAttackRange(
      enemyForReevaluation.position,
      updatedPlayer.position,
      enemyForReevaluation.attackRange
    );

    if ((result.action === 'idle' || result.action === 'inspect_noise') && targetInRange) {
      const forcedAttack = performAttack(enemyForReevaluation, updatedPlayer, mapArea, coverPositions);
      if (forcedAttack) {
        result = forcedAttack;
      }
    } else if (result.action === 'inspect_noise' && !targetInRange) {
      const forcedChase = performChase(enemyForReevaluation, updatedPlayer, mapArea, enemies, npcs);
      if (forcedChase) {
        result = forcedChase;
      }
    } else if (result.action === 'idle' && !targetInRange) {
      const forcedChase = performChase(enemyForReevaluation, updatedPlayer, mapArea, enemies, npcs);
      if (forcedChase) {
        result = forcedChase;
      }
    }
  }

  if (!context.hasLineOfSight && result.action === 'idle') {
    const exploratoryMove = performChase(enemy, updatedPlayer, mapArea, enemies, npcs);
    if (exploratoryMove) {
      result = exploratoryMove;
    }
  }

  if (!context.hasLineOfSight && result.action === 'inspect_noise') {
    const searchAttempt =
      performSearch(enemy, updatedPlayer, mapArea, enemies, npcs) ??
      performChase(enemy, updatedPlayer, mapArea, enemies, npcs);
    if (searchAttempt) {
      result = searchAttempt;
    }
  }

  if (context.healthRatio <= 0.4 && result.action !== 'seek_cover') {
    const defensiveMove = performSeekCover(enemy, updatedPlayer, mapArea, enemies, coverPositions, npcs);
    if (defensiveMove) {
      result = defensiveMove;
    }
  }

  if (
    result.action === 'move' &&
    result.enemy &&
    result.enemy.position.x === enemy.position.x &&
    result.enemy.position.y === enemy.position.y
  ) {
    const retryMove = moveTowardPlayer(result.enemy, updatedPlayer, mapArea, enemies, npcs);
    if (retryMove) {
      const movedEnemy = executeMove(result.enemy, retryMove) as Enemy;
      result = {
        ...result,
        enemy: applyMovementOrientation(movedEnemy, result.enemy.position, mapArea),
      };
    }
  }

  const stuckCandidate = result.enemy ?? enemy;
  const targetInRange = isInAttackRange(
    stuckCandidate.position,
    updatedPlayer.position,
    stuckCandidate.attackRange
  );
  const hasMovePath = !!moveTowardPlayer(stuckCandidate, updatedPlayer, mapArea, enemies, npcs);

  if (result.action === 'idle' && !targetInRange && !hasMovePath) {
    result = fallbackAction(stuckCandidate, updatedPlayer);
  }

  const attackCandidate = result.enemy ?? stuckCandidate;
  const attackTargetInRange = isInAttackRange(
    attackCandidate.position,
    updatedPlayer.position,
    attackCandidate.attackRange
  );

  if (
    context.hasLineOfSight &&
    attackTargetInRange &&
    !['attack', 'attack_missed', 'seek_cover', 'flee', 'dead', 'no_ap'].includes(result.action)
  ) {
    const forcedAttack = performAttack(attackCandidate, updatedPlayer, mapArea, coverPositions);
    if (forcedAttack) {
      result = forcedAttack;
    }
  }

  if (result.action === 'idle' && !context.hasLineOfSight && !targetInRange) {
    result = fallbackAction(result.enemy ?? enemy, updatedPlayer);
  }

  const postSnapshot = controller.getSnapshot();
  updatedEnemy = applyAiSnapshotToEnemy(result.enemy, archetype.id, postSnapshot, metadata);
  updatedPlayer = result.player;

  return {
    ...result,
    enemy: updatedEnemy,
    player: updatedPlayer,
  };
};

// Legacy movement helpers preserved for reuse and testing ---------------------------------------

export const moveTowardPlayer = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  enemies: Enemy[],
  npcs: NPC[] = []
): Position | null => {
  const otherEnemies = enemies.filter((candidate) => candidate.id !== enemy.id);

  const attackRange = Math.max(1, Math.ceil(enemy.attackRange));
  const candidateTargets: Position[] = [];

  for (let dx = -attackRange; dx <= attackRange; dx += 1) {
    for (let dy = -attackRange; dy <= attackRange; dy += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const candidate: Position = {
        x: player.position.x + dx,
        y: player.position.y + dy,
      };

      if (!isPositionInBounds(candidate, mapArea)) {
        continue;
      }

      if (!isInAttackRange(candidate, player.position, enemy.attackRange)) {
        continue;
      }

      candidateTargets.push(candidate);
    }
  }

  const sortedTargets = candidateTargets.sort((a, b) => {
    const distanceA = calculateManhattanDistance(enemy.position, a);
    const distanceB = calculateManhattanDistance(enemy.position, b);
    return distanceA - distanceB;
  });

  let bestPath: Position[] | null = null;

  for (const target of sortedTargets) {
    if (!isPositionWalkable(target, mapArea, player, otherEnemies, { npcs })) {
      continue;
    }

    const path = findPath(enemy.position, target, mapArea, {
      player,
      enemies: otherEnemies,
      npcs,
    });

    if (path.length === 0) {
      continue;
    }

    if (!bestPath || path.length < bestPath.length) {
      bestPath = path;

      if (path.length === 1) {
        break;
      }
    }
  }

  if (bestPath && bestPath.length > 0) {
    return bestPath[0];
  }

  const adjacentPositions = getAdjacentPositions(enemy.position);
  const validMoves = adjacentPositions.filter((pos) =>
    canMoveToPosition(enemy, pos, mapArea, player, otherEnemies)
  );

  if (validMoves.length === 0) {
    return null;
  }

  return validMoves.reduce((best, current) => {
    const currentDistance = calculateManhattanDistance(current, player.position);
    const bestDistance = calculateManhattanDistance(best, player.position);

    return currentDistance < bestDistance ? current : best;
  }, validMoves[0]);
};

export const seekCover = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea,
  enemies: Enemy[],
  coverPositions: Position[],
  npcs: NPC[] = []
): Position | null => {
  if (coverPositions.length === 0) {
    return null;
  }

  if (mapArea.tiles[enemy.position.y]?.[enemy.position.x]?.provideCover) {
    return null;
  }

  const otherEnemies = enemies.filter((candidate) => candidate.id !== enemy.id);

  let bestCoverPath: Position[] | null = null;

  for (const cover of coverPositions) {
    if (!isPositionInBounds(cover, mapArea)) {
      continue;
    }

    if (!isPositionWalkable(cover, mapArea, player, otherEnemies, { npcs })) {
      continue;
    }

    const path = findPath(enemy.position, cover, mapArea, {
      player,
      enemies: otherEnemies,
      npcs,
    });

    if (path.length === 0) {
      continue;
    }

    if (!bestCoverPath || path.length < bestCoverPath.length) {
      bestCoverPath = path;

      if (path.length === 1) {
        break;
      }
    }
  }

  if (bestCoverPath && bestCoverPath.length > 0) {
    return bestCoverPath[0];
  }

  const adjacentPositions = getAdjacentPositions(enemy.position);

  const validMoves = adjacentPositions.filter((pos) =>
    canMoveToPosition(enemy, pos, mapArea, player, otherEnemies)
  );

  if (validMoves.length === 0) {
    return null;
  }

  const coverMoves = validMoves.filter((pos) =>
    coverPositions.some((cover) => cover.x === pos.x && cover.y === pos.y)
  );

  if (coverMoves.length > 0) {
    return coverMoves[0];
  }

  const nearestCover = findNearestCover(enemy.position, coverPositions);

  if (!nearestCover) {
    return null;
  }

  return validMoves.reduce((best, current) => {
    const currentDistance = calculateManhattanDistance(current, nearestCover);
    const bestDistance = calculateManhattanDistance(best, nearestCover);

    return currentDistance < bestDistance ? current : best;
  }, validMoves[0]);
};

export const findNearestCover = (
  position: Position,
  coverPositions: Position[]
): Position | null => {
  if (coverPositions.length === 0) {
    return null;
  }

  return coverPositions.reduce((nearest, current) => {
    const currentDistance = calculateManhattanDistance(position, current);
    const nearestDistance = calculateManhattanDistance(position, nearest);

    return currentDistance < nearestDistance ? current : nearest;
  }, coverPositions[0]);
};

export const getAdjacentPositions = (position: Position): Position[] => [
  { x: position.x + 1, y: position.y },
  { x: position.x - 1, y: position.y },
  { x: position.x, y: position.y + 1 },
  { x: position.x, y: position.y - 1 },
];
