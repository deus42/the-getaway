import type { Enemy, MapArea, Player, VisionCone } from '../game/interfaces/types';
import { AlertLevel } from '../game/interfaces/types';

jest.mock('../game/combat/perception', () => {
  const actual = jest.requireActual('../game/combat/perception');
  return {
    ...actual,
    isPlayerVisible: jest.fn(),
    updateEnemyAlert: jest.fn((enemy: Enemy, visible: boolean) => ({
      ...enemy,
      alertLevel: visible ? AlertLevel.ALARMED : AlertLevel.SUSPICIOUS,
    })),
    updateVisionDirection: jest.fn((enemy: Enemy, position: Player['position']) => ({
      ...enemy,
      visionCone: enemy.visionCone
        ? { ...enemy.visionCone, direction: position.x + position.y }
        : enemy.visionCone,
    })),
    PERCEPTION_CONFIG: {
      reinforcementDelay: 9000,
    },
  };
});

import { processPerceptionUpdates, getAlertMessageKey, shouldSpawnReinforcements, getReinforcementDelay } from '../game/combat/perceptionManager';
import * as perceptionModule from '../game/combat/perception';

const perception = perceptionModule as jest.Mocked<typeof perceptionModule>;

describe('perceptionManager', () => {
  const mockVisionCone: VisionCone = { range: 5, angle: 90, direction: 0 };

  const baseEnemy: Enemy = {
    id: 'enemy-1',
    name: 'Guard',
    position: { x: 0, y: 0 },
    health: 10,
    maxHealth: 10,
    actionPoints: 6,
    maxActionPoints: 6,
    damage: 2,
    attackRange: 3,
    isHostile: true,
    visionCone: mockVisionCone,
    alertLevel: AlertLevel.IDLE,
  };

  const player: Player = {
    id: 'player-1',
    name: 'Runner',
    position: { x: 1, y: 1 },
    health: 30,
    maxHealth: 30,
    actionPoints: 6,
    maxActionPoints: 6,
    damage: 2,
    attackRange: 3,
    isHostile: false,
    skills: {
      strength: 5,
      perception: 5,
      endurance: 5,
      charisma: 5,
      intelligence: 5,
      agility: 5,
      luck: 5,
    },
    skillTraining: {},
    taggedSkillIds: [],
    level: 1,
    experience: 0,
    credits: 0,
    skillPoints: 0,
    attributePoints: 0,
    inventory: {
      items: [],
      maxWeight: 20,
      currentWeight: 0,
      hotbar: [null, null, null, null, null],
    },
    equipped: {},
    perks: [],
    factionReputation: {
      resistance: 0,
      corpsec: 0,
      scavengers: 0,
    },
    personality: {
      dominantTrait: 'earnest',
      flags: {
        earnest: 0,
        sarcastic: 0,
        ruthless: 0,
        stoic: 0,
      },
    },
    perkRuntime: {
      gunFuShotsThisTurn: 0,
      adrenalineRushTurnsRemaining: 0,
      ghostInvisibilityTurns: 0,
      ghostConsumed: false,
    },
    encumbrance: {
      level: 'normal',
      percentage: 0,
      movementApMultiplier: 1,
      attackApMultiplier: 1,
    },
    stamina: 100,
    maxStamina: 100,
    isExhausted: false,
    isCrouching: false,
    backgroundId: undefined,
    appearancePreset: undefined,
    equippedSlots: {},
    activeWeaponSlot: 'primaryWeapon',
    pendingPerkSelections: 0,
    karma: 0,
  };

  const mapArea: MapArea = {
    id: 'area-1',
    name: 'Test',
    zoneId: 'zone-1',
    width: 10,
    height: 10,
    tiles: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ({ type: 'floor' } as any))),
    entities: {
      enemies: [],
      npcs: [],
      items: [],
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ignores enemies without vision cones', () => {
    const enemies = [{ ...baseEnemy, id: 'no-vision', visionCone: undefined }];
    perception.isPlayerVisible.mockReturnValue(false);

    const { updatedEnemies, maxAlertLevel } = processPerceptionUpdates(enemies, player, mapArea);

    expect(updatedEnemies[0]).toEqual(enemies[0]);
    expect(maxAlertLevel).toBe(AlertLevel.IDLE);
    expect(perception.updateEnemyAlert).not.toHaveBeenCalled();
  });

  it('updates alert state and direction when player visible', () => {
    const enemies = [{ ...baseEnemy }];
    perception.isPlayerVisible.mockReturnValue(true);

    const { updatedEnemies, maxAlertLevel } = processPerceptionUpdates(enemies, player, mapArea);

    expect(perception.updateEnemyAlert).toHaveBeenCalledWith(enemies[0], true);
    expect(perception.updateVisionDirection).toHaveBeenCalledWith(expect.any(Object), player.position);
    expect(updatedEnemies[0].lastKnownPlayerPosition).toEqual(player.position);
    expect(maxAlertLevel).toBe(AlertLevel.ALARMED);
  });

  it('tracks highest alert state across enemies', () => {
    const enemies = [
      { ...baseEnemy, id: 'enemy-1' },
      { ...baseEnemy, id: 'enemy-2' },
    ];
    perception.isPlayerVisible.mockImplementation((enemy: Enemy) => enemy.id === 'enemy-2');

    const { maxAlertLevel } = processPerceptionUpdates(enemies, player, mapArea);

    expect(maxAlertLevel).toBe(AlertLevel.ALARMED);
  });

  it('returns alert message keys when level increases', () => {
    expect(getAlertMessageKey(AlertLevel.IDLE, AlertLevel.SUSPICIOUS)).toBe('alertSuspicious');
    expect(getAlertMessageKey(AlertLevel.SUSPICIOUS, AlertLevel.INVESTIGATING)).toBe('alertInvestigating');
    expect(getAlertMessageKey(AlertLevel.INVESTIGATING, AlertLevel.ALARMED)).toBe('alertAlarmed');
    expect(getAlertMessageKey(AlertLevel.ALARMED, AlertLevel.ALARMED)).toBeNull();
  });

  it('decides when to spawn reinforcements', () => {
    expect(shouldSpawnReinforcements(AlertLevel.ALARMED, false)).toBe(true);
    expect(shouldSpawnReinforcements(AlertLevel.ALARMED, true)).toBe(false);
    expect(shouldSpawnReinforcements(AlertLevel.SUSPICIOUS, false)).toBe(false);
  });

  it('returns reinforcement delay from config', () => {
    expect(getReinforcementDelay()).toBe(9000);
  });
});
