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

export const computeDepth = (screenX: number, screenY: number, bias: number = 0): number => {
  const baseX = (Math.floor(screenX) & MAX_DEPTH_BIAS) >>> 0;
  const baseY = Math.floor(screenY);
  const clampedBias = Phaser.Math.Clamp(Math.floor(bias), -MAX_DEPTH_BIAS, MAX_DEPTH_BIAS);
  return (baseY << 10) + baseX + clampedBias;
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
