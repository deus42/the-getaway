jest.mock('phaser', () => ({
  __esModule: true,
  default: {},
}));

import { DepthLayers } from '../../../utils/depth';
import { rankCitySurroundStructures } from '../CitySurroundDepth';

describe('rankCitySurroundStructures', () => {
  it('sorts by south tip and assigns distinct depths below the playable map', () => {
    const assignments = rankCitySurroundStructures([
      { item: 'south', southTip: { x: 10, y: 30 } },
      { item: 'north-east', southTip: { x: 20, y: 10 } },
      { item: 'north-west', southTip: { x: 5, y: 10 } },
    ]);

    expect(assignments.map(({ item }) => item)).toEqual([
      'north-west',
      'north-east',
      'south',
    ]);
    expect(assignments.every(({ depth }) => depth > DepthLayers.CITY_SURROUND_STRUCTURES)).toBe(true);
    expect(assignments.every(({ depth }) => depth < DepthLayers.MAP_BASE)).toBe(true);
    expect(assignments[0].depth).toBeLessThan(assignments[1].depth);
    expect(assignments[1].depth).toBeLessThan(assignments[2].depth);
  });

  it('returns an empty assignment for an empty plan', () => {
    expect(rankCitySurroundStructures([])).toEqual([]);
  });
});
