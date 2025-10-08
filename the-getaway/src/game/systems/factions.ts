import { FactionId, FactionStanding } from '../interfaces/types';
import { Locale } from '../../content/locales';

export type FactionStandingId = FactionStanding;

export interface FactionStandingDefinition {
  id: FactionStandingId;
  label: string;
  min: number;
  max: number;
  color: string;
  icon: string;
}

export interface FactionDefinition {
  id: FactionId;
  name: string;
  description: string;
  rivalId?: FactionId;
  defaultReputation: number;
}

export interface FactionStandingEffectMap {
  [standing in FactionStandingId]: string[];
}

export interface FactionMetadata {
  definition: FactionDefinition;
  effects: FactionStandingEffectMap;
}

export type FactionReputationState = Record<FactionId, number>;

export interface FactionStandingChange {
  factionId: FactionId;
  previousStanding: FactionStandingId;
  nextStanding: FactionStandingId;
}

export interface ReputationAdjustmentResult {
  values: FactionReputationState;
  primaryDelta: number;
  rivalDeltas: Partial<Record<FactionId, number>>;
  standingChanges: FactionStandingChange[];
}

export type FactionReputationActionId =
  | 'resistance_rescue_civilian'
  | 'resistance_sabotage_corpsec'
  | 'resistance_complete_quest'
  | 'resistance_betray_member'
  | 'resistance_turn_in_contact'
  | 'corpsec_report_crime'
  | 'corpsec_eliminate_resistance'
  | 'corpsec_complete_contract'
  | 'corpsec_attack_patrol'
  | 'corpsec_sabotage_checkpoint'
  | 'scavengers_trade'
  | 'scavengers_salvage_contract'
  | 'scavengers_share_loot'
  | 'scavengers_steal_cache'
  | 'scavengers_kill_merchant';

export interface ReputationActionDefinition {
  factionId: FactionId;
  delta: number;
  reason: string;
}

const REPUTATION_ACTIONS: Record<FactionReputationActionId, ReputationActionDefinition> = {
  resistance_rescue_civilian: {
    factionId: 'resistance',
    delta: 10,
    reason: 'Civilian rescued',
  },
  resistance_sabotage_corpsec: {
    factionId: 'resistance',
    delta: 15,
    reason: 'CorpSec assets sabotaged',
  },
  resistance_complete_quest: {
    factionId: 'resistance',
    delta: 20,
    reason: 'Resistance operation completed',
  },
  resistance_betray_member: {
    factionId: 'resistance',
    delta: -20,
    reason: 'Resistance member betrayed',
  },
  resistance_turn_in_contact: {
    factionId: 'resistance',
    delta: -30,
    reason: 'Resistance contact turned in to CorpSec',
  },
  corpsec_report_crime: {
    factionId: 'corpsec',
    delta: 10,
    reason: 'Crime reported to CorpSec',
  },
  corpsec_eliminate_resistance: {
    factionId: 'corpsec',
    delta: 15,
    reason: 'Resistance cell eliminated',
  },
  corpsec_complete_contract: {
    factionId: 'corpsec',
    delta: 20,
    reason: 'CorpSec contract completed',
  },
  corpsec_attack_patrol: {
    factionId: 'corpsec',
    delta: -20,
    reason: 'CorpSec patrol attacked',
  },
  corpsec_sabotage_checkpoint: {
    factionId: 'corpsec',
    delta: -30,
    reason: 'Checkpoint sabotaged',
  },
  scavengers_trade: {
    factionId: 'scavengers',
    delta: 5,
    reason: 'Trade completed with Scavengers',
  },
  scavengers_salvage_contract: {
    factionId: 'scavengers',
    delta: 15,
    reason: 'Salvage contract completed',
  },
  scavengers_share_loot: {
    factionId: 'scavengers',
    delta: 10,
    reason: 'Shared loot intel with Scavengers',
  },
  scavengers_steal_cache: {
    factionId: 'scavengers',
    delta: -15,
    reason: 'Scavenger cache stolen',
  },
  scavengers_kill_merchant: {
    factionId: 'scavengers',
    delta: -20,
    reason: 'Scavenger merchant killed',
  },
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
};

export const clampFactionReputation = (value: number): number => clamp(value, -100, 100);

const STANDING_DEFINITIONS: FactionStandingDefinition[] = [
  {
    id: 'hostile',
    label: 'Hostile',
    min: -100,
    max: -61,
    color: '#ef4444',
    icon: '⚠️',
  },
  {
    id: 'unfriendly',
    label: 'Unfriendly',
    min: -60,
    max: -20,
    color: '#f97316',
    icon: '⚠',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    min: -19,
    max: 19,
    color: '#94a3b8',
    icon: '•',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    min: 20,
    max: 59,
    color: '#4ade80',
    icon: '★',
  },
  {
    id: 'allied',
    label: 'Allied',
    min: 60,
    max: 100,
    color: '#facc15',
    icon: '✪',
  },
];

const STANDING_BY_ID = STANDING_DEFINITIONS.reduce<Record<FactionStandingId, FactionStandingDefinition>>(
  (acc, standing) => {
    acc[standing.id] = standing;
    return acc;
  },
  {
    hostile: STANDING_DEFINITIONS[0],
    unfriendly: STANDING_DEFINITIONS[1],
    neutral: STANDING_DEFINITIONS[2],
    friendly: STANDING_DEFINITIONS[3],
    allied: STANDING_DEFINITIONS[4],
  }
);

const resolveStandingForValue = (value: number): FactionStandingDefinition => {
  const clamped = clampFactionReputation(value);
  for (const standing of STANDING_DEFINITIONS) {
    if (clamped >= standing.min && clamped <= standing.max) {
      return standing;
    }
  }
  return STANDING_BY_ID.neutral;
};

export const getStandingForValue = (value: number): FactionStandingDefinition => resolveStandingForValue(value);

export const getNextStandingThreshold = (
  value: number
): { standing: FactionStandingDefinition; requiredValue: number } | null => {
  const current = resolveStandingForValue(value);
  const index = STANDING_DEFINITIONS.findIndex((standing) => standing.id === current.id);
  if (index < 0 || index === STANDING_DEFINITIONS.length - 1) {
    return null;
  }

  const nextStanding = STANDING_DEFINITIONS[index + 1];
  return {
    standing: nextStanding,
    requiredValue: nextStanding.min,
  };
};

const FACTION_METADATA: Record<FactionId, FactionMetadata> = {
  resistance: {
    definition: {
      id: 'resistance',
      name: 'Resistance',
      description: 'Anti-regime saboteurs coordinating from hidden cells throughout the slums.',
      rivalId: 'corpsec',
      defaultReputation: 10,
    },
    effects: {
      hostile: [
        'Resistance ambush teams hunt you on sight.',
        'Safe houses barred and support staff evacuate when you enter a cell.',
      ],
      unfriendly: [
        'Handlers refuse new operations and keep patrol intel off the record.',
        'Markets charge +50% and watchers shadow your movements.',
      ],
      neutral: [
        'Standard trade access with baseline mission availability.',
      ],
      friendly: [
        'Safe house quartermasters grant -25% discounts.',
        'Resistance fire teams can reinforce nearby encounters.',
        'Access to special sabotage contracts.',
      ],
      allied: [
        'Leadership shares prototype gear and strategic intel.',
        'Full access to command safe houses and staging areas.',
        'Resistance commits strike units to the final mission.',
      ],
    },
  },
  corpsec: {
    definition: {
      id: 'corpsec',
      name: 'CorpSec',
      description: 'Corporate security forces enforcing curfew and regime edicts downtown.',
      rivalId: 'resistance',
      defaultReputation: -20,
    },
    effects: {
      hostile: [
        'CorpSec strike teams engage immediately and post bounties.',
        'Checkpoints sealed; city travel heavily restricted.',
      ],
      unfriendly: [
        'CorpSec enforcers tail you and random searches increase.',
        'Vendor prices +50% and contracts withdrawn.',
      ],
      neutral: [
        'Standard patrol scrutiny with access to routine contracts.',
      ],
      friendly: [
        'Access to restricted checkpoints and heavy weapon requisitions.',
        'CorpSec officers provide enforcement support nearby.',
      ],
      allied: [
        'CorpSec elevates you to trusted asset status.',
        'Elite armories and armored escorts unlocked for the endgame assault.',
      ],
    },
  },
  scavengers: {
    definition: {
      id: 'scavengers',
      name: 'Scavengers',
      description: 'Resourceful traders running the black markets threading the slums and tunnels.',
      defaultReputation: 0,
    },
    effects: {
      hostile: [
        'Black market shuts you out and bounty hunters look to cash in.',
      ],
      unfriendly: [
        'Merchants hike prices by 50% and fence only low-tier goods.',
        'Rumours and location intel dry up.',
      ],
      neutral: [
        'Regular trade access with standard supply lists.',
      ],
      friendly: [
        'Negotiated prices drop 25% and rare stock appears more often.',
        'Vehicle parts and crafting materials offered reliably.',
      ],
      allied: [
        'Exclusive caches, contraband routes, and crew hire options unlocked.',
        'Scavengers lend munitions support during the finale.',
      ],
    },
  },
};

export const getFactionMetadata = (factionId: FactionId): FactionMetadata => FACTION_METADATA[factionId];

export const getFactionDefinitions = (): FactionDefinition[] =>
  Object.values(FACTION_METADATA).map((entry) => entry.definition);

export const getFactionStandingEffects = (
  factionId: FactionId,
  standingId: FactionStandingId
): string[] => {
  const metadata = FACTION_METADATA[factionId];
  return metadata.effects[standingId];
};

const ensureState = (state: Partial<FactionReputationState> | undefined): FactionReputationState => {
  const base: FactionReputationState = {
    resistance: FACTION_METADATA.resistance.definition.defaultReputation,
    corpsec: FACTION_METADATA.corpsec.definition.defaultReputation,
    scavengers: FACTION_METADATA.scavengers.definition.defaultReputation,
  };

  if (!state) {
    return base;
  }

  return {
    resistance: clampFactionReputation(state.resistance ?? base.resistance),
    corpsec: clampFactionReputation(state.corpsec ?? base.corpsec),
    scavengers: clampFactionReputation(state.scavengers ?? base.scavengers),
  };
};

const HOSTILE_FLOOR = -70;
const ALLIED_THRESHOLD = 60;
const RIVAL_PENALTY_RATIO = 0.5;

export const applyFactionDelta = (
  original: FactionReputationState,
  factionId: FactionId,
  delta: number
): ReputationAdjustmentResult => {
  const state = ensureState(original);
  const standingChanges: FactionStandingChange[] = [];

  const previousValue = clampFactionReputation(original[factionId] ?? state[factionId]);
  const previousStanding = resolveStandingForValue(previousValue);

  const nextPrimaryValue = clampFactionReputation(previousValue + delta);
  const nextStanding = resolveStandingForValue(nextPrimaryValue);

  state[factionId] = nextPrimaryValue;

  if (nextStanding.id !== previousStanding.id) {
    standingChanges.push({
      factionId,
      previousStanding: previousStanding.id,
      nextStanding: nextStanding.id,
    });
  }

  const rivalAdjustments: Partial<Record<FactionId, number>> = {};
  const rivalId = FACTION_METADATA[factionId].definition.rivalId;
  if (rivalId) {
    const rivalPreviousValue = clampFactionReputation(original[rivalId] ?? state[rivalId]);
    const rivalPreviousStanding = resolveStandingForValue(rivalPreviousValue);
    const rivalDelta = -Math.round(delta * RIVAL_PENALTY_RATIO);
    if (rivalDelta !== 0) {
      const rivalNextValue = clampFactionReputation(rivalPreviousValue + rivalDelta);
      const appliedDelta = rivalNextValue - rivalPreviousValue;
      if (appliedDelta !== 0) {
        state[rivalId] = rivalNextValue;
        rivalAdjustments[rivalId] = appliedDelta;
        const rivalNextStanding = resolveStandingForValue(rivalNextValue);
        if (rivalNextStanding.id !== rivalPreviousStanding.id) {
          standingChanges.push({
            factionId: rivalId,
            previousStanding: rivalPreviousStanding.id,
            nextStanding: rivalNextStanding.id,
          });
        }
      }
    }

    if (nextPrimaryValue >= ALLIED_THRESHOLD) {
      const enforcedHostile = clampFactionReputation(HOSTILE_FLOOR);
      if (state[rivalId] > enforcedHostile) {
        const rivalPrevStanding = resolveStandingForValue(state[rivalId]);
        const applied = enforcedHostile - state[rivalId];
        state[rivalId] = enforcedHostile;
        rivalAdjustments[rivalId] = (rivalAdjustments[rivalId] ?? 0) + applied;
        const rivalNextStanding = resolveStandingForValue(state[rivalId]);
        if (rivalNextStanding.id !== rivalPrevStanding.id) {
          standingChanges.push({
            factionId: rivalId,
            previousStanding: rivalPrevStanding.id,
            nextStanding: rivalNextStanding.id,
          });
        }
      }
    }
  }

  return {
    values: state,
    primaryDelta: nextPrimaryValue - previousValue,
    rivalDeltas: rivalAdjustments,
    standingChanges,
  };
};

export const setFactionReputation = (
  original: FactionReputationState,
  factionId: FactionId,
  value: number
): ReputationAdjustmentResult => {
  const current = clampFactionReputation(original[factionId]);
  return applyFactionDelta(original, factionId, clampFactionReputation(value) - current);
};

export const getFactionStandingSummary = (
  factionId: FactionId,
  value: number
): {
  value: number;
  standing: FactionStandingDefinition;
  effects: string[];
  nextThreshold: ReturnType<typeof getNextStandingThreshold>;
} => {
  const standing = resolveStandingForValue(value);
  return {
    value,
    standing,
    effects: getFactionStandingEffects(factionId, standing.id),
    nextThreshold: getNextStandingThreshold(value),
  };
};

export const getStandingRank = (standingId: FactionStandingId): number => {
  return STANDING_DEFINITIONS.findIndex((standing) => standing.id === standingId);
};

const STANDING_LABEL_BY_LOCALE: Record<Locale, Record<FactionStandingId, string>> = {
  en: {
    hostile: 'Hostile',
    unfriendly: 'Unfriendly',
    neutral: 'Neutral',
    friendly: 'Friendly',
    allied: 'Allied',
  },
  uk: {
    hostile: 'Ворог',
    unfriendly: 'Недружній',
    neutral: 'Нейтральний',
    friendly: 'Союзний',
    allied: 'Союз',
  },
};

export const getLocalizedStandingLabel = (
  locale: Locale,
  standingId: FactionStandingId
): string => {
  return STANDING_LABEL_BY_LOCALE[locale]?.[standingId] ?? STANDING_BY_ID[standingId].label;
};

export const resolveReputationAction = (
  actionId: FactionReputationActionId
): ReputationActionDefinition => {
  return REPUTATION_ACTIONS[actionId];
};
