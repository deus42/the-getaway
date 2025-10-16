import { configureStore } from '@reduxjs/toolkit';
import worldReducer, { setEnvironmentFlags, setGameTime } from '../../../../store/worldSlice';
import playerReducer from '../../../../store/playerSlice';
import settingsReducer from '../../../../store/settingsSlice';
import logReducer from '../../../../store/logSlice';
import questsReducer from '../../../../store/questsSlice';
import combatFeedbackReducer from '../../../../store/combatFeedbackSlice';
import missionsReducer from '../../../../store/missionSlice';
import surveillanceReducer from '../../../../store/surveillanceSlice';
import storyletReducer from '../../../../store/storyletSlice';
import { ensureDefaultEnvironmentalTriggersRegistered, resetEnvironmentalTriggersForTest } from '../defaultTriggers';
import { tickEnvironmentalTriggers } from '../triggerRegistry';
import { RootState } from '../../../../store';

const createTestStore = () =>
  configureStore({
    reducer: {
      world: worldReducer,
      player: playerReducer,
      settings: settingsReducer,
      log: logReducer,
      quests: questsReducer,
      combatFeedback: combatFeedbackReducer,
      missions: missionsReducer,
      surveillance: surveillanceReducer,
      storylets: storyletReducer,
    },
  });

const runTriggerTick = (store: ReturnType<typeof createTestStore>, now?: number) =>
  tickEnvironmentalTriggers(store.dispatch, store.getState, now);

describe('default environmental triggers', () => {
  beforeEach(() => {
    resetEnvironmentalTriggersForTest();
  });

  it('rotates barfly rumors when gang heat escalates', () => {
    const store = createTestStore();

    ensureDefaultEnvironmentalTriggersRegistered();
    runTriggerTick(store);

    let state: RootState = store.getState();
    expect(state.world.environment.rumorSets['slum-barflies']).toBeDefined();

    store.dispatch(setEnvironmentFlags({ gangHeat: 'med' }));
    runTriggerTick(store);

    state = store.getState();
    const rumorSet = state.world.environment.rumorSets['slum-barflies'];
    expect(rumorSet).toBeDefined();
    expect(rumorSet?.sourceId).toContain('med');
    const npcWithAmbient = state.world.currentMapArea.entities.npcs.find(
      (npc) => npc.dialogueId === 'npc_lira_vendor'
    );
    expect(npcWithAmbient?.ambientProfile?.sourceId).toEqual(rumorSet?.sourceId);
  });

  it('updates signage when blackout tier changes', () => {
    const store = createTestStore();

    ensureDefaultEnvironmentalTriggersRegistered();
    runTriggerTick(store);

    store.dispatch(setEnvironmentFlags({ blackoutTier: 'brownout' }));
    runTriggerTick(store);

    const state = store.getState();
    expect(state.world.environment.signage['downtown.vending.primary']).toBeDefined();
    expect(
      state.world.environment.signage['downtown.vending.primary']?.variantId
    ).toContain('brownout');
  });

  it('spawns environmental note items on scarcity changes', () => {
    const store = createTestStore();

    ensureDefaultEnvironmentalTriggersRegistered();
    runTriggerTick(store);

    store.dispatch(setEnvironmentFlags({ supplyScarcity: 'tight' }));
    runTriggerTick(store);

    const state = store.getState();
    const notes = state.world.environment.notes;
    expect(notes.length).toBeGreaterThan(0);
    const noteItem = state.world.currentMapArea.entities.items.find((item) =>
      item.id.startsWith('env-note-item::')
    );
    expect(noteItem).toBeDefined();
  });

  it('updates weather once per time of day and respects severity overrides', () => {
    const store = createTestStore();

    ensureDefaultEnvironmentalTriggersRegistered();

    runTriggerTick(store, 1_000);
    let state: RootState = store.getState();
    const initialWeather = state.world.environment.weather;
    expect(initialWeather.timeOfDay).toEqual(state.world.timeOfDay);
    const initialPreset = initialWeather.presetId;

    runTriggerTick(store, 2_000);
    state = store.getState();
    expect(state.world.environment.weather.updatedAt).toBe(initialWeather.updatedAt);
    expect(state.world.environment.weather.timeOfDay).toBe(initialWeather.timeOfDay);

    store.dispatch(setEnvironmentFlags({ curfewLevel: 2 }));
    runTriggerTick(store, 3_000);
    state = store.getState();
    expect(state.world.environment.weather.presetId).toBe('weather.curfew.2');
    expect(state.world.environment.weather.updatedAt).toBe(3_000);

    runTriggerTick(store, 4_000);
    state = store.getState();
    expect(state.world.environment.weather.updatedAt).toBe(3_000);

    store.dispatch(setGameTime(150)); // transitions into night
    runTriggerTick(store, 5_000);
    state = store.getState();
    expect(state.world.environment.weather.timeOfDay).toBe(state.world.timeOfDay);
    expect(state.world.environment.weather.updatedAt).toBe(5_000);

    store.dispatch(setEnvironmentFlags({ gangHeat: 'high' }));
    runTriggerTick(store, 6_000);
    state = store.getState();
    expect(state.world.environment.weather.presetId).toBe('weather.gangHeat.high');
    expect(state.world.environment.weather.updatedAt).toBe(6_000);

    runTriggerTick(store, 7_000);
    state = store.getState();
    expect(state.world.environment.weather.updatedAt).toBe(6_000);

    store.dispatch(setEnvironmentFlags({ curfewLevel: 3 }));
    runTriggerTick(store, 8_000);
    state = store.getState();
    expect(state.world.environment.weather.presetId).toBe('weather.curfew.3');
    expect(state.world.environment.weather.updatedAt).toBe(8_000);

    expect(initialPreset).not.toBeNull();
  });
});
