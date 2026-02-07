import type { LevelBuildingDefinition } from '../../../content/levels/level0/types';
import type { BuildingVisualProfile, DistrictCompositionResult } from '../contracts';
import { resolveBuildingVisualProfile } from '../theme/noirVectorTheme';

const FACADE_PATTERNS: ReadonlyArray<BuildingVisualProfile['facadePattern']> = [
  'solid',
  'ribbed',
  'banded',
  'chevron',
];

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
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
    const facadePattern = FACADE_PATTERNS[seed % FACADE_PATTERNS.length];

    profilesByBuildingId[building.id] = {
      ...base,
      facadePattern,
    };
  });

  return { profilesByBuildingId };
};
