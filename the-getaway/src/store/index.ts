import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import worldReducer from './worldSlice';
import questsReducer from './questsSlice';
import logReducer from './logSlice';

// Configure the store with all reducers
export const store = configureStore({
  reducer: {
    player: playerReducer,
    world: worldReducer,
    quests: questsReducer,
    log: logReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 