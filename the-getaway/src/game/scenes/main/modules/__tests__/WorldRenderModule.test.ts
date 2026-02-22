jest.mock('phaser', () => ({
  __esModule: true,
  default: {},
}));

import { WorldRenderModule } from '../WorldRenderModule';

describe('WorldRenderModule', () => {
  it('builds a stable sorted item marker signature', () => {
    const module = new WorldRenderModule({} as never);
    const signature = module.getItemMarkerSignature({
      id: 'zone-a',
      name: 'Zone A',
      width: 1,
      height: 1,
      tiles: [],
      entities: {
        enemies: [],
        npcs: [],
        items: [
          { id: 'b', name: 'Beta', position: { x: 2, y: 1 } },
          { id: 'a', name: 'Alpha', position: { x: 1, y: 1 } },
        ],
      },
      buildings: [],
      zoneId: 'slums',
      levelId: 0,
    } as never);

    expect(signature).toBe('a@1,1|b@2,1');
  });

  it('computes iso bounds from map corners', () => {
    const module = new WorldRenderModule({
      currentMapArea: { width: 2, height: 2 },
      calculatePixelPosition: (x: number, y: number) => ({ x: x * 10, y: y * 20 }),
    } as never);

    expect(module.computeIsoBounds()).toEqual({
      minX: 0,
      maxX: 10,
      minY: 0,
      maxY: 20,
    });
  });
});
