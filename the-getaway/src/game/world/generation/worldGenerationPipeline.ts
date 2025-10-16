import {
  TileType,
  type MapArea,
  type Position,
} from '../../interfaces/types';
import {
  createBasicMapArea,
  isPositionInBounds,
} from '../grid';
import type {
  GeneratedSceneDefinition,
  NarrativeEntityReference,
  NarrativeTriple,
  SceneMoment,
  ScenePropPlacement,
} from '../../narrative/tripleTypes';
import {
  computePlacementFromRelation,
  isTileAvailableForPlacement,
} from './relationRules';

export type ScenePipelineIssueSeverity = 'info' | 'warning' | 'error';

export interface ScenePipelineIssue {
  readonly severity: ScenePipelineIssueSeverity;
  readonly message: string;
  readonly tripleId?: string;
  readonly entityKey?: string;
}

export interface SceneGenerationResult {
  readonly mapArea: MapArea;
  readonly placements: ScenePropPlacement[];
  readonly issues: ScenePipelineIssue[];
}

export interface SceneInstantiationOptions {
  readonly defaultTileType?: TileType;
  readonly defaultDepthScale?: number;
}

const MAX_SEARCH_RADIUS = 6;

const serializePosition = (position: Position): string =>
  `${position.x}:${position.y}`;

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

const getEntityReferenceKey = (reference: NarrativeEntityReference): string =>
  reference.resourceKey ?? `props.${slugify(reference.label)}`;

const resolvePreferredPosition = (
  anchor: Position,
  reference: NarrativeEntityReference
): Position | null => {
  const hint = reference.spatialHint;

  if (!hint) {
    return null;
  }

  if (hint.preferredPosition) {
    return { ...hint.preferredPosition };
  }

  if (hint.offsetFromAnchor) {
    return {
      x: anchor.x + hint.offsetFromAnchor.x,
      y: anchor.y + hint.offsetFromAnchor.y,
    };
  }

  if (hint.areaBounds) {
    return {
      x: hint.areaBounds.from.x,
      y: hint.areaBounds.from.y,
    };
  }

  return null;
};

const searchForAvailablePosition = (
  mapArea: MapArea,
  occupiedPositions: Set<string>,
  start: Position,
  maxRadius = MAX_SEARCH_RADIUS
): Position | null => {
  if (
    isPositionInBounds(start, mapArea) &&
    isTileAvailableForPlacement(start, mapArea, occupiedPositions)
  ) {
    return start;
  }

  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const candidate: Position = {
          x: start.x + dx,
          y: start.y + dy,
        };

        if (
          isPositionInBounds(candidate, mapArea) &&
          isTileAvailableForPlacement(candidate, mapArea, occupiedPositions)
        ) {
          return candidate;
        }
      }
    }
  }

  return null;
};

const applyPlacementToTile = (
  mapArea: MapArea,
  placement: ScenePropPlacement
): void => {
  const { x, y } = placement.position;
  const tile = mapArea.tiles[y]?.[x];

  if (!tile) {
    return;
  }

  if (placement.tags?.includes('blocking')) {
    tile.isWalkable = false;
    tile.provideCover = false;
    tile.type = TileType.WALL;
  } else if (placement.tags?.includes('cover')) {
    tile.provideCover = true;
    tile.isWalkable = true;
    tile.type = TileType.COVER;
  }
};

const registerPlacement = (
  placement: ScenePropPlacement,
  occupiedPositions: Set<string>,
  placementIndex: Map<string, ScenePropPlacement>,
  placements: ScenePropPlacement[]
): void => {
  placements.push(placement);
  occupiedPositions.add(serializePosition(placement.position));

  placementIndex.set(placement.resourceKey, placement);
};

const ensureEntityPlacement = ({
  reference,
  originTripleId,
  mapArea,
  occupiedPositions,
  placementIndex,
  placements,
  defaultDepthScale,
  anchorFallback,
}: {
  reference: NarrativeEntityReference;
  originTripleId: string;
  mapArea: MapArea;
  occupiedPositions: Set<string>;
  placementIndex: Map<string, ScenePropPlacement>;
  placements: ScenePropPlacement[];
  defaultDepthScale: number;
  anchorFallback: Position;
}): ScenePropPlacement | null => {
  const key = getEntityReferenceKey(reference);
  const existing = placementIndex.get(key);

  if (existing) {
    return existing;
  }

  const preferred = resolvePreferredPosition(anchorFallback, reference);
  const startingPoint =
    preferred ?? reference.spatialHint?.preferredPosition ?? anchorFallback;

  const resolved = searchForAvailablePosition(
    mapArea,
    occupiedPositions,
    startingPoint
  );

  if (!resolved) {
    return null;
  }

  const placement: ScenePropPlacement = {
    resourceKey: key,
    originTripleId,
    position: resolved,
    depth: resolved.y * defaultDepthScale + resolved.x,
    relationApplied: 'on',
    tags: reference.tags,
    metadata: { anchor: true },
  };

  registerPlacement(placement, occupiedPositions, placementIndex, placements);
  applyPlacementToTile(mapArea, placement);

  return placement;
};

const processTriple = ({
  triple,
  mapArea,
  occupiedPositions,
  placementIndex,
  placements,
  defaultDepthScale,
  issues,
}: {
  triple: NarrativeTriple;
  mapArea: MapArea;
  occupiedPositions: Set<string>;
  placementIndex: Map<string, ScenePropPlacement>;
  placements: ScenePropPlacement[];
  defaultDepthScale: number;
  issues: ScenePipelineIssue[];
}): void => {
  const anchorFallback: Position = {
    x: Math.floor(mapArea.width / 2),
    y: Math.floor(mapArea.height / 2),
  };

  const anchorPlacement = ensureEntityPlacement({
    reference: triple.object,
    originTripleId: `anchor::${triple.id}`,
    mapArea,
    occupiedPositions,
    placementIndex,
    placements,
    defaultDepthScale,
    anchorFallback,
  });

  if (!anchorPlacement) {
    issues.push({
      severity: 'warning',
      message: `Unable to resolve anchor placement for object "${triple.object.label}"`,
      tripleId: triple.id,
      entityKey: getEntityReferenceKey(triple.object),
    });
    return;
  }

  const placement = computePlacementFromRelation({
    mapArea,
    triple,
    anchorPosition: anchorPlacement.position,
    occupiedPositions,
    defaultDepthScale,
  });

  if (!placement) {
    issues.push({
      severity: 'warning',
      message: `Failed to resolve placement for subject "${triple.subject.label}" with relation "${triple.relation}"`,
      tripleId: triple.id,
      entityKey: getEntityReferenceKey(triple.subject),
    });
    return;
  }

  const placementKey = getEntityReferenceKey(triple.subject);

  if (!placement.resourceKey) {
    placement.resourceKey = placementKey;
  }

  placement.depth =
    placement.position.y * defaultDepthScale + placement.position.x;

  registerPlacement(placement, occupiedPositions, placementIndex, placements);
  applyPlacementToTile(mapArea, placement);
};

const seedManualPlacements = (
  mapArea: MapArea,
  manualPlacements: ScenePropPlacement[],
  occupiedPositions: Set<string>,
  placementIndex: Map<string, ScenePropPlacement>,
  computedPlacements: ScenePropPlacement[],
  issues: ScenePipelineIssue[]
): void => {
  for (const placement of manualPlacements) {
    if (
      !isPositionInBounds(placement.position, mapArea) ||
      !isTileAvailableForPlacement(
        placement.position,
        mapArea,
        occupiedPositions
      )
    ) {
      issues.push({
        severity: 'warning',
        message: `Manual placement "${placement.resourceKey}" collides with an existing tile`,
        tripleId: placement.originTripleId,
        entityKey: placement.resourceKey,
      });
      continue;
    }

    registerPlacement(
      placement,
      occupiedPositions,
      placementIndex,
      computedPlacements
    );
    applyPlacementToTile(mapArea, placement);
  }
};

const sortMoments = (moments: SceneMoment[]): SceneMoment[] =>
  [...moments].sort((lhs, rhs) => {
    if (lhs.order !== rhs.order) {
      return lhs.order - rhs.order;
    }

    return (lhs.priority ?? 0) - (rhs.priority ?? 0);
  });

const sortTriples = (triples: NarrativeTriple[]): NarrativeTriple[] =>
  [...triples].sort(
    (lhs, rhs) => (lhs.priority ?? 0) - (rhs.priority ?? 0)
  );

export const generateSceneMap = (
  definition: GeneratedSceneDefinition,
  options: SceneInstantiationOptions = {}
): SceneGenerationResult => {
  const defaultTileType = options.defaultTileType ?? TileType.FLOOR;
  const defaultDepthScale = options.defaultDepthScale ?? definition.width;
  const issues: ScenePipelineIssue[] = [];

  const mapArea = createBasicMapArea(definition.resourceKey, definition.width, definition.height, {
    level: 0,
    zoneId: definition.levelKey,
    objectives: [],
    summary: definition.metadata?.summary as string | undefined,
  });

  for (let y = 0; y < mapArea.height; y += 1) {
    for (let x = 0; x < mapArea.width; x += 1) {
      const tile = mapArea.tiles[y][x];

      if (tile.type === TileType.FLOOR) {
        tile.type = defaultTileType;
      }
    }
  }

  const occupiedPositions = new Set<string>();
  const placementIndex = new Map<string, ScenePropPlacement>();
  const computedPlacements: ScenePropPlacement[] = [];

  if (definition.placements.length > 0) {
    seedManualPlacements(
      mapArea,
      definition.placements,
      occupiedPositions,
      placementIndex,
      computedPlacements,
      issues
    );
  }

  const orderedMoments = sortMoments(definition.moments);

  orderedMoments.forEach((moment) => {
    const orderedTriples = sortTriples(moment.triples);

    orderedTriples.forEach((triple) => {
      processTriple({
        triple,
        mapArea,
        occupiedPositions,
        placementIndex,
        placements: computedPlacements,
        defaultDepthScale,
        issues,
      });
    });
  });

  const mergedPlacements: ScenePropPlacement[] = [
    ...placementIndex.values(),
  ].sort((lhs, rhs) => lhs.depth - rhs.depth);

  return {
    mapArea,
    placements: mergedPlacements,
    issues,
  };
};

export const materialiseSceneDefinition = (
  baseDefinition: GeneratedSceneDefinition,
  options: SceneInstantiationOptions = {}
): GeneratedSceneDefinition => {
  const result = generateSceneMap(baseDefinition, options);

  return {
    ...baseDefinition,
    placements: result.placements,
    metadata: {
      ...baseDefinition.metadata,
      pipelineIssues: result.issues,
      generatedAt: new Date().toISOString(),
    },
  };
};
