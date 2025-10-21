import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { HeatTier, getHighestHeatTier } from '../suspicionSlice';
import { WitnessMemory } from '../../game/systems/suspicion/types';
import { fromWitnessMemorySnapshot } from '../../game/systems/suspicion/witnessMemory';

export const selectSuspicionState = (state: RootState) => state.suspicion;

export const selectZoneSuspicionState = (zoneId: string | null | undefined) =>
  createSelector(selectSuspicionState, (suspicion) => {
    if (!zoneId) {
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

export const selectGlobalHeatTier = createSelector(selectSuspicionState, (suspicion): HeatTier => {
  return getHighestHeatTier(suspicion.zones);
});

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
