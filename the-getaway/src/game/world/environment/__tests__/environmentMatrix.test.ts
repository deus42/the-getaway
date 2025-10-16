import {
  ALL_ENVIRONMENTAL_FACTORS,
  combineSystemImpacts,
  createNeutralImpact,
  ENVIRONMENT_MATRIX,
  resolveEnvironmentalFactors,
} from '../environmentMatrix';

describe('environmentMatrix', () => {
  it('defines matrix entries for every environmental factor', () => {
    const uncovered = ALL_ENVIRONMENTAL_FACTORS.filter((factor) => !ENVIRONMENT_MATRIX[factor]);
    expect(uncovered).toHaveLength(0);
  });

  it('resolves industrial hazard mix into expected factor set', () => {
    const factors = resolveEnvironmentalFactors({
      flags: {
        gangHeat: 'med',
        curfewLevel: 2,
        supplyScarcity: 'tight',
        blackoutTier: 'brownout',
      },
      zoneHazards: [
        'Toxic smog plumes reducing visibility and draining health',
        'Open radiation pockets around collapsed reactors',
        'Autonomous patrol drones scanning alleys',
      ],
      zoneId: 'industrial_corridor',
    });

    expect(factors).toContain('smog:heavy');
    expect(factors).toContain('radiation:localized');
    expect(factors).toContain('blackout:brownout');
    expect(factors).toContain('surveillance:extreme');
    expect(factors).toContain('curfew:tight');
    expect(factors).toHaveLength(5);
  });

  it('combines layered factors into a bounded impact summary', () => {
    const combined = combineSystemImpacts([
      'smog:heavy',
      'blackout:rolling',
      'surveillance:extreme',
      'radiation:localized',
      'curfew:lockdown',
    ]);

    expect(combined.behavior.sightMultiplier).toBeCloseTo(0.61, 2);
    expect(combined.behavior.chaseMultiplier).toBeCloseTo(1.40, 2);
    expect(combined.behavior.routineIntervalMultiplier).toBeCloseTo(1.86, 2);
    expect(combined.behavior.loadoutBias).toBe('sensor');

    expect(combined.faction.shopMarkupDelta).toBeCloseTo(0.40, 2);
    expect(combined.faction.reinforcementDelayMultiplier).toBeCloseTo(0.44, 2);
    expect(combined.faction.safehouseAccess).toBe('sealed');

    expect(combined.travel.staminaDrainPerMinute).toBe(5);
    expect(combined.travel.vehicleWearMultiplier).toBeCloseTo(1.52, 2);
    expect(combined.travel.encounterRiskModifier).toBeCloseTo(3, 5);
    expect(combined.travel.visibilityMultiplier).toBeCloseTo(0.385, 3);
    expect(combined.travel.advisoryLevel).toBe('severe');
  });

  it('starts from a neutral baseline', () => {
    expect(createNeutralImpact()).toEqual({
      behavior: {
        sightMultiplier: 1,
        chaseMultiplier: 1,
        routineIntervalMultiplier: 1,
        loadoutBias: 'balanced',
      },
      faction: {
        shopMarkupDelta: 0,
        reinforcementDelayMultiplier: 1,
        safehouseAccess: 'open',
      },
      travel: {
        staminaDrainPerMinute: 0,
        vehicleWearMultiplier: 1,
        encounterRiskModifier: 1,
        advisoryLevel: 'clear',
        visibilityMultiplier: 1,
      },
    });
  });
});
