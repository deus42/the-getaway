import type { Level0BuildingArtEntry } from '../../../content/environment/level0BuildingArtManifest';
import {
  resolveBuildingFootprintCentroid,
  resolveContainedBuildingScale,
  type ContainedBuildingFootprint,
} from './containedBuildingGeometry';

interface PaintedBuildingTransformOptions {
  readonly art: Level0BuildingArtEntry;
  readonly footprint: ContainedBuildingFootprint;
}

export interface PaintedBuildingTransform {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly origin: {
    readonly x: number;
    readonly y: number;
  };
}

/**
 * Places a generated landmark as a contained superstructure on top of the
 * exact runtime footprint plate. Generated source podiums are intentionally
 * not stretched into non-square parcels: doing so bends architectural
 * verticals. Instead a generated per-asset fill keeps the painted base inside
 * the exact parcel, and its measured base center lands on the parcel centroid.
 * BuildingPainter owns the exact four-edge footprint underneath.
 */
export const resolvePaintedBuildingTransform = ({
  art,
  footprint,
}: PaintedBuildingTransformOptions): PaintedBuildingTransform => {
  const scale = resolveContainedBuildingScale({
    footprint,
    sourceContainmentWidthPx: art.footprintFit.sourceContainmentWidthPx,
    footprintFill: art.footprintFit.footprintFill,
  });
  const centroid = resolveBuildingFootprintCentroid(footprint);

  return {
    x: centroid.x,
    y: centroid.y,
    scale,
    origin: art.origin,
  };
};
