import { DepthLayers } from '../../utils/depth';

export interface CitySurroundDepthCandidate<T> {
  readonly item: T;
  readonly southTip: {
    readonly x: number;
    readonly y: number;
  };
}

export interface CitySurroundDepthAssignment<T> extends CitySurroundDepthCandidate<T> {
  readonly depth: number;
}

/**
 * Orders anonymous surround structures back-to-front and gives each one a
 * stable depth strictly between the surround ground and the playable map.
 * Keeping the full range below MAP_BASE prevents exterior art from ever
 * compositing over gameplay, while distinct ranks let painted and vector
 * fallbacks interleave correctly.
 */
export const rankCitySurroundStructures = <T>(
  candidates: readonly CitySurroundDepthCandidate<T>[]
): CitySurroundDepthAssignment<T>[] => {
  const sorted = [...candidates].sort(
    (left, right) =>
      left.southTip.y - right.southTip.y ||
      left.southTip.x - right.southTip.x
  );
  const depthSpan = DepthLayers.MAP_BASE - DepthLayers.CITY_SURROUND_STRUCTURES;
  const depthStep = depthSpan / (sorted.length + 1);

  return sorted.map((candidate, index) => ({
    ...candidate,
    depth: DepthLayers.CITY_SURROUND_STRUCTURES + depthStep * (index + 1),
  }));
};
