export type AutoBattleProfileId = 'balanced' | 'aggressive' | 'defensive';

export interface AutoBattleProfileWeights {
  attackBias: number;
  focusLowestHealth: number;
  focusOverwatchThreat: number;
  maintainCover: number;
  pursuitAggression: number;
  consumableAggression: number;
  retreatBias: number;
}

export interface AutoBattleProfileThresholds {
  panicHealthFraction: number;
  apReserve: number;
  minimumConsumableCharges: number;
}

export interface AutoBattleProfile {
  id: AutoBattleProfileId;
  label: string;
  description: string;
  weights: AutoBattleProfileWeights;
  thresholds: AutoBattleProfileThresholds;
}

const makeProfile = (profile: AutoBattleProfile): AutoBattleProfile => profile;

export const AUTO_BATTLE_PROFILES: Record<AutoBattleProfileId, AutoBattleProfile> = {
  balanced: makeProfile({
    id: 'balanced',
    label: 'Balanced',
    description:
      'Evaluates offence and defence evenly. Prioritises clear shots, keeps moderate AP reserve, and falls back to cover if health dips.',
    weights: {
      attackBias: 1,
      focusLowestHealth: 0.75,
      focusOverwatchThreat: 0.85,
      maintainCover: 0.8,
      pursuitAggression: 0.65,
      consumableAggression: 0.5,
      retreatBias: 0.6,
    },
    thresholds: {
      panicHealthFraction: 0.35,
      apReserve: 1,
      minimumConsumableCharges: 1,
    },
  }),
  aggressive: makeProfile({
    id: 'aggressive',
    label: 'Aggressive',
    description:
      'Closes distance, spends AP rapidly, and consumes resources to finish priority targets. Retreats only when near death.',
    weights: {
      attackBias: 1.35,
      focusLowestHealth: 1.1,
      focusOverwatchThreat: 0.7,
      maintainCover: 0.35,
      pursuitAggression: 1.2,
      consumableAggression: 1,
      retreatBias: 0.2,
    },
    thresholds: {
      panicHealthFraction: 0.2,
      apReserve: 0,
      minimumConsumableCharges: 0,
    },
  }),
  defensive: makeProfile({
    id: 'defensive',
    label: 'Defensive',
    description:
      'Holds positions with strong cover, conserves consumables, and only advances when safe. Will disengage early if health drops.',
    weights: {
      attackBias: 0.6,
      focusLowestHealth: 0.55,
      focusOverwatchThreat: 1.25,
      maintainCover: 1.6,
      pursuitAggression: 0.3,
      consumableAggression: 0.25,
      retreatBias: 1.4,
    },
    thresholds: {
      panicHealthFraction: 0.5,
      apReserve: 2,
      minimumConsumableCharges: 2,
    },
  }),
};

export const DEFAULT_AUTO_BATTLE_PROFILE_ID: AutoBattleProfileId = 'balanced';

export const AUTO_BATTLE_PROFILE_IDS: AutoBattleProfileId[] = Object.keys(
  AUTO_BATTLE_PROFILES
) as AutoBattleProfileId[];

export const getAutoBattleProfile = (id: AutoBattleProfileId): AutoBattleProfile =>
  AUTO_BATTLE_PROFILES[id] ?? AUTO_BATTLE_PROFILES.balanced;
