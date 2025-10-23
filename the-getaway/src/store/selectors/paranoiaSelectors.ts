import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { ParanoiaTier } from '../../game/systems/paranoia/types';

export const selectParanoiaState = (state: RootState) => state.paranoia;

export const selectParanoiaValue = createSelector(
  selectParanoiaState,
  (paranoia) => paranoia.value
);

export const selectParanoiaTier = createSelector(
  selectParanoiaState,
  (paranoia): ParanoiaTier => paranoia.tier
);

export const selectParanoiaNormalized = createSelector(
  selectParanoiaValue,
  (value) => Math.max(0, Math.min(1, value / 100))
);

export const selectParanoiaCooldowns = createSelector(
  selectParanoiaState,
  (paranoia) => paranoia.cooldowns
);

export const selectParanoiaSnapshot = createSelector(
  selectParanoiaState,
  (paranoia) => paranoia.lastSnapshot
);

export const selectParanoiaFrozen = createSelector(
  selectParanoiaState,
  (paranoia) => paranoia.frozen
);

