import { configureStore } from '@reduxjs/toolkit';
import worldReducer, { setEnvironmentFlags } from '../../../../store/worldSlice';
import playerReducer from '../../../../store/playerSlice';
import settingsReducer from '../../../../store/settingsSlice';
import logReducer from '../../../../store/logSlice';
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
    },
  });

const runTriggerTick = (store: ReturnType<typeof createTestStore>) =>
  tickEnvironmentalTriggers(store.dispatch, store.getState);

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
});
