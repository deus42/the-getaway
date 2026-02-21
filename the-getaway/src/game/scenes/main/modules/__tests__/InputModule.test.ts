import Phaser from 'phaser';
import { InputModule } from '../InputModule';
import { SceneContext } from '../../SceneContext';
import { MainScene } from '../../../MainScene';

describe('InputModule', () => {
  it('binds pointerdown handler to module context to avoid getScene runtime errors', () => {
    const scene = {
      sys: { isActive: () => true },
      currentMapArea: null,
    } as unknown as MainScene;

    const module = new InputModule(scene);
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
