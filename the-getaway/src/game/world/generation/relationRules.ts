import type { MapArea, Position } from '../../interfaces/types';
import {
  findNearestWalkablePosition,
  getAdjacentWalkablePositions,
  isPositionInBounds,
} from '../grid';
import type {
  NarrativeRelation,
  NarrativeTriple,
  ScenePropPlacement,
  SpatialHint,
} from '../../narrative/tripleTypes';

interface RelationRuleContext {
  readonly mapArea: MapArea;
  readonly triple: NarrativeTriple;
  readonly anchorPosition: Position;
  readonly occupiedPositions: Set<string>;
}

type RelationRule = (context: RelationRuleContext) => Position | null;

export interface PlacementComputationInput {
  readonly mapArea: MapArea;
  readonly triple: NarrativeTriple;
  readonly anchorPosition: Position;
  readonly occupiedPositions: Set<string>;
  readonly defaultDepthScale: number;
}

const serializePosition = (position: Position): string =>
  `${position.x}:${position.y}`;

const isTileVacant = (
  position: Position,
  mapArea: MapArea,
  occupiedPositions: Set<string>
): boolean => {
  if (!isPositionInBounds(position, mapArea)) {
    return false;
  }

  const tile = mapArea.tiles[position.y]?.[position.x];

  if (!tile) {
    return false;
  }

  if (!tile.isWalkable) {
    return false;
  }

  return !occupiedPositions.has(serializePosition(position));
};

const applySpatialHint = (
  hint: SpatialHint | undefined,
  anchorPosition: Position
): Position | null => {
  if (!hint) {
    return null;
  }

  if (hint.preferredPosition) {
    return { ...hint.preferredPosition };
  }

  if (hint.offsetFromAnchor) {
    return {
      x: anchorPosition.x + hint.offsetFromAnchor.x,
      y: anchorPosition.y + hint.offsetFromAnchor.y,
    };
  }

  return null;
};

const expandSearch = (
  anchor: Position,
  mapArea: MapArea,
  occupiedPositions: Set<string>,
  maxRadius = 4
): Position | null => {
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const candidate: Position = {
          x: anchor.x + dx,
          y: anchor.y + dy,
        };

        if (isTileVacant(candidate, mapArea, occupiedPositions)) {
          return candidate;
        }
      }
    }
  }

  return null;
};

const ruleOn: RelationRule = ({
  anchorPosition,
  mapArea,
  occupiedPositions,
}) => {
  if (isTileVacant(anchorPosition, mapArea, occupiedPositions)) {
    return anchorPosition;
  }

  return expandSearch(anchorPosition, mapArea, occupiedPositions);
};

const ruleNear: RelationRule = ({
  anchorPosition,
  mapArea,
  occupiedPositions,
}) => {
  const adjacent = getAdjacentWalkablePositions(anchorPosition, mapArea);

  for (const option of adjacent) {
    if (isTileVacant(option, mapArea, occupiedPositions)) {
      return option;
    }
  }

  return expandSearch(anchorPosition, mapArea, occupiedPositions);
};

const createDirectionalRule = (delta: Position): RelationRule => ({
  anchorPosition,
  mapArea,
  occupiedPositions,
}) => {
  const candidate: Position = {
    x: anchorPosition.x + delta.x,
    y: anchorPosition.y + delta.y,
  };

  if (isTileVacant(candidate, mapArea, occupiedPositions)) {
    return candidate;
  }

  return expandSearch(anchorPosition, mapArea, occupiedPositions);
};

const ruleInside: RelationRule = ({
  anchorPosition,
  mapArea,
  occupiedPositions,
}) => {
  const candidate = findNearestWalkablePosition(anchorPosition, mapArea);

  if (candidate && isTileVacant(candidate, mapArea, occupiedPositions)) {
    return candidate;
  }

  return expandSearch(anchorPosition, mapArea, occupiedPositions);
};

const ruleAdjacent: RelationRule = ({
  anchorPosition,
  mapArea,
  occupiedPositions,
}) => {
  const options = getAdjacentWalkablePositions(anchorPosition, mapArea);

  for (const option of options) {
    if (isTileVacant(option, mapArea, occupiedPositions)) {
      return option;
    }
  }

  return expandSearch(anchorPosition, mapArea, occupiedPositions);
};

const relationImplementations: Record<NarrativeRelation, RelationRule> = {
  on: ruleOn,
  near: ruleNear,
  inside: ruleInside,
  left_of: createDirectionalRule({ x: -1, y: 0 }),
  right_of: createDirectionalRule({ x: 1, y: 0 }),
  above: createDirectionalRule({ x: 0, y: -1 }),
  below: createDirectionalRule({ x: 0, y: 1 }),
  adjacent_to: ruleAdjacent,
  behind: createDirectionalRule({ x: 0, y: 1 }),
  in_front_of: createDirectionalRule({ x: 0, y: -1 }),
};

export const computePlacementFromRelation = (
  input: PlacementComputationInput
): ScenePropPlacement | null => {
  const { mapArea, triple, anchorPosition, occupiedPositions } = input;

  const subjectHint = triple.subject.spatialHint;
  const hintedPosition = applySpatialHint(subjectHint, anchorPosition);

  if (
    hintedPosition &&
    isTileVacant(hintedPosition, mapArea, occupiedPositions)
  ) {
    return {
      resourceKey:
        triple.subject.resourceKey ?? `props.generated.${triple.id}`,
      originTripleId: triple.id,
      position: hintedPosition,
      depth:
        hintedPosition.y * input.defaultDepthScale +
        hintedPosition.x,
      relationApplied: triple.relation,
      tags: triple.subject.tags,
    };
  }

  const rule = relationImplementations[triple.relation] ?? ruleNear;
  const resolved = rule({
    mapArea,
    triple,
    anchorPosition,
    occupiedPositions,
  });

  if (!resolved) {
    return null;
  }

  return {
    resourceKey:
      triple.subject.resourceKey ?? `props.generated.${triple.id}`,
    originTripleId: triple.id,
    position: resolved,
    depth: resolved.y * input.defaultDepthScale + resolved.x,
    relationApplied: triple.relation,
    tags: triple.subject.tags,
  };
};

export const isTileAvailableForPlacement = (
  position: Position,
  mapArea: MapArea,
  occupiedPositions: Set<string>
): boolean => isTileVacant(position, mapArea, occupiedPositions);
