import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import {
  calculateHitChance,
  executeAttack,
  setRandomGenerator,
  applyCoverStateFromTile,
} from '../combatSystem';
import { determineEnemyMove } from '../enemyAI';
import { createWeapon, createArmor } from '../../inventory/inventorySystem';
import { createBasicMapArea, setTileCoverProfile } from '../../world/grid';
import {
  DEFAULT_PLAYER,
  createDefaultPersonalityProfile,
} from '../../interfaces/player';
import { Enemy, MapArea, Player, Position } from '../../interfaces/types';

const clonePlayer = (overrides: Partial<Player> = {}): Player => {
  const base = JSON.parse(JSON.stringify(DEFAULT_PLAYER)) as Player;
  return {
    ...base,
    id: uuidv4(),
    personality: createDefaultPersonalityProfile(),
    ...overrides,
  };
};

const createEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  id: uuidv4(),
  name: 'Test Drone',
  position: { x: 2, y: 1 },
  health: 50,
  maxHealth: 50,
  actionPoints: 6,
  maxActionPoints: 6,
  damage: 8,
  attackRange: 1,
  isHostile: true,
  ...overrides,
});

const createArena = (): MapArea => createBasicMapArea('Test Arena', 6, 6);

const mockRandom = (values: number[]): void => {
  let index = 0;
  setRandomGenerator(() => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  });
};

describe('combatSystem core mechanics', () => {
  let player: Player;
  let enemy: Enemy;

  beforeEach(() => {
    player = clonePlayer({
      position: { x: 1, y: 1 },
      actionPoints: 10,
      maxActionPoints: 10,
    });
    enemy = createEnemy({ position: { x: 2, y: 1 } });
  });

  afterEach(() => {
    setRandomGenerator();
  });

  describe('calculateHitChance', () => {
    it('reduces hit chance with distance and cover', () => {
      const baseChance = calculateHitChance(player, enemy, false);
      const distantEnemy = createEnemy({ position: { x: 5, y: 1 } });
      const distantChance = calculateHitChance(player, distantEnemy, false);
      const coverChance = calculateHitChance(player, enemy, true);

      expect(baseChance).toBeCloseTo(0.6, 5);
      expect(distantChance).toBeLessThan(baseChance);
      expect(coverChance).toBeCloseTo(baseChance - 0.2, 5);
    });
  });

  describe('executeAttack', () => {
    it('applies weapon damage and attack point costs on a successful hit', () => {
      const rifle = createWeapon('Rifle', 20, 6, 4, 8);
      player.equipped.weapon = rifle;
      player.equippedSlots = { primaryWeapon: rifle };

      mockRandom([0.05, 0.95]);

      const result = executeAttack(player, enemy, false);

      expect(result.success).toBe(true);
      expect(result.damage).toBe(20);
      expect((result.newTarget as Enemy).health).toBe(enemy.health - 20);
      expect((result.newAttacker as Player).actionPoints).toBe(6);
      expect((result.newAttacker as Player).equipped.weapon?.durability?.current).toBe(
        (rifle.durability?.current ?? 0) - 1
      );
    });

    it('applies critical hits with 1.5x damage when the roll succeeds', () => {
      const pistol = createWeapon('Sidearm', 12, 4, 3, 4);
      player.equipped.weapon = pistol;
      player.equippedSlots = { primaryWeapon: pistol };

      // First roll hits, second roll triggers crit (base crit chance 25%)
      mockRandom([0.1, 0.1]);

      const result = executeAttack(player, enemy, false);

      expect(result.success).toBe(true);
      expect(result.isCritical).toBe(true);
      expect(result.damage).toBe(18);
      expect((result.newTarget as Enemy).health).toBe(enemy.health - 18);
    });

    it('accounts for defender armor and durability loss when targeting a player', () => {
      const hammer = createWeapon('Hammer', 15, 1, 3, 6, undefined, 'meleeCombat');
      player.equipped.weapon = hammer;
      player.equippedSlots = { primaryWeapon: hammer };

      const defenderArmor = createArmor('Guard Vest', 6, 5, undefined, {
        durability: { current: 20, max: 40 },
      });

      const defender = clonePlayer({
        position: { x: 2, y: 1 },
        equipped: {
          ...DEFAULT_PLAYER.equipped,
          bodyArmor: defenderArmor,
          armor: defenderArmor,
        },
        equippedSlots: { bodyArmor: defenderArmor },
        health: 80,
        maxHealth: 80,
      });

      mockRandom([0.05, 0.95]);

      const result = executeAttack(player, defender, false);
      const updatedDefender = result.newTarget as Player;
      const updatedArmor = updatedDefender.equipped.bodyArmor!;

      expect(result.success).toBe(true);
      expect(result.damage).toBeLessThan(hammer.damage);
      expect(updatedDefender.health).toBeLessThan(defender.health);
      expect(updatedArmor.durability.current).toBe(19);
    });
  });

  describe('directional cover scaffolding', () => {
    it('reduces accuracy and damage when attacking into fortified edge', () => {
      const rifle = createWeapon('Scoped Rifle', 20, 6, 4, 6);

      const attacker = applyCoverStateFromTile(
        clonePlayer({
          position: { x: 2, y: 0 },
          equipped: { ...DEFAULT_PLAYER.equipped, weapon: rifle },
          equippedSlots: { primaryWeapon: rifle },
        })
      );

      let coverMap = createBasicMapArea('Cover Map', 5, 5);
      coverMap = setTileCoverProfile(coverMap, { x: 2, y: 2 }, { north: 'full' });

      const defenderWithCover = applyCoverStateFromTile(
        clonePlayer({ position: { x: 2, y: 2 } }),
        coverMap
      );

      const openMap = createBasicMapArea('Open Map', 5, 5);
      const defenderExposed = clonePlayer({ position: { x: 2, y: 2 } });

      const coveredChance = calculateHitChance(attacker, defenderWithCover, { mapArea: coverMap });
      const exposedChance = calculateHitChance(attacker, defenderExposed, { mapArea: openMap });

      expect(coveredChance).toBeLessThan(exposedChance);

      setRandomGenerator(() => 0.05);
      const result = executeAttack(attacker, defenderWithCover, { mapArea: coverMap });

      expect(result.success).toBe(true);
      expect(result.damage).toBeLessThan(20);
      expect((result.newAttacker as Player).facing).toBe('south');
    });
  });

  describe('determineEnemyMove', () => {
    it('attacks the player when in range and reduces player health', () => {
      const mapArea = createArena();
      const coverPositions: Position[] = [];

      mockRandom([0.05]); // Enemy attack hits

      const outcome = determineEnemyMove(
        enemy,
        player,
        mapArea,
        [enemy],
        coverPositions
      );

      expect(outcome.action).toBe('attack');
      expect(outcome.player.health).toBeLessThan(player.health);
      expect(outcome.enemy.actionPoints).toBeLessThan(enemy.actionPoints);
    });
  });
});
