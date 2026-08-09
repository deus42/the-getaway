import type { Level0ParanoiaEvent, Level0ParanoiaTier, Level0RunState } from '../runtime/types';
import type { Level0CityCopy } from './routeNames';

type AnnouncedTier = Exclude<Level0ParanoiaTier, 'calm' | 'breakdown'>;

// T10A-authored George lines, one per 40/70/90 tier entry. George states the
// change and what it costs; he never navigates for the player and never grants
// relief himself. Numberless per the tier-gauge rule.
export const LEVEL0_GEORGE_THRESHOLD_LINES: Record<AnnouncedTier, Level0CityCopy> = {
  uneasy: {
    en: 'Your breathing changed. Fragile habits slip first — plan around what stays steady.',
    uk: 'Ваше дихання змінилося. Крихкі навички зраджують першими — плануйте довкола того, що лишається стійким.',
  },
  shaken: {
    en: 'You are carrying too much of this street. More of you is locked than you think.',
    uk: 'Ви несете на собі забагато цієї вулиці. Заблоковано більше, ніж вам здається.',
  },
  breaking: {
    en: 'Listen to me. One more push and you will not come back from it. Find a quiet minute.',
    uk: 'Послухайте мене. Ще один поштовх — і ви не повернетеся. Знайдіть тиху хвилину.',
  },
};

const isFirstAnnouncementOf = (
  run: Level0RunState,
  event: Level0ParanoiaEvent,
  tier: AnnouncedTier
): boolean => {
  const first = run.rpg.paranoiaEvents.find((candidate) =>
    candidate.newlyEnteredTiers.includes(tier)
  );
  return first?.eventId === event.eventId;
};

// Returns George's authored line(s) for the tiers this event announced for the
// first time this attempt, or null when the event announces nothing new.
export const getGeorgeThresholdLine = (
  run: Level0RunState,
  event: Level0ParanoiaEvent,
  ukrainian: boolean
): string | null => {
  const lines = (event.newlyEnteredTiers as AnnouncedTier[])
    .filter((tier) => tier in LEVEL0_GEORGE_THRESHOLD_LINES)
    .filter((tier) => isFirstAnnouncementOf(run, event, tier))
    .map((tier) =>
      ukrainian
        ? LEVEL0_GEORGE_THRESHOLD_LINES[tier].uk
        : LEVEL0_GEORGE_THRESHOLD_LINES[tier].en
    );
  return lines.length > 0 ? lines.join(' ') : null;
};
