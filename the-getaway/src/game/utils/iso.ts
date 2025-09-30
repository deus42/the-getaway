import { DEFAULT_TILE_SIZE } from '../world/grid';

export interface IsoMetrics {
  tileWidth: number;
  tileHeight: number;
  halfTileWidth: number;
  halfTileHeight: number;
}

export interface IsoPoint {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const integerToColor = (color: number) => ({
  r: (color >> 16) & 0xff,
  g: (color >> 8) & 0xff,
  b: color & 0xff,
});

const colorToInteger = (r: number, g: number, b: number): number => {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
};

export const getIsoMetrics = (tileSize: number = DEFAULT_TILE_SIZE): IsoMetrics => {
  const tileWidth = tileSize;
  const tileHeight = tileSize / 2;

  return {
    tileWidth,
    tileHeight,
    halfTileWidth: tileWidth / 2,
    halfTileHeight: tileHeight / 2,
  };
};

export const toPixel = (
  gridX: number,
  gridY: number,
  isoOriginX: number,
  isoOriginY: number,
  tileSize: number = DEFAULT_TILE_SIZE
): { x: number; y: number } => {
  const metrics = getIsoMetrics(tileSize);
  const isoX = (gridX - gridY) * metrics.halfTileWidth + isoOriginX;
  const isoY = (gridX + gridY) * metrics.halfTileHeight + isoOriginY;

  return { x: isoX, y: isoY };
};

export const getDiamondPoints = (
  centerX: number,
  centerY: number,
  width: number,
  height: number
): IsoPoint[] => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return [
    { x: centerX, y: centerY - halfHeight },
    { x: centerX + halfWidth, y: centerY },
    { x: centerX, y: centerY + halfHeight },
    { x: centerX - halfWidth, y: centerY },
  ];
};

export const adjustColor = (color: number, factor: number): number => {
  const { r, g, b } = integerToColor(color);

  if (factor >= 0) {
    const nr = clamp(Math.round(r + (255 - r) * factor), 0, 255);
    const ng = clamp(Math.round(g + (255 - g) * factor), 0, 255);
    const nb = clamp(Math.round(b + (255 - b) * factor), 0, 255);
    return colorToInteger(nr, ng, nb);
  }

  const scale = Math.max(0, 1 + factor);
  const nr = clamp(Math.round(r * scale), 0, 255);
  const ng = clamp(Math.round(g * scale), 0, 255);
  const nb = clamp(Math.round(b * scale), 0, 255);
  return colorToInteger(nr, ng, nb);
};
