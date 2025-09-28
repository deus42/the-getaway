import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_LOCALE, Locale } from '../content/locales';

export interface SettingsState {
  locale: Locale;
}

const initialState: SettingsState = {
  locale: DEFAULT_LOCALE,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<Locale>) => {
      state.locale = action.payload;
    },
  },
});

export const { setLocale } = settingsSlice.actions;

export default settingsSlice.reducer;
