import { configureStore } from '@reduxjs/toolkit';
import reputationReducer, {
  applyEventIntegration,
  applyPropagationResult,
  tickLocalizedReputation,
} from '../reputationSlice';
import worldReducer from '../worldSlice';
import playerReducer from '../playerSlice';
import settingsReducer, { setReputationSystemsEnabled } from '../settingsSlice';
import { MapArea, MapTile, NPC, TileType } from '../../game/interfaces/types';
import { ReputationTrait, createReputationEvent, WitnessRecord, ReputationProfileMutation, seedRumorsFromWitnessRecords, buildSocialEdges, advanceRumors } from '../../game/systems/reputation';
import type { AppDispatch, RootState } from '../index';

const createTile = (x: number, y: number): MapTile => ({
  type: TileType.FLOOR,
  position: { x, y },
  isWalkable: true,
  provideCover: false,
});

const createNPC = (id: string, x: number, y: number, extras?: Partial<NPC>): NPC => ({
  id,
  name: id,
  position: { x, y },
  health: 12,
  maxHealth: 12,
  routine: [],
  dialogueId: id,
  isInteractive: true,
  socialTags: ['resistance'],
  factionId: 'resistance',
  ...extras,
});

const createArea = (npcs: NPC[]): MapArea => {
  const width = 16;
  const height = 16;
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => createTile(x, y))
  );
  return {
    id: 'test-area',
    name: 'Test Cell',
    zoneId: 'zone::test',
    width,
    height,
    tiles,
    entities: {
      enemies: [],
      npcs,
      items: [],
    },
  };
};

const createStore = () => {
  const store = configureStore({
    reducer: {
      reputation: reputationReducer,
      world: worldReducer,
      player: playerReducer,
      settings: settingsReducer,
    },
  });
  store.dispatch(setReputationSystemsEnabled(true));
  return store;
};

type TestStore = ReturnType<typeof createStore>;
type TestState = ReturnType<TestStore['getState']>;

const extractTrait = (state: TestState, scopeId: string, trait: ReputationTrait) => {
  const profile = state.reputation.profiles[scopeId];
  return profile?.traits[trait]?.value ?? 0;
};

describe('reputationSlice integration', () => {
  it('ingests events and updates scoped profiles', () => {
    const store = createStore();
    const npcs = [createNPC('npc-1', 6, 6), createNPC('npc-2', 9, 7)];
    const area = createArea(npcs);

    const event = createReputationEvent({
      actorId: 'player',
      actorLabel: 'Player',
      zoneId: area.zoneId,
      position: { x: 6, y: 6 },
      intensity: 'major',
      traits: { heroic: 22 },
      tags: ['rescue'],
      timestamp: 1_000,
    });

    const record: WitnessRecord = {
      id: 'record-1',
      eventId: event.id,
      witnessId: 'npc-1',
      witnessName: 'npc-1',
      factionId: 'resistance',
      zoneId: area.zoneId,
      cellId: '0:0',
      timestamp: event.timestamp,
      visibilityScore: 0.9,
      confidence: 0.85,
      isRumorOnly: false,
      traits: [{ trait: 'heroic', delta: 16, confidence: 0.85, source: 'witness' }],
    };

    const mutations: ReputationProfileMutation[] = [
      {
        scopeId: 'npc-1',
        scope: 'witness',
        factionId: 'resistance',
        cellId: '0:0',
        trait: 'heroic',
        delta: 16,
        confidence: 0.85,
        sourceRecordId: record.id,
        witnessId: 'npc-1',
      },
      {
        scopeId: '0:0',
        scope: 'cell',
        factionId: 'resistance',
        cellId: '0:0',
        trait: 'heroic',
        delta: 12,
        confidence: 0.75,
        sourceRecordId: record.id,
        witnessId: 'npc-1',
      },
      {
        scopeId: 'resistance',
        scope: 'faction',
        factionId: 'resistance',
        cellId: null,
        trait: 'heroic',
        delta: 10,
        confidence: 0.7,
        sourceRecordId: record.id,
        witnessId: 'npc-1',
      },
    ];

    const carriers = seedRumorsFromWitnessRecords(event, [record]);
    const edges = buildSocialEdges({ mapArea: area });

    store.dispatch(
      applyEventIntegration({
        event,
        records: [record],
        profileMutations: mutations,
        carriers,
        edges,
      })
    );

    const stateAfter = store.getState();
    expect(Object.keys(stateAfter.reputation.events)).toHaveLength(1);

    const witnessTrait = extractTrait(stateAfter, 'npc-1', 'heroic');
    expect(witnessTrait).toBeGreaterThan(0);

    const cellTrait = extractTrait(stateAfter, '0:0', 'heroic');
    expect(cellTrait).toBeGreaterThan(0);
  });

  it('decays and propagates rumors over time', () => {
    const store = createStore();
    const npcs = [createNPC('npc-a', 5, 5), createNPC('npc-b', 7, 5)];
    const area = createArea(npcs);

    const event = createReputationEvent({
      actorId: 'player',
      zoneId: area.zoneId,
      position: { x: 5, y: 5 },
      intensity: 'major',
      traits: { heroic: 24 },
      tags: ['rescue'],
      timestamp: 1_000,
    });

    const record: WitnessRecord = {
      id: 'record-2',
      eventId: event.id,
      witnessId: 'npc-a',
      witnessName: 'npc-a',
      factionId: 'resistance',
      zoneId: area.zoneId,
      cellId: '0:0',
      timestamp: event.timestamp,
      visibilityScore: 0.92,
      confidence: 0.88,
      isRumorOnly: false,
      traits: [{ trait: 'heroic', delta: 18, confidence: 0.88, source: 'witness' }],
    };

    const mutations: ReputationProfileMutation[] = [
      {
        scopeId: 'npc-a',
        scope: 'witness',
        factionId: 'resistance',
        cellId: '0:0',
        trait: 'heroic',
        delta: 18,
        confidence: 0.88,
        sourceRecordId: record.id,
        witnessId: 'npc-a',
      },
      {
        scopeId: '0:0',
        scope: 'cell',
        factionId: 'resistance',
        cellId: '0:0',
        trait: 'heroic',
        delta: 12,
        confidence: 0.78,
        sourceRecordId: record.id,
        witnessId: 'npc-a',
      },
    ];

    const carriers = seedRumorsFromWitnessRecords(event, [record]);
    const edges = buildSocialEdges({ mapArea: area });

    store.dispatch(
      applyEventIntegration({
        event,
        records: [record],
        profileMutations: mutations,
        carriers,
        edges,
      })
    );

    const propagation = advanceRumors({
      timestamp: event.timestamp + 60,
      elapsedSeconds: 60,
      carriers,
      edges,
    });

    store.dispatch(
      applyPropagationResult({
        carriers: propagation.carriers,
        edges: propagation.edges,
        profileMutations: propagation.mutations,
      })
    );
    const dispatch = store.dispatch as unknown as AppDispatch;
    const getState = store.getState as unknown as () => RootState;
    tickLocalizedReputation(90, 1_000 + 90_000)(dispatch, getState);

    const state = store.getState();
    const witnessTrait = extractTrait(state, 'npc-a', 'heroic');
    const propagatedTrait = extractTrait(state, 'npc-b', 'heroic');

    expect(witnessTrait).toBeGreaterThan(0);
    expect(propagatedTrait).toBeGreaterThanOrEqual(0);
  });
});
