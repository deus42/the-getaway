import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
      // Keep only the last N messages (e.g., 50)
      const MAX_LOG_MESSAGES = 50;
      state.messages.push(action.payload);
      if (state.messages.length > MAX_LOG_MESSAGES) {
        state.messages.shift(); // Remove the oldest message
      }
      console.log(`[Log] ${action.payload}`); // Also log to console for debugging
    },
    clearLog(state) {
      state.messages = [];
    },
  },
});

export const { addLogMessage, clearLog } = logSlice.actions;
export default logSlice.reducer; 