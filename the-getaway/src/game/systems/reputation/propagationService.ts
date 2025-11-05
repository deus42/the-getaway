import { NPC, MapArea } from '../../interfaces/types';
import {
  GossipEdgeState,
  GossipRumor,
  ReputationEvent,
  ReputationProfileMutation,
  ReputationScope,
  WitnessRecord,
  RumorCarrierState,
  ReputationTrait,
} from './types';
import {
  DEFAULT_RUMOR_TTL_SECONDS,
  GOSSIP_EDGE_ENERGY_PER_TICK,
  GOSSIP_EDGE_MAX_ENERGY,
  GOSSIP_ENERGY_COST_PER_HOP,
  INTENSITY_WEIGHTS,
  MAX_RUMORS_PER_CARRIER,
  MIN_RUMOR_STRENGTH,
  REPUTATION_VALUE_CLAMP,
} from './constants';
import { clamp, distanceBetween } from './utils';
import { v4 as uuidv4 } from 'uuid';

interface BuildEdgesParams {
  mapArea: MapArea;
  npcs?: NPC[];
}

const NEIGHBOR_DISTANCE = 22;
const MAX_NEIGHBORS = 5;
const CROSS_CELL_INTENSITY_THRESHOLD = 0.8;

const createEdgeState = (fromId: string, toId: string, weight: number): GossipEdgeState => ({
  id: `${fromId}::${toId}`,
  fromId,
  toId,
  weight: clamp(weight, 0.05, 1),
  latencySeconds: clamp(60 * (1.2 - weight), 20, 120),
  remainingEnergy: GOSSIP_EDGE_MAX_ENERGY * weight,
  maxEnergy: GOSSIP_EDGE_MAX_ENERGY,
  lastSharedAt: null,
});

const evaluateNeighborWeight = (source: NPC, target: NPC, distance: number): number => {
  let weight = clamp(1 - distance / (NEIGHBOR_DISTANCE + 1), 0, 1);

  const sharedTags = source.socialTags?.filter((tag) => target.socialTags?.includes(tag));
  if (sharedTags?.length) {
    weight += sharedTags.length * 0.08;
  }

  if (source.factionId && target.factionId && source.factionId === target.factionId) {
    weight += 0.15;
  }

  return clamp(weight, 0, 1);
};

export const buildSocialEdges = ({ mapArea, npcs }: BuildEdgesParams): GossipEdgeState[] => {
  const population = npcs ?? mapArea.entities.npcs;
  if (population.length < 2) {
    return [];
  }

  const edges: GossipEdgeState[] = [];

  population.forEach((npc) => {
    const neighbors = population
      .filter((other) => other.id !== npc.id)
      .map((other) => {
        const distance = distanceBetween(npc.position, other.position);
        if (distance > NEIGHBOR_DISTANCE) {
          return null;
        }

        const weight = evaluateNeighborWeight(npc, other, distance);
        if (weight <= 0) {
          return null;
        }

        return { other, weight };
      })
      .filter((entry): entry is { other: NPC; weight: number } => Boolean(entry))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, MAX_NEIGHBORS);

    neighbors.forEach(({ other, weight }) => {
      edges.push(createEdgeState(npc.id, other.id, weight));
    });
  });

  return edges;
};

const strengthFromTraitDelta = (traitDelta: number, confidence: number): number => {
  const normalized = clamp(Math.abs(traitDelta) / REPUTATION_VALUE_CLAMP, 0, 1);
  return clamp(normalized * confidence, 0, 1);
};

const createRumorId = (carrierId: string, trait: ReputationTrait, eventId: string) =>
  `${carrierId}:${trait}:${eventId}`;

export const seedRumorsFromWitnessRecords = (
  event: ReputationEvent,
  records: WitnessRecord[]
): RumorCarrierState[] => {
  if (!records.length) {
    return [];
  }

  const carriers: Record<string, RumorCarrierState> = {};
  const intensityWeight = INTENSITY_WEIGHTS[event.intensity] ?? INTENSITY_WEIGHTS.minor;

  records.forEach((record) => {
    record.traits.forEach((traitDelta) => {
      const strength = strengthFromTraitDelta(traitDelta.delta, traitDelta.confidence) * intensityWeight;
      if (strength <= MIN_RUMOR_STRENGTH) {
        return;
      }

      const carrierId = record.witnessId;
      const polarity: 1 | -1 = traitDelta.delta >= 0 ? 1 : -1;
      if (!carriers[carrierId]) {
        carriers[carrierId] = {
          carrierId,
          cellId: record.cellId,
          zoneId: record.zoneId,
          rumors: [],
        };
      }

      const rumorId = createRumorId(carrierId, traitDelta.trait, event.id);
      carriers[carrierId].rumors.push({
        id: rumorId,
        eventId: event.id,
        originWitnessId: record.witnessId,
        carrierId,
        trait: traitDelta.trait,
        polarity,
        strength: clamp(strength, 0, 1),
        confidence: clamp(traitDelta.confidence, 0, 1),
        ttlSeconds: DEFAULT_RUMOR_TTL_SECONDS,
        decayRate: 1 / DEFAULT_RUMOR_TTL_SECONDS,
        lastUpdatedAt: record.timestamp,
        originCellId: record.cellId,
        originZoneId: record.zoneId,
        intensity: event.intensity,
      });
    });
  });

  return Object.values(carriers).map((carrier) => ({
    ...carrier,
    rumors: carrier.rumors.slice(0, MAX_RUMORS_PER_CARRIER),
  }));
};

const addRumorToCarrier = (carrier: RumorCarrierState, rumor: GossipRumor): void => {
  const existingIndex = carrier.rumors.findIndex((entry) => entry.id === rumor.id);
  if (existingIndex >= 0) {
    const existing = carrier.rumors[existingIndex];
    carrier.rumors[existingIndex] = {
      ...existing,
      strength: clamp(existing.strength + rumor.strength, 0, 1),
      confidence: clamp(Math.max(existing.confidence, rumor.confidence), 0, 1),
      ttlSeconds: Math.max(existing.ttlSeconds, rumor.ttlSeconds),
      lastUpdatedAt: rumor.lastUpdatedAt,
    };
    return;
  }

  carrier.rumors.push(rumor);
  if (carrier.rumors.length > MAX_RUMORS_PER_CARRIER) {
    carrier.rumors.sort((a, b) => b.strength - a.strength);
    carrier.rumors.length = MAX_RUMORS_PER_CARRIER;
  }
};

interface PropagationParams {
  timestamp: number;
  elapsedSeconds: number;
  carriers: RumorCarrierState[];
  edges: GossipEdgeState[];
}

const getTraitDeltaFromRumor = (rumor: GossipRumor): number => {
  const base = rumor.strength * rumor.confidence * 18;
  return clamp(base, 0, 18);
};

const createProfileMutation = (
  carrier: RumorCarrierState,
  rumor: GossipRumor,
  scope: ReputationScope,
  trait: ReputationTrait,
  polarity: 1 | -1
): ReputationProfileMutation => {
  const magnitude = getTraitDeltaFromRumor(rumor);
  const signedMagnitude = magnitude * polarity;

  return {
    scopeId: scope === 'cell' ? carrier.cellId : carrier.zoneId,
    scope,
    factionId: null,
    cellId: scope === 'cell' ? carrier.cellId : null,
    trait,
    delta: signedMagnitude,
    confidence: rumor.confidence * 0.65,
    sourceRecordId: rumor.id,
    witnessId: rumor.originWitnessId,
  };
};

export const advanceRumors = ({
  timestamp,
  elapsedSeconds,
  carriers,
  edges,
}: PropagationParams): {
  carriers: RumorCarrierState[];
  edges: GossipEdgeState[];
  mutations: ReputationProfileMutation[];
} => {
  if (!carriers.length) {
    return { carriers, edges, mutations: [] };
  }

  const carrierMap = carriers.reduce<Record<string, RumorCarrierState>>((acc, carrier) => {
    acc[carrier.carrierId] = {
      ...carrier,
      rumors: carrier.rumors.map((rumor) => ({ ...rumor })),
    };
    return acc;
  }, {});

  const edgeMap = edges.reduce<Record<string, GossipEdgeState[]>>((acc, edge) => {
    if (!acc[edge.fromId]) {
      acc[edge.fromId] = [];
    }
    acc[edge.fromId].push({ ...edge });
    return acc;
  }, {});

  const updatedMutations: ReputationProfileMutation[] = [];

  Object.values(carrierMap).forEach((carrier) => {
    const rumors = carrier.rumors;
    for (let i = rumors.length - 1; i >= 0; i -= 1) {
      const rumor = rumors[i];
      const decay = rumor.decayRate * elapsedSeconds;
      rumor.strength = clamp(rumor.strength - decay, 0, 1);
      rumor.ttlSeconds -= elapsedSeconds;
      rumor.lastUpdatedAt = timestamp;

      if (rumor.ttlSeconds <= 0 || rumor.strength < MIN_RUMOR_STRENGTH) {
        rumors.splice(i, 1);
        continue;
      }

      updatedMutations.push(
        createProfileMutation(carrier, rumor, 'cell', rumor.trait, rumor.polarity)
      );

      const edgesFromCarrier = edgeMap[carrier.carrierId] ?? [];
      if (!edgesFromCarrier.length) {
        continue;
      }

      const allowCrossCell =
        INTENSITY_WEIGHTS[rumor.intensity] >= CROSS_CELL_INTENSITY_THRESHOLD;

      const sortedEdges = edgesFromCarrier
        .filter((edge) => edge.remainingEnergy > 0)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 2);

      sortedEdges.forEach((edge) => {
        const targetCarrier = carrierMap[edge.toId];
        if (!targetCarrier) {
          return;
        }

        const sameCell = targetCarrier.cellId === carrier.cellId;
        if (!sameCell && !allowCrossCell) {
          return;
        }

        if (edge.remainingEnergy < GOSSIP_ENERGY_COST_PER_HOP) {
          return;
        }

        edge.remainingEnergy = clamp(
          edge.remainingEnergy - GOSSIP_ENERGY_COST_PER_HOP,
          0,
          edge.maxEnergy
        );
        edge.lastSharedAt = timestamp;

        const propagatedStrength = clamp(rumor.strength * (0.65 + edge.weight * 0.25), 0, 1);
        const propagatedConfidence = clamp(rumor.confidence * (0.75 + edge.weight * 0.15), 0, 1);

        const propagatedRumor: GossipRumor = {
          ...rumor,
          id: createRumorId(edge.toId, rumor.trait, rumor.eventId) || uuidv4(),
          carrierId: edge.toId,
          strength: propagatedStrength,
          confidence: propagatedConfidence,
          polarity: rumor.polarity,
          ttlSeconds: Math.max(rumor.ttlSeconds * 0.85, DEFAULT_RUMOR_TTL_SECONDS * 0.25),
          lastUpdatedAt: timestamp,
        };

        addRumorToCarrier(targetCarrier, propagatedRumor);
      });
    }
  });

  Object.values(edgeMap).forEach((edgeList) => {
    edgeList.forEach((edge) => {
      edge.remainingEnergy = clamp(
        Math.min(edge.remainingEnergy + GOSSIP_EDGE_ENERGY_PER_TICK, edge.maxEnergy),
        0,
        edge.maxEnergy
      );
    });
  });

  return {
    carriers: Object.values(carrierMap),
    edges: Object.values(edgeMap).flat(),
    mutations: updatedMutations,
  };
};
