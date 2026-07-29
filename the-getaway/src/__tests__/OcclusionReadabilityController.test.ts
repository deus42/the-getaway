jest.mock('phaser', () => {
  class Rectangle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    constructor(x: number, y: number, width: number, height: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    public contains(x: number, y: number): boolean {
      return (
        x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height
      );
    }
  }

  const phaser = {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    },
    Geom: {
      Rectangle,
    },
  };

  return {
    __esModule: true,
    default: phaser,
    ...phaser,
  };
});

import Phaser from 'phaser';
import type { CharacterToken } from '../game/utils/IsoObjectFactory';
import {
  OcclusionReadabilityController,
  type OcclusionEntityHandle,
  type OcclusionMassHandle,
} from '../game/visual/world/OcclusionReadabilityController';

type AlphaNode = {
  alpha: number;
  setAlpha: (value: number) => AlphaNode;
};

type LabelNode = {
  alpha: number;
  scaleX: number;
  scaleY: number;
  setAlpha: (value: number) => LabelNode;
  setScale: (x: number, y?: number) => LabelNode;
};

type VisibilityNode = AlphaNode & { visible: boolean };

const createAlphaNode = (alpha: number): AlphaNode => {
  return {
    alpha,
    setAlpha(value: number) {
      this.alpha = value;
      return this;
    },
  };
};

const createLabelNode = (alpha: number, scaleX: number, scaleY: number): LabelNode => {
  return {
    alpha,
    scaleX,
    scaleY,
    setAlpha(value: number) {
      this.alpha = value;
      return this;
    },
    setScale(x: number, y?: number) {
      this.scaleX = x;
      this.scaleY = y ?? x;
      return this;
    },
  };
};

const createVisibilityNode = (alpha: number): VisibilityNode => ({
  ...createAlphaNode(alpha),
  visible: true,
});

const createMass = (
  alpha: number,
  id = 'mass',
  occlusionOrder = 0,
  occlusionPolygon?: Array<{ x: number; y: number }>
): OcclusionMassHandle & { occlusionOrder: number } => {
  const container = createAlphaNode(alpha) as unknown as Phaser.GameObjects.Container;
  return {
    id,
    container,
    bounds: new Phaser.Geom.Rectangle(0, 0, 100, 100),
    occlusionOrder,
    occlusionPolygon,
  };
};

const createEntity = (
  id = 'player',
  pixelX = 50,
  pixelY = 50
): OcclusionEntityHandle => {
  const token = {
    container: {},
    halo: createAlphaNode(0.16),
    beacon: createAlphaNode(0.22),
  } as unknown as CharacterToken;

  return {
    id,
    pixelX,
    pixelY,
    token,
    nameLabel: createLabelNode(0.74, 1.02, 1.01) as unknown as Phaser.GameObjects.Text,
    healthBar: createVisibilityNode(0.68) as unknown as Phaser.GameObjects.Graphics,
    indicator: createVisibilityNode(0.66) as unknown as Phaser.GameObjects.Graphics,
  };
};

describe('OcclusionReadabilityController', () => {
  it('applies overlap boost and restores baseline values on the next frame', () => {
    const controller = new OcclusionReadabilityController();
    const mass = createMass(1);
    const entity = createEntity();

    controller.applyOcclusionReadability({
      masses: [mass],
      entities: [entity],
      occlusionFadeFloor: 0.48,
      emissiveIntensity: 0.5,
    });

    expect(mass.container.alpha).toBeCloseTo(0.48, 6);
    expect(entity.token.halo.alpha).toBeGreaterThan(0.16);
    expect(entity.token.beacon.alpha).toBeGreaterThan(0.22);
    expect(entity.nameLabel?.scaleX).toBeGreaterThanOrEqual(1.06);

    entity.pixelX = 300;
    entity.pixelY = 300;
    controller.applyOcclusionReadability({
      masses: [mass],
      entities: [entity],
      occlusionFadeFloor: 0.48,
      emissiveIntensity: 0.5,
    });

    expect(mass.container.alpha).toBeCloseTo(1, 6);
    expect(entity.token.halo.alpha).toBeCloseTo(0.16, 6);
    expect(entity.token.beacon.alpha).toBeCloseTo(0.22, 6);
    expect(entity.nameLabel?.alpha).toBeCloseTo(0.74, 6);
    expect(entity.nameLabel?.scaleX).toBeCloseTo(1.02, 6);
    expect(entity.nameLabel?.scaleY).toBeCloseTo(1.01, 6);
    expect(entity.healthBar?.alpha).toBeCloseTo(0.68, 6);
    expect(entity.indicator?.alpha).toBeCloseTo(0.66, 6);
  });

  it('does not accumulate nameplate scaling across consecutive overlap frames', () => {
    const controller = new OcclusionReadabilityController();
    const mass = createMass(1);
    const entity = createEntity();

    controller.applyOcclusionReadability({
      masses: [mass],
      entities: [entity],
      occlusionFadeFloor: 0.56,
      emissiveIntensity: 0.3,
    });
    const firstScale = entity.nameLabel?.scaleX ?? 0;

    controller.applyOcclusionReadability({
      masses: [mass],
      entities: [entity],
      occlusionFadeFloor: 0.56,
      emissiveIntensity: 0.3,
    });
    const secondScale = entity.nameLabel?.scaleX ?? 0;

    expect(firstScale).toBeCloseTo(1.06, 6);
    expect(secondScale).toBeCloseTo(firstScale, 6);
    expect(mass.container.alpha).toBeCloseTo(0.56, 6);
  });

  it('does not fade a whole building for an unrelated NPC overlap', () => {
    const controller = new OcclusionReadabilityController();
    const mass = createMass(1);
    const player = createEntity('player', 300, 300);
    const npc = createEntity('lira', 50, 50);

    controller.applyOcclusionReadability({
      masses: [mass],
      entities: [player, npc],
      occlusionFadeFloor: 0.48,
      emissiveIntensity: 0.5,
    });

    expect(mass.container.alpha).toBe(1);
    expect(npc.token.halo.alpha).toBeCloseTo(0.16, 6);
  });

  it('fades only the frontmost mass covering the player', () => {
    const controller = new OcclusionReadabilityController();
    const rear = createMass(1, 'rear', 10);
    const front = createMass(1, 'front', 20);
    const player = createEntity();

    controller.applyOcclusionReadability({
      masses: [front, rear],
      entities: [player],
      occlusionFadeFloor: 0.48,
      emissiveIntensity: 0.5,
    });

    expect(rear.container.alpha).toBe(1);
    expect(front.container.alpha).toBeCloseTo(0.48, 6);
  });

  it('keeps all city masses opaque at overview zoom', () => {
    const controller = new OcclusionReadabilityController();
    const mass = createMass(1);
    const player = createEntity();
    const overviewState = {
      masses: [mass],
      entities: [player],
      occlusionFadeFloor: 0.48,
      emissiveIntensity: 0.5,
      cameraZoom: 0.5,
      overviewZoomThreshold: 0.65,
    };

    controller.applyOcclusionReadability(overviewState);

    expect(mass.container.alpha).toBe(1);
    expect(player.token.beacon.alpha).toBeGreaterThan(0.22);
  });

  it('does not fade for a broad-bounds hit outside the projected occlusion polygon', () => {
    const controller = new OcclusionReadabilityController();
    const mass = createMass(1, 'polygon', 1, [
      { x: 0, y: 0 },
      { x: 35, y: 0 },
      { x: 0, y: 35 },
    ]);
    const player = createEntity('player', 80, 80);

    controller.applyOcclusionReadability({
      masses: [mass],
      entities: [player],
      occlusionFadeFloor: 0.48,
      emissiveIntensity: 0.5,
    });

    expect(mass.container.alpha).toBe(1);
  });

  it('supports an explicit combat focus without treating every NPC as a focus', () => {
    const controller = new OcclusionReadabilityController();
    const mass = createMass(1);
    const player = createEntity('player', 300, 300);
    const enemy = createEntity('enemy', 50, 50);
    const npc = createEntity('npc', 50, 50);

    controller.applyOcclusionReadability({
      masses: [mass],
      entities: [player, enemy, npc],
      occlusionFadeFloor: 0.48,
      emissiveIntensity: 0.5,
      focusEntityIds: ['player', 'enemy'],
    });

    expect(mass.container.alpha).toBeCloseTo(0.48, 6);
    expect(enemy.token.beacon.alpha).toBeGreaterThan(0.22);
    expect(npc.token.beacon.alpha).toBeCloseTo(0.22, 6);
  });
});
