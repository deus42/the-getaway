import { miniMapService } from '../../../services/miniMapService';
import { ViewportUpdateDetail } from '../../../events';
import type { MainScene } from '../../MainScene';
import type { MinimapBridgeModulePorts } from '../contracts/ModulePorts';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const readRequiredValue = <T>(target: object, key: string): T => {
  const value = readValue<T>(target, key);
  if (value === undefined || value === null) {
    throw new Error(`[MinimapBridgeModule] Missing required scene value: ${key}`);
  }
  return value;
};

const callSceneMethod = <TReturn>(target: object, key: string, ...args: unknown[]): TReturn => {
  const value = readValue<unknown>(target, key);
  if (typeof value !== 'function') {
    throw new Error(`[MinimapBridgeModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createMinimapBridgeModulePorts = (scene: MainScene): MinimapBridgeModulePorts => {
  return {
    cameras: readRequiredValue(scene, 'cameras'),
    sys: readRequiredValue(scene, 'sys'),
    getCurrentMapArea: () => readValue(scene, 'currentMapArea') ?? null,
    worldToGridContinuous: (worldX: number, worldY: number) => {
      return callSceneMethod(scene, 'worldToGridContinuous', worldX, worldY);
    },
  };
};

export class MinimapBridgeModule implements SceneModule<MainScene> {
  readonly key = 'minimapBridge';

  private readonly ports: MinimapBridgeModulePorts;

  constructor(private readonly scene: MainScene, ports?: MinimapBridgeModulePorts) {
    this.ports = ports ?? createMinimapBridgeModulePorts(scene);
  }

  init(_context: SceneContext<MainScene>): void {
    void _context;
  }

  onCreate(): void {
    miniMapService.initialize(this.scene);
  }

  onShutdown(): void {
    miniMapService.shutdown();
  }

  emitViewportUpdate(): void {
    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea || !this.ports.sys.isActive()) {
      return;
    }

    const camera = this.ports.cameras.main;
    const view = camera.worldView;
    const topLeft = this.ports.worldToGridContinuous(view.x, view.y);
    const topRight = this.ports.worldToGridContinuous(view.x + view.width, view.y);
    const bottomLeft = this.ports.worldToGridContinuous(view.x, view.y + view.height);
    const bottomRight = this.ports.worldToGridContinuous(view.x + view.width, view.y + view.height);

    if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
      return;
    }

    const centerX = (topLeft.x + topRight.x + bottomLeft.x + bottomRight.x) / 4;
    const centerY = (topLeft.y + topRight.y + bottomLeft.y + bottomRight.y) / 4;

    const horizontalEdges = [
      Math.abs(topRight.x - topLeft.x),
      Math.abs(bottomRight.x - bottomLeft.x),
    ].filter((value) => Number.isFinite(value));

    const verticalEdges = [
      Math.abs(bottomLeft.y - topLeft.y),
      Math.abs(bottomRight.y - topRight.y),
    ].filter((value) => Number.isFinite(value));

    const edgeWidth = horizontalEdges.length
      ? horizontalEdges.reduce((acc, value) => acc + value, 0) / horizontalEdges.length
      : 0;
    const edgeHeight = verticalEdges.length
      ? verticalEdges.reduce((acc, value) => acc + value, 0) / verticalEdges.length
      : 0;

    const width = Math.max(0.0001, edgeWidth);
    const height = Math.max(0.0001, edgeHeight);

    const detail: ViewportUpdateDetail = {
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
    };

    miniMapService.updateViewport({
      ...detail,
      zoom: camera.zoom,
    });
  }
}
