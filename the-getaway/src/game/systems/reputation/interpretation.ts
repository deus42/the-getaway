import { v4 as uuidv4 } from 'uuid';
import {
  ReputationEvent,
  WitnessCandidate,
  WitnessRecord,
  WitnessRecordTraitDelta,
  ReputationTrait,
} from './types';
import { INTENSITY_WEIGHTS, MIN_CONFIDENCE_TO_APPLY } from './constants';
import { clamp } from './utils';

export interface InterpretationContext {
  event: ReputationEvent;
  candidates: WitnessCandidate[];
  timestamp?: number;
}

const applyTraitWeight = (
  trait: ReputationTrait,
  bias: WitnessCandidate['bias'],
  baseDelta: number
): number => {
  const multiplier = bias.traitWeights?.[trait];
  if (typeof multiplier === 'number' && multiplier !== 0) {
    return baseDelta * multiplier;
  }
  return baseDelta;
};

const computeTraitConfidence = (
  baseConfidence: number,
  deltaMagnitude: number,
  isRumorOnly: boolean,
  bias: WitnessCandidate['bias']
): number => {
  const rumorPenalty = isRumorOnly ? 0.45 + (1 - bias.appetiteForRumors) * 0.3 : 0;
  const weightedConfidence =
    baseConfidence * clamp(deltaMagnitude / 30, 0.25, 1) * (1 - bias.skepticism);
  const adjusted = weightedConfidence * (1 - rumorPenalty);
  return clamp(adjusted, 0, 1);
};

const buildTraitDelta = (
  trait: ReputationTrait,
  delta: number,
  baseConfidence: number,
  candidate: WitnessCandidate
): WitnessRecordTraitDelta | null => {
  if (delta === 0) {
    return null;
  }

  const confidence = computeTraitConfidence(
    baseConfidence,
    Math.abs(delta),
    candidate.isRumorOnly,
    candidate.bias
  );

  if (confidence < MIN_CONFIDENCE_TO_APPLY) {
    return null;
  }

  return {
    trait,
    delta,
    confidence,
    source: candidate.isRumorOnly ? 'rumor' : 'witness',
  };
};

export const interpretWitnessRecords = ({
  event,
  candidates,
  timestamp,
}: InterpretationContext): WitnessRecord[] => {
  if (!candidates.length) {
    return [];
  }

  const eventTraits = event.traits ?? {};
  const intensityMultiplier = INTENSITY_WEIGHTS[event.intensity] ?? INTENSITY_WEIGHTS.minor;
  const recordTimestamp = typeof timestamp === 'number' ? timestamp : event.timestamp;

  return candidates
    .map<WitnessRecord | null>((candidate) => {
      const baseConfidence = clamp(
        candidate.baseConfidence * (candidate.isRumorOnly ? 0.65 : 1),
        0,
        1
      );

      const traits: WitnessRecordTraitDelta[] = Object.entries(eventTraits)
        .map(([traitKey, baseDelta]) => {
          const trait = traitKey as ReputationTrait;
          const weightedDelta =
            applyTraitWeight(trait, candidate.bias, baseDelta ?? 0) *
            intensityMultiplier *
            (candidate.isRumorOnly ? 0.6 : 1);

          return buildTraitDelta(trait, weightedDelta, baseConfidence, candidate);
        })
        .filter((entry): entry is WitnessRecordTraitDelta => {
          if (!entry) {
            return false;
          }
          return entry.delta !== 0;
        });

      if (!traits.length) {
        return null;
      }

      const confidence = clamp(
        traits.reduce((acc, trait) => acc + trait.confidence, 0) / traits.length,
        0,
        1
      );

      return {
        id: uuidv4(),
        eventId: event.id,
        witnessId: candidate.witnessId,
        witnessName: candidate.name,
        factionId: candidate.factionId,
        zoneId: candidate.zoneId,
        cellId: candidate.cellId,
        timestamp: recordTimestamp,
        visibilityScore: candidate.visibilityScore,
        confidence,
        isRumorOnly: candidate.isRumorOnly,
        traits,
      };
    })
    .filter((record): record is WitnessRecord => Boolean(record));
};
