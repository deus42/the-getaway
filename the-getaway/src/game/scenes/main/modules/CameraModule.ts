import Phaser from 'phaser';
import type { MainScene } from '../../MainScene';
import type { CameraModulePorts, CameraRuntimeState } from '../contracts/ModulePorts';
import type { MapArea } from '../../../interfaces/types';
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

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const readRequiredValue = <T>(target: object, key: string): T => {
  const value = readValue<T>(target, key);
  if (value === undefined || value === null) {
    throw new Error(`[CameraModule] Missing required scene value: ${key}`);
  }
  return value;
};

const readNumber = (target: object, key: string, fallback: number): number => {
  const value = readValue<unknown>(target, key);
  return typeof value === 'number' ? value : fallback;
};

const callSceneMethod = <TReturn>(target: object, key: string, ...args: unknown[]): TReturn => {
  const value = readValue<unknown>(target, key);
  if (typeof value !== 'function') {
    throw new Error(`[CameraModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createCameraModulePorts = (scene: MainScene): CameraModulePorts => {
  return {
    cameras: readRequiredValue(scene, 'cameras'),
    scale: readRequiredValue(scene, 'scale'),
    sys: readRequiredValue(scene, 'sys'),
    tweens: readRequiredValue(scene, 'tweens'),
    getCurrentMapArea: () => readValue(scene, 'currentMapArea') ?? null,
    getPlayerInitialPosition: () => readValue(scene, 'playerInitialPosition'),
    getPlayerTokenContainer: () => {
      const token = readValue<{ container?: Phaser.GameObjects.Container }>(scene, 'playerToken');
      return token?.container;
    },
    getTileSize: () => readNumber(scene, 'tileSize', 0),
    setIsoOrigin: (originX: number, originY: number) => {
      Reflect.set(scene, 'isoOriginX', originX);
      Reflect.set(scene, 'isoOriginY', originY);
    },
    ensureIsoFactory: () => {
      callSceneMethod(scene, 'ensureIsoFactory');
    },
    ensureVisualPipeline: () => {
      callSceneMethod(scene, 'ensureVisualPipeline');
    },
    getIsoMetrics: () => callSceneMethod(scene, 'getIsoMetrics'),
    calculatePixelPosition: (gridX: number, gridY: number) => callSceneMethod(scene, 'calculatePixelPosition', gridX, gridY),
    computeIsoBounds: () => callSceneMethod(scene, 'computeIsoBounds'),
    renderStaticProps: () => {
      callSceneMethod(scene, 'renderStaticProps');
    },
    drawBackdrop: () => {
      callSceneMethod(scene, 'drawBackdrop');
    },
    drawMap: (tiles: MapArea['tiles']) => {
      callSceneMethod(scene, 'drawMap', tiles);
    },
    drawBuildingMasses: () => {
      callSceneMethod(scene, 'drawBuildingMasses');
    },
    drawBuildingLabels: () => {
      callSceneMethod(scene, 'drawBuildingLabels');
    },
    clearPathPreview: () => {
      callSceneMethod(scene, 'clearPathPreview');
    },
    resizeDayNightOverlay: () => {
      callSceneMethod(scene, 'resizeDayNightOverlay');
    },
    applyOverlayZoom: () => {
      callSceneMethod(scene, 'applyOverlayZoom');
    },
    emitViewportUpdate: () => {
      callSceneMethod(scene, 'emitViewportUpdate');
    },
    dispatchPlayerScreenPosition: () => {
      callSceneMethod(scene, 'dispatchPlayerScreenPosition');
    },
    isInCombat: () => Boolean(readValue(scene, 'inCombat')),
    readRuntimeState: () => ({
      isCameraFollowingPlayer: Boolean(readValue(scene, 'isCameraFollowingPlayer')),
      hasInitialZoomApplied: Boolean(readValue(scene, 'hasInitialZoomApplied')),
      userAdjustedZoom: Boolean(readValue(scene, 'userAdjustedZoom')),
      pendingCameraRestore: Boolean(readValue(scene, 'pendingCameraRestore')),
      preCombatZoom: readValue(scene, 'preCombatZoom') ?? null,
      preCombatUserAdjusted: Boolean(readValue(scene, 'preCombatUserAdjusted')),
      pendingRestoreUserAdjusted: readValue(scene, 'pendingRestoreUserAdjusted') ?? null,
      baselineCameraZoom: readNumber(scene, 'baselineCameraZoom', 1),
      cameraZoomTween: readValue(scene, 'cameraZoomTween') ?? null,
    }),
    writeRuntimeState: (state: CameraRuntimeState) => {
      Reflect.set(scene, 'isCameraFollowingPlayer', state.isCameraFollowingPlayer);
      Reflect.set(scene, 'hasInitialZoomApplied', state.hasInitialZoomApplied);
      Reflect.set(scene, 'userAdjustedZoom', state.userAdjustedZoom);
      Reflect.set(scene, 'pendingCameraRestore', state.pendingCameraRestore);
      Reflect.set(scene, 'preCombatZoom', state.preCombatZoom);
      Reflect.set(scene, 'preCombatUserAdjusted', state.preCombatUserAdjusted);
      Reflect.set(scene, 'pendingRestoreUserAdjusted', state.pendingRestoreUserAdjusted);
      Reflect.set(scene, 'baselineCameraZoom', state.baselineCameraZoom);
      Reflect.set(scene, 'cameraZoomTween', state.cameraZoomTween);
    },
  };
};

const createDefaultRuntimeState = (): CameraRuntimeState => ({
  isCameraFollowingPlayer: false,
  hasInitialZoomApplied: false,
  userAdjustedZoom: false,
  pendingCameraRestore: false,
  preCombatZoom: null,
  preCombatUserAdjusted: false,
  pendingRestoreUserAdjusted: null,
  baselineCameraZoom: 1,
  cameraZoomTween: null,
});

export class CameraModule implements SceneModule<MainScene> {
  readonly key = 'camera';

  private context!: SceneContext<MainScene>;

  private readonly ports: CameraModulePorts;

  private runtimeState: CameraRuntimeState;

  constructor(scene: MainScene, ports?: CameraModulePorts) {
    this.ports = ports ?? createCameraModulePorts(scene);
    this.runtimeState = {
      ...createDefaultRuntimeState(),
      ...this.ports.readRuntimeState?.(),
    };
    this.pushRuntimeStateToPorts();
  }

  init(context: SceneContext<MainScene>): void {
    this.context = context;
  }

  onCreate(): void {
    this.context.listenInput('wheel', this.handleWheel);
  }

  onResize(): void {
    if (this.ports.sys.isActive() && this.ports.getCurrentMapArea()) {
      this.setupCameraAndMap();
      this.enablePlayerCameraFollow();
      this.ports.resizeDayNightOverlay();
    }
  }

  onShutdown(): void {
    this.stopCameraZoomTween();
  }

  setupCameraAndMap(): void {
    const currentMapArea = this.ports.getCurrentMapArea();
    if (!currentMapArea) {
      return;
    }

    const { width, height } = currentMapArea;
    const { tileHeight, halfTileWidth, halfTileHeight } = this.ports.getIsoMetrics();
    const canvasWidth = this.ports.scale.width;
    const canvasHeight = this.ports.scale.height;

    this.ports.setIsoOrigin((height - 1) * halfTileWidth, tileHeight);
    this.ports.ensureIsoFactory();
    this.ports.ensureVisualPipeline();

    const isoWidth = (width + height) * halfTileWidth;
    const isoHeight = (width + height) * halfTileHeight;
    const zoomX = canvasWidth / isoWidth;
    const zoomY = canvasHeight / isoHeight;
    const fitZoom = Math.min(zoomX, zoomY);
    const desiredZoom = Phaser.Math.Clamp(fitZoom * DEFAULT_FIT_ZOOM_FACTOR, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM);

    const camera = this.ports.cameras.main;
    const restoreActive = this.runtimeState.pendingCameraRestore || Boolean(this.runtimeState.cameraZoomTween);

    if (!this.ports.isInCombat()) {
      if (!this.runtimeState.hasInitialZoomApplied) {
        if (!restoreActive) {
          camera.setZoom(desiredZoom);
        }
      } else if (!this.runtimeState.userAdjustedZoom && !restoreActive) {
        const zoomDelta = Math.abs(camera.zoom - desiredZoom);
        if (zoomDelta > 0.0008) {
          this.runtimeState.userAdjustedZoom = false;
          this.animateCameraZoom(desiredZoom);
        }
      }
    }

    const bounds = this.ports.computeIsoBounds();
    const padding = this.ports.getTileSize() * CAMERA_BOUND_PADDING_TILES;
    camera.setBounds(
      bounds.minX - padding,
      bounds.minY - padding,
      bounds.maxX - bounds.minX + padding * 2,
      bounds.maxY - bounds.minY + padding * 2
    );

    const centerX = (width - 1) / 2;
    const centerY = (height - 1) / 2;
    const centerPoint = this.ports.calculatePixelPosition(centerX, centerY);
    const playerInitialPosition = this.ports.getPlayerInitialPosition();
    const spawnPoint = playerInitialPosition
      ? this.ports.calculatePixelPosition(playerInitialPosition.x, playerInitialPosition.y)
      : null;
    const focusPoint = spawnPoint ?? centerPoint;

    if (!this.runtimeState.isCameraFollowingPlayer) {
      camera.centerOn(focusPoint.x, focusPoint.y + tileHeight * 0.25);
    } else {
      this.recenterCameraOnPlayer();
    }

    this.ports.renderStaticProps();
    this.ports.drawBackdrop();
    this.ports.drawMap(currentMapArea.tiles);
    this.ports.drawBuildingMasses();
    this.ports.drawBuildingLabels();
    this.ports.clearPathPreview();
    this.ports.resizeDayNightOverlay();
    this.ports.emitViewportUpdate();

    if (!this.ports.isInCombat() && !restoreActive) {
      this.runtimeState.baselineCameraZoom = camera.zoom;
    }
    this.runtimeState.hasInitialZoomApplied = true;
    this.pushRuntimeStateToPorts();
  }

  enablePlayerCameraFollow(): void {
    const tokenContainer = this.ports.getPlayerTokenContainer();
    if (!tokenContainer || !this.ports.sys.isActive()) {
      return;
    }

    const camera = this.ports.cameras.main;
    if (!this.runtimeState.isCameraFollowingPlayer) {
      camera.startFollow(tokenContainer, false, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
    }
    camera.setDeadzone(Math.max(120, this.ports.scale.width * 0.22), Math.max(160, this.ports.scale.height * 0.28));
    this.runtimeState.isCameraFollowingPlayer = true;
    this.pushRuntimeStateToPorts();
    this.recenterCameraOnPlayer();
    this.ports.dispatchPlayerScreenPosition();
  }

  recenterCameraOnPlayer(): void {
    const tokenContainer = this.ports.getPlayerTokenContainer();
    if (!tokenContainer || !this.ports.sys.isActive()) {
      return;
    }

    const camera = this.ports.cameras.main;
    camera.centerOn(tokenContainer.x, tokenContainer.y);
    this.ports.dispatchPlayerScreenPosition();
  }

  isFollowingPlayer(): boolean {
    return this.runtimeState.isCameraFollowingPlayer;
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
    const camera = this.ports.cameras.main;
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
    if (!this.ports.sys.isActive() || !this.ports.getCurrentMapArea()) {
      return;
    }

    const metrics = this.ports.getIsoMetrics();
    const pixelPos = this.ports.calculatePixelPosition(gridX, gridY);
    const desiredX = pixelPos.x;
    const desiredY = pixelPos.y + metrics.halfTileHeight;
    const { x: targetX, y: targetY } = this.clampCameraCenterTarget(desiredX, desiredY);
    const camera = this.ports.cameras.main;

    this.runtimeState.isCameraFollowingPlayer = false;
    this.pushRuntimeStateToPorts();
    camera.stopFollow();

    const finalize = () => {
      this.clampCameraToBounds(camera);
      this.ports.emitViewportUpdate();
    };

    if (animate) {
      camera.pan(targetX, targetY, 300, 'Sine.easeInOut', false, (_cam, progress) => {
        this.ports.emitViewportUpdate();
        if (progress === 1) {
          finalize();
        }
      });
    } else {
      camera.centerOn(targetX, targetY);
      finalize();
    }
  }

  stopCameraZoomTween(): void {
    if (this.runtimeState.cameraZoomTween) {
      this.runtimeState.cameraZoomTween.remove();
      this.runtimeState.cameraZoomTween = null;
      if (this.runtimeState.pendingCameraRestore) {
        this.runtimeState.pendingCameraRestore = false;
        if (this.runtimeState.pendingRestoreUserAdjusted !== null) {
          this.runtimeState.userAdjustedZoom = this.runtimeState.pendingRestoreUserAdjusted;
        }
        this.runtimeState.preCombatZoom = null;
        this.runtimeState.preCombatUserAdjusted = false;
        this.runtimeState.pendingRestoreUserAdjusted = null;
      }
      this.pushRuntimeStateToPorts();
    }
  }

  animateCameraZoom(targetZoom: number): void {
    if (!this.ports.sys.isActive()) {
      return;
    }

    const camera = this.ports.cameras.main;
    if (!camera) {
      return;
    }

    const clampedTarget = Phaser.Math.Clamp(targetZoom, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM);
    const currentZoom = camera.zoom;

    this.stopCameraZoomTween();

    if (Math.abs(currentZoom - clampedTarget) < 0.0005) {
      camera.setZoom(clampedTarget);
      this.ports.applyOverlayZoom();
      this.ports.emitViewportUpdate();
      if (!this.ports.isInCombat()) {
        this.runtimeState.baselineCameraZoom = camera.zoom;
      }
      if (this.runtimeState.pendingCameraRestore) {
        this.runtimeState.pendingCameraRestore = false;
        if (this.runtimeState.pendingRestoreUserAdjusted !== null) {
          this.runtimeState.userAdjustedZoom = this.runtimeState.pendingRestoreUserAdjusted;
        }
        this.runtimeState.preCombatZoom = null;
        this.runtimeState.preCombatUserAdjusted = false;
        this.runtimeState.pendingRestoreUserAdjusted = null;
      }
      this.pushRuntimeStateToPorts();
      return;
    }

    this.runtimeState.cameraZoomTween = this.ports.tweens.add({
      targets: camera,
      zoom: clampedTarget,
      duration: CAMERA_ZOOM_TWEEN_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.ports.applyOverlayZoom();
        this.ports.emitViewportUpdate();
      },
      onComplete: () => {
        this.runtimeState.cameraZoomTween = null;
        if (!this.ports.isInCombat()) {
          this.runtimeState.baselineCameraZoom = camera.zoom;
        }
        if (this.runtimeState.pendingCameraRestore) {
          this.runtimeState.pendingCameraRestore = false;
          if (this.runtimeState.pendingRestoreUserAdjusted !== null) {
            this.runtimeState.userAdjustedZoom = this.runtimeState.pendingRestoreUserAdjusted;
          }
          this.runtimeState.preCombatZoom = null;
          this.runtimeState.preCombatUserAdjusted = false;
          this.runtimeState.pendingRestoreUserAdjusted = null;
        }
        this.pushRuntimeStateToPorts();
      },
    });

    this.pushRuntimeStateToPorts();
  }

  zoomCameraForCombat(): void {
    const camera = this.ports.cameras.main;
    if (!camera) {
      return;
    }

    this.runtimeState.pendingCameraRestore = false;
    const explorationZoom = camera.zoom;
    if (this.runtimeState.preCombatZoom === null) {
      this.runtimeState.preCombatZoom = explorationZoom;
      this.runtimeState.preCombatUserAdjusted = this.runtimeState.userAdjustedZoom;
    }
    this.runtimeState.baselineCameraZoom = explorationZoom;

    const targetZoom = Math.min(
      MAX_CAMERA_ZOOM,
      Math.max(explorationZoom * COMBAT_ZOOM_MULTIPLIER, explorationZoom + COMBAT_ZOOM_MIN_DELTA)
    );
    this.runtimeState.userAdjustedZoom = false;
    this.pushRuntimeStateToPorts();
    this.animateCameraZoom(targetZoom);
  }

  restoreCameraAfterCombat(): void {
    const camera = this.ports.cameras.main;
    if (!camera) {
      return;
    }

    const targetZoom = this.runtimeState.preCombatZoom ?? this.runtimeState.baselineCameraZoom ?? camera.zoom;
    this.runtimeState.pendingRestoreUserAdjusted = this.runtimeState.preCombatUserAdjusted;
    this.runtimeState.userAdjustedZoom = true;
    this.runtimeState.pendingCameraRestore = true;
    this.pushRuntimeStateToPorts();
    this.animateCameraZoom(targetZoom);
  }

  resetForMapTransition(): void {
    this.runtimeState.hasInitialZoomApplied = false;
    this.runtimeState.userAdjustedZoom = false;
    this.runtimeState.pendingCameraRestore = false;
    this.runtimeState.preCombatZoom = null;
    this.runtimeState.preCombatUserAdjusted = false;
    this.runtimeState.pendingRestoreUserAdjusted = null;
    this.pushRuntimeStateToPorts();
  }

  private readonly handleWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void => {
    if (!this.ports.sys.isActive()) {
      return;
    }

    const camera = this.ports.cameras.main;
    const zoomMultiplier = deltaY > 0 ? 0.82 : 1.18;
    const currentZoom = camera.zoom;
    const targetZoom = Phaser.Math.Clamp(currentZoom * zoomMultiplier, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM);

    if (Math.abs(targetZoom - currentZoom) < 0.0005) {
      return;
    }

    if (!this.ports.isInCombat()) {
      this.runtimeState.userAdjustedZoom = true;
    }

    this.stopCameraZoomTween();

    let worldPointBefore: Phaser.Math.Vector2 | null = null;
    if (!this.runtimeState.isCameraFollowingPlayer) {
      worldPointBefore = camera.getWorldPoint(pointer.x, pointer.y);
    }

    camera.setZoom(targetZoom);

    if (this.runtimeState.isCameraFollowingPlayer) {
      camera.setDeadzone(Math.max(120, this.ports.scale.width * 0.22), Math.max(160, this.ports.scale.height * 0.28));
      this.recenterCameraOnPlayer();
    } else {
      const worldPointAfter = camera.getWorldPoint(pointer.x, pointer.y);
      const deltaWorldX = (worldPointBefore?.x ?? 0) - worldPointAfter.x;
      const deltaWorldY = (worldPointBefore?.y ?? 0) - worldPointAfter.y;
      camera.scrollX += deltaWorldX;
      camera.scrollY += deltaWorldY;
      this.clampCameraToBounds(camera);
    }

    this.ports.applyOverlayZoom();
    this.ports.emitViewportUpdate();

    if (!this.ports.isInCombat()) {
      this.runtimeState.baselineCameraZoom = targetZoom;
    }

    this.pushRuntimeStateToPorts();
  };

  private pushRuntimeStateToPorts(): void {
    this.ports.writeRuntimeState?.(this.runtimeState);
  }
}
