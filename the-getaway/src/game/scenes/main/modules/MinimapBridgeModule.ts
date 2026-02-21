import Phaser from 'phaser';
import { MapArea } from '../../../interfaces/types';
import { miniMapService } from '../../../services/miniMapService';
import { ViewportUpdateDetail } from '../../../events';
import type { MainScene } from '../../MainScene';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

type MainSceneMinimapInternals = {
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  sys: Phaser.Scenes.Systems;
  currentMapArea: MapArea | null;
  worldToGridContinuous(worldX: number, worldY: number): { x: number; y: number } | null;
};

export class MinimapBridgeModule implements SceneModule<MainScene> {
  readonly key = 'minimapBridge';

  constructor(private readonly scene: MainScene) {}

  init(_context: SceneContext<MainScene>): void {
    // No-op for now: minimap lifecycle only needs create/shutdown hooks.
    void _context;
  }

  onCreate(): void {
    miniMapService.initialize(this.scene);
  }

  onShutdown(): void {
    miniMapService.shutdown();
  }

  emitViewportUpdate(): void {
    const scene = this.getScene();
    if (!scene.currentMapArea || !scene.sys.isActive()) {
      return;
    }

    const camera = scene.cameras.main;
    const view = camera.worldView;
    const topLeft = scene.worldToGridContinuous(view.x, view.y);
    const topRight = scene.worldToGridContinuous(view.x + view.width, view.y);
    const bottomLeft = scene.worldToGridContinuous(view.x, view.y + view.height);
    const bottomRight = scene.worldToGridContinuous(view.x + view.width, view.y + view.height);

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

  private getScene(): MainSceneMinimapInternals {
    return this.scene as unknown as MainSceneMinimapInternals;
  }
}
