import Phaser from 'phaser';
import { PathPreviewDetail, PICKUP_STATE_SYNC_EVENT, PickupStateSyncDetail, PATH_PREVIEW_EVENT, TILE_CLICK_EVENT } from '../../../events';
import { TileType, MapArea, Position } from '../../../interfaces/types';
import { resolveCardinalDirection } from '../../../combat/combatSystem';
import type { IsoMetrics } from '../../../utils/iso';
import type { MainScene } from '../../MainScene';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

type MainSceneInputInternals = {
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  sys: Phaser.Scenes.Systems;
  currentMapArea: MapArea | null;
  playerInitialPosition?: Position;
  lastPlayerGridPosition: Position | null;
  pathGraphics: Phaser.GameObjects.Graphics;
  coverDebugGraphics?: Phaser.GameObjects.Graphics;
  worldToGrid(worldX: number, worldY: number): Position | null;
  getIsoMetrics(): IsoMetrics;
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  getDiamondPoints(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): Phaser.Geom.Point[];
  renderStaticProps(): void;
};

export class InputModule implements SceneModule<MainScene> {
  readonly key = 'input';

  private context!: SceneContext<MainScene>;

  constructor(private readonly scene: MainScene) {}

  init(context: SceneContext<MainScene>): void {
    this.context = context;
  }

  onCreate(): void {
    this.context.listenWindow(PATH_PREVIEW_EVENT, this.handlePathPreview as EventListener);
    this.context.listenWindow(PICKUP_STATE_SYNC_EVENT, this.handlePickupStateSync as EventListener);
    this.context.listenInput('pointerdown', this.handlePointerDown, this);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const scene = this.getScene();
    if (!scene.currentMapArea || !scene.sys.isActive()) {
      return;
    }

    if (!pointer.leftButtonDown()) {
      return;
    }

    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPosition = scene.worldToGrid(worldPoint.x, worldPoint.y);

    if (!gridPosition) {
      return;
    }

    const { x, y } = gridPosition;

    if (
      x < 0 ||
      y < 0 ||
      x >= scene.currentMapArea.width ||
      y >= scene.currentMapArea.height
    ) {
      return;
    }

    const tile = scene.currentMapArea.tiles[y][x];
    if (!tile.isWalkable && tile.type !== TileType.DOOR) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(TILE_CLICK_EVENT, {
        detail: {
          position: gridPosition,
          areaId: scene.currentMapArea.id,
        },
      })
    );
  }

  clearPathPreview(): void {
    const scene = this.getScene();
    scene.pathGraphics?.clear();
    this.renderCoverPreview();
  }

  private readonly handlePickupStateSync = (event: Event) => {
    const scene = this.getScene();
    const customEvent = event as CustomEvent<PickupStateSyncDetail>;
    if (!scene.sys.isActive() || !scene.currentMapArea) {
      return;
    }

    if (customEvent.detail?.areaId && customEvent.detail.areaId !== scene.currentMapArea.id) {
      return;
    }

    scene.currentMapArea = this.context.getState().world.currentMapArea;
    scene.renderStaticProps();
  };

  private readonly handlePathPreview = (event: Event): void => {
    const scene = this.getScene();
    if (!scene.sys.isActive()) {
      return;
    }

    const customEvent = event as CustomEvent<PathPreviewDetail>;
    const detail = customEvent.detail;

    if (!detail) {
      this.clearPathPreview();
      return;
    }

    if (!scene.currentMapArea || detail.areaId !== scene.currentMapArea.id) {
      this.clearPathPreview();
      return;
    }

    scene.pathGraphics.clear();

    if (!detail.path || detail.path.length === 0) {
      return;
    }

    const { tileWidth, tileHeight } = scene.getIsoMetrics();
    const pathLength = detail.path.length;

    detail.path.forEach((position, index) => {
      const center = scene.calculatePixelPosition(position.x, position.y);
      const scale = index === detail.path.length - 1 ? 0.8 : 0.55;
      const points = scene.getDiamondPoints(
        center.x,
        center.y,
        tileWidth * scale,
        tileHeight * scale
      );

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

      scene.pathGraphics.fillStyle(color, alpha);
      scene.pathGraphics.fillPoints(points, true);
    });

    const destination = detail.path[detail.path.length - 1];
    this.renderCoverPreview(destination);
  };

  private renderCoverPreview(position?: Position): void {
    const scene = this.getScene();
    if (!scene.coverDebugGraphics) {
      return;
    }

    scene.coverDebugGraphics.clear();

    if (!position || !scene.currentMapArea) {
      scene.coverDebugGraphics.setVisible(false);
      return;
    }

    const reference = scene.lastPlayerGridPosition ?? scene.playerInitialPosition;
    if (!reference) {
      scene.coverDebugGraphics.setVisible(false);
      return;
    }

    const tile = scene.currentMapArea.tiles[position.y]?.[position.x];
    if (!tile?.cover) {
      scene.coverDebugGraphics.setVisible(false);
      return;
    }

    const incomingDirection = resolveCardinalDirection(position, reference);
    const coverLevel = tile.cover[incomingDirection];
    if (!coverLevel || coverLevel === 'none') {
      scene.coverDebugGraphics.setVisible(false);
      return;
    }

    const { tileWidth, tileHeight } = scene.getIsoMetrics();
    const center = scene.calculatePixelPosition(position.x, position.y);
    const points = scene.getDiamondPoints(center.x, center.y, tileWidth * 0.7, tileHeight * 0.7);
    const [top, right, bottom, left] = points;

    const color = coverLevel === 'full' ? 0x38bdf8 : 0xfbbf24;
    const alpha = coverLevel === 'full' ? 0.35 : 0.25;

    scene.coverDebugGraphics.fillStyle(color, alpha);
    switch (incomingDirection) {
      case 'north':
        scene.coverDebugGraphics.fillTriangle(top.x, top.y, right.x, right.y, left.x, left.y);
        break;
      case 'south':
        scene.coverDebugGraphics.fillTriangle(bottom.x, bottom.y, right.x, right.y, left.x, left.y);
        break;
      case 'east':
        scene.coverDebugGraphics.fillTriangle(right.x, right.y, top.x, top.y, bottom.x, bottom.y);
        break;
      case 'west':
        scene.coverDebugGraphics.fillTriangle(left.x, left.y, bottom.x, bottom.y, top.x, top.y);
        break;
    }

    scene.coverDebugGraphics.fillCircle(center.x, center.y, tileHeight * 0.08);
    scene.coverDebugGraphics.setVisible(true);
  }

  private getScene(): MainSceneInputInternals {
    return this.scene as unknown as MainSceneInputInternals;
  }
}
