import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  WitnessObservation,
  ZoneHeatComputation,
  WitnessMemorySnapshot,
  HeatTier,
} from '../game/systems/suspicion';
import {
  buildWitnessMemoryId,
  createWitnessMemory,
  decayWitnessMemory,
  fromWitnessMemorySnapshot,
  reinforceWitnessMemory,
  toWitnessMemorySnapshot,
} from '../game/systems/suspicion/witnessMemory';
import { calculateZoneHeat } from '../game/systems/suspicion/aggregation';
import { getHeatProfileForZone } from '../content/suspicion/heatProfiles';

export interface SuspicionZoneState {
  zoneId: string;
  memories: Record<string, WitnessMemorySnapshot>;
  heat: ZoneHeatComputation;
  lastUpdatedAt: number;
  lastObservationAt: number | null;
}

export interface SuspicionState {
  version: number;
  zones: Record<string, SuspicionZoneState>;
  paused: boolean;
  lastTickAt: number | null;
}

export const SUSPICION_STATE_VERSION = 1;

const createEmptyZoneState = (zoneId: string, timestamp: number): SuspicionZoneState => ({
  zoneId,
  memories: {},
  heat: {
    zoneId,
    totalHeat: 0,
    tier: 'calm',
    leadingWitnessIds: [],
  },
  lastUpdatedAt: timestamp,
  lastObservationAt: null,
});

export const createSuspicionInitialState = (): SuspicionState => ({
  version: SUSPICION_STATE_VERSION,
  zones: {},
  paused: false,
  lastTickAt: null,
});

const initialState: SuspicionState = createSuspicionInitialState();

interface DecayPayload {
  elapsedSeconds: number;
  timestamp: number;
}

interface SuppressPayload {
  memoryId: string;
  zoneId: string;
  suppressed: boolean;
}

interface PurgeWitnessPayload {
  witnessId: string;
  zoneId?: string | null;
}

const heatTierRank = (tier: HeatTier): number => {
  switch (tier) {
    case 'calm':
      return 0;
    case 'tracking':
      return 1;
    case 'crackdown':
      return 2;
    default:
      return 0;
  }
};

const recalcZoneHeat = (zone: SuspicionZoneState): ZoneHeatComputation => {
  const profile = getHeatProfileForZone(zone.zoneId);
  const memories = Object.values(zone.memories).map((snapshot) =>
    fromWitnessMemorySnapshot(snapshot)
  );
  return calculateZoneHeat(zone.zoneId, memories, profile);
};

const suspicionSlice = createSlice({
  name: 'suspicion',
  initialState,
  reducers: {
    ingestObservation: (state, action: PayloadAction<WitnessObservation>) => {
      if (state.paused) {
        return;
      }

      const observation = action.payload;
      const zoneId = observation.zoneId;
      const witnessLabel = observation.witnessLabel ?? observation.witnessId;
      const timestamp = observation.timestamp;

      const zoneState =
        state.zones[zoneId] ?? (state.zones[zoneId] = createEmptyZoneState(zoneId, timestamp));

      const profile = getHeatProfileForZone(zoneId);
      const memoryId = buildWitnessMemoryId(
        observation.witnessId,
        observation.targetId,
        observation.recognitionChannel
      );
      const existingSnapshot = zoneState.memories[memoryId];
      const existingMemory = existingSnapshot
        ? fromWitnessMemorySnapshot(existingSnapshot)
        : undefined;

      const observationWithExisting = {
        ...observation,
        witnessLabel,
        existing: existingMemory,
      };

      const nextMemory = existingMemory
        ? reinforceWitnessMemory(existingMemory, observationWithExisting, profile)
        : createWitnessMemory(observationWithExisting, profile);

      zoneState.memories[memoryId] = toWitnessMemorySnapshot(nextMemory);
      zoneState.heat = recalcZoneHeat(zoneState);
      zoneState.lastObservationAt = timestamp;
      zoneState.lastUpdatedAt = timestamp;
      state.lastTickAt = timestamp;
    },

    applySuspicionDecay: (state, action: PayloadAction<DecayPayload>) => {
      if (state.paused) {
        return;
      }

      const { elapsedSeconds, timestamp } = action.payload;
      if (elapsedSeconds <= 0) {
        return;
      }

      Object.values(state.zones).forEach((zoneState) => {
        const profile = getHeatProfileForZone(zoneState.zoneId);
        const nextMemories: Record<string, WitnessMemorySnapshot> = {};
        let mutated = false;

        Object.entries(zoneState.memories).forEach(([memoryId, snapshot]) => {
          const memory = fromWitnessMemorySnapshot(snapshot);
          const { memory: decayed, pruned } = decayWitnessMemory(memory, elapsedSeconds, profile);
          if (pruned) {
            mutated = true;
            return;
          }

          mutated = mutated || decayed.certainty !== snapshot.certainty;
          nextMemories[memoryId] = toWitnessMemorySnapshot(decayed);
        });

        if (mutated) {
          zoneState.memories = nextMemories;
          zoneState.heat = recalcZoneHeat(zoneState);
          zoneState.lastUpdatedAt = timestamp;
        }
      });

      state.lastTickAt = timestamp;
    },

    setSuspicionPaused: (state, action: PayloadAction<boolean>) => {
      state.paused = action.payload;
    },

    suppressWitnessMemory: (state, action: PayloadAction<SuppressPayload>) => {
      const { zoneId, memoryId, suppressed } = action.payload;
      const zone = state.zones[zoneId];
      if (!zone) {
        return;
      }

      const snapshot = zone.memories[memoryId];
      if (!snapshot) {
        return;
      }

      if (snapshot.suppressed === suppressed) {
        return;
      }

      zone.memories[memoryId] = {
        ...snapshot,
        suppressed,
      };
      zone.heat = recalcZoneHeat(zone);
    },

    purgeWitnessMemories: (state, action: PayloadAction<PurgeWitnessPayload>) => {
      const { witnessId, zoneId } = action.payload;
      const zonesToProcess = zoneId ? [zoneId] : Object.keys(state.zones);

      zonesToProcess.forEach((id) => {
        const zone = state.zones[id];
        if (!zone) {
          return;
        }

        const beforeCount = Object.keys(zone.memories).length;
        if (beforeCount === 0) {
          return;
        }

        const nextMemories: Record<string, WitnessMemorySnapshot> = {};
        Object.entries(zone.memories).forEach(([memoryId, snapshot]) => {
          if (snapshot.witnessId !== witnessId) {
            nextMemories[memoryId] = snapshot;
          }
        });

        if (Object.keys(nextMemories).length !== beforeCount) {
          zone.memories = nextMemories;
          zone.heat = recalcZoneHeat(zone);
        }
      });
    },

    resetSuspicionState: () => createSuspicionInitialState(),
  },
});

export const {
  ingestObservation,
  applySuspicionDecay,
  setSuspicionPaused,
  suppressWitnessMemory,
  purgeWitnessMemories,
  resetSuspicionState,
} = suspicionSlice.actions;

export const getHighestHeatTier = (zones: Record<string, SuspicionZoneState>): HeatTier => {
  let highest: HeatTier = 'calm';
  Object.values(zones).forEach((zone) => {
    if (heatTierRank(zone.heat.tier) > heatTierRank(highest)) {
      highest = zone.heat.tier;
    }
  });
  return highest;
};

export default suspicionSlice.reducer;
