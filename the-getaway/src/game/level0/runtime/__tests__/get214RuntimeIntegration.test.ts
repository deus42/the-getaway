import { createTestLevel0RunState } from '../../testing/createTestLevel0RunState';
import { createWorldClockState } from '../worldClock';
import reducer, {
  applyLevel0EscapeRelief,
  applyLevel0Grounding,
  applyLevel0Paranoia,
  hydrateLevel0Run,
} from '../../../../store/level0RuntimeSlice';

describe('GET-214 runtime integration', () => {
  it('routes a confirmed grounding action through time, Paranoia, and the recovery ledger', () => {
    const run = createTestLevel0RunState('grounding-integration');
    run.paranoia = 50;
    run.worldClock = createWorldClockState(20 * 60 + 55);
    const hydrated = reducer(undefined, hydrateLevel0Run(run));

    const grounded = reducer(
      hydrated,
      applyLevel0Grounding('grounding.transit-road-vending-coffee')
    );

    expect(grounded.run?.worldClock.currentMinute).toBe(21 * 60 + 5);
    expect(grounded.run?.paranoia).toBe(40);
    expect(grounded.run?.recovery.usedGroundingActionIds).toEqual([
      'grounding.transit-road-vending-coffee',
    ]);
    expect(grounded.clockEventIds).toEqual(['clock.2100']);
    expect(grounded.feedbackParanoiaEventIds).toEqual([
      'grounding.transit-road-vending-coffee',
    ]);
  });

  it('exposes a newly crossed tier event for George presentation exactly once', () => {
    const run = createTestLevel0RunState('george-integration');
    run.paranoia = 39;
    const hydrated = reducer(undefined, hydrateLevel0Run(run));

    const crossed = reducer(
      hydrated,
      applyLevel0Paranoia({
        eventId: 'test.cross-uneasy',
        amount: 2,
        sourceId: 'test.camera',
        feedbackId: 'test.cross-uneasy',
      })
    );
    const duplicate = reducer(
      crossed,
      applyLevel0Paranoia({
        eventId: 'test.cross-uneasy',
        amount: 2,
        sourceId: 'test.camera',
        feedbackId: 'test.cross-uneasy',
      })
    );

    expect(crossed.run?.rpg.announcedParanoiaTiers).toEqual(['uneasy']);
    expect(crossed.feedbackParanoiaEventIds).toEqual(['test.cross-uneasy']);
    expect(duplicate.run).toEqual(crossed.run);
    expect(duplicate.feedbackParanoiaEventIds).toEqual([]);
  });

  it('routes the qualifying difficult-escape relief through the one-use recovery guard', () => {
    const run = createTestLevel0RunState('escape-relief-integration');
    run.paranoia = 50;
    const hydrated = reducer(undefined, hydrateLevel0Run(run));

    const first = reducer(hydrated, applyLevel0EscapeRelief());
    const repeat = reducer(first, applyLevel0EscapeRelief());

    expect(first.run?.paranoia).toBe(45);
    expect(first.run?.recovery.difficultSurveillanceEscapeReliefUsed).toBe(true);
    expect(first.feedbackParanoiaEventIds).toEqual(['relief.difficult_escape']);
    expect(repeat.run).toEqual(first.run);
    expect(repeat.feedbackId).toBe('relief.blocked.used');
  });
});
