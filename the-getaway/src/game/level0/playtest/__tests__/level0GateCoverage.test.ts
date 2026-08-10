import {
  GET204_GATE_ROUTE_CHECKPOINTS,
  GET204_GATE_ROUTE_START,
  appendVisitedGet204GateBlock,
  resolveNextGet204GateWaypoint,
  resolveGet204GateBlockId,
} from '../level0GateCoverage';
import { GET204_CITY_MOVEMENT_CONTRACT } from '../../art/get204City';
import {
  createIdleMovementState,
  LEVEL0_DIRECT_MOVEMENT_SPEED,
  resolveClickIntent,
  stepDirectMovement,
} from '../../movement/directMovement';
import { LEVEL0_PLAYER_CLEARANCE_RADIUS } from '../../layout/constants';
import { isPointWalkableWithClearance } from '../../layout/validator';

describe('GET-204 visible AI Gamer block coverage', () => {
  it.each([
    [{ x: 15.5, y: 31.5 }, 'safehouse-backstreet'],
    [{ x: 12, y: 12 }, 'public-transit-contact'],
    [{ x: 44, y: 12 }, 'controlled-logistics'],
    [{ x: 44, y: 34.5 }, 'service-seam'],
  ] as const)('maps world position %o to %s', (position, expected) => {
    expect(resolveGet204GateBlockId(position)).toBe(expected);
  });

  it('records each visited block once in traversal order', () => {
    const first = appendVisitedGet204GateBlock([], { x: 15.5, y: 31.5 });
    const repeated = appendVisitedGet204GateBlock(first, { x: 18, y: 30 });
    const second = appendVisitedGet204GateBlock(repeated, { x: 12, y: 12 });

    expect(repeated).toBe(first);
    expect(second).toEqual(['safehouse-backstreet', 'public-transit-contact']);
  });

  it('guides the visible worker through the next uncovered block', () => {
    expect(resolveNextGet204GateWaypoint(
      ['safehouse-backstreet'],
      { x: 15.5, y: 31.5 }
    )).toEqual({ blockId: 'public-transit-contact', direction: 'NORTH/UP' });
    expect(resolveNextGet204GateWaypoint(
      ['safehouse-backstreet', 'public-transit-contact'],
      { x: 12, y: 12 }
    )).toEqual({ blockId: 'controlled-logistics', direction: 'EAST/RIGHT' });
    expect(resolveNextGet204GateWaypoint(
      ['safehouse-backstreet', 'public-transit-contact', 'controlled-logistics', 'service-seam'],
      { x: 44, y: 34.5 }
    )).toBeNull();
  });

  it('publishes a collision-safe visible route through the four representative lot-padding points', () => {
    expect(GET204_GATE_ROUTE_CHECKPOINTS.filter(({ evidenceKind }) =>
      evidenceKind === 'lot-padding'
    ).map(({ position }) => position)).toEqual([
      { x: 19, y: 36 },
      { x: 15, y: 12.5 },
      { x: 42, y: 17 },
      { x: 47, y: 38.5 },
    ]);

    const route = [
      GET204_GATE_ROUTE_START,
      ...GET204_GATE_ROUTE_CHECKPOINTS.map(({ position }) => position),
    ];
    route.slice(0, -1).forEach((start, index) => {
      const end = route[index + 1];
      for (let progress = 0; progress <= 1; progress += 0.01) {
        expect(isPointWalkableWithClearance(GET204_CITY_MOVEMENT_CONTRACT, {
          x: start.x + (end.x - start.x) * progress,
          y: start.y + (end.y - start.y) * progress,
        })).toBe(true);
      }
    });

    let movement = createIdleMovementState(GET204_GATE_ROUTE_START);
    GET204_GATE_ROUTE_CHECKPOINTS.forEach(({ position }) => {
      const intent = resolveClickIntent(
        GET204_CITY_MOVEMENT_CONTRACT,
        movement.position,
        position
      );
      expect(intent.accepted).toBe(true);
      if (!intent.accepted) return;
      movement = { ...movement, intent: intent.intent };
      for (let frame = 0; frame < 2_000 && movement.intent.kind !== 'idle'; frame += 1) {
        movement = stepDirectMovement(
          GET204_CITY_MOVEMENT_CONTRACT,
          movement,
          0.05,
          {
            speed: LEVEL0_DIRECT_MOVEMENT_SPEED,
            collisionRadius: LEVEL0_PLAYER_CLEARANCE_RADIUS,
            arrivalRadius: 0.12,
          }
        );
      }
      expect(Math.hypot(
        movement.position.x - position.x,
        movement.position.y - position.y
      )).toBeLessThanOrEqual(0.25);
    });
  });
});
