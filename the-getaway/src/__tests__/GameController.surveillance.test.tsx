import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import GameController from '../components/GameController';
import { store, resetGame } from '../store';
import { initializeZoneSurveillance } from '../game/systems/surveillance/cameraSystem';
import { initializeCharacter, setPlayerData, setStealthState } from '../store/playerSlice';
import {
  NIGHT_START_SECONDS,
  requestStealthToggle,
  setEngagementMode,
  setGameTime,
  updateEnemy,
} from '../store/worldSlice';
import { updateCameraState } from '../store/surveillanceSlice';
import { AlertLevel, CameraAlertState } from '../game/interfaces/types';

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

const TEST_CHARACTER_SKILLS = {
  strength: 5,
  perception: 5,
  endurance: 5,
  charisma: 5,
  intelligence: 5,
  agility: 5,
  luck: 5,
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

  test('prioritizes NPC dialogue over camera sabotage when both are in range', async () => {
    const initialState = store.getState();
    const { currentMapArea, timeOfDay } = initialState.world;

    initializeZoneSurveillance({
      area: currentMapArea,
      timeOfDay,
      dispatch: store.dispatch,
      timestamp: Date.now(),
    });

    const interactiveNpc = currentMapArea.entities.npcs.find(
      (npc) => npc.isInteractive && Boolean(npc.dialogueId)
    );
    expect(interactiveNpc).toBeDefined();

    if (!interactiveNpc) {
      return;
    }

    const zone = store.getState().surveillance.zones[currentMapArea.id];
    const firstCamera = Object.values(zone.cameras)[0];
    expect(firstCamera).toBeDefined();

    if (!firstCamera) {
      return;
    }

    act(() => {
      store.dispatch(
        setPlayerData({
          ...store.getState().player.data,
          position: {
            x: interactiveNpc.position.x,
            y: interactiveNpc.position.y + 1,
          },
        })
      );
      store.dispatch(
        updateCameraState({
          areaId: currentMapArea.id,
          cameraId: firstCamera.id,
          timestamp: Date.now(),
          changes: {
            position: { ...interactiveNpc.position },
            isActive: true,
            alertState: CameraAlertState.IDLE,
            hackState: {},
          },
        })
      );
    });

    const { getByTestId, unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      fireEvent.keyDown(getByTestId('game-controller'), { key: 'e', code: 'KeyE' });

      await waitFor(() => {
        const state = store.getState();
        expect(state.quests.activeDialogue.dialogueId).toBe(interactiveNpc.dialogueId);
      });

      const cameraAfter = store.getState().surveillance.zones[currentMapArea.id]?.cameras[firstCamera.id];
      expect(cameraAfter?.hackState?.disabledUntil).toBeUndefined();
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('sabotages nearby camera with E and increments sabotage objective progress', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(100_000);
    store.dispatch(setGameTime(NIGHT_START_SECONDS));

    const initialState = store.getState();
    const { currentMapArea, timeOfDay } = initialState.world;

    initializeZoneSurveillance({
      area: currentMapArea,
      timeOfDay,
      dispatch: store.dispatch,
      timestamp: Date.now(),
    });

    const zone = store.getState().surveillance.zones[currentMapArea.id];
    const camera = Object.values(zone.cameras)[0];
    expect(camera).toBeDefined();

    if (!camera) {
      return;
    }

    act(() => {
      store.dispatch(
        setPlayerData({
          ...store.getState().player.data,
          position: { x: 1, y: 1 },
        })
      );
      store.dispatch(
        updateCameraState({
          areaId: currentMapArea.id,
          cameraId: camera.id,
          timestamp: Date.now(),
          changes: {
            position: { x: 2, y: 1 },
            isActive: true,
            alertState: CameraAlertState.IDLE,
            hackState: {},
          },
        })
      );
    });

    const { getByTestId, unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      fireEvent.keyDown(getByTestId('game-controller'), { key: 'e', code: 'KeyE' });

      await waitFor(() => {
        const quest = store
          .getState()
          .quests.quests.find((entry) => entry.id === 'quest_equipment_sabotage');
        const sabotageObjective = quest?.objectives.find((objective) => objective.id === 'sabotage-cameras');
        expect(quest?.isActive).toBe(true);
        expect(sabotageObjective?.currentCount).toBe(1);
      });

      const updatedCamera = store.getState().surveillance.zones[currentMapArea.id]?.cameras[camera.id];
      expect(updatedCamera?.hackState?.disabledUntil).toBe(220_000);
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('blocks camera sabotage outside curfew window', async () => {
    store.dispatch(setGameTime(NIGHT_START_SECONDS - 1));

    const initialState = store.getState();
    const { currentMapArea, timeOfDay } = initialState.world;

    initializeZoneSurveillance({
      area: currentMapArea,
      timeOfDay,
      dispatch: store.dispatch,
      timestamp: Date.now(),
    });

    const zone = store.getState().surveillance.zones[currentMapArea.id];
    const camera = Object.values(zone.cameras)[0];
    expect(camera).toBeDefined();

    if (!camera) {
      return;
    }

    act(() => {
      store.dispatch(
        setPlayerData({
          ...store.getState().player.data,
          position: { x: 1, y: 1 },
        })
      );
      store.dispatch(
        updateCameraState({
          areaId: currentMapArea.id,
          cameraId: camera.id,
          timestamp: Date.now(),
          changes: {
            position: { x: 2, y: 1 },
            isActive: true,
            alertState: CameraAlertState.IDLE,
            hackState: {},
          },
        })
      );
    });

    const { getByTestId, unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      fireEvent.keyDown(getByTestId('game-controller'), { key: 'e', code: 'KeyE' });

      await waitFor(() => {
        const quest = store
          .getState()
          .quests.quests.find((entry) => entry.id === 'quest_equipment_sabotage');
        const sabotageObjective = quest?.objectives.find(
          (objective) => objective.id === 'sabotage-cameras'
        );
        expect(quest?.isActive).toBe(false);
        expect(sabotageObjective?.currentCount ?? 0).toBe(0);
      });

      const updatedCamera = store.getState().surveillance.zones[currentMapArea.id]?.cameras[camera.id];
      expect(updatedCamera?.hackState?.disabledUntil).toBeUndefined();
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('increments kill objective when a matching enemy is defeated', async () => {
    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      const enemy = store.getState().world.currentMapArea.entities.enemies[0];
      expect(enemy).toBeDefined();

      if (!enemy) {
        return;
      }

      act(() => {
        store.dispatch(
          updateEnemy({
            ...enemy,
            health: 0,
          })
        );
      });

      await waitFor(() => {
        const quest = store
          .getState()
          .quests.quests.find((entry) => entry.id === 'quest_combat_patrol');
        const objective = quest?.objectives.find((entry) => entry.id === 'defeat-corpsec');
        expect(quest?.isActive).toBe(true);
        expect(objective?.currentCount).toBe(1);
      });
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('counts unique drone waypoint sightings for drone recon objective', async () => {
    store.dispatch(setGameTime(NIGHT_START_SECONDS));
    const initialState = store.getState();
    const { currentMapArea, timeOfDay } = initialState.world;

    initializeZoneSurveillance({
      area: currentMapArea,
      timeOfDay,
      dispatch: store.dispatch,
      timestamp: Date.now(),
    });

    const zone = store.getState().surveillance.zones[currentMapArea.id];
    const drone = Object.values(zone.cameras).find((camera) => camera.type === 'drone');
    expect(drone).toBeDefined();

    if (!drone) {
      return;
    }

    act(() => {
      store.dispatch(
        setPlayerData({
          ...store.getState().player.data,
          position: { ...drone.position },
        })
      );
      store.dispatch(
        updateCameraState({
          areaId: currentMapArea.id,
          cameraId: drone.id,
          timestamp: Date.now(),
          changes: {
            alertState: CameraAlertState.SUSPICIOUS,
            currentWaypointIndex: 0,
          },
        })
      );
    });

    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      await waitFor(() => {
        const quest = store.getState().quests.quests.find((entry) => entry.id === 'quest_drone_recon');
        const objective = quest?.objectives.find((entry) => entry.id === 'observe-patrols');
        expect(quest?.isActive).toBe(true);
        expect(objective?.currentCount).toBe(1);
      });

      act(() => {
        store.dispatch(
          updateCameraState({
            areaId: currentMapArea.id,
            cameraId: drone.id,
            timestamp: Date.now(),
            changes: {
              currentWaypointIndex: 1,
            },
          })
        );
      });

      await waitFor(() => {
        const quest = store.getState().quests.quests.find((entry) => entry.id === 'quest_drone_recon');
        const objective = quest?.objectives.find((entry) => entry.id === 'observe-patrols');
        expect(objective?.currentCount).toBe(2);
      });

      act(() => {
        store.dispatch(
          updateCameraState({
            areaId: currentMapArea.id,
            cameraId: drone.id,
            timestamp: Date.now(),
            changes: {
              currentWaypointIndex: 1,
            },
          })
        );
      });

      await waitFor(() => {
        const quest = store.getState().quests.quests.find((entry) => entry.id === 'quest_drone_recon');
        const objective = quest?.objectives.find((entry) => entry.id === 'observe-patrols');
        expect(objective?.currentCount).toBe(2);
      });
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('does not log drone recon waypoints outside curfew', async () => {
    store.dispatch(setGameTime(NIGHT_START_SECONDS - 1));
    const initialState = store.getState();
    const { currentMapArea, timeOfDay } = initialState.world;

    initializeZoneSurveillance({
      area: currentMapArea,
      timeOfDay,
      dispatch: store.dispatch,
      timestamp: Date.now(),
    });

    const zone = store.getState().surveillance.zones[currentMapArea.id];
    const drone = Object.values(zone.cameras).find((camera) => camera.type === 'drone');
    expect(drone).toBeDefined();

    if (!drone) {
      return;
    }

    act(() => {
      store.dispatch(
        setPlayerData({
          ...store.getState().player.data,
          position: { ...drone.position },
        })
      );
      store.dispatch(
        updateCameraState({
          areaId: currentMapArea.id,
          cameraId: drone.id,
          timestamp: Date.now(),
          changes: {
            alertState: CameraAlertState.SUSPICIOUS,
            currentWaypointIndex: 1,
          },
        })
      );
    });

    const { unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      await waitFor(() => {
        const quest = store.getState().quests.quests.find((entry) => entry.id === 'quest_drone_recon');
        const objective = quest?.objectives.find((entry) => entry.id === 'observe-patrols');
        expect(quest?.isActive).toBe(false);
        expect(objective?.currentCount ?? 0).toBe(0);
      });
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });

  test('clears sabotage objective ledger when a new run starts', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(100_000);
    store.dispatch(setGameTime(NIGHT_START_SECONDS));

    const initialState = store.getState();
    const { currentMapArea, timeOfDay } = initialState.world;

    initializeZoneSurveillance({
      area: currentMapArea,
      timeOfDay,
      dispatch: store.dispatch,
      timestamp: Date.now(),
    });

    const zone = store.getState().surveillance.zones[currentMapArea.id];
    const firstCamera = Object.values(zone.cameras)[0];
    expect(firstCamera).toBeDefined();

    if (!firstCamera) {
      return;
    }

    act(() => {
      store.dispatch(
        setPlayerData({
          ...store.getState().player.data,
          position: { x: 1, y: 1 },
        })
      );
      store.dispatch(
        updateCameraState({
          areaId: currentMapArea.id,
          cameraId: firstCamera.id,
          timestamp: Date.now(),
          changes: {
            position: { x: 2, y: 1 },
            isActive: true,
            alertState: CameraAlertState.IDLE,
            hackState: {},
          },
        })
      );
    });

    const { getByTestId, unmount, rafSpy, cancelRafSpy } = renderController();

    try {
      fireEvent.keyDown(getByTestId('game-controller'), { key: 'e', code: 'KeyE' });

      await waitFor(() => {
        const quest = store
          .getState()
          .quests.quests.find((entry) => entry.id === 'quest_equipment_sabotage');
        const sabotageObjective = quest?.objectives.find((objective) => objective.id === 'sabotage-cameras');
        expect(sabotageObjective?.currentCount).toBe(1);
      });

      act(() => {
        store.dispatch(resetGame());
        store.dispatch(
          initializeCharacter({
            name: 'Ledger Reset Test',
            skills: TEST_CHARACTER_SKILLS,
            backgroundId: 'corpsec_defector',
            visualPreset: 'default',
          })
        );
        store.dispatch(setGameTime(NIGHT_START_SECONDS));
      });

      const nextState = store.getState();
      const { currentMapArea: nextArea, timeOfDay: nextTimeOfDay } = nextState.world;
      act(() => {
        initializeZoneSurveillance({
          area: nextArea,
          timeOfDay: nextTimeOfDay,
          dispatch: store.dispatch,
          timestamp: Date.now(),
        });
      });

      const nextZone = store.getState().surveillance.zones[nextArea.id];
      const nextCamera = Object.values(nextZone.cameras)[0];
      expect(nextCamera).toBeDefined();

      if (!nextCamera) {
        return;
      }

      act(() => {
        store.dispatch(
          setPlayerData({
            ...store.getState().player.data,
            position: { x: 1, y: 1 },
          })
        );
        store.dispatch(
          updateCameraState({
            areaId: nextArea.id,
            cameraId: nextCamera.id,
            timestamp: Date.now(),
            changes: {
              position: { x: 2, y: 1 },
              isActive: true,
              alertState: CameraAlertState.IDLE,
              hackState: {},
            },
          })
        );
      });

      fireEvent.keyDown(getByTestId('game-controller'), { key: 'e', code: 'KeyE' });

      await waitFor(() => {
        const quest = store
          .getState()
          .quests.quests.find((entry) => entry.id === 'quest_equipment_sabotage');
        const sabotageObjective = quest?.objectives.find((objective) => objective.id === 'sabotage-cameras');
        expect(quest?.isActive).toBe(true);
        expect(sabotageObjective?.currentCount).toBe(1);
      });
    } finally {
      restoreFrameSpies(rafSpy, cancelRafSpy);
      unmount();
    }
  });
});
