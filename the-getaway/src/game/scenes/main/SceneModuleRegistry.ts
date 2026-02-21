import Phaser from 'phaser';
import { RootState } from '../../../store';
import { SceneContext } from './SceneContext';
import { SceneModule } from './SceneModule';

export class SceneModuleRegistry<TScene extends Phaser.Scene = Phaser.Scene> {
  private readonly modules: SceneModule<TScene>[] = [];

  constructor(private readonly context: SceneContext<TScene>) {}

  register(module: SceneModule<TScene>): void {
    module.init(this.context);
    this.modules.push(module);
  }

  onCreate(): void {
    this.modules.forEach((module) => {
      module.onCreate?.();
    });
  }

  onStateChange(previousState: RootState, nextState: RootState): void {
    this.modules.forEach((module) => {
      module.onStateChange?.(previousState, nextState);
    });
  }

  onResize(): void {
    this.modules.forEach((module) => {
      module.onResize?.();
    });
  }

  onUpdate(time: number, delta: number): void {
    this.modules.forEach((module) => {
      module.onUpdate?.(time, delta);
    });
  }

  onShutdown(): void {
    for (let index = this.modules.length - 1; index >= 0; index -= 1) {
      const module = this.modules[index];
      if (!module) {
        continue;
      }
      module.onShutdown?.();
    }
    this.modules.length = 0;
  }
}
