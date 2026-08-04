import reducer, {
  acquireLevel0Pause,
  advanceLevel0Clock,
  allocateLevel0Skill,
  applyLevel0Resource,
  applyLevel0SafehouseAction,
  awardLevel0Milestone,
  commitLevel0Departure,
  commitLevel0RpgCheck,
  hydrateLevel0Run,
  initializeLevel0Run,
  activateLevel0PendingLevel,
  releaseLevel0Pause,
  syncLevel0PlayerCheckpoint,
} from '../level0RuntimeSlice';
import { createConfirmedLevel0Sample } from '../../game/level0/rpg/creation';

const initialize = (sessionId: string) => {
  const sample = createConfirmedLevel0Sample('technical_evasion', 'Sora');
  return initializeLevel0Run({ sessionId, ...sample });
};

describe('level0RuntimeSlice', () => {
  it('initializes an isolated canonical run', () => {
    const state = reducer(undefined, initialize('session-1'));

    expect(state.status).toBe('active');
    expect(state.run?.sessionId).toBe('session-1');
    expect(state.run?.worldClock.currentMinute).toBe(18 * 60 + 30);
    expect(state.run?.safehouse.insideBoundary).toBe(true);
    expect(state.run?.identity.callsign).toBe('Sora');
    expect(state.run?.build.skills.systems).toBe(2);
  });

  it('keeps pause ownership additive and advances only after every owner releases', () => {
    let state = reducer(undefined, initialize('session-1'));
    state = reducer(state, acquireLevel0Pause('menu'));
    state = reducer(state, acquireLevel0Pause('observation'));
    state = reducer(state, advanceLevel0Clock({ realDeltaMilliseconds: 2_000 }));
    expect(state.run?.worldClock.currentMinute).toBe(18 * 60 + 30);

    state = reducer(state, releaseLevel0Pause('menu'));
    state = reducer(state, advanceLevel0Clock({ realDeltaMilliseconds: 2_000 }));
    expect(state.run?.worldClock.currentMinute).toBe(18 * 60 + 30);

    state = reducer(state, releaseLevel0Pause('observation'));
    state = reducer(state, advanceLevel0Clock({ realDeltaMilliseconds: 2_000 }));
    expect(state.run?.worldClock.currentMinute).toBe(18 * 60 + 31);
  });

  it('synchronizes the player and derives safehouse membership from the authored boundary', () => {
    let state = reducer(undefined, initialize('session-1'));
    state = reducer(
      state,
      syncLevel0PlayerCheckpoint({ position: { x: 40, y: 30 }, facing: { x: 1, y: 0 } })
    );

    expect(state.run?.player.position).toEqual({ x: 40, y: 30 });
    expect(state.run?.safehouse.insideBoundary).toBe(false);
  });

  it('applies safehouse actions and creates one departure snapshot request', () => {
    let state = reducer(undefined, initialize('session-1'));
    state = reducer(state, applyLevel0SafehouseAction('wait'));
    expect(state.run?.worldClock.currentMinute).toBe(19 * 60);

    const departedRun = {
      ...state.run!,
      mission: 'L0_OPERATION_DEPARTED' as const,
      safehouse: { ...state.run!.safehouse, departureSnapshotCreated: true },
    };
    state = reducer(state, commitLevel0Departure(departedRun));
    expect(state.run?.mission).toBe('L0_OPERATION_DEPARTED');
    expect(state.feedbackId).toBe('safehouse.departure.complete');
    expect(state.sceneRevision).toBe(2);
  });

  it('normalizes transient pause owners during hydration', () => {
    const initialized = reducer(undefined, initialize('session-1'));
    const run = JSON.parse(JSON.stringify(initialized.run!)) as NonNullable<typeof initialized.run>;
    run.worldClock.pauseOwners = ['menu', 'observation', 'safehouse_action'];

    const hydrated = reducer(undefined, hydrateLevel0Run(run));

    expect(hydrated.run?.worldClock.pauseOwners).toEqual([]);
  });

  it('turns the midnight deadline into an exact paused failure', () => {
    let state = reducer(undefined, initialize('session-1'));
    state = reducer(state, advanceLevel0Clock({ realDeltaMilliseconds: 11 * 60 * 1_000 }));

    expect(state.run?.mission).toBe('L0_FAILED');
    expect(state.run?.failureCause).toBe('failure.deadline');
    expect(state.run?.failureSourceId).toBe('clock.deadline');
    expect(state.run?.worldClock.pauseOwners).toContain('failure');
  });

  it('commits each deterministic check resolution once through the canonical slice', () => {
    let state = reducer(undefined, initialize('session-check'));
    const action = commitLevel0RpgCheck({
      resolutionId: 'resolution.camera-loop.1',
      checkId: 'check.camera_loop',
      activeContextIds: [],
    });
    state = reducer(state, action);
    state = reducer(state, action);

    expect(Object.keys(state.run!.rpg.resolvedChecks)).toEqual(['resolution.camera-loop.1']);
    expect(state.run!.rpg.resolvedChecks['resolution.camera-loop.1']).toMatchObject({
      outcome: 'success',
      finalTotal: 5,
      effectiveRequiredTotal: 4,
    });
    expect(state.feedbackId).toBe('check.result.success');
  });

  it('applies sourced resource effects and fatal failure through the canonical slice', () => {
    let state = reducer(undefined, initialize('session-resource'));
    state = reducer(state, applyLevel0Resource({
      eventId: 'resource.test.paranoia-fatal',
      resource: 'paranoia',
      amount: 100,
      sourceId: 'test.camera',
      feedbackId: 'resource.paranoia.test',
      retryTreatment: 'discard-on-retry',
    }));

    expect(state.run).toMatchObject({
      paranoia: 100,
      mission: 'L0_FAILED',
      failureCause: 'failure.paranoia',
      failureSourceId: 'test.camera',
    });
    expect(state.feedbackId).toBeNull();
    expect(state.feedbackResourceEventIds).toEqual(['resource.test.paranoia-fatal']);
  });

  it('awards, activates, and allocates authored progression in the safehouse', () => {
    let state = reducer(undefined, initialize('session-progression'));
    state = reducer(state, awardLevel0Milestone('milestone.medkits_returned'));
    state = reducer(state, awardLevel0Milestone('milestone.transit_validated'));
    state = reducer(state, activateLevel0PendingLevel());
    state = reducer(state, allocateLevel0Skill('awareness'));

    expect(state.run?.build).toMatchObject({
      level: 2,
      xp: 100,
      unspentSkillPoints: 1,
    });
    expect(state.run?.build.skills.awareness).toBe(1);
    expect(state.feedbackId).toBe('level_up.skill.allocated');
  });
});
