import { createConfirmedLevel0Sample } from '../creation';
import {
  LEVEL0_CHECK_CATALOG,
  commitLevel0CheckResolution,
  getParanoiaCheckPenalty,
  resolveLevel0Check,
} from '../checks';
import { createInitialLevel0RunState } from '../../runtime/safehouse';

const buildFor = (sample: 'social_mental' | 'technical_evasion') => {
  return createConfirmedLevel0Sample(sample, sample);
};

describe('Level 0 deterministic checks', () => {
  it.each([
    [0, 0],
    [39, 0],
    [40, 1],
    [69, 1],
    [70, 2],
    [89, 2],
    [90, 3],
    [99, 3],
  ])('maps Paranoia %i to penalty %i', (paranoia, penalty) => {
    expect(getParanoiaCheckPenalty(paranoia)).toBe(penalty);
  });

  it('uses exactly one attribute, one skill, visible requirement, and no RNG', () => {
    const { build } = buildFor('technical_evasion');
    const result = resolveLevel0Check({
      requirement: LEVEL0_CHECK_CATALOG['check.camera_loop'],
      build,
      paranoia: 40,
      knownFactIds: [],
      activeContextIds: [],
    });

    expect(result).toMatchObject({
      checkId: 'check.camera_loop',
      attribute: 'technical',
      attributeValue: 3,
      skill: 'systems',
      skillValue: 2,
      paranoiaPenalty: 1,
      baseRequiredTotal: 4,
      effectiveRequiredTotal: 4,
      finalTotal: 4,
      outcome: 'success',
      guaranteedByFactId: null,
    });
  });

  it('applies only declared fact behavior and scopes guarantees to one check', () => {
    const { build } = buildFor('social_mental');
    const lowered = resolveLevel0Check({
      requirement: LEVEL0_CHECK_CATALOG['check.camera_loop'],
      build,
      paranoia: 0,
      knownFactIds: ['fact.naila.camera_topology', 'fact.undeclared.bonus'],
      activeContextIds: [],
    });
    expect(lowered.effectiveRequiredTotal).toBe(3);
    expect(lowered.appliedFactIds).toEqual(['fact.naila.camera_topology']);

    const guaranteed = resolveLevel0Check({
      requirement: LEVEL0_CHECK_CATALOG['check.manifest_recognition'],
      build,
      paranoia: 90,
      knownFactIds: ['fact.naila.cold_iron_pattern'],
      activeContextIds: [],
    });
    expect(guaranteed.outcome).toBe('success');
    expect(guaranteed.guaranteedByFactId).toBe('fact.naila.cold_iron_pattern');

    const unrelated = resolveLevel0Check({
      requirement: LEVEL0_CHECK_CATALOG['check.camera_trace'],
      build,
      paranoia: 0,
      knownFactIds: ['fact.naila.cold_iron_pattern'],
      activeContextIds: [],
    });
    expect(unrelated.guaranteedByFactId).toBeNull();
    expect(unrelated.appliedFactIds).toEqual([]);
  });

  it('applies the Evasion reduction only for the node-named nearby hiding fact', () => {
    const { build } = buildFor('technical_evasion');
    const facts = [
      'fact.world.hiding.hide.service_recess',
      'fact.world.hiding.hide.transit_structure',
    ];
    const farOnly = resolveLevel0Check({
      requirement: LEVEL0_CHECK_CATALOG['check.intercept_evasion'],
      build,
      paranoia: 0,
      knownFactIds: facts,
      activeContextIds: ['context.nearby_hiding.hide.maintenance_bay'],
    });
    expect(farOnly.effectiveRequiredTotal).toBe(5);
    expect(farOnly.appliedFactIds).toEqual([]);

    const namedNearby = resolveLevel0Check({
      requirement: LEVEL0_CHECK_CATALOG['check.intercept_evasion'],
      build,
      paranoia: 0,
      knownFactIds: facts,
      activeContextIds: ['context.nearby_hiding.hide.service_recess'],
    });
    expect(namedNearby.effectiveRequiredTotal).toBe(4);
    expect(namedNearby.appliedFactIds).toEqual([
      'fact.world.hiding.hide.service_recess',
    ]);
  });

  it('stops resolution at fatal Paranoia and commits one immutable attempt', () => {
    const sample = buildFor('technical_evasion');
    const fatal = resolveLevel0Check({
      requirement: LEVEL0_CHECK_CATALOG['check.camera_loop'],
      build: sample.build,
      paranoia: 100,
      knownFactIds: [],
      activeContextIds: [],
    });
    expect(fatal.outcome).toBe('fatal');

    const run = createInitialLevel0RunState('check-run', sample.identity, sample.build);
    const first = commitLevel0CheckResolution(run, {
      resolutionId: 'resolution.camera-loop.once',
      checkId: 'check.camera_loop',
      activeContextIds: [],
    });
    const reopened = commitLevel0CheckResolution(first.run, {
      resolutionId: 'resolution.camera-loop.reopened-with-new-id',
      checkId: 'check.camera_loop',
      activeContextIds: [],
    });
    expect(first.applied).toBe(true);
    expect(first.resolution).toMatchObject({
      paranoiaValue: 0,
      activeContextIds: [],
    });
    expect(reopened.applied).toBe(false);
    expect(reopened.resolution).toEqual(first.resolution);
    expect(Object.keys(reopened.run.rpg.resolvedChecks)).toEqual([
      'resolution.camera-loop.once',
    ]);

    expect(() => commitLevel0CheckResolution(first.run, {
      resolutionId: 'resolution.camera-loop.once',
      checkId: 'check.camera_loop',
      activeContextIds: ['context.distinct-authored-attempt'],
    })).toThrow('already belongs to another check attempt');

    const distinctContext = commitLevel0CheckResolution(first.run, {
      resolutionId: 'resolution.camera-loop.distinct-context',
      checkId: 'check.camera_loop',
      activeContextIds: ['context.distinct-authored-attempt'],
    });
    expect(distinctContext.applied).toBe(true);
    expect(distinctContext.resolution?.attemptKey).not.toBe(first.resolution?.attemptKey);
  });

  it('refuses to commit a new check after the run reaches a terminal state', () => {
    const sample = buildFor('technical_evasion');
    const failed = {
      ...createInitialLevel0RunState('check-terminal', sample.identity, sample.build),
      mission: 'L0_FAILED' as const,
      failureCause: 'failure.capture' as const,
      failureSourceId: 'interception.identity_gate',
    };

    const result = commitLevel0CheckResolution(failed, {
      resolutionId: 'resolution.after-failure',
      checkId: 'check.camera_loop',
      activeContextIds: [],
    });

    expect(result).toMatchObject({
      applied: false,
      resolution: null,
      blockedReasonId: 'check.blocked.terminal',
    });
    expect(result.run).toBe(failed);
  });
});
