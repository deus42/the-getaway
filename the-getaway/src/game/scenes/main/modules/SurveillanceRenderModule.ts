import Phaser from 'phaser';
import { AlertLevel, SurveillanceZoneState } from '../../../interfaces/types';
import { getVisionConeTiles } from '../../../combat/perception';
import { DepthBias } from '../../../utils/depth';
import CameraSprite from '../../../objects/CameraSprite';
import type { MainScene } from '../../MainScene';
import type { SurveillanceRenderModulePorts } from '../contracts/ModulePorts';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const callSceneMethod = <TReturn>(target: object, key: string, ...args: unknown[]): TReturn => {
  const value = readValue<unknown>(target, key);
  if (typeof value !== 'function') {
    throw new Error(`[SurveillanceRenderModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createSurveillanceRenderModulePorts = (scene: MainScene): SurveillanceRenderModulePorts => {
  return {
    getCurrentMapArea: () => readValue(scene, 'currentMapArea') ?? null,
    getVisionConeGraphics: () => readValue(scene, 'visionConeGraphics'),
    getTileSize: () => {
      const value = readValue<unknown>(scene, 'tileSize');
      return typeof value === 'number' ? value : 0;
    },
    getIsoMetrics: () => callSceneMethod(scene, 'getIsoMetrics'),
    calculatePixelPosition: (gridX: number, gridY: number) => callSceneMethod(scene, 'calculatePixelPosition', gridX, gridY),
    syncDepth: (target: Phaser.GameObjects.GameObject, pixelX: number, pixelY: number, bias: number) => {
      callSceneMethod(scene, 'syncDepth', target, pixelX, pixelY, bias);
    },
  };
};

export class SurveillanceRenderModule implements SceneModule<MainScene> {
  readonly key = 'surveillanceRender';

  private readonly cameraSprites: Map<string, CameraSprite> = new Map();

  private readonly ports: SurveillanceRenderModulePorts;

  constructor(private readonly scene: MainScene, ports?: SurveillanceRenderModulePorts) {
    this.ports = ports ?? createSurveillanceRenderModulePorts(scene);
  }

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
    const currentMapArea = this.ports.getCurrentMapArea();
    const visionConeGraphics = this.ports.getVisionConeGraphics();
    if (!currentMapArea || !visionConeGraphics) {
      return;
    }

    visionConeGraphics.clear();

    const enemies = currentMapArea.entities.enemies;
    const metrics = this.ports.getIsoMetrics();

    enemies.forEach((enemy) => {
      if (!enemy.visionCone || enemy.health <= 0) {
        return;
      }

      const visionTiles = getVisionConeTiles(enemy.position, enemy.visionCone, currentMapArea);
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
        const pixelPos = this.ports.calculatePixelPosition(tile.x, tile.y);
        const points = [
          pixelPos.x,
          pixelPos.y - metrics.tileHeight / 2,
          pixelPos.x + metrics.tileWidth / 2,
          pixelPos.y,
          pixelPos.x,
          pixelPos.y + metrics.tileHeight / 2,
          pixelPos.x - metrics.tileWidth / 2,
          pixelPos.y,
        ];

        visionConeGraphics.fillPoints(points, true);
      });
    });
  }

  updateSurveillanceCameras(zone?: SurveillanceZoneState, overlayEnabled = false): void {
    const currentMapArea = this.ports.getCurrentMapArea();
    if (!zone || !currentMapArea) {
      if (this.cameraSprites.size > 0) {
        this.clearCameraSprites();
      }
      return;
    }

    const remainingIds = new Set(this.cameraSprites.keys());
    const metrics = this.ports.getIsoMetrics();

    Object.values(zone.cameras).forEach((camera) => {
      remainingIds.delete(camera.id);
      const pixelPos = this.ports.calculatePixelPosition(camera.position.x, camera.position.y);
      let sprite = this.cameraSprites.get(camera.id);

      if (!sprite) {
        sprite = new CameraSprite(this.scene, pixelPos.x, pixelPos.y, {
          tileSize: this.ports.getTileSize(),
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
      this.ports.syncDepth(sprite, pixelPos.x, pixelPos.y, depthBias);
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
}
