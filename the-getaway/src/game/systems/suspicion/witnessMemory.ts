import { clamp } from '../../utils/math';
import {
  HeatProfile,
  WitnessMemory,
  WitnessMemorySnapshot,
  WitnessMemoryUpdateResult,
  WitnessObservation,
} from './types';

export const buildWitnessMemoryId = (
  witnessId: string,
  targetId: string,
  recognitionChannel: WitnessMemory['recognitionChannel']
): string => `${witnessId}:${targetId}:${recognitionChannel}`;

const clampUnit = (value: number): number => clamp(value, 0, 1);

export const calculateObservationCertainty = (observation: WitnessObservation): number => {
  const {
    baseCertainty,
    distanceModifier,
    lightingModifier,
    disguiseModifier,
    postureModifier,
  } = observation;
  const combined =
    baseCertainty *
    clampUnit(distanceModifier) *
    clampUnit(lightingModifier) *
    clampUnit(disguiseModifier) *
    clampUnit(postureModifier);
  return clampUnit(combined);
};

export const createWitnessMemory = (
  observation: WitnessObservation,
  profile: HeatProfile
): WitnessMemory => {
  const certainty = calculateObservationCertainty(observation);

  return {
    id: buildWitnessMemoryId(observation.witnessId, observation.targetId, observation.recognitionChannel),
    witnessId: observation.witnessId,
    witnessLabel: observation.witnessLabel ?? observation.witnessId,
    targetId: observation.targetId,
    zoneId: observation.zoneId,
    areaId: observation.areaId,
    source: observation.source,
    recognitionChannel: observation.recognitionChannel,
    certainty,
    halfLifeSeconds: profile.halfLifeSeconds,
    firstSeenAt: observation.timestamp,
    lastSeenAt: observation.timestamp,
    reinforcedAt: undefined,
    reported: observation.reported ?? false,
    suppressed: observation.existing?.suppressed ?? false,
    proximityWeight: clampUnit(observation.distanceModifier),
    location: observation.location,
  };
};

export const reinforceWitnessMemory = (
  memory: WitnessMemory,
  observation: WitnessObservation,
  profile: HeatProfile
): WitnessMemory => {
  const observationCertainty = calculateObservationCertainty(observation);
  const reinforcementBoost = observationCertainty * profile.reinforcementBonus;
  const nextCertainty = clampUnit(Math.max(memory.certainty, observationCertainty) + reinforcementBoost);

  return {
    ...memory,
    witnessLabel: observation.witnessLabel ?? memory.witnessLabel ?? memory.witnessId,
    certainty: nextCertainty,
    lastSeenAt: observation.timestamp,
    reinforcedAt: observation.timestamp,
    reported: memory.reported || observation.reported,
    suppressed: observation.existing?.suppressed ?? memory.suppressed,
    proximityWeight: clampUnit(
      Math.max(memory.proximityWeight, observation.distanceModifier)
    ),
    location: observation.location ?? memory.location,
  };
};

export const decayWitnessMemory = (
  memory: WitnessMemory,
  elapsedSeconds: number,
  profile: HeatProfile
): WitnessMemoryUpdateResult => {
  if (elapsedSeconds <= 0 || memory.certainty <= 0) {
    return {
      memory: { ...memory },
      pruned: memory.certainty < profile.certaintyFloor,
    };
  }

  const halfLife = memory.halfLifeSeconds > 0 ? memory.halfLifeSeconds : profile.halfLifeSeconds;
  const decayExponent = elapsedSeconds / halfLife;
  const decayFactor = Math.pow(0.5, decayExponent);

  let certainty = clampUnit(memory.certainty * decayFactor);

  if (memory.suppressed) {
    certainty *= profile.suppressionPenalty;
  }

  const pruned = certainty < profile.certaintyFloor;

  return {
    memory: {
      ...memory,
      certainty,
    },
    pruned,
  };
};

export const toWitnessMemorySnapshot = (memory: WitnessMemory): WitnessMemorySnapshot => ({
  id: memory.id,
  witnessId: memory.witnessId,
  witnessLabel: memory.witnessLabel,
  targetId: memory.targetId,
  zoneId: memory.zoneId,
  areaId: memory.areaId,
  source: memory.source,
  recognitionChannel: memory.recognitionChannel,
  certainty: memory.certainty,
  halfLifeSeconds: memory.halfLifeSeconds,
  firstSeenAt: memory.firstSeenAt,
  lastSeenAt: memory.lastSeenAt,
  reinforcedAt: memory.reinforcedAt,
  reported: memory.reported,
  suppressed: memory.suppressed,
  proximityWeight: memory.proximityWeight,
});

export const fromWitnessMemorySnapshot = (
  snapshot: WitnessMemorySnapshot
): WitnessMemory => ({
  id: snapshot.id,
  witnessId: snapshot.witnessId,
  witnessLabel: snapshot.witnessLabel,
  targetId: snapshot.targetId,
  zoneId: snapshot.zoneId,
  areaId: snapshot.areaId,
  source: snapshot.source,
  recognitionChannel: snapshot.recognitionChannel,
  certainty: snapshot.certainty,
  halfLifeSeconds: snapshot.halfLifeSeconds,
  firstSeenAt: snapshot.firstSeenAt,
  lastSeenAt: snapshot.lastSeenAt,
  reinforcedAt: snapshot.reinforcedAt,
  reported: snapshot.reported,
  suppressed: snapshot.suppressed,
  proximityWeight: snapshot.proximityWeight,
});
