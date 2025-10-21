import {
  buildWitnessMemoryId,
  calculateObservationCertainty,
  createWitnessMemory,
  decayWitnessMemory,
  reinforceWitnessMemory,
  toWitnessMemorySnapshot,
  fromWitnessMemorySnapshot,
} from '../witnessMemory';
import { calculateZoneHeat, determineHeatTier } from '../aggregation';
import { DEFAULT_HEAT_PROFILE } from '../../../../content/suspicion/heatProfiles';
import { WitnessObservation, HeatProfile } from '../types';

const HOURS = 3600;

const makeObservation = (overrides: Partial<WitnessObservation> = {}): WitnessObservation => ({
  witnessId: 'guard-1',
  witnessLabel: 'Guard 1',
  targetId: 'player',
  zoneId: 'downtown',
  areaId: 'downtown-block-a',
  timestamp: 100,
  source: 'guard',
  recognitionChannel: 'face',
  baseCertainty: 0.9,
  distanceModifier: 0.8,
  lightingModifier: 0.9,
  disguiseModifier: 1,
  postureModifier: 0.7,
  reported: true,
  location: { x: 12, y: 4 },
  ...overrides,
});

const makeProfile = (overrides: Partial<HeatProfile> = {}): HeatProfile => ({
  ...DEFAULT_HEAT_PROFILE,
  ...overrides,
});

describe('Witness memory helpers', () => {
  it('builds deterministic ids per witness/target/channel', () => {
    const id = buildWitnessMemoryId('guard-1', 'player', 'face');
    expect(id).toBe('guard-1:player:face');
  });

  it('calculates observation certainty using multiplicative modifiers', () => {
    const certainty = calculateObservationCertainty(makeObservation());
    const expected = 0.9 * 0.8 * 0.9 * 1 * 0.7;
    expect(certainty).toBeCloseTo(expected, 5);
  });

  it('clamps certainty to max of 1', () => {
    const certainty = calculateObservationCertainty(
      makeObservation({
        baseCertainty: 1.2,
        distanceModifier: 2,
        lightingModifier: 1.5,
        postureModifier: 1,
      })
    );
    expect(certainty).toBeCloseTo(1);
  });

  it('creates witness memory snapshot with half-life and metadata', () => {
    const profile = makeProfile({ halfLifeSeconds: 24 * HOURS });
    const observation = makeObservation();
    const memory = createWitnessMemory(observation, profile);

    expect(memory.id).toBe(buildWitnessMemoryId(observation.witnessId, observation.targetId, observation.recognitionChannel));
    expect(memory.halfLifeSeconds).toBe(profile.halfLifeSeconds);
    expect(memory.firstSeenAt).toBe(observation.timestamp);
    expect(memory.lastSeenAt).toBe(observation.timestamp);
    expect(memory.reported).toBeTruthy();
    expect(memory.proximityWeight).toBeCloseTo(observation.distanceModifier);
    expect(memory.witnessLabel).toBe(observation.witnessLabel);
  });

  it('reinforces memory raising certainty and refreshing timestamp', () => {
    const profile = makeProfile({ reinforcementBonus: 0.5 });
    const initialObservation = makeObservation({ timestamp: 0, baseCertainty: 0.4 });
    const memory = createWitnessMemory(initialObservation, profile);

    const followUp = makeObservation({
      timestamp: 120,
      baseCertainty: 0.6,
      distanceModifier: 1,
      lightingModifier: 1,
      postureModifier: 1,
    });
    const reinforced = reinforceWitnessMemory(memory, followUp, profile);

    expect(reinforced.certainty).toBeGreaterThan(memory.certainty);
    expect(reinforced.lastSeenAt).toBe(followUp.timestamp);
    expect(reinforced.reinforcedAt).toBe(followUp.timestamp);
  });

  it('round-trips memory snapshots without losing detail', () => {
    const profile = makeProfile();
    const memory = createWitnessMemory(makeObservation(), profile);
    const snapshot = toWitnessMemorySnapshot(memory);
    const restored = fromWitnessMemorySnapshot(snapshot);
    expect(restored.certainty).toBeCloseTo(memory.certainty);
    expect(restored.firstSeenAt).toBe(memory.firstSeenAt);
    expect(restored.zoneId).toBe(memory.zoneId);
    expect(restored.witnessLabel).toBe(memory.witnessLabel);
  });

  it('decays certainty according to configured half-life', () => {
    const profile = makeProfile({ halfLifeSeconds: 10 });
    const memory = createWitnessMemory(
      makeObservation({
        timestamp: 0,
        baseCertainty: 1,
        distanceModifier: 1,
        lightingModifier: 1,
        postureModifier: 1,
      }),
      profile
    );

    const { memory: decayed } = decayWitnessMemory(memory, 10, profile);
    expect(decayed.certainty).toBeCloseTo(0.5, 5);

    const further = decayWitnessMemory(decayed, 10, profile);
    expect(further.memory.certainty).toBeCloseTo(0.25, 5);
    expect(further.pruned).toBe(false);
  });

  it('flags memories for pruning when certainty drops below floor', () => {
    const profile = makeProfile({ certaintyFloor: 0.1, halfLifeSeconds: 5 });
    const memory = createWitnessMemory(
      makeObservation({
        timestamp: 0,
        baseCertainty: 0.2,
        distanceModifier: 1,
        lightingModifier: 1,
        postureModifier: 1,
      }),
      profile
    );

    const { pruned } = decayWitnessMemory(memory, 15, profile);
    expect(pruned).toBe(true);
  });
});

describe('Zone heat aggregation', () => {
  it('returns calm tier when no active memories remain', () => {
    const result = calculateZoneHeat('downtown', [], DEFAULT_HEAT_PROFILE);
    expect(result.totalHeat).toBe(0);
    expect(result.tier).toBe('calm');
  });

  it('sums weighted top memories and resolves tier thresholds', () => {
    const profile = makeProfile({
      certaintyFloor: 0.05,
      topK: 2,
      tierThresholds: { tracking: 0.2, crackdown: 0.6 },
    });

    const baseObservation = makeObservation({
      baseCertainty: 0.8,
      distanceModifier: 1,
      lightingModifier: 1,
      postureModifier: 1,
      timestamp: 10,
    });

    const memories = [
      createWitnessMemory(baseObservation, profile),
      createWitnessMemory(
        makeObservation({
          witnessId: 'guard-2',
          timestamp: 12,
          baseCertainty: 0.7,
          distanceModifier: 0.9,
          lightingModifier: 0.9,
          postureModifier: 1,
        }),
        profile
      ),
      createWitnessMemory(
        makeObservation({
          witnessId: 'guard-3',
          timestamp: 15,
          baseCertainty: 0.3,
          distanceModifier: 0.6,
          lightingModifier: 0.6,
          postureModifier: 1,
        }),
        profile
      ),
    ];

    const calm = calculateZoneHeat('downtown', memories, profile);
    expect(calm.totalHeat).toBeGreaterThan(0.2);
    expect(calm.tier === 'tracking' || calm.tier === 'crackdown').toBe(true);

    const tier = determineHeatTier(0.7, profile);
    expect(tier).toBe('crackdown');
  });
});
