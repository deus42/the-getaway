import type { Level0RunState } from '../runtime/types';
import { deriveLevel0ParanoiaTier } from './gates';
import type { Level0ParanoiaEvent, Level0ParanoiaTier } from './types';

export interface Level0ParanoiaEffectInput {
  eventId: string;
  amount: number;
  sourceId: string;
  feedbackId: string;
}

const ANNOUNCED_TIERS: Array<Exclude<Level0ParanoiaTier, 'calm' | 'breakdown'>> = [
  'uneasy',
  'shaken',
  'breaking',
];

const tierFloor: Record<(typeof ANNOUNCED_TIERS)[number], number> = {
  uneasy: 40,
  shaken: 70,
  breaking: 90,
};

const withFailurePause = (run: Level0RunState): Level0RunState['worldClock'] => ({
  ...run.worldClock,
  pauseOwners: run.worldClock.pauseOwners.includes('failure')
    ? [...run.worldClock.pauseOwners]
    : [...run.worldClock.pauseOwners, 'failure'],
});

export const applyLevel0ParanoiaEffect = (
  run: Level0RunState,
  input: Level0ParanoiaEffectInput
): { run: Level0RunState; event: Level0ParanoiaEvent | null; applied: boolean } => {
  if (!input.eventId.trim() || !input.sourceId.trim() || !input.feedbackId.trim() ||
    !Number.isFinite(input.amount) || input.amount === 0) {
    throw new Error('Level 0 Paranoia effects require stable IDs and a finite non-zero amount');
  }
  const existing = run.rpg.paranoiaEvents.find((event) => event.eventId === input.eventId);
  if (existing || run.mission === 'L0_FAILED' || run.mission === 'L0_COMPLETE') {
    return { run, event: existing ?? null, applied: false };
  }
  const before = run.paranoia;
  const after = Math.max(0, Math.min(100, Math.round(before + input.amount)));
  if (after === before) return { run, event: null, applied: false };
  const newlyEnteredTiers = input.amount > 0
    ? ANNOUNCED_TIERS.filter((tier) => before < tierFloor[tier] && after >= tierFloor[tier])
    : [];
  const event: Level0ParanoiaEvent = {
    eventId: input.eventId,
    sourceId: input.sourceId,
    amount: after - before,
    before,
    after,
    worldMinute: run.worldClock.currentMinute,
    feedbackId: input.feedbackId,
    attemptTreatment: run.safehouse.operationAttemptBaselineCreated
      ? 'discard-on-restart'
      : 'captured-in-baseline',
    newlyEnteredTiers,
  };
  const announced = [...run.rpg.announcedParanoiaTiers];
  newlyEnteredTiers.forEach((tier) => {
    if (!announced.includes(tier)) announced.push(tier);
  });
  const breakdown = deriveLevel0ParanoiaTier(after) === 'breakdown';
  return {
    applied: true,
    event,
    run: {
      ...run,
      paranoia: after,
      rpg: {
        ...run.rpg,
        paranoiaEvents: [...run.rpg.paranoiaEvents, event],
        announcedParanoiaTiers: announced,
      },
      ...(breakdown
        ? {
            mission: 'L0_FAILED' as const,
            failureCause: 'failure.breakdown' as const,
            failureSourceId: input.sourceId,
            failureMissingRequirements: [],
            worldClock: withFailurePause(run),
          }
        : {}),
    },
  };
};
