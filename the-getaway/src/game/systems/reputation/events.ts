import { v4 as uuidv4 } from 'uuid';
import {
  ReputationEvent,
  ReputationEventInput,
  ReputationEventVisibility,
  ReputationTrait,
  REPUTATION_TRAITS,
} from './types';
import { clamp, resolveCellId } from './utils';
import { INTENSITY_WEIGHTS } from './constants';

const DEFAULT_VISIBILITY: ReputationEventVisibility = {
  base: 0.7,
  noiseLevel: 0.6,
  lightingFactor: 0.85,
  disguiseFactor: 0.8,
};

const sanitizeVisibility = (
  visibility: Partial<ReputationEventVisibility> | undefined
): ReputationEventVisibility => ({
  base: clamp(visibility?.base ?? DEFAULT_VISIBILITY.base, 0, 1),
  noiseLevel: clamp(visibility?.noiseLevel ?? DEFAULT_VISIBILITY.noiseLevel, 0, 1),
  lightingFactor: clamp(visibility?.lightingFactor ?? DEFAULT_VISIBILITY.lightingFactor, 0, 1),
  disguiseFactor: clamp(visibility?.disguiseFactor ?? DEFAULT_VISIBILITY.disguiseFactor, 0, 1),
  crowdDensity: clamp(visibility?.crowdDensity ?? 0.5, 0, 1),
});

const normalizeTraits = (
  traits: Partial<Record<ReputationTrait, number>>
): Partial<Record<ReputationTrait, number>> => {
  return REPUTATION_TRAITS.reduce<Partial<Record<ReputationTrait, number>>>((acc, trait) => {
    const value = traits[trait];
    if (typeof value === 'number' && Number.isFinite(value) && value !== 0) {
      acc[trait] = clamp(value, -30, 30);
    }
    return acc;
  }, {});
};

export const createReputationEvent = (input: ReputationEventInput): ReputationEvent => {
  const id = uuidv4();
  const timestamp = typeof input.timestamp === 'number' ? input.timestamp : Date.now();
  const cellId = input.cellId ?? resolveCellId(input.position);

  const visibility = sanitizeVisibility(input.visibility);

  const intensityWeight = INTENSITY_WEIGHTS[input.intensity] ?? INTENSITY_WEIGHTS.minor;
  const normalizedTraits = normalizeTraits(
    Object.keys(input.traits ?? {}).reduce<Partial<Record<ReputationTrait, number>>>(
      (acc, traitKey) => {
        if ((REPUTATION_TRAITS as readonly string[]).includes(traitKey)) {
          const trait = traitKey as ReputationTrait;
          acc[trait] = clamp(input.traits?.[trait] ?? 0, -40, 40) * intensityWeight;
        }
        return acc;
      },
      {}
    )
  );

  return {
    id,
    actorId: input.actorId,
    actorLabel: input.actorLabel ?? 'Player',
    zoneId: input.zoneId,
    cellId,
    position: { ...input.position },
    intensity: input.intensity,
    traits: normalizedTraits,
    tags: [...input.tags],
    timestamp,
    visibility,
    metadata: input.metadata ? { ...input.metadata } : undefined,
  };
};
