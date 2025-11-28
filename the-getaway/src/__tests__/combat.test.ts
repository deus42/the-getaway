import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { Player, Enemy, Position, Weapon, AlertLevel } from '../game/interfaces/types';
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
import { DEFAULT_GUARD_ARCHETYPE_ID } from '../content/ai/guardArchetypes';
import { createWeapon, createArmor } from '../game/inventory/inventorySystem';

function createEnemy(
  position: Position,
  health: number = 20,
  maxHealth: number = 20,
  actionPoints: number = 5,
  overrides: Partial<Enemy> = {}
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
    visionCone: {
      range: 8,
      angle: 360,
      direction: 0,
    },
    alertLevel: AlertLevel.IDLE,
    alertProgress: 0,
    lastKnownPlayerPosition: null,
    aiProfileId: DEFAULT_GUARD_ARCHETYPE_ID,
    aiState: 'patrol',
    aiCooldowns: {},
    ...overrides,
  };
}

function createPlayerClone(): Player {
  const base = JSON.parse(JSON.stringify(DEFAULT_PLAYER)) as Player;
  base.id = uuidv4();
  base.position = { x: 1, y: 1 };
  base.health = base.maxHealth;
  base.actionPoints = base.maxActionPoints;
  base.inventory = {
    items: [],
    maxWeight: DEFAULT_PLAYER.inventory.maxWeight,
    currentWeight: 0,
    hotbar: [null, null, null, null, null],
  };
  base.equipped = {
    weapon: undefined,
    armor: undefined,
    accessory: undefined,
    secondaryWeapon: undefined,
    meleeWeapon: undefined,
    bodyArmor: undefined,
    helmet: undefined,
    accessory1: undefined,
    accessory2: undefined,
  };
  base.equippedSlots = {};
  return base;
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

  describe('Durability interactions', () => {
    test('weapon durability reduces outgoing damage', () => {
      const weapon = createWeapon('Aged Rifle', 20, 5, 2, 5);
      weapon.durability = { current: 30, max: 100 };
      player.equipped.weapon = weapon;
      player.equippedSlots = { primaryWeapon: weapon };

      const attackRolls = [0.1, 0.9];
      let rollIndex = 0;
      setRandomGenerator(() => {
        const roll = attackRolls[Math.min(rollIndex, attackRolls.length - 1)];
        rollIndex += 1;
        return roll;
      });

      const targetEnemy = createEnemy({ x: 1, y: 2 });
      const result = executeAttack(player, targetEnemy, false);

      expect(result.success).toBe(true);
      expect(result.damage).toBe(18);
      const updatedWeapon = (result.newAttacker as Player).equipped.weapon;
      expect(updatedWeapon?.durability?.current).toBe(29);
    });

    test('weapon durability warnings trigger events when condition critical', () => {
      const weapon = createWeapon('Stressed Pistol', 10, 5, 1, 2);
      weapon.durability = { current: 26, max: 100 };
      player.equipped.weapon = weapon;
      player.equippedSlots = { primaryWeapon: weapon };

      setRandomGenerator(() => 0.1);

      const result = executeAttack(player, enemy, false);

      expect(result.events?.some((event) => event.type === 'weaponDamaged')).toBe(true);
      const updatedWeapon = (result.newAttacker as Player).equipped.weapon;
      expect(updatedWeapon?.durability?.current).toBe(25);
    });

    test('armor durability reduces mitigation and decays on hit', () => {
      const weapon = createWeapon('Heavy Hammer', 20, 1, 2, 8);
      player.equipped.weapon = weapon;
      player.equippedSlots = { primaryWeapon: weapon };

      const armor = createArmor('Guard Vest', 12, 5);
      armor.durability = { current: 26, max: 100 };

      const defendingPlayer: Player = {
        ...DEFAULT_PLAYER,
        position: { x: 1, y: 2 },
        equipped: {
          ...DEFAULT_PLAYER.equipped,
          bodyArmor: armor,
          armor,
        },
        equippedSlots: { bodyArmor: armor },
      };

      const attackRolls = [0.1, 0.9];
      let rollIndex = 0;
      setRandomGenerator(() => {
        const roll = attackRolls[Math.min(rollIndex, attackRolls.length - 1)];
        rollIndex += 1;
        return roll;
      });

      const result = executeAttack(player, defendingPlayer, false);

      expect(result.success).toBe(true);
      const updatedDefender = result.newTarget as Player;
      expect(updatedDefender.health).toBe(defendingPlayer.health - 11);
      expect(updatedDefender.equipped.bodyArmor?.durability?.current).toBe(25);
      expect(result.events?.some((event) => event.type === 'armorDamaged')).toBe(true);
    });

    test('attacks with broken weapons emit blocking event', () => {
      const brokenWeapon = createWeapon('Snapped Baton', 6, 1, 1, 3);
      brokenWeapon.durability = { current: 0, max: 40 };
      player.equipped.weapon = brokenWeapon;
      player.equippedSlots = { primaryWeapon: brokenWeapon };

      const result = executeAttack(player, enemy, false);

      expect(result.success).toBe(false);
      expect(result.damage).toBe(0);
      expect(result.events?.some((event) => event.type === 'weaponBroken')).toBe(true);
    });
  });

  describe('Encumbrance integration', () => {
    test('movement blocked when encumbrance level is immobile', () => {
      const encumberedPlayer: Player = {
        ...DEFAULT_PLAYER,
        position: { x: 2, y: 2 },
        encumbrance: {
          level: 'immobile',
          percentage: 140,
          movementApMultiplier: Number.POSITIVE_INFINITY,
          attackApMultiplier: Number.POSITIVE_INFINITY,
        },
      };

      const area = createBasicMapArea('Encumbrance Test', 6, 6);

      expect(
        canMoveToPosition(encumberedPlayer, { x: 3, y: 2 }, area, encumberedPlayer, [])
      ).toBe(false);

      const moveResult = executeMove(encumberedPlayer, { x: 3, y: 2 });
      expect(moveResult).toBe(encumberedPlayer);
    });

    test('attack costs scale with encumbrance multipliers', () => {
      const weapon = createWeapon('Standard Pistol', 8, 5, 2, 2);
      player.equipped.weapon = weapon;
      player.equippedSlots = { primaryWeapon: weapon };
      player.actionPoints = 10;
      player.encumbrance = {
        level: 'heavy',
        percentage: 90,
        movementApMultiplier: 1.25,
        attackApMultiplier: 2,
      };

      setRandomGenerator(() => 0.1);

      const result = executeAttack(player, enemy, false);

      expect(result.success).toBe(true);
      expect((result.newAttacker as Player).actionPoints).toBe(6);
    });
  });

  describe('Weapon trait interactions', () => {
    const buildAttacker = (weapon: Weapon) => {
      const attacker = createPlayerClone();
      attacker.equipped.weapon = weapon;
      attacker.equippedSlots = { primaryWeapon: weapon };
      return attacker;
    };

    const buildArmoredDefender = () => {
      const defender = createPlayerClone();
      defender.position = { x: 1, y: 2 };
      defender.health = 60;
      defender.maxHealth = 60;
      const armor = createArmor('Composite Vest', 8, 8);
      defender.equipped.bodyArmor = armor;
      defender.equipped.armor = armor;
      defender.equippedSlots = { bodyArmor: armor };
      return defender;
    };

    test('energy weapons ignore armor mitigation', () => {
      setRandomGenerator(() => 0.1);

      const standardWeapon = createWeapon('Service Rifle', 18, 6, 2, 5, undefined, 'smallGuns', {
        durability: { max: 100, current: 100 },
      });
      const energyWeapon = createWeapon('Plasma Pistol', 18, 6, 2, 4, undefined, 'energyWeapons', {
        durability: { max: 100, current: 100 },
        tags: ['energy'],
      });

      const standardAttacker = buildAttacker(standardWeapon);
      const energyAttacker = buildAttacker(energyWeapon);

      const standardDefender = buildArmoredDefender();
      const energyDefender = buildArmoredDefender();

      const standardResult = executeAttack(standardAttacker, standardDefender, false);
      const energyResult = executeAttack(energyAttacker, energyDefender, false);

      expect(energyResult.damage).toBeGreaterThan(standardResult.damage);
    });

    test('armor-piercing rounds reduce armor effectiveness', () => {
      setRandomGenerator(() => 0.1);

      const baseWeapon = createWeapon('Slug Rifle', 16, 7, 2, 6, undefined, 'smallGuns', {
        durability: { max: 100, current: 100 },
      });
      const apWeapon = createWeapon('AP Rifle', 16, 7, 2, 6, undefined, 'smallGuns', {
        durability: { max: 100, current: 100 },
        tags: ['armorPiercing'],
      });

      const baseAttacker = buildAttacker(baseWeapon);
      const apAttacker = buildAttacker(apWeapon);

      const baseDefender = buildArmoredDefender();
      const apDefender = buildArmoredDefender();

      const baseResult = executeAttack(baseAttacker, baseDefender, false);
      const apResult = executeAttack(apAttacker, apDefender, false);

      expect(apResult.damage).toBeGreaterThan(baseResult.damage);
    });

    test('hollow-point rounds adjust damage based on armor presence', () => {
      setRandomGenerator(() => 0.1);

      const standardWeapon = createWeapon('Service Pistol', 12, 6, 2, 3, undefined, 'smallGuns', {
        durability: { max: 100, current: 100 },
      });
      const hollowWeapon = createWeapon('Hollow Point Pistol', 12, 6, 2, 3, undefined, 'smallGuns', {
        durability: { max: 100, current: 100 },
        tags: ['hollowPoint'],
      });

      const standardEnemy = createEnemy({ x: 1, y: 2 });
      const hollowEnemy = createEnemy({ x: 1, y: 2 });

      const standardAttacker = buildAttacker(standardWeapon);
      const hollowAttacker = buildAttacker(hollowWeapon);

      const standardVsUnarmored = executeAttack(standardAttacker, standardEnemy, false);
      const hollowVsUnarmored = executeAttack(hollowAttacker, hollowEnemy, false);

      expect(hollowVsUnarmored.damage).toBeGreaterThan(standardVsUnarmored.damage);

      const armoredStandardAttacker = buildAttacker(
        createWeapon('Service Pistol', 12, 6, 2, 3, undefined, 'smallGuns', {
          durability: { max: 100, current: 100 },
        })
      );
      const armoredHollowAttacker = buildAttacker(
        createWeapon('Hollow Point Pistol', 12, 6, 2, 3, undefined, 'smallGuns', {
          durability: { max: 100, current: 100 },
          tags: ['hollowPoint'],
        })
      );

      const armoredDefenderStandard = buildArmoredDefender();
      const armoredDefenderHollow = buildArmoredDefender();

      const standardVsArmored = executeAttack(armoredStandardAttacker, armoredDefenderStandard, false);
      const hollowVsArmored = executeAttack(armoredHollowAttacker, armoredDefenderHollow, false);

      expect(hollowVsArmored.damage).toBeLessThan(standardVsArmored.damage);
    });

    test('silenced weapons suppress weapon noise events', () => {
      setRandomGenerator(() => 0.1);

      const loudWeapon = createWeapon('Loud Pistol', 10, 6, 2, 3, undefined, 'smallGuns', {
        durability: { max: 100, current: 100 },
      });
      const silencedWeapon = createWeapon('Suppressed Pistol', 10, 6, 2, 3, undefined, 'smallGuns', {
        durability: { max: 100, current: 100 },
        tags: ['silenced'],
      });

      const loudAttacker = buildAttacker(loudWeapon);
      const silencedAttacker = buildAttacker(silencedWeapon);

      const loudTarget = createEnemy({ x: 1, y: 2 });
      const silentTarget = createEnemy({ x: 1, y: 2 });

      const loudResult = executeAttack(loudAttacker, loudTarget, false);
      expect(loudResult.events?.some((event) => event.type === 'weaponNoise')).toBe(true);

      const silentResult = executeAttack(silencedAttacker, silentTarget, false);
      expect(silentResult.events?.some((event) => event.type === 'weaponNoise')).toBeFalsy();
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
      const enemyClose = createEnemy(
        { x: 2, y: 1 },
        20,
        20,
        5,
        {
          alertLevel: AlertLevel.ALARMED,
          alertProgress: 100,
          aiState: 'attack',
        }
      );
      setRandomGenerator(() => 0.1);
      const result = determineEnemyMove(
        enemyClose,
        player,
        mapArea,
        [enemyClose],
        [],
        [],
        0
      );
      expect(['attack', 'move']).toContain(result.action);
      if (result.action === 'attack') {
        expect(result.player.health).toBeLessThan(player.health);
      }
    });

    test('determineEnemyMove should move towards player if out of range', () => {
      const enemyFar = createEnemy({ x: 5, y: 5 });
      const startingPosition = { ...enemyFar.position };
      const result = determineEnemyMove(
        enemyFar,
        player,
        mapArea,
        [enemyFar],
        [],
        [],
        0
      );
      expect(result.action).toBe('move');
      expect(result.enemy.position).not.toEqual(startingPosition);
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
        [],
        [],
        0
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
        [coverPosition],
        [],
        0
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
        [],
        [],
        0
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

    const meleeWeaponLow = createWeapon('Training Blade', 6, 1, 2, 1, undefined, 'meleeCombat');
    const meleeWeaponHigh = { ...meleeWeaponLow, id: uuidv4() };
    lowStrengthAttacker.equipped.weapon = meleeWeaponLow;
    lowStrengthAttacker.equippedSlots = { primaryWeapon: meleeWeaponLow };
    highStrengthAttacker.equipped.weapon = meleeWeaponHigh;
    highStrengthAttacker.equippedSlots = { primaryWeapon: meleeWeaponHigh };

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
