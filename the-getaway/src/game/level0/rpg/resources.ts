import type { Level0RunState } from '../runtime/types';
import { getParanoiaCheckPenalty } from './checks';
import type {
  Level0ResourceEvent,
  Level0ResourceKind,
  Level0RetryTreatment,
} from './types';

export interface Level0ResourceEffectInput {
  eventId: string;
  resource: Level0ResourceKind;
  amount: number;
  sourceId: string;
  feedbackId: string;
  worldMinute: number;
  retryTreatment: Level0RetryTreatment;
}

export const LEVEL0_PROVISIONAL_RESOURCE_PRESETS = {
  'health.cost.minor': {
    resource: 'health',
    amount: -10,
    feedbackId: 'resource.health.cost_minor',
  },
  'health.cost.dangerous': {
    resource: 'health',
    amount: -25,
    feedbackId: 'resource.health.cost_dangerous',
  },
  'health.cost.severe': {
    resource: 'health',
    amount: -40,
    feedbackId: 'resource.health.cost_severe',
  },
  'paranoia.recovery.trusted-conversation': {
    resource: 'paranoia',
    amount: -10,
    feedbackId: 'resource.paranoia.trusted_conversation',
  },
  'paranoia.recovery.difficult-hide': {
    resource: 'paranoia',
    amount: -5,
    feedbackId: 'resource.paranoia.difficult_hide',
  },
} as const satisfies Record<string, {
  resource: Level0ResourceKind;
  amount: number;
  feedbackId: string;
}>;

export type Level0ResourcePresetId = keyof typeof LEVEL0_PROVISIONAL_RESOURCE_PRESETS;

export const createLevel0ResourceEffectFromPreset = (
  presetId: Level0ResourcePresetId,
  run: Pick<Level0RunState, 'safehouse'>,
  input: Pick<Level0ResourceEffectInput, 'eventId' | 'sourceId' | 'worldMinute'>
): Level0ResourceEffectInput => {
  const preset = LEVEL0_PROVISIONAL_RESOURCE_PRESETS[presetId];
  return createLevel0ResourceEffect({
    ...input,
    resource: preset.resource,
    amount: preset.amount,
    feedbackId: preset.feedbackId,
    retryTreatment: run.safehouse.departureSnapshotCreated
      ? 'discard-on-retry'
      : 'captured-at-departure',
  });
};

export const createLevel0ResourceEffect = (
  input: Level0ResourceEffectInput
): Level0ResourceEffectInput => {
  if (!input.eventId.trim() || !input.sourceId.trim() || !input.feedbackId.trim()) {
    throw new Error('Level 0 resource effects require event, source, and feedback IDs');
  }
  if (!Number.isFinite(input.amount) || !Number.isFinite(input.worldMinute)) {
    throw new Error('Level 0 resource effect amount/time must be finite');
  }
  return { ...input };
};

const withFailurePause = (pauseOwners: Level0RunState['worldClock']['pauseOwners']) =>
  pauseOwners.includes('failure') ? [...pauseOwners] : [...pauseOwners, 'failure' as const];

export const applyLevel0ResourceEffect = (
  run: Level0RunState,
  input: Level0ResourceEffectInput
): { run: Level0RunState; event: Level0ResourceEvent | null; applied: boolean } => {
  const existing = run.rpg.resourceEvents.find((event) => event.eventId === input.eventId);
  if (existing || run.mission === 'L0_FAILED' || run.mission === 'L0_COMPLETE') {
    return { run, event: existing ?? null, applied: false };
  }
  const before = input.resource === 'health' ? run.health : run.paranoia;
  const after = Math.max(0, Math.min(100, Math.round(before + input.amount)));
  if (after === before) return { run, event: null, applied: false };

  const oldPenalty = getParanoiaCheckPenalty(run.paranoia);
  const nextParanoia = input.resource === 'paranoia' ? after : run.paranoia;
  const newPenalty = getParanoiaCheckPenalty(nextParanoia);
  const crossedParanoiaPenalties = ([1, 2, 3] as const).filter((penalty) =>
    penalty > oldPenalty && penalty <= newPenalty
  );
  const event: Level0ResourceEvent = {
    eventId: input.eventId,
    resource: input.resource,
    sourceId: input.sourceId,
    amount: after - before,
    before,
    after,
    worldMinute: input.worldMinute,
    feedbackId: input.feedbackId,
    retryTreatment: input.retryTreatment,
    crossedParanoiaPenalties,
  };
  const activeAnnouncements = run.rpg.announcedParanoiaPenalties.filter(
    (penalty) => penalty <= newPenalty
  );
  crossedParanoiaPenalties.forEach((penalty) => {
    if (!activeAnnouncements.includes(penalty)) activeAnnouncements.push(penalty);
  });
  const health = input.resource === 'health' ? after : run.health;
  const paranoia = nextParanoia;
  const failureCause = health === 0
    ? 'failure.health' as const
    : paranoia === 100
      ? 'failure.paranoia' as const
      : null;

  const next: Level0RunState = {
    ...run,
    health,
    paranoia,
    rpg: {
      ...run.rpg,
      resourceEvents: [...run.rpg.resourceEvents, event],
      announcedParanoiaPenalties: activeAnnouncements,
    },
    ...(failureCause
      ? {
          mission: 'L0_FAILED' as const,
          failureCause,
          failureSourceId: input.sourceId,
          failureMissingRequirements: [],
          worldClock: {
            ...run.worldClock,
            pauseOwners: withFailurePause(run.worldClock.pauseOwners),
          },
        }
      : {}),
  };
  return { run: next, event, applied: true };
};
