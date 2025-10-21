import {
  DEFAULT_ATTACK_DAMAGE,
  DEFAULT_ATTACK_COST,
  calculateManhattanDistance,
  isInAttackRange,
} from '../combatSystem';
import { shouldGunFuAttackBeFree } from '../../systems/perks';
import { isPositionWalkable } from '../../world/grid';
import type { Player, Enemy, MapArea, Position } from '../../interfaces/types';
import type { AutoBattleProfile } from './autoBattleProfiles';

export type AutoBattleActionType = 'attack' | 'move' | 'wait';

export interface AutoBattlePlannerContext {
  player: Player;
  enemies: Enemy[];
  map: MapArea;
  profile: AutoBattleProfile;
}

export interface AutoBattleDecisionBase {
  type: AutoBattleActionType;
  score: number;
  summary: string;
  rationale: string[];
}

export interface AutoBattleAttackDecision extends AutoBattleDecisionBase {
  type: 'attack';
  targetId: string;
  targetName: string;
  targetPosition: Position;
  expectedDamage: number;
  apCost: number;
  distance: number;
}

export interface AutoBattleMoveDecision extends AutoBattleDecisionBase {
  type: 'move';
  destination: Position;
  coverGain: number;
  distanceToNearestEnemy: number;
  apCost: number;
}

export interface AutoBattleWaitDecision extends AutoBattleDecisionBase {
  type: 'wait';
}

export type AutoBattleDecision =
  | AutoBattleAttackDecision
  | AutoBattleMoveDecision
  | AutoBattleWaitDecision;

const MOVEMENT_VECTORS: Position[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const getTileCoverValue = (map: MapArea, position: Position): number => {
  const tile = map.tiles[position.y]?.[position.x];
  if (!tile) {
    return 0;
  }
  if (tile.cover) {
    return 1;
  }
  return tile.provideCover ? 0.75 : 0;
};

const getWeaponDamage = (player: Player): number =>
  player.equipped.weapon?.damage ?? DEFAULT_ATTACK_DAMAGE;

const getWeaponRange = (player: Player): number =>
  player.equipped.weapon?.range ?? 1;

const getAttackApCost = (player: Player): number => {
  const baseAttackCost = player.equipped.weapon?.apCost ?? DEFAULT_ATTACK_COST;
  const encumbranceAttackMultiplier = Number.isFinite(player.encumbrance.attackApMultiplier)
    ? Math.max(player.encumbrance.attackApMultiplier, 0)
    : Number.POSITIVE_INFINITY;
  const attackCost = shouldGunFuAttackBeFree(player)
    ? 0
    : Math.ceil(Math.max(0, baseAttackCost) * encumbranceAttackMultiplier);
  return Number.isFinite(attackCost) ? attackCost : Number.POSITIVE_INFINITY;
};

const enumerateLivingEnemies = (enemies: Enemy[]): Enemy[] =>
  enemies.filter((enemy) => enemy.health > 0);

const nearestEnemyDistance = (position: Position, enemies: Enemy[]): number => {
  if (enemies.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return enemies.reduce((best, enemy) => {
    const distance = calculateManhattanDistance(position, enemy.position);
    return distance < best ? distance : best;
  }, Number.POSITIVE_INFINITY);
};

const clampScore = (value: number): number => {
  if (!Number.isFinite(value)) {
    return Number.NEGATIVE_INFINITY;
  }
  return value;
};

const buildAttackDecisions = (
  context: AutoBattlePlannerContext,
  panic: boolean
): AutoBattleAttackDecision[] => {
  const { player, enemies, map, profile } = context;
  const livingEnemies = enumerateLivingEnemies(enemies);
  const attackCost = getAttackApCost(player);
  if (!Number.isFinite(attackCost) || attackCost > player.actionPoints) {
    return [];
  }
  const weaponDamage = getWeaponDamage(player);
  const weaponRange = getWeaponRange(player);
  const currentCoverValue = getTileCoverValue(map, player.position);

  return livingEnemies
    .filter((enemy) => isInAttackRange(player.position, enemy.position, weaponRange))
    .map<AutoBattleAttackDecision>((enemy) => {
      const distance = calculateManhattanDistance(player.position, enemy.position);
      const enemyHealthFraction = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 1;
      const targetCover = getTileCoverValue(map, enemy.position);

      const expectedDamage = weaponDamage * (targetCover > 0 ? 0.75 : 1);
      const executionBonus =
        (1 - enemyHealthFraction) * profile.weights.focusLowestHealth * expectedDamage;
      const overwatchBias = profile.weights.focusOverwatchThreat * enemy.damage * 0.05;
      const coverPenalty = currentCoverValue < 0.5 ? 0.25 : 0;
      const panicPenalty = panic
        ? profile.weights.retreatBias * (expectedDamage * 0.2 + (currentCoverValue < 0.5 ? 2 : 0))
        : 0;
      const remainingApAfterAttack = player.actionPoints - attackCost;
      const reservePenalty =
        remainingApAfterAttack < profile.thresholds.apReserve
          ? (profile.thresholds.apReserve - remainingApAfterAttack) * 0.4
          : 0;

      const score =
        profile.weights.attackBias * expectedDamage +
        executionBonus +
        overwatchBias -
        coverPenalty -
        panicPenalty -
        reservePenalty;

      const rationale: string[] = [];
      rationale.push(`Distance ${distance}`);
      rationale.push(`Expected damage ${expectedDamage.toFixed(1)}`);
      if (executionBonus > 0.1) {
        rationale.push('Target vulnerable');
      }
      if (panicPenalty > 0.1) {
        rationale.push('Panic dampening attack');
      }
      if (reservePenalty > 0.1) {
        rationale.push('Preserve AP reserve');
      }

      return {
        type: 'attack',
        targetId: enemy.id,
        targetName: enemy.name,
        targetPosition: enemy.position,
        expectedDamage,
        apCost: attackCost,
        distance,
        score: clampScore(score),
        summary: `Attack ${enemy.name}`,
        rationale,
      };
    });
};

const buildMoveDecisions = (
  context: AutoBattlePlannerContext,
  panic: boolean
): AutoBattleMoveDecision[] => {
  const { player, enemies, map, profile } = context;
  if (player.actionPoints <= 0) {
    return [];
  }
  const livingEnemies = enumerateLivingEnemies(enemies);
  if (livingEnemies.length === 0) {
    return [];
  }
  const currentCoverValue = getTileCoverValue(map, player.position);
  const currentDistance = nearestEnemyDistance(player.position, livingEnemies);
  const weaponRange = getWeaponRange(player);

  const decisions: AutoBattleMoveDecision[] = [];
  MOVEMENT_VECTORS.forEach((delta) => {
    const destination: Position = {
      x: player.position.x + delta.x,
      y: player.position.y + delta.y,
    };

    if (!isPositionWalkable(destination, map, player, livingEnemies)) {
      return;
    }

    const coverValue = getTileCoverValue(map, destination);
    const coverGain = Math.max(0, coverValue - currentCoverValue);
    const distanceToEnemy = nearestEnemyDistance(destination, livingEnemies);
    const towardsEnemy = currentDistance > 0 ? currentDistance - distanceToEnemy : 0;

    const pursuitBias =
      profile.weights.pursuitAggression * (weaponRange > 0 ? towardsEnemy / weaponRange : 0);
    const retreatBonus =
      panic || profile.weights.retreatBias > 0.8
        ? profile.weights.retreatBias * Math.max(0, distanceToEnemy - currentDistance)
        : 0;

    const coverScore = profile.weights.maintainCover * coverValue;
    const remainingApAfterMove = player.actionPoints - 1;
    const reservePenalty =
      remainingApAfterMove < profile.thresholds.apReserve
        ? (profile.thresholds.apReserve - remainingApAfterMove) * 0.35
        : 0;

    const score =
      coverScore + pursuitBias + retreatBonus - Math.max(0, -towardsEnemy) * 0.1 - reservePenalty;

    const rationale: string[] = [];
    if (coverGain > 0.01) {
      rationale.push('Gain cover');
    } else if (coverValue > 0.4) {
      rationale.push('Maintain cover');
    }
    if (towardsEnemy > 0.2) {
      rationale.push('Advance on target');
    }
    if (retreatBonus > 0.2) {
      rationale.push('Create distance');
    }
    if (reservePenalty > 0.1) {
      rationale.push('Hold AP reserve');
    }

    decisions.push({
      type: 'move',
      destination,
      coverGain,
      distanceToNearestEnemy: distanceToEnemy,
      apCost: 1,
      score: clampScore(score),
      summary: coverGain > 0 ? 'Move to cover' : 'Reposition',
      rationale,
    });
  });

  return decisions;
};

const buildWaitDecision = (): AutoBattleWaitDecision => ({
  type: 'wait',
  score: -0.5,
  summary: 'Hold position',
  rationale: ['No advantageous action'],
});

export const planAutoBattleAction = (
  context: AutoBattlePlannerContext
): AutoBattleDecision => {
  const { player, profile, enemies } = context;
  const livingEnemies = enumerateLivingEnemies(enemies);

  if (livingEnemies.length === 0) {
    return {
      type: 'wait',
      score: Number.NEGATIVE_INFINITY,
      summary: 'No targets',
      rationale: ['No living enemies'],
    };
  }

  const playerHealthFraction =
    player.maxHealth > 0 ? player.health / player.maxHealth : 1;
  const panic = playerHealthFraction <= profile.thresholds.panicHealthFraction;

  const attackDecisions = buildAttackDecisions(context, panic);
  const moveDecisions = buildMoveDecisions(context, panic);
  const waitDecision = buildWaitDecision();

  const allDecisions: AutoBattleDecision[] = [...attackDecisions, ...moveDecisions, waitDecision];
  const bestDecision = allDecisions.reduce<AutoBattleDecision | null>((best, decision) => {
    if (!best || decision.score > best.score) {
      return decision;
    }
    return best;
  }, null);

  return bestDecision ?? waitDecision;
};
