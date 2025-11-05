import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  GossipEdgeState,
  ReputationEvent,
  ReputationEventInput,
  ReputationProfile,
  ReputationProfileMutation,
  ReputationTrait,
  ReputationTraitSample,
  RumorCarrierState,
  WitnessRecord,
  REPUTATION_TRAITS,
} from '../game/systems/reputation';
import {
  MAX_PROFILE_SOURCE_IDS,
  REPUTATION_STATE_VERSION,
  REPUTATION_TRAIT_DEFAULTS,
  REPUTATION_VALUE_CLAMP,
  TRAIT_DECAY_SECONDS,
} from '../game/systems/reputation/constants';
import { clamp, resolveCellId } from '../game/systems/reputation/utils';
import { createReputationEvent } from '../game/systems/reputation/events';
import { sampleWitnesses } from '../game/systems/reputation/witnessService';
import { interpretWitnessRecords } from '../game/systems/reputation/interpretation';
import {
  advanceRumors,
  buildSocialEdges,
  seedRumorsFromWitnessRecords,
} from '../game/systems/reputation/propagationService';
import { MapArea, NPC, Player } from '../game/interfaces/types';
import { EnvironmentState } from '../game/interfaces/environment';
import { RootState, AppDispatch } from '.';

export interface ReputationState {
  version: number;
  events: Record<string, ReputationEvent>;
  witnessRecords: Record<string, WitnessRecord>;
  recordsByEvent: Record<string, string[]>;
  profiles: Record<string, ReputationProfile>;
  carriers: Record<string, RumorCarrierState>;
  edges: Record<string, GossipEdgeState>;
  debug: {
    heatmapEnabled: boolean;
    inspectorTargetId?: string;
  };
  lastTickAt: number | null;
}

const createInitialTraitSample = (): Record<ReputationTrait, ReputationTraitSample> => {
  const timestamp = Date.now();
  return REPUTATION_TRAITS.reduce<Record<ReputationTrait, ReputationTraitSample>>(
    (acc, trait) => {
      acc[trait] = {
        value: REPUTATION_TRAIT_DEFAULTS[trait] ?? 0,
        confidence: 0,
        lastUpdatedAt: timestamp,
        decaySeconds: TRAIT_DECAY_SECONDS[trait] ?? 60 * 45,
        sources: [],
      };
      return acc;
    },
    {} as Record<ReputationTrait, ReputationTraitSample>
  );
};

const createProfile = (
  scopeId: string,
  scope: ReputationProfile['scope'],
  label: string,
  timestamp: number,
  factionId: ReputationProfile['factionId'],
  cellId: ReputationProfile['cellId']
): ReputationProfile => ({
  id: scopeId,
  scope,
  label,
  factionId,
  cellId,
  traits: createInitialTraitSample(),
  updatedAt: timestamp,
});

const initialState: ReputationState = {
  version: REPUTATION_STATE_VERSION,
  events: {},
  witnessRecords: {},
  recordsByEvent: {},
  profiles: {},
  carriers: {},
  edges: {},
  debug: {
    heatmapEnabled: false,
  },
  lastTickAt: null,
};

interface EventIntegrationPayload {
  event: ReputationEvent;
  records: WitnessRecord[];
  profileMutations: ReputationProfileMutation[];
  carriers: RumorCarrierState[];
  edges: GossipEdgeState[];
}

interface DecayPayload {
  timestamp: number;
  elapsedSeconds: number;
}

interface PropagationPayload {
  carriers: RumorCarrierState[];
  edges: GossipEdgeState[];
  profileMutations: ReputationProfileMutation[];
}

const ensureProfile = (
  state: ReputationState,
  scopeId: string,
  label: string,
  scope: ReputationProfile['scope'],
  timestamp: number,
  factionId: ReputationProfile['factionId'],
  cellId: ReputationProfile['cellId']
): ReputationProfile => {
  let profile = state.profiles[scopeId];
  if (!profile) {
    profile = createProfile(scopeId, scope, label, timestamp, factionId, cellId);
    state.profiles[scopeId] = profile;
  }
  return profile;
};

const applyProfileMutation = (
  profile: ReputationProfile,
  mutation: ReputationProfileMutation,
  timestamp: number
): void => {
  const trait = profile.traits[mutation.trait];
  if (!trait) {
    return;
  }

  trait.value = clamp(trait.value + mutation.delta, -REPUTATION_VALUE_CLAMP, REPUTATION_VALUE_CLAMP);
  trait.confidence = clamp(
    trait.confidence + mutation.confidence * (1 - trait.confidence * 0.5),
    0,
    1
  );
  trait.lastUpdatedAt = timestamp;

  if (mutation.sourceRecordId) {
    trait.sources.unshift(mutation.sourceRecordId);
    if (trait.sources.length > MAX_PROFILE_SOURCE_IDS) {
      trait.sources.length = MAX_PROFILE_SOURCE_IDS;
    }
  }

  profile.updatedAt = timestamp;
};

const applyMutationsToState = (
  state: ReputationState,
  profileMutations: ReputationProfileMutation[],
  timestamp: number
): void => {
  profileMutations.forEach((mutation) => {
    const scopeId = mutation.scopeId;
    const label =
      mutation.scope === 'witness'
        ? `Witness::${mutation.scopeId}`
        : mutation.scope === 'cell'
        ? `Cell ${mutation.scopeId}`
        : `Faction ${mutation.scopeId}`;

    const profile = ensureProfile(
      state,
      scopeId,
      label,
      mutation.scope,
      timestamp,
      mutation.scope === 'faction' ? mutation.factionId : null,
      mutation.scope === 'cell' ? mutation.cellId : null
    );

    applyProfileMutation(profile, mutation, timestamp);
  });
};

const mergeCarriers = (
  state: ReputationState,
  carriers: RumorCarrierState[]
): void => {
  carriers.forEach((carrier) => {
    state.carriers[carrier.carrierId] = {
      carrierId: carrier.carrierId,
      cellId: carrier.cellId,
      zoneId: carrier.zoneId,
      rumors: carrier.rumors.map((rumor) => ({ ...rumor })),
    };
  });
};

const mergeEdges = (state: ReputationState, edges: GossipEdgeState[]): void => {
  edges.forEach((edge) => {
    const existing = state.edges[edge.id];
    state.edges[edge.id] = existing
      ? {
          ...existing,
          remainingEnergy: edge.remainingEnergy,
          lastSharedAt: edge.lastSharedAt ?? existing.lastSharedAt,
        }
      : { ...edge };
  });
};

const applyDecayToProfile = (profile: ReputationProfile, elapsedSeconds: number, timestamp: number) => {
  REPUTATION_TRAITS.forEach((traitKey) => {
    const trait = profile.traits[traitKey];
    if (!trait) {
      return;
    }

    const decayRatio = clamp(elapsedSeconds / trait.decaySeconds, 0, 1);
    if (decayRatio <= 0) {
      return;
    }

    const decayAmount = trait.value * decayRatio * 0.5;
    trait.value = clamp(trait.value - decayAmount, -REPUTATION_VALUE_CLAMP, REPUTATION_VALUE_CLAMP);
    trait.confidence = clamp(trait.confidence * (1 - decayRatio * 0.6), 0, 1);
    trait.lastUpdatedAt = timestamp;

    if (Math.abs(trait.value) < 0.01) {
      trait.value = 0;
    }
    if (trait.confidence < 0.02) {
      trait.confidence = 0;
      trait.sources = [];
    }
  });

  profile.updatedAt = timestamp;
};

const pruneEmptyCarriers = (state: ReputationState): void => {
  Object.entries(state.carriers).forEach(([carrierId, carrier]) => {
    if (!carrier.rumors.length) {
      delete state.carriers[carrierId];
    }
  });
};

export const reputationSlice = createSlice({
  name: 'reputation',
  initialState,
  reducers: {
    applyEventIntegration: (state, action: PayloadAction<EventIntegrationPayload>) => {
      const { event, records, profileMutations, carriers, edges } = action.payload;
      state.events[event.id] = event;
      state.recordsByEvent[event.id] = records.map((record) => record.id);

      records.forEach((record) => {
        state.witnessRecords[record.id] = record;
      });

      applyMutationsToState(state, profileMutations, event.timestamp);
      mergeCarriers(state, carriers);
      mergeEdges(state, edges);
      pruneEmptyCarriers(state);
      state.lastTickAt = event.timestamp;
    },

    applyDecay: (state, action: PayloadAction<DecayPayload>) => {
      const { timestamp, elapsedSeconds } = action.payload;
      Object.values(state.profiles).forEach((profile) =>
        applyDecayToProfile(profile, elapsedSeconds, timestamp)
      );

      Object.values(state.edges).forEach((edge) => {
        edge.remainingEnergy = clamp(
          Math.min(edge.remainingEnergy + elapsedSeconds * 0.05, edge.maxEnergy),
          0,
          edge.maxEnergy
        );
      });

      state.lastTickAt = timestamp;
    },

    applyPropagationResult: (state, action: PayloadAction<PropagationPayload>) => {
      const { carriers, edges, profileMutations } = action.payload;
      mergeCarriers(state, carriers);
      mergeEdges(state, edges);
      pruneEmptyCarriers(state);

      const timestamp = Date.now();
      applyMutationsToState(state, profileMutations, timestamp);
      state.lastTickAt = timestamp;
    },

    toggleReputationHeatmap: (state, action: PayloadAction<boolean>) => {
      state.debug.heatmapEnabled = action.payload;
    },

    setInspectorTarget: (state, action: PayloadAction<string | undefined>) => {
      state.debug.inspectorTargetId = action.payload;
    },
  },
});

export const {
  applyEventIntegration,
  applyDecay,
  applyPropagationResult,
  toggleReputationHeatmap,
  setInspectorTarget,
} = reputationSlice.actions;

export default reputationSlice.reducer;

type AppThunk<ReturnType = void> = (dispatch: AppDispatch, getState: () => RootState) => ReturnType;

interface IngestEventOptions extends ReputationEventInput {
  mapArea?: MapArea;
  npcsOverride?: NPC[];
  ambientLighting?: number;
  ambientNoise?: number;
  disguisePenalty?: number;
}

const resolveAmbientLighting = (environment: EnvironmentState, currentTimeOfDay: string): number => {
  const base =
    currentTimeOfDay === 'night'
      ? 0.55
      : currentTimeOfDay === 'evening' || currentTimeOfDay === 'morning'
      ? 0.75
      : 1;

  if (environment.flags.blackoutTier === 'rolling') {
    return base * 0.4;
  }
  if (environment.flags.blackoutTier === 'brownout') {
    return base * 0.65;
  }
  return base;
};

const resolveAmbientNoise = (environment: EnvironmentState): number => {
  switch (environment.flags.gangHeat) {
    case 'high':
      return 0.85;
    case 'med':
      return 0.7;
    default:
      return 0.55;
  }
};

const resolveDisguisePenalty = (player: Player): number => {
  const stealth = player.skillTraining?.stealth ?? 0;
  const agility = player.skills.agility ?? 5;
  const stealthBonus = Math.min(stealth / 160, 0.25);
  const agilityBonus = Math.max(0, (agility - 6) * 0.03);
  return clamp(0.4 - (stealthBonus + agilityBonus), 0, 0.4);
};

const buildProfileMutationsFromRecords = (records: WitnessRecord[]): ReputationProfileMutation[] => {
  const mutations: ReputationProfileMutation[] = [];

  records.forEach((record) => {
    record.traits.forEach((traitDelta) => {
      const timestampFactor = traitDelta.confidence;

      // Witness scope
      mutations.push({
        scopeId: record.witnessId,
        scope: 'witness',
        factionId: record.factionId,
        cellId: record.cellId,
        trait: traitDelta.trait,
        delta: traitDelta.delta,
        confidence: traitDelta.confidence,
        sourceRecordId: record.id,
        witnessId: record.witnessId,
      });

      if (record.factionId) {
        mutations.push({
          scopeId: record.factionId,
          scope: 'faction',
          factionId: record.factionId,
          cellId: null,
          trait: traitDelta.trait,
          delta: traitDelta.delta * (0.55 + timestampFactor * 0.2),
          confidence: traitDelta.confidence * 0.7,
          sourceRecordId: record.id,
          witnessId: record.witnessId,
        });
      }

      mutations.push({
        scopeId: record.cellId,
        scope: 'cell',
        factionId: record.factionId,
        cellId: record.cellId,
        trait: traitDelta.trait,
        delta: traitDelta.delta * (0.7 + timestampFactor * 0.15),
        confidence: traitDelta.confidence * 0.8,
        sourceRecordId: record.id,
        witnessId: record.witnessId,
      });
    });
  });

  return mutations;
};

export const ingestReputationEvent =
  (options: IngestEventOptions): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const world = state.world;
    const player = state.player.data;

    const mapArea: MapArea = options.mapArea ?? world.currentMapArea;
    const ambientLighting =
      options.ambientLighting ?? resolveAmbientLighting(world.environment, world.timeOfDay);
    const ambientNoise = options.ambientNoise ?? resolveAmbientNoise(world.environment);
    const disguisePenalty =
      options.disguisePenalty ?? resolveDisguisePenalty(player);

    const event = createReputationEvent({
      ...options,
      zoneId: options.zoneId ?? mapArea.zoneId ?? world.currentMapArea.zoneId,
      cellId: options.cellId ?? resolveCellId(options.position),
    });

    const witnessCandidates = sampleWitnesses({
      event,
      mapArea,
      npcs: options.npcsOverride,
      ambientLighting,
      ambientNoise,
      disguisePenalty,
    });

    if (!witnessCandidates.length) {
      return;
    }

    const witnessRecords = interpretWitnessRecords({
      event,
      candidates: witnessCandidates,
      timestamp: event.timestamp,
    });

    const profileMutations = buildProfileMutationsFromRecords(witnessRecords);
    const carriers = seedRumorsFromWitnessRecords(event, witnessRecords);
    const edges = buildSocialEdges({ mapArea });

    dispatch(
      applyEventIntegration({
        event,
        records: witnessRecords,
        profileMutations,
        carriers,
        edges,
      })
    );
  };

export const tickLocalizedReputation =
  (elapsedSeconds: number, timestamp?: number): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const now = timestamp ?? Date.now();
    dispatch(applyDecay({ elapsedSeconds, timestamp: now }));

    const carriers = Object.values(state.reputation.carriers);
    if (!carriers.length) {
      return;
    }

    const advanceResult = advanceRumors({
      timestamp: now,
      elapsedSeconds,
      carriers,
      edges: Object.values(state.reputation.edges),
    });

    if (advanceResult.mutations.length) {
      dispatch(
        applyPropagationResult({
          carriers: advanceResult.carriers,
          edges: advanceResult.edges,
          profileMutations: advanceResult.mutations,
        })
      );
    } else {
      dispatch(
        applyPropagationResult({
          carriers: advanceResult.carriers,
          edges: advanceResult.edges,
          profileMutations: [],
        })
      );
    }
  };
