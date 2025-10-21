import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AutoBattleProfileId } from '../game/combat/automation/autoBattleProfiles';

export type AutoBattleStatus = 'idle' | 'running' | 'paused';

export type AutoBattlePauseReason =
  | 'manual_input'
  | 'dialogue'
  | 'objective'
  | 'resources'
  | 'ap'
  | 'settings';

export interface AutoBattleDecisionSummary {
  profileId: AutoBattleProfileId;
  action: string;
  targetId?: string;
  targetName?: string;
  score: number;
  explanation?: string;
  timestamp: number;
}

interface AutoBattleState {
  status: AutoBattleStatus;
  reason: AutoBattlePauseReason | null;
  lastDecision: AutoBattleDecisionSummary | null;
}

const initialState: AutoBattleState = {
  status: 'idle',
  reason: null,
  lastDecision: null,
};

const autoBattleSlice = createSlice({
  name: 'autoBattle',
  initialState,
  reducers: {
    setAutoBattleStatus: (
      state,
      action: PayloadAction<{ status: AutoBattleStatus; reason?: AutoBattlePauseReason | null }>
    ) => {
      state.status = action.payload.status;
      state.reason = action.payload.reason ?? null;
      if (state.status !== 'running') {
        state.lastDecision = state.lastDecision
          ? { ...state.lastDecision, timestamp: Date.now() }
          : state.lastDecision;
      }
    },
    recordAutoBattleDecision: (state, action: PayloadAction<AutoBattleDecisionSummary>) => {
      state.lastDecision = action.payload;
      state.status = 'running';
      state.reason = null;
    },
    clearAutoBattleDecision: (state) => {
      state.lastDecision = null;
    },
  },
});

export const {
  setAutoBattleStatus,
  recordAutoBattleDecision,
  clearAutoBattleDecision,
} = autoBattleSlice.actions;

export default autoBattleSlice.reducer;
