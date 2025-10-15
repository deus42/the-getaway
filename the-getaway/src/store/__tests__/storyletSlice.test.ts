import { configureStore } from '@reduxjs/toolkit';
import playerReducer, { initialPlayerState } from '../playerSlice';
import worldReducer from '../worldSlice';
import missionReducer, { buildMissionState } from '../missionSlice';
import settingsReducer from '../settingsSlice';
import storyletReducer, { triggerStorylet, selectStoryletQueue } from '../storyletSlice';
import logReducer from '../logSlice';
import questsReducer from '../questsSlice';
import combatFeedbackReducer from '../combatFeedbackSlice';
import surveillanceReducer from '../surveillanceSlice';
import { NPC, AlertLevel } from '../../game/interfaces/types';
import { DEFAULT_PLAYER } from '../../game/interfaces/player';
import { AppDispatch, RootState } from '..';

const createNpc = (dialogueId: string, name: string, overrides: Partial<NPC> = {}): NPC => ({
  id: dialogueId,
  name,
  position: overrides.position ?? { x: 0, y: 0 },
  health: overrides.health ?? 12,
  maxHealth: overrides.maxHealth ?? 12,
  routine:
    overrides.routine ??
    [{ position: { x: 0, y: 0 }, timeOfDay: 'day', duration: 120 }],
  dialogueId,
  isInteractive: overrides.isInteractive ?? true,
});

const createTestStore = (options?: { missionLevelIndex?: number; playerHealth?: number }) => {
  const playerState = {
    ...initialPlayerState,
    data: {
      ...initialPlayerState.data,
      ...DEFAULT_PLAYER,
      name: 'Test Operative',
      backgroundId: 'corpsec_defector',
      maxHealth: 100,
      health: options?.playerHealth ?? 45,
      factionReputation: {
        ...initialPlayerState.data.factionReputation,
      },
    },
  };

  const worldBase = worldReducer(undefined, { type: 'storylet/init' } as any);
  const worldState = {
    ...worldBase,
    inCombat: false,
    globalAlertLevel: AlertLevel.IDLE,
    currentMapArea: {
      ...worldBase.currentMapArea,
      entities: {
        ...worldBase.currentMapArea.entities,
        npcs: [
          createNpc('npc_lira_vendor', 'Lira the Smuggler'),
          createNpc('npc_archivist_naila', 'Archivist Naila'),
          createNpc('npc_seraph_warden', 'Seraph Warden'),
        ],
      },
    },
  };

  const missionState = buildMissionState();
  missionState.currentLevelIndex = options?.missionLevelIndex ?? 0;

  const store = configureStore({
    reducer: {
      player: playerReducer,
      world: worldReducer,
      missions: missionReducer,
      settings: settingsReducer,
      storylets: storyletReducer,
      log: logReducer,
      quests: questsReducer,
      combatFeedback: combatFeedbackReducer,
      surveillance: surveillanceReducer,
    },
    preloadedState: {
      player: playerState,
      world: worldState,
      missions: missionState,
      settings: settingsReducer(undefined, { type: 'storylet/init' } as any),
      storylets: storyletReducer(undefined, { type: 'storylet/init' } as any),
      log: logReducer(undefined, { type: 'storylet/init' } as any),
      quests: questsReducer(undefined, { type: 'storylet/init' } as any),
      combatFeedback: combatFeedbackReducer(undefined, { type: 'storylet/init' } as any),
      surveillance: surveillanceReducer(undefined, { type: 'storylet/init' } as any),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });

  return store;
};

describe('storyletSlice triggerStorylet', () => {
  it('queues mission-completion storylet and applies faction bonuses', () => {
    const store = createTestStore({ missionLevelIndex: 0, playerHealth: 40 });
    const dispatch = store.dispatch as AppDispatch;

    dispatch(
      triggerStorylet({
        type: 'missionCompletion',
        tags: ['resistance'],
        locationId: 'slums',
      })
    );

    const state = store.getState() as RootState;
    const queue = selectStoryletQueue(state);
    expect(queue).toHaveLength(1);
    expect(queue[0].storyletId).toBe('firelight_ambush');
    expect(state.player.data.factionReputation.resistance).toBeGreaterThan(0);

    const lastLog = state.log.messages[state.log.messages.length - 1];
    expect(lastLog).toMatch(/Lira/i);

    dispatch(
      triggerStorylet({
        type: 'missionCompletion',
        tags: ['resistance'],
        locationId: 'slums',
      })
    );
    expect(selectStoryletQueue(store.getState() as RootState)).toHaveLength(1);
  });

  it('triggers campfire rest storylet and adjusts personality flags', () => {
    const store = createTestStore({ missionLevelIndex: 1, playerHealth: 90 });
    const dispatch = store.dispatch as AppDispatch;

    const initialEarnest = store.getState().player.data.personality.flags.earnest ?? 0;

    dispatch(triggerStorylet({ type: 'campfireRest' }));

    const queue = selectStoryletQueue(store.getState() as RootState);
    expect(queue).toHaveLength(1);
    expect(queue[0].storyletId).toBe('neon_bivouac');

    const updatedEarnest = store.getState().player.data.personality.flags.earnest ?? 0;
    expect(updatedEarnest).toBeGreaterThan(initialEarnest);
  });

  it('processes patrol ambush storylet and applies injuries', () => {
    const store = createTestStore({ missionLevelIndex: 2, playerHealth: 60 });
    const dispatch = store.dispatch as AppDispatch;
    const healthBefore = store.getState().player.data.health;

    dispatch(triggerStorylet({ type: 'patrolAmbush', tags: ['corpsec'] }));

    const state = store.getState();
    const queue = selectStoryletQueue(state as RootState);
    expect(queue).toHaveLength(1);
    expect(queue[0].storyletId).toBe('serrated_omen');
    expect(state.player.data.health).toBe(healthBefore - 4);

    const lastLog = state.log.messages[state.log.messages.length - 1];
    expect(lastLog).toMatch(/Seraph/i);
  });
});
