import { clamp } from '../../utils/math';
import { HeatProfile, HeatTier, WitnessMemory, ZoneHeatComputation } from './types';

interface WeightedMemory {
  memory: WitnessMemory;
  weight: number;
}

const computeMemoryWeight = (memory: WitnessMemory, profile: HeatProfile): number => {
  const proximityFactor = Math.pow(clamp(memory.proximityWeight, 0, 1), profile.proximityExponent);
  const reportMultiplier = memory.reported ? profile.reportMultiplier : 1;
  return clamp(memory.certainty * proximityFactor * reportMultiplier, 0, 1.5);
};

export const determineHeatTier = (heat: number, profile: HeatProfile): HeatTier => {
  if (heat >= profile.tierThresholds.crackdown) {
    return 'crackdown';
  }

  if (heat >= profile.tierThresholds.tracking) {
    return 'tracking';
  }

  return 'calm';
};

export const calculateZoneHeat = (
  zoneId: string,
  memories: WitnessMemory[],
  profile: HeatProfile
): ZoneHeatComputation => {
  if (memories.length === 0) {
    return {
      zoneId,
      totalHeat: 0,
      tier: 'calm',
      leadingWitnessIds: [],
    };
  }

  const activeMemories = memories.filter((memory) => {
    if (memory.suppressed) {
      return false;
    }
    return memory.certainty >= profile.certaintyFloor;
  });

  if (activeMemories.length === 0) {
    return {
      zoneId,
      totalHeat: 0,
      tier: 'calm',
      leadingWitnessIds: [],
    };
  }

  const weighted = activeMemories
    .map<WeightedMemory>((memory) => ({
      memory,
      weight: computeMemoryWeight(memory, profile),
    }))
    .sort((a, b) => b.weight - a.weight);

  const topCount = profile.topK > 0 ? profile.topK : 5;
  const topMemories = weighted.slice(0, topCount);

  const totalHeat = topMemories.reduce((acc, entry) => acc + entry.weight, 0);
  const tier = determineHeatTier(totalHeat, profile);

  return {
    zoneId,
    totalHeat,
    tier,
    leadingWitnessIds: topMemories.map((entry) => entry.memory.id),
  };
};
