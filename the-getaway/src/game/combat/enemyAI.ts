import { Enemy, Player, Position } from '../interfaces/types';
import { 
  calculateManhattanDistance, 
  isInAttackRange,
  canMoveToPosition,
  executeMove,
  executeAttack
} from './combatSystem';

// Constants
export const HEALTH_THRESHOLD_SEEK_COVER = 0.3; // 30% health

// Determine the best move for an enemy based on its position and the player
export const determineEnemyMove = (
  enemy: Enemy,
  player: Player,
  obstacles: Position[],
  coverPositions: Position[]
): { enemy: Enemy, player: Player, action: string } => {
  let updatedEnemy = { ...enemy };
  let updatedPlayer = { ...player };
  let actionTaken = 'none';
  
  // If no AP left, do nothing
  if (enemy.actionPoints <= 0) {
    return { enemy: updatedEnemy, player: updatedPlayer, action: 'no_ap' };
  }
  
  // If health is low, try to seek cover
  if (enemy.health <= enemy.maxHealth * HEALTH_THRESHOLD_SEEK_COVER) {
    const coverMove = seekCover(enemy, coverPositions, obstacles);
    if (coverMove) {
      updatedEnemy = executeMove(enemy, coverMove);
      return { enemy: updatedEnemy, player: updatedPlayer, action: 'seek_cover' };
    }
  }
  
  // If in attack range, attack player
  if (isInAttackRange(enemy.position, player.position, enemy.attackRange)) {
    // Determine if player is behind cover
    const playerBehindCover = coverPositions.some(
      cover => cover.x === player.position.x && cover.y === player.position.y
    );
    
    // Execute attack
    const attackResult = executeAttack(enemy, player, playerBehindCover);
    
    if (attackResult.success) {
      updatedEnemy = attackResult.newAttacker as Enemy;
      updatedPlayer = attackResult.newTarget as Player;
      actionTaken = 'attack';
    } else {
      updatedEnemy = attackResult.newAttacker as Enemy;
      actionTaken = 'attack_missed';
    }
    
    return { 
      enemy: updatedEnemy, 
      player: updatedPlayer, 
      action: actionTaken 
    };
  }
  
  // Otherwise, try to move toward player
  const nextMove = moveTowardPlayer(enemy, player, obstacles);
  if (nextMove) {
    updatedEnemy = executeMove(enemy, nextMove);
    return { enemy: updatedEnemy, player: updatedPlayer, action: 'move' };
  }
  
  // If no valid move found
  return { enemy: updatedEnemy, player: updatedPlayer, action: 'no_valid_move' };
};

// Find a position to move toward the player
export const moveTowardPlayer = (
  enemy: Enemy,
  player: Player,
  obstacles: Position[]
): Position | null => {
  // Get all possible adjacent positions
  const adjacentPositions = getAdjacentPositions(enemy.position);
  
  // Filter to positions that are valid moves
  const validMoves = adjacentPositions.filter(
    pos => canMoveToPosition(enemy, pos, obstacles)
  );
  
  if (validMoves.length === 0) {
    return null;
  }
  
  // Find the position that gets closest to the player
  return validMoves.reduce((best, current) => {
    const currentDistance = calculateManhattanDistance(current, player.position);
    const bestDistance = calculateManhattanDistance(best, player.position);
    
    return currentDistance < bestDistance ? current : best;
  }, validMoves[0]);
};

// Find a position to move toward cover
export const seekCover = (
  enemy: Enemy,
  coverPositions: Position[],
  obstacles: Position[]
): Position | null => {
  // If no cover positions, can't seek cover
  if (coverPositions.length === 0) {
    return null;
  }
  
  // Get all possible adjacent positions
  const adjacentPositions = getAdjacentPositions(enemy.position);
  
  // Filter to positions that are valid moves
  const validMoves = adjacentPositions.filter(
    pos => canMoveToPosition(enemy, pos, obstacles)
  );
  
  if (validMoves.length === 0) {
    return null;
  }
  
  // Check if any valid moves are cover positions
  const coverMoves = validMoves.filter(pos => 
    coverPositions.some(cover => cover.x === pos.x && cover.y === pos.y)
  );
  
  if (coverMoves.length > 0) {
    // Return the first available cover position
    return coverMoves[0];
  }
  
  // If no direct cover available, move toward the nearest cover
  const nearestCover = findNearestCover(enemy.position, coverPositions);
  
  if (!nearestCover) {
    return null;
  }
  
  // Find the position that gets closest to cover
  return validMoves.reduce((best, current) => {
    const currentDistance = calculateManhattanDistance(current, nearestCover);
    const bestDistance = calculateManhattanDistance(best, nearestCover);
    
    return currentDistance < bestDistance ? current : best;
  }, validMoves[0]);
};

// Find the nearest cover position
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

// Get all adjacent positions to a position
export const getAdjacentPositions = (position: Position): Position[] => {
  return [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 }
  ];
}; 