export type StoryFunctionTag = 'foreshadow' | 'misdirect' | 'payoff' | 'world-building';

export type GangHeatLevel = 'low' | 'med' | 'high';

export type SupplyScarcityLevel = 'norm' | 'tight' | 'rationed';

export type BlackoutTier = 'none' | 'brownout' | 'rolling';

export interface EnvironmentFlags {
  gangHeat: GangHeatLevel;
  curfewLevel: number;
  supplyScarcity: SupplyScarcityLevel;
  blackoutTier: BlackoutTier;
}

import type { TimeOfDay } from '../world/dayNightCycle';

export interface WeatherStateSnapshot {
  presetId: string | null;
  rainIntensity: number;
  thunderActive: boolean;
  sirenLoop: boolean;
  storyFunction?: StoryFunctionTag;
  updatedAt: number;
  timeOfDay: TimeOfDay | null;
}

export interface SignageStateSnapshot {
  variantId: string;
  storyFunction: StoryFunctionTag;
  updatedAt: number;
}

export interface RumorSetSnapshot {
  lines: string[];
  storyFunction: StoryFunctionTag;
  sourceId: string;
  updatedAt: number;
}

export interface EnvironmentalNoteInstance {
  instanceId: string;
  definitionId: string;
  areaId: string;
  lines: string[];
  storyFunction: StoryFunctionTag;
  spawnedAt: number;
}

export interface EnvironmentState {
  flags: EnvironmentFlags;
  weather: WeatherStateSnapshot;
  signage: Record<string, SignageStateSnapshot>;
  rumorSets: Record<string, RumorSetSnapshot>;
  notes: EnvironmentalNoteInstance[];
}
