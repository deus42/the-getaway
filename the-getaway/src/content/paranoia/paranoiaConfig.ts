import type { ParanoiaTier } from '../../game/systems/paranoia/types';

export const PARANOIA_MAX_VALUE = 100;
export const PARANOIA_MIN_VALUE = 0;

export interface ParanoiaTierThreshold {
  tier: ParanoiaTier;
  min: number;
  max: number;
}

export const PARANOIA_TIER_THRESHOLDS: ParanoiaTierThreshold[] = [
  { tier: 'calm', min: 0, max: 24 },
  { tier: 'uneasy', min: 25, max: 49 },
  { tier: 'on_edge', min: 50, max: 74 },
  { tier: 'panicked', min: 75, max: 89 },
  { tier: 'breakdown', min: 90, max: 100 },
];

export const PARANOIA_BASE_DECAY_PER_SECOND = 0.08;

export const PARANOIA_CONFIG = {
  surveillance: {
    proximityRadius: 8,
    proximityGainPerSecond: 0.12,
    coneGainPerSecond: 0.24,
    alertSpike: 6,
    maxProximityContributionPerSecond: 0.3,
  },
  guards: {
    lineOfSightGainPerSecond: 0.18,
    pursuitGainPerSecond: 0.32,
    pursuitSpike: 5,
  },
  heat: {
    baselineGainPerSecond: 0.18,
  },
  circadian: {
    nightGainPerSecond: 0.05,
    daylightReliefPerSecond: 0.18,
    curfewSpike: 4,
  },
  health: {
    criticalThreshold: 0.3,
    sustainedGainPerSecond: 0.12,
    spike: 4,
  },
  ammo: {
    lowThreshold: 0.2,
    spike: 3,
  },
  hazards: {
    smogGainPerSecond: 0.04,
    blackoutGainPerSecond: 0.08,
  },
  safehouse: {
    entryRelief: 20,
    reliefPerSecond: 0.45,
  },
  respite: {
    maxGainPerTick: 0.8,
  },
  cigarettes: {
    relief: 10,
    decayBoostPerSecond: 0.02,
    durationMs: 90_000,
  },
  calmTabs: {
    relief: 25,
    cooldownMs: 60_000,
  },
  georgeReassure: {
    relief: 10,
    cooldownMs: 120_000,
  },
};
