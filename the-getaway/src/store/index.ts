import { AnyAction, combineReducers, configureStore, createAction } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import worldReducer, { applyLocaleToWorld } from './worldSlice';
import questsReducer, { applyLocaleToQuests } from './questsSlice';
import logReducer from './logSlice';
import settingsReducer from './settingsSlice';
import combatFeedbackReducer from './combatFeedbackSlice';

const STORAGE_KEY = 'the-getaway-state';
const isBrowser = typeof window !== 'undefined';

const reducers = {
  player: playerReducer,
  world: worldReducer,
  quests: questsReducer,
  log: logReducer,
  settings: settingsReducer,
  combatFeedback: combatFeedbackReducer,
};

const combinedReducer = combineReducers(reducers);

export const resetGame = createAction('app/resetGame');
export const PERSISTED_STATE_KEY = STORAGE_KEY;

type CombinedState = ReturnType<typeof combinedReducer>;
type PersistedState = CombinedState;

const loadState = (): PersistedState | undefined => {
  if (!isBrowser) {
    return undefined;
  }

  try {
    const serializedState = window.localStorage.getItem(STORAGE_KEY);
    if (!serializedState) {
      return undefined;
    }

    return JSON.parse(serializedState) as PersistedState;
  } catch (error) {
    console.warn('[store] Failed to load state from localStorage:', error);
    return undefined;
  }
};

const saveState = (state: PersistedState) => {
  if (!isBrowser) {
    return;
  }

  try {
    const serializedState = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.warn('[store] Failed to save state to localStorage:', error);
  }
};

const rootReducer = (state: CombinedState | undefined, action: AnyAction) => {
  if (resetGame.match(action)) {
    const preservedSettings = state?.settings;
    let baseState = combinedReducer(undefined, action);

    if (preservedSettings) {
      baseState = combinedReducer(baseState, applyLocaleToQuests(preservedSettings.locale));
      baseState = combinedReducer(baseState, applyLocaleToWorld(preservedSettings.locale));
      baseState = {
        ...baseState,
        settings: preservedSettings,
      } as CombinedState;
    }

    return baseState;
  }

  return combinedReducer(state, action);
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['app/resetGame'],
        warnAfter: 128,
      },
    }),
});

store.subscribe(() => {
  const state = store.getState();
  const stateToPersist: PersistedState = {
    player: state.player,
    world: state.world,
    quests: state.quests,
    log: state.log,
    settings: state.settings,
    combatFeedback: state.combatFeedback,
  };
  saveState(stateToPersist);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
