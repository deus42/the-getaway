import { Position, FactionId } from '../../interfaces/types';

export const REPUTATION_TRAITS = [
  'heroic',
  'cruel',
  'sneaky',
  'intimidating',
  'competent',
] as const;

export type ReputationTrait = (typeof REPUTATION_TRAITS)[number];

export type ReputationScope = 'witness' | 'faction' | 'cell';

export type ReputationEventIntensity = 'minor' | 'moderate' | 'major' | 'legendary';

export interface ReputationEventVisibility {
  base: number;
  noiseLevel: number;
  lightingFactor: number;
  disguiseFactor: number;
  crowdDensity?: number;
}

export interface ReputationEventInput {
  actorId: string;
  actorLabel?: string;
  zoneId: string;
  cellId?: string;
  position: Position;
  intensity: ReputationEventIntensity;
  traits: Partial<Record<ReputationTrait, number>>;
  tags: string[];
  timestamp?: number;
  visibility?: Partial<ReputationEventVisibility>;
  metadata?: Record<string, unknown>;
}

export interface ReputationEvent extends ReputationEventInput {
  id: string;
  timestamp: number;
  cellId: string;
  visibility: ReputationEventVisibility;
}

export interface WitnessBias {
  traitWeights: Partial<Record<ReputationTrait, number>>;
  skepticism: number;
  appetiteForRumors: number;
  factionSympathies?: FactionId[];
  factionHostilities?: FactionId[];
}

export interface WitnessCandidate {
  witnessId: string;
  name: string;
  factionId: FactionId | null;
  zoneId: string;
  cellId: string;
  position: Position;
  distance: number;
  lineOfSight: number;
  distanceFactor: number;
  lightingFactor: number;
  noiseFactor: number;
  disguiseFactor: number;
  visibilityScore: number;
  baseConfidence: number;
  isRumorOnly: boolean;
  bias: WitnessBias;
}

export interface WitnessRecordTraitDelta {
  trait: ReputationTrait;
  delta: number;
  confidence: number;
  source: 'witness' | 'rumor';
}

export interface WitnessRecord {
  id: string;
  eventId: string;
  witnessId: string;
  witnessName: string;
  factionId: FactionId | null;
  zoneId: string;
  cellId: string;
  timestamp: number;
  visibilityScore: number;
  confidence: number;
  isRumorOnly: boolean;
  traits: WitnessRecordTraitDelta[];
}

export interface ReputationTraitSample {
  value: number;
  confidence: number;
  lastUpdatedAt: number;
  decaySeconds: number;
  sources: string[];
}

export interface ReputationProfile {
  id: string;
  scope: ReputationScope;
  label: string;
  factionId: FactionId | null;
  cellId: string | null;
  traits: Record<ReputationTrait, ReputationTraitSample>;
  updatedAt: number;
}

export interface ReputationProfileMutation {
  scopeId: string;
  scope: ReputationScope;
  factionId: FactionId | null;
  cellId: string | null;
  trait: ReputationTrait;
  delta: number;
  confidence: number;
  sourceRecordId: string;
  witnessId: string | null;
}

export interface GossipEdgeState {
  id: string;
  fromId: string;
  toId: string;
  weight: number;
  latencySeconds: number;
  remainingEnergy: number;
  maxEnergy: number;
  lastSharedAt: number | null;
}

export interface GossipRumor {
  id: string;
  eventId: string;
  originWitnessId: string;
  carrierId: string;
  trait: ReputationTrait;
  polarity: 1 | -1;
  strength: number;
  confidence: number;
  ttlSeconds: number;
  decayRate: number;
  lastUpdatedAt: number;
  originCellId: string;
  originZoneId: string;
  intensity: ReputationEventIntensity;
}

export interface RumorCarrierState {
  carrierId: string;
  cellId: string;
  zoneId: string;
  rumors: GossipRumor[];
}

export interface PropagationUpdate {
  updatedRumors: RumorCarrierState[];
  profileMutations: ReputationProfileMutation[];
  exhaustedEdges: string[];
  timestamp: number;
}
