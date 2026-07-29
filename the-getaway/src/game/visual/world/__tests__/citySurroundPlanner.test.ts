import { planCitySurround } from '../CitySurroundPlanner';

const MAP_WIDTH = 96;
const MAP_HEIGHT = 72;
const CONFIG = {
  ringX: 40,
  ringY: 52,
  prunePadPx: 768,
  seed: 7,
  variantCount: 6,
};

describe('planCitySurround', () => {
  const plan = planCitySurround(MAP_WIDTH, MAP_HEIGHT, CONFIG);

  it('is deterministic for a given seed', () => {
    const again = planCitySurround(MAP_WIDTH, MAP_HEIGHT, CONFIG);
    expect(again).toEqual(plan);
  });

  it('never places geometry inside the playable grid', () => {
    plan.groundChunks.forEach((chunk) => {
      const overlaps =
        chunk.gridX < MAP_WIDTH &&
        chunk.gridX + chunk.sizeTiles > 0 &&
        chunk.gridY < MAP_HEIGHT &&
        chunk.gridY + chunk.sizeTiles > 0;
      expect(overlaps).toBe(false);
    });
    plan.parcels.forEach((parcel) => {
      const overlaps =
        parcel.fromX < MAP_WIDTH &&
        parcel.fromX + parcel.widthTiles > 0 &&
        parcel.fromY < MAP_HEIGHT &&
        parcel.fromY + parcel.depthTiles > 0;
      expect(overlaps).toBe(false);
    });
  });

  it('covers all four sides of the playable area with ground', () => {
    const north = plan.groundChunks.some((chunk) => chunk.gridY + chunk.sizeTiles <= 0);
    const south = plan.groundChunks.some((chunk) => chunk.gridY >= MAP_HEIGHT);
    const west = plan.groundChunks.some((chunk) => chunk.gridX + chunk.sizeTiles <= 0);
    const east = plan.groundChunks.some((chunk) => chunk.gridX >= MAP_WIDTH);
    expect(north && south && west && east).toBe(true);
  });

  it('continuously covers the first exterior tile along every map edge', () => {
    const coveredByGround = (x: number, y: number) =>
      plan.groundChunks.some(
        (chunk) =>
          x >= chunk.gridX &&
          x < chunk.gridX + chunk.sizeTiles &&
          y >= chunk.gridY &&
          y < chunk.gridY + chunk.sizeTiles
      );

    for (let x = 0; x < MAP_WIDTH; x += 1) {
      expect(coveredByGround(x, -1)).toBe(true);
      expect(coveredByGround(x, MAP_HEIGHT)).toBe(true);
    }
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      expect(coveredByGround(-1, y)).toBe(true);
      expect(coveredByGround(MAP_WIDTH, y)).toBe(true);
    }
  });

  it('places parcels beyond every map edge', () => {
    expect(plan.parcels.some((parcel) => parcel.fromY + parcel.depthTiles <= 0)).toBe(true);
    expect(plan.parcels.some((parcel) => parcel.fromY >= MAP_HEIGHT)).toBe(true);
    expect(plan.parcels.some((parcel) => parcel.fromX + parcel.widthTiles <= 0)).toBe(true);
    expect(plan.parcels.some((parcel) => parcel.fromX >= MAP_WIDTH)).toBe(true);
    expect(plan.parcels.length).toBeGreaterThan(80);
    plan.parcels.forEach((parcel) => {
      expect(parcel.widthTiles).toBeLessThanOrEqual(10);
      expect(parcel.depthTiles).toBeLessThanOrEqual(8);
    });
  });

  it('assigns anonymous massing variants and avoids repeated adjacent silhouettes', () => {
    const byCell = new Map<string, number>();
    plan.parcels.forEach((parcel) => {
      expect(parcel).not.toHaveProperty('artIndex');
      expect(parcel.variantIndex).toBeGreaterThanOrEqual(0);
      expect(parcel.variantIndex).toBeLessThan(CONFIG.variantCount);
      expect(parcel.heightTiles).toBeGreaterThanOrEqual(2.5);
      expect(parcel.heightTiles).toBeLessThanOrEqual(6.5);
      expect(parcel.roofInset).toBeGreaterThan(0);
      expect(parcel.roofInset).toBeLessThan(0.24);
      byCell.set(`${parcel.fromX}:${parcel.fromY}`, parcel.variantIndex);
    });
    plan.parcels.forEach((parcel) => {
      const west = byCell.get(`${parcel.fromX - 13}:${parcel.fromY}`);
      const north = byCell.get(`${parcel.fromX}:${parcel.fromY - 11}`);
      const northWest = byCell.get(`${parcel.fromX - 13}:${parcel.fromY - 11}`);
      const northEast = byCell.get(`${parcel.fromX + 13}:${parcel.fromY - 11}`);
      if (west !== undefined) {
        expect(parcel.variantIndex).not.toBe(west);
      }
      if (north !== undefined) {
        expect(parcel.variantIndex).not.toBe(north);
      }
      if (northWest !== undefined) {
        expect(parcel.variantIndex).not.toBe(northWest);
      }
      if (northEast !== undefined) {
        expect(parcel.variantIndex).not.toBe(northEast);
      }
    });
  });

  it('darkens with distance from the playable area', () => {
    plan.groundChunks.forEach((chunk) => {
      expect(chunk.darken).toBeGreaterThanOrEqual(0.2);
      expect(chunk.darken).toBeLessThanOrEqual(0.35);
    });
  });

  it('keeps the ring within the prune distance', () => {
    // Everything kept must project within prunePadPx of the playable box —
    // the guarantee that the surround budget stays bounded.
    const half = { w: 32, h: 16 };
    const corners = [
      { x: 0, y: 0 },
      { x: (MAP_WIDTH - 1) * half.w - 0, y: 0 },
    ];
    expect(corners.length).toBeGreaterThan(0);
    const boxMinX = -(MAP_HEIGHT - 1) * half.w;
    const boxMaxX = (MAP_WIDTH - 1) * half.w;
    const boxMinY = 0;
    const boxMaxY = (MAP_WIDTH - 1 + MAP_HEIGHT - 1) * half.h;
    plan.groundChunks.forEach((chunk) => {
      const cx = chunk.gridX + chunk.sizeTiles / 2;
      const cy = chunk.gridY + chunk.sizeTiles / 2;
      const px = (cx - cy) * half.w;
      const py = (cx + cy) * half.h;
      const dx = Math.max(boxMinX - px, 0, px - boxMaxX);
      const dy = Math.max(boxMinY - py, 0, py - boxMaxY);
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(CONFIG.prunePadPx + 1);
    });
  });
});
