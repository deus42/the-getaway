import {
  isPointInPolygon,
  isPointWalkableWithClearance,
} from '../layout/validator';
import { LEVEL0_PLAYER_CLEARANCE_RADIUS } from '../layout/constants';
import type { Level0LayoutContract, WorldPoint } from '../layout/types';

export const LEVEL0_DIRECT_MOVEMENT_SPEED = 1.6;

export type MovementIntent =
  | { kind: 'idle' }
  | { kind: 'click'; target: WorldPoint }
  | { kind: 'keyboard'; direction: WorldPoint };

export interface DirectMovementState {
  position: WorldPoint;
  intent: MovementIntent;
  facing: WorldPoint;
}

export interface KeyboardInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface MovementFeedback {
  reason: 'outside-district' | 'blocked-surface' | 'occupied';
  reachableMarker?: WorldPoint;
}

export interface ClickIntentResult {
  accepted: boolean;
  intent: MovementIntent;
  feedback: MovementFeedback | null;
}

export interface MovementStepOptions {
  speed: number;
  collisionRadius: number;
  arrivalRadius: number;
}

export interface MovementStepResult extends DirectMovementState {
  collision: { blockedX: boolean; blockedY: boolean } | null;
  arrived: boolean;
}

export const createIdleMovementState = (position: WorldPoint): DirectMovementState => ({
  position: { ...position },
  intent: { kind: 'idle' },
  facing: { x: 0, y: 1 },
});

export const resolveClickIntent = (
  contract: Level0LayoutContract,
  origin: WorldPoint,
  target: WorldPoint,
  collisionRadius = LEVEL0_PLAYER_CLEARANCE_RADIUS
): ClickIntentResult => {
  if (isPointWalkableWithClearance(contract, target, collisionRadius)) {
    return {
      accepted: true,
      intent: { kind: 'click', target: { ...target } },
      feedback: null,
    };
  }

  const outsideDistrict = !isPointInPolygon(target, contract.bounds);
  const occupied = contract.buildingFootprints.some((footprint) =>
    isPointInPolygon(target, footprint.polygon)
  );

  return {
    accepted: false,
    intent: { kind: 'idle' },
    feedback: {
      reason: outsideDistrict ? 'outside-district' : occupied ? 'occupied' : 'blocked-surface',
      reachableMarker: findDirectReachableMarker(contract, origin, target, collisionRadius),
    },
  };
};

export const resolveIsometricKeyboardIntent = (
  state: DirectMovementState,
  input: KeyboardInputState
): DirectMovementState => {
  const rawDirection = {
    x:
      (input.down ? 1 : 0) -
      (input.up ? 1 : 0) -
      (input.left ? 1 : 0) +
      (input.right ? 1 : 0),
    y:
      (input.down ? 1 : 0) -
      (input.up ? 1 : 0) +
      (input.left ? 1 : 0) -
      (input.right ? 1 : 0),
  };
  const direction = normalize(rawDirection);

  if (direction.x === 0 && direction.y === 0) {
    return {
      ...state,
      intent: state.intent.kind === 'keyboard' ? { kind: 'idle' } : state.intent,
    };
  }

  return {
    ...state,
    intent: { kind: 'keyboard', direction },
    facing: direction,
  };
};

export const stepDirectMovement = (
  contract: Level0LayoutContract,
  state: DirectMovementState,
  deltaSeconds: number,
  options: MovementStepOptions
): MovementStepResult => {
  if (
    state.intent.kind === 'idle' ||
    !Number.isFinite(deltaSeconds) ||
    deltaSeconds <= 0 ||
    !Number.isFinite(options.speed) ||
    options.speed <= 0
  ) {
    return { ...state, collision: null, arrived: false };
  }

  const desiredVector = state.intent.kind === 'click'
    ? {
        x: state.intent.target.x - state.position.x,
        y: state.intent.target.y - state.position.y,
      }
    : state.intent.direction;
  const remainingDistance = Math.hypot(desiredVector.x, desiredVector.y);
  if (state.intent.kind === 'click' && remainingDistance <= options.arrivalRadius) {
    return {
      ...state,
      position: { ...state.intent.target },
      intent: { kind: 'idle' },
      collision: null,
      arrived: true,
    };
  }

  const direction = normalize(desiredVector);
  const maximumDistance = options.speed * deltaSeconds;
  const travelDistance = state.intent.kind === 'click'
    ? Math.min(maximumDistance, remainingDistance)
    : maximumDistance;
  const displacement = {
    x: direction.x * travelDistance,
    y: direction.y * travelDistance,
  };
  const candidate = {
    x: state.position.x + displacement.x,
    y: state.position.y + displacement.y,
  };

  if (canOccupy(contract, candidate, options.collisionRadius)) {
    const arrived =
      state.intent.kind === 'click' &&
      Math.hypot(state.intent.target.x - candidate.x, state.intent.target.y - candidate.y) <=
        options.arrivalRadius;
    return {
      position: arrived && state.intent.kind === 'click' ? { ...state.intent.target } : candidate,
      intent: arrived ? { kind: 'idle' } : state.intent,
      facing: direction,
      collision: null,
      arrived,
    };
  }

  const xCandidate = { x: candidate.x, y: state.position.y };
  const yCandidate = { x: state.position.x, y: candidate.y };
  const canMoveX =
    Math.abs(displacement.x) > 0.000001 &&
    canOccupy(contract, xCandidate, options.collisionRadius);
  const canMoveY =
    Math.abs(displacement.y) > 0.000001 &&
    canOccupy(contract, yCandidate, options.collisionRadius);

  let nextPosition = state.position;
  let collision = {
    blockedX: Math.abs(displacement.x) > 0.000001,
    blockedY: Math.abs(displacement.y) > 0.000001,
  };

  if (canMoveX && (!canMoveY || Math.abs(displacement.x) >= Math.abs(displacement.y))) {
    nextPosition = xCandidate;
    collision = { blockedX: false, blockedY: Math.abs(displacement.y) > 0.000001 };
  } else if (canMoveY) {
    nextPosition = yCandidate;
    collision = { blockedX: Math.abs(displacement.x) > 0.000001, blockedY: false };
  }

  const moved = nextPosition !== state.position;
  return {
    position: moved ? nextPosition : { ...state.position },
    intent: !moved && state.intent.kind === 'click' ? { kind: 'idle' } : state.intent,
    facing: direction,
    collision,
    arrived: false,
  };
};

const normalize = (point: WorldPoint): WorldPoint => {
  const length = Math.hypot(point.x, point.y);
  if (!Number.isFinite(length) || length <= 0.000001) {
    return { x: 0, y: 0 };
  }
  return { x: point.x / length, y: point.y / length };
};

const canOccupy = (
  contract: Level0LayoutContract,
  center: WorldPoint,
  radius: number
): boolean => isPointWalkableWithClearance(contract, center, radius);

const findDirectReachableMarker = (
  contract: Level0LayoutContract,
  origin: WorldPoint,
  target: WorldPoint,
  collisionRadius: number
): WorldPoint | undefined => {
  if (!isPointWalkableWithClearance(contract, origin, collisionRadius)) {
    return undefined;
  }

  const distance = Math.hypot(target.x - origin.x, target.y - origin.y);
  const steps = Math.max(1, Math.ceil(distance * 10));
  let lastWalkable = { ...origin };

  for (let index = 1; index <= steps; index += 1) {
    const ratio = index / steps;
    const candidate = {
      x: origin.x + (target.x - origin.x) * ratio,
      y: origin.y + (target.y - origin.y) * ratio,
    };
    if (!isPointWalkableWithClearance(contract, candidate, collisionRadius)) {
      break;
    }
    lastWalkable = candidate;
  }

  return lastWalkable;
};
