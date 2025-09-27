import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { setGameTime } from './worldSlice';
import { isCurfewTime, DEFAULT_DAY_NIGHT_CONFIG } from '../game/world/dayNightCycle';

interface LogState {
  messages: string[];
}

const initialState: LogState = {
  messages: [],
};

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    addLogMessage(state, action: PayloadAction<string>) {
      const MAX_LOG_MESSAGES = 50;
      const nextMessages = [...state.messages, action.payload];
      if (nextMessages.length > MAX_LOG_MESSAGES) {
        nextMessages.shift();
      }
      state.messages = nextMessages;
      console.log(`[Log] ${action.payload}`);
    },
    clearLog(state) {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setGameTime, (state, action) => {
      const curfewActive = isCurfewTime(action.payload, DEFAULT_DAY_NIGHT_CONFIG);

      if (curfewActive && state.messages.length === 0) {
        state.messages = [
          'Searchlights pin you in the open—duck inside before the patrols lock on.',
        ];
      }
    });
  },
});

export const { addLogMessage, clearLog } = logSlice.actions;
export default logSlice.reducer; 
