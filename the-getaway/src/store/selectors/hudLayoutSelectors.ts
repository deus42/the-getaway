import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { HudLayoutPreset } from '../hudLayoutSlice';

const selectHudLayoutOverrideValue = (state: RootState) =>
  state.hudLayout.override;

const selectCurrentZoneHeat = (state: RootState) => {
  const zoneId = state.world.currentMapArea?.zoneId ?? null;
  if (!zoneId) {
    return 0;
  }
  return state.suspicion.zones[zoneId]?.heat?.totalHeat ?? 0;
};

const selectDetectionProgress = (state: RootState) =>
  state.surveillance.hud?.detectionProgress ?? 0;

export const selectHudLayoutPreset = createSelector(
  [
    selectHudLayoutOverrideValue,
    (state: RootState) => state.world.inCombat,
    (state: RootState) => state.world.engagementMode,
    selectCurrentZoneHeat,
    selectDetectionProgress,
  ],
  (
    override,
    inCombat,
    engagementMode,
    zoneHeat,
    detectionProgress
  ): HudLayoutPreset => {
    if (override) {
      return override;
    }

    if (inCombat) {
      return 'combat';
    }

    if (engagementMode === 'stealth') {
      return 'stealth';
    }

    const stealthPressure = Math.max(
      Math.round(zoneHeat),
      Math.round(detectionProgress)
    );

    if (stealthPressure >= 45) {
      return 'stealth';
    }

    return 'exploration';
  }
);

export const selectHudLayoutOverride = selectHudLayoutOverrideValue;
