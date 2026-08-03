import type { Level0LayoutContract, WorldPoint, WorldPolygon } from './types';

type ProjectionSpec = Level0LayoutContract['projection'];

export interface Level0Projection {
  layoutToScene(point: WorldPoint): WorldPoint;
  sceneToLayout(point: WorldPoint): WorldPoint;
  projectPolygon(polygon: WorldPolygon): WorldPolygon;
}

export const createLevel0Projection = (
  spec: ProjectionSpec,
  origin: WorldPoint
): Level0Projection => {
  if (spec.orientation !== 'isometric-2:1' || spec.tileWidth !== spec.tileHeight * 2) {
    throw new Error('Level 0 requires a 2:1 isometric projection');
  }

  const halfTileWidth = spec.tileWidth / 2;
  const halfTileHeight = spec.tileHeight / 2;

  const layoutToScene = (point: WorldPoint): WorldPoint => ({
    x: (point.x - point.y) * halfTileWidth + origin.x,
    y: (point.x + point.y) * halfTileHeight + origin.y,
  });

  const sceneToLayout = (point: WorldPoint): WorldPoint => {
    const horizontal = (point.x - origin.x) / halfTileWidth;
    const vertical = (point.y - origin.y) / halfTileHeight;
    return {
      x: (vertical + horizontal) / 2,
      y: (vertical - horizontal) / 2,
    };
  };

  return {
    layoutToScene,
    sceneToLayout,
    projectPolygon: (polygon) => polygon.map(layoutToScene),
  };
};
