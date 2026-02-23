import Phaser from 'phaser';
import {
  PathPreviewDetail,
  PICKUP_STATE_SYNC_EVENT,
  PickupStateSyncDetail,
  PATH_PREVIEW_EVENT,
  TILE_CLICK_EVENT,
} from '../../../events';
import { TileType } from '../../../interfaces/types';
import { resolveCardinalDirection } from '../../../combat/combatSystem';
import type { MainScene } from '../../MainScene';
import type { InputModulePorts } from '../contracts/ModulePorts';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const readRequiredValue = <T>(target: object, key: string): T => {
  const value = readValue<T>(target, key);
  if (value === undefined || value === null) {
    throw new Error(`[InputModule] Missing required scene value: ${key}`);
  }
  return value;
};

const callSceneMethod = <TReturn>(target: object, key: string, ...args: unknown[]): TReturn => {
  const value = readValue<unknown>(target, key);
  if (typeof value !== 'function') {
    throw new Error(`[InputModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createInputModulePorts = (scene: MainScene): InputModulePorts => {
  return {
    cameras: readRequiredValue(scene, 'cameras'),
    sys: readRequiredValue(scene, 'sys'),
    pathGraphics: readRequiredValue(scene, 'pathGraphics'),
    getCurrentMapArea: () => readValue(scene, 'currentMapArea') ?? null,
    setCurrentMapArea: (area) => {
      Reflect.set(scene, 'currentMapArea', area);
    },
    getPlayerInitialPosition: () => readValue(scene, 'playerInitialPosition'),
    getLastPlayerGridPosition: () => readValue(scene, 'lastPlayerGridPosition') ?? null,
    getCoverDebugGraphics: () => readValue(scene, 'coverDebugGraphics'),
    worldToGrid: (worldX: number, worldY: number) => callSceneMethod(scene, 'worldToGrid', worldX, worldY),
    getIsoMetrics: () => callSceneMethod(scene, 'getIsoMetrics'),
    calculatePixelPosition: (gridX: number, gridY: number) => callSceneMethod(scene, 'calculatePixelPosition', gridX, gridY),
    getDiamondPoints: (centerX: number, centerY: number, width: number, height: number) => {
      return callSceneMethod(scene, 'getDiamondPoints', centerX, centerY, width, height);
    },
    renderStaticProps: () => {
      callSceneMethod(scene, 'renderStaticProps');
    },
  };
};

export class InputModule implements SceneModule<MainScene> {
  readonly key = 'input';

  private context!: SceneContext<MainScene>;

  private readonly ports: InputModulePorts;

  constructor(scene: MainScene, ports?: InputModulePorts) {
    this.ports = ports ?? createInputModulePorts(scene);
  }

  init(context: SceneContext<MainScene>): void {
    this.context = context;
  }

  onCreate(): void {
    this.context.listenWindow(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    this.context.listenWindow(PICKUP_STATE_SYNC_EVENT, this.handlePickupStateSync as EventListener);
    this.context.listenInput('pointerdown', this.handlePointerDown, this);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea || !this.ports.sys.isActive()) {
      return;
    }

    if (!pointer.leftButtonDown()) {
      return;
    }

    const worldPoint = this.ports.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPosition = this.ports.worldToGrid(worldPoint.x, worldPoint.y);

    if (!gridPosition) {
      return;
    }

    const { x, y } = gridPosition;

    if (x < 0 || y < 0 || x >= currentMapArea.width || y >= currentMapArea.height) {
      return;
    }

    const tile = currentMapArea.tiles[y][x];
    if (!tile.isWalkable && tile.type !== TileType.DOOR) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(TILE_CLICK_EVENT, {
        detail: {
          position: gridPosition,
          areaId: currentMapArea.id,
        },
      })
    );
  }

  clearPathPreview(): void {
    this.ports.pathGraphics?.clear();
    this.renderCoverPreview();
  }

  private readonly handlePickupStateSync = (event: Event) => {
    const customEvent = event as CustomEvent<PickupStateSyncDetail>;
    const currentMapArea = this.ports.getCurrentMapArea();

    if (!this.ports.sys.isActive() || !currentMapArea) {
      return;
    }

    if (customEvent.detail?.areaId && customEvent.detail.areaId !== currentMapArea.id) {
      return;
    }

    this.ports.setCurrentMapArea(this.context.getState().world.currentMapArea);
    this.ports.renderStaticProps();
  };

  private readonly handlePathPreview = (event: Event): void => {
    if (!this.ports.sys.isActive()) {
      return;
    }

    const customEvent = event as CustomEvent<PathPreviewDetail>;
    const detail = customEvent.detail;

    if (!detail) {
      this.clearPathPreview();
      return;
    }

    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea || detail.areaId !== currentMapArea.id) {
      this.clearPathPreview();
      return;
    }

    this.ports.pathGraphics.clear();

    if (!detail.path || detail.path.length === 0) {
      return;
    }

    const { tileWidth, tileHeight } = this.ports.getIsoMetrics();
    const pathLength = detail.path.length;

    detail.path.forEach((position, index) => {
      const center = this.ports.calculatePixelPosition(position.x, position.y);
      const scale = index === detail.path.length - 1 ? 0.8 : 0.55;
      const points = this.ports.getDiamondPoints(center.x, center.y, tileWidth * scale, tileHeight * scale);

      let color: number;
      let alpha: number;

      if (index === detail.path.length - 1) {
        color = 0xffc857;
        alpha = 0.5;
      } else if (pathLength <= 3) {
        color = 0x34d399;
        alpha = 0.32;
      } else if (pathLength <= 6) {
        color = 0xfbbf24;
        alpha = 0.35;
      } else if (pathLength <= 9) {
        color = 0xfb923c;
        alpha = 0.38;
      } else {
        color = 0xf87171;
        alpha = 0.4;
      }

      this.ports.pathGraphics.fillStyle(color, alpha);
      this.ports.pathGraphics.fillPoints(points, true);
    });

    const destination = detail.path[detail.path.length - 1];
    this.renderCoverPreview(destination);
  };

  private renderCoverPreview(position?: { x: number; y: number }): void {
    const coverDebugGraphics = this.ports.getCoverDebugGraphics();
    if (!coverDebugGraphics) {
      return;
    }

    coverDebugGraphics.clear();

    const currentMapArea = this.ports.getCurrentMapArea();
    if (!position || !currentMapArea) {
      coverDebugGraphics.setVisible(false);
      return;
    }

    const reference = this.ports.getLastPlayerGridPosition() ?? this.ports.getPlayerInitialPosition();
    if (!reference) {
      coverDebugGraphics.setVisible(false);
      return;
    }

    const tile = currentMapArea.tiles[position.y]?.[position.x];
    if (!tile?.cover) {
      coverDebugGraphics.setVisible(false);
      return;
    }

    const incomingDirection = resolveCardinalDirection(position, reference);
    const coverLevel = tile.cover[incomingDirection];
    if (!coverLevel || coverLevel === 'none') {
      coverDebugGraphics.setVisible(false);
      return;
    }

    const { tileWidth, tileHeight } = this.ports.getIsoMetrics();
    const center = this.ports.calculatePixelPosition(position.x, position.y);
    const points = this.ports.getDiamondPoints(center.x, center.y, tileWidth * 0.7, tileHeight * 0.7);
    const [top, right, bottom, left] = points;

    const color = coverLevel === 'full' ? 0x38bdf8 : 0xfbbf24;
    const alpha = coverLevel === 'full' ? 0.35 : 0.25;

    coverDebugGraphics.fillStyle(color, alpha);
    switch (incomingDirection) {
      case 'north':
        coverDebugGraphics.fillTriangle(top.x, top.y, right.x, right.y, left.x, left.y);
        break;
      case 'south':
        coverDebugGraphics.fillTriangle(bottom.x, bottom.y, right.x, right.y, left.x, left.y);
        break;
      case 'east':
        coverDebugGraphics.fillTriangle(right.x, right.y, top.x, top.y, bottom.x, bottom.y);
        break;
      case 'west':
        coverDebugGraphics.fillTriangle(left.x, left.y, bottom.x, bottom.y, top.x, top.y);
        break;
    }

    coverDebugGraphics.fillCircle(center.x, center.y, tileHeight * 0.08);
    coverDebugGraphics.setVisible(true);
  }
}
