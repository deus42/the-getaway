import Phaser from 'phaser';
import {
  PathPreviewDetail,
  PICKUP_STATE_SYNC_EVENT,
  PickupStateSyncDetail,
  PATH_PREVIEW_EVENT,
  TILE_CLICK_EVENT,
} from '../../../events';
import { MapArea, Position, TileType } from '../../../interfaces/types';
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
    const resolvedPosition = this.resolvePointerTarget(worldPoint, currentMapArea);
    if (!resolvedPosition) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(TILE_CLICK_EVENT, {
        detail: {
          position: resolvedPosition,
          areaId: currentMapArea.id,
        },
      })
    );
  }

  private resolvePointerTarget(
    worldPoint: { x: number; y: number },
    mapArea: MapArea
  ): Position | null {
    const candidates = this.resolvePointerCandidates(worldPoint, mapArea);
    if (candidates.length === 0) {
      return null;
    }

    const selfPosition =
      this.getCurrentPlayerPosition() ??
      this.ports.getLastPlayerGridPosition() ??
      this.ports.getPlayerInitialPosition() ??
      null;
    let selfFallback: Position | null = null;

    for (const candidate of candidates) {
      if (this.isTileTraversable(mapArea, candidate)) {
        if (!selfPosition || !this.isSamePosition(candidate, selfPosition)) {
          return candidate;
        }
        if (!selfFallback) {
          selfFallback = candidate;
        }
        continue;
      }

      const resolved = this.findNearestWalkableTarget(candidate, mapArea, selfPosition);
      if (!resolved) {
        continue;
      }

      if (!selfPosition || !this.isSamePosition(resolved, selfPosition)) {
        return resolved;
      }

      if (!selfFallback) {
        selfFallback = resolved;
      }
    }

    return selfFallback;
  }

  private getCurrentPlayerPosition(): Position | null {
    const playerPosition = this.context.getState().player?.data?.position;
    if (!playerPosition) {
      return null;
    }
    return {
      x: playerPosition.x,
      y: playerPosition.y,
    };
  }

  private resolvePointerCandidates(
    worldPoint: { x: number; y: number },
    mapArea: MapArea
  ): Position[] {
    const { tileWidth, tileHeight } = this.ports.getIsoMetrics();
    const offsetX = tileWidth * 0.35;
    const offsetY = tileHeight * 0.35;
    const sampleOffsets: Array<{ x: number; y: number }> = [
      { x: 0, y: 0 },
      { x: offsetX, y: 0 },
      { x: -offsetX, y: 0 },
      { x: 0, y: offsetY },
      { x: 0, y: -offsetY },
      { x: offsetX, y: offsetY },
      { x: offsetX, y: -offsetY },
      { x: -offsetX, y: offsetY },
      { x: -offsetX, y: -offsetY },
    ];

    const seen = new Set<string>();
    const candidates: Position[] = [];

    sampleOffsets.forEach((offset) => {
      const sample = this.ports.worldToGrid(worldPoint.x + offset.x, worldPoint.y + offset.y);
      if (!sample) {
        return;
      }

      if (
        sample.x < 0 ||
        sample.y < 0 ||
        sample.x >= mapArea.width ||
        sample.y >= mapArea.height
      ) {
        return;
      }

      const key = `${sample.x}:${sample.y}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push(sample);
    });

    return candidates.sort((left, right) => {
      const leftWalkable = this.isTileTraversable(mapArea, left);
      const rightWalkable = this.isTileTraversable(mapArea, right);
      if (leftWalkable !== rightWalkable) {
        return leftWalkable ? -1 : 1;
      }

      const leftPixel = this.ports.calculatePixelPosition(left.x, left.y);
      const rightPixel = this.ports.calculatePixelPosition(right.x, right.y);
      const leftDistance = Phaser.Math.Distance.Squared(
        worldPoint.x,
        worldPoint.y,
        leftPixel.x,
        leftPixel.y
      );
      const rightDistance = Phaser.Math.Distance.Squared(
        worldPoint.x,
        worldPoint.y,
        rightPixel.x,
        rightPixel.y
      );

      return leftDistance - rightDistance;
    });
  }

  private findNearestWalkableTarget(
    start: Position,
    mapArea: MapArea,
    selfPosition: Position | null
  ): Position | null {
    const visited = new Set<string>();
    const queue: Position[] = [start];
    let selfFallback: Position | null = null;

    const serialize = (position: Position) => `${position.x}:${position.y}`;
    const directions: Array<{ x: number; y: number }> = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }

      const currentKey = serialize(current);
      if (visited.has(currentKey)) {
        continue;
      }
      visited.add(currentKey);

      if (
        current.x < 0 ||
        current.y < 0 ||
        current.x >= mapArea.width ||
        current.y >= mapArea.height
      ) {
        continue;
      }

      if (this.isTileTraversable(mapArea, current)) {
        if (!selfPosition || !this.isSamePosition(current, selfPosition)) {
          return current;
        }

        if (!selfFallback) {
          selfFallback = current;
        }
      }

      directions.forEach((direction) => {
        queue.push({
          x: current.x + direction.x,
          y: current.y + direction.y,
        });
      });
    }

    return selfFallback;
  }

  private isTileTraversable(mapArea: MapArea, position: Position): boolean {
    const tile = mapArea.tiles[position.y]?.[position.x];
    return Boolean(tile && (tile.isWalkable || tile.type === TileType.DOOR));
  }

  private isSamePosition(left: Position | null, right: Position | null): boolean {
    if (!left || !right) {
      return false;
    }

    return left.x === right.x && left.y === right.y;
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
    const pixelPath = detail.path.map((position) =>
      this.ports.calculatePixelPosition(position.x, position.y)
    );

    let coreColor = 0x34d399;
    if (pathLength > 9) {
      coreColor = 0xf87171;
    } else if (pathLength > 6) {
      coreColor = 0xfb923c;
    } else if (pathLength > 3) {
      coreColor = 0xfbbf24;
    }

    if (pixelPath.length > 1) {
      this.ports.pathGraphics.lineStyle(5.2, 0x22d3ee, 0.14);
      this.ports.pathGraphics.beginPath();
      this.ports.pathGraphics.moveTo(pixelPath[0].x, pixelPath[0].y);
      pixelPath.slice(1).forEach((point) => {
        this.ports.pathGraphics.lineTo(point.x, point.y);
      });
      this.ports.pathGraphics.strokePath();

      this.ports.pathGraphics.lineStyle(2.2, coreColor, 0.88);
      this.ports.pathGraphics.beginPath();
      this.ports.pathGraphics.moveTo(pixelPath[0].x, pixelPath[0].y);
      pixelPath.slice(1).forEach((point) => {
        this.ports.pathGraphics.lineTo(point.x, point.y);
      });
      this.ports.pathGraphics.strokePath();
    }

    pixelPath.forEach((point, index) => {
      const isDestination = index === pixelPath.length - 1;
      this.ports.pathGraphics.fillStyle(isDestination ? 0xffc857 : coreColor, isDestination ? 0.95 : 0.72);
      this.ports.pathGraphics.fillCircle(point.x, point.y, isDestination ? tileHeight * 0.14 : tileHeight * 0.08);
    });

    const destinationPixel = pixelPath[pixelPath.length - 1];
    const destinationDiamond = this.ports.getDiamondPoints(
      destinationPixel.x,
      destinationPixel.y,
      tileWidth * 0.72,
      tileHeight * 0.72
    );
    this.ports.pathGraphics.lineStyle(1.6, 0xffe29a, 0.94);
    this.ports.pathGraphics.strokePoints(destinationDiamond, true);
    this.ports.pathGraphics.lineStyle(0.9, 0x38bdf8, 0.74);
    this.ports.pathGraphics.strokeCircle(destinationPixel.x, destinationPixel.y, tileHeight * 0.28);

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
