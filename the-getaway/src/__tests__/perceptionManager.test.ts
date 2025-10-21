import type { Enemy, MapArea, Player, VisionCone } from '../game/interfaces/types';
import { AlertLevel } from '../game/interfaces/types';
import { DEFAULT_PLAYER } from '../game/interfaces/player';
import { createBasicMapArea } from '../game/world/grid';

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
  const cloneDefault = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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
    facing: 'north',
    coverOrientation: null,
    suppression: 0,
    visionCone: mockVisionCone,
    alertLevel: AlertLevel.IDLE,
    alertProgress: 0,
  };

  const player: Player = {
    ...cloneDefault(DEFAULT_PLAYER),
    id: 'player-1',
    position: { x: 1, y: 1 },
    health: 30,
    maxHealth: 30,
    actionPoints: 6,
    maxActionPoints: 6,
    inventory: {
      ...cloneDefault(DEFAULT_PLAYER.inventory),
      maxWeight: 20,
      currentWeight: 0,
    },
  };

  const mapArea: MapArea = createBasicMapArea('Test', 10, 10, { zoneId: 'zone-1' });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ignores enemies without vision cones', () => {
    const enemies = [{ ...baseEnemy, id: 'no-vision', visionCone: undefined }];
    perception.isPlayerVisible.mockReturnValue(false);

    const { updatedEnemies, maxAlertLevel, guardPerception } = processPerceptionUpdates(
      enemies,
      player,
      mapArea
    );

    expect(updatedEnemies[0]).toEqual(enemies[0]);
    expect(maxAlertLevel).toBe(AlertLevel.IDLE);
    expect(perception.updateEnemyAlert).not.toHaveBeenCalled();
    expect(guardPerception).toHaveLength(1);
    expect(guardPerception[0].playerVisible).toBe(false);
  });

  it('updates alert state and direction when player visible', () => {
    const enemies = [{ ...baseEnemy }];
    perception.isPlayerVisible.mockReturnValue(true);

    const { updatedEnemies, maxAlertLevel, guardPerception } = processPerceptionUpdates(
      enemies,
      player,
      mapArea
    );

    expect(perception.updateEnemyAlert).toHaveBeenCalledWith(enemies[0], true);
    expect(perception.updateVisionDirection).toHaveBeenCalledWith(expect.any(Object), player.position);
    expect(updatedEnemies[0].lastKnownPlayerPosition).toEqual(player.position);
    expect(maxAlertLevel).toBe(AlertLevel.ALARMED);
    expect(guardPerception[0].playerVisible).toBe(true);
  });

  it('tracks highest alert state across enemies', () => {
    const enemies = [
      { ...baseEnemy, id: 'enemy-1' },
      { ...baseEnemy, id: 'enemy-2' },
    ];
    perception.isPlayerVisible.mockImplementation((enemy: Enemy) => enemy.id === 'enemy-2');

    const { maxAlertLevel, guardPerception } = processPerceptionUpdates(enemies, player, mapArea);

    expect(maxAlertLevel).toBe(AlertLevel.ALARMED);
    expect(guardPerception.find((entry) => entry.enemy.id === 'enemy-2')?.playerVisible).toBe(true);
    expect(guardPerception.find((entry) => entry.enemy.id === 'enemy-1')?.playerVisible).toBe(false);
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
