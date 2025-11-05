import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import {
  ReputationProfile,
  ReputationTrait,
  ReputationScope,
  REPUTATION_TRAITS,
} from '../../game/systems/reputation';
import { FactionId } from '../../game/interfaces/types';

const selectReputationRoot = (state: RootState) => state.reputation;

export const selectReputationHeatmapEnabled = createSelector(
  selectReputationRoot,
  (state) => state.debug.heatmapEnabled
);

const selectProfiles = createSelector(selectReputationRoot, (state) => state.profiles);

const getTraitSnapshot = (
  profile: ReputationProfile | undefined,
  trait: ReputationTrait
): { value: number; confidence: number } => {
  if (!profile) {
    return { value: 0, confidence: 0 };
  }

  const sample = profile.traits[trait];
  if (!sample) {
    return { value: 0, confidence: 0 };
  }

  return {
    value: sample.value,
    confidence: sample.confidence,
  };
};

export const makeSelectProfile = (scopeId: string) =>
  createSelector(selectProfiles, (profiles) => profiles[scopeId]);

export interface ScopedTraitQuery {
  witnessId?: string | null;
  factionId?: FactionId | null;
  cellId?: string | null;
  trait: ReputationTrait;
}

export interface ScopedTraitSnapshot {
  value: number;
  confidence: number;
  scope: ReputationScope | 'fallback';
  scopeId: string | null;
}

export const makeSelectScopedTraitSnapshot = ({
  witnessId,
  factionId,
  cellId,
  trait,
}: ScopedTraitQuery) =>
  createSelector(selectProfiles, (profiles): ScopedTraitSnapshot => {
    const targetOrder: Array<{ scope: ReputationScope; id: string | null }> = [
      { scope: 'witness', id: witnessId ?? null },
      { scope: 'cell', id: cellId ?? null },
      { scope: 'faction', id: factionId ?? null },
    ];

    for (const target of targetOrder) {
      if (!target.id) {
        continue;
      }
      const profile = profiles[target.id];
      if (!profile) {
        continue;
      }
      const snapshot = getTraitSnapshot(profile, trait);
      if (snapshot.confidence > 0 || snapshot.value !== 0) {
        return {
          value: snapshot.value,
          confidence: snapshot.confidence,
          scope: target.scope,
          scopeId: target.id,
        };
      }
    }

    return {
      value: 0,
      confidence: 0,
      scope: 'fallback',
      scopeId: null,
    };
  });

export const makeSelectTopTraitsForScope = (scopeId: string, limit = 3) =>
  createSelector(selectProfiles, (profiles) => {
    const profile = profiles[scopeId];
    if (!profile) {
      return [];
    }

    return REPUTATION_TRAITS.map((trait) => {
      const sample = profile.traits[trait];
      return {
        trait,
        value: sample?.value ?? 0,
        confidence: sample?.confidence ?? 0,
      };
    })
      .filter((entry) => entry.value !== 0)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, limit);
  });

const TRAIT_REPUTATION_WEIGHTS: Record<ReputationTrait, number> = {
  heroic: 0.12,
  cruel: -0.14,
  sneaky: -0.08,
  intimidating: -0.07,
  competent: 0.1,
};

const selectFactionReputationMap = (state: RootState) => state.player.data.factionReputation;

const computeWeightedContribution = (profile: ReputationProfile): { value: number; weight: number } => {
  let value = 0;
  let weight = 0;

  REPUTATION_TRAITS.forEach((trait) => {
    const sample = profile.traits[trait];
    if (!sample || sample.confidence <= 0) {
      return;
    }

    const traitWeight = TRAIT_REPUTATION_WEIGHTS[trait];
    value += sample.value * traitWeight * sample.confidence;
    weight += Math.abs(traitWeight) * sample.confidence;
  });

  return { value, weight };
};

export interface EffectiveFactionReputation {
  value: number;
  confidence: number;
}

export const makeSelectEffectiveFactionReputation = (
  factionId: FactionId,
  options?: { cellId?: string | null; witnessId?: string | null }
) =>
  createSelector(selectProfiles, selectFactionReputationMap, (profiles, factionMap): EffectiveFactionReputation => {
    let value = factionMap[factionId] ?? 0;
    let cumulativeWeight = 0;

    const applyProfileContribution = (profileId: string | null | undefined, multiplier: number) => {
      if (!profileId) {
        return;
      }
      const profile = profiles[profileId];
      if (!profile) {
        return;
      }

      const contribution = computeWeightedContribution(profile);
      value += contribution.value * multiplier;
      cumulativeWeight += contribution.weight * Math.abs(multiplier);
    };

    applyProfileContribution(factionId, 0.7);
    applyProfileContribution(options?.cellId ?? null, 0.55);
    applyProfileContribution(options?.witnessId ?? null, 0.9);

    const confidence = cumulativeWeight > 0 ? Math.min(1, cumulativeWeight / 10) : 0;

    return {
      value,
      confidence,
    };
  });

export const selectInspectorTargetId = createSelector(
  selectReputationRoot,
  (state) => state.debug.inspectorTargetId ?? null
);
