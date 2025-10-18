jest.mock('phaser', () => {
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const scenes = { Events: { PRE_UPDATE: 'preupdate', SHUTDOWN: 'shutdown' } };
  const gameObjects = { Events: { DESTROY: 'destroy' } };
  const math = { Clamp: clamp };
  return {
    __esModule: true,
    default: {
      Scenes: scenes,
      GameObjects: gameObjects,
      Math: math,
    },
    Scenes: scenes,
    GameObjects: gameObjects,
    Math: math,
  };
});

import Phaser from 'phaser';
import {
  DepthBias,
  DepthManager,
  MAX_DEPTH_BIAS,
  computeDepth,
  syncDepthPoint,
} from '../../utils/depth';

class MockEmitter {
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  public on(event: string, handler: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return this;
  }

  public once(event: string, handler: (...args: unknown[]) => void): this {
    const wrapper = (...args: unknown[]) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  public off(event: string, handler: (...args: unknown[]) => void): this {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
    return this;
  }

  public emit(event: string, ...args: unknown[]): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    [...set].forEach((listener) => listener(...args));
  }
}

class MockGameObject {
  public depth = 0;
  private destroyHandler: (() => void) | null = null;

  public setDepth(value: number): this {
    this.depth = value;
    return this;
  }

  public once(event: string, handler: () => void): this {
    if (event === Phaser.GameObjects.Events.DESTROY) {
      this.destroyHandler = handler;
    }
    return this;
  }

  public emitDestroy(): void {
    if (this.destroyHandler) {
      this.destroyHandler();
      this.destroyHandler = null;
    }
  }
}

describe('computeDepth', () => {
  it('prioritises screenY over screenX regardless of bias', () => {
    const higherY = computeDepth(10, 205, 0);
    const lowerYHighBias = computeDepth(900, 203, MAX_DEPTH_BIAS);
    expect(higherY).toBeGreaterThan(lowerYHighBias);
  });

  it('preserves ordering when screenY matches but screenX differs', () => {
    const left = computeDepth(10, 128, 0);
    const right = computeDepth(511, 128, 0);
    expect(right).toBeGreaterThan(left);
  });

  it('clamps bias to 10-bit range', () => {
    const base = computeDepth(0, 0, 0);
    const maxed = computeDepth(0, 0, MAX_DEPTH_BIAS * 4);
    const negative = computeDepth(0, 0, -MAX_DEPTH_BIAS * 4);
    expect(maxed - base).toBeLessThanOrEqual(MAX_DEPTH_BIAS);
    expect(base - negative).toBeLessThanOrEqual(MAX_DEPTH_BIAS);
  });
});

describe('DepthManager', () => {
  const createScene = () =>
    ({
      events: new MockEmitter(),
    } as unknown as Phaser.Scene);

  it('registers dynamic objects and applies depth immediately', () => {
    const scene = createScene();
    const depthManager = new DepthManager(scene);
    const object = new MockGameObject();

    syncDepthPoint(depthManager, object as unknown as any, 320, 480, DepthBias.CHARACTER);

    expect(object.depth).toBe(computeDepth(320, 480, DepthBias.CHARACTER));
  });

  it('recomputes depth on pre-update when coordinates mutate', () => {
    const scene = createScene();
    const depthManager = new DepthManager(scene);
    const object = new MockGameObject();

    syncDepthPoint(depthManager, object as unknown as any, 100, 150, DepthBias.CHARACTER);

    const registration = depthManager.getRegistration(object as unknown as any);
    expect(registration?.dynamicPoint).toBeDefined();
    if (registration?.dynamicPoint) {
      registration.dynamicPoint.x = 200;
      registration.dynamicPoint.y = 220;
    }

    (scene.events as unknown as MockEmitter).emit(Phaser.Scenes.Events.PRE_UPDATE);

    expect(object.depth).toBe(computeDepth(200, 220, DepthBias.CHARACTER));
  });

  it('unregisters GameObject after destroy event', () => {
    const scene = createScene();
    const depthManager = new DepthManager(scene);
    const object = new MockGameObject();

    syncDepthPoint(depthManager, object as unknown as any, 50, 60, DepthBias.CHARACTER);
    object.emitDestroy();

    const registration = depthManager.getRegistration(object as unknown as any);
    expect(registration).toBeUndefined();

    (scene.events as unknown as MockEmitter).emit(Phaser.Scenes.Events.PRE_UPDATE);

    expect(object.depth).toBe(computeDepth(50, 60, DepthBias.CHARACTER));
  });
});
