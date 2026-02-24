import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import GameController from '../components/GameController';
import { store, resetGame } from '../store';
import { initializeZoneSurveillance } from '../game/systems/surveillance/cameraSystem';
import { setStealthState } from '../store/playerSlice';
import { requestStealthToggle, setEngagementMode, updateEnemy } from '../store/worldSlice';
import { AlertLevel } from '../game/interfaces/types';

jest.mock('../components/debug/GameDebugInspector', () => () => null);

const renderController = (strictMode = false) => {
  const rafSpy = jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation(() => 0);
  const cancelRafSpy = jest
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation(() => undefined);

  const tree = (
    <Provider store={store}>
      <GameController />
    </Provider>
  );

  const view = render(strictMode ? <StrictMode>{tree}</StrictMode> : tree);
  return {
    ...view,
    rafSpy,
    cancelRafSpy,
  };
};

const restoreFrameSpies = (
  rafSpy: jest.SpyInstance<number, [FrameRequestCallback]>,
  cancelRafSpy: jest.SpyInstance<void, [number]>
) => {
  rafSpy.mockRestore();
  cancelRafSpy.mockRestore();
};

const setFirstEnemyAlert = (alertLevel: AlertLevel, alertProgress: number) => {
  const enemy = store.getState().world.currentMapArea.entities.enemies[0];
  if (!enemy) {
    throw new Error('Expected at least one enemy in the default map area.');
  }

  act(() => {
    store.dispatch(
      updateEnemy({
        ...enemy,
        alertLevel,
        alertProgress,
      })
    );
  });
};

describe('GameController surveillance and stealth fairness', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    jest.restoreAllMocks();
  });

  afterEach(() => {
    store.dispatch(resetGame());
    jest.restoreAllMocks();
  });

  test('keeps existing surveillance zone after StrictMode remount cycle', async () => {
    const initialState = store.getState();
    const { currentMapArea, timeOfDay } = initialState.world;

    initializeZoneSurveillance({
      area: currentMapArea,
      timeOfDay,
      dispatch: store.dispatch,
      timestamp: performance.now(),
    });

    expect(store.getState().surveillance.zones[currentMapArea.id]).toBeTruthy();

    const { unmount, rafSpy, cancelRafSpy } = renderController(true);

    try {
      await waitFor(() => {
        expect(store.getState().surveillance.zones[currentMapArea.id]).toBeTruthy();
      });
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('keeps stealth engaged when guard alert is investigating', async () => {
    store.dispatch(setStealthState({ enabled: true, cooldownExpiresAt: null }));
    store.dispatch(setEngagementMode('stealth'));

    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      setFirstEnemyAlert(AlertLevel.INVESTIGATING, 80);

      await waitFor(() => {
        const state = store.getState();
        expect(state.player.data.stealthModeEnabled).toBe(true);
        expect(state.world.engagementMode).toBe('stealth');
      });
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('forces stealth break and logs compromise once guard alert reaches alarmed', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000);
    store.dispatch(setStealthState({ enabled: true, cooldownExpiresAt: null }));
    store.dispatch(setEngagementMode('stealth'));

    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      setFirstEnemyAlert(AlertLevel.ALARMED, 100);

      await waitFor(() => {
        const state = store.getState();
        expect(state.player.data.stealthModeEnabled).toBe(false);
        expect(state.player.data.stealthCooldownExpiresAt).toBe(14_500);
        expect(state.world.engagementMode).toBe('none');
      });

      const logMessages = store.getState().log.messages;
      expect(logMessages.some((message) => message.includes('Stealth blown!'))).toBe(
        true
      );
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('blocks immediate stealth re-entry while cooldown is active', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(20_000);
    store.dispatch(setStealthState({ enabled: true, cooldownExpiresAt: null }));
    store.dispatch(setEngagementMode('stealth'));

    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      setFirstEnemyAlert(AlertLevel.ALARMED, 100);

      await waitFor(() => {
        const state = store.getState();
        expect(state.player.data.stealthModeEnabled).toBe(false);
        expect(state.player.data.stealthCooldownExpiresAt).toBe(24_500);
      });

      setFirstEnemyAlert(AlertLevel.IDLE, 0);
      fireEvent.keyDown(window, { key: 'x', code: 'KeyX' });

      await waitFor(() => {
        expect(store.getState().player.data.stealthModeEnabled).toBe(false);
      });

      const logMessages = store.getState().log.messages;
      expect(
        logMessages.some((message) => message.includes('Stealth recalibrating (5s).'))
      ).toBe(true);
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('processes HUD stealth toggle requests and engages stealth when eligible', async () => {
    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      const beforeNonce = store.getState().world.stealthToggleRequestNonce;

      act(() => {
        store.dispatch(requestStealthToggle());
      });

      expect(store.getState().world.stealthToggleRequestNonce).toBe(beforeNonce + 1);

      await waitFor(() => {
        const state = store.getState();
        expect(state.player.data.stealthModeEnabled).toBe(true);
        expect(state.world.engagementMode).toBe('stealth');
      });
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('blocks HUD stealth toggle requests while cooldown is active', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(30_000);
    store.dispatch(setStealthState({ enabled: false, cooldownExpiresAt: 34_500 }));

    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      act(() => {
        store.dispatch(requestStealthToggle());
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.player.data.stealthModeEnabled).toBe(false);
      });

      const logMessages = store.getState().log.messages;
      expect(
        logMessages.some((message) => message.includes('Stealth recalibrating (5s).'))
      ).toBe(true);
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('ignores Tab and X shortcuts when focus is inside controller-ignore container', async () => {
    const { unmount, rafSpy, cancelRafSpy } = renderController();
    const focusGuard = document.createElement('div');
    focusGuard.setAttribute('data-controller-focus-ignore', 'true');
    document.body.appendChild(focusGuard);

    try {
      const initialOverlay = store.getState().surveillance.hud.overlayEnabled;
      const initialStealth = store.getState().player.data.stealthModeEnabled;

      fireEvent.keyDown(focusGuard, { key: 'Tab' });
      fireEvent.keyDown(focusGuard, { key: 'x', code: 'KeyX' });

      await waitFor(() => {
        const state = store.getState();
        expect(state.surveillance.hud.overlayEnabled).toBe(initialOverlay);
        expect(state.player.data.stealthModeEnabled).toBe(initialStealth);
      });
    } finally {
      document.body.removeChild(focusGuard);
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });
});
