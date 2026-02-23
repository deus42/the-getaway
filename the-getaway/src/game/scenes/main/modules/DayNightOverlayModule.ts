import Phaser from 'phaser';
import { DEFAULT_DAY_NIGHT_CONFIG, getDayNightOverlayColor } from '../../../world/dayNightCycle';
import { DepthLayers } from '../../../utils/depth';
import type { MainScene } from '../../MainScene';
import type { DayNightOverlayModulePorts } from '../contracts/ModulePorts';
import { SceneContext } from '../SceneContext';
import { SceneModule } from '../SceneModule';

const COMBAT_OVERLAY_ALPHA_CAP = 0.28;
const COMBAT_OVERLAY_COLOR = 0xffffff;

const readValue = <T>(target: object, key: string): T | undefined => {
  return Reflect.get(target, key) as T | undefined;
};

const readRequiredValue = <T>(target: object, key: string): T => {
  const value = readValue<T>(target, key);
  if (value === undefined || value === null) {
    throw new Error(`[DayNightOverlayModule] Missing required scene value: ${key}`);
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
    throw new Error(`[DayNightOverlayModule] Missing required scene method: ${key}`);
  }

  return (value as (...methodArgs: unknown[]) => TReturn).apply(target, args);
};

const createDayNightOverlayModulePorts = (scene: MainScene): DayNightOverlayModulePorts => {
  return {
    add: readRequiredValue(scene, 'add'),
    cameras: readRequiredValue(scene, 'cameras'),
    scale: readRequiredValue(scene, 'scale'),
    sys: readRequiredValue(scene, 'sys'),
    getCurrentGameTime: () => readNumber(scene, 'currentGameTime', 0),
    isInCombat: () => Boolean(readValue(scene, 'inCombat')),
    resolveAtmosphereProfile: (baseOverlayRgba?: string) => {
      return callSceneMethod(scene, 'resolveAtmosphereProfile', baseOverlayRgba);
    },
    registerStaticDepth: (target: Phaser.GameObjects.GameObject, depth: number) => {
      callSceneMethod(scene, 'registerStaticDepth', target, depth);
    },
  };
};

export class DayNightOverlayModule implements SceneModule<MainScene> {
  readonly key = 'dayNightOverlay';

  private context!: SceneContext<MainScene>;

  private overlay?: Phaser.GameObjects.Rectangle;

  private readonly ports: DayNightOverlayModulePorts;

  constructor(scene: MainScene, ports?: DayNightOverlayModulePorts) {
    this.ports = ports ?? createDayNightOverlayModulePorts(scene);
  }

  init(context: SceneContext<MainScene>): void {
    this.context = context;
  }

  onCreate(): void {
    this.context.listenDocument('visibilitychange', this.handleVisibilityChange);
  }

  onShutdown(): void {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = undefined;
    }
  }

  initializeDayNightOverlay(): void {
    const width = this.ports.scale.width;
    const height = this.ports.scale.height;

    const overlay = this.ports.add.rectangle(0, 0, width, height, 0x000000, 0);
    overlay.setOrigin(0.5, 0.5);
    overlay.setScrollFactor(0);
    this.ports.registerStaticDepth(overlay, DepthLayers.DAY_NIGHT_OVERLAY);
    overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    overlay.setSize(width, height);
    overlay.setDisplaySize(width, height);

    this.overlay = overlay;
    this.applyOverlayZoom();
  }

  applyOverlayZoom(): void {
    const overlay = this.overlay;
    if (!overlay) {
      return;
    }

    const zoom = this.ports.cameras.main.zoom || 1;
    const inverseZoom = 1 / zoom;
    overlay.setScale(inverseZoom, inverseZoom);
    overlay.setPosition(this.ports.scale.width / 2, this.ports.scale.height / 2);
  }

  resizeDayNightOverlay(): void {
    const overlay = this.overlay;
    if (!overlay) {
      return;
    }

    const width = this.ports.scale.width;
    const height = this.ports.scale.height;
    overlay.setSize(width, height);
    overlay.setDisplaySize(width, height);
    this.applyOverlayZoom();
  }

  updateDayNightOverlay(): void {
    const overlay = this.overlay;
    if (!overlay) {
      return;
    }

    const baseOverlay = getDayNightOverlayColor(this.ports.getCurrentGameTime(), DEFAULT_DAY_NIGHT_CONFIG);
    const atmosphere = this.ports.resolveAtmosphereProfile(baseOverlay);
    const inCombat = this.ports.isInCombat();
    const overlayAlpha = inCombat ? Math.min(atmosphere.overlayAlpha, COMBAT_OVERLAY_ALPHA_CAP) : atmosphere.overlayAlpha;
    const overlayColor = inCombat ? COMBAT_OVERLAY_COLOR : atmosphere.overlayColor;

    overlay.setFillStyle(overlayColor, overlayAlpha);
  }

  private readonly handleVisibilityChange = (): void => {
    if (!this.ports.sys.isActive()) {
      return;
    }

    if (document.visibilityState === 'visible') {
      this.resizeDayNightOverlay();
      this.updateDayNightOverlay();
      this.overlay?.setVisible(true);
    }
  };
}
