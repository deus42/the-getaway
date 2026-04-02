import type { MapArea, MapBuildingDefinition, Position } from '../../interfaces/types';
import type { BuildingVisualProfile, VisualTheme } from '../contracts';

export type ScenicPropKind =
  | 'streetLamp'
  | 'vendingKiosk'
  | 'marketStall'
  | 'barricadeCart'
  | 'cameraMast'
  | 'neonPanel'
  | 'bollardsCluster'
  | 'dumpsterStack'
  | 'doorCanopy'
  | 'puddleTile'
  | 'grateTile'
  | 'utilityPatch';

export type ScenicRenderMode = 'prop' | 'tile';

export interface ScenicPropPlacement {
  readonly id: string;
  readonly kind: ScenicPropKind;
  readonly frame: string;
  readonly renderMode: ScenicRenderMode;
  readonly position: Position;
  readonly tintHex?: string;
  readonly alpha?: number;
  readonly scale?: number;
  readonly origin?: { x: number; y: number };
}

type Vector = { x: number; y: number };

const hash = (value: string): number => {
  let out = 0;
  for (let i = 0; i < value.length; i += 1) {
    out = ((out << 5) - out + value.charCodeAt(i)) >>> 0;
  }
  return out;
};

const positionKey = (position: Position): string => `${position.x}:${position.y}`;

const manhattanDistance = (from: Position, to: Position): number =>
  Math.abs(from.x - to.x) + Math.abs(from.y - to.y);

const isInBounds = (mapArea: MapArea, position: Position): boolean =>
  position.x >= 0 &&
  position.x < mapArea.width &&
  position.y >= 0 &&
  position.y < mapArea.height;

const isWalkablePlacement = (mapArea: MapArea, position: Position): boolean => {
  const tile = mapArea.tiles[position.y]?.[position.x];
  return Boolean(tile?.isWalkable);
};

const isDoorPosition = (buildings: MapBuildingDefinition[], position: Position): boolean =>
  buildings.some((building) => building.door.x === position.x && building.door.y === position.y);

const isInsideFootprint = (building: MapBuildingDefinition, position: Position): boolean =>
  position.x >= building.footprint.from.x &&
  position.x <= building.footprint.to.x &&
  position.y >= building.footprint.from.y &&
  position.y <= building.footprint.to.y;

const addVector = (position: Position, vector: Vector, scale = 1): Position => ({
  x: position.x + vector.x * scale,
  y: position.y + vector.y * scale,
});

const pushUniquePosition = (positions: Position[], position: Position): void => {
  if (!positions.some((candidate) => candidate.x === position.x && candidate.y === position.y)) {
    positions.push(position);
  }
};

const resolveDoorVectors = (building: MapBuildingDefinition): { forward: Vector; lateral: Vector } => {
  const { from, to } = building.footprint;
  if (building.door.x === from.x) {
    return { forward: { x: -1, y: 0 }, lateral: { x: 0, y: 1 } };
  }
  if (building.door.x === to.x) {
    return { forward: { x: 1, y: 0 }, lateral: { x: 0, y: 1 } };
  }
  if (building.door.y === from.y) {
    return { forward: { x: 0, y: -1 }, lateral: { x: 1, y: 0 } };
  }
  return { forward: { x: 0, y: 1 }, lateral: { x: 1, y: 0 } };
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

const edgeBandCandidates = (building: MapBuildingDefinition, spacing = 3): Position[] => {
  const candidates: Position[] = [];
  const fromX = building.footprint.from.x;
  const toX = building.footprint.to.x;
  const fromY = building.footprint.from.y;
  const toY = building.footprint.to.y;

  for (let x = fromX; x <= toX; x += spacing) {
    pushUniquePosition(candidates, { x, y: fromY - 1 });
    pushUniquePosition(candidates, { x, y: toY + 1 });
  }

  pushUniquePosition(candidates, { x: toX, y: fromY - 1 });
  pushUniquePosition(candidates, { x: toX, y: toY + 1 });

  for (let y = fromY; y <= toY; y += spacing) {
    pushUniquePosition(candidates, { x: fromX - 1, y });
    pushUniquePosition(candidates, { x: toX + 1, y });
  }

  pushUniquePosition(candidates, { x: fromX - 1, y: toY });
  pushUniquePosition(candidates, { x: toX + 1, y: toY });

  return candidates;
};

const resolveFrontageCandidates = (building: MapBuildingDefinition): Position[] => {
  const { forward, lateral } = resolveDoorVectors(building);
  const candidates: Position[] = [];

  [1, 2, 3].forEach((depth) => {
    [0, 1, -1, 2, -2, 3, -3].forEach((offset) => {
      pushUniquePosition(
        candidates,
        addVector(addVector(building.door, forward, depth), lateral, offset)
      );
    });
  });

  [2, -2, 3, -3, 4, -4].forEach((offset) => {
    pushUniquePosition(candidates, addVector(building.door, lateral, offset));
  });

  return candidates;
};

const resolveSideCandidates = (building: MapBuildingDefinition): Position[] => {
  const { forward, lateral } = resolveDoorVectors(building);
  const reverseForward = { x: -forward.x, y: -forward.y };
  const candidates = edgeBandCandidates(building, 3).filter(
    (candidate) => manhattanDistance(candidate, building.door) >= 3
  );

  [3, -3, 4, -4, 5, -5].forEach((offset) => {
    pushUniquePosition(candidates, addVector(addVector(building.door, lateral, offset), reverseForward, 1));
    pushUniquePosition(candidates, addVector(addVector(building.door, lateral, offset), forward, 1));
  });

  return candidates;
};

const resolveCornerCandidates = (building: MapBuildingDefinition): Position[] => {
  const candidates: Position[] = [];
  [
    { x: building.footprint.from.x - 1, y: building.footprint.from.y - 1 },
    { x: building.footprint.to.x + 1, y: building.footprint.from.y - 1 },
    { x: building.footprint.from.x - 1, y: building.footprint.to.y + 1 },
    { x: building.footprint.to.x + 1, y: building.footprint.to.y + 1 },
    { x: building.footprint.from.x - 2, y: building.footprint.from.y - 1 },
    { x: building.footprint.to.x + 2, y: building.footprint.from.y - 1 },
    { x: building.footprint.from.x - 2, y: building.footprint.to.y + 1 },
    { x: building.footprint.to.x + 2, y: building.footprint.to.y + 1 },
  ].forEach((candidate) => pushUniquePosition(candidates, candidate));

  return candidates;
};

const isNearDoor = (buildings: MapBuildingDefinition[], position: Position): boolean =>
  buildings.some((building) => {
    return manhattanDistance(building.door, position) <= 1;
  });

const canClusterNearDoor = (kind: ScenicPropKind): boolean =>
  kind === 'bollardsCluster' ||
  kind === 'neonPanel' ||
  kind === 'vendingKiosk' ||
  kind === 'marketStall';

const resolvePlacementSpec = (
  kind: ScenicPropKind,
  profile: BuildingVisualProfile
): Omit<ScenicPropPlacement, 'id' | 'position' | 'kind'> => {
  switch (kind) {
    case 'streetLamp':
      return { frame: 'street_lamp', renderMode: 'prop', scale: profile.district === 'downtown' ? 1.18 : 1.08 };
    case 'vendingKiosk':
      return { frame: 'vending_kiosk', renderMode: 'prop', scale: 1.16 };
    case 'marketStall':
      return { frame: 'market_stall', renderMode: 'prop', scale: 1.2 };
    case 'barricadeCart':
      return { frame: 'barricade_cart', renderMode: 'prop', scale: 1.08 };
    case 'cameraMast':
      return { frame: 'camera_mast', renderMode: 'prop', scale: 1.04 };
    case 'neonPanel':
      return { frame: 'neon_panel', renderMode: 'prop', scale: 1.18, tintHex: profile.signagePrimaryHex };
    case 'bollardsCluster':
      return { frame: 'bollards_cluster', renderMode: 'prop', scale: 1, tintHex: profile.trimHex };
    case 'dumpsterStack':
      return { frame: 'dumpster_stack', renderMode: 'prop', scale: 1.12 };
    case 'doorCanopy':
      return {
        frame: 'door_canopy',
        renderMode: 'prop',
        scale: profile.district === 'downtown' ? 1.14 : 1.06,
        alpha: 0.96,
        origin: { x: 0.5, y: 0.76 },
        tintHex: profile.signagePrimaryHex,
      };
    case 'puddleTile':
      return { frame: 'puddle_tile', renderMode: 'tile', scale: 1.18, alpha: 0.9 };
    case 'grateTile':
      return { frame: 'grate_tile', renderMode: 'tile', scale: 1.06, alpha: 0.88 };
    case 'utilityPatch':
      return {
        frame: 'utility_patch',
        renderMode: 'tile',
        scale: 1.04,
        alpha: 0.92,
        tintHex: profile.district === 'downtown' ? profile.trimHex : profile.accentHex,
      };
  }
};

const placementSequenceForProfile = (profile: BuildingVisualProfile): ScenicPropKind[] => {
  const downtownBase: ScenicPropKind[] = [
    'streetLamp',
    'neonPanel',
    'streetLamp',
    'vendingKiosk',
    'bollardsCluster',
    'cameraMast',
    'grateTile',
    'utilityPatch',
    'puddleTile',
    'neonPanel',
    'bollardsCluster',
  ];

  const slumsLead = profile.lotPattern === 'market' ? 'marketStall' : 'barricadeCart';
  const slumsBase: ScenicPropKind[] = [
    slumsLead,
    'dumpsterStack',
    'streetLamp',
    'neonPanel',
    slumsLead,
    'bollardsCluster',
    'puddleTile',
    'utilityPatch',
    'grateTile',
    'streetLamp',
  ];

  const extras: ScenicPropKind[] = [];
  if (profile.lotPattern === 'plaza') {
    extras.push('streetLamp', 'bollardsCluster', 'neonPanel', 'streetLamp', 'utilityPatch', 'bollardsCluster');
  } else if (profile.lotPattern === 'market') {
    extras.push('marketStall', 'vendingKiosk', 'neonPanel', 'puddleTile');
  } else {
    extras.push('dumpsterStack', 'barricadeCart', 'utilityPatch', 'puddleTile');
  }

  if (profile.propDensity === 'high') {
    extras.push(
      profile.district === 'downtown' ? 'streetLamp' : slumsLead,
      'puddleTile',
      'utilityPatch'
    );
  }

  return profile.district === 'downtown'
    ? [...downtownBase, ...extras]
    : [...slumsBase, ...extras];
};

const resolveCandidatePool = (
  kind: ScenicPropKind,
  building: MapBuildingDefinition
): Position[] => {
  switch (kind) {
    case 'streetLamp':
      return [...resolveCornerCandidates(building), ...resolveFrontageCandidates(building), ...resolveSideCandidates(building)];
    case 'vendingKiosk':
    case 'marketStall':
    case 'neonPanel':
      return [...resolveFrontageCandidates(building), ...resolveSideCandidates(building)];
    case 'cameraMast':
      return [...resolveCornerCandidates(building), ...resolveFrontageCandidates(building)];
    case 'bollardsCluster':
      return [...resolveFrontageCandidates(building), ...resolveSideCandidates(building)];
    case 'dumpsterStack':
    case 'barricadeCart':
      return [...resolveSideCandidates(building), ...resolveCornerCandidates(building)];
    case 'puddleTile':
    case 'grateTile':
    case 'utilityPatch':
      return [...resolveFrontageCandidates(building), ...perimeterCandidates(building)];
    case 'doorCanopy':
      return [building.door];
  }
};

const collectProtectedTiles = (mapArea: MapArea, protectedTiles: Position[]): Set<string> => {
  const reserved = new Set<string>();

  const reserve = (position: Position): void => {
    if (!isInBounds(mapArea, position)) {
      return;
    }
    reserved.add(positionKey(position));
  };

  const ring: Vector[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  protectedTiles.forEach((position) => {
    ring.forEach((vector) => reserve(addVector(position, vector)));
  });

  return reserved;
};

export const scatterScenicProps = (
  mapArea: MapArea,
  buildings: MapBuildingDefinition[],
  profileByBuildingId: Record<string, BuildingVisualProfile>,
  theme: VisualTheme,
  protectedTiles: Position[] = []
): ScenicPropPlacement[] => {
  const occupied = collectProtectedTiles(mapArea, protectedTiles);
  const placements: ScenicPropPlacement[] = [];

  const reserve = (position: Position): void => {
    occupied.add(positionKey(position));
  };

  const isFree = (position: Position): boolean => !occupied.has(positionKey(position));

  const canUseCandidate = (
    building: MapBuildingDefinition,
    kind: ScenicPropKind,
    position: Position
  ): boolean => {
    if (!isInBounds(mapArea, position) || !isWalkablePlacement(mapArea, position)) {
      return false;
    }
    if (kind !== 'doorCanopy' && isInsideFootprint(building, position)) {
      return false;
    }
    if (kind !== 'doorCanopy' && isDoorPosition(buildings, position)) {
      return false;
    }
    if (kind !== 'doorCanopy' && isNearDoor(buildings, position) && !canClusterNearDoor(kind)) {
      return false;
    }
    return isFree(position);
  };

  buildings.forEach((building) => {
    const profile = profileByBuildingId[building.id];
    if (!profile) {
      return;
    }

    const seed = hash(`${building.id}:${profile.facadePattern}:${profile.lotPattern}`);
    const densityBoost = profile.propDensity === 'high' ? 2 : profile.propDensity === 'medium' ? 1 : 0;
    const footprintWidth = building.footprint.to.x - building.footprint.from.x + 1;
    const footprintDepth = building.footprint.to.y - building.footprint.from.y + 1;
    const footprintBoost = Math.min(4, Math.floor(Math.max(footprintWidth, footprintDepth) / 6));
    const lotBoost = profile.lotPattern === 'plaza' ? 2 : profile.lotPattern === 'market' ? 1 : 0;
    const placementCap = Math.max(
      5,
      theme.qualityBudget.maxDecorPropsPerBuilding + densityBoost + footprintBoost + lotBoost
    );

    placements.push({
      id: `${building.id}:door-canopy`,
      kind: 'doorCanopy',
      position: { ...building.door },
      ...resolvePlacementSpec('doorCanopy', profile),
    });

    const sequence = placementSequenceForProfile(profile);
    let placed = 1;

    for (let index = 0; index < sequence.length && placed < placementCap; index += 1) {
      const kind = sequence[index];
      const candidates = resolveCandidatePool(kind, building);
      const spec = resolvePlacementSpec(kind, profile);

      for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
        const candidate = candidates[(candidateIndex + seed + index) % candidates.length];
        if (!candidate || !canUseCandidate(building, kind, candidate)) {
          continue;
        }

        placements.push({
          id: `${building.id}:${kind}:${placed}`,
          kind,
          position: candidate,
          ...spec,
        });
        reserve(candidate);
        placed += 1;
        break;
      }
    }
  });

  return placements;
};
