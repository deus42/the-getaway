import surroundArtMetrics from './level0SurroundArtMetrics.json';

export interface Level0SurroundArtEntry {
  readonly id: string;
  readonly textureKey: string;
  readonly imagePath: string;
  readonly origin: {
    readonly x: number;
    readonly y: number;
  };
  readonly basePlateWidthPx: number;
}

interface SurroundArtMetric {
  readonly width: number;
  readonly height: number;
  readonly basePlate: {
    readonly tipX: number;
    readonly tipY: number;
    readonly widthPx: number;
  };
}

const createEntry = (index: number): Level0SurroundArtEntry => {
  const id = `surround_${index}`;
  const metric = (surroundArtMetrics as Record<string, SurroundArtMetric>)[id];
  if (!metric?.basePlate) {
    throw new Error(`Missing generated surround art metrics for ${id}`);
  }

  return {
    id,
    textureKey: `level0-surround:${index}`,
    imagePath: `buildings/level0/surround/${index}.png`,
    origin: {
      x: metric.basePlate.tipX / metric.width,
      y: metric.basePlate.tipY / metric.height,
    },
    basePlateWidthPx: metric.basePlate.widthPx,
  };
};

export const LEVEL0_SURROUND_ART_MANIFEST: readonly Level0SurroundArtEntry[] = Array.from(
  { length: 9 },
  (_, index) => createEntry(index)
);

export const resolveLevel0SurroundArt = (variantIndex: number): Level0SurroundArtEntry => {
  const normalized =
    ((Math.floor(variantIndex) % LEVEL0_SURROUND_ART_MANIFEST.length) +
      LEVEL0_SURROUND_ART_MANIFEST.length) %
    LEVEL0_SURROUND_ART_MANIFEST.length;
  return LEVEL0_SURROUND_ART_MANIFEST[normalized];
};
