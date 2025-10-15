import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { findSignageVariantById, findWeatherPresetById } from '../../content/environment';
import type {
  GeorgeAmbientRumorSnapshot,
  GeorgeAmbientSignageSnapshot,
  GeorgeAmbientSnapshot,
  GeorgeAmbientWeatherSnapshot,
  GeorgeAmbientZoneSnapshot,
} from '../../game/interfaces/georgeAssistant';

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

const selectCurrentMapArea = (state: RootState) => state.world.currentMapArea;

const pickLatestRumor = (rumorSets: GeorgeAmbientRumorSnapshot[]): GeorgeAmbientRumorSnapshot | null => {
  if (rumorSets.length === 0) {
    return null;
  }

  const sorted = [...rumorSets].sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0));
  return sorted[0] ?? null;
};

const pickLatestSignage = (signage: GeorgeAmbientSignageSnapshot[]): GeorgeAmbientSignageSnapshot | null => {
  if (signage.length === 0) {
    return null;
  }

  const sorted = [...signage].sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0));
  return sorted[0] ?? null;
};

export const selectAmbientWorldSnapshot = createSelector(
  [selectEnvironment, selectCurrentMapArea],
  (environment, currentArea): GeorgeAmbientSnapshot => {
    const rumorEntries: GeorgeAmbientRumorSnapshot[] = Object.entries(environment.rumorSets).map(
      ([groupId, snapshot]) => ({
        groupId,
        lines: [...snapshot.lines],
        storyFunction: snapshot.storyFunction,
        updatedAt: snapshot.updatedAt,
      })
    );

    const signageEntries: GeorgeAmbientSignageSnapshot[] = Object.entries(environment.signage).map(
      ([signId, snapshot]) => {
        const variant = findSignageVariantById(snapshot.variantId);
        return {
          signId,
          text: variant?.text ?? '',
          storyFunction: variant?.storyFunction ?? snapshot.storyFunction,
          updatedAt: snapshot.updatedAt,
        };
      }
    );

    const weatherPreset = environment.weather.presetId
      ? findWeatherPresetById(environment.weather.presetId)
      : null;

    const weather: GeorgeAmbientWeatherSnapshot = {
      presetId: environment.weather.presetId,
      description: weatherPreset?.description ?? '',
      storyFunction: weatherPreset?.storyFunction ?? environment.weather.storyFunction,
      updatedAt: environment.weather.updatedAt,
      rainIntensity: environment.weather.rainIntensity,
      thunderActive: environment.weather.thunderActive,
    };

  const zone: GeorgeAmbientZoneSnapshot = {
    zoneId: currentArea?.zoneId ?? null,
    zoneName: currentArea?.displayName ?? currentArea?.name ?? null,
    dangerRating: currentArea?.dangerRating ?? null,
    hazards: Array.isArray(currentArea?.hazards) ? [...currentArea.hazards] : [],
    summary: currentArea?.summary ?? null,
    directives: Array.isArray(currentArea?.objectives)
      ? currentArea.objectives.filter((value) => value && value.trim().length > 0).map((value) => value.trim())
      : [],
  };

    return {
      flags: { ...environment.flags },
      rumor: pickLatestRumor(rumorEntries),
      signage: pickLatestSignage(signageEntries),
      weather,
      zone,
    };
  }
);
