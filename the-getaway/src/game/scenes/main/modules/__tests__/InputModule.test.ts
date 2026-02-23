import Phaser from 'phaser';
import { InputModule } from '../InputModule';
import { SceneContext } from '../../SceneContext';
import { MainScene } from '../../../MainScene';

describe('InputModule', () => {
  it('binds pointerdown handler to module context to avoid getScene runtime errors', () => {
    const module = new InputModule({} as MainScene, {
      cameras: { main: { getWorldPoint: () => ({ x: 0, y: 0 }) } } as never,
      sys: { isActive: () => true } as never,
      pathGraphics: { clear: jest.fn() } as never,
      getCurrentMapArea: () => null,
      setCurrentMapArea: jest.fn(),
      getPlayerInitialPosition: () => undefined,
      getLastPlayerGridPosition: () => null,
      getCoverDebugGraphics: () => undefined,
      worldToGrid: () => null,
      getIsoMetrics: () => ({ tileWidth: 64, tileHeight: 32, halfTileWidth: 32, halfTileHeight: 16 }),
      calculatePixelPosition: () => ({ x: 0, y: 0 }),
      getDiamondPoints: () => [],
      renderStaticProps: jest.fn(),
    });

    const listenWindow = jest.fn();
    const listenInput = jest.fn();
    const context = {
      listenWindow,
      listenInput,
    } as unknown as SceneContext<MainScene>;

    module.init(context);
    module.onCreate();

    expect(listenInput).toHaveBeenCalled();
    const pointerdownCall = listenInput.mock.calls.find(([eventName]) => eventName === 'pointerdown');
    expect(pointerdownCall).toBeDefined();

    const listener = pointerdownCall?.[1] as (pointer: Phaser.Input.Pointer) => void;
    const listenerContext = pointerdownCall?.[2];
    expect(listenerContext).toBe(module);

    expect(() => {
      listener.call(listenerContext, {} as Phaser.Input.Pointer);
    }).not.toThrow();
  });
});
