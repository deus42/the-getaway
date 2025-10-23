import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  PARANOIA_BASE_DECAY_PER_SECOND,
  PARANOIA_CONFIG,
  PARANOIA_MAX_VALUE,
  PARANOIA_MIN_VALUE,
  PARANOIA_TIER_THRESHOLDS,
} from '../content/paranoia/paranoiaConfig';
import type { ParanoiaStimuliBreakdown, ParanoiaTier } from '../game/systems/paranoia/types';

const clampValue = (value: number): number =>
  Math.max(PARANOIA_MIN_VALUE, Math.min(PARANOIA_MAX_VALUE, value));

const resolveTier = (value: number): ParanoiaTier => {
  const clamped = clampValue(value);
  const match = PARANOIA_TIER_THRESHOLDS.find(
    (entry) => clamped >= entry.min && clamped <= entry.max
  );
  return match?.tier ?? 'calm';
};

export interface ParanoiaDebugSnapshot {
  timestamp: number;
  delta: number;
  breakdown: ParanoiaStimuliBreakdown;
  value: number;
  tier: ParanoiaTier;
}

export interface ParanoiaState {
  version: number;
  value: number;
  tier: ParanoiaTier;
  lastUpdatedAt: number | null;
  frozen: boolean;
  respiteUntil: number | null;
  decayBoostUntil: number | null;
  decayBoostPerSecond: number;
  cooldowns: Record<string, number>;
  lastSnapshot: ParanoiaDebugSnapshot | null;
}

export const PARANOIA_STATE_VERSION = 1;

const createInitialState = (): ParanoiaState => ({
  version: PARANOIA_STATE_VERSION,
  value: 12,
  tier: 'calm',
  lastUpdatedAt: null,
  frozen: false,
  respiteUntil: null,
  decayBoostUntil: null,
  decayBoostPerSecond: 0,
  cooldowns: {},
  lastSnapshot: null,
});

const initialState: ParanoiaState = createInitialState();

interface TickParanoiaPayload {
  deltaMs: number;
  timestamp: number;
  decayMultiplier?: number;
}

interface ApplyStimuliPayload {
  timestamp: number;
  delta: number;
  deltaMs?: number;
  breakdown?: ParanoiaStimuliBreakdown;
}

interface ApplyReliefPayload {
  amount: number;
  timestamp: number;
  source?: string;
  cooldownKey?: string;
  cooldownMs?: number;
}

interface SetRespitePayload {
  durationMs: number;
  timestamp: number;
}

interface SetDecayBoostPayload {
  amountPerSecond: number;
  durationMs: number;
  timestamp: number;
}

export const createParanoiaSlice = () =>
  createSlice({
    name: 'paranoia',
    initialState,
    reducers: {
      resetParanoiaState: () => createInitialState(),

      tickParanoia: (state, action: PayloadAction<TickParanoiaPayload>) => {
        const { deltaMs, timestamp, decayMultiplier } = action.payload;

        if (state.frozen || deltaMs <= 0) {
          state.lastUpdatedAt = timestamp;
          return;
        }

        const seconds = Math.max(0, deltaMs) / 1000;
        if (seconds === 0) {
          state.lastUpdatedAt = timestamp;
          return;
        }

        const decayFactor = Math.max(0, decayMultiplier ?? 1);
        let decayPerSecond = PARANOIA_BASE_DECAY_PER_SECOND * decayFactor;

        if (state.decayBoostUntil && timestamp < state.decayBoostUntil) {
          decayPerSecond += Math.max(0, state.decayBoostPerSecond);
        } else if (state.decayBoostUntil && timestamp >= state.decayBoostUntil) {
          state.decayBoostUntil = null;
          state.decayBoostPerSecond = 0;
        }

        const decayAmount = seconds * decayPerSecond;
        if (decayAmount > 0) {
          const nextValue = clampValue(state.value - decayAmount);
          state.value = nextValue;
          state.tier = resolveTier(nextValue);
          state.lastSnapshot = {
            timestamp,
            delta: -decayAmount,
            breakdown: {
              gains: {},
              losses: { passive: decayAmount },
              spikes: {},
            },
            value: nextValue,
            tier: state.tier,
          };
        }

        state.lastUpdatedAt = timestamp;
      },

      applyParanoiaStimuli: (state, action: PayloadAction<ApplyStimuliPayload>) => {
        const { timestamp, delta, breakdown, deltaMs } = action.payload;
        if (!Number.isFinite(delta) || (delta === 0 && !breakdown)) {
          return;
        }

        let appliedDelta = delta;

        if (state.frozen && appliedDelta > 0) {
          appliedDelta = 0;
        }

        const smoothingSeconds = Math.max(0.1, (deltaMs ?? 1000) / 1000);
        const MAX_DELTA_PER_SECOND = 1.1;
        const maxDelta = MAX_DELTA_PER_SECOND * smoothingSeconds;

        if (appliedDelta > 0 && state.respiteUntil && timestamp < state.respiteUntil) {
          appliedDelta = Math.min(appliedDelta, PARANOIA_CONFIG.respite.maxGainPerTick);
        }

        appliedDelta = Math.max(-maxDelta, Math.min(maxDelta, appliedDelta));

        const nextValue = clampValue(state.value + appliedDelta);
        state.value = nextValue;
        state.tier = resolveTier(nextValue);
        state.lastUpdatedAt = timestamp;

        if (breakdown) {
          state.lastSnapshot = {
            timestamp,
            delta: appliedDelta,
            breakdown,
            value: nextValue,
            tier: state.tier,
          };
        }
      },

      applyParanoiaRelief: (state, action: PayloadAction<ApplyReliefPayload>) => {
        const { amount, timestamp, cooldownKey, cooldownMs } = action.payload;
        const relief = Math.max(0, amount);
        if (relief === 0) {
          return;
        }

        if (cooldownKey && cooldownMs) {
          const existing = state.cooldowns[cooldownKey];
          if (typeof existing === 'number' && existing > timestamp) {
            return;
          }
          state.cooldowns[cooldownKey] = timestamp + cooldownMs;
        }

        const nextValue = clampValue(state.value - relief);
        state.value = nextValue;
        state.tier = resolveTier(nextValue);
        state.lastUpdatedAt = timestamp;

        state.lastSnapshot = {
          timestamp,
          delta: -relief,
          breakdown: {
            gains: {},
            losses: { relief },
            spikes: {},
          },
          value: nextValue,
          tier: state.tier,
        };
      },

      setParanoiaRespite: (state, action: PayloadAction<SetRespitePayload>) => {
        const { durationMs, timestamp } = action.payload;
        const safeDuration = Math.max(0, durationMs);
        state.respiteUntil = timestamp + safeDuration;
      },

      setParanoiaDecayBoost: (state, action: PayloadAction<SetDecayBoostPayload>) => {
        const { amountPerSecond, durationMs, timestamp } = action.payload;
        if (amountPerSecond <= 0 || durationMs <= 0) {
          state.decayBoostUntil = null;
          state.decayBoostPerSecond = 0;
          return;
        }

        state.decayBoostPerSecond = amountPerSecond;
        state.decayBoostUntil = timestamp + durationMs;
      },

      setParanoiaFrozen: (state, action: PayloadAction<boolean>) => {
        state.frozen = action.payload;
      },

      clearParanoiaSnapshot: (state) => {
        state.lastSnapshot = null;
      },
    },
  });

const paranoiaSlice = createParanoiaSlice();

export const {
  resetParanoiaState,
  tickParanoia,
  applyParanoiaStimuli,
  applyParanoiaRelief,
  setParanoiaRespite,
  setParanoiaDecayBoost,
  setParanoiaFrozen,
  clearParanoiaSnapshot,
} = paranoiaSlice.actions;

export default paranoiaSlice.reducer;
