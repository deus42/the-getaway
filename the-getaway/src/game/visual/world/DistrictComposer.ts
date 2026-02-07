import type { LevelBuildingDefinition } from '../../../content/levels/level0/types';
import type { BuildingVisualProfile, DistrictCompositionResult } from '../contracts';
import { resolveBuildingVisualProfile } from '../theme/noirVectorTheme';

const FACADE_PATTERNS: ReadonlyArray<BuildingVisualProfile['facadePattern']> = [
  'solid',
  'ribbed',
  'banded',
  'chevron',
];

const DOWNTOWN_FACADES: ReadonlyArray<BuildingVisualProfile['facadePattern']> = ['ribbed', 'chevron'];
const SLUMS_FACADES: ReadonlyArray<BuildingVisualProfile['facadePattern']> = ['solid', 'banded'];

const DOWNTOWN_LOTS: ReadonlyArray<BuildingVisualProfile['lotPattern']> = ['plaza', 'service'];
const SLUMS_LOTS: ReadonlyArray<BuildingVisualProfile['lotPattern']> = ['market', 'service'];

const DOWNTOWN_MASSING: ReadonlyArray<BuildingVisualProfile['massingStyle']> = ['block'];
const SLUMS_MASSING: ReadonlyArray<BuildingVisualProfile['massingStyle']> = ['stacked', 'block'];

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const shiftHex = (hex: string, shift: number): string => {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) {
    return hex;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const delta = shift * 255;

  const next = [clampByte(r + delta), clampByte(g + delta), clampByte(b + delta)]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('');
  return `#${next}`;
};

export const composeBuildingVisualProfiles = (
  buildings: LevelBuildingDefinition[]
): DistrictCompositionResult => {
  const profilesByBuildingId: Record<string, BuildingVisualProfile> = {};

  buildings.forEach((building) => {
    const base = resolveBuildingVisualProfile(
      building.district,
      building.signageStyle,
      building.propDensity
    );

    const seed = hashString(`${building.id}:${building.name}`);
    const district = building.district === 'downtown' ? 'downtown' : 'slums';
    const facadePool = district === 'downtown' ? DOWNTOWN_FACADES : SLUMS_FACADES;
    const lotPool = district === 'downtown' ? DOWNTOWN_LOTS : SLUMS_LOTS;
    const massingPool = district === 'downtown' ? DOWNTOWN_MASSING : SLUMS_MASSING;
    const facadePattern = facadePool[seed % facadePool.length] ?? FACADE_PATTERNS[seed % FACADE_PATTERNS.length];
    const lotPattern = lotPool[(seed >> 1) % lotPool.length] ?? base.lotPattern;
    const massingStyle = massingPool[(seed >> 2) % massingPool.length] ?? base.massingStyle;
    const districtBaseHeight = district === 'downtown' ? 1.45 : 1.0;
    const heightVariance = ((seed % 7) - 3) * 0.09;
    const massingHeight = Math.max(0.85, districtBaseHeight + heightVariance);
    const accentShift = district === 'downtown' ? ((seed % 5) - 2) * 0.05 : ((seed % 7) - 3) * 0.06;

    profilesByBuildingId[building.id] = {
      ...base,
      facadePattern,
      lotPattern,
      massingStyle,
      massingHeight,
      accentHex: shiftHex(base.accentHex, accentShift),
      glowHex: shiftHex(base.glowHex, accentShift * 0.7),
      trimHex: shiftHex(base.trimHex, accentShift * 0.45),
      atmosphereHex: shiftHex(base.atmosphereHex, accentShift * 0.28),
    };
  });

  return { profilesByBuildingId };
};
