import Phaser from 'phaser';
import { AppDispatch, RootState } from '../../../../store';
import { DisposableBag } from '../../../runtime/resources/DisposableBag';
import { createSceneContext } from '../SceneContext';

const createStoreBridge = () => ({
  getState: () => ({} as RootState),
  dispatch: jest.fn() as unknown as AppDispatch,
});

const createSceneWithInput = () => {
  const scale = {
    on: jest.fn(),
    off: jest.fn(),
  };
  const input = {
    on: jest.fn(),
    off: jest.fn(),
  };

  return {
    scene: { scale, input } as unknown as Phaser.Scene,
    scale,
    input,
  };
};

describe('createSceneContext', () => {
  it('registers and cleans up window/document listeners through DisposableBag', () => {
    const { scene } = createSceneWithInput();
    const bag = new DisposableBag();
    const context = createSceneContext(scene, createStoreBridge(), bag);
    const windowListener = jest.fn();
    const documentListener = jest.fn();

    context.listenWindow('getaway-window-test', windowListener as EventListener);
    context.listenDocument('getaway-document-test', documentListener as EventListener);

    window.dispatchEvent(new Event('getaway-window-test'));
    document.dispatchEvent(new Event('getaway-document-test'));
    expect(windowListener).toHaveBeenCalledTimes(1);
    expect(documentListener).toHaveBeenCalledTimes(1);

    bag.dispose();
    window.dispatchEvent(new Event('getaway-window-test'));
    document.dispatchEvent(new Event('getaway-document-test'));
    expect(windowListener).toHaveBeenCalledTimes(1);
    expect(documentListener).toHaveBeenCalledTimes(1);
  });

  it('registers and disposes scale/input listeners via scene event APIs', () => {
    const { scene, scale, input } = createSceneWithInput();
    const bag = new DisposableBag();
    const context = createSceneContext(scene, createStoreBridge(), bag);
    const scaleListener = jest.fn();
    const inputListener = jest.fn();

    context.listenScale('resize', scaleListener, scene);
    context.listenInput('pointerdown', inputListener, scene);

    expect(scale.on).toHaveBeenCalledWith('resize', scaleListener, scene);
    expect(input.on).toHaveBeenCalledWith('pointerdown', inputListener, scene);

    bag.dispose();

    expect(scale.off).toHaveBeenCalledWith('resize', scaleListener, scene);
    expect(input.off).toHaveBeenCalledWith('pointerdown', inputListener, scene);
  });

  it('skips input listener wiring when scene input is unavailable', () => {
    const scale = {
      on: jest.fn(),
      off: jest.fn(),
    };
    const scene = { scale } as unknown as Phaser.Scene;
    const bag = new DisposableBag();
    const context = createSceneContext(scene, createStoreBridge(), bag);

    expect(() => {
      context.listenInput('pointerdown', jest.fn(), scene);
    }).not.toThrow();
  });
});
