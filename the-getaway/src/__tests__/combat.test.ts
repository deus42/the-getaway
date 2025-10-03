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
      const attackRolls = [0.1, 0.9];
      let rollIndex = 0;
      setRandomGenerator(() => {
        const roll = attackRolls[Math.min(rollIndex, attackRolls.length - 1)];
        rollIndex += 1;
        return roll;
      });
      
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
          perception: 1,
          luck: 1,
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

  describe('Perk Effects', () => {
    test('Steady Hands increases hit chance with ranged weapons', () => {
      const rifle = createWeapon('Test Rifle', 8, 6, 2, 3);

      const basePlayer: Player = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
        equipped: {
          ...DEFAULT_PLAYER.equipped,
          weapon: rifle,
        },
      };

      const perkedPlayer: Player = {
        ...basePlayer,
        perks: [...basePlayer.perks, 'steadyHands'],
      };

      const targetEnemy = createEnemy({ x: 3, y: 0 });

      const baseChance = calculateHitChance(basePlayer, targetEnemy, false);
      const perkChance = calculateHitChance(perkedPlayer, targetEnemy, false);

      expect(perkChance).toBeGreaterThan(baseChance);
    });

    test('Gun Fu makes the first shot each turn cost 0 AP', () => {
      setRandomGenerator(() => 0.1);

      const pistol = createWeapon('Test Pistol', 6, 4, 2, 1.5);
      const gunFuPlayer: Player = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
        actionPoints: 4,
        maxActionPoints: 4,
        perks: [...DEFAULT_PLAYER.perks, 'gunFu'],
        perkRuntime: {
          ...DEFAULT_PLAYER.perkRuntime,
          gunFuShotsThisTurn: 0,
        },
        equipped: {
          ...DEFAULT_PLAYER.equipped,
          weapon: pistol,
        },
      };

      const targetEnemy = createEnemy({ x: 1, y: 0 });

      const firstAttack = executeAttack(gunFuPlayer, targetEnemy, false);
      expect(firstAttack.success).toBe(true);
      expect((firstAttack.newAttacker as Player).actionPoints).toBe(gunFuPlayer.actionPoints);

      const secondAttack = executeAttack(firstAttack.newAttacker as Player, targetEnemy, false);
      expect((secondAttack.newAttacker as Player).actionPoints).toBe(
        (firstAttack.newAttacker as Player).actionPoints - pistol.apCost
      );
    });

    test('Executioner forces critical hits against weakened enemies', () => {
      const attackRolls = [0.1, 0.9];
      let rollIndex = 0;
      setRandomGenerator(() => {
        const roll = attackRolls[Math.min(rollIndex, attackRolls.length - 1)];
        rollIndex += 1;
        return roll;
      });

      const rifle = createWeapon('Test Rifle', 10, 5, 3, 2.5);
      const executioner: Player = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
        perks: [...DEFAULT_PLAYER.perks, 'executioner'],
        equipped: {
          ...DEFAULT_PLAYER.equipped,
          weapon: rifle,
        },
      };

      const woundedEnemy = createEnemy({ x: 1, y: 0 }, 4, 20);

      const result = executeAttack(executioner, woundedEnemy, false);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(rifle.damage);
      expect(result.damage).toBe(Math.round(rifle.damage * 1.5));
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

    test('determineEnemyMove navigates around obstacles to approach player', () => {
      const obstacleMap = createBasicMapArea('Obstacle Map', 8, 8);

      const blockerCoords: Position[] = [
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 4 },
        { x: 4, y: 5 },
      ];

      blockerCoords.forEach(({ x, y }) => {
        obstacleMap.tiles[y][x].isWalkable = false;
      });

      const routedEnemy = createEnemy({ x: 3, y: 5 });
      const routedPlayer: Player = {
        ...player,
        position: { x: 3, y: 2 },
      };

      const result = determineEnemyMove(
        routedEnemy,
        routedPlayer,
        obstacleMap,
        [routedEnemy],
        []
      );

      expect(result.action).toBe('move');
      expect(result.enemy.position).toEqual({ x: 2, y: 5 });
      expect(result.enemy.actionPoints).toBe(routedEnemy.actionPoints - 1);
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

describe('Skill tree integration', () => {
  test('small guns training increases ranged hit chance', () => {
    const attacker: Player = {
      ...DEFAULT_PLAYER,
      position: { x: 0, y: 0 },
      equipped: {
        ...DEFAULT_PLAYER.equipped,
        weapon: createWeapon('Test Pistol', 10, 6, 2, 2, undefined, 'smallGuns'),
      },
    };

    const target = createEnemy({ x: 2, y: 0 });

    const baseChance = calculateHitChance(attacker, target, false);

    const trainedAttacker: Player = {
      ...attacker,
      skillTraining: {
        ...attacker.skillTraining,
        smallGuns: 50,
      },
    };

    const trainedChance = calculateHitChance(trainedAttacker, target, false);

    expect(trainedChance).toBeGreaterThan(baseChance);
    expect(trainedChance - baseChance).toBeCloseTo(0.25, 1); // +25% from 50 points
  });

  test('melee combat training adds bonus damage', () => {
    const weapon = createWeapon('Combat Knife', 8, 1, 2, 1, undefined, 'meleeCombat');

    const baselineAttacker: Player = {
      ...DEFAULT_PLAYER,
      equipped: {
        ...DEFAULT_PLAYER.equipped,
        weapon,
      },
    };

    const trainedAttacker: Player = {
      ...baselineAttacker,
      skillTraining: {
        ...baselineAttacker.skillTraining,
        meleeCombat: 35,
      },
    };

    const expectedBonus = Math.floor(35 / 10); // +3 damage from skill training

    let rollIndex = 0;
    const baseRolls = [0.1, 0.9];
    setRandomGenerator(() => {
      const roll = baseRolls[Math.min(rollIndex, baseRolls.length - 1)];
      rollIndex += 1;
      return roll;
    });
    const baselineResult = executeAttack(
      baselineAttacker,
      createEnemy({ x: 0, y: 1 }, 40, 40, 5),
      false
    );

    rollIndex = 0;
    const trainedRolls = [0.1, 0.9];
    setRandomGenerator(() => {
      const roll = trainedRolls[Math.min(rollIndex, trainedRolls.length - 1)];
      rollIndex += 1;
      return roll;
    });
    const trainedResult = executeAttack(
      trainedAttacker,
      createEnemy({ x: 0, y: 1 }, 40, 40, 5),
      false
    );

    expect(trainedResult.success).toBe(true);
    expect(trainedResult.damage - baselineResult.damage).toBe(expectedBonus);
  });

  test('energy weapon training boosts critical chance', () => {
    const laserRifle = createWeapon('Laser Rifle', 14, 8, 3, 4, undefined, 'energyWeapons');
    const attacker: Player = {
      ...DEFAULT_PLAYER,
      skills: {
        ...DEFAULT_PLAYER.skills,
        perception: 7,
        luck: 7,
      },
      skillTraining: {
        ...DEFAULT_PLAYER.skillTraining,
        energyWeapons: 100,
      },
      equipped: {
        ...DEFAULT_PLAYER.equipped,
        weapon: laserRifle,
      },
      actionPoints: 10,
      maxActionPoints: 10,
    };

    const target = createEnemy({ x: 0, y: 1 }, 60, 60, 5);

    const rolls = [0.1, 0.05];
    let rollIndex = 0;
    setRandomGenerator(() => {
      const roll = rolls[Math.min(rollIndex, rolls.length - 1)];
      rollIndex += 1;
      return roll;
    });

    const result = executeAttack(attacker, target, false);

    expect(result.success).toBe(true);
    expect(result.damage).toBeGreaterThan(laserRifle.damage);
    expect(result.damage).toBe(Math.round(laserRifle.damage * 1.5));
  });
});
