import {
  BlackoutTier,
  GangHeatLevel,
  StoryFunctionTag,
  SupplyScarcityLevel,
} from '../../game/interfaces/environment';
import { Position } from '../../game/interfaces/types';

export interface RumorRotationDefinition {
  id: string;
  groupId: string;
  flag: 'gangHeat';
  value: GangHeatLevel;
  lines: string[];
  storyFunction: StoryFunctionTag;
  description: string;
}

export interface EnvironmentalNoteDefinition {
  id: string;
  flag: 'supplyScarcity' | 'gangHeat' | 'curfewLevel';
  value: SupplyScarcityLevel | GangHeatLevel | number;
  lines: string[];
  storyFunction: StoryFunctionTag;
  preferredZoneId?: string;
  position?: Position;
  description?: string;
}

export interface SignageVariantDefinition {
  id: string;
  signId: string;
  flag: 'blackoutTier' | 'supplyScarcity';
  value: BlackoutTier | SupplyScarcityLevel;
  text: string;
  storyFunction: StoryFunctionTag;
  description?: string;
}

export interface WeatherPresetDefinition {
  id: string;
  flag: 'curfewLevel' | 'gangHeat';
  value: number | GangHeatLevel;
  rainIntensity: number;
  thunderActive: boolean;
  sirenLoop: boolean;
  storyFunction: StoryFunctionTag;
  description?: string;
}
