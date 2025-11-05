import { interpretWitnessRecords } from '../interpretation';
import { ReputationEvent, WitnessCandidate } from '../types';

const baseEvent: ReputationEvent = {
  id: 'evt-heroic',
  actorId: 'player',
  actorLabel: 'Player',
  zoneId: 'zone::test',
  cellId: '0:0',
  position: { x: 4, y: 4 },
  intensity: 'major',
  traits: { heroic: 24, sneaky: 4 },
  tags: ['rescue'],
  timestamp: 1000,
  visibility: {
    base: 0.8,
    noiseLevel: 0.6,
    lightingFactor: 0.9,
    disguiseFactor: 0.8,
    crowdDensity: 0.4,
  },
};

const createCandidate = (overrides?: Partial<WitnessCandidate>): WitnessCandidate => ({
  witnessId: 'npc-1',
  name: 'Witness',
  factionId: 'resistance',
  zoneId: 'zone::test',
  cellId: '0:0',
  position: { x: 5, y: 4 },
  distance: 2,
  lineOfSight: 0.9,
  distanceFactor: 0.8,
  lightingFactor: 0.9,
  noiseFactor: 0.7,
  disguiseFactor: 0.8,
  visibilityScore: 0.72,
  baseConfidence: 0.88,
  isRumorOnly: false,
  bias: {
    traitWeights: {
      heroic: 1.1,
      sneaky: 0.6,
    },
    skepticism: 0.2,
    appetiteForRumors: 0.5,
  },
  ...overrides,
});

describe('interpretWitnessRecords', () => {
  it('returns trait deltas weighted by bias for direct witnesses', () => {
    const records = interpretWitnessRecords({
      event: baseEvent,
      candidates: [createCandidate()],
    });

    expect(records.length).toBeGreaterThan(0);
    const [record] = records;
    const heroic = record.traits.find((trait) => trait.trait === 'heroic');
    const sneaky = record.traits.find((trait) => trait.trait === 'sneaky');

    expect(heroic?.delta ?? 0).toBeGreaterThan(sneaky?.delta ?? 0);
    expect(heroic?.confidence ?? 0).toBeGreaterThan(0.3);
    expect(record.isRumorOnly).toBe(false);
  });

  it('reduces confidence for rumor-only observers', () => {
    const records = interpretWitnessRecords({
      event: baseEvent,
      candidates: [
        createCandidate({
          witnessId: 'npc-rumor',
          isRumorOnly: true,
          baseConfidence: 0.85,
          visibilityScore: 0.45,
          bias: {
            traitWeights: { heroic: 0.9 },
            skepticism: 0.1,
            appetiteForRumors: 1,
          },
        }),
      ],
    });

    expect(records.length).toBeGreaterThan(0);
    const [record] = records;
    expect(record.isRumorOnly).toBe(true);
    const heroic = record.traits.find((trait) => trait.trait === 'heroic');
    expect(heroic?.confidence ?? 0).toBeLessThan(0.5);
  });
});
