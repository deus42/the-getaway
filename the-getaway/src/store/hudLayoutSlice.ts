import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type HudLayoutPreset = 'exploration' | 'stealth' | 'combat';

export interface HudLayoutState {
  override: HudLayoutPreset | null;
}

const initialState: HudLayoutState = {
  override: null,
};

const hudLayoutSlice = createSlice({
  name: 'hudLayout',
  initialState,
  reducers: {
    setHudLayoutOverride: (
      state,
      action: PayloadAction<HudLayoutPreset | null>
    ) => {
      state.override = action.payload;
    },
    clearHudLayoutOverride: (state) => {
      state.override = null;
    },
  },
});

export const { setHudLayoutOverride, clearHudLayoutOverride } =
  hudLayoutSlice.actions;

export default hudLayoutSlice.reducer;
