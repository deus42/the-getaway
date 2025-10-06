import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FloatingNumberData {
  id: string;
  value: number;
  gridX: number;
  gridY: number;
  type: 'damage' | 'heal' | 'crit' | 'miss' | 'block';
}

export interface HitFlashData {
  id: string;
  type: 'damage' | 'heal' | 'crit' | 'block';
  intensity?: number;
  duration?: number;
}

interface CombatFeedbackState {
  floatingNumbers: FloatingNumberData[];
  hitFlashes: HitFlashData[];
  activeFlashId: string | null;
}

const initialState: CombatFeedbackState = {
  floatingNumbers: [],
  hitFlashes: [],
  activeFlashId: null,
};

const combatFeedbackSlice = createSlice({
  name: 'combatFeedback',
  initialState,
  reducers: {
    addFloatingNumber: (state, action: PayloadAction<FloatingNumberData>) => {
      state.floatingNumbers.push(action.payload);
    },
    removeFloatingNumber: (state, action: PayloadAction<string>) => {
      state.floatingNumbers = state.floatingNumbers.filter(
        (num) => num.id !== action.payload
      );
    },
    triggerHitFlash: (state, action: PayloadAction<HitFlashData>) => {
      state.activeFlashId = action.payload.id;
      state.hitFlashes.push(action.payload);
    },
    clearHitFlash: (state) => {
      state.activeFlashId = null;
      state.hitFlashes = [];
    },
    clearAllFeedback: (state) => {
      state.floatingNumbers = [];
      state.hitFlashes = [];
      state.activeFlashId = null;
    },
  },
});

export const {
  addFloatingNumber,
  removeFloatingNumber,
  triggerHitFlash,
  clearHitFlash,
  clearAllFeedback,
} = combatFeedbackSlice.actions;

export default combatFeedbackSlice.reducer;
