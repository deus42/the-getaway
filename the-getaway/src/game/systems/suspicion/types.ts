import { Position } from '../../interfaces/types';

export type RecognitionChannel = 'face' | 'outfit' | 'vehicle' | 'voice';

export type SuspicionSource = 'guard' | 'camera' | 'civilian' | 'broadcast';

export type HeatTier = 'calm' | 'tracking' | 'crackdown';

export interface WitnessMemory {
  id: string;
  witnessId: string;
  witnessLabel?: string;
  targetId: string;
  zoneId: string;
  areaId: string | null;
  source: SuspicionSource;
  recognitionChannel: RecognitionChannel;
  certainty: number;
  halfLifeSeconds: number;
  firstSeenAt: number;
  lastSeenAt: number;
  reinforcedAt?: number;
  reported?: boolean;
  suppressed?: boolean;
  proximityWeight: number;
  location?: Position;
}

export interface WitnessMemorySnapshot {
  id: string;
  witnessId: string;
  witnessLabel?: string;
  targetId: string;
  zoneId: string;
  areaId: string | null;
  source: SuspicionSource;
  recognitionChannel: RecognitionChannel;
  certainty: number;
  halfLifeSeconds: number;
  firstSeenAt: number;
  lastSeenAt: number;
  reinforcedAt?: number;
  reported?: boolean;
  suppressed?: boolean;
  proximityWeight: number;
}

export interface WitnessMemoryUpdateResult {
  memory: WitnessMemory;
  pruned: boolean;
}

export interface WitnessObservation {
  witnessId: string;
  witnessLabel?: string;
  targetId: string;
  zoneId: string;
  areaId: string | null;
  timestamp: number;
  source: SuspicionSource;
  recognitionChannel: RecognitionChannel;
  baseCertainty: number;
  distanceModifier: number;
  lightingModifier: number;
  disguiseModifier: number;
  postureModifier: number;
  reported?: boolean;
  location?: Position;
  existing?: WitnessMemory;
}

export interface HeatProfile {
  id: string;
  label: string;
  halfLifeSeconds: number;
  certaintyFloor: number;
  reinforcementBonus: number;
  reportMultiplier: number;
  suppressionPenalty: number;
  topK: number;
  proximityExponent: number;
  tierThresholds: {
    tracking: number;
    crackdown: number;
  };
}

export interface ZoneHeatComputation {
  zoneId: string;
  totalHeat: number;
  tier: HeatTier;
  leadingWitnessIds: string[];
}
