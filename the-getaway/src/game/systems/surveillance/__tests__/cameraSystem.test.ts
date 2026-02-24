import { AlertLevel, CameraAlertState, type CameraRuntimeState } from '../../../interfaces/types';
import { createCameraRuntimeState } from '../cameraTypes';
import {
  resolveCameraAlertStateFromProgress,
  updateSurveillance,
} from '../cameraSystem';
import { store, resetGame } from '../../../../store';
import { DEFAULT_LOCALE } from '../../../../content/locales';
import { getSystemStrings } from '../../../../content/system';

jest.mock('../../../combat/perception', () => ({
  hasLineOfSight: jest.fn(() => true),
  isInVisionCone: jest.fn(() => true),
}));

const createTestCamera = (
  overrides: Partial<CameraRuntimeState> = {}
): CameraRuntimeState => {
  const runtime = createCameraRuntimeState({
    id: 'cam-test',
    type: 'static',
    position: { x: 12, y: 12 },
    range: 8,
    fieldOfView: 120,
    activationPhases: ['day', 'night'],
  });

  return {
    ...runtime,
    isActive: true,
    currentDirection: 0,
    ...overrides,
  };
};

let areaIdCounter = 0;

const createTestZone = (camera: CameraRuntimeState) => {
  areaIdCounter += 1;
  return {
    areaId: `camera-zone-${areaIdCounter}`,
    zoneId: 'slums',
    cameras: {
      [camera.id]: camera,
    },
    networkAlert: null,
    lastUpdatedAt: 0,
  };
};

describe('cameraSystem thresholds and log routing', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    jest.clearAllMocks();
  });

  afterEach(() => {
    store.dispatch(resetGame());
  });

  it('maps camera progress into suspicious/investigating/alarmed thresholds', () => {
    expect(resolveCameraAlertStateFromProgress(0)).toBe(CameraAlertState.IDLE);
    expect(resolveCameraAlertStateFromProgress(1)).toBe(CameraAlertState.SUSPICIOUS);
    expect(resolveCameraAlertStateFromProgress(59)).toBe(CameraAlertState.SUSPICIOUS);
    expect(resolveCameraAlertStateFromProgress(60)).toBe(
      CameraAlertState.INVESTIGATING
    );
    expect(resolveCameraAlertStateFromProgress(99)).toBe(
      CameraAlertState.INVESTIGATING
    );
    expect(resolveCameraAlertStateFromProgress(100)).toBe(CameraAlertState.ALARMED);
  });

  it('routes idle to suspicious escalation to camera-specific suspicious log key', () => {
    const state = store.getState();
    const logStrings = getSystemStrings(DEFAULT_LOCALE).logs;
    const dispatch = jest.fn();

    const camera = createTestCamera({
      alertState: CameraAlertState.IDLE,
      detectionProgress: 0,
    });
    const zone = createTestZone(camera);
    const player = {
      ...state.player.data,
      position: { x: 13, y: 12 },
      movementProfile: 'normal' as const,
    };

    updateSurveillance({
      zone,
      mapArea: state.world.currentMapArea,
      player,
      deltaMs: 60,
      timestamp: 10_000,
      dispatch,
      logStrings,
      reinforcementsScheduled: false,
      globalAlertLevel: AlertLevel.IDLE,
      timeOfDay: state.world.timeOfDay,
      environmentFlags: state.world.environment.flags,
      worldTimeSeconds: state.world.currentTime,
    });

    const dispatchedLogPayloads = dispatch.mock.calls
      .map(([action]) => action)
      .filter((action) => action?.type === 'log/addLogMessage')
      .map((action) => action.payload);

    expect(dispatchedLogPayloads).toContain(logStrings.cameraAlertSuspicious);
  });

  it('routes 59 to 60 escalation to camera investigating log key', () => {
    const state = store.getState();
    const logStrings = getSystemStrings(DEFAULT_LOCALE).logs;
    const dispatch = jest.fn();

    const camera = createTestCamera({
      alertState: CameraAlertState.SUSPICIOUS,
      detectionProgress: 59,
    });
    const zone = createTestZone(camera);
    const player = {
      ...state.player.data,
      position: { x: 13, y: 12 },
      movementProfile: 'normal' as const,
    };

    updateSurveillance({
      zone,
      mapArea: state.world.currentMapArea,
      player,
      deltaMs: 60,
      timestamp: 10_100,
      dispatch,
      logStrings,
      reinforcementsScheduled: false,
      globalAlertLevel: AlertLevel.IDLE,
      timeOfDay: state.world.timeOfDay,
      environmentFlags: state.world.environment.flags,
      worldTimeSeconds: state.world.currentTime,
    });

    const dispatchedLogPayloads = dispatch.mock.calls
      .map(([action]) => action)
      .filter((action) => action?.type === 'log/addLogMessage')
      .map((action) => action.payload);

    expect(dispatchedLogPayloads).toContain(logStrings.cameraAlertInvestigating);
  });

  it('routes 99 to 100 escalation to camera alarmed log key', () => {
    const state = store.getState();
    const logStrings = getSystemStrings(DEFAULT_LOCALE).logs;
    const dispatch = jest.fn();

    const camera = createTestCamera({
      alertState: CameraAlertState.INVESTIGATING,
      detectionProgress: 99,
    });
    const zone = createTestZone(camera);
    const player = {
      ...state.player.data,
      position: { x: 13, y: 12 },
      movementProfile: 'normal' as const,
    };

    updateSurveillance({
      zone,
      mapArea: state.world.currentMapArea,
      player,
      deltaMs: 40,
      timestamp: 10_200,
      dispatch,
      logStrings,
      reinforcementsScheduled: false,
      globalAlertLevel: AlertLevel.IDLE,
      timeOfDay: state.world.timeOfDay,
      environmentFlags: state.world.environment.flags,
      worldTimeSeconds: state.world.currentTime,
    });

    const dispatchedLogPayloads = dispatch.mock.calls
      .map(([action]) => action)
      .filter((action) => action?.type === 'log/addLogMessage')
      .map((action) => action.payload);

    expect(dispatchedLogPayloads).toContain(logStrings.cameraAlertAlarmed);
  });
});
