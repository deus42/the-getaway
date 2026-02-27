import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import CameraDetectionHUD from '../components/ui/CameraDetectionHUD';
import { resetGame, store } from '../store';
import {
  registerZoneCameras,
  setOverlayEnabled,
  updateCameraState,
  updateHudState,
} from '../store/surveillanceSlice';
import { setGameTime } from '../store/worldSlice';
import {
  CameraAlertState,
  CameraRuntimeState,
} from '../game/interfaces/types';

const seedSingleCamera = (overrides: Partial<CameraRuntimeState> = {}) => {
  const state = store.getState();
  const area = state.world.currentMapArea;
  const camera: CameraRuntimeState = {
    id: 'cam-1',
    type: 'static',
    position: { x: 1, y: 1 },
    range: 6,
    fieldOfView: 70,
    activationPhases: ['evening', 'night'],
    alertState: CameraAlertState.IDLE,
    detectionProgress: 0,
    isActive: false,
    hackState: {},
    currentDirection: 0,
    ...overrides,
  };

  act(() => {
    store.dispatch(
      registerZoneCameras({
        areaId: area.id,
        zoneId: area.zoneId,
        cameras: [camera],
        timestamp: 0,
      })
    );
  });
};

describe('CameraDetectionHUD', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('shows outside-curfew inactive cue when zone cameras exist but none are active', () => {
    act(() => {
      store.dispatch(setGameTime(90));
    });
    seedSingleCamera({ isActive: false });

    render(
      <Provider store={store}>
        <CameraDetectionHUD />
      </Provider>
    );

    expect(screen.getByText('Cameras inactive (outside curfew)')).toBeInTheDocument();
  });

  it('shows hidden cue when overlay is disabled', () => {
    seedSingleCamera({ isActive: true, alertState: CameraAlertState.SUSPICIOUS });
    act(() => {
      store.dispatch(setOverlayEnabled({ enabled: false }));
    });

    render(
      <Provider store={store}>
        <CameraDetectionHUD />
      </Provider>
    );

    expect(screen.getByText('Cones hidden')).toBeInTheDocument();
  });

  it('shows active camera telemetry when cameras are active and overlay is enabled', () => {
    act(() => {
      store.dispatch(setGameTime(130));
    });
    seedSingleCamera({ isActive: true, alertState: CameraAlertState.SUSPICIOUS });

    act(() => {
      store.dispatch(
        updateCameraState({
          areaId: store.getState().world.currentMapArea.id,
          cameraId: 'cam-1',
          changes: {
            isActive: true,
            alertState: CameraAlertState.SUSPICIOUS,
            detectionProgress: 44,
          },
          timestamp: 1,
        })
      );
      store.dispatch(
        updateHudState({
          alertState: CameraAlertState.SUSPICIOUS,
          activeCameraId: 'cam-1',
          detectionProgress: 44,
        })
      );
      store.dispatch(setOverlayEnabled({ enabled: true }));
    });

    render(
      <Provider store={store}>
        <CameraDetectionHUD />
      </Provider>
    );

    expect(screen.getByText('SUSPICIOUS')).toBeInTheDocument();
    expect(screen.getByText('1/1 active')).toBeInTheDocument();
    expect(screen.queryByText('Cones hidden')).not.toBeInTheDocument();
  });
});
