import buildingArtMetrics from './level0BuildingArtMetrics.json';

export const LEVEL0_BUILDING_IDS = [
  'block_1_1',
  'block_1_2',
  'block_1_3',
  'block_2_1',
  'block_2_2',
  'block_2_3',
  'block_3_1',
  'block_3_2',
  'block_3_3',
] as const;

export type Level0BuildingId = (typeof LEVEL0_BUILDING_IDS)[number];

export interface Level0BuildingArtMetrics {
  readonly width: number;
  readonly height: number;
  readonly sourceFootprintWidthPx: number;
  readonly basePlate: {
    readonly sourceFootprint: {
      readonly widthTiles: number;
      readonly depthTiles: number;
    };
    readonly tipX: number;
    readonly tipY: number;
    readonly cornerY: number;
    readonly leftX: number;
    readonly rightX: number;
    readonly widthPx: number;
    readonly aspect: number;
    /** Downward-quantized maximum fill whose lower alpha base stays in the parcel. */
    readonly containedFootprintFill: number;
  };
}

export interface Level0BuildingArtEntry {
  readonly buildingId: Level0BuildingId;
  readonly textureKey: string;
  readonly imagePath: string;
  /** Computed from the measured source-base center and corner row. */
  readonly origin: {
    readonly x: number;
    readonly y: number;
  };
  readonly footprintFit: {
    readonly anchor: 'contained-superstructure';
    /** Full alpha-cropped width used by the deterministic scale transform. */
    readonly sourceContainmentWidthPx: number;
    readonly sourceBaseCenter: {
      readonly x: number;
      readonly y: number;
    };
    /** Generated per-asset fill that keeps the lower alpha base in the parcel. */
    readonly footprintFill: number;
  };
  readonly fallbackProfile: {
    readonly kind: 'vector';
  };
}

const metricsFor = (buildingId: Level0BuildingId): Level0BuildingArtMetrics => {
  const metrics = (buildingArtMetrics as Record<string, Level0BuildingArtMetrics>)[buildingId];
  if (!metrics || !metrics.basePlate) {
    throw new Error(`Missing generated art metrics for ${buildingId}`);
  }
  return metrics;
};

const createEntry = (buildingId: Level0BuildingId): Level0BuildingArtEntry => {
  const metrics = metricsFor(buildingId);
  const { basePlate } = metrics;
  return {
    buildingId,
    textureKey: `level0-building:${buildingId}`,
    imagePath: `buildings/level0/${buildingId}.png`,
    // Generated superstructures sit on a separately authored runtime parcel.
    // Register their measured base center to the parcel centroid. The generated
    // per-asset fill keeps every visible ground-contact pixel inside the actual
    // footprint polygon even when source podiums are near-square.
    origin: {
      x: ((basePlate.leftX + basePlate.rightX) / 2) / metrics.width,
      y: basePlate.cornerY / metrics.height,
    },
    footprintFit: {
      anchor: 'contained-superstructure',
      sourceContainmentWidthPx: metrics.width,
      sourceBaseCenter: {
        x: (basePlate.leftX + basePlate.rightX) / 2,
        y: basePlate.cornerY,
      },
      footprintFill: basePlate.containedFootprintFill,
    },
    fallbackProfile: { kind: 'vector' },
  };
};

export const LEVEL0_BUILDING_ART_MANIFEST: readonly Level0BuildingArtEntry[] = [
  createEntry('block_1_1'),
  createEntry('block_1_2'),
  createEntry('block_1_3'),
  createEntry('block_2_1'),
  createEntry('block_2_2'),
  createEntry('block_2_3'),
  createEntry('block_3_1'),
  createEntry('block_3_2'),
  createEntry('block_3_3'),
];

export const LEVEL0_BUILDING_ART_BY_ID = LEVEL0_BUILDING_ART_MANIFEST.reduce<
  Partial<Record<Level0BuildingId, Level0BuildingArtEntry>>
>((entries, entry) => {
  entries[entry.buildingId] = entry;
  return entries;
}, {});

export const resolveLevel0BuildingArt = (buildingId: string): Level0BuildingArtEntry | undefined =>
  LEVEL0_BUILDING_ART_BY_ID[buildingId as Level0BuildingId];
