import { ReputationEventIntensity, ReputationTrait, REPUTATION_TRAITS } from './types';

export const REPUTATION_STATE_VERSION = 1;

export const TRAIT_DECAY_SECONDS: Record<ReputationTrait, number> = {
  heroic: 60 * 45, // 45 in-game minutes
  cruel: 60 * 50,
  sneaky: 60 * 35,
  intimidating: 60 * 40,
  competent: 60 * 55,
};

export const DEFAULT_TRAIT_CONFIDENCE_DECAY = 1 / (60 * 60); // per second

export const WITNESS_VISIBILITY_THRESHOLD = 0.45;
export const WITNESS_RUMOR_THRESHOLD = 0.25;
export const MAX_WITNESSES_PER_EVENT = 12;

export const MAX_PROFILE_SOURCE_IDS = 5;

export const REPUTATION_VALUE_CLAMP = 100;

export const DEFAULT_RUMOR_TTL_SECONDS = 60 * 90;
export const MIN_RUMOR_STRENGTH = 0.1;
export const MAX_RUMORS_PER_CARRIER = 5;
export const GOSSIP_EDGE_ENERGY_PER_TICK = 1;
export const GOSSIP_EDGE_MAX_ENERGY = 6;
export const GOSSIP_ENERGY_COST_PER_HOP = 1;

export const INTENSITY_WEIGHTS: Record<ReputationEventIntensity, number> = {
  minor: 0.4,
  moderate: 0.65,
  major: 0.85,
  legendary: 1,
};

export const MIN_CONFIDENCE_TO_APPLY = 0.1;

export const REPUTATION_TRAIT_DEFAULTS: Record<ReputationTrait, number> = REPUTATION_TRAITS.reduce(
  (acc, trait) => {
    acc[trait] = 0;
    return acc;
  },
  {} as Record<ReputationTrait, number>
);
