import type { MapArea, MapBuildingDefinition, Position } from '../../interfaces/types';
import type { BuildingVisualProfile, VisualTheme } from '../contracts';

export interface ScenicTileContext {
  readonly district: 'downtown' | 'slums';
  readonly lotPattern: BuildingVisualProfile['lotPattern'];
  readonly nearEntrance: boolean;
  readonly distanceToDoor: number;
  readonly signageStyle: BuildingVisualProfile['signageStyle'];
  readonly propDensity: BuildingVisualProfile['propDensity'];
  readonly accentHex: string;
  readonly glowHex: string;
}

export interface EnvironmentCompositionResult {
  readonly scenicTileContextByKey: Record<string, ScenicTileContext>;
  readonly preferredLampGrid?: Position;
}

const positionKey = (x: number, y: number): string => `${x}:${y}`;

const distanceToFootprint = (position: Position, building: MapBuildingDefinition): number => {
  const clampedX = Math.max(building.footprint.from.x, Math.min(building.footprint.to.x, position.x));
  const clampedY = Math.max(building.footprint.from.y, Math.min(building.footprint.to.y, position.y));
  return Math.abs(position.x - clampedX) + Math.abs(position.y - clampedY);
};

const nearestBuildingForTile = (
  position: Position,
  buildings: MapBuildingDefinition[],
  profilesByBuildingId: Record<string, BuildingVisualProfile>
): { building: MapBuildingDefinition; profile: BuildingVisualProfile } | null => {
  let winner: { building: MapBuildingDefinition; profile: BuildingVisualProfile } | null = null;
  let winnerDistance = Number.POSITIVE_INFINITY;

  buildings.forEach((building) => {
    const profile = profilesByBuildingId[building.id];
    if (!profile) {
      return;
    }

    const distance = distanceToFootprint(position, building);
    if (distance < winnerDistance) {
      winner = { building, profile };
      winnerDistance = distance;
    }
  });

  return winner;
};

const resolvePreferredLampGrid = (
  buildings: MapBuildingDefinition[],
  profilesByBuildingId: Record<string, BuildingVisualProfile>
): Position | undefined => {
  const ranked = [...buildings].sort((left, right) => {
    const leftProfile = profilesByBuildingId[left.id];
    const rightProfile = profilesByBuildingId[right.id];

    const score = (profile: BuildingVisualProfile | undefined): number => {
      if (!profile) {
        return 0;
      }

      return (
        (profile.district === 'downtown' ? 6 : 0) +
        (profile.lotPattern === 'plaza' ? 3 : 0) +
        (profile.signageStyle === 'corp_brass' ? 2 : 0) +
        (profile.propDensity === 'high' ? 1 : 0)
      );
    };

    return score(rightProfile) - score(leftProfile);
  });

  const anchor = ranked[0];
  return anchor ? { ...anchor.door } : undefined;
};

export const composeEnvironmentArt = (
  mapArea: MapArea,
  buildings: MapBuildingDefinition[],
  profilesByBuildingId: Record<string, BuildingVisualProfile>,
  theme: VisualTheme
): EnvironmentCompositionResult => {
  void theme;

  const scenicTileContextByKey: Record<string, ScenicTileContext> = {};

  for (let y = 0; y < mapArea.height; y += 1) {
    for (let x = 0; x < mapArea.width; x += 1) {
      const tile = mapArea.tiles[y]?.[x];
      if (!tile?.isWalkable) {
        continue;
      }

      const nearest = nearestBuildingForTile({ x, y }, buildings, profilesByBuildingId);
      if (!nearest) {
        continue;
      }

      const distanceToDoor =
        Math.abs(nearest.building.door.x - x) + Math.abs(nearest.building.door.y - y);

      scenicTileContextByKey[positionKey(x, y)] = {
        district: nearest.profile.district,
        lotPattern: nearest.profile.lotPattern,
        nearEntrance: distanceToDoor <= 2,
        distanceToDoor,
        signageStyle: nearest.profile.signageStyle,
        propDensity: nearest.profile.propDensity,
        accentHex: nearest.profile.accentHex,
        glowHex: nearest.profile.glowHex,
      };
    }
  }

  return {
    scenicTileContextByKey,
    preferredLampGrid: resolvePreferredLampGrid(buildings, profilesByBuildingId),
  };
};
