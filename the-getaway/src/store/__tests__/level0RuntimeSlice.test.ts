import reducer, {
  acquireLevel0Pause,
  advanceLevel0Clock,
  applyLevel0SafehouseAction,
  commitLevel0Departure,
  hydrateLevel0Run,
  initializeLevel0Run,
  releaseLevel0Pause,
  syncLevel0PlayerCheckpoint,
} from '../level0RuntimeSlice';

describe('level0RuntimeSlice', () => {
  it('initializes an isolated canonical run', () => {
    const state = reducer(undefined, initializeLevel0Run({ sessionId: 'session-1' }));

    expect(state.status).toBe('active');
    expect(state.run?.sessionId).toBe('session-1');
    expect(state.run?.worldClock.currentMinute).toBe(18 * 60 + 30);
    expect(state.run?.safehouse.insideBoundary).toBe(true);
  });

  it('keeps pause ownership additive and advances only after every owner releases', () => {
    let state = reducer(undefined, initializeLevel0Run({ sessionId: 'session-1' }));
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
    let state = reducer(undefined, initializeLevel0Run({ sessionId: 'session-1' }));
    state = reducer(
      state,
      syncLevel0PlayerCheckpoint({ position: { x: 40, y: 30 }, facing: { x: 1, y: 0 } })
    );

    expect(state.run?.player.position).toEqual({ x: 40, y: 30 });
    expect(state.run?.safehouse.insideBoundary).toBe(false);
  });

  it('applies safehouse actions and creates one departure snapshot request', () => {
    let state = reducer(undefined, initializeLevel0Run({ sessionId: 'session-1' }));
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
    const initialized = reducer(undefined, initializeLevel0Run({ sessionId: 'session-1' }));
    const run = JSON.parse(JSON.stringify(initialized.run!)) as NonNullable<typeof initialized.run>;
    run.worldClock.pauseOwners = ['menu', 'observation', 'safehouse_action'];

    const hydrated = reducer(undefined, hydrateLevel0Run(run));

    expect(hydrated.run?.worldClock.pauseOwners).toEqual([]);
  });

  it('turns the midnight deadline into an exact paused failure', () => {
    let state = reducer(undefined, initializeLevel0Run({ sessionId: 'session-1' }));
    state = reducer(state, advanceLevel0Clock({ realDeltaMilliseconds: 11 * 60 * 1_000 }));

    expect(state.run?.mission).toBe('L0_FAILED');
    expect(state.run?.failureCause).toBe('failure.deadline');
    expect(state.run?.worldClock.pauseOwners).toContain('failure');
  });
});
