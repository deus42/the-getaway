import {
  applySafehouseRest,
  applySafehouseWait,
  departLevel0Operation,
  evaluateSafehouseAction,
  restoreLevel0RetrySnapshot,
} from '../safehouse';
import { createTestLevel0RunState } from '../../testing/createTestLevel0RunState';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';

const DEPARTURE_POSITION = LEVEL0_LAYOUT_CONTRACT.anchors.find(
  (anchor) => anchor.id === 'safehouse.departure'
)!.position;

const prepareForDeparture = (run: ReturnType<typeof createTestLevel0RunState>) => ({
  ...run,
  mission: 'L0_PREPARATION' as const,
});

describe('Level 0 safehouse and departure Retry foundation', () => {
  it('makes safehouse actions explicit and blocks them without clearing active surveillance', () => {
    const clearRun = createTestLevel0RunState('run-safehouse');
    expect(evaluateSafehouseAction(clearRun, 'wait')).toEqual({
      actionId: 'wait',
      available: true,
      evaluatedAgainstSurveillanceLevel: 'clear',
      directlyObserved: false,
    });

    const pursuedRun = {
      ...clearRun,
      surveillance: {
        ...clearRun.surveillance,
        level: 'pursuit' as const,
        directlyObserved: true,
      },
      safehouse: { ...clearRun.safehouse, insideBoundary: true },
    };

    expect(evaluateSafehouseAction(pursuedRun, 'rest')).toEqual({
      actionId: 'rest',
      available: false,
      blockedReasonId: 'safehouse.blocked.network_not_clear',
      evaluatedAgainstSurveillanceLevel: 'pursuit',
      directlyObserved: true,
    });
    expect(pursuedRun.surveillance.level).toBe('pursuit');
  });

  it('waits and rests in confirmed thirty-minute effects', () => {
    const run = {
      ...createTestLevel0RunState('run-rest'),
      health: 42,
      paranoia: 60,
    };

    const waited = applySafehouseWait(run);
    expect(waited.applied).toBe(true);
    expect(waited.run.worldClock.currentMinute).toBe(19 * 60);
    expect(waited.run.health).toBe(42);
    expect(waited.run.paranoia).toBe(60);

    const rested = applySafehouseRest(run);
    expect(rested.applied).toBe(true);
    expect(rested.run.worldClock.currentMinute).toBe(19 * 60);
    expect(rested.run.health).toBe(100);
    expect(rested.run.paranoia).toBe(20);
    expect(rested.run.rpg.resourceEvents).toEqual([
      expect.objectContaining({
        resource: 'health',
        amount: 58,
        sourceId: 'safehouse.rest',
      }),
      expect.objectContaining({
        resource: 'paranoia',
        amount: -40,
        sourceId: 'safehouse.rest',
      }),
    ]);
  });

  it('crosses midnight into a paused failure with exact missing requirements', () => {
    const run = createTestLevel0RunState('run-deadline-wait');
    run.worldClock.currentMinute = 23 * 60 + 45;
    run.worldClock.currentWorldMillisecond = run.worldClock.currentMinute * 60_000;
    run.completion.medkitsReturned = true;

    const waited = applySafehouseWait(run);

    expect(waited.run.mission).toBe('L0_FAILED');
    expect(waited.run.failureCause).toBe('failure.deadline');
    expect(waited.run.failureSourceId).toBe('clock.deadline');
    expect(waited.run.failureMissingRequirements).toEqual(['transit-validated']);
    expect(waited.run.worldClock.pauseOwners).toContain('failure');
  });

  it('creates one immutable departure snapshot after preparation', () => {
    const prepared = prepareForDeparture(createTestLevel0RunState('run-departure'));
    const first = departLevel0Operation(prepared, { ...DEPARTURE_POSITION });

    expect(first.created).toBe(true);
    expect(first.snapshot).not.toBeNull();
    expect(first.run.mission).toBe('L0_OPERATION_DEPARTED');
    expect(first.run.safehouse.departureSnapshotCreated).toBe(true);
    expect(first.snapshot?.mission).toBe('L0_OPERATION_DEPARTED');
    expect(first.snapshot?.player.position).toEqual(DEPARTURE_POSITION);

    const mutatedRun = {
      ...first.run,
      health: 15,
      paranoia: 90,
      player: {
        ...first.run.player,
        position: { x: 70, y: 29 },
      },
    };
    expect(first.snapshot?.health).toBe(100);
    expect(first.snapshot?.paranoia).toBe(0);
    expect(first.snapshot?.player.position).toEqual(DEPARTURE_POSITION);

    const repeated = departLevel0Operation(mutatedRun, { x: 22, y: 50 });
    expect(repeated.created).toBe(false);
    expect(repeated.snapshot).toBeNull();
  });

  it('does not create an operation Retry before preparation is complete', () => {
    const intro = createTestLevel0RunState('run-intro');
    const departure = departLevel0Operation(intro, { ...DEPARTURE_POSITION });

    expect(departure).toEqual({ run: intro, snapshot: null, created: false });
  });

  it('blocks every safehouse action after failure or completion', () => {
    const run = createTestLevel0RunState('run-terminal-safehouse');
    const failed = {
      ...run,
      mission: 'L0_FAILED' as const,
      failureCause: 'failure.capture' as const,
      failureSourceId: 'interception.identity_gate',
    };
    const completed = { ...run, mission: 'L0_COMPLETE' as const };

    expect(evaluateSafehouseAction(failed, 'rest')).toMatchObject({
      available: false,
      blockedReasonId: 'safehouse.blocked.terminal',
    });
    expect(evaluateSafehouseAction(completed, 'wait')).toMatchObject({
      available: false,
      blockedReasonId: 'safehouse.blocked.terminal',
    });
    expect(applySafehouseRest(failed)).toMatchObject({
      applied: false,
      run: failed,
      blockedReasonId: 'safehouse.blocked.terminal',
    });
  });

  it('preserves unrelated additive pause owners during departure', () => {
    const prepared = prepareForDeparture(createTestLevel0RunState('run-departure-paused'));
    prepared.worldClock.pauseOwners = ['safehouse_action'];

    const departure = departLevel0Operation(prepared, { ...DEPARTURE_POSITION });

    expect(departure.run.worldClock.pauseOwners).toEqual(['safehouse_action']);
  });

  it('restores the complete departure state without transient pause ownership', () => {
    const departure = departLevel0Operation(
      prepareForDeparture(createTestLevel0RunState('run-restore')),
      { ...DEPARTURE_POSITION }
    );
    const snapshot = departure.snapshot!;
    const restored = restoreLevel0RetrySnapshot(snapshot);

    expect(restored.sessionId).toBe('run-restore');
    expect(restored.mission).toBe('L0_OPERATION_DEPARTED');
    expect(restored.player.position).toEqual(DEPARTURE_POSITION);
    expect(restored.worldClock.pauseOwners).toEqual([]);
    expect(restored.safehouse.insideBoundary).toBe(false);
    expect(restored.rpg).toEqual(snapshot.rpg);
  });
});
