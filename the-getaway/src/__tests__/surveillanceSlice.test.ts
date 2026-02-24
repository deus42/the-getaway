import surveillanceReducer, {
  registerZoneCameras,
  updateCameraState,
  setOverlayEnabled,
  setCurfewBanner,
  updateHudState,
  clearZoneCameras,
} from '../store/surveillanceSlice';
import { CameraAlertState, CameraRuntimeState } from '../game/interfaces/types';

describe('surveillanceSlice', () => {
  const cameraA: CameraRuntimeState = {
    id: 'cam-a',
    type: 'static',
    position: { x: 10, y: 12 },
    range: 8,
    fieldOfView: 90,
    activationPhases: ['evening', 'night'],
    sweep: { angles: [0, 45], cycleDurationMs: 3200 },
    alertState: CameraAlertState.IDLE,
    detectionProgress: 0,
    isActive: true,
    hackState: {},
    lastDetectionTimestamp: undefined,
    currentDirection: 0,
    sweepDirection: 1,
    sweepElapsedMs: 0,
    sweepIndex: 0,
    patrolProgressMs: 0,
    currentWaypointIndex: 0,
    networkAlertContributionAt: undefined,
  };

  const initialState = surveillanceReducer(undefined, { type: 'init' });

  it('registers cameras for a zone', () => {
    const nextState = surveillanceReducer(
      initialState,
      registerZoneCameras({
        areaId: 'area-1',
        zoneId: 'zone-d',
        cameras: [cameraA],
        timestamp: 1000,
      })
    );

    expect(Object.keys(nextState.zones)).toContain('area-1');
    expect(nextState.zones['area-1'].cameras['cam-a']).toMatchObject({
      id: 'cam-a',
      type: 'static',
      alertState: CameraAlertState.IDLE,
    });
  });

  it('updates camera state immutably', () => {
    const withZone = surveillanceReducer(initialState, registerZoneCameras({
      areaId: 'area-1',
      zoneId: 'zone-d',
      cameras: [cameraA],
      timestamp: 1000,
    }));

    const updated = surveillanceReducer(
      withZone,
      updateCameraState({
        areaId: 'area-1',
        cameraId: 'cam-a',
        timestamp: 2000,
        changes: {
          alertState: CameraAlertState.ALARMED,
          detectionProgress: 100,
        },
      })
    );

    expect(updated.zones['area-1'].cameras['cam-a'].alertState).toBe(CameraAlertState.ALARMED);
    expect(updated.zones['area-1'].cameras['cam-a'].detectionProgress).toBe(100);
    expect(withZone.zones['area-1'].cameras['cam-a'].alertState).toBe(CameraAlertState.IDLE);
  });

  it('toggles overlay flag', () => {
    const toggled = surveillanceReducer(initialState, setOverlayEnabled({ enabled: true }));
    expect(toggled.hud.overlayEnabled).toBe(true);
  });

  it('tracks curfew banner visibility without clobbering timestamp on dismiss', () => {
    const shown = surveillanceReducer(initialState, setCurfewBanner({ visible: true, timestamp: 500 }));
    expect(shown.curfewBanner.visible).toBe(true);
    expect(shown.curfewBanner.lastActivatedAt).toBe(500);

    const hidden = surveillanceReducer(shown, setCurfewBanner({ visible: false, timestamp: 1200 }));
    expect(hidden.curfewBanner.visible).toBe(false);
    expect(hidden.curfewBanner.lastActivatedAt).toBe(500);
  });

  it('merges HUD updates', () => {
    const next = surveillanceReducer(initialState, updateHudState({
      camerasNearby: 3,
      detectionProgress: 42.5,
      alertState: CameraAlertState.INVESTIGATING,
      activeCameraId: 'cam-a',
      networkAlertActive: true,
      networkAlertExpiresAt: 9999,
    }));

    expect(next.hud.camerasNearby).toBe(3);
    expect(next.hud.detectionProgress).toBe(42.5);
    expect(next.hud.alertState).toBe(CameraAlertState.INVESTIGATING);
    expect(next.hud.activeCameraId).toBe('cam-a');
    expect(next.hud.networkAlertActive).toBe(true);
  });

  it('clears zone cameras while preserving HUD state', () => {
    const withZone = surveillanceReducer(initialState, registerZoneCameras({
      areaId: 'area-1',
      zoneId: 'zone-d',
      cameras: [cameraA],
      timestamp: 1000,
    }));

    const withHud = surveillanceReducer(withZone, updateHudState({ camerasNearby: 2 }));

    const cleared = surveillanceReducer(withHud, clearZoneCameras({ areaId: 'area-1' }));
    expect(cleared.zones['area-1']).toBeUndefined();
    expect(cleared.hud.camerasNearby).toBe(2);
  });
});
