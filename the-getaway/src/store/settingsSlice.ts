import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_LOCALE, Locale } from '../content/locales';

export interface SettingsState {
  locale: Locale;
  testMode: boolean;
}

const initialState: SettingsState = {
  locale: DEFAULT_LOCALE,
  testMode: false,
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
  },
});

export const { setLocale, setTestMode } = settingsSlice.actions;

export default settingsSlice.reducer;
