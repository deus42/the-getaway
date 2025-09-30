import { adjustColor, getDiamondPoints, getIsoMetrics, toPixel } from '../game/utils/iso';

describe('iso utils', () => {
  test('getIsoMetrics returns expected values', () => {
    const metrics = getIsoMetrics(64);
    expect(metrics.tileWidth).toBe(64);
    expect(metrics.tileHeight).toBe(32);
    expect(metrics.halfTileWidth).toBe(32);
    expect(metrics.halfTileHeight).toBe(16);
  });

  test('toPixel converts grid coordinates with origin correctly', () => {
    const originX = 96;
    const originY = 32;
    const result = toPixel(2, 1, originX, originY, 64);
    expect(result.x).toBe(originX + (2 - 1) * 32);
    expect(result.y).toBe(originY + (2 + 1) * 16);
  });

  test('getDiamondPoints returns four ordered vertices', () => {
    const points = getDiamondPoints(100, 100, 40, 20);
    expect(points).toHaveLength(4);
    expect(points[0].x).toBe(100);
    expect(points[0].y).toBe(90);
    expect(points[2].y).toBe(110);
  });

  test('adjustColor lightens and darkens as expected', () => {
    const base = 0x4c4c4c;
    const lighter = adjustColor(base, 0.5);
    const darker = adjustColor(base, -0.4);

    expect(lighter).not.toBe(base);
    expect(darker).not.toBe(base);

    const toRgb = (value: number) => ({
      r: (value >> 16) & 0xff,
      g: (value >> 8) & 0xff,
      b: value & 0xff,
    });

    const lighterValue = toRgb(lighter);
    const baseValue = toRgb(base);
    const darkerValue = toRgb(darker);

    expect(lighterValue.r).toBeGreaterThan(baseValue.r);
    expect(darkerValue.r).toBeLessThan(baseValue.r);
  });
});
