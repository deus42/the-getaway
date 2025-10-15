import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';

export const selectEnvironment = (state: RootState) => state.world.environment;

export const selectEnvironmentFlags = createSelector(
  selectEnvironment,
  (environment) => environment.flags
);

export const selectGangHeat = createSelector(
  selectEnvironmentFlags,
  (flags) => flags.gangHeat
);

export const selectCurfewLevel = createSelector(
  selectEnvironmentFlags,
  (flags) => flags.curfewLevel
);

export const selectSupplyScarcity = createSelector(
  selectEnvironmentFlags,
  (flags) => flags.supplyScarcity
);

export const selectBlackoutTier = createSelector(
  selectEnvironmentFlags,
  (flags) => flags.blackoutTier
);

export const selectRumorSetByGroup = (groupId: string) =>
  createSelector(selectEnvironment, (environment) => environment.rumorSets[groupId]);

export const selectSignageVariantById = (signId: string) =>
  createSelector(selectEnvironment, (environment) => environment.signage[signId]);

export const selectEnvironmentNotes = createSelector(
  selectEnvironment,
  (environment) => environment.notes
);
