jest.mock('../../../../utils/depth', () => ({
  DepthBias: {
    PROP_TALL: 1000,
  },
}));

jest.mock('../../../../objects/CameraSprite', () => ({
  __esModule: true,
  default: class MockCameraSprite {
    destroy = jest.fn();
    setPosition = jest.fn();
    setRangeTiles = jest.fn();
    setOverlayVisible = jest.fn();
    setActiveState = jest.fn();
    setAlertState = jest.fn();
    setDirection = jest.fn();
  },
}));

import { SurveillanceRenderModule } from '../SurveillanceRenderModule';
import { MainScene } from '../../../MainScene';

describe('SurveillanceRenderModule', () => {
  it('clears tracked camera sprites on shutdown', () => {
    const scene = {} as MainScene;
    const module = new SurveillanceRenderModule(scene);
    const sprite = {
      destroy: jest.fn(),
    };

    (module as unknown as { cameraSprites: Map<string, { destroy: (...args: unknown[]) => void }> }).cameraSprites.set('cam-1', sprite);

    module.onShutdown?.();

    expect(sprite.destroy).toHaveBeenCalledWith(true);
    expect(
      (module as unknown as { cameraSprites: Map<string, { destroy: (...args: unknown[]) => void }> }).cameraSprites.size
    ).toBe(0);
  });

  it('removes stale camera sprites when surveillance zone is unavailable', () => {
    const scene = {
      currentMapArea: {
        id: 'level-0',
      },
    } as unknown as MainScene;
    const module = new SurveillanceRenderModule(scene);
    const sprite = {
      destroy: jest.fn(),
    };

    (module as unknown as { cameraSprites: Map<string, { destroy: (...args: unknown[]) => void }> }).cameraSprites.set('cam-2', sprite);

    module.updateSurveillanceCameras(undefined, false);

    expect(sprite.destroy).toHaveBeenCalledWith(true);
    expect(
      (module as unknown as { cameraSprites: Map<string, { destroy: (...args: unknown[]) => void }> }).cameraSprites.size
    ).toBe(0);
  });
});
