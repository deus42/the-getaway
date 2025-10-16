import type { StoryFunctionTag, EnvironmentFlags } from './environment';
import type { DangerRating } from './types';
import type { TimeOfDay } from '../world/dayNightCycle';
import type { CombinedSystemImpact } from '../world/environment/environmentMatrix';

export type GeorgeAmbientCategory =
  | 'rumor'
  | 'signage'
  | 'weather'
  | 'zoneDanger'
  | 'hazardChange'
  | 'zoneBrief';

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
  timeOfDay: TimeOfDay | null;
}

export interface GeorgeAmbientZoneSnapshot {
  zoneId: string | null;
  zoneName: string | null;
  dangerRating: DangerRating | null;
  hazards: string[];
  summary: string | null;
  directives: string[];
}

export interface GeorgeAmbientSnapshot {
  flags: EnvironmentFlags;
  impacts: CombinedSystemImpact;
  rumor: GeorgeAmbientRumorSnapshot | null;
  signage: GeorgeAmbientSignageSnapshot | null;
  weather: GeorgeAmbientWeatherSnapshot;
  zone: GeorgeAmbientZoneSnapshot;
}
