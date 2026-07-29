/**
 * Plans the decorative city ring that surrounds the playable Level 0 diamond
 * so no camera position ever shows void, map edges, or bare backdrop (GET-182).
 *
 * Pure geometry + seeded assignment — no Phaser. The renderer projects the
 * returned grid coordinates through the scene's usual iso transform, so the
 * surround inherits any future projection changes automatically. Everything
 * here is deterministic for a given map size + config.
 */

export interface CitySurroundConfig {
  /** Ring thickness in tiles beyond the playable grid, east/west axis. */
  readonly ringX: number;
  /** Ring thickness in tiles beyond the playable grid, north/south axis. */
  readonly ringY: number;
  /** Keep geometry whose projected center lies within this padding (px) of the playable iso box. */
  readonly prunePadPx: number;
  readonly seed: number;
  /** Number of anonymous skyline variants available to the renderer. */
  readonly variantCount: number;
}

export interface SurroundGroundChunk {
  /** North-west corner of the chunk in grid coords (may be negative). */
  readonly gridX: number;
  readonly gridY: number;
  readonly sizeTiles: number;
  /** 0..1 darkening toward ink with distance from the playable area. */
  readonly darken: number;
}

export interface SurroundRoadBand {
  readonly fromX: number;
  readonly toX: number;
  readonly fromY: number;
  readonly toY: number;
}

export interface SurroundParcel {
  readonly fromX: number;
  readonly fromY: number;
  readonly widthTiles: number;
  readonly depthTiles: number;
  /** Anonymous filler silhouette; never indexes named gameplay landmarks. */
  readonly variantIndex: number;
  readonly heightTiles: number;
  readonly roofInset: number;
  readonly darken: number;
}

export interface CitySurroundPlan {
  readonly groundChunks: SurroundGroundChunk[];
  readonly roadBands: SurroundRoadBand[];
  readonly parcels: SurroundParcel[];
  /** Ring extents in tiles, echoed for bounds computation. */
  readonly ringX: number;
  readonly ringY: number;
}

const CHUNK_SIZE = 8;
// Continues the interior lattice: avenues x∈{24-26, 60-62}, streets y∈{20-21,
// 44-45} on the real map; synthetic roads repeat on the same pitch outward.
const AVENUE_STARTS = [24, 60];
const AVENUE_WIDTH = 3;
const AVENUE_PITCH = 36;
const STREET_STARTS = [20, 44];
const STREET_WIDTH = 2;
const STREET_PITCH = 24;
// Small anonymous blocks read as a surrounding neighborhood at overview scale;
// the previous 20×16 parcels produced landmark-sized roof slabs.
const PARCEL_WIDTH = 9;
const PARCEL_DEPTH = 7;
const PARCEL_STRIDE_X = 13;
const PARCEL_STRIDE_Y = 11;
const MIN_DARKEN = 0.2;
const MAX_DARKEN = 0.35;

const HALF_TILE_WIDTH = 32;
const HALF_TILE_HEIGHT = 16;

/** Deterministic 32-bit PRNG (mulberry32). */
const createRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Origin-free iso projection — distances only, matches iso.ts ratios. */
const project = (gridX: number, gridY: number): { x: number; y: number } => ({
  x: (gridX - gridY) * HALF_TILE_WIDTH,
  y: (gridX + gridY) * HALF_TILE_HEIGHT,
});

interface IsoBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const playableIsoBox = (mapWidth: number, mapHeight: number): IsoBox => {
  const corners = [
    project(0, 0),
    project(mapWidth - 1, 0),
    project(0, mapHeight - 1),
    project(mapWidth - 1, mapHeight - 1),
  ];
  return {
    minX: Math.min(...corners.map((corner) => corner.x)),
    maxX: Math.max(...corners.map((corner) => corner.x)),
    minY: Math.min(...corners.map((corner) => corner.y)),
    maxY: Math.max(...corners.map((corner) => corner.y)),
  };
};

/** Distance from a point to the (padded) iso box; 0 inside. */
const distanceToBox = (box: IsoBox, x: number, y: number): number => {
  const dx = Math.max(box.minX - x, 0, x - box.maxX);
  const dy = Math.max(box.minY - y, 0, y - box.maxY);
  return Math.hypot(dx, dy);
};

const isRoadColumn = (x: number): boolean => {
  for (const start of AVENUE_STARTS) {
    const offset = ((x - start) % AVENUE_PITCH + AVENUE_PITCH) % AVENUE_PITCH;
    if (offset < AVENUE_WIDTH) {
      return true;
    }
  }
  return false;
};

const isRoadRow = (y: number): boolean => {
  for (const start of STREET_STARTS) {
    const offset = ((y - start) % STREET_PITCH + STREET_PITCH) % STREET_PITCH;
    if (offset < STREET_WIDTH) {
      return true;
    }
  }
  return false;
};

const intersectsInterior = (
  fromX: number,
  fromY: number,
  width: number,
  depth: number,
  mapWidth: number,
  mapHeight: number
): boolean =>
  fromX < mapWidth && fromX + width > 0 && fromY < mapHeight && fromY + depth > 0;

export const planCitySurround = (
  mapWidth: number,
  mapHeight: number,
  config: CitySurroundConfig
): CitySurroundPlan => {
  const random = createRandom(config.seed);
  const box = playableIsoBox(mapWidth, mapHeight);
  const keep = (gridX: number, gridY: number): boolean => {
    const point = project(gridX, gridY);
    return distanceToBox(box, point.x, point.y) <= config.prunePadPx;
  };
  const darkenFor = (gridX: number, gridY: number): number => {
    const point = project(gridX, gridY);
    const ratio = Math.min(1, distanceToBox(box, point.x, point.y) / config.prunePadPx);
    return MIN_DARKEN + (MAX_DARKEN - MIN_DARKEN) * ratio;
  };

  const groundChunks: SurroundGroundChunk[] = [];
  // Align the ring lattice to the playable tile origin. Level 0 dimensions are
  // chunk-aligned, so the first exterior row lands exactly at -1 / map size
  // instead of leaving the old four-tile north/south seam.
  const startX = -Math.ceil(config.ringX / CHUNK_SIZE) * CHUNK_SIZE;
  const endX = mapWidth + Math.ceil(config.ringX / CHUNK_SIZE) * CHUNK_SIZE;
  const startY = -Math.ceil(config.ringY / CHUNK_SIZE) * CHUNK_SIZE;
  const endY = mapHeight + Math.ceil(config.ringY / CHUNK_SIZE) * CHUNK_SIZE;

  for (let gridY = startY; gridY < endY; gridY += CHUNK_SIZE) {
    for (let gridX = startX; gridX < endX; gridX += CHUNK_SIZE) {
      if (intersectsInterior(gridX, gridY, CHUNK_SIZE, CHUNK_SIZE, mapWidth, mapHeight)) {
        continue;
      }
      const centerX = gridX + CHUNK_SIZE / 2;
      const centerY = gridY + CHUNK_SIZE / 2;
      if (!keep(centerX, centerY)) {
        continue;
      }
      groundChunks.push({
        gridX,
        gridY,
        sizeTiles: CHUNK_SIZE,
        darken: darkenFor(centerX, centerY),
      });
    }
  }

  // Road bands: continue every interior avenue/street through the ring and
  // repeat them on the interior pitch across the surround. Bands are clipped
  // to the ring rectangle; the renderer draws them over the ground chunks, so
  // interior overlap is excluded per-axis instead of per-tile.
  const roadBands: SurroundRoadBand[] = [];
  for (let x = startX; x < endX; x += 1) {
    if (!isRoadColumn(x)) {
      continue;
    }
    // North and south continuations of this column outside the playable grid.
    roadBands.push({ fromX: x, toX: x + 1, fromY: startY, toY: 0 });
    roadBands.push({ fromX: x, toX: x + 1, fromY: mapHeight, toY: endY });
    // Skip ahead to the end of this road group for efficiency.
  }
  for (let y = startY; y < endY; y += 1) {
    if (!isRoadRow(y)) {
      continue;
    }
    roadBands.push({ fromX: startX, toX: 0, fromY: y, toY: y + 1 });
    roadBands.push({ fromX: mapWidth, toX: endX, fromY: y, toY: y + 1 });
  }

  // Synthetic parcels on the interior lattice pitch, aligned so the ring reads
  // as the same city. These are anonymous, low-detail skyline masses rather
  // than copies of the nine named gameplay landmarks.
  const parcels: SurroundParcel[] = [];
  const variantByCell = new Map<string, number>();
  const variantCount = Math.max(5, Math.floor(config.variantCount));
  const firstColumn = Math.floor((startX - 4) / PARCEL_STRIDE_X);
  const lastColumn = Math.ceil((endX - 4) / PARCEL_STRIDE_X);
  const firstRow = Math.floor((startY - 4) / PARCEL_STRIDE_Y);
  const lastRow = Math.ceil((endY - 4) / PARCEL_STRIDE_Y);

  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const fromX = 4 + column * PARCEL_STRIDE_X;
      const fromY = 4 + row * PARCEL_STRIDE_Y;
      if (intersectsInterior(fromX, fromY, PARCEL_WIDTH, PARCEL_DEPTH, mapWidth, mapHeight)) {
        continue;
      }
      const centerX = fromX + PARCEL_WIDTH / 2;
      const centerY = fromY + PARCEL_DEPTH / 2;
      if (!keep(centerX, centerY)) {
        continue;
      }

      const forbidden = new Set(
        [
          variantByCell.get(`${column - 1}:${row}`),
          variantByCell.get(`${column}:${row - 1}`),
          variantByCell.get(`${column - 1}:${row - 1}`),
          variantByCell.get(`${column + 1}:${row - 1}`),
        ].filter((value): value is number => value !== undefined)
      );
      let variantIndex = Math.floor(random() * variantCount);
      for (let step = 0; forbidden.has(variantIndex) && step < variantCount; step += 1) {
        variantIndex = (variantIndex + 1) % variantCount;
      }
      variantByCell.set(`${column}:${row}`, variantIndex);

      const heightTiles = 2.5 + random() * 4;
      const roofInset = 0.07 + random() * 0.15;

      parcels.push({
        fromX,
        fromY,
        widthTiles: PARCEL_WIDTH,
        depthTiles: PARCEL_DEPTH,
        variantIndex,
        heightTiles,
        roofInset,
        darken: darkenFor(centerX, centerY),
      });
    }
  }

  return { groundChunks, roadBands, parcels, ringX: config.ringX, ringY: config.ringY };
};
