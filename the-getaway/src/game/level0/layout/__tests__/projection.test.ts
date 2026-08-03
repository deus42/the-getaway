import { createLevel0Projection } from '../projection';

describe('Level 0 projection', () => {
  it('round-trips fractional layout coordinates without tile rounding', () => {
    const projection = createLevel0Projection({
      tileWidth: 64,
      tileHeight: 32,
      orientation: 'isometric-2:1',
    }, { x: 192, y: 80 });

    const layoutPoint = { x: 16.375, y: 47.625 };
    const scenePoint = projection.layoutToScene(layoutPoint);
    const roundTrip = projection.sceneToLayout(scenePoint);

    expect(roundTrip.x).toBeCloseTo(layoutPoint.x, 8);
    expect(roundTrip.y).toBeCloseTo(layoutPoint.y, 8);
  });

  it('projects polygons through the same adapter used by input', () => {
    const projection = createLevel0Projection({
      tileWidth: 64,
      tileHeight: 32,
      orientation: 'isometric-2:1',
    }, { x: 0, y: 0 });
    const polygon = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ];

    expect(projection.projectPolygon(polygon)).toEqual([
      { x: 0, y: 0 },
      { x: 64, y: 32 },
      { x: 0, y: 64 },
      { x: -64, y: 32 },
    ]);
  });
});
