import type { MapArea, Position } from '../../interfaces/types';
import type { MapBuildingDefinition } from '../../interfaces/types';
import type { BuildingVisualProfile, VisualTheme } from '../contracts';

export type ScenicPropKind = 'barricade' | 'streetLight' | 'billboard' | 'debris';

export interface ScenicPropPlacement {
  readonly id: string;
  readonly kind: ScenicPropKind;
  readonly position: Position;
  readonly tintHex: string;
}

const hash = (value: string): number => {
  let out = 0;
  for (let i = 0; i < value.length; i += 1) {
    out = ((out << 5) - out + value.charCodeAt(i)) >>> 0;
  }
  return out;
};

const isWalkablePlacement = (mapArea: MapArea, position: Position): boolean => {
  const tile = mapArea.tiles[position.y]?.[position.x];
  if (!tile) {
    return false;
  }

  return tile.isWalkable;
};

const isDoorPosition = (buildings: MapBuildingDefinition[], position: Position): boolean => {
  return buildings.some((building) => building.door.x === position.x && building.door.y === position.y);
};

const perimeterCandidates = (building: MapBuildingDefinition): Position[] => {
  const candidates: Position[] = [];
  const fromX = building.footprint.from.x;
  const toX = building.footprint.to.x;
  const fromY = building.footprint.from.y;
  const toY = building.footprint.to.y;

  for (let x = fromX - 1; x <= toX + 1; x += 1) {
    candidates.push({ x, y: fromY - 1 });
    candidates.push({ x, y: toY + 1 });
  }

  for (let y = fromY; y <= toY; y += 1) {
    candidates.push({ x: fromX - 1, y });
    candidates.push({ x: toX + 1, y });
  }

  return candidates;
};

export const scatterScenicProps = (
  mapArea: MapArea,
  buildings: MapBuildingDefinition[],
  profileByBuildingId: Record<string, BuildingVisualProfile>,
  theme: VisualTheme,
  protectedTiles: Position[] = []
): ScenicPropPlacement[] => {
  const occupied = new Set<string>();
  const placements: ScenicPropPlacement[] = [];

  const reserve = (position: Position): void => {
    occupied.add(`${position.x}:${position.y}`);
  };

  const isFree = (position: Position): boolean => !occupied.has(`${position.x}:${position.y}`);
  const isNearDoor = (position: Position): boolean => {
    return buildings.some((building) => {
      const deltaX = Math.abs(building.door.x - position.x);
      const deltaY = Math.abs(building.door.y - position.y);
      return deltaX + deltaY <= 1;
    });
  };

  protectedTiles.forEach((tile) => reserve(tile));

  buildings.forEach((building) => {
    const profile = profileByBuildingId[building.id];
    if (!profile) {
      return;
    }

    const densityBoost = profile.propDensity === 'high' ? 2 : profile.propDensity === 'medium' ? 1 : 0;
    const target = Math.max(1, theme.qualityBudget.maxDecorPropsPerBuilding - 1 + densityBoost);
    const candidates = perimeterCandidates(building);
    const seed = hash(`${building.id}:${profile.facadePattern}`);

    let placed = 0;
    for (let i = 0; i < candidates.length && placed < target; i += 1) {
      const candidate = candidates[(i + seed) % candidates.length];
      if (!isWalkablePlacement(mapArea, candidate)) {
        continue;
      }
      if (isDoorPosition(buildings, candidate)) {
        continue;
      }
      if (!isFree(candidate)) {
        continue;
      }

      if (isNearDoor(candidate)) {
        continue;
      }

      const districtKindOrder =
        profile.district === 'downtown'
          ? (['streetLight', 'billboard', 'billboard', 'barricade', 'debris'] as ScenicPropKind[])
          : (['barricade', 'debris', 'debris', 'streetLight', 'billboard'] as ScenicPropKind[]);
      const kind = districtKindOrder[(seed + i) % districtKindOrder.length];
      placements.push({
        id: `${building.id}:${placed}`,
        kind,
        position: candidate,
        tintHex: profile.accentHex,
      });
      reserve(candidate);
      placed += 1;

      const clustered = profile.propDensity === 'high' || (profile.propDensity === 'medium' && kind === 'debris');
      if (!clustered || placed >= target) {
        continue;
      }

      const candidateIndex = (i + seed + placed * 3) % candidates.length;
      const clusterCandidate = candidates[candidateIndex];
      if (!clusterCandidate || !isWalkablePlacement(mapArea, clusterCandidate)) {
        continue;
      }
      if (isDoorPosition(buildings, clusterCandidate) || isNearDoor(clusterCandidate) || !isFree(clusterCandidate)) {
        continue;
      }

      placements.push({
        id: `${building.id}:${placed}:cluster`,
        kind: kind === 'streetLight' ? 'billboard' : kind,
        position: clusterCandidate,
        tintHex: profile.glowHex,
      });
      reserve(clusterCandidate);
      placed += 1;
    }
  });

  return placements;
};
