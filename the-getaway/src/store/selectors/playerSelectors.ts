import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { FactionId, PersonalityFlags, PersonalityProfile, PersonalityTrait } from '../../game/interfaces/types';

const selectPlayerState = (state: RootState) => state.player.data;
const selectReputationSystemsEnabled = (state: RootState) =>
  Boolean(state.settings.reputationSystemsEnabled);
const DEFAULT_FACTION_REPUTATION: Record<FactionId, number> = {
  resistance: 0,
  corpsec: 0,
  scavengers: 0,
};

export const selectPlayerKarma = createSelector(selectPlayerState, (player) => player.karma);

export const selectPlayerFactionReputation = createSelector(
  selectPlayerState,
  selectReputationSystemsEnabled,
  (player, enabled) => (enabled ? player.factionReputation : DEFAULT_FACTION_REPUTATION)
);

const PERSONALITY_WEIGHT_BY_BACKGROUND: Record<string, Partial<PersonalityFlags>> = {
  corpsec_defector: { earnest: 0.6, stoic: 0.4 },
  street_urchin: { sarcastic: 0.7, ruthless: 0.3 },
  underground_hacker: { sarcastic: 0.6, earnest: 0.4 },
  wasteland_scavenger: { ruthless: 0.6, stoic: 0.4 },
};

const determineDominantTrait = (flags: PersonalityFlags): PersonalityTrait => {
  let dominant: PersonalityTrait = 'earnest';
  let highest = Number.NEGATIVE_INFINITY;

  (Object.keys(flags) as PersonalityTrait[]).forEach((trait) => {
    const value = flags[trait];
    if (value > highest) {
      dominant = trait;
      highest = value;
    }
  });

  return dominant;
};

const normalizeFlags = (flags: Partial<PersonalityFlags>): PersonalityFlags => {
  const defaults: PersonalityFlags = {
    earnest: 0,
    sarcastic: 0,
    ruthless: 0,
    stoic: 0,
  };

  const merged: PersonalityFlags = { ...defaults, ...flags };
  const total = Object.values(merged).reduce((acc, value) => acc + value, 0);

  if (total <= 0) {
    return { ...defaults, earnest: 1 };
  }

  return (Object.keys(merged) as PersonalityTrait[]).reduce((acc, trait) => {
    acc[trait] = Number.parseFloat((merged[trait] / total).toFixed(3));
    return acc;
  }, defaults);
};

export const selectPlayerPersonalityProfile = createSelector(
  selectPlayerState,
  (player): PersonalityProfile => {
    const baseFlags: Partial<PersonalityFlags> = { ...player.personality.flags };

    if (player.backgroundId) {
      const backgroundWeights = PERSONALITY_WEIGHT_BY_BACKGROUND[player.backgroundId];
      if (backgroundWeights) {
        (Object.keys(backgroundWeights) as PersonalityTrait[]).forEach((trait) => {
          const existing = baseFlags[trait] ?? 0;
          baseFlags[trait] = existing + backgroundWeights[trait]!;
        });
      }
    }

    const normalized = normalizeFlags(baseFlags);
    return {
      alignment: determineDominantTrait(normalized),
      flags: normalized,
      lastUpdated: player.personality.lastUpdated,
      lastChangeSource: player.personality.lastChangeSource,
    };
  }
);

export const selectPlayerName = createSelector(selectPlayerState, (player) => player.name);
