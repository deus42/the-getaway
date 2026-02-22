import Phaser from 'phaser';
import { AlertLevel, MapArea, SurveillanceZoneState } from '../../../interfaces/types';
import { getVisionConeTiles } from '../../../combat/perception';
import { DepthBias } from '../../../utils/depth';
import CameraSprite from '../../../objects/CameraSprite';
import type { MainScene } from '../../MainScene';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

type MainSceneSurveillanceInternals = {
  currentMapArea: MapArea | null;
  visionConeGraphics?: Phaser.GameObjects.Graphics;
  tileSize: number;
  getIsoMetrics(): { tileWidth: number; tileHeight: number };
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  syncDepth(target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number): void;
};

export class SurveillanceRenderModule implements SceneModule<MainScene> {
  readonly key = 'surveillanceRender';

  private cameraSprites: Map<string, CameraSprite> = new Map();

  constructor(private readonly scene: MainScene) {}

  init(_context: SceneContext<MainScene>): void {
    void _context;
  }

  onShutdown(): void {
    this.clearCameraSprites();
  }

  clearCameraSprites(): void {
    this.cameraSprites.forEach((sprite) => {
      sprite.destroy(true);
    });
    this.cameraSprites.clear();
  }

  renderVisionCones(): void {
    const scene = this.getScene();
    if (!scene.currentMapArea || !scene.visionConeGraphics) {
      return;
    }

    const visionConeGraphics = scene.visionConeGraphics;
    visionConeGraphics.clear();

    const enemies = scene.currentMapArea.entities.enemies;
    const metrics = scene.getIsoMetrics();

    enemies.forEach((enemy) => {
      if (!enemy.visionCone || enemy.health <= 0) {
        return;
      }

      const visionTiles = getVisionConeTiles(
        enemy.position,
        enemy.visionCone,
        scene.currentMapArea!
      );

      if (visionTiles.length === 0) {
        return;
      }

      let coneColor = 0xffff00;
      let coneAlpha = 0.1;

      switch (enemy.alertLevel) {
        case AlertLevel.SUSPICIOUS:
          coneColor = 0xffaa00;
          coneAlpha = 0.15;
          break;
        case AlertLevel.INVESTIGATING:
          coneColor = 0xff6600;
          coneAlpha = 0.2;
          break;
        case AlertLevel.ALARMED:
          coneColor = 0xff0000;
          coneAlpha = 0.25;
          break;
        default:
          coneColor = 0xffff00;
          coneAlpha = 0.1;
      }

      visionConeGraphics.fillStyle(coneColor, coneAlpha);

      visionTiles.forEach((tile) => {
        const pixelPos = scene.calculatePixelPosition(tile.x, tile.y);
        const points = [
          pixelPos.x, pixelPos.y - metrics.tileHeight / 2,
          pixelPos.x + metrics.tileWidth / 2, pixelPos.y,
          pixelPos.x, pixelPos.y + metrics.tileHeight / 2,
          pixelPos.x - metrics.tileWidth / 2, pixelPos.y,
        ];

        visionConeGraphics.fillPoints(points, true);
      });
    });
  }

  updateSurveillanceCameras(zone?: SurveillanceZoneState, overlayEnabled = false): void {
    const scene = this.getScene();
    if (!zone || !scene.currentMapArea) {
      if (this.cameraSprites.size > 0) {
        this.clearCameraSprites();
      }
      return;
    }

    const remainingIds = new Set(this.cameraSprites.keys());
    const metrics = scene.getIsoMetrics();

    Object.values(zone.cameras).forEach((camera) => {
      remainingIds.delete(camera.id);
      const pixelPos = scene.calculatePixelPosition(camera.position.x, camera.position.y);
      let sprite = this.cameraSprites.get(camera.id);

      if (!sprite) {
        sprite = new CameraSprite(this.scene, pixelPos.x, pixelPos.y, {
          tileSize: scene.tileSize,
          rangeTiles: camera.range,
          fieldOfView: camera.fieldOfView,
          initialDirection: camera.currentDirection,
        });
        this.cameraSprites.set(camera.id, sprite);
      } else {
        sprite.setPosition(pixelPos.x, pixelPos.y);
        sprite.setRangeTiles(camera.range);
      }

      const depthBias = DepthBias.PROP_TALL + Math.round(metrics.tileHeight * 0.5);
      scene.syncDepth(sprite, pixelPos.x, pixelPos.y, depthBias);
      sprite.setOverlayVisible(overlayEnabled);
      sprite.setActiveState(camera.isActive);
      sprite.setAlertState(camera.alertState);
      sprite.setDirection(camera.currentDirection);
    });

    remainingIds.forEach((cameraId) => {
      const sprite = this.cameraSprites.get(cameraId);
      if (sprite) {
        sprite.destroy(true);
      }
      this.cameraSprites.delete(cameraId);
    });
  }

  private getScene(): MainSceneSurveillanceInternals {
    return this.scene as unknown as MainSceneSurveillanceInternals;
  }
}
