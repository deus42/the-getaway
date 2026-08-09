import { applyLevel0ParanoiaEffect } from '../rpg/paranoia';
import { applyClockResult } from '../runtime/safehouse';
import type { Level0RunState } from '../runtime/types';
import { jumpWorldClockMinutes } from '../runtime/worldClock';
import type { Level0CityCopy } from './routeNames';

// Canonical action IDs per Architecture §Grounding.
export type GroundingActionId =
  | 'grounding.transit-road-vending-coffee'
  | 'grounding.market-ring-shrine';

export interface GroundingActionDefinition {
  id: GroundingActionId;
  anchorId: string;
  // Approved fixed values (GDR-PAR-006): not tunable content.
  worldMinutes: 10;
  paranoiaRelief: 10;
  usesPerAttempt: 1;
  title: Level0CityCopy;
  confirmPreview: Level0CityCopy;
  beatText: Level0CityCopy;
  usedReason: Level0CityCopy;
  cueId: string;
}

export const LEVEL0_GROUNDING_ACTIONS: Record<GroundingActionId, GroundingActionDefinition> = {
  'grounding.transit-road-vending-coffee': {
    id: 'grounding.transit-road-vending-coffee',
    anchorId: 'interaction.grounding.vending_coffee',
    worldMinutes: 10,
    paranoiaRelief: 10,
    usesPerAttempt: 1,
    title: { en: 'Vending-machine coffee', uk: 'Кава з автомата' },
    confirmPreview: {
      en: 'Ten minutes: hot coffee at the machine. It settles you. (+10 minutes)',
      uk: 'Десять хвилин: гаряча кава з автомата. Це заспокоює. (+10 хвилин)',
    },
    beatText: {
      en: 'The can is too hot to hold at first. You drink it slowly, watching Transit Road empty out.',
      uk: 'Бляшанка спершу обпікає пальці. Ви п’єте повільно, дивлячись, як порожніє Транзитна дорога.',
    },
    usedReason: {
      en: 'The coffee is gone. One cup was all tonight had.',
      uk: 'Кави більше немає. Сьогодні була лише одна чашка.',
    },
    cueId: 'cue.grounding.vending_coffee',
  },
  'grounding.market-ring-shrine': {
    id: 'grounding.market-ring-shrine',
    anchorId: 'interaction.grounding.shrine',
    worldMinutes: 10,
    paranoiaRelief: 10,
    usesPerAttempt: 1,
    title: { en: 'Street shrine', uk: 'Вуличне святилище' },
    confirmPreview: {
      en: 'Ten minutes at the shrine. Breathe. Let the street noise fade. (+10 minutes)',
      uk: 'Десять хвилин біля святилища. Дихайте. Нехай шум вулиці стихне. (+10 хвилин)',
    },
    beatText: {
      en: 'You bow the way you saw an old man bow this morning. Where Market Ring meets Outer Space, the city is quiet.',
      uk: 'Ви вклоняєтеся так, як вклонявся старий чоловік уранці. Там, де Ринкове кільце зустрічає Відкритий космос, місто тихе.',
    },
    usedReason: {
      en: 'You have already made your peace here tonight.',
      uk: 'Ви вже знайшли тут спокій цього вечора.',
    },
    cueId: 'cue.grounding.shrine',
  },
};

// T8A/GET-212 supplies the qualifying difficult-surveillance-escape event; the
// relief value itself is approved content (GDR-PAR-007) and lives here.
export const LEVEL0_DIFFICULT_ESCAPE_RELIEF = {
  eventId: 'relief.difficult_escape',
  paranoiaRelief: 5,
  usesPerAttempt: 1,
} as const;

export interface GroundingVerdict {
  allowed: boolean;
  reasonId?: 'grounding.blocked.used' | 'grounding.blocked.deadline';
  reason?: Level0CityCopy;
}

const DEADLINE_MINUTE = 24 * 60;

export const getGroundingActionByAnchor = (
  anchorId: string | undefined
): GroundingActionDefinition | null => {
  if (!anchorId) return null;
  const match = Object.values(LEVEL0_GROUNDING_ACTIONS).find(
    (action) => action.anchorId === anchorId
  );
  return match ?? null;
};

export const resolveGroundingVerdict = (
  action: GroundingActionDefinition,
  options: { usedGroundingIds: readonly string[]; currentMinute: number }
): GroundingVerdict => {
  if (options.usedGroundingIds.includes(action.id)) {
    return { allowed: false, reasonId: 'grounding.blocked.used', reason: action.usedReason };
  }
  if (options.currentMinute + action.worldMinutes > DEADLINE_MINUTE) {
    return {
      allowed: false,
      reasonId: 'grounding.blocked.deadline',
      reason: {
        en: 'There is no time left to stop. Midnight is too close.',
        uk: 'Зупинятися вже немає часу. Північ надто близько.',
      },
    };
  }
  return { allowed: true };
};

export interface GroundingEffectResult {
  applied: boolean;
  run: Level0RunState;
  blockedReasonId?: string;
  clockEventIds: string[];
}

export const applyLevel0GroundingAction = (
  run: Level0RunState,
  actionId: GroundingActionId
): GroundingEffectResult => {
  const action = LEVEL0_GROUNDING_ACTIONS[actionId];
  if (!action) return { applied: false, run, blockedReasonId: 'grounding.blocked.unknown', clockEventIds: [] };
  if (run.mission === 'L0_FAILED' || run.mission === 'L0_COMPLETE') {
    return { applied: false, run, blockedReasonId: 'grounding.blocked.terminal', clockEventIds: [] };
  }
  const verdict = resolveGroundingVerdict(action, {
    usedGroundingIds: run.recovery.usedGroundingActionIds,
    currentMinute: run.worldClock.currentMinute,
  });
  if (!verdict.allowed) {
    return { applied: false, run, blockedReasonId: verdict.reasonId, clockEventIds: [] };
  }
  const clockResult = jumpWorldClockMinutes(run.worldClock, action.worldMinutes, run.completion);
  let next = applyClockResult(run, clockResult);
  next = {
    ...next,
    recovery: {
      ...next.recovery,
      usedGroundingActionIds: [...next.recovery.usedGroundingActionIds, action.id],
    },
  };
  if (next.mission !== 'L0_FAILED' && next.paranoia > 0) {
    next = applyLevel0ParanoiaEffect(next, {
      eventId: action.id,
      amount: -action.paranoiaRelief,
      sourceId: action.id,
      feedbackId: 'paranoia.grounding_relief',
    }).run;
  }
  return {
    applied: true,
    run: next,
    clockEventIds: clockResult.events.map((event) => event.id),
  };
};

export const applyLevel0DifficultEscapeRelief = (
  run: Level0RunState
): GroundingEffectResult => {
  if (run.mission === 'L0_FAILED' || run.mission === 'L0_COMPLETE') {
    return { applied: false, run, blockedReasonId: 'relief.blocked.terminal', clockEventIds: [] };
  }
  if (run.recovery.difficultSurveillanceEscapeReliefUsed) {
    return { applied: false, run, blockedReasonId: 'relief.blocked.used', clockEventIds: [] };
  }
  let next: Level0RunState = {
    ...run,
    recovery: { ...run.recovery, difficultSurveillanceEscapeReliefUsed: true },
  };
  if (next.paranoia > 0) {
    next = applyLevel0ParanoiaEffect(next, {
      eventId: LEVEL0_DIFFICULT_ESCAPE_RELIEF.eventId,
      amount: -LEVEL0_DIFFICULT_ESCAPE_RELIEF.paranoiaRelief,
      sourceId: LEVEL0_DIFFICULT_ESCAPE_RELIEF.eventId,
      feedbackId: 'paranoia.difficult_escape_relief',
    }).run;
  }
  return { applied: true, run: next, clockEventIds: [] };
};
