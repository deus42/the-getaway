import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { Player, Enemy, Position } from '../game/interfaces/types';
import { DEFAULT_PLAYER } from '../game/interfaces/player';
import { 
  executeAttack, 
  calculateHitChance, 
  executeMove, 
  canMoveToPosition,
  initializeCombat,
  endCombatTurn,
  DEFAULT_ATTACK_COST,
  DEFAULT_MOVEMENT_COST,
  setRandomGenerator
} from '../game/combat/combatSystem';
import { MapArea } from '../game/interfaces/types';
import { createBasicMapArea } from '../game/world/grid';
import { v4 as uuidv4 } from 'uuid';
import { determineEnemyMove } from '../game/combat/enemyAI';
import { createWeapon, createArmor } from '../game/inventory/inventorySystem';

function createEnemy(
  position: Position,
  health: number = 20,
  maxHealth: number = 20,
  actionPoints: number = 5
): Enemy {
  return {
    id: uuidv4(),
    name: "Test Enemy",
    position,
    health,
    maxHealth,
    actionPoints,
    maxActionPoints: 5,
    damage: 5,
    attackRange: 1,
    isHostile: true,
  };
}

describe('Combat System Tests', () => {
  let player: Player;
  let enemy: Enemy;
  let mapArea: MapArea;

  beforeEach(() => {
    player = { ...DEFAULT_PLAYER, position: { x: 1, y: 1 } };
    enemy = createEnemy({ x: 1, y: 2 });
    mapArea = createBasicMapArea('Combat Test Map', 10, 10);
  });

  afterEach(() => {
    setRandomGenerator();
  });

  // Test the basic attack functionality
  describe('Basic Attack Functionality', () => {
    test('executeAttack should reduce target health on hit', () => {
      setRandomGenerator(() => 0.1);
      
      // Execute attack
      const result = executeAttack(player, enemy, false);
      
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
        actionPoints: 0,
      };

      const enemy = createEnemy({ x: 1, y: 0 });
      
      // Execute attack
      const result = executeAttack(player, enemy, false);
      
      // Check if attack failed due to insufficient AP
      expect(result.success).toBe(false);
      expect(result.damage).toBe(0);
      expect(result.newTarget.health).toBe(enemy.health);
      expect(result.newAttacker.actionPoints).toBe(player.actionPoints);
    });
    
    test('calculateHitChance should return lower value when target has cover', () => {
      const attackerEntity = {
        ...player,
        position: { x: 0, y: 0 },
      };

      const targetEntity = {
        ...enemy,
        position: { x: 1, y: 1 },
      };

      const normalHitChance = calculateHitChance(attackerEntity, targetEntity, false);
      const coverHitChance = calculateHitChance(attackerEntity, targetEntity, true);

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

      const mapArea = createBasicMapArea('Test', 10, 10);

      expect(
        canMoveToPosition(player, { x: 6, y: 5 }, mapArea, player, [])
      ).toBe(true); // Right
      expect(
        canMoveToPosition(player, { x: 4, y: 5 }, mapArea, player, [])
      ).toBe(true); // Left
      expect(
        canMoveToPosition(player, { x: 5, y: 4 }, mapArea, player, [])
      ).toBe(true); // Up
      expect(
        canMoveToPosition(player, { x: 5, y: 6 }, mapArea, player, [])
      ).toBe(true); // Down
    });

    test('canMoveToPosition should return false for non-adjacent or obstructed positions', () => {
      const player = {
        ...DEFAULT_PLAYER,
        position: { x: 5, y: 5 },
        actionPoints: 6
      };

      const mapArea = createBasicMapArea('Test', 10, 10);
      // Add an obstacle directly to the right
      mapArea.tiles[5][6].isWalkable = false;

      expect(
        canMoveToPosition(player, { x: 6, y: 5 }, mapArea, player, [])
      ).toBe(false); // Obstructed
      expect(
        canMoveToPosition(player, { x: 7, y: 5 }, mapArea, player, [])
      ).toBe(false); // Not adjacent
      expect(
        canMoveToPosition(player, { x: 6, y: 6 }, mapArea, player, [])
      ).toBe(false); // Diagonal
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

  describe('Equipment Integration', () => {
    test('player weapon damage includes equipment bonuses and strength', () => {
      setRandomGenerator(() => 0.1);

      const weapon = createWeapon('Test Blade', 10, 1, 2, 2, { damageBonus: 3 });
      const attackerWithWeapon: Player = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
        actionPoints: 5,
        maxActionPoints: 5,
        skills: {
          ...DEFAULT_PLAYER.skills,
          strength: 8,
        },
        equipped: {
          ...DEFAULT_PLAYER.equipped,
          weapon,
        },
      };

      const targetEnemy = createEnemy({ x: 0, y: 1 }, 30, 30, 5);

      const result = executeAttack(attackerWithWeapon, targetEnemy, false);

      expect(result.success).toBe(true);
      expect(result.damage).toBe(17); // 10 base + 3 weapon bonus + floor(8/2)=4 strength bonus
      expect(result.newTarget.health).toBe(targetEnemy.health - 17);
      expect(result.newAttacker.actionPoints).toBe(attackerWithWeapon.actionPoints - weapon.apCost);
    });

    test('player armor reduces incoming damage with minimum floor of one', () => {
      setRandomGenerator(() => 0.1);

      const armor = createArmor('Test Armor', 4, 5);
      const defenderWithArmor: Player = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
        equipped: {
          ...DEFAULT_PLAYER.equipped,
          armor,
        },
      };

      const attackingEnemy = createEnemy({ x: 0, y: 1 }, 25, 25, 5);
      attackingEnemy.damage = 6;

      const result = executeAttack(attackingEnemy, defenderWithArmor, false);

      expect(result.success).toBe(true);
      expect(result.damage).toBe(2); // 6 damage - 4 armor
      expect(result.newTarget.health).toBe(defenderWithArmor.health - 2);
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
        createEnemy({ x: 3, y: 3 }, 30, 30, 2), // Low AP
        createEnemy({ x: 4, y: 4 }, 30, 30, 3)  // Low AP
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
        createEnemy({ x: 3, y: 3 }, 30, 30, 0), // No AP left
        createEnemy({ x: 4, y: 4 }, 30, 30, 0)  // No AP left
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
    test('determineEnemyMove should attack if player is in range', () => {
      const enemyClose = createEnemy({ x: 2, y: 1 });
      setRandomGenerator(() => 0.1);
      const result = determineEnemyMove(
        enemyClose,
        player,
        mapArea,
        [enemyClose],
        []
      );
      expect(result.action).toBe('attack');
      expect(result.player.health).toBeLessThan(player.health);
    });

    test('determineEnemyMove should move towards player if out of range', () => {
      const enemyFar = createEnemy({ x: 5, y: 5 });
      const result = determineEnemyMove(
        enemyFar,
        player,
        mapArea,
        [enemyFar],
        []
      );
      expect(result.action).toBe('move');
      expect(result.enemy.position).not.toEqual(enemyFar.position);
    });

    test('determineEnemyMove should seek cover when wounded', () => {
      const woundedEnemy = createEnemy({ x: 5, y: 5 }, 5, 20); // Low health
      const coverPosition = { x: 3, y: 3 };
      mapArea.tiles[coverPosition.y][coverPosition.x].provideCover = true;

      const result = determineEnemyMove(
        woundedEnemy,
        player,
        mapArea,
        [woundedEnemy],
        [coverPosition]
      );

      expect(result.action).toBe('seek_cover');
      // This is a simplification; a real test would check if it moved *towards* cover.
      expect(result.enemy.position).not.toEqual(woundedEnemy.position);
    });

    test('determineEnemyMove should forfeit AP when no action is possible', () => {
      const blockedEnemy = {
        ...createEnemy({ x: 4, y: 4 }),
        actionPoints: 3,
        maxActionPoints: 3,
      };

      const isolatedPlayer = {
        ...DEFAULT_PLAYER,
        position: { x: 1, y: 1 },
      };

      const testMap = createBasicMapArea('Blocked Enemy', 6, 6);

      const adjacentOffsets: Position[] = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];

      adjacentOffsets.forEach(({ x, y }) => {
        const tile = testMap.tiles[blockedEnemy.position.y + y]?.[blockedEnemy.position.x + x];
        if (tile) {
          tile.isWalkable = false;
        }
      });

      const result = determineEnemyMove(
        blockedEnemy,
        isolatedPlayer,
        testMap,
        [blockedEnemy],
        []
      );

      expect(result.action).toBe('no_valid_move');
      expect(result.enemy.actionPoints).toBe(0);
    });
  });
});

describe('Combat derived stat influence', () => {
  test('calculateHitChance should increase with higher perception', () => {
    const baselinePlayer: Player = {
      ...DEFAULT_PLAYER,
      id: 'baseline-attacker',
      position: { x: 0, y: 0 },
      skills: {
        ...DEFAULT_PLAYER.skills,
        perception: 5,
      },
    };

    const focusedPlayer: Player = {
      ...baselinePlayer,
      id: 'focused-attacker',
      skills: {
        ...baselinePlayer.skills,
        perception: 9,
      },
    };

    const targetEnemy = createEnemy({ x: 1, y: 0 });

    const baseChance = calculateHitChance(baselinePlayer, targetEnemy, false);
    const boostedChance = calculateHitChance(focusedPlayer, targetEnemy, false);

    expect(boostedChance).toBeGreaterThan(baseChance);
  });

  test('calculateHitChance should decrease against agile targets', () => {
    const attacker: Player = {
      ...DEFAULT_PLAYER,
      id: 'attacker',
      position: { x: 0, y: 0 },
      skills: {
        ...DEFAULT_PLAYER.skills,
        perception: 7,
      },
    };

    const baselineTarget: Player = {
      ...DEFAULT_PLAYER,
      id: 'baseline-target',
      position: { x: 1, y: 0 },
      skills: {
        ...DEFAULT_PLAYER.skills,
        agility: 5,
      },
    };

    const agileTarget: Player = {
      ...baselineTarget,
      id: 'agile-target',
      skills: {
        ...baselineTarget.skills,
        agility: 9,
      },
    };

    const againstBaseline = calculateHitChance(attacker, baselineTarget, false);
    const againstAgile = calculateHitChance(attacker, agileTarget, false);

    expect(againstAgile).toBeLessThan(againstBaseline);
  });

  test('executeAttack should apply melee bonus from strength', () => {
    const lowStrengthAttacker: Player = {
      ...DEFAULT_PLAYER,
      id: 'low-strength',
      position: { x: 0, y: 0 },
      actionPoints: 6,
      skills: {
        ...DEFAULT_PLAYER.skills,
        strength: 4,
      },
    };

    const highStrengthAttacker: Player = {
      ...lowStrengthAttacker,
      id: 'high-strength',
      skills: {
        ...lowStrengthAttacker.skills,
        strength: 9,
      },
    };

    const targetA = createEnemy({ x: 1, y: 0 }, 30, 30, 5);
    const targetB = createEnemy({ x: 1, y: 0 }, 30, 30, 5);

    setRandomGenerator(() => 0.05);
    const lowResult = executeAttack(lowStrengthAttacker, targetA, false);

    setRandomGenerator(() => 0.05);
    const highResult = executeAttack(highStrengthAttacker, targetB, false);

    expect(highResult.damage).toBeGreaterThan(lowResult.damage);
  });
});
