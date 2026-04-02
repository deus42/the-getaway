import type { MapArea, MapBuildingDefinition, Position } from '../../interfaces/types';
import type { BuildingVisualProfile, VisualTheme } from '../contracts';

export interface ScenicTileContext {
  readonly district: 'downtown' | 'slums';
  readonly lotPattern: BuildingVisualProfile['lotPattern'];
  readonly zoneRole: 'podium' | 'plaza' | 'service_edge' | 'service_yard' | 'market_edge' | 'market_yard';
  readonly nearEntrance: boolean;
  readonly distanceToDoor: number;
  readonly distanceToFootprint: number;
  readonly blockEdgeWeight: number;
  readonly landmarkWeight: number;
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

const isInsideExpandedFootprint = (
  position: Position,
  building: MapBuildingDefinition,
  padding: number
): boolean => {
  return (
    position.x >= building.footprint.from.x - padding &&
    position.x <= building.footprint.to.x + padding &&
    position.y >= building.footprint.from.y - padding &&
    position.y <= building.footprint.to.y + padding
  );
};

const resolveLotPadding = (profile: BuildingVisualProfile): number => {
  if (profile.lotPattern === 'plaza') {
    return profile.district === 'downtown' ? 5 : 4;
  }
  if (profile.lotPattern === 'market') {
    return 4;
  }
  return 3;
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

const resolveZonedBuildingForTile = (
  position: Position,
  buildings: MapBuildingDefinition[],
  profilesByBuildingId: Record<string, BuildingVisualProfile>
): { building: MapBuildingDefinition; profile: BuildingVisualProfile } | null => {
  const zonedCandidates = buildings
    .map((building) => {
      const profile = profilesByBuildingId[building.id];
      if (!profile) {
        return null;
      }

      const padding = resolveLotPadding(profile);
      if (!isInsideExpandedFootprint(position, building, padding)) {
        return null;
      }

      return {
        building,
        profile,
        padding,
        distanceToFootprint: distanceToFootprint(position, building),
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

  if (zonedCandidates.length === 0) {
    return nearestBuildingForTile(position, buildings, profilesByBuildingId);
  }

  zonedCandidates.sort((left, right) => {
    if (left.distanceToFootprint !== right.distanceToFootprint) {
      return left.distanceToFootprint - right.distanceToFootprint;
    }
    return left.padding - right.padding;
  });

  return {
    building: zonedCandidates[0].building,
    profile: zonedCandidates[0].profile,
  };
};

const resolveZoneRole = (
  profile: BuildingVisualProfile,
  distanceFromFootprint: number
): ScenicTileContext['zoneRole'] => {
  if (profile.lotPattern === 'plaza') {
    return distanceFromFootprint <= 1 ? 'podium' : 'plaza';
  }
  if (profile.lotPattern === 'market') {
    return distanceFromFootprint <= 1 ? 'market_edge' : 'market_yard';
  }
  return distanceFromFootprint <= 1 ? 'service_edge' : 'service_yard';
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

      const nearest = resolveZonedBuildingForTile({ x, y }, buildings, profilesByBuildingId);
      if (!nearest) {
        continue;
      }

      const distanceToDoor =
        Math.abs(nearest.building.door.x - x) + Math.abs(nearest.building.door.y - y);
      const distanceFromFootprint = distanceToFootprint({ x, y }, nearest.building);
      const lotPadding = resolveLotPadding(nearest.profile);
      const blockEdgeWeight = Math.max(0, 1 - distanceFromFootprint / (lotPadding + 1));
      const landmarkWeight =
        nearest.building.id === 'block_1_1' ? Math.max(0, 1 - distanceFromFootprint / 6) : 0;

      scenicTileContextByKey[positionKey(x, y)] = {
        district: nearest.profile.district,
        lotPattern: nearest.profile.lotPattern,
        zoneRole: resolveZoneRole(nearest.profile, distanceFromFootprint),
        nearEntrance: distanceToDoor <= 1 && distanceFromFootprint <= 2,
        distanceToDoor,
        distanceToFootprint: distanceFromFootprint,
        blockEdgeWeight,
        landmarkWeight,
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
