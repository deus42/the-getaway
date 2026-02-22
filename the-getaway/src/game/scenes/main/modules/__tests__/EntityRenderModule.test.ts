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
    const module = new EntityRenderModule({
      playerToken: { container: { x: 120, y: 240 } },
      sys: { isActive: () => true },
      cameras: {
        main: {
          worldView: { x: 20, y: 40 },
          zoom: 2,
        },
      },
      game: {
        canvas: {
          getBoundingClientRect: () => ({
            width: 960,
            height: 540,
            left: 10,
            top: 20,
          }),
        },
      },
      scale: { width: 960, height: 540 },
      lastPlayerScreenDetail: undefined,
    } as never);

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
