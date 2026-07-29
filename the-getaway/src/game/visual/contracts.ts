import type { BuildingDistrict, BuildingSignageStyle, PropDensityTier } from '../../content/levels/level0/types';

export type VisualQualityPreset = 'performance' | 'balanced' | 'cinematic';

export type VisualRenderStyle = 'noir-vector' | 'graphic-painterly-noir';

export interface VisualTreatmentTokens {
  readonly ink: {
    readonly primary: number;
    readonly soft: number;
    readonly wash: number;
    readonly dryBrushAlpha: number;
  };
  readonly surface: {
    readonly bone: number;
    readonly charcoal: number;
    readonly umber: number;
    readonly mutedTeal: number;
    readonly markAlpha: number;
    readonly variation: number;
  };
  readonly lighting: {
    readonly keyDirection: 'upper-left';
    readonly practical: number;
    readonly practicalShadow: number;
    readonly technology: number;
    readonly threat: number;
    readonly ambient: number;
    readonly practicalAlpha: number;
  };
  readonly outline: {
    readonly color: number;
    readonly width: number;
    readonly alpha: number;
    readonly secondaryAlpha: number;
  };
  readonly grid: {
    readonly lineColor: number;
    readonly lineAlpha: number;
    readonly majorLineAlpha: number;
    readonly majorLineInterval: number;
    readonly blockedAlpha: number;
    readonly walkableAlpha: number;
  };
}

export interface MapVisualProfile {
  readonly id: 'default-vector' | 'level0-painterly-v1';
  readonly renderStyle: VisualRenderStyle;
  readonly environmentAtlasSetId: 'legacy-level0' | 'level0-painterly-v1';
  readonly buildingArtSetId?: 'level0-painterly-v1';
  readonly showBuildingLabels: boolean;
  readonly showBoundaryWalls: boolean;
  readonly camera: {
    readonly initialFitFactor: number;
    readonly minimumInitialZoom: number;
  };
  /**
   * Decorative painted city ring beyond the playable grid (GET-182). When set,
   * the camera also drops its beyond-map bounds padding so void is never
   * reachable; the ring absorbs any viewport overhang at minimum zoom.
   */
  readonly citySurround?: {
    readonly ringX: number;
    readonly ringY: number;
    readonly prunePadPx: number;
    readonly seed: number;
    readonly variantCount: number;
  };
  /** 'surround-fade' drops the painted skyline/vignette backdrop in favor of a plain gradient meeting the surround ring. */
  readonly backdropStyle?: 'skyline-vignette' | 'surround-fade';
}

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
  readonly renderStyle: VisualRenderStyle;
  readonly mapProfile: MapVisualProfile;
  readonly treatment: VisualTreatmentTokens;
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
  readonly surfacePalettes: {
    readonly lotEven: number;
    readonly lotOdd: number;
    readonly roadEven: number;
    readonly roadOdd: number;
    readonly crosswalkEven: number;
    readonly crosswalkOdd: number;
    readonly sidewalkEven: number;
    readonly sidewalkOdd: number;
  };
  readonly districtDefaults: Record<BuildingDistrict, BuildingVisualProfile>;
  readonly entityProfiles: Record<EntityVisualRole, EntityVisualProfile>;
}

export interface DistrictCompositionResult {
  readonly profilesByBuildingId: Record<string, BuildingVisualProfile>;
}
