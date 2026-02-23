jest.mock('phaser', () => ({
  __esModule: true,
  default: {},
}));

import { WorldRenderModule } from '../WorldRenderModule';
import type { WorldRenderModulePorts } from '../../contracts/ModulePorts';

const createPorts = (
  overrides: Partial<WorldRenderModulePorts> = {}
): WorldRenderModulePorts => {
  return {
    add: {} as never,
    game: { renderer: {} } as never,
    lights: {
      enable: () => ({ setAmbientColor: () => undefined }),
      disable: () => undefined,
    } as never,
    mapGraphics: { clear: jest.fn() } as never,
    getBackdropGraphics: () => undefined,
    getCurrentMapArea: () => null,
    getCurrentGameTime: () => 0,
    getTileSize: () => 64,
    getIsoFactory: () => undefined,
    ensureIsoFactory: jest.fn(),
    getIsoMetrics: () => ({ tileWidth: 64, tileHeight: 32 }),
    calculatePixelPosition: (x: number, y: number) => ({ x, y }),
    syncDepth: jest.fn(),
    renderVisionCones: jest.fn(),
    getStaticPropGroup: () => undefined,
    setStaticPropGroup: jest.fn(),
    getLightsFeatureEnabled: () => false,
    setLightsFeatureEnabled: jest.fn(),
    getDemoLampGrid: () => undefined,
    setDemoLampGrid: jest.fn(),
    getDemoPointLight: () => undefined,
    setDemoPointLight: jest.fn(),
    getLightingAmbientColor: () => 0x0f172a,
    ...overrides,
  };
};

describe('WorldRenderModule', () => {
  it('builds a stable sorted item marker signature', () => {
    const module = new WorldRenderModule({} as never, createPorts());
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
    const module = new WorldRenderModule(
      {} as never,
      createPorts({
        getCurrentMapArea: () => ({ width: 2, height: 2 } as never),
        calculatePixelPosition: (x: number, y: number) => ({
          x: x * 10,
          y: y * 20,
        }),
      })
    );

    expect(module.computeIsoBounds()).toEqual({
      minX: 0,
      maxX: 10,
      minY: 0,
      maxY: 20,
    });
  });
});
