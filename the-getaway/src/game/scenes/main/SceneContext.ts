import Phaser from 'phaser';
import { AppDispatch, RootState } from '../../../store';
import { DisposableBag } from '../../runtime/resources/DisposableBag';

interface SceneStoreBridge {
  getState: () => RootState;
  dispatch: AppDispatch;
}

export interface SceneContext<TScene extends Phaser.Scene = Phaser.Scene> {
  scene: TScene;
  getState: () => RootState;
  dispatch: AppDispatch;
  disposables: DisposableBag;
  listenWindow: (
    event: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean
  ) => void;
  listenDocument: (
    event: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean
  ) => void;
  listenScale: <TArgs extends unknown[]>(
    event: string,
    listener: (...args: TArgs) => void,
    context?: object
  ) => void;
  listenInput: <TArgs extends unknown[]>(
    event: string,
    listener: (...args: TArgs) => void,
    context?: object
  ) => void;
}

export const createSceneContext = <TScene extends Phaser.Scene>(
  scene: TScene,
  storeBridge: SceneStoreBridge,
  disposables: DisposableBag
): SceneContext<TScene> => {
  const listenWindow: SceneContext<TScene>['listenWindow'] = (event, listener, options) => {
    window.addEventListener(event, listener, options);
    disposables.add(() => window.removeEventListener(event, listener, options));
  };

  const listenDocument: SceneContext<TScene>['listenDocument'] = (event, listener, options) => {
    document.addEventListener(event, listener, options);
    disposables.add(() => document.removeEventListener(event, listener, options));
  };

  const listenScale: SceneContext<TScene>['listenScale'] = (event, listener, context) => {
    scene.scale.on(event, listener, context);
    disposables.add(() => scene.scale.off(event, listener, context));
  };

  const listenInput: SceneContext<TScene>['listenInput'] = (event, listener, context) => {
    if (!scene.input) {
      return;
    }
    scene.input.on(event, listener, context);
    disposables.add(() => {
      scene.input?.off(event, listener, context);
    });
  };

  return {
    scene,
    getState: storeBridge.getState,
    dispatch: storeBridge.dispatch,
    disposables,
    listenWindow,
    listenDocument,
    listenScale,
    listenInput,
  };
};
