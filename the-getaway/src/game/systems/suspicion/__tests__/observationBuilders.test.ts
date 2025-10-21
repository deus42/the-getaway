import { buildGuardWitnessObservation, buildCameraWitnessObservation } from '../observationBuilders';
import { AlertLevel, CameraAlertState, Enemy, MapArea, Player } from '../../../interfaces/types';
import { DEFAULT_PLAYER } from '../../../interfaces/player';
import type { EnvironmentFlags } from '../../../interfaces/environment';

const player: Player = {
  ...DEFAULT_PLAYER,
  id: 'player-1',
  position: { x: 5, y: 4 },
  skillTraining: { ...DEFAULT_PLAYER.skillTraining, stealth: 40 },
};

const mapArea: MapArea = {
  id: 'area-1',
  name: 'Test Area',
  displayName: 'Test Area',
  zoneId: 'downtown',
  width: 10,
  height: 10,
  tiles: [],
  entities: { enemies: [], npcs: [], items: [] },
};

const environmentFlags: EnvironmentFlags = {
  gangHeat: 'low',
  curfewLevel: 0,
  supplyScarcity: 'norm',
  blackoutTier: 'none',
};

describe('observationBuilders', () => {
  it('returns null guard observation when player not visible', () => {
    const enemy: Enemy = {
      id: 'enemy-1',
      name: 'Guard',
      position: { x: 7, y: 10 },
      health: 20,
      maxHealth: 20,
      actionPoints: 4,
      maxActionPoints: 4,
      damage: 4,
      attackRange: 3,
      isHostile: true,
      facing: 'north',
      coverOrientation: null,
      suppression: 0,
      alertLevel: AlertLevel.SUSPICIOUS,
      alertProgress: 40,
      visionCone: { range: 8, angle: 90, direction: 180 },
    };

    const observation = buildGuardWitnessObservation({
      enemy,
      player,
      mapArea,
      timeOfDay: 'day',
      environmentFlags,
      playerVisible: false,
      timestamp: 10,
    });

    expect(observation).toBeNull();
  });

  it('builds guard observation with expected metadata', () => {
    const enemy: Enemy = {
      id: 'enemy-guard',
      name: 'Guard',
      position: { x: 5, y: 7 },
      health: 20,
      maxHealth: 20,
      actionPoints: 4,
      maxActionPoints: 4,
      damage: 4,
      attackRange: 3,
      isHostile: true,
      facing: 'north',
      coverOrientation: null,
      suppression: 0,
      alertLevel: AlertLevel.INVESTIGATING,
      alertProgress: 70,
      visionCone: { range: 10, angle: 90, direction: 180 },
      lastKnownPlayerPosition: null,
    };

    const observation = buildGuardWitnessObservation({
      enemy,
      player,
      mapArea,
      timeOfDay: 'night',
      environmentFlags,
      playerVisible: true,
      timestamp: 42,
    });

    expect(observation).not.toBeNull();
    expect(observation?.zoneId).toBe('downtown');
    expect(observation?.reported).toBe(true);
    expect(observation?.baseCertainty).toBeGreaterThan(0.6);
    expect(observation?.witnessLabel).toBe(enemy.name);
  });

  it('builds camera observation when alert state changes', () => {
    const camera = {
      id: 'camera-1',
      type: 'static' as const,
      position: { x: 5, y: 5 },
      range: 8,
      fieldOfView: 90,
      activationPhases: [],
      alertState: CameraAlertState.ALARMED,
      detectionProgress: 100,
      isActive: true,
      hackState: {},
      currentDirection: 0,
    };

    const observation = buildCameraWitnessObservation({
      camera,
      player,
      mapArea,
      timeOfDay: 'evening',
      environmentFlags,
      timestamp: 64,
      alertState: CameraAlertState.ALARMED,
    });

    expect(observation.zoneId).toBe('downtown');
    expect(observation.reported).toBe(true);
    expect(observation.baseCertainty).toBeGreaterThan(0.7);
    expect(observation.witnessLabel).toBe('Camera 1');
  });
});
