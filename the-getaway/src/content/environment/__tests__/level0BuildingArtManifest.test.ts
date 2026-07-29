import {
  LEVEL0_BUILDING_ART_MANIFEST,
  LEVEL0_BUILDING_IDS,
  resolveLevel0BuildingArt,
} from '../level0BuildingArtManifest';
import buildingArtMetrics from '../level0BuildingArtMetrics.json';
import { getLevel0Content } from '../../levels/level0';

const TILE_WIDTH = 64;

describe('level0BuildingArtManifest', () => {
  it('defines one entry per building id', () => {
    expect(LEVEL0_BUILDING_ART_MANIFEST).toHaveLength(LEVEL0_BUILDING_IDS.length);
    LEVEL0_BUILDING_IDS.forEach((id) => {
      expect(resolveLevel0BuildingArt(id)?.buildingId).toBe(id);
    });
  });

  it('derives origin and fit from generated art metrics', () => {
    LEVEL0_BUILDING_ART_MANIFEST.forEach((entry) => {
      const metrics = (
        buildingArtMetrics as Record<
          string,
          {
            width: number;
            height: number;
            basePlate: {
              cornerY: number;
              leftX: number;
              rightX: number;
            widthPx: number;
            containedFootprintFill: number;
            sourceFootprint: { widthTiles: number; depthTiles: number };
            };
          }
        >
      )[entry.buildingId];
      expect(metrics).toBeDefined();

      expect(entry.origin.x).toBeCloseTo(
        ((metrics.basePlate.leftX + metrics.basePlate.rightX) / 2) / metrics.width,
        5
      );
      expect(entry.origin.y).toBeCloseTo(metrics.basePlate.cornerY / metrics.height, 5);
      expect(entry.footprintFit.sourceContainmentWidthPx).toBe(metrics.width);
      expect(entry.footprintFit.sourceBaseCenter).toEqual({
        x: (metrics.basePlate.leftX + metrics.basePlate.rightX) / 2,
        y: metrics.basePlate.cornerY,
      });
      expect(entry.footprintFit.footprintFill).toBe(metrics.basePlate.containedFootprintFill);
    });
  });

  it('anchors every entry by the measured plate', () => {
    LEVEL0_BUILDING_ART_MANIFEST.forEach((entry) => {
      expect(entry.footprintFit.anchor).toBe('contained-superstructure');
      expect(entry.fallbackProfile.kind).toBe('vector');
      expect(entry).not.toHaveProperty('plateAspectWaiver');
      expect(entry.footprintFit).not.toHaveProperty('fitTrim');
      expect(entry.footprintFit.footprintFill).toBeGreaterThanOrEqual(0.75);
      expect(entry.footprintFit.footprintFill).toBeLessThanOrEqual(1);
    });
  });

  it('derives containment from the unchanged runtime footprints', () => {
    const buildings = new Map(
      getLevel0Content('en').buildingDefinitions.map((building) => [building.id, building])
    );

    LEVEL0_BUILDING_ART_MANIFEST.forEach((entry) => {
      const building = buildings.get(entry.buildingId);
      expect(building).toBeDefined();
      if (!building) return;

      const widthTiles = building.footprint.to.x - building.footprint.from.x + 1;
      const depthTiles = building.footprint.to.y - building.footprint.from.y + 1;
      const metrics = buildingArtMetrics[entry.buildingId];
      expect(metrics.basePlate.sourceFootprint).toEqual({ widthTiles, depthTiles });

      const containingSpan = Math.min(widthTiles, depthTiles) * TILE_WIDTH;
      const displayWidth =
        metrics.width *
        (containingSpan * entry.footprintFit.footprintFill) /
        entry.footprintFit.sourceContainmentWidthPx;
      expect(displayWidth).toBeLessThanOrEqual(containingSpan);
      expect(displayWidth).toBeGreaterThanOrEqual(containingSpan * 0.75);
    });
  });
});
