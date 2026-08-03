import type {
  Level0Anchor,
  Level0LayoutContract,
  WorldPolygon,
  WorldPoint,
} from './types';

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

const pointKey = (point: WorldPoint): string => `${point.x}:${point.y}`;

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
  const rounded = { x: Math.round(point.x), y: Math.round(point.y) };
  if (isPointWalkable(contract, rounded)) {
    return rounded;
  }

  for (let radius = 1; radius <= 3; radius += 1) {
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        const candidate = { x: rounded.x + offsetX, y: rounded.y + offsetY };
        if (isPointWalkable(contract, candidate)) {
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
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
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
        !isPointWalkable(contract, next)
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
  const steps = Math.max(1, Math.ceil(distance));
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
    if (!isPointWalkable(contract, entrance.position)) {
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
    if (!isPointWalkable(contract, anchor.position)) {
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
      if (segmentSamples(start, end).some((sample) => !isPointWalkable(contract, sample))) {
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
  });

  const requiredAnchorIds = contract.anchors
    .filter((anchor) => anchor.required)
    .map((anchor) => anchor.id);
  findDisconnectedRequiredAnchors(contract, 'safehouse.spawn', requiredAnchorIds).forEach(
    (anchorId) => errors.push(`required anchor ${anchorId} is disconnected from safehouse.spawn`)
  );

  return [...new Set(errors)];
};
