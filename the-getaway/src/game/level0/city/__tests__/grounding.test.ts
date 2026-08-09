import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { createTestLevel0RunState } from '../../testing/createTestLevel0RunState';
import { departLevel0Operation, restartLevel0Attempt } from '../../runtime/safehouse';
import type { Level0RunState } from '../../runtime/types';
import {
  applyLevel0DifficultEscapeRelief,
  applyLevel0GroundingAction,
  getGroundingActionByAnchor,
  LEVEL0_DIFFICULT_ESCAPE_RELIEF,
  LEVEL0_GROUNDING_ACTIONS,
  resolveGroundingVerdict,
} from '../grounding';

const COFFEE = 'grounding.transit-road-vending-coffee' as const;
const SHRINE = 'grounding.market-ring-shrine' as const;

const runWithParanoia = (paranoia: number): Level0RunState => ({
  ...createTestLevel0RunState('grounding-session'),
  paranoia,
});

describe('Level 0 grounding actions (GDR-PAR-006 / GDR-PAR-007)', () => {
  it('keeps the approved fixed values and canonical Architecture IDs', () => {
    const actions = Object.values(LEVEL0_GROUNDING_ACTIONS);
    expect(actions.map((action) => action.actionId).sort()).toEqual([SHRINE, COFFEE].sort());
    for (const action of actions) {
      expect(action.worldMinuteCost).toBe(10);
      expect(action.paranoiaDelta).toBe(-10);
      expect(action.usesPerAttempt).toBe(1);
    }
    expect(LEVEL0_DIFFICULT_ESCAPE_RELIEF.paranoiaDelta).toBe(-5);
    expect(LEVEL0_DIFFICULT_ESCAPE_RELIEF.usesPerAttempt).toBe(1);
  });

  it('binds each action to a real interaction anchor whose owner is the action', () => {
    for (const action of Object.values(LEVEL0_GROUNDING_ACTIONS)) {
      const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
        (candidate) => candidate.id === action.anchorId
      );
      expect(anchor).toBeDefined();
      expect(anchor?.kind).toBe('interaction');
      expect(anchor?.ownerId).toBe(action.actionId);
      expect(getGroundingActionByAnchor(action.anchorId)?.actionId).toBe(action.actionId);
    }
    expect(getGroundingActionByAnchor('interaction.safehouse.wait')).toBeNull();
    expect(getGroundingActionByAnchor(undefined)).toBeNull();
  });

  it('authors bilingual title, preview, beat, and used-state copy without numeric Paranoia', () => {
    for (const action of Object.values(LEVEL0_GROUNDING_ACTIONS)) {
      for (const copy of [action.title, action.confirmPreview, action.beatText, action.usedReason]) {
        expect(copy.en.trim().length).toBeGreaterThan(0);
        expect(copy.uk.trim().length).toBeGreaterThan(0);
        expect(copy.en).not.toBe(copy.uk);
        expect(copy.en).not.toMatch(/paranoia/i);
        expect(copy.uk).not.toMatch(/параной/i);
      }
    }
  });

  it('applies exactly +10 world minutes and −10 Paranoia once, then blocks with the truthful reason', () => {
    const start = runWithParanoia(50);
    const startMinute = start.worldClock.currentMinute;
    const first = applyLevel0GroundingAction(start, COFFEE);
    expect(first.applied).toBe(true);
    expect(first.run.worldClock.currentMinute).toBe(startMinute + 10);
    expect(first.run.paranoia).toBe(40);
    expect(first.run.recovery.usedGroundingActionIds).toEqual([COFFEE]);
    expect(first.run.rpg.paranoiaEvents.map((event) => event.eventId)).toContain(COFFEE);

    const repeat = applyLevel0GroundingAction(first.run, COFFEE);
    expect(repeat.applied).toBe(false);
    expect(repeat.blockedReasonId).toBe('grounding.blocked.used');
    expect(repeat.run.worldClock.currentMinute).toBe(startMinute + 10);
    expect(repeat.run.paranoia).toBe(40);
  });

  it('keeps the two actions independent and clamps relief at zero', () => {
    const afterCoffee = applyLevel0GroundingAction(runWithParanoia(5), COFFEE);
    expect(afterCoffee.run.paranoia).toBe(0);
    const afterShrine = applyLevel0GroundingAction(afterCoffee.run, SHRINE);
    expect(afterShrine.applied).toBe(true);
    expect(afterShrine.run.recovery.usedGroundingActionIds).toEqual([COFFEE, SHRINE]);
  });

  it('emits street-moment clock events when the ten minutes cross a boundary', () => {
    const beforeBoundary = runWithParanoia(30);
    beforeBoundary.worldClock = {
      ...beforeBoundary.worldClock,
      currentWorldMillisecond: (21 * 60 - 5) * 60_000,
      currentMinute: 21 * 60 - 5,
      phase: 'blue-hour',
      processedBoundaryIds: [],
      lastProcessedScheduleBoundaryId: undefined,
      scheduleStates: { lighting: 'blue-hour', publicActivity: 'active' },
    };
    const result = applyLevel0GroundingAction(beforeBoundary, SHRINE);
    expect(result.applied).toBe(true);
    expect(result.clockEventIds).toEqual(['clock.2100']);
  });

  it('blocks a use that would cross the midnight deadline instead of applying partial effects', () => {
    const shrine = LEVEL0_GROUNDING_ACTIONS[SHRINE];
    expect(
      resolveGroundingVerdict(shrine, { usedGroundingIds: [], currentMinute: 23 * 60 + 51 })
    ).toMatchObject({ allowed: false, reasonId: 'grounding.blocked.deadline' });
    expect(
      resolveGroundingVerdict(shrine, { usedGroundingIds: [], currentMinute: 23 * 60 + 50 })
    ).toEqual({ allowed: true });
  });

  it('restores grounding and escape history exactly from the Restart Attempt baseline', () => {
    let run = runWithParanoia(60);
    run = applyLevel0GroundingAction(run, COFFEE).run;
    run = { ...run, mission: 'L0_PREPARATION' };
    const departure = departLevel0Operation(run, LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'safehouse.departure'
    )!.position);
    expect(departure.created).toBe(true);

    let departed = departure.run;
    departed = applyLevel0GroundingAction(departed, SHRINE).run;
    departed = applyLevel0DifficultEscapeRelief(departed).run;
    expect(departed.recovery.usedGroundingActionIds).toEqual([COFFEE, SHRINE]);
    expect(departed.recovery.difficultSurveillanceEscapeReliefUsed).toBe(true);

    const restored = restartLevel0Attempt(departure.baseline!);
    expect(restored.recovery.usedGroundingActionIds).toEqual([COFFEE]);
    expect(restored.recovery.difficultSurveillanceEscapeReliefUsed).toBe(false);
    const shrineAgain = applyLevel0GroundingAction(restored, SHRINE);
    expect(shrineAgain.applied).toBe(true);
  });

  it('applies the difficult-escape relief exactly once per attempt', () => {
    const start = runWithParanoia(50);
    const first = applyLevel0DifficultEscapeRelief(start);
    expect(first.applied).toBe(true);
    expect(first.run.paranoia).toBe(45);
    expect(first.run.recovery.difficultSurveillanceEscapeReliefUsed).toBe(true);
    const second = applyLevel0DifficultEscapeRelief(first.run);
    expect(second.applied).toBe(false);
    expect(second.blockedReasonId).toBe('relief.blocked.used');
    expect(second.run.paranoia).toBe(45);
  });
});
