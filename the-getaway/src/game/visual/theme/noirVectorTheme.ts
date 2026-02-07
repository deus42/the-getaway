import type {
  BuildingVisualProfile,
  EntityVisualProfile,
  EntityVisualRole,
  VisualQualityBudget,
  VisualQualityPreset,
  VisualTheme,
} from '../contracts';
import type { BuildingDistrict, BuildingSignageStyle, PropDensityTier } from '../../../content/levels/level0/types';

const QUALITY_BUDGETS: Record<VisualQualityPreset, VisualQualityBudget> = {
  performance: {
    maxDecorPropsPerBuilding: 2,
    maxAmbientGlows: 12,
    enableAnimatedHazards: false,
    enableHighDensityLabels: false,
  },
  balanced: {
    maxDecorPropsPerBuilding: 4,
    maxAmbientGlows: 24,
    enableAnimatedHazards: true,
    enableHighDensityLabels: true,
  },
  cinematic: {
    maxDecorPropsPerBuilding: 6,
    maxAmbientGlows: 36,
    enableAnimatedHazards: true,
    enableHighDensityLabels: true,
  },
};

const makeBuildingProfile = (
  district: BuildingDistrict,
  signageStyle: BuildingSignageStyle,
  propDensity: PropDensityTier,
  facadePattern: BuildingVisualProfile['facadePattern'],
  lotPattern: BuildingVisualProfile['lotPattern'],
  massingStyle: BuildingVisualProfile['massingStyle'],
  massingHeight: number,
  accentHex: string,
  glowHex: string,
  trimHex: string,
  atmosphereHex: string,
  signagePrimaryHex: string,
  signageSecondaryHex: string,
  backdropHex: string
): BuildingVisualProfile => ({
  district,
  signageStyle,
  propDensity,
  facadePattern,
  lotPattern,
  massingStyle,
  massingHeight,
  accentHex,
  glowHex,
  trimHex,
  atmosphereHex,
  signagePrimaryHex,
  signageSecondaryHex,
  backdropHex,
});

const DISTRICT_DEFAULTS: Record<BuildingDistrict, BuildingVisualProfile> = {
  downtown: makeBuildingProfile(
    'downtown',
    'corp_holo',
    'medium',
    'ribbed',
    'plaza',
    'block',
    1.8,
    '#38bdf8',
    '#67e8f9',
    '#b6f7ff',
    '#081126',
    '#9beafe',
    '#67e8f9',
    '#0d1b2a'
  ),
  slums: makeBuildingProfile(
    'slums',
    'slums_neon',
    'medium',
    'banded',
    'market',
    'stacked',
    1.0,
    '#f97316',
    '#fb923c',
    '#ffd08d',
    '#170c09',
    '#6ff2ff',
    '#9c8cff',
    '#0b1220'
  ),
};

const ENTITY_PROFILES: Record<EntityVisualRole, EntityVisualProfile> = {
  player: {
    role: 'player',
    baseColor: 0x0f172a,
    outlineColor: 0x60a5fa,
    primaryColor: 0x3b82f6,
    accentColor: 0x67e8f9,
    glowColor: 0x38bdf8,
    columnHeight: 1.65,
    widthScale: 0.78,
    heightScale: 0.5,
    depthOffset: 12,
  },
  friendlyNpc: {
    role: 'friendlyNpc',
    baseColor: 0x1a2438,
    outlineColor: 0x22d3ee,
    primaryColor: 0x0ea5e9,
    accentColor: 0x67e8f9,
    glowColor: 0x22d3ee,
    columnHeight: 1.35,
    widthScale: 0.74,
    heightScale: 0.48,
    depthOffset: 9,
  },
  hostileNpc: {
    role: 'hostileNpc',
    baseColor: 0x2a161b,
    outlineColor: 0xef4444,
    primaryColor: 0xdc2626,
    accentColor: 0xf97316,
    glowColor: 0xfb7185,
    columnHeight: 1.4,
    widthScale: 0.75,
    heightScale: 0.49,
    depthOffset: 9,
  },
  interactiveNpc: {
    role: 'interactiveNpc',
    baseColor: 0x102238,
    outlineColor: 0xa78bfa,
    primaryColor: 0x8b5cf6,
    accentColor: 0x22d3ee,
    glowColor: 0xc084fc,
    columnHeight: 1.45,
    widthScale: 0.77,
    heightScale: 0.5,
    depthOffset: 10,
  },
};

export const createNoirVectorTheme = (preset: VisualQualityPreset): VisualTheme => ({
  id: 'noir-vector-v1',
  preset,
  qualityBudget: QUALITY_BUDGETS[preset],
  tilePalettes: {
    floorEven: 0x141a2a,
    floorOdd: 0x1c2438,
    wallEven: 0x2f3f60,
    wallOdd: 0x273552,
    coverEven: 0x284b52,
    coverOdd: 0x223f47,
    waterEven: 0x104461,
    waterOdd: 0x0f3750,
    trapEven: 0x562144,
    trapOdd: 0x451a36,
    doorEven: 0x2f3242,
    doorOdd: 0x242735,
  },
  districtDefaults: DISTRICT_DEFAULTS,
  entityProfiles: ENTITY_PROFILES,
});

export const resolveBuildingVisualProfile = (
  district: BuildingDistrict | undefined,
  signageStyle: BuildingSignageStyle | undefined,
  propDensity: PropDensityTier | undefined
): BuildingVisualProfile => {
  const resolvedDistrict: BuildingDistrict = district === 'downtown' ? 'downtown' : 'slums';
  const base = DISTRICT_DEFAULTS[resolvedDistrict];

  const style = signageStyle ?? base.signageStyle;
  const density = propDensity ?? base.propDensity;

  if (style === 'corp_brass') {
    return {
      ...base,
      signageStyle: style,
      propDensity: density,
      facadePattern: 'chevron',
      lotPattern: 'plaza',
      massingStyle: 'block',
      massingHeight: 2.0,
      accentHex: '#f3ca75',
      glowHex: '#fbbf24',
      trimHex: '#ffe4a3',
      atmosphereHex: '#1a140a',
      signagePrimaryHex: '#f3ca75',
      signageSecondaryHex: '#f9e2af',
      backdropHex: '#1a140a',
    };
  }

  if (style === 'slums_scrap') {
    return {
      ...base,
      signageStyle: style,
      propDensity: density,
      facadePattern: 'solid',
      lotPattern: 'service',
      massingStyle: 'block',
      massingHeight: 0.95,
      accentHex: '#f97316',
      glowHex: '#fb923c',
      trimHex: '#ffd299',
      atmosphereHex: '#190f08',
      signagePrimaryHex: '#f97316',
      signageSecondaryHex: '#fb923c',
      backdropHex: '#190f08',
    };
  }

  return {
    ...base,
    signageStyle: style,
    propDensity: density,
  };
};

export const resolveEntityVisualProfile = (role: EntityVisualRole): EntityVisualProfile => {
  return ENTITY_PROFILES[role];
};
