import Phaser from 'phaser';
import { MapArea, Position } from '../../../interfaces/types';
import type { IsoMetrics } from '../../../utils/iso';
import type { MainScene } from '../../MainScene';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

const DEFAULT_FIT_ZOOM_FACTOR = 1.25;
const MIN_CAMERA_ZOOM = 0.6;
const MAX_CAMERA_ZOOM = 2.3;
const CAMERA_BOUND_PADDING_TILES = 6;
const CAMERA_FOLLOW_LERP = 0.08;
const COMBAT_ZOOM_MULTIPLIER = 1.28;
const COMBAT_ZOOM_MIN_DELTA = 0.22;
const CAMERA_ZOOM_TWEEN_MS = 340;

type MainSceneCameraInternals = {
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  scale: Phaser.Scale.ScaleManager;
  sys: Phaser.Scenes.Systems;
  tweens: Phaser.Tweens.TweenManager;
  currentMapArea: MapArea | null;
  playerInitialPosition?: Position;
  playerToken?: { container: Phaser.GameObjects.Container };
  inCombat: boolean;
  isCameraFollowingPlayer: boolean;
  hasInitialZoomApplied: boolean;
  userAdjustedZoom: boolean;
  pendingCameraRestore: boolean;
  preCombatZoom: number | null;
  preCombatUserAdjusted: boolean;
  pendingRestoreUserAdjusted: boolean | null;
  baselineCameraZoom: number;
  cameraZoomTween: Phaser.Tweens.Tween | null;
  isoOriginX: number;
  isoOriginY: number;
  tileSize: number;
  currentAtmosphereProfile?: unknown;
  lastAtmosphereRedrawBucket: number;
  ensureIsoFactory(): void;
  ensureVisualPipeline(): void;
  computeIsoBounds(): { minX: number; maxX: number; minY: number; maxY: number };
  getIsoMetrics(): IsoMetrics;
  calculatePixelPosition(gridX: number, gridY: number): { x: number; y: number };
  renderStaticProps(): void;
  drawBackdrop(): void;
  drawMap(tiles: MapArea['tiles']): void;
  drawBuildingMasses(): void;
  drawBuildingLabels(): void;
  clearPathPreview(): void;
  resizeDayNightOverlay(): void;
  applyOverlayZoom(): void;
  emitViewportUpdate(): void;
  dispatchPlayerScreenPosition(): void;
};

export class CameraModule implements SceneModule<MainScene> {
  readonly key = 'camera';

  private context!: SceneContext<MainScene>;

  constructor(private readonly scene: MainScene) {}

  init(context: SceneContext<MainScene>): void {
    this.context = context;
  }

  onCreate(): void {
    this.context.listenInput('wheel', this.handleWheel);
  }

  onResize(): void {
    const scene = this.getScene();
    if (scene.sys.isActive() && scene.currentMapArea) {
      this.setupCameraAndMap();
      this.enablePlayerCameraFollow();
      scene.resizeDayNightOverlay();
    }
  }

  setupCameraAndMap(): void {
    const scene = this.getScene();
    if (!scene.currentMapArea) {
      return;
    }

    const { width, height } = scene.currentMapArea;
    const { tileHeight, halfTileWidth, halfTileHeight } = scene.getIsoMetrics();
    const canvasWidth = scene.scale.width;
    const canvasHeight = scene.scale.height;

    scene.isoOriginX = (height - 1) * halfTileWidth;
    scene.isoOriginY = tileHeight;
    scene.ensureIsoFactory();
    scene.ensureVisualPipeline();

    const isoWidth = (width + height) * halfTileWidth;
    const isoHeight = (width + height) * halfTileHeight;
    const zoomX = canvasWidth / isoWidth;
    const zoomY = canvasHeight / isoHeight;
    const fitZoom = Math.min(zoomX, zoomY);
    const desiredZoom = Phaser.Math.Clamp(
      fitZoom * DEFAULT_FIT_ZOOM_FACTOR,
      MIN_CAMERA_ZOOM,
      MAX_CAMERA_ZOOM
    );

    const camera = scene.cameras.main;
    const restoreActive = scene.pendingCameraRestore || Boolean(scene.cameraZoomTween);

    if (!scene.inCombat) {
      if (!scene.hasInitialZoomApplied) {
        if (!restoreActive) {
          camera.setZoom(desiredZoom);
        }
      } else if (!scene.userAdjustedZoom && !restoreActive) {
        const zoomDelta = Math.abs(camera.zoom - desiredZoom);
        if (zoomDelta > 0.0008) {
          scene.userAdjustedZoom = false;
          this.animateCameraZoom(desiredZoom);
        }
      }
    }

    const bounds = scene.computeIsoBounds();
    const padding = scene.tileSize * CAMERA_BOUND_PADDING_TILES;
    camera.setBounds(
      bounds.minX - padding,
      bounds.minY - padding,
      bounds.maxX - bounds.minX + padding * 2,
      bounds.maxY - bounds.minY + padding * 2
    );

    const centerX = (width - 1) / 2;
    const centerY = (height - 1) / 2;
    const centerPoint = scene.calculatePixelPosition(centerX, centerY);
    const spawnPoint = scene.playerInitialPosition
      ? scene.calculatePixelPosition(scene.playerInitialPosition.x, scene.playerInitialPosition.y)
      : null;
    const focusPoint = spawnPoint ?? centerPoint;

    if (!scene.isCameraFollowingPlayer) {
      camera.centerOn(focusPoint.x, focusPoint.y + tileHeight * 0.25);
    } else {
      this.recenterCameraOnPlayer();
    }

    scene.renderStaticProps();
    scene.drawBackdrop();
    scene.drawMap(scene.currentMapArea.tiles);
    scene.drawBuildingMasses();
    scene.drawBuildingLabels();
    scene.clearPathPreview();
    scene.resizeDayNightOverlay();
    scene.emitViewportUpdate();

    if (!scene.inCombat && !restoreActive) {
      scene.baselineCameraZoom = camera.zoom;
    }
    scene.hasInitialZoomApplied = true;
  }

  enablePlayerCameraFollow(): void {
    const scene = this.getScene();
    if (!scene.playerToken || !scene.sys.isActive()) {
      return;
    }

    const camera = scene.cameras.main;
    if (!scene.isCameraFollowingPlayer) {
      camera.startFollow(scene.playerToken.container, false, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
    }
    camera.setDeadzone(Math.max(120, scene.scale.width * 0.22), Math.max(160, scene.scale.height * 0.28));
    scene.isCameraFollowingPlayer = true;
    this.recenterCameraOnPlayer();
    scene.dispatchPlayerScreenPosition();
  }

  recenterCameraOnPlayer(): void {
    const scene = this.getScene();
    if (!scene.playerToken || !scene.sys.isActive()) {
      return;
    }

    const camera = scene.cameras.main;
    camera.centerOn(scene.playerToken.container.x, scene.playerToken.container.y);
    scene.dispatchPlayerScreenPosition();
  }

  clampCameraToBounds(camera: Phaser.Cameras.Scene2D.Camera): void {
    const bounds = camera.getBounds();
    if (!bounds) {
      return;
    }

    const viewWidth = camera.width / camera.zoom;
    const viewHeight = camera.height / camera.zoom;
    const minX = bounds.x;
    const maxX = bounds.x + Math.max(0, bounds.width - viewWidth);
    const minY = bounds.y;
    const maxY = bounds.y + Math.max(0, bounds.height - viewHeight);

    camera.scrollX = Phaser.Math.Clamp(camera.scrollX, minX, maxX);
    camera.scrollY = Phaser.Math.Clamp(camera.scrollY, minY, maxY);
  }

  clampCameraCenterTarget(targetX: number, targetY: number): { x: number; y: number } {
    const scene = this.getScene();
    const camera = scene.cameras.main;
    const bounds = camera.getBounds();

    if (!bounds) {
      return { x: targetX, y: targetY };
    }

    const viewWidth = camera.worldView.width;
    const viewHeight = camera.worldView.height;
    const halfWidth = viewWidth / 2;
    const halfHeight = viewHeight / 2;

    const minX = bounds.x + halfWidth;
    const maxX = bounds.x + Math.max(halfWidth, bounds.width - halfWidth);
    const minY = bounds.y + halfHeight;
    const maxY = bounds.y + Math.max(halfHeight, bounds.height - halfHeight);

    const clampedX = Phaser.Math.Clamp(targetX, minX, Math.max(minX, maxX));
    const clampedY = Phaser.Math.Clamp(targetY, minY, Math.max(minY, maxY));

    return { x: clampedX, y: clampedY };
  }

  focusCameraOnGridPosition(gridX: number, gridY: number, animate = true): void {
    const scene = this.getScene();
    if (!scene.sys.isActive() || !scene.currentMapArea) {
      return;
    }

    const metrics = scene.getIsoMetrics();
    const pixelPos = scene.calculatePixelPosition(gridX, gridY);
    const desiredX = pixelPos.x;
    const desiredY = pixelPos.y + metrics.halfTileHeight;
    const { x: targetX, y: targetY } = this.clampCameraCenterTarget(desiredX, desiredY);
    const camera = scene.cameras.main;

    scene.isCameraFollowingPlayer = false;
    camera.stopFollow();

    const finalize = () => {
      this.clampCameraToBounds(camera);
      scene.emitViewportUpdate();
    };

    if (animate) {
      camera.pan(
        targetX,
        targetY,
        300,
        'Sine.easeInOut',
        false,
        (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        scene.emitViewportUpdate();
        if (progress === 1) {
          finalize();
        }
        }
      );
    } else {
      camera.centerOn(targetX, targetY);
      finalize();
    }
  }

  stopCameraZoomTween(): void {
    const scene = this.getScene();
    if (scene.cameraZoomTween) {
      scene.cameraZoomTween.remove();
      scene.cameraZoomTween = null;
      if (scene.pendingCameraRestore) {
        scene.pendingCameraRestore = false;
        if (scene.pendingRestoreUserAdjusted !== null) {
          scene.userAdjustedZoom = scene.pendingRestoreUserAdjusted;
        }
        scene.preCombatZoom = null;
        scene.preCombatUserAdjusted = false;
        scene.pendingRestoreUserAdjusted = null;
      }
    }
  }

  animateCameraZoom(targetZoom: number): void {
    const scene = this.getScene();
    if (!scene.sys.isActive()) {
      return;
    }
    const camera = scene.cameras.main;
    if (!camera) {
      return;
    }

    const clampedTarget = Phaser.Math.Clamp(targetZoom, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM);
    const currentZoom = camera.zoom;

    this.stopCameraZoomTween();

    if (Math.abs(currentZoom - clampedTarget) < 0.0005) {
      camera.setZoom(clampedTarget);
      scene.applyOverlayZoom();
      scene.emitViewportUpdate();
      if (!scene.inCombat) {
        scene.baselineCameraZoom = camera.zoom;
      }
      if (scene.pendingCameraRestore) {
        scene.pendingCameraRestore = false;
        if (scene.pendingRestoreUserAdjusted !== null) {
          scene.userAdjustedZoom = scene.pendingRestoreUserAdjusted;
        }
        scene.preCombatZoom = null;
        scene.preCombatUserAdjusted = false;
        scene.pendingRestoreUserAdjusted = null;
      }
      return;
    }

    scene.cameraZoomTween = scene.tweens.add({
      targets: camera,
      zoom: clampedTarget,
      duration: CAMERA_ZOOM_TWEEN_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        scene.applyOverlayZoom();
        scene.emitViewportUpdate();
      },
      onComplete: () => {
        scene.cameraZoomTween = null;
        if (!scene.inCombat) {
          scene.baselineCameraZoom = camera.zoom;
        }
        if (scene.pendingCameraRestore) {
          scene.pendingCameraRestore = false;
          if (scene.pendingRestoreUserAdjusted !== null) {
            scene.userAdjustedZoom = scene.pendingRestoreUserAdjusted;
          }
          scene.preCombatZoom = null;
          scene.preCombatUserAdjusted = false;
          scene.pendingRestoreUserAdjusted = null;
        }
      },
    });
  }

  zoomCameraForCombat(): void {
    const scene = this.getScene();
    const camera = scene.cameras.main;
    if (!camera) {
      return;
    }

    scene.pendingCameraRestore = false;
    const explorationZoom = camera.zoom;
    if (scene.preCombatZoom === null) {
      scene.preCombatZoom = explorationZoom;
      scene.preCombatUserAdjusted = scene.userAdjustedZoom;
    }
    scene.baselineCameraZoom = explorationZoom;
    const targetZoom = Math.min(
      MAX_CAMERA_ZOOM,
      Math.max(explorationZoom * COMBAT_ZOOM_MULTIPLIER, explorationZoom + COMBAT_ZOOM_MIN_DELTA)
    );
    scene.userAdjustedZoom = false;
    this.animateCameraZoom(targetZoom);
  }

  restoreCameraAfterCombat(): void {
    const scene = this.getScene();
    const camera = scene.cameras.main;
    if (!camera) {
      return;
    }

    const targetZoom = scene.preCombatZoom ?? scene.baselineCameraZoom ?? camera.zoom;
    scene.pendingRestoreUserAdjusted = scene.preCombatUserAdjusted;
    scene.userAdjustedZoom = true;
    scene.pendingCameraRestore = true;
    this.animateCameraZoom(targetZoom);
  }

  private readonly handleWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void => {
    const scene = this.getScene();
    if (!scene.sys.isActive()) {
      return;
    }

    const camera = scene.cameras.main;
    const zoomMultiplier = deltaY > 0 ? 0.82 : 1.18;
    const currentZoom = camera.zoom;
    const targetZoom = Phaser.Math.Clamp(
      currentZoom * zoomMultiplier,
      MIN_CAMERA_ZOOM,
      MAX_CAMERA_ZOOM
    );

    if (Math.abs(targetZoom - currentZoom) < 0.0005) {
      return;
    }

    if (!scene.inCombat) {
      scene.userAdjustedZoom = true;
    }

    this.stopCameraZoomTween();

    let worldPointBefore: Phaser.Math.Vector2 | null = null;
    if (!scene.isCameraFollowingPlayer) {
      worldPointBefore = camera.getWorldPoint(pointer.x, pointer.y);
    }

    camera.setZoom(targetZoom);

    if (scene.isCameraFollowingPlayer) {
      camera.setDeadzone(
        Math.max(120, scene.scale.width * 0.22),
        Math.max(160, scene.scale.height * 0.28)
      );
      this.recenterCameraOnPlayer();
    } else {
      const worldPointAfter = camera.getWorldPoint(pointer.x, pointer.y);
      const deltaWorldX = (worldPointBefore?.x ?? 0) - worldPointAfter.x;
      const deltaWorldY = (worldPointBefore?.y ?? 0) - worldPointAfter.y;
      camera.scrollX += deltaWorldX;
      camera.scrollY += deltaWorldY;
      this.clampCameraToBounds(camera);
    }

    scene.applyOverlayZoom();
    scene.emitViewportUpdate();

    if (!scene.inCombat) {
      scene.baselineCameraZoom = targetZoom;
    }
  };

  private getScene(): MainSceneCameraInternals {
    return this.scene as unknown as MainSceneCameraInternals;
  }
}
