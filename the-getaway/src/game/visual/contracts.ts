import type { BuildingDistrict, BuildingSignageStyle, PropDensityTier } from '../../content/levels/level0/types';

export type VisualQualityPreset = 'performance' | 'balanced' | 'cinematic';

export type EntityVisualRole =
  | 'player'
  | 'friendlyNpc'
  | 'hostileNpc'
  | 'interactiveNpc';

export interface MaterialPalette {
  readonly id: string;
  readonly base: number;
  readonly highlight: number;
  readonly shadow: number;
  readonly accent: number;
  readonly glow: number;
}

export interface VisualQualityBudget {
  readonly maxDecorPropsPerBuilding: number;
  readonly maxAmbientGlows: number;
  readonly enableAnimatedHazards: boolean;
  readonly enableHighDensityLabels: boolean;
  readonly maxFogBands: number;
  readonly maxEmissiveZones: number;
  readonly wetReflectionAlpha: number;
  readonly occlusionFadeFloor: number;
}

export interface EntityVisualProfile {
  readonly role: EntityVisualRole;
  readonly baseColor: number;
  readonly outlineColor: number;
  readonly primaryColor: number;
  readonly accentColor: number;
  readonly glowColor: number;
  readonly columnHeight: number;
  readonly widthScale: number;
  readonly heightScale: number;
  readonly depthOffset: number;
}

export interface BuildingVisualProfile {
  readonly district: BuildingDistrict;
  readonly signageStyle: BuildingSignageStyle;
  readonly propDensity: PropDensityTier;
  readonly facadePattern: 'solid' | 'ribbed' | 'banded' | 'chevron';
  readonly lotPattern: 'plaza' | 'service' | 'market';
  readonly massingStyle: 'spire' | 'block' | 'stacked';
  readonly massingHeight: number;
  readonly accentHex: string;
  readonly glowHex: string;
  readonly trimHex: string;
  readonly atmosphereHex: string;
  readonly signagePrimaryHex: string;
  readonly signageSecondaryHex: string;
  readonly backdropHex: string;
}

export interface VisualTheme {
  readonly id: string;
  readonly preset: VisualQualityPreset;
  readonly qualityBudget: VisualQualityBudget;
  readonly tilePalettes: {
    readonly floorEven: number;
    readonly floorOdd: number;
    readonly wallEven: number;
    readonly wallOdd: number;
    readonly coverEven: number;
    readonly coverOdd: number;
    readonly waterEven: number;
    readonly waterOdd: number;
    readonly trapEven: number;
    readonly trapOdd: number;
    readonly doorEven: number;
    readonly doorOdd: number;
  };
  readonly districtDefaults: Record<BuildingDistrict, BuildingVisualProfile>;
  readonly entityProfiles: Record<EntityVisualRole, EntityVisualProfile>;
}

export interface DistrictCompositionResult {
  readonly profilesByBuildingId: Record<string, BuildingVisualProfile>;
}
