import { applyLevel0ParanoiaEffect } from '../../rpg/paranoia';
import { createTestLevel0RunState } from '../../testing/createTestLevel0RunState';
import {
  getGeorgeThresholdLine,
  LEVEL0_GEORGE_THRESHOLD_LINES,
} from '../georgeThresholdLines';

const raise = (run: ReturnType<typeof createTestLevel0RunState>, eventId: string, amount: number) =>
  applyLevel0ParanoiaEffect(run, {
    eventId,
    amount,
    sourceId: 'camera.identity_gate',
    feedbackId: 'paranoia.test',
  });

describe('George threshold lines (40/70/90, once per attempt)', () => {
  it('authors bilingual numberless lines for exactly the three announced tiers', () => {
    expect(Object.keys(LEVEL0_GEORGE_THRESHOLD_LINES).sort()).toEqual([
      'breaking',
      'shaken',
      'uneasy',
    ]);
    for (const copy of Object.values(LEVEL0_GEORGE_THRESHOLD_LINES)) {
      expect(copy.en.trim().length).toBeGreaterThan(0);
      expect(copy.uk.trim().length).toBeGreaterThan(0);
      expect(copy.en).not.toBe(copy.uk);
      expect(copy.en).not.toMatch(/\d/);
      expect(copy.uk).not.toMatch(/\d/);
    }
  });

  it('speaks once on first tier entry and stays silent on re-entry', () => {
    const start = createTestLevel0RunState('george-lines');
    const first = raise(start, 'event.first', 45);
    expect(first.event?.newlyEnteredTiers).toEqual(['uneasy']);
    expect(getGeorgeThresholdLine(first.run, first.event!, false)).toBe(
      LEVEL0_GEORGE_THRESHOLD_LINES.uneasy.en
    );
    expect(getGeorgeThresholdLine(first.run, first.event!, true)).toBe(
      LEVEL0_GEORGE_THRESHOLD_LINES.uneasy.uk
    );

    const drop = raise(first.run, 'event.drop', -20);
    const reentry = raise(drop.run, 'event.reentry', 30);
    expect(reentry.event?.newlyEnteredTiers).toEqual(['uneasy']);
    expect(getGeorgeThresholdLine(reentry.run, reentry.event!, false)).toBeNull();
  });

  it('joins every first-announced line on a large jump', () => {
    const start = createTestLevel0RunState('george-jump');
    const jump = raise(start, 'event.jump', 95);
    expect(jump.event?.newlyEnteredTiers).toEqual(['uneasy', 'shaken', 'breaking']);
    const line = getGeorgeThresholdLine(jump.run, jump.event!, false);
    expect(line).toContain(LEVEL0_GEORGE_THRESHOLD_LINES.uneasy.en);
    expect(line).toContain(LEVEL0_GEORGE_THRESHOLD_LINES.shaken.en);
    expect(line).toContain(LEVEL0_GEORGE_THRESHOLD_LINES.breaking.en);
  });

  it('returns null for events that announce nothing', () => {
    const start = createTestLevel0RunState('george-null');
    const small = raise(start, 'event.small', 10);
    expect(small.event?.newlyEnteredTiers).toEqual([]);
    expect(getGeorgeThresholdLine(small.run, small.event!, false)).toBeNull();
  });
});
