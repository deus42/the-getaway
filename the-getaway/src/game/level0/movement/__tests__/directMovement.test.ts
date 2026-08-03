import type { Level0LayoutContract } from '../../layout/types';
import {
  createIdleMovementState,
  resolveClickIntent,
  resolveIsometricKeyboardIntent,
  stepDirectMovement,
} from '../directMovement';

const testContract: Level0LayoutContract = {
  id: 'test-layout',
  schemaVersion: 1,
  projection: { tileWidth: 64, tileHeight: 32, orientation: 'isometric-2:1' },
  bounds: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ],
  zones: [],
  traversalLoops: [],
  surfaces: [
    {
      id: 'surface.test',
      kind: 'road',
      walkable: true,
      polygon: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
    },
  ],
  buildingFootprints: [
    {
      id: 'building.test',
      function: 'collision-test',
      height: 1,
      polygon: [
        { x: 4, y: 2 },
        { x: 6, y: 2 },
        { x: 6, y: 8 },
        { x: 4, y: 8 },
      ],
    },
  ],
  entrances: [],
  droneRegions: [],
  anchors: [],
  occluders: [],
  semanticMaskIds: [],
  artLayerIds: [],
};

describe('direct Level 0 movement', () => {
  it('accepts a walkable click as a direct world-space intent', () => {
    const result = resolveClickIntent(testContract, { x: 1, y: 1 }, { x: 3, y: 1 });

    expect(result).toEqual({
      accepted: true,
      intent: { kind: 'click', target: { x: 3, y: 1 } },
      feedback: null,
    });
  });

  it('rejects a blocked click truthfully and never substitutes the marker as intent', () => {
    const result = resolveClickIntent(testContract, { x: 1, y: 5 }, { x: 5, y: 5 });

    expect(result.accepted).toBe(false);
    expect(result.intent).toEqual({ kind: 'idle' });
    expect(result.feedback?.reason).toBe('occupied');
    expect(result.feedback?.reachableMarker).toBeDefined();
    expect(result.feedback?.reachableMarker?.x).toBeLessThan(4);
  });

  it('rejects a visually open target that cannot fit the runtime player clearance', () => {
    const result = resolveClickIntent(testContract, { x: 1, y: 5 }, { x: 3.8, y: 5 });

    expect(result.accepted).toBe(false);
    expect(result.intent).toEqual({ kind: 'idle' });
    expect(result.feedback?.reason).toBe('blocked-surface');
    expect(result.feedback?.reachableMarker?.x).toBeLessThanOrEqual(3.68);
  });

  it('maps WASD to screen-readable isometric axes and overrides click movement', () => {
    const previous = {
      position: { x: 2, y: 2 },
      intent: { kind: 'click' as const, target: { x: 8, y: 8 } },
      facing: { x: 1, y: 1 },
    };

    const next = resolveIsometricKeyboardIntent(previous, {
      up: true,
      down: false,
      left: false,
      right: false,
    });

    expect(next.intent.kind).toBe('keyboard');
    expect(next.intent.kind === 'keyboard' ? next.intent.direction.x : 0).toBeCloseTo(-Math.SQRT1_2);
    expect(next.intent.kind === 'keyboard' ? next.intent.direction.y : 0).toBeCloseTo(-Math.SQRT1_2);
  });

  it('moves toward a click target without calculating a route', () => {
    const state = {
      position: { x: 1, y: 1 },
      intent: { kind: 'click' as const, target: { x: 3, y: 1 } },
      facing: { x: 1, y: 0 },
    };

    const next = stepDirectMovement(testContract, state, 0.5, {
      speed: 2,
      collisionRadius: 0.2,
      arrivalRadius: 0.05,
    });

    expect(next.position).toEqual({ x: 2, y: 1 });
    expect(next.intent.kind).toBe('click');
  });

  it('slides locally along a wall instead of routing around it', () => {
    const state = {
      position: { x: 3.45, y: 1.45 },
      intent: {
        kind: 'keyboard' as const,
        direction: { x: Math.SQRT1_2, y: Math.SQRT1_2 },
      },
      facing: { x: 1, y: 1 },
    };

    const next = stepDirectMovement(testContract, state, 0.5, {
      speed: 2,
      collisionRadius: 0.2,
      arrivalRadius: 0.05,
    });

    expect(next.position.x).toBeGreaterThan(state.position.x);
    expect(next.position.y).toBeCloseTo(state.position.y);
    expect(next.collision).toEqual({ blockedX: false, blockedY: true });
  });

  it('stops a click intent when direct travel reaches an immovable collision', () => {
    const state = {
      position: { x: 3.7, y: 5 },
      intent: { kind: 'click' as const, target: { x: 8, y: 5 } },
      facing: { x: 1, y: 0 },
    };

    const next = stepDirectMovement(testContract, state, 0.5, {
      speed: 2,
      collisionRadius: 0.2,
      arrivalRadius: 0.05,
    });

    expect(next.position).toEqual(state.position);
    expect(next.intent).toEqual(createIdleMovementState(state.position).intent);
    expect(next.collision).toEqual({ blockedX: true, blockedY: false });
  });
});
