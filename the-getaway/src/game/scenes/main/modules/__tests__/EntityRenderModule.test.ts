jest.mock('phaser', () => ({
  __esModule: true,
  default: {},
}));

import { PLAYER_SCREEN_POSITION_EVENT } from '../../../../events';
import { EntityRenderModule } from '../EntityRenderModule';

describe('EntityRenderModule', () => {
  afterEach(() => {
    delete (window as Window & { __getawayPlayerScreenPosition?: unknown }).__getawayPlayerScreenPosition;
    jest.restoreAllMocks();
  });

  it('dispatches player screen position events and deduplicates unchanged payloads', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const runtimeState: Record<string, unknown> = {
      playerToken: { container: { x: 120, y: 240 } },
      playerNameLabel: undefined,
      playerVitalsIndicator: undefined,
      enemySprites: new Map(),
      npcSprites: new Map(),
      lastPlayerGridPosition: null,
      lastPlayerScreenDetail: undefined,
    };

    const module = new EntityRenderModule({} as never, {
      add: {} as never,
      cameras: { main: { worldView: { x: 20, y: 40 }, zoom: 2 } } as never,
      game: {
        canvas: {
          getBoundingClientRect: () => ({
            width: 960,
            height: 540,
            left: 10,
            top: 20,
          }),
        },
      } as never,
      scale: { width: 960, height: 540 } as never,
      sys: { isActive: () => true } as never,
      hasMapGraphics: () => true,
      ensureIsoFactory: jest.fn(),
      getIsoMetrics: () => ({ tileWidth: 64, tileHeight: 32 }),
      calculatePixelPosition: (x: number, y: number) => ({ x, y }),
      syncDepth: jest.fn(),
      enablePlayerCameraFollow: jest.fn(),
      isInCombat: () => false,
      isCameraFollowingPlayer: () => true,
      createCharacterToken: jest.fn() as never,
      positionCharacterToken: jest.fn(),
      readRuntimeState: () => runtimeState as never,
      writeRuntimeState: (nextState) => {
        Object.assign(runtimeState, nextState);
      },
    });

    module.dispatchPlayerScreenPosition();
    module.dispatchPlayerScreenPosition();

    const detail = (window as Window & { __getawayPlayerScreenPosition?: { screenX: number; screenY: number } })
      .__getawayPlayerScreenPosition;
    expect(detail).toBeDefined();
    expect(detail?.screenX).toBe(200);
    expect(detail?.screenY).toBe(400);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect((dispatchSpy.mock.calls[0]?.[0] as Event).type).toBe(PLAYER_SCREEN_POSITION_EVENT);
  });
});
