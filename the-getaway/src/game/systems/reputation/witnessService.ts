import { NPC, MapArea, FactionId } from '../../interfaces/types';
import { ReputationEvent, WitnessBias, WitnessCandidate } from './types';
import {
  WITNESS_RUMOR_THRESHOLD,
  WITNESS_VISIBILITY_THRESHOLD,
} from './constants';
import {
  clamp,
  distanceBetween,
  resolveCellId,
  sampleLineOfSight,
} from './utils';

export interface WitnessSamplingContext {
  event: ReputationEvent;
  mapArea: MapArea;
  npcs?: NPC[];
  ambientLighting: number;
  ambientNoise: number;
  disguisePenalty?: number;
  maxDistance?: number;
  visibilityThreshold?: number;
}

const DEFAULT_MAX_DISTANCE = 24;

const FACTION_TRAIT_WEIGHTS: Record<string, Partial<WitnessBias['traitWeights']>> = {
  resistance: {
    heroic: 1,
    cruel: -0.6,
    sneaky: 0.25,
    intimidating: -0.1,
    competent: 0.5,
  },
  corpsec: {
    heroic: -0.2,
    cruel: 0.4,
    sneaky: -0.4,
    intimidating: 0.8,
    competent: 0.6,
  },
  scavengers: {
    heroic: 0.2,
    cruel: 0.1,
    sneaky: 0.8,
    intimidating: 0.3,
    competent: 0.4,
  },
  civilians: {
    heroic: 0.8,
    cruel: -0.8,
    sneaky: -0.1,
    intimidating: -0.2,
    competent: 0.4,
  },
};

const buildWitnessBias = (npc: NPC, factionId: string | null): WitnessBias => {
  const weights =
    npc.reputationBias ??
    FACTION_TRAIT_WEIGHTS[factionId ?? ''] ??
    FACTION_TRAIT_WEIGHTS.civilians;

  const skepticismBase = npc.socialTags?.includes('gossip_hub') ? 0.35 : 0.55;
  const rumorAppetite = npc.socialTags?.includes('gossip_hub')
    ? 0.75
    : npc.socialTags?.includes('guard')
    ? 0.25
    : 0.5;

  return {
    traitWeights: { ...weights },
    skepticism: clamp(skepticismBase, 0.15, 0.85),
    appetiteForRumors: clamp(rumorAppetite, 0.15, 0.9),
  };
};

const resolveFactionId = (npc: NPC, defaultFaction: FactionId | null): FactionId | null => {
  if (npc.factionId) {
    return npc.factionId;
  }

  if (npc.socialTags?.includes('corpsec')) {
    return 'corpsec';
  }

  if (npc.socialTags?.includes('scavenger')) {
    return 'scavengers';
  }

  if (npc.socialTags?.includes('resistance')) {
    return 'resistance';
  }

  return defaultFaction;
};

const resolveAmbientLightingModifier = (base: number, eventFactor: number): number =>
  clamp(base * eventFactor, 0.2, 1.1);

const resolveDisguiseModifier = (eventFactor: number, penalty?: number): number => {
  const effectivePenalty = typeof penalty === 'number' ? penalty : 0;
  const finalValue = clamp(eventFactor - effectivePenalty, 0.25, 1);
  return finalValue;
};

const computeConfidence = ({
  visibilityScore,
  distanceFactor,
  lineOfSight,
  npc,
}: {
  visibilityScore: number;
  distanceFactor: number;
  lineOfSight: number;
  npc: NPC;
}): number => {
  const observerBonus = npc.socialTags?.includes('sentinel')
    ? 0.15
    : npc.socialTags?.includes('guard')
    ? 0.1
    : 0;

  const base = visibilityScore * 0.65 + distanceFactor * 0.2 + lineOfSight * 0.15 + observerBonus;
  return clamp(base, 0, 1);
};

export const sampleWitnesses = ({
  event,
  mapArea,
  npcs,
  ambientLighting,
  ambientNoise,
  disguisePenalty,
  maxDistance = DEFAULT_MAX_DISTANCE,
  visibilityThreshold = WITNESS_VISIBILITY_THRESHOLD,
}: WitnessSamplingContext): WitnessCandidate[] => {
  const population = npcs ?? mapArea.entities.npcs;
  if (!population.length) {
    return [];
  }

  return population
    .map<WitnessCandidate | null>((npc) => {
      const distance = distanceBetween(npc.position, event.position);
      if (distance > maxDistance) {
        return null;
      }

      const distanceFactor = clamp(1 - distance / (maxDistance + 1), 0, 1);
      const lineOfSight = sampleLineOfSight(mapArea, npc.position, event.position);
      const lightingFactor = resolveAmbientLightingModifier(ambientLighting, event.visibility.lightingFactor);
      const noiseFactor = clamp(
        ambientNoise * 0.35 + event.visibility.noiseLevel * 0.65,
        0.1,
        1
      );
      const disguiseFactor = resolveDisguiseModifier(event.visibility.disguiseFactor, disguisePenalty);

      const visibilityScore = clamp(
        event.visibility.base *
          distanceFactor *
          lineOfSight *
          lightingFactor *
          (0.5 + noiseFactor * 0.5) *
          (1 - (1 - disguiseFactor) * 0.6),
        0,
        1
      );

      if (visibilityScore < WITNESS_RUMOR_THRESHOLD) {
        return null;
      }

      const factionId = resolveFactionId(npc, mapArea.factionRequirement?.factionId ?? null);
      const bias = buildWitnessBias(npc, factionId);
      const baseConfidence = computeConfidence({
        visibilityScore,
        distanceFactor,
        lineOfSight,
        npc,
      });

      const isRumorOnly = visibilityScore < visibilityThreshold;

      return {
        witnessId: npc.id,
        name: npc.name,
        factionId,
        zoneId: event.zoneId,
        cellId: resolveCellId(npc.position),
        position: { ...npc.position },
        distance,
        lineOfSight,
        distanceFactor,
        lightingFactor,
        noiseFactor,
        disguiseFactor,
        visibilityScore,
        baseConfidence,
        isRumorOnly,
        bias,
      };
    })
    .filter((candidate): candidate is WitnessCandidate => Boolean(candidate))
    .sort((a, b) => b.visibilityScore - a.visibilityScore);
};
