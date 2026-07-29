import Phaser from 'phaser';

export const MAX_DEPTH_BIAS = 0x3ff;

export const DepthBias = Object.freeze({
  TILE_BASE: 0,
  TILE_OVERLAY: 48,
  PROP_LOW: 96,
  PROP_TALL: 128,
  CHARACTER_BASE: 160,
  CHARACTER: 192,
  EFFECT: 224,
  FLOATING_UI: 256,
  PATH_PREVIEW: 288,
  OVERLAY: 960,
  DEBUG: 992,
} as const);

export const DepthLayers = Object.freeze({
  BACKDROP: -20,
  CITY_SURROUND: -12,
  CITY_SURROUND_STRUCTURES: -11,
  MAP_BASE: -5,
  VISION_OVERLAY: 2,
  PATH_PREVIEW: 4,
  COVER_DEBUG: 5,
  DAY_NIGHT_OVERLAY: 100,
} as const);

export type DepthResolvableGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth;

type DepthRegistration = {
  target: DepthResolvableGameObject;
  staticDepth?: number;
  dynamicPoint?: DepthPoint;
  dynamicBias?: number;
  lastApplied?: number;
};

interface DepthPoint {
  x: number;
  y: number;
}

// Depth packs (screenY, screenX, bias) into one number with strict dominance:
// a 1px screenY difference always outranks any screenX difference, which
// always outranks any bias. The offsets keep every field non-negative across
// the map plus the decorative city surround (screenY ≥ -4096, |screenX| ≤ 8192)
// so packing stays monotonic — the previous 10-bit x mask wrapped over the
// ~5000px iso x range and bias could bleed into the next y rank (GET-181).
const DEPTH_Y_OFFSET = 4096;
const DEPTH_X_OFFSET = 8192;
const DEPTH_X_LIMIT = 16383;
const DEPTH_X_STEP = 2048; // room for bias in [-1023, 1023] shifted by +1024
const DEPTH_Y_STEP = DEPTH_X_STEP * (DEPTH_X_LIMIT + 1);

export const computeDepth = (screenX: number, screenY: number, bias: number = 0): number => {
  const baseX = Phaser.Math.Clamp(Math.floor(screenX) + DEPTH_X_OFFSET, 0, DEPTH_X_LIMIT);
  const baseY = Math.floor(screenY) + DEPTH_Y_OFFSET;
  const clampedBias = Phaser.Math.Clamp(Math.floor(bias), -MAX_DEPTH_BIAS, MAX_DEPTH_BIAS);
  return baseY * DEPTH_Y_STEP + baseX * DEPTH_X_STEP + clampedBias + 1024;
};

export class DepthManager {
  private registrations = new Map<DepthResolvableGameObject, DepthRegistration>();
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.handlePreUpdate = this.handlePreUpdate.bind(this);
    this.destroy = this.destroy.bind(this);
    this.scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, this.handlePreUpdate);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy);
  }

  public registerStatic(target: DepthResolvableGameObject, depth: number): void {
    if (this.registrations.has(target)) {
      return;
    }

    const registration: DepthRegistration = { target, staticDepth: depth };
    this.attachRegistration(target, registration);
    this.applyRegistration(registration);
  }

  public getRegistration(target: DepthResolvableGameObject): DepthRegistration | undefined {
    return this.registrations.get(target);
  }

  public refresh(target: DepthResolvableGameObject): void {
    const registration = this.registrations.get(target);
    if (!registration) {
      return;
    }
    this.applyRegistration(registration);
  }

  public unregister(target: DepthResolvableGameObject): void {
    this.registrations.delete(target);
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, this.handlePreUpdate);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy);
    this.registrations.clear();
  }

  public upsertDynamic(target: DepthResolvableGameObject, point: DepthPoint, bias: number): void {
    const existing = this.registrations.get(target);

    if (existing) {
      existing.dynamicPoint = point;
      existing.dynamicBias = bias;
      existing.staticDepth = undefined;
      this.applyRegistration(existing);
      return;
    }

    const registration: DepthRegistration = {
      target,
      dynamicPoint: point,
      dynamicBias: bias,
    };

    this.attachRegistration(target, registration);
    this.applyRegistration(registration);
  }

  private attachRegistration(target: DepthResolvableGameObject, registration: DepthRegistration): void {
    this.registrations.set(target, registration);
    target.once(Phaser.GameObjects.Events.DESTROY, () => this.unregister(target));
  }

  private handlePreUpdate(): void {
    if (this.destroyed) {
      return;
    }

    this.registrations.forEach((registration) => {
      if (!registration.dynamicPoint) {
        return;
      }
      this.applyRegistration(registration);
    });
  }

  private applyRegistration(registration: DepthRegistration): void {
    const { target, staticDepth, dynamicPoint } = registration;
    let resolvedDepth: number | undefined = staticDepth;

    if (dynamicPoint) {
      resolvedDepth = computeDepth(dynamicPoint.x, dynamicPoint.y, registration.dynamicBias ?? 0);
    }

    if (resolvedDepth === undefined || resolvedDepth === registration.lastApplied) {
      return;
    }

    target.setDepth(resolvedDepth);
    registration.lastApplied = resolvedDepth;
  }
}

export const syncDepthPoint = (
  manager: DepthManager | undefined,
  target: DepthResolvableGameObject,
  pixelX: number,
  pixelY: number,
  bias: number
): void => {
  if (manager) {
    const point = { x: pixelX, y: pixelY };
    manager.upsertDynamic(target, point, bias);
  } else {
    target.setDepth(computeDepth(pixelX, pixelY, bias));
  }
};
