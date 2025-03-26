import { 
  executeAttack, 
  calculateHitChance, 
  executeMove, 
  canMoveToPosition,
  isInAttackRange,
  initializeCombat,
  endCombatTurn,
  DEFAULT_ATTACK_COST,
  DEFAULT_MOVEMENT_COST
} from '../game/combat/combatSystem';
import { createEnemy } from '../store/worldSlice';
import { DEFAULT_PLAYER } from '../game/interfaces/player';
import { determineEnemyMove } from '../game/combat/enemyAI';

describe('Combat System Tests', () => {
  // Test the basic attack functionality
  describe('Basic Attack Functionality', () => {
    test('executeAttack should reduce target health on hit', () => {
      // Configure player and enemy
      const player = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
        actionPoints: 6
      };
      
      const enemy = createEnemy(
        "Test Enemy",
        { x: 1, y: 0 },
        30,  // health
        6,   // AP
        5,   // damage
        1    // range
      );
      
      // Mock Math.random to force a hit
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.1);
      
      // Execute attack
      const result = executeAttack(player, enemy, false);
      
      // Restore Math.random
      Math.random = originalRandom;
      
      // Check if hit was successful
      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.newTarget.health).toBeLessThan(enemy.health);
      
      // Check if attacker's AP was reduced
      expect(result.newAttacker.actionPoints).toBe(player.actionPoints - DEFAULT_ATTACK_COST);
    });
    
    test('executeAttack should fail if attacker has insufficient AP', () => {
      // Configure player and enemy
      const player = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
        actionPoints: 1 // Less than DEFAULT_ATTACK_COST (2)
      };
      
      const enemy = createEnemy(
        "Test Enemy",
        { x: 1, y: 0 }
      );
      
      // Execute attack
      const result = executeAttack(player, enemy, false);
      
      // Check if attack failed due to insufficient AP
      expect(result.success).toBe(false);
      expect(result.damage).toBe(0);
      expect(result.newTarget.health).toBe(enemy.health);
      expect(result.newAttacker.actionPoints).toBe(player.actionPoints);
    });
    
    test('calculateHitChance should return lower value when behind cover', () => {
      const attackerPos = { x: 0, y: 0 };
      const targetPos = { x: 1, y: 1 };
      
      const normalHitChance = calculateHitChance(attackerPos, targetPos, false);
      const coverHitChance = calculateHitChance(attackerPos, targetPos, true);
      
      expect(coverHitChance).toBeLessThan(normalHitChance);
    });
  });
  
  // Test movement functionality
  describe('Movement Functionality', () => {
    test('canMoveToPosition should return true for adjacent, unobstructed positions', () => {
      const player = {
        ...DEFAULT_PLAYER,
        position: { x: 5, y: 5 },
        actionPoints: 6
      };
      
      const obstacles = [
        { x: 7, y: 5 }, // Not adjacent
        { x: 5, y: 7 }  // Not adjacent
      ];
      
      // Check valid moves
      expect(canMoveToPosition(player, { x: 6, y: 5 }, obstacles)).toBe(true); // Right
      expect(canMoveToPosition(player, { x: 4, y: 5 }, obstacles)).toBe(true); // Left
      expect(canMoveToPosition(player, { x: 5, y: 4 }, obstacles)).toBe(true); // Up
      expect(canMoveToPosition(player, { x: 5, y: 6 }, obstacles)).toBe(true); // Down
    });
    
    test('canMoveToPosition should return false for non-adjacent or obstructed positions', () => {
      const player = {
        ...DEFAULT_PLAYER,
        position: { x: 5, y: 5 },
        actionPoints: 6
      };
      
      const obstacles = [
        { x: 6, y: 5 } // Obstacle to the right
      ];
      
      // Check invalid moves
      expect(canMoveToPosition(player, { x: 6, y: 5 }, obstacles)).toBe(false); // Obstructed
      expect(canMoveToPosition(player, { x: 7, y: 5 }, obstacles)).toBe(false); // Not adjacent
      expect(canMoveToPosition(player, { x: 6, y: 6 }, obstacles)).toBe(false); // Diagonal
    });
    
    test('executeMove should update position and reduce AP', () => {
      const player = {
        ...DEFAULT_PLAYER,
        position: { x: 5, y: 5 },
        actionPoints: 6
      };
      
      const newPosition = { x: 6, y: 5 };
      const result = executeMove(player, newPosition);
      
      expect(result.position).toEqual(newPosition);
      expect(result.actionPoints).toBe(player.actionPoints - DEFAULT_MOVEMENT_COST);
    });
  });
  
  // Test turn management
  describe('Turn Management', () => {
    test('initializeCombat should reset AP for player and enemies', () => {
      const player = {
        ...DEFAULT_PLAYER,
        actionPoints: 2 // Low AP
      };
      
      const enemies = [
        createEnemy("Enemy 1", { x: 3, y: 3 }, 30, 2), // Low AP
        createEnemy("Enemy 2", { x: 4, y: 4 }, 30, 3)  // Low AP
      ];
      
      const result = initializeCombat(player, enemies);
      
      expect(result.player.actionPoints).toBe(player.maxActionPoints);
      expect(result.enemies[0].actionPoints).toBe(enemies[0].maxActionPoints);
      expect(result.enemies[1].actionPoints).toBe(enemies[1].maxActionPoints);
    });
    
    test('endCombatTurn should toggle player turn and reset appropriate AP', () => {
      const player = {
        ...DEFAULT_PLAYER,
        actionPoints: 0 // No AP left
      };
      
      const enemies = [
        createEnemy("Enemy 1", { x: 3, y: 3 }, 30, 0), // No AP left
        createEnemy("Enemy 2", { x: 4, y: 4 }, 30, 0)  // No AP left
      ];
      
      // Test ending player turn
      const playerTurnResult = endCombatTurn(player, enemies, true);
      
      expect(playerTurnResult.isPlayerTurn).toBe(false);
      expect(playerTurnResult.player.actionPoints).toBe(0); // Unchanged
      expect(playerTurnResult.enemies[0].actionPoints).toBe(enemies[0].maxActionPoints); // Reset
      
      // Test ending enemy turn
      const enemyTurnResult = endCombatTurn(player, enemies, false);
      
      expect(enemyTurnResult.isPlayerTurn).toBe(true);
      expect(enemyTurnResult.player.actionPoints).toBe(player.maxActionPoints); // Reset
      expect(enemyTurnResult.enemies[0].actionPoints).toBe(0); // Unchanged
    });
  });
  
  // Test enemy AI
  describe('Enemy AI', () => {
    test('determineEnemyMove should attack when in range', () => {
      const enemy = createEnemy("Enemy", { x: 1, y: 0 }, 30, 6, 5, 1);
      const player = { ...DEFAULT_PLAYER, position: { x: 0, y: 0 } };
      const obstacles: Array<{x: number, y: number}> = [];
      const coverPositions: Array<{x: number, y: number}> = [];
      
      // Mock Math.random to force a hit
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.1);
      
      const result = determineEnemyMove(enemy, player, obstacles, coverPositions);
      
      // Restore Math.random
      Math.random = originalRandom;
      
      expect(result.action).toBe('attack');
      expect(result.enemy.actionPoints).toBeLessThan(enemy.actionPoints);
      expect(result.player.health).toBeLessThan(player.health);
    });
    
    test('determineEnemyMove should move toward player when out of range', () => {
      const enemy = createEnemy("Enemy", { x: 3, y: 0 }, 30, 6, 5, 1);
      const player = { ...DEFAULT_PLAYER, position: { x: 0, y: 0 } };
      const obstacles: Array<{x: number, y: number}> = [];
      const coverPositions: Array<{x: number, y: number}> = [];
      
      const result = determineEnemyMove(enemy, player, obstacles, coverPositions);
      
      expect(result.action).toBe('move');
      expect(result.enemy.actionPoints).toBeLessThan(enemy.actionPoints);
      
      // Should move closer to player
      const oldDistance = Math.abs(enemy.position.x - player.position.x) + 
                         Math.abs(enemy.position.y - player.position.y);
                         
      const newDistance = Math.abs(result.enemy.position.x - player.position.x) + 
                         Math.abs(result.enemy.position.y - player.position.y);
                         
      expect(newDistance).toBeLessThan(oldDistance);
    });
    
    test('determineEnemyMove should seek cover when health is low', () => {
      const enemy = createEnemy(
        "Enemy", 
        { x: 2, y: 2 },  
        30,   // max health
        6,    // AP
        5,    // damage
        1     // range
      );
      
      // Set health to 10% of max (below the threshold)
      enemy.health = enemy.maxHealth * 0.1;
      
      const player = { ...DEFAULT_PLAYER, position: { x: 0, y: 0 } };
      const obstacles: Array<{x: number, y: number}> = [];
      const coverPositions = [
        { x: 3, y: 2 } // Cover position adjacent to enemy
      ];
      
      const result = determineEnemyMove(enemy, player, obstacles, coverPositions);
      
      expect(result.action).toBe('seek_cover');
      expect(result.enemy.position).toEqual(coverPositions[0]);
    });
  });
}); 