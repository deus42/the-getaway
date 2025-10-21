import suspicionReducer, {
  createSuspicionInitialState,
  ingestObservation,
  applySuspicionDecay,
  suppressWitnessMemory,
  getHighestHeatTier,
  purgeWitnessMemories,
} from '../suspicionSlice';
import type { SuspicionState } from '../suspicionSlice';
import type { WitnessObservation } from '../../game/systems/suspicion/types';

const buildObservation = (overrides: Partial<WitnessObservation> = {}): WitnessObservation => ({
  witnessId: 'guard-1',
  targetId: 'player',
  zoneId: 'downtown',
  areaId: 'downtown-block-a',
  timestamp: 120,
  source: 'guard',
  recognitionChannel: 'face',
  baseCertainty: 0.8,
  distanceModifier: 0.9,
  lightingModifier: 0.8,
  disguiseModifier: 0.95,
  postureModifier: 0.7,
  reported: true,
  location: { x: 4, y: 6 },
  ...overrides,
});

describe('suspicionSlice', () => {
  const reduce = (state: SuspicionState, action: any): SuspicionState => suspicionReducer(state, action);

  it('ingests observations and tracks zone memory', () => {
    let state = createSuspicionInitialState();
    state = reduce(state, ingestObservation(buildObservation()));

    const zone = state.zones['downtown'];
    expect(zone).toBeDefined();
    expect(Object.keys(zone.memories)).toHaveLength(1);
    expect(zone.heat.totalHeat).toBeGreaterThan(0);
  });

  it('decays memories and prunes when certainty drops below floor', () => {
    let state = createSuspicionInitialState();
    state = reduce(state, ingestObservation(buildObservation({ timestamp: 0 })));

    const beforeHeat = state.zones['downtown'].heat.totalHeat;
    state = reduce(state, applySuspicionDecay({ elapsedSeconds: 3600 * 100, timestamp: 3600 * 100 }));

    expect(state.zones['downtown'].heat.totalHeat).toBeLessThan(beforeHeat);
  });

  it('suppresses memories to remove them from heat aggregation', () => {
    let state = createSuspicionInitialState();
    state = reduce(state, ingestObservation(buildObservation()));

    const zone = state.zones['downtown'];
    const memoryId = Object.keys(zone.memories)[0];
    const heatBefore = zone.heat.totalHeat;

    state = reduce(state, suppressWitnessMemory({ zoneId: 'downtown', memoryId, suppressed: true }));
    const suppressedZone = state.zones['downtown'];
    expect(suppressedZone.memories[memoryId]?.suppressed).toBe(true);
    expect(suppressedZone.heat.totalHeat).toBeLessThan(heatBefore);
  });

  it('purges memories when witness removed', () => {
    let state = createSuspicionInitialState();
    state = reduce(
      state,
      ingestObservation(
        buildObservation({
          witnessId: 'guard-xyz',
          witnessLabel: 'Guard XYZ',
          timestamp: 0,
        })
      )
    );

    expect(state.zones['downtown']).toBeDefined();
    state = reduce(state, purgeWitnessMemories({ witnessId: 'guard-xyz', zoneId: 'downtown' }));
    expect(Object.keys(state.zones['downtown'].memories)).toHaveLength(0);
    expect(state.zones['downtown'].heat.totalHeat).toBe(0);
  });

  it('computes highest tier across zones', () => {
    let state = createSuspicionInitialState();
    state = reduce(state, ingestObservation(buildObservation({ witnessId: 'guard-a', baseCertainty: 0.95 })));
    state = reduce(state, ingestObservation(buildObservation({ witnessId: 'guard-b', zoneId: 'industrial', baseCertainty: 0.7 })));

    expect(getHighestHeatTier(state.zones)).toBeDefined();
  });
});
