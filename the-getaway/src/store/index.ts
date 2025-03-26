import { configureStore } from '@reduxjs/toolkit';

// Create empty root reducer for now
const rootReducer = {
  // We'll add specific reducers in later steps
};

export const store = configureStore({
  reducer: rootReducer,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 