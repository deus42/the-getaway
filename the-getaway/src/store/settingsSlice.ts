import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_LOCALE, Locale } from '../content/locales';
import {
  AutoBattleProfileId,
  DEFAULT_AUTO_BATTLE_PROFILE_ID,
} from '../game/combat/automation/autoBattleProfiles';
import { VisualQualityPreset } from '../game/visual/contracts';

export interface SettingsState {
  locale: Locale;
  testMode: boolean;
  autoBattleEnabled: boolean;
  autoBattleProfile: AutoBattleProfileId;
  visualQualityPreset: VisualQualityPreset;
  lightsEnabled: boolean;
  autoStealthEnabled: boolean;
  reputationSystemsEnabled: boolean;
}

const initialState: SettingsState = {
  locale: DEFAULT_LOCALE,
  testMode: false,
  autoBattleEnabled: false,
  autoBattleProfile: DEFAULT_AUTO_BATTLE_PROFILE_ID,
  visualQualityPreset: 'balanced',
  lightsEnabled: false,
  autoStealthEnabled: false,
  reputationSystemsEnabled: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<Locale>) => {
      state.locale = action.payload;
    },
    setTestMode: (state, action: PayloadAction<boolean>) => {
      state.testMode = action.payload;
    },
    setAutoBattleEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoBattleEnabled = action.payload;
    },
    setAutoBattleProfile: (state, action: PayloadAction<AutoBattleProfileId>) => {
      state.autoBattleProfile = action.payload;
    },
    setVisualQualityPreset: (state, action: PayloadAction<VisualQualityPreset>) => {
      state.visualQualityPreset = action.payload;
    },
    setLightsEnabled: (state, action: PayloadAction<boolean>) => {
      state.lightsEnabled = action.payload;
    },
    setAutoStealthEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoStealthEnabled = action.payload;
    },
    setReputationSystemsEnabled: (state, action: PayloadAction<boolean>) => {
      state.reputationSystemsEnabled = action.payload;
    },
  },
});

export const {
  setLocale,
  setTestMode,
  setAutoBattleEnabled,
  setAutoBattleProfile,
  setVisualQualityPreset,
  setLightsEnabled,
  setAutoStealthEnabled,
  setReputationSystemsEnabled,
} = settingsSlice.actions;

export default settingsSlice.reducer;
