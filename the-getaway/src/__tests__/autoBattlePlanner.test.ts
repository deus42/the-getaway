import { planAutoBattleAction } from '../game/combat/automation/autoBattlePlanner';
import { AUTO_BATTLE_PROFILES } from '../game/combat/automation/autoBattleProfiles';
import { createBasicMapArea } from '../game/world/grid';
import { initialPlayerState } from '../store/playerSlice';
import type { Player, Enemy, MapArea, Position, Weapon } from '../game/interfaces/types';
import { AlertLevel } from '../game/interfaces/types';
import { DEFAULT_GUARD_ARCHETYPE_ID } from '../content/ai/guardArchetypes';
import { v4 as uuidv4 } from 'uuid';

const clonePlayer = (overrides: Partial<Player>): Player => {
  const base = JSON.parse(JSON.stringify(initialPlayerState.data)) as Player;
  return {
    ...base,
    ...overrides,
    position: { ...base.position, ...(overrides.position ?? {}) },
    equipped: {
      ...base.equipped,
      ...(overrides.equipped ?? {}),
    },
  };
};

const createEnemy = (position: Position, overrides: Partial<Enemy> = {}): Enemy => ({
  id: overrides.id ?? uuidv4(),
  name: overrides.name ?? 'Test Enemy',
  position,
  facing: overrides.facing ?? 'south',
  coverOrientation: overrides.coverOrientation ?? null,
  suppression: overrides.suppression ?? 0,
  maxHealth: overrides.maxHealth ?? 40,
  health: overrides.health ?? 40,
  actionPoints: overrides.actionPoints ?? 4,
  maxActionPoints: overrides.maxActionPoints ?? 4,
  damage: overrides.damage ?? 6,
  attackRange: overrides.attackRange ?? 2,
  isHostile: true,
  visionCone: overrides.visionCone ?? {
    range: 8,
    angle: 360,
    direction: 0,
  },
  alertLevel: overrides.alertLevel ?? AlertLevel.IDLE,
  alertProgress: overrides.alertProgress ?? 0,
  lastKnownPlayerPosition: overrides.lastKnownPlayerPosition ?? null,
  aiProfileId: overrides.aiProfileId ?? DEFAULT_GUARD_ARCHETYPE_ID,
  aiState: overrides.aiState ?? 'patrol',
  aiCooldowns: overrides.aiCooldowns ?? {},
});

const buildMap = (): MapArea => createBasicMapArea('Planner Test', 7, 7);

const buildTestWeapon = (overrides: Partial<Weapon> = {}): Weapon => ({
  id: 'weapon-test',
  name: 'Automation Harness',
  description: 'Stub weapon for AutoBattle planner tests.',
  weight: 2,
  value: 0,
  isQuestItem: false,
  slot: 'weapon',
  damage: 8,
  range: 2,
  apCost: 2,
  skillType: 'smallGuns',
  ...overrides,
});

describe('autoBattlePlanner', () => {
  it('prefers attacking when an enemy is in range for balanced profile', () => {
    const map = buildMap();
    const player = clonePlayer({
      position: { x: 3, y: 3 },
      actionPoints: 4,
      maxActionPoints: 4,
      health: 65,
      maxHealth: 80,
      equipped: {
        ...initialPlayerState.data.equipped,
        weapon: buildTestWeapon({ id: 'pistol', name: 'Test Pistol', damage: 12, range: 3, apCost: 2 }),
      },
    });
    const enemy = createEnemy({ x: 3, y: 4 });

    const decision = planAutoBattleAction({
      player,
      enemies: [enemy],
      map,
      profile: AUTO_BATTLE_PROFILES.balanced,
    });

    expect(decision.type).toBe('attack');
    if (decision.type === 'attack') {
      expect(decision.targetId).toBe(enemy.id);
    }
  });

  it('seeks cover when low on health for defensive profile', () => {
    const map = buildMap();
    map.tiles[2][3] = {
      ...map.tiles[2][3],
      isWalkable: true,
      provideCover: true,
      cover: { north: 'full', south: 'full', east: 'full', west: 'full' },
    };

    const player = clonePlayer({
      position: { x: 3, y: 3 },
      actionPoints: 3,
      maxActionPoints: 4,
      health: 15,
      maxHealth: 80,
      equipped: {
        ...initialPlayerState.data.equipped,
        weapon: buildTestWeapon({ id: 'rifle', name: 'Test Rifle', damage: 18, range: 4, apCost: 3 }),
      },
    });
    const enemy = createEnemy({ x: 3, y: 5 });

    const decision = planAutoBattleAction({
      player,
      enemies: [enemy],
      map,
      profile: AUTO_BATTLE_PROFILES.defensive,
    });

    expect(decision.type).toBe('move');
    if (decision.type === 'move') {
      expect(decision.destination).toEqual({ x: 3, y: 2 });
      expect(decision.coverGain).toBeGreaterThan(0);
    }
  });

  it('advances toward targets aggressively when out of range', () => {
    const map = buildMap();
    const player = clonePlayer({
      position: { x: 3, y: 3 },
      actionPoints: 4,
      maxActionPoints: 4,
      health: 60,
      maxHealth: 80,
      equipped: {
        ...initialPlayerState.data.equipped,
        weapon: buildTestWeapon({ id: 'smg', name: 'Test SMG', damage: 10, range: 1 }),
      },
    });
    const enemy = createEnemy({ x: 5, y: 3 });

    const decision = planAutoBattleAction({
      player,
      enemies: [enemy],
      map,
      profile: AUTO_BATTLE_PROFILES.aggressive,
    });

    expect(decision.type).toBe('move');
    if (decision.type === 'move') {
      expect(decision.destination.x).toBeGreaterThan(player.position.x);
      expect(decision.distanceToNearestEnemy).toBeLessThan(
        Math.abs(enemy.position.x - player.position.x) + Math.abs(enemy.position.y - player.position.y)
      );
    }
  });
});
