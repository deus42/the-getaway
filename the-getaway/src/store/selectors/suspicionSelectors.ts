import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { getHighestHeatTier } from '../suspicionSlice';
import { HeatTier, WitnessMemory } from '../../game/systems/suspicion';
import { fromWitnessMemorySnapshot } from '../../game/systems/suspicion/witnessMemory';

const selectReputationSystemsEnabled = (state: RootState) =>
  Boolean(state.settings.reputationSystemsEnabled);

export const selectSuspicionState = (state: RootState) => state.suspicion;

export const selectZoneSuspicionState = (zoneId: string | null | undefined) =>
  createSelector(selectSuspicionState, selectReputationSystemsEnabled, (suspicion, enabled) => {
    if (!enabled || !zoneId) {
      return null;
    }
    return suspicion.zones[zoneId] ?? null;
  });

export const selectZoneHeat = (zoneId: string | null | undefined) =>
  createSelector(selectZoneSuspicionState(zoneId), (zone) => {
    if (!zone) {
      return {
        zoneId: zoneId ?? 'unknown',
        totalHeat: 0,
        tier: 'calm' as HeatTier,
        leadingWitnessIds: [],
      };
    }
    return zone.heat;
  });

export const selectGlobalHeatTier = createSelector(
  selectSuspicionState,
  selectReputationSystemsEnabled,
  (suspicion, enabled): HeatTier => {
    if (!enabled) {
      return 'calm';
    }
    return getHighestHeatTier(suspicion.zones);
  }
);

export const selectLeadingWitnessMemories = (zoneId: string | null | undefined) =>
  createSelector(selectZoneSuspicionState(zoneId), (zone): WitnessMemory[] => {
    if (!zone) {
      return [];
    }
    const { heat, memories } = zone;
    return heat.leadingWitnessIds
      .map((id) => memories[id])
      .filter((snapshot): snapshot is NonNullable<typeof snapshot> => Boolean(snapshot))
      .map((snapshot) => fromWitnessMemorySnapshot(snapshot));
  });
