import type {
  Level0Anchor,
  Level0LayoutContract,
  WorldPolygon,
  WorldPoint,
} from './types';
import {
  LEVEL0_PLAYER_CLEARANCE_RADIUS,
  LEVEL0_REACHABILITY_SAMPLE_STEP,
} from './constants';

const EPSILON = 0.0001;

const pointOnSegment = (point: WorldPoint, start: WorldPoint, end: WorldPoint): boolean => {
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);
  if (Math.abs(cross) > EPSILON) {
    return false;
  }

  const dot =
    (point.x - start.x) * (end.x - start.x) +
    (point.y - start.y) * (end.y - start.y);
  if (dot < -EPSILON) {
    return false;
  }

  const squaredLength = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  return dot <= squaredLength + EPSILON;
};

export const isPointInPolygon = (point: WorldPoint, polygon: WorldPolygon): boolean => {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let currentIndex = 0, previousIndex = polygon.length - 1;
    currentIndex < polygon.length;
    previousIndex = currentIndex, currentIndex += 1) {
    const current = polygon[currentIndex]!;
    const previous = polygon[previousIndex]!;

    if (pointOnSegment(point, previous, current)) {
      return true;
    }

    const crosses =
      (current.y > point.y) !== (previous.y > point.y) &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x;
    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
};

export const isPointWalkable = (
  contract: Level0LayoutContract,
  point: WorldPoint
): boolean => {
  if (!isPointInPolygon(point, contract.bounds)) {
    return false;
  }

  const onWalkableSurface = contract.surfaces.some(
    (surface) => surface.walkable && isPointInPolygon(point, surface.polygon)
  );
  if (!onWalkableSurface) {
    return false;
  }

  const insideBlockedSurface = contract.surfaces.some(
    (surface) => !surface.walkable && isPointInPolygon(point, surface.polygon)
  );
  if (insideBlockedSurface) {
    return false;
  }

  return !contract.buildingFootprints.some((footprint) =>
    isPointInPolygon(point, footprint.polygon)
  );
};

export const isPointWalkableWithClearance = (
  contract: Level0LayoutContract,
  center: WorldPoint,
  radius = LEVEL0_PLAYER_CLEARANCE_RADIUS
): boolean => {
  const clampedRadius = Math.max(0, radius);
  const diagonal = clampedRadius * Math.SQRT1_2;
  return [
    center,
    { x: center.x + clampedRadius, y: center.y },
    { x: center.x - clampedRadius, y: center.y },
    { x: center.x, y: center.y + clampedRadius },
    { x: center.x, y: center.y - clampedRadius },
    { x: center.x + diagonal, y: center.y + diagonal },
    { x: center.x + diagonal, y: center.y - diagonal },
    { x: center.x - diagonal, y: center.y + diagonal },
    { x: center.x - diagonal, y: center.y - diagonal },
  ].every((sample) => isPointWalkable(contract, sample));
};

const pointKey = (point: WorldPoint): string => `${point.x.toFixed(4)}:${point.y.toFixed(4)}`;

const getPolygonExtents = (polygon: WorldPolygon) => {
  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);
  return {
    minX: Math.floor(Math.min(...xs)),
    maxX: Math.ceil(Math.max(...xs)),
    minY: Math.floor(Math.min(...ys)),
    maxY: Math.ceil(Math.max(...ys)),
  };
};

const findAnchor = (
  contract: Level0LayoutContract,
  anchorId: string
): Level0Anchor | undefined => contract.anchors.find((anchor) => anchor.id === anchorId);

const nearestWalkableCell = (
  contract: Level0LayoutContract,
  point: WorldPoint
): WorldPoint | null => {
  const step = LEVEL0_REACHABILITY_SAMPLE_STEP;
  const rounded = {
    x: Math.round(point.x / step) * step,
    y: Math.round(point.y / step) * step,
  };
  if (isPointWalkableWithClearance(contract, rounded)) {
    return rounded;
  }

  for (let radius = 1; radius <= 12; radius += 1) {
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        const candidate = {
          x: rounded.x + offsetX * step,
          y: rounded.y + offsetY * step,
        };
        if (isPointWalkableWithClearance(contract, candidate)) {
          return candidate;
        }
      }
    }
  }

  return null;
};

export const findDisconnectedRequiredAnchors = (
  contract: Level0LayoutContract,
  startAnchorId: string,
  requiredAnchorIds: readonly string[]
): string[] => {
  const startAnchor = findAnchor(contract, startAnchorId);
  const start = startAnchor ? nearestWalkableCell(contract, startAnchor.position) : null;
  if (!start) {
    return [...requiredAnchorIds];
  }

  const bounds = getPolygonExtents(contract.bounds);
  const queue: WorldPoint[] = [start];
  const visited = new Set<string>([pointKey(start)]);
  const directions = [
    { x: LEVEL0_REACHABILITY_SAMPLE_STEP, y: 0 },
    { x: -LEVEL0_REACHABILITY_SAMPLE_STEP, y: 0 },
    { x: 0, y: LEVEL0_REACHABILITY_SAMPLE_STEP },
    { x: 0, y: -LEVEL0_REACHABILITY_SAMPLE_STEP },
  ];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    directions.forEach((direction) => {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      if (
        next.x < bounds.minX ||
        next.x > bounds.maxX ||
        next.y < bounds.minY ||
        next.y > bounds.maxY ||
        visited.has(pointKey(next)) ||
        !isPointWalkableWithClearance(contract, next)
      ) {
        return;
      }

      visited.add(pointKey(next));
      queue.push(next);
    });
  }

  return requiredAnchorIds.filter((anchorId) => {
    const anchor = findAnchor(contract, anchorId);
    const cell = anchor ? nearestWalkableCell(contract, anchor.position) : null;
    return !cell || !visited.has(pointKey(cell));
  });
};

const duplicateIds = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  ids.forEach((id) => {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  });
  return [...duplicates];
};

const polygonsMatch = (left: WorldPolygon, right: WorldPolygon): boolean =>
  left.length === right.length && left.every((point, index) => {
    const candidate = right[index];
    return candidate !== undefined &&
      Math.abs(point.x - candidate.x) <= EPSILON &&
      Math.abs(point.y - candidate.y) <= EPSILON;
  });

const axisAlignedRectangleBounds = (
  polygon: WorldPolygon
): { minX: number; maxX: number; minY: number; maxY: number } | null => {
  if (polygon.length !== 4) return null;
  const xs = [...new Set(polygon.map((point) => point.x))];
  const ys = [...new Set(polygon.map((point) => point.y))];
  if (xs.length !== 2 || ys.length !== 2) return null;
  const corners = new Set(polygon.map((point) => `${point.x}:${point.y}`));
  if (!xs.every((x) => ys.every((y) => corners.has(`${x}:${y}`)))) return null;
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const pointOnPolygonBoundary = (point: WorldPoint, polygon: WorldPolygon): boolean =>
  polygon.some((start, index) => pointOnSegment(point, start, polygon[(index + 1) % polygon.length]!));

const pointStrictlyInsidePolygon = (point: WorldPoint, polygon: WorldPolygon): boolean =>
  isPointInPolygon(point, polygon) && !pointOnPolygonBoundary(point, polygon);

const orientation = (start: WorldPoint, end: WorldPoint, point: WorldPoint): number =>
  (end.x - start.x) * (point.y - start.y) -
  (end.y - start.y) * (point.x - start.x);

const segmentsProperlyIntersect = (
  leftStart: WorldPoint,
  leftEnd: WorldPoint,
  rightStart: WorldPoint,
  rightEnd: WorldPoint
): boolean => {
  const leftToRightStart = orientation(leftStart, leftEnd, rightStart);
  const leftToRightEnd = orientation(leftStart, leftEnd, rightEnd);
  const rightToLeftStart = orientation(rightStart, rightEnd, leftStart);
  const rightToLeftEnd = orientation(rightStart, rightEnd, leftEnd);
  return (
    leftToRightStart * leftToRightEnd < -EPSILON &&
    rightToLeftStart * rightToLeftEnd < -EPSILON
  );
};

const polygonArea = (polygon: WorldPolygon): number =>
  Math.abs(
    polygon.reduce((sum, point, index) => {
      const next = polygon[(index + 1) % polygon.length]!;
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2
  );

const polygonsOverlapWithArea = (left: WorldPolygon, right: WorldPolygon): boolean => {
  if (left.length < 3 || right.length < 3 || polygonArea(left) <= EPSILON || polygonArea(right) <= EPSILON) {
    return false;
  }

  const properIntersection = left.some((leftStart, leftIndex) => {
    const leftEnd = left[(leftIndex + 1) % left.length]!;
    return right.some((rightStart, rightIndex) =>
      segmentsProperlyIntersect(
        leftStart,
        leftEnd,
        rightStart,
        right[(rightIndex + 1) % right.length]!
      )
    );
  });
  if (properIntersection) return true;

  const leftBounds = axisAlignedRectangleBounds(left);
  const rightBounds = axisAlignedRectangleBounds(right);
  if (leftBounds && rightBounds) {
    const overlapX = Math.min(leftBounds.maxX, rightBounds.maxX) -
      Math.max(leftBounds.minX, rightBounds.minX);
    const overlapY = Math.min(leftBounds.maxY, rightBounds.maxY) -
      Math.max(leftBounds.minY, rightBounds.minY);
    return overlapX > EPSILON && overlapY > EPSILON;
  }

  const pointsAndEdgeMidpoints = (polygon: WorldPolygon): WorldPoint[] =>
    polygon.flatMap((point, index) => {
      const next = polygon[(index + 1) % polygon.length]!;
      return [point, { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 }];
    });

  if (
    pointsAndEdgeMidpoints(left).some((point) => pointStrictlyInsidePolygon(point, right)) ||
    pointsAndEdgeMidpoints(right).some((point) => pointStrictlyInsidePolygon(point, left))
  ) {
    return true;
  }

  return (
    left.every((point) => pointOnPolygonBoundary(point, right)) ||
    right.every((point) => pointOnPolygonBoundary(point, left))
  );
};

const loopsInterlock = (contract: Level0LayoutContract): boolean => {
  if (contract.traversalLoops.length === 0) return false;
  const pointSets = contract.traversalLoops.map(
    (loop) => new Set(loop.points.map(pointKey))
  );
  const connected = new Set<number>([0]);
  let changed = true;
  while (changed) {
    changed = false;
    pointSets.forEach((candidate, candidateIndex) => {
      if (connected.has(candidateIndex)) return;
      const sharesJunction = [...connected].some((connectedIndex) =>
        [...candidate].some((key) => pointSets[connectedIndex]!.has(key))
      );
      if (sharesJunction) {
        connected.add(candidateIndex);
        changed = true;
      }
    });
  }
  return connected.size === contract.traversalLoops.length;
};

const segmentSamples = (start: WorldPoint, end: WorldPoint): WorldPoint[] => {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const steps = Math.max(1, Math.ceil(distance / LEVEL0_REACHABILITY_SAMPLE_STEP));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const ratio = index / steps;
    return {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
    };
  });
};

export const validateLevel0LayoutContract = (
  contract: Level0LayoutContract
): string[] => {
  const errors: string[] = [];

  if (!contract.id || contract.schemaVersion < 1) {
    errors.push('layout identity and schema version are required');
  }
  if (
    contract.projection.tileWidth !== 64 ||
    contract.projection.tileHeight !== 32 ||
    contract.projection.orientation !== 'isometric-2:1'
  ) {
    errors.push('projection must remain 64x32 isometric-2:1');
  }
  if (contract.bounds.length < 3) {
    errors.push('district bounds require a polygon');
  }
  if (contract.traversalLoops.length !== 3) {
    errors.push('exactly three traversal loops are required');
  }

  const collections = [
    ['zone', contract.zones.map((value) => value.id)],
    ['loop', contract.traversalLoops.map((value) => value.id)],
    ['surface', contract.surfaces.map((value) => value.id)],
    ['building', contract.buildingFootprints.map((value) => value.id)],
    ['entrance', contract.entrances.map((value) => value.id)],
    ['drone-region', contract.droneRegions.map((value) => value.id)],
    ['anchor', contract.anchors.map((value) => value.id)],
  ] as const;
  collections.forEach(([label, ids]) => {
    duplicateIds([...ids]).forEach((id) => errors.push(`duplicate ${label} id: ${id}`));
  });

  const buildingIds = new Set(contract.buildingFootprints.map((building) => building.id));
  contract.entrances.forEach((entrance) => {
    if (!buildingIds.has(entrance.buildingId)) {
      errors.push(`entrance ${entrance.id} references missing building ${entrance.buildingId}`);
    }
    if (!isPointWalkableWithClearance(contract, entrance.position)) {
      errors.push(`entrance ${entrance.id} is not on walkable geometry`);
    }
    const entranceAnchor = findAnchor(contract, entrance.id);
    if (!entranceAnchor || entranceAnchor.kind !== 'entrance') {
      errors.push(`entrance ${entrance.id} requires a matching entrance anchor`);
    } else {
      if (entranceAnchor.ownerId !== entrance.buildingId) {
        errors.push(`entrance ${entrance.id} anchor owner does not match building metadata`);
      }
      if (
        Math.abs(entranceAnchor.position.x - entrance.position.x) > EPSILON ||
        Math.abs(entranceAnchor.position.y - entrance.position.y) > EPSILON
      ) {
        errors.push(`entrance ${entrance.id} anchor position does not match entrance metadata`);
      }
    }
  });

  if (!contract.surfaces.some((surface) => surface.kind === 'sidewalk')) {
    errors.push('at least one sidewalk surface is required');
  }
  if (!contract.surfaces.some((surface) => surface.kind === 'crossing')) {
    errors.push('at least one crossing surface is required');
  }

  if (contract.droneRegions.length === 0) {
    errors.push('at least one drone verification region is required');
  }
  contract.droneRegions.forEach((region) => {
    const launch = findAnchor(contract, region.launchAnchorId);
    if (!launch || launch.kind !== 'drone-launch') {
      errors.push(`drone region ${region.id} requires a matching launch anchor`);
    } else if (!isPointInPolygon(launch.position, region.polygon)) {
      errors.push(`drone region ${region.id} does not contain its launch anchor`);
    }
  });

  contract.anchors.filter((anchor) => anchor.required).forEach((anchor) => {
    if (!isPointWalkableWithClearance(contract, anchor.position)) {
      errors.push(`required anchor ${anchor.id} is not on walkable geometry`);
    }
  });

  contract.traversalLoops.forEach((loop) => {
    if (!loop.closed || loop.points.length < 4) {
      errors.push(`loop ${loop.id} must be closed and contain at least four points`);
      return;
    }
    const first = loop.points[0]!;
    const last = loop.points[loop.points.length - 1]!;
    if (pointKey(first) !== pointKey(last)) {
      errors.push(`loop ${loop.id} must repeat its first point at the end`);
    }
    loop.points.slice(1).forEach((end, index) => {
      const start = loop.points[index]!;
      if (segmentSamples(start, end).some((sample) => !isPointWalkableWithClearance(contract, sample))) {
        errors.push(`loop ${loop.id} crosses blocked geometry`);
      }
    });
  });
  if (!loopsInterlock(contract)) {
    errors.push('traversal loops must interlock');
  }

  if (contract.semanticMaskIds.length === 0 || duplicateIds(contract.semanticMaskIds).length > 0) {
    errors.push('semantic mask IDs must be present and unique');
  }
  if (contract.artLayerIds.length === 0 || duplicateIds(contract.artLayerIds).length > 0) {
    errors.push('art layer IDs must be present and unique');
  }
  if (contract.occluders.length !== contract.buildingFootprints.length) {
    errors.push('every building footprint must provide one occluder polygon');
  }
  contract.buildingFootprints.forEach((footprint, index) => {
    const occluder = contract.occluders[index];
    if (!occluder || !polygonsMatch(occluder, footprint.polygon)) {
      errors.push(`occluder ${index} does not match building footprint ${footprint.id}`);
    }
    if (footprint.polygon.some((point) => !isPointInPolygon(point, contract.bounds))) {
      errors.push(`building footprint ${footprint.id} leaves district bounds`);
    }
    contract.buildingFootprints.slice(index + 1).forEach((candidate) => {
      if (polygonsOverlapWithArea(footprint.polygon, candidate.polygon)) {
        errors.push(`building footprints ${footprint.id} and ${candidate.id} overlap`);
      }
    });
  });

  const requiredAnchorIds = contract.anchors
    .filter((anchor) => anchor.required)
    .map((anchor) => anchor.id);
  findDisconnectedRequiredAnchors(contract, 'safehouse.spawn', requiredAnchorIds).forEach(
    (anchorId) => errors.push(`required anchor ${anchorId} is disconnected from safehouse.spawn`)
  );

  return [...new Set(errors)];
};
