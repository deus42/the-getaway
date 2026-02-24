import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { HudLayoutPreset } from '../hudLayoutSlice';

const selectHudLayoutOverrideValue = (state: RootState) =>
  state.hudLayout.override;

export const selectHudLayoutPreset = createSelector(
  [
    selectHudLayoutOverrideValue,
    (state: RootState) => state.world.inCombat,
  ],
  (override, inCombat): HudLayoutPreset => {
    if (override) {
      return override;
    }

    if (inCombat) {
      return 'combat';
    }

    return 'exploration';
  }
);

export const selectHudLayoutOverride = selectHudLayoutOverrideValue;
