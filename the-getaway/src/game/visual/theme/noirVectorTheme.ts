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
  accentHex: string,
  glowHex: string,
  signagePrimaryHex: string,
  signageSecondaryHex: string,
  backdropHex: string
): BuildingVisualProfile => ({
  district,
  signageStyle,
  propDensity,
  facadePattern,
  accentHex,
  glowHex,
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
    '#7dd3fc',
    '#67e8f9',
    '#9beafe',
    '#67e8f9',
    '#0d1b2a'
  ),
  slums: makeBuildingProfile(
    'slums',
    'slums_neon',
    'medium',
    'banded',
    '#f97316',
    '#fb923c',
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
    floorEven: 0x1a2334,
    floorOdd: 0x202b3f,
    wallEven: 0x2c3852,
    wallOdd: 0x263249,
    coverEven: 0x23424a,
    coverOdd: 0x1f383f,
    waterEven: 0x134562,
    waterOdd: 0x123d56,
    trapEven: 0x4a2352,
    trapOdd: 0x3f1e45,
    doorEven: 0x2c2f3b,
    doorOdd: 0x262a35,
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
      accentHex: '#f3ca75',
      glowHex: '#fbbf24',
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
      accentHex: '#f97316',
      glowHex: '#fb923c',
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
