import { Enemy, Player, Position } from '../interfaces/types';

// Constants
export const DEFAULT_ATTACK_DAMAGE = 5;
export const DEFAULT_ATTACK_COST = 2;
export const DEFAULT_MOVEMENT_COST = 1;
export const COVER_DAMAGE_REDUCTION = 0.5;

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
  const distance = Math.sqrt(
    Math.pow(target.x - attacker.x, 2) + Math.pow(target.y - attacker.y, 2)
  );
  return distance <= range;
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
export const calculateHitChance = (
  attacker: Position, 
  target: Position, 
  isBehindCover: boolean
): number => {
  // Base hit chance
  let hitChance = 0.9; // 90% base chance to hit
  
  // Reduce hit chance based on distance
  const distance = calculateDistance(attacker, target);
  hitChance -= distance * 0.05; // 5% reduction per distance unit
  
  // Apply cover reduction
  if (isBehindCover) {
    hitChance *= (1 - COVER_DAMAGE_REDUCTION);
  }
  
  // Ensure hit chance is between 0.1 and 0.95
  return Math.max(0.1, Math.min(0.95, hitChance));
};

// Execute an attack
export const executeAttack = (
  attacker: Player | Enemy, 
  target: Player | Enemy, 
  isBehindCover: boolean
): { success: boolean; damage: number; newAttacker: Player | Enemy; newTarget: Player | Enemy } => {
  // Check if attacker has enough AP
  if (attacker.actionPoints < DEFAULT_ATTACK_COST) {
    return { 
      success: false, 
      damage: 0, 
      newAttacker: attacker, 
      newTarget: target 
    };
  }
  
  // Calculate hit chance
  const hitChance = calculateHitChance(attacker.position, target.position, isBehindCover);
  
  // Roll to hit
  const roll = Math.random();
  const hit = roll <= hitChance;
  
  // Calculate damage
  const damageAmount = hit ? 
    ('damage' in attacker ? attacker.damage : DEFAULT_ATTACK_DAMAGE) : 
    0;
    
  // Apply damage to target and update AP
  const newTarget = {
    ...target,
    health: Math.max(0, target.health - damageAmount)
  };
  
  const newAttacker = {
    ...attacker,
    actionPoints: attacker.actionPoints - DEFAULT_ATTACK_COST
  };
  
  return {
    success: hit,
    damage: damageAmount,
    newAttacker,
    newTarget
  };
};

// Check if entity can move to position
export const canMoveToPosition = (
  entity: Player | Enemy,
  targetPosition: Position,
  obstacles: Position[]
): boolean => {
  // Check if entity has enough AP
  if (entity.actionPoints < DEFAULT_MOVEMENT_COST) {
    return false;
  }
  
  // Check if target position is adjacent
  if (!areEntitiesAdjacent(entity.position, targetPosition)) {
    return false;
  }
  
  // Check if target position is occupied by obstacle
  return !obstacles.some(obstacle => 
    obstacle.x === targetPosition.x && obstacle.y === targetPosition.y
  );
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