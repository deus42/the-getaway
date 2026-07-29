import {
  createCenteredBuildingFootprint,
  isPointInsideConvexFootprint,
  projectContainedBuildingSourcePoint,
} from '../containedBuildingGeometry';

describe('contained building geometry', () => {
  const footprint = createCenteredBuildingFootprint({
    widthTiles: 16,
    depthTiles: 18,
    tileWidth: 64,
  });

  it('rejects the real block_3_1 south-tip extent at the old global fill', () => {
    const projected = projectContainedBuildingSourcePoint({
      sourcePoint: { x: -8, y: 128.5 },
      sourceContainmentWidthPx: 375,
      footprintFill: 0.9,
      footprint,
    });

    expect(isPointInsideConvexFootprint(projected, footprint)).toBe(false);
  });

  it('contains the same south-tip extent at its generated safe fill', () => {
    const projected = projectContainedBuildingSourcePoint({
      sourcePoint: { x: -8, y: 128.5 },
      sourceContainmentWidthPx: 375,
      footprintFill: 0.75,
      footprint,
    });

    expect(isPointInsideConvexFootprint(projected, footprint)).toBe(true);
  });
});
