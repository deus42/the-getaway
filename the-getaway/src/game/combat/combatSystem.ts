import { Enemy, Player, Position, MapArea } from '../interfaces/types';
import { isPositionWalkable } from '../world/grid';
import {
  calculateDerivedStatsWithEquipment,
  calculateDerivedStats,
} from '../systems/statCalculations';
import {
  getEquippedBonuses,
  getEffectiveDamage,
  applyArmorReduction,
  getEffectiveArmorRating,
} from '../systems/equipmentEffects';

// Constants
export const DEFAULT_ATTACK_DAMAGE = 5;
export const DEFAULT_ATTACK_COST = 1;
export const DEFAULT_MOVEMENT_COST = 1;
export const COVER_DAMAGE_REDUCTION = 0.5;

export type RandomGenerator = () => number;

let randomGenerator: RandomGenerator = () => Math.random();

export const setRandomGenerator = (generator?: RandomGenerator): void => {
  randomGenerator = generator ?? (() => Math.random());
};

const getRandomRoll = (): number => {
  const roll = randomGenerator();

  if (!Number.isFinite(roll) || Number.isNaN(roll)) {
    throw new Error('[CombatSystem] Random generator must return a finite number between 0 and 1.');
  }

  if (roll < 0 || roll > 1) {
    throw new Error('[CombatSystem] Random generator must return a value between 0 and 1.');
  }

  return roll;
};

// Types for combat actions
export type CombatAction = 
  | { type: 'move', targetPosition: Position, cost: number }
  | { type: 'attack', targetId: string, damage: number, cost: number };

// Check if entities are adjacent
export const areEntitiesAdjacent = (pos1: Position, pos2: Position): boolean => {
  const xDiff = Math.abs(pos1.x - pos2.x);
  const yDiff = Math.abs(pos1.y - pos2.y);
  return (xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1);
};

// Check if position is in attack range
export const isInAttackRange = (attacker: Position, target: Position, range: number): boolean => {
  // Validate range is a positive finite number
  if (!Number.isFinite(range) || range <= 0) {
    console.warn('[CombatSystem] Invalid attack range:', range);
    return false;
  }

  const distance = Math.sqrt(
    Math.pow(target.x - attacker.x, 2) + Math.pow(target.y - attacker.y, 2)
  );
  // Ensure distance is greater than 0 and within range
  return distance > 0 && distance <= range;
};

// Calculate distance between two positions
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(
    Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
  );
};

// Calculate manhattan distance (grid movement) between two positions
export const calculateManhattanDistance = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
};

// Calculate if attack hits based on cover
const getPlayerDerivedStats = (entity: Player) => {
  try {
    return calculateDerivedStatsWithEquipment(entity);
  } catch (error) {
    console.warn('[CombatSystem] Failed to calculate equipment-aware stats, falling back to base attributes.', error);
    return calculateDerivedStats(entity.skills);
  }
};

export const calculateHitChance = (
  attacker: Player | Enemy,
  target: Player | Enemy,
  isBehindCover: boolean
): number => {
  const distance = calculateDistance(attacker.position, target.position);

  // Start from a conservative baseline; distance and cover apply first.
  let hitChance = 0.65 - distance * 0.05;

  if (isBehindCover) {
    hitChance *= 1 - COVER_DAMAGE_REDUCTION;
  }

  // Player-based modifiers
  if ('skills' in attacker) {
    const attackerStats = getPlayerDerivedStats(attacker as Player);
    hitChance += attackerStats.hitChanceModifier / 100;
  }

  if ('skills' in target) {
    const targetStats = getPlayerDerivedStats(target as Player);
    hitChance -= targetStats.dodgeChance / 100;
  }

  const finalHitChance = Math.max(0.1, Math.min(0.95, hitChance));

  console.log('[CombatSystem] calculateHitChance:', {
    attacker: attacker.id,
    target: target.id,
    distance,
    isBehindCover,
    finalHitChance,
  });

  return finalHitChance;
};

// Execute an attack
export const executeAttack = (
  attacker: Player | Enemy,
  target: Player | Enemy,
  isBehindCover: boolean
): { success: boolean; damage: number; newAttacker: Player | Enemy; newTarget: Player | Enemy } => {
  const attackCost = 'skills' in attacker && attacker.equipped?.weapon?.apCost
    ? Math.max(1, attacker.equipped.weapon.apCost)
    : DEFAULT_ATTACK_COST;

  if (attacker.actionPoints < attackCost) {
    return {
      success: false,
      damage: 0,
      newAttacker: attacker,
      newTarget: target,
    };
  }

  const hitChance = calculateHitChance(attacker, target, isBehindCover);
  const roll = getRandomRoll();
  const hit = roll <= hitChance;

  let damageAmount = 0;

  if (hit) {
    if ('skills' in attacker) {
      const playerAttacker = attacker as Player;
      const attackerDerived = getPlayerDerivedStats(playerAttacker);
      const bonuses = getEquippedBonuses(playerAttacker);
      const equippedWeapon = playerAttacker.equipped.weapon;
      const baseWeaponDamage = equippedWeapon?.damage ?? DEFAULT_ATTACK_DAMAGE;
      const isMeleeAttack = !equippedWeapon || equippedWeapon.range <= 1;
      const strengthBonus = isMeleeAttack ? attackerDerived.meleeDamageBonus : 0;

      damageAmount = getEffectiveDamage(baseWeaponDamage, bonuses, strengthBonus);
    } else {
      damageAmount = 'damage' in attacker ? attacker.damage : DEFAULT_ATTACK_DAMAGE;
    }

    if ('skills' in target) {
      const armorRating = getEffectiveArmorRating(target as Player);
      if (armorRating > 0) {
        damageAmount = applyArmorReduction(damageAmount, armorRating);
      }
    }
  }

  const newTarget = {
    ...target,
    health: Math.max(0, target.health - damageAmount),
  };

  const newAttacker = {
    ...attacker,
    actionPoints: Math.max(0, attacker.actionPoints - attackCost),
  };

  return {
    success: hit,
    damage: damageAmount,
    newAttacker,
    newTarget,
  };
};

// Check if entity can move to position (considers AP, adjacency, obstacles, player, other enemies)
export const canMoveToPosition = (
  entity: Player | Enemy,
  targetPosition: Position,
  mapArea: MapArea, // Need mapArea for full walkability check
  player: Player,   // Need player
  enemies: Enemy[]  // Need enemies
): boolean => {
  // Check if entity has enough AP
  if (entity.actionPoints < DEFAULT_MOVEMENT_COST) {
    return false;
  }
  
  // Check if target position is adjacent
  if (!areEntitiesAdjacent(entity.position, targetPosition)) {
    // Note: This check might be redundant if called only on adjacent positions
    return false;
  }
  
  // Check if target position is walkable (considering map, player, enemies)
  // Exclude the moving entity itself from the collision check
  const otherEnemies = enemies.filter(e => e.id !== entity.id);
  const effectivePlayer = (entity.id === player.id) ? 
      {...player, position: {x: -1, y: -1}} : // Temporarily move player off-grid if it's the entity moving
      player; 

  return isPositionWalkable(targetPosition, mapArea, effectivePlayer, otherEnemies);
};

// Execute a move
export const executeMove = (
  entity: Player | Enemy,
  targetPosition: Position
): Player | Enemy => {
  // Update position and AP
  return {
    ...entity,
    position: targetPosition,
    actionPoints: entity.actionPoints - DEFAULT_MOVEMENT_COST
  };
};

// Initialize combat
export const initializeCombat = (
  player: Player,
  enemies: Enemy[]
): { player: Player; enemies: Enemy[] } => {
  // Reset player AP
  const refreshedPlayer = {
    ...player,
    actionPoints: player.maxActionPoints
  };
  
  // Reset enemies AP
  const refreshedEnemies = enemies.map(enemy => ({
    ...enemy,
    actionPoints: enemy.maxActionPoints
  }));
  
  return { player: refreshedPlayer, enemies: refreshedEnemies };
};

// End combat turn (refresh AP)
export const endCombatTurn = (
  player: Player,
  enemies: Enemy[],
  isPlayerTurn: boolean
): { player: Player; enemies: Enemy[]; isPlayerTurn: boolean } => {
  if (isPlayerTurn) {
    // End player turn, reset enemies AP
    const refreshedEnemies = enemies.map(enemy => ({
      ...enemy,
      actionPoints: enemy.maxActionPoints
    }));
    
    return { 
      player, 
      enemies: refreshedEnemies, 
      isPlayerTurn: false 
    };
  } else {
    // End enemy turn, reset player AP
    const refreshedPlayer = {
      ...player,
      actionPoints: player.maxActionPoints
    };
    
    return { 
      player: refreshedPlayer, 
      enemies, 
      isPlayerTurn: true 
    };
  }
}; 
