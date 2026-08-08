import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { applyLevel0ParanoiaEffect } from '../../rpg/paranoia';
import { createTestLevel0RunState } from '../../testing/createTestLevel0RunState';
import {
  applySafehouseResearch,
  applySafehouseRest,
  applySafehouseWait,
  departLevel0Operation,
  evaluateSafehouseAction,
  restartLevel0Attempt,
} from '../safehouse';

const DEPARTURE_POSITION = LEVEL0_LAYOUT_CONTRACT.anchors.find(
  (anchor) => anchor.id === 'safehouse.departure'
)!.position;

const prepareForDeparture = (run: ReturnType<typeof createTestLevel0RunState>) => ({
  ...run,
  mission: 'L0_PREPARATION' as const,
});

describe('Level 0 safehouse and operation-attempt foundation', () => {
  it('allows read-only surfaces but protects time-changing actions from surveillance', () => {
    const run = createTestLevel0RunState('run-safehouse');
    const pursued = {
      ...run,
      surveillance: {
        ...run.surveillance,
        level: 'pursuit' as const,
        directlyObserved: true,
      },
    };

    expect(evaluateSafehouseAction(pursued, 'character').available).toBe(true);
    expect(evaluateSafehouseAction(pursued, 'dossier').available).toBe(true);
    expect(evaluateSafehouseAction(pursued, 'rest')).toMatchObject({
      available: false,
      blockedReasonId: 'safehouse.blocked.network_not_clear',
    });
    expect(pursued.surveillance.level).toBe('pursuit');
  });

  it('waits thirty minutes and rests without reintroducing Health', () => {
    const stressed = applyLevel0ParanoiaEffect(createTestLevel0RunState('run-rest'), {
      eventId: 'stress.before-rest',
      amount: 60,
      sourceId: 'camera.identity_gate',
      feedbackId: 'paranoia.camera',
    }).run;

    const waited = applySafehouseWait(stressed);
    expect(waited.applied).toBe(true);
    expect(waited.run.worldClock.currentMinute).toBe(19 * 60);
    expect(waited.run.paranoia).toBe(60);
    expect(waited.run).not.toHaveProperty('health');

    const rested = applySafehouseRest(stressed);
    expect(rested.applied).toBe(true);
    expect(rested.run.worldClock.currentMinute).toBe(19 * 60);
    expect(rested.run.paranoia).toBe(20);
    expect(rested.run.rpg.paranoiaEvents[rested.run.rpg.paranoiaEvents.length - 1]).toMatchObject({
      sourceId: 'safehouse.rest',
      amount: -40,
    });
  });

  it('spends the authored fact and time once when safehouse research succeeds', () => {
    const run = createTestLevel0RunState('run-research');
    run.facts.known['fact.naila.camera_topology'] = {
      factId: 'fact.naila.camera_topology',
      acquisitionIds: ['contact.naila'],
    };

    const first = applySafehouseResearch(run, 'research.naila_camera_topology');
    expect(first.applied).toBe(true);
    expect(first.run.worldClock.currentMinute).toBe(18 * 60 + 50);
    expect(first.run.facts.known).not.toHaveProperty('fact.naila.camera_topology');
    expect(first.run.abilities.heldAbilityIds).toContain('ability.terminal_craft');
    expect(first.run.abilities.researchState['research.naila_camera_topology']).toBe('consumed');

    const repeated = applySafehouseResearch(first.run, 'research.naila_camera_topology');
    expect(repeated.applied).toBe(false);
    expect(repeated.run).toBe(first.run);
  });

  it('crosses midnight into a factual paused deadline failure', () => {
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

  it('creates one immutable departure baseline after preparation', () => {
    const prepared = prepareForDeparture(createTestLevel0RunState('run-departure'));
    const first = departLevel0Operation(prepared, { ...DEPARTURE_POSITION });

    expect(first.created).toBe(true);
    expect(first.baseline).not.toBeNull();
    expect(first.run.mission).toBe('L0_OPERATION_DEPARTED');
    expect(first.run.safehouse.operationAttemptBaselineCreated).toBe(true);
    expect(first.baseline?.player.position).toEqual(DEPARTURE_POSITION);

    const mutatedRun = {
      ...first.run,
      paranoia: 90,
      player: { ...first.run.player, position: { x: 70, y: 29 } },
    };
    expect(first.baseline?.paranoia).toBe(0);
    expect(first.baseline?.player.position).toEqual(DEPARTURE_POSITION);

    const repeated = departLevel0Operation(mutatedRun, { x: 22, y: 50 });
    expect(repeated).toEqual({ run: mutatedRun, baseline: null, created: false });
  });

  it('does not create a baseline before preparation is complete', () => {
    const intro = createTestLevel0RunState('run-intro');
    expect(departLevel0Operation(intro, { ...DEPARTURE_POSITION })).toEqual({
      run: intro,
      baseline: null,
      created: false,
    });
  });

  it('restarts from the immutable departure baseline without transient pauses', () => {
    const departure = departLevel0Operation(
      prepareForDeparture(createTestLevel0RunState('run-restart')),
      { ...DEPARTURE_POSITION }
    );
    const restarted = restartLevel0Attempt(departure.baseline!);

    expect(restarted.sessionId).toBe('run-restart');
    expect(restarted.mission).toBe('L0_OPERATION_DEPARTED');
    expect(restarted.player.position).toEqual(DEPARTURE_POSITION);
    expect(restarted.worldClock.pauseOwners).toEqual([]);
    expect(restarted.safehouse.insideBoundary).toBe(false);
    expect(restarted.rpg).toEqual(departure.baseline!.rpg);
  });
});
