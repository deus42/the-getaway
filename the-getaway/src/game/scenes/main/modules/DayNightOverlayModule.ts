import Phaser from 'phaser';
import { DEFAULT_DAY_NIGHT_CONFIG, getDayNightOverlayColor } from '../../../world/dayNightCycle';
import { DepthLayers } from '../../../utils/depth';
import type { MainScene } from '../../MainScene';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

type MainSceneDayNightInternals = {
  add: Phaser.GameObjects.GameObjectFactory;
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  scale: Phaser.Scale.ScaleManager;
  sys: Phaser.Scenes.Systems;
  inCombat: boolean;
  dayNightOverlay?: Phaser.GameObjects.Rectangle;
  currentGameTime: number;
  registerStaticDepth(target: Phaser.GameObjects.GameObject, depth: number): void;
  resolveAtmosphereProfile(baseOverlayRgba?: string): { overlayColor: number; overlayAlpha: number };
};

const COMBAT_OVERLAY_ALPHA_CAP = 0.28;
const COMBAT_OVERLAY_COLOR = 0xffffff;

export class DayNightOverlayModule implements SceneModule<MainScene> {
  readonly key = 'dayNightOverlay';

  private context!: SceneContext<MainScene>;

  constructor(private readonly scene: MainScene) {}

  init(context: SceneContext<MainScene>): void {
    this.context = context;
  }

  onCreate(): void {
    this.context.listenDocument('visibilitychange', this.handleVisibilityChange);
  }

  initializeDayNightOverlay(): void {
    const scene = this.getScene();
    const width = scene.scale.width;
    const height = scene.scale.height;

    scene.dayNightOverlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    scene.dayNightOverlay.setOrigin(0.5, 0.5);
    scene.dayNightOverlay.setScrollFactor(0);
    scene.registerStaticDepth(scene.dayNightOverlay, DepthLayers.DAY_NIGHT_OVERLAY);
    scene.dayNightOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    scene.dayNightOverlay.setSize(width, height);
    scene.dayNightOverlay.setDisplaySize(width, height);
    this.applyOverlayZoom();
  }

  applyOverlayZoom(): void {
    const scene = this.getScene();
    if (!scene.dayNightOverlay) {
      return;
    }
    const zoom = scene.cameras.main.zoom || 1;
    const inverseZoom = 1 / zoom;
    scene.dayNightOverlay.setScale(inverseZoom, inverseZoom);
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;
    scene.dayNightOverlay.setPosition(centerX, centerY);
  }

  resizeDayNightOverlay(): void {
    const scene = this.getScene();
    if (!scene.dayNightOverlay) {
      return;
    }
    const width = scene.scale.width;
    const height = scene.scale.height;
    scene.dayNightOverlay.setSize(width, height);
    scene.dayNightOverlay.setDisplaySize(width, height);
    this.applyOverlayZoom();
  }

  updateDayNightOverlay(): void {
    const scene = this.getScene();
    if (!scene.dayNightOverlay) {
      return;
    }

    const baseOverlay = getDayNightOverlayColor(scene.currentGameTime, DEFAULT_DAY_NIGHT_CONFIG);
    const atmosphere = scene.resolveAtmosphereProfile(baseOverlay);
    const overlayAlpha = scene.inCombat
      ? Math.min(atmosphere.overlayAlpha, COMBAT_OVERLAY_ALPHA_CAP)
      : atmosphere.overlayAlpha;
    const overlayColor = scene.inCombat ? COMBAT_OVERLAY_COLOR : atmosphere.overlayColor;
    scene.dayNightOverlay.setFillStyle(overlayColor, overlayAlpha);
  }

  private readonly handleVisibilityChange = (): void => {
    const scene = this.getScene();
    if (!scene.sys.isActive()) {
      return;
    }
    if (document.visibilityState === 'visible') {
      this.resizeDayNightOverlay();
      this.updateDayNightOverlay();
      scene.dayNightOverlay?.setVisible(true);
    }
  };

  private getScene(): MainSceneDayNightInternals {
    return this.scene as unknown as MainSceneDayNightInternals;
  }
}
