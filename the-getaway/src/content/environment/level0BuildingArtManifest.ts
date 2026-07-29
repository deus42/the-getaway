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

export interface Level0BuildingArtEntry {
  readonly buildingId: Level0BuildingId;
  readonly textureKey: string;
  readonly imagePath: string;
  readonly origin: {
    readonly x: number;
    readonly y: number;
  };
  readonly footprintFit: {
    readonly anchor: 'south-tip';
    readonly sourceFootprintWidthPx: number;
    readonly widthMultiplier: number;
    readonly offsetTiles: {
      readonly x: number;
      readonly y: number;
    };
  };
  readonly visualHeightTiles: number;
  readonly fallbackProfile: {
    readonly kind: 'vector' | 'legacy-esb-then-vector';
  };
}

const createEntry = (
  buildingId: Level0BuildingId,
  sourceFootprintWidthPx: number,
  visualHeightTiles: number,
  widthMultiplier: number,
  fallbackProfile: Level0BuildingArtEntry['fallbackProfile']['kind'] = 'vector'
): Level0BuildingArtEntry => ({
  buildingId,
  textureKey: `level0-building:${buildingId}`,
  imagePath: `buildings/level0/${buildingId}.png`,
  origin: { x: 0.5, y: 0.98 },
  footprintFit: {
    anchor: 'south-tip',
    sourceFootprintWidthPx,
    widthMultiplier,
    offsetTiles: { x: 0, y: -0.08 },
  },
  visualHeightTiles,
  fallbackProfile: { kind: fallbackProfile },
});

export const LEVEL0_BUILDING_ART_MANIFEST: readonly Level0BuildingArtEntry[] = [
  createEntry('block_1_1', 447, 17, 0.72, 'legacy-esb-then-vector'),
  createEntry('block_1_2', 518, 7.2, 0.9),
  createEntry('block_1_3', 483, 6.4, 0.9),
  createEntry('block_2_1', 480, 5.8, 0.88),
  createEntry('block_2_2', 514, 5.2, 0.9),
  createEntry('block_2_3', 489, 7.4, 0.88),
  createEntry('block_3_1', 452, 6, 0.88),
  createEntry('block_3_2', 555, 6.5, 0.9),
  createEntry('block_3_3', 456, 6.2, 0.88),
];

export const LEVEL0_BUILDING_ART_BY_ID = LEVEL0_BUILDING_ART_MANIFEST.reduce<
  Partial<Record<Level0BuildingId, Level0BuildingArtEntry>>
>((entries, entry) => {
  entries[entry.buildingId] = entry;
  return entries;
}, {});

export const resolveLevel0BuildingArt = (buildingId: string): Level0BuildingArtEntry | undefined =>
  LEVEL0_BUILDING_ART_BY_ID[buildingId as Level0BuildingId];
