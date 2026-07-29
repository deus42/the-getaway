export interface ContainedBuildingPoint {
  readonly x: number;
  readonly y: number;
}

export interface ContainedBuildingFootprint {
  readonly top: ContainedBuildingPoint;
  readonly right: ContainedBuildingPoint;
  readonly bottom: ContainedBuildingPoint;
  readonly left: ContainedBuildingPoint;
}

interface CenteredBuildingFootprintOptions {
  readonly widthTiles: number;
  readonly depthTiles: number;
  readonly tileWidth: number;
}

interface ContainedBuildingScaleOptions {
  readonly footprint: ContainedBuildingFootprint;
  readonly sourceContainmentWidthPx: number;
  readonly footprintFill: number;
}

interface ProjectContainedBuildingSourcePointOptions extends ContainedBuildingScaleOptions {
  /** Source-space pixel position relative to the measured base center. */
  readonly sourcePoint: ContainedBuildingPoint;
}

const footprintPoints = (
  footprint: ContainedBuildingFootprint
): readonly ContainedBuildingPoint[] => [
  footprint.top,
  footprint.right,
  footprint.bottom,
  footprint.left,
];

export const resolveBuildingFootprintCentroid = (
  footprint: ContainedBuildingFootprint
): ContainedBuildingPoint => {
  const points = footprintPoints(footprint);
  return points.reduce(
    (centroid, point) => ({
      x: centroid.x + point.x / points.length,
      y: centroid.y + point.y / points.length,
    }),
    { x: 0, y: 0 }
  );
};

export const resolveContainedBuildingScale = ({
  footprint,
  sourceContainmentWidthPx,
  footprintFill,
}: ContainedBuildingScaleOptions): number => {
  const widthAxisSpan = Math.abs(footprint.right.x - footprint.top.x) * 2;
  const depthAxisSpan = Math.abs(footprint.left.x - footprint.top.x) * 2;
  return (
    Math.min(widthAxisSpan, depthAxisSpan) *
    footprintFill /
    Math.max(1, sourceContainmentWidthPx)
  );
};

export const createCenteredBuildingFootprint = ({
  widthTiles,
  depthTiles,
  tileWidth,
}: CenteredBuildingFootprintOptions): ContainedBuildingFootprint => {
  const halfTileWidth = tileWidth / 2;
  const halfTileHeight = tileWidth / 4;
  const footprint: ContainedBuildingFootprint = {
    top: { x: 0, y: -halfTileHeight },
    right: {
      x: widthTiles * halfTileWidth,
      y: (widthTiles - 1) * halfTileHeight,
    },
    bottom: {
      x: (widthTiles - depthTiles) * halfTileWidth,
      y: (widthTiles + depthTiles - 1) * halfTileHeight,
    },
    left: {
      x: -depthTiles * halfTileWidth,
      y: (depthTiles - 1) * halfTileHeight,
    },
  };
  const centroid = resolveBuildingFootprintCentroid(footprint);

  return {
    top: { x: footprint.top.x - centroid.x, y: footprint.top.y - centroid.y },
    right: { x: footprint.right.x - centroid.x, y: footprint.right.y - centroid.y },
    bottom: { x: footprint.bottom.x - centroid.x, y: footprint.bottom.y - centroid.y },
    left: { x: footprint.left.x - centroid.x, y: footprint.left.y - centroid.y },
  };
};

export const projectContainedBuildingSourcePoint = ({
  sourcePoint,
  footprint,
  sourceContainmentWidthPx,
  footprintFill,
}: ProjectContainedBuildingSourcePointOptions): ContainedBuildingPoint => {
  const centroid = resolveBuildingFootprintCentroid(footprint);
  const scale = resolveContainedBuildingScale({
    footprint,
    sourceContainmentWidthPx,
    footprintFill,
  });
  return {
    x: centroid.x + sourcePoint.x * scale,
    y: centroid.y + sourcePoint.y * scale,
  };
};

export const isPointInsideConvexFootprint = (
  point: ContainedBuildingPoint,
  footprint: ContainedBuildingFootprint
): boolean => {
  const points = footprintPoints(footprint);
  let orientation = 0;

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const cross =
      (end.x - start.x) * (point.y - start.y) -
      (end.y - start.y) * (point.x - start.x);
    if (Math.abs(cross) <= Number.EPSILON) {
      continue;
    }
    const edgeOrientation = Math.sign(cross);
    if (orientation === 0) {
      orientation = edgeOrientation;
    } else if (edgeOrientation !== orientation) {
      return false;
    }
  }

  return true;
};
