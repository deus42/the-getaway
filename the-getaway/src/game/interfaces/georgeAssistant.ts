import type { StoryFunctionTag, EnvironmentFlags } from './environment';
import type { DangerRating } from './types';

export type GeorgeAmbientCategory = 'rumor' | 'signage' | 'weather' | 'zoneDanger' | 'hazardChange';

export interface GeorgeAmbientRumorSnapshot {
  groupId: string;
  lines: string[];
  storyFunction?: StoryFunctionTag;
  updatedAt: number;
}

export interface GeorgeAmbientSignageSnapshot {
  signId: string;
  text: string;
  storyFunction?: StoryFunctionTag;
  updatedAt: number;
}

export interface GeorgeAmbientWeatherSnapshot {
  presetId: string | null;
  description: string;
  storyFunction?: StoryFunctionTag;
  updatedAt: number;
  rainIntensity: number;
  thunderActive: boolean;
}

export interface GeorgeAmbientZoneSnapshot {
  zoneId: string | null;
  zoneName: string | null;
  dangerRating: DangerRating | null;
  hazards: string[];
}

export interface GeorgeAmbientSnapshot {
  flags: EnvironmentFlags;
  rumor: GeorgeAmbientRumorSnapshot | null;
  signage: GeorgeAmbientSignageSnapshot | null;
  weather: GeorgeAmbientWeatherSnapshot;
  zone: GeorgeAmbientZoneSnapshot;
}
