import type { Level0BuildingArtEntry } from '../../../../content/environment/level0BuildingArtManifest';
import { resolvePaintedBuildingTransform } from '../paintedBuildingTransform';

describe('resolvePaintedBuildingTransform', () => {
  it('centers and contains a superstructure on a non-square footprint', () => {
    const art = {
      origin: { x: 0.7, y: 0.92 },
      footprintFit: {
        sourceContainmentWidthPx: 400,
        sourceBaseCenter: { x: 200, y: 160 },
        footprintFill: 0.9,
      },
    } as Level0BuildingArtEntry;
    const transform = resolvePaintedBuildingTransform({
      art,
      footprint: {
        top: { x: 0, y: -200 },
        right: { x: 512, y: 56 },
        bottom: { x: 128, y: 248 },
        left: { x: -384, y: -8 },
      },
    });

    expect(transform.x).toBe(64);
    expect(transform.y).toBe(24);
    expect(transform.origin).toEqual({ x: 0.7, y: 0.92 });
    expect(transform.scale).toBeCloseTo((768 * 0.9) / 400, 6);
    expect(400 * transform.scale).toBeLessThanOrEqual(768);
  });

  it('uses the shorter projected axis as the containment constraint', () => {
    const art = {
      origin: { x: 0.5, y: 0.9 },
      footprintFit: {
        sourceContainmentWidthPx: 500,
        sourceBaseCenter: { x: 250, y: 250 },
        footprintFill: 0.9,
      },
    } as Level0BuildingArtEntry;
    const transform = resolvePaintedBuildingTransform({
      art,
      footprint: {
        top: { x: 0, y: -100 },
        right: { x: 320, y: 0 },
        bottom: { x: 0, y: 120 },
        left: { x: -320, y: 0 },
      },
    });

    expect(transform.x).toBe(0);
    expect(transform.y).toBe(5);
    expect(transform.scale).toBeCloseTo((640 * 0.9) / 500, 6);
  });
});
