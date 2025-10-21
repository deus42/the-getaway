import { HeatProfile } from '../../game/systems/suspicion/types';

const HOURS = 3600;

export const DEFAULT_HEAT_PROFILE: HeatProfile = {
  id: 'default',
  label: 'Baseline Urban Patrols',
  halfLifeSeconds: 72 * HOURS,
  certaintyFloor: 0.05,
  reinforcementBonus: 0.4,
  reportMultiplier: 1.25,
  suppressionPenalty: 0.4,
  topK: 5,
  proximityExponent: 0.85,
  tierThresholds: {
    tracking: 0.4,
    crackdown: 0.75,
  },
};

const PROFILE_OVERRIDES: Record<string, HeatProfile> = {
  downtown: {
    ...DEFAULT_HEAT_PROFILE,
    id: 'downtown',
    label: 'Downtown Grid Hyper-Patrol',
    halfLifeSeconds: 60 * HOURS,
    reportMultiplier: 1.35,
    topK: 6,
  },
  industrial: {
    ...DEFAULT_HEAT_PROFILE,
    id: 'industrial',
    label: 'Industrial Wasteland Patrol',
    halfLifeSeconds: 96 * HOURS,
    suppressionPenalty: 0.55,
  },
};

export const getHeatProfileForZone = (zoneId: string | null | undefined): HeatProfile => {
  if (!zoneId) {
    return DEFAULT_HEAT_PROFILE;
  }

  const profile = PROFILE_OVERRIDES[zoneId];
  return profile ?? DEFAULT_HEAT_PROFILE;
};

export const listHeatProfiles = (): HeatProfile[] => [
  DEFAULT_HEAT_PROFILE,
  ...Object.values(PROFILE_OVERRIDES),
];
