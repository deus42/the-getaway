import type {
  Level0Anchor,
  Level0LayoutContract,
  WorldPoint,
} from '../layout/types';
import { isPointInPolygon } from '../layout/validator';

export type Level0InteractionStatus =
  | 'available'
  | 'too-far'
  | 'blocked'
  | 'unavailable'
  | 'none';

export interface Level0InteractionResult {
  status: Level0InteractionStatus;
  anchor: Level0Anchor | null;
  distance: number | null;
  reasonId: string | null;
}

export interface Level0InteractionOptions {
  preferredAnchorId?: string;
  maximumSearchRadius?: number;
  knownAnchorIds?: readonly string[];
  worldOwnedAnchorIds?: readonly string[];
  unavailableReasonByAnchorId?: Readonly<Record<string, string>>;
}

const isDirectlyInteractive = (anchor: Level0Anchor): boolean =>
  ['contact', 'entrance', 'terminal', 'hiding', 'blending', 'objective', 'interaction'].includes(
    anchor.kind
  ) || anchor.id === 'safehouse.departure';

const distanceBetween = (a: WorldPoint, b: WorldPoint): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

const isOccluded = (
  contract: Level0LayoutContract,
  origin: WorldPoint,
  target: WorldPoint
): boolean => {
  const distance = distanceBetween(origin, target);
  const steps = Math.max(2, Math.ceil(distance * 5));
  for (let index = 1; index < steps; index += 1) {
    const ratio = index / steps;
    const sample = {
      x: origin.x + (target.x - origin.x) * ratio,
      y: origin.y + (target.y - origin.y) * ratio,
    };
    if (
      contract.occluders.some((occluder) => isPointInPolygon(sample, occluder))
    ) {
      return true;
    }
  }
  return false;
};

const resolveCandidate = (
  contract: Level0LayoutContract,
  playerPosition: WorldPoint,
  anchor: Level0Anchor,
  options: Level0InteractionOptions
): Level0InteractionResult => {
  const distance = distanceBetween(playerPosition, anchor.position);
  if (options.knownAnchorIds && !options.knownAnchorIds.includes(anchor.id)) {
    return {
      status: 'unavailable',
      anchor,
      distance,
      reasonId: 'interaction.undiscovered',
    };
  }
  if (options.worldOwnedAnchorIds && !options.worldOwnedAnchorIds.includes(anchor.id)) {
    return {
      status: 'unavailable',
      anchor,
      distance,
      reasonId: 'interaction.wrong_owner',
    };
  }
  const interactionRange = Math.max(1.25, anchor.radius + 0.75);
  if (distance > interactionRange) {
    return {
      status: 'too-far',
      anchor,
      distance,
      reasonId: 'interaction.too_far',
    };
  }
  if (isOccluded(contract, playerPosition, anchor.position)) {
    return {
      status: 'blocked',
      anchor,
      distance,
      reasonId: 'interaction.occluded',
    };
  }
  const unavailableReason = options.unavailableReasonByAnchorId?.[anchor.id];
  if (unavailableReason) {
    return {
      status: 'unavailable',
      anchor,
      distance,
      reasonId: unavailableReason,
    };
  }
  return {
    status: 'available',
    anchor,
    distance,
    reasonId: null,
  };
};

export const resolveLevel0Interaction = (
  contract: Level0LayoutContract,
  playerPosition: WorldPoint,
  options: Level0InteractionOptions = {}
): Level0InteractionResult => {
  const candidates = contract.anchors.filter(isDirectlyInteractive);
  if (options.preferredAnchorId) {
    const preferred = candidates.find((anchor) => anchor.id === options.preferredAnchorId);
    return preferred
      ? resolveCandidate(contract, playerPosition, preferred, options)
      : { status: 'none', anchor: null, distance: null, reasonId: 'interaction.unknown_target' };
  }

  const maximumSearchRadius = Math.max(0, options.maximumSearchRadius ?? 4);
  const evaluated = candidates
    .filter((anchor) => !options.knownAnchorIds || options.knownAnchorIds.includes(anchor.id))
    .filter((anchor) =>
      !options.worldOwnedAnchorIds || options.worldOwnedAnchorIds.includes(anchor.id)
    )
    .map((anchor) => ({ anchor, distance: distanceBetween(playerPosition, anchor.position) }))
    .filter(({ distance }) => distance <= maximumSearchRadius)
    .sort((a, b) => a.distance - b.distance)
    .map(({ anchor }) => resolveCandidate(contract, playerPosition, anchor, options));

  if (evaluated.length === 0) {
    return { status: 'none', anchor: null, distance: null, reasonId: null };
  }
  return evaluated.find((result) => result.status === 'available') ?? evaluated[0]!;
};
