import Phaser from 'phaser';
import { RootState } from '../../../store';
import { SceneContext } from './SceneContext';
import { SceneModule } from './SceneModule';

export class SceneModuleRegistry<TScene extends Phaser.Scene = Phaser.Scene> {
  private readonly modulesByKey = new Map<string, SceneModule<TScene>>();
  private orderedModules: SceneModule<TScene>[] = [];
  private orderDirty = false;

  constructor(private readonly context: SceneContext<TScene>) {}

  register(module: SceneModule<TScene>): void {
    if (this.modulesByKey.has(module.key)) {
      throw new Error(
        `[SceneModuleRegistry] Duplicate module key "${module.key}".`
      );
    }
    module.init(this.context);
    this.modulesByKey.set(module.key, module);
    this.orderDirty = true;
  }

  private getOrderedModules(): SceneModule<TScene>[] {
    if (!this.orderDirty) {
      return this.orderedModules;
    }

    const registrationOrder = Array.from(this.modulesByKey.keys());
    const registrationIndex = new Map<string, number>(
      registrationOrder.map((key, index) => [key, index])
    );
    const indegree = new Map<string, number>(
      registrationOrder.map((key) => [key, 0])
    );
    const dependents = new Map<string, string[]>(
      registrationOrder.map((key) => [key, []])
    );

    this.modulesByKey.forEach((module) => {
      const dependencies = module.dependsOn ?? [];
      dependencies.forEach((dependencyKey) => {
        if (!this.modulesByKey.has(dependencyKey)) {
          throw new Error(
            `[SceneModuleRegistry] Module "${module.key}" depends on missing module "${dependencyKey}".`
          );
        }
        indegree.set(module.key, (indegree.get(module.key) ?? 0) + 1);
        dependents.get(dependencyKey)?.push(module.key);
      });
    });

    const ready: string[] = registrationOrder.filter(
      (key) => (indegree.get(key) ?? 0) === 0
    );
    const orderedKeys: string[] = [];

    while (ready.length > 0) {
      const currentKey = ready.shift();
      if (!currentKey) {
        continue;
      }
      orderedKeys.push(currentKey);
      const dependentKeys = dependents.get(currentKey) ?? [];
      dependentKeys.forEach((dependentKey) => {
        const nextInDegree = (indegree.get(dependentKey) ?? 0) - 1;
        indegree.set(dependentKey, nextInDegree);
        if (nextInDegree === 0) {
          ready.push(dependentKey);
          ready.sort(
            (left, right) =>
              (registrationIndex.get(left) ?? 0) -
              (registrationIndex.get(right) ?? 0)
          );
        }
      });
    }

    if (orderedKeys.length !== this.modulesByKey.size) {
      const cycleKeys = registrationOrder.filter(
        (key) => (indegree.get(key) ?? 0) > 0
      );
      throw new Error(
        `[SceneModuleRegistry] Dependency cycle detected: ${cycleKeys.join(
          ' -> '
        )}.`
      );
    }

    this.orderedModules = orderedKeys.map((key) => {
      const module = this.modulesByKey.get(key);
      if (!module) {
        throw new Error(
          `[SceneModuleRegistry] Internal error: module "${key}" not found.`
        );
      }
      return module;
    });
    this.orderDirty = false;
    return this.orderedModules;
  }

  onCreate(): void {
    this.getOrderedModules().forEach((module) => {
      module.onCreate?.();
    });
  }

  onStateChange(previousState: RootState, nextState: RootState): void {
    this.getOrderedModules().forEach((module) => {
      module.onStateChange?.(previousState, nextState);
    });
  }

  onResize(): void {
    this.getOrderedModules().forEach((module) => {
      module.onResize?.();
    });
  }

  onUpdate(time: number, delta: number): void {
    this.getOrderedModules().forEach((module) => {
      module.onUpdate?.(time, delta);
    });
  }

  onShutdown(): void {
    const orderedModules = this.getOrderedModules();
    for (let index = orderedModules.length - 1; index >= 0; index -= 1) {
      const module = orderedModules[index];
      if (!module) {
        continue;
      }
      module.onShutdown?.();
    }
    this.modulesByKey.clear();
    this.orderedModules = [];
    this.orderDirty = false;
  }
}
