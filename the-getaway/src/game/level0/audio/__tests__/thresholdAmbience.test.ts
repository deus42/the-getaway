import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import {
  computeAmbienceGain,
  computeAmbiencePan,
  LEVEL0_AMBIENCE_EMITTERS,
} from '../thresholdAmbience';

describe('Level 0 threshold ambience (GDR-AUD-002, OPEN-AUD-001 provisional)', () => {
  const emitters = Object.values(LEVEL0_AMBIENCE_EMITTERS);

  it('authors exactly the three approved spatial sources bound to real audio anchors', () => {
    expect(emitters.map((emitter) => emitter.id).sort()).toEqual([
      'ambience.apartment',
      'ambience.restaurant',
      'ambience.workshop',
    ]);
    for (const emitter of emitters) {
      const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
        (candidate) => candidate.id === emitter.anchorId
      );
      expect(anchor).toBeDefined();
      expect(anchor?.kind).toBe('audio');
      expect(anchor?.ownerId).toBe(emitter.id);
      expect(emitter.subtitle.en.trim().length).toBeGreaterThan(0);
      expect(emitter.subtitle.uk.trim().length).toBeGreaterThan(0);
    }
  });

  it('defines a loudness target for every street stage on every source', () => {
    for (const emitter of emitters) {
      for (const stage of [
        'evening',
        'wind-down-first',
        'wind-down-second',
        'curfew',
        'last-train',
      ] as const) {
        const level = emitter.stageLevels[stage];
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      }
    }
  });

  it('follows the clock: street businesses fade by curfew while the apartment stays alive', () => {
    const restaurant = LEVEL0_AMBIENCE_EMITTERS['ambience.restaurant'];
    const workshop = LEVEL0_AMBIENCE_EMITTERS['ambience.workshop'];
    const apartment = LEVEL0_AMBIENCE_EMITTERS['ambience.apartment'];
    expect(restaurant.stageLevels.curfew).toBeLessThan(restaurant.stageLevels.evening);
    expect(workshop.stageLevels.curfew).toBeLessThan(workshop.stageLevels.evening);
    expect(apartment.stageLevels.curfew).toBeGreaterThanOrEqual(apartment.stageLevels.evening);
  });

  it('falls off with distance and is silent beyond the threshold reach', () => {
    const restaurant = LEVEL0_AMBIENCE_EMITTERS['ambience.restaurant'];
    const atDoor = computeAmbienceGain(restaurant, { distance: 0, radius: 5, stage: 'evening' });
    const nearby = computeAmbienceGain(restaurant, { distance: 2.5, radius: 5, stage: 'evening' });
    const far = computeAmbienceGain(restaurant, { distance: 7, radius: 5, stage: 'evening' });
    expect(atDoor).toBeCloseTo(1);
    expect(nearby).toBeLessThan(atDoor);
    expect(nearby).toBeGreaterThan(0);
    expect(far).toBe(0);
    expect(
      computeAmbienceGain(restaurant, { distance: 1, radius: 0, stage: 'evening' })
    ).toBe(0);
  });

  it('pans toward the emitter and clamps to the stereo field', () => {
    expect(computeAmbiencePan(20, 24)).toBeCloseTo(0.5);
    expect(computeAmbiencePan(24, 20)).toBeCloseTo(-0.5);
    expect(computeAmbiencePan(0, 100)).toBe(1);
    expect(computeAmbiencePan(100, 0)).toBe(-1);
  });
});
