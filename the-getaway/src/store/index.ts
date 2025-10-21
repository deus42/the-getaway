import { AnyAction, combineReducers, configureStore, createAction } from '@reduxjs/toolkit';
import playerReducer, { PLAYER_STATE_VERSION, PlayerState, initialPlayerState } from './playerSlice';
import worldReducer, { applyLocaleToWorld } from './worldSlice';
import questsReducer, { applyLocaleToQuests } from './questsSlice';
import missionReducer, { applyLocaleToMissions } from './missionSlice';
import logReducer from './logSlice';
import settingsReducer from './settingsSlice';
import combatFeedbackReducer from './combatFeedbackSlice';
import surveillanceReducer from './surveillanceSlice';
import storyletReducer from './storyletSlice';
import suspicionReducer, {
  SuspicionState,
  createSuspicionInitialState,
  SuspicionZoneState,
  SUSPICION_STATE_VERSION,
} from './suspicionSlice';

const STORAGE_KEY = 'the-getaway-state';
const isBrowser = typeof window !== 'undefined';
const isTestEnvironment =
  typeof process !== 'undefined' &&
  (process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined');

const reducers = {
  player: playerReducer,
  world: worldReducer,
  quests: questsReducer,
  log: logReducer,
  settings: settingsReducer,
  combatFeedback: combatFeedbackReducer,
  missions: missionReducer,
  surveillance: surveillanceReducer,
  storylets: storyletReducer,
  suspicion: suspicionReducer,
};

const combinedReducer = combineReducers(reducers);

export const resetGame = createAction('app/resetGame');
export const PERSISTED_STATE_KEY = STORAGE_KEY;

type CombinedState = ReturnType<typeof combinedReducer>;
type PersistedState = CombinedState;

const cloneOrDefault = <T>(value: T[] | undefined, fallback: T[]): T[] =>
  Array.isArray(value) ? [...value] : [...fallback];

const migratePlayerState = (state?: Partial<PlayerState> | null): PlayerState => {
  if (!state) {
    return {
      ...initialPlayerState,
      version: PLAYER_STATE_VERSION,
      data: {
        ...initialPlayerState.data,
        perks: [...initialPlayerState.data.perks],
        perkRuntime: { ...initialPlayerState.data.perkRuntime },
        factionReputation: { ...initialPlayerState.data.factionReputation },
      },
      pendingLevelUpEvents: [...initialPlayerState.pendingLevelUpEvents],
      xpNotifications: [...initialPlayerState.xpNotifications],
      pendingFactionEvents: [...initialPlayerState.pendingFactionEvents],
    };
  }

  const persistedData = state.data ?? null;
  const mergedData = {
    ...initialPlayerState.data,
    ...(persistedData ?? {}),
    perks: cloneOrDefault(persistedData?.perks, initialPlayerState.data.perks),
    perkRuntime: {
      ...initialPlayerState.data.perkRuntime,
      ...(persistedData?.perkRuntime ?? {}),
    },
    factionReputation: {
      ...initialPlayerState.data.factionReputation,
      ...(persistedData?.factionReputation ?? {}),
    },
  };

  return {
    version: PLAYER_STATE_VERSION,
    data: mergedData,
    pendingLevelUpEvents: cloneOrDefault(
      state.pendingLevelUpEvents,
      initialPlayerState.pendingLevelUpEvents
    ),
    xpNotifications: cloneOrDefault(state.xpNotifications, initialPlayerState.xpNotifications),
    pendingFactionEvents: cloneOrDefault(
      state.pendingFactionEvents,
      initialPlayerState.pendingFactionEvents
    ),
  };
};

const cloneZoneState = (zone: SuspicionZoneState): SuspicionZoneState => ({
  zoneId: zone.zoneId,
  memories: { ...zone.memories },
  heat: {
    zoneId: zone.heat.zoneId,
    totalHeat: zone.heat.totalHeat,
    tier: zone.heat.tier,
    leadingWitnessIds: [...zone.heat.leadingWitnessIds],
  },
  lastUpdatedAt: zone.lastUpdatedAt,
  lastObservationAt: zone.lastObservationAt,
});

const migrateSuspicionState = (state?: Partial<SuspicionState> | null): SuspicionState => {
  if (!state || state.version !== SUSPICION_STATE_VERSION) {
    return createSuspicionInitialState();
  }

  const zones: Record<string, SuspicionZoneState> = {};
  if (state.zones) {
    Object.entries(state.zones).forEach(([zoneId, zone]) => {
      if (zone) {
        zones[zoneId] = cloneZoneState(zone);
      }
    });
  }

  return {
    version: SUSPICION_STATE_VERSION,
    zones,
    paused: Boolean(state.paused),
    lastTickAt: typeof state.lastTickAt === 'number' ? state.lastTickAt : null,
  };
};

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

const migratePersistedState = (state?: PersistedState): PersistedState | undefined => {
  if (!state) {
    return undefined;
  }

  return {
    ...state,
    player: migratePlayerState(state.player),
    suspicion: migrateSuspicionState(state.suspicion),
  };
};

const rootReducer = (state: CombinedState | undefined, action: AnyAction) => {
  if (resetGame.match(action)) {
    const preservedSettings = state?.settings;
    let baseState = combinedReducer(undefined, action);

    if (preservedSettings) {
      baseState = combinedReducer(baseState, applyLocaleToQuests(preservedSettings.locale));
      baseState = combinedReducer(baseState, applyLocaleToWorld(preservedSettings.locale));
      baseState = combinedReducer(baseState, applyLocaleToMissions(preservedSettings.locale));
      baseState = {
        ...baseState,
        settings: preservedSettings,
      } as CombinedState;
    }

    return baseState;
  }

  return combinedReducer(state, action);
};

const persistedState = loadState();
const preloadedState = migratePersistedState(persistedState);

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: isTestEnvironment
        ? false
        : {
            ignoredActions: ['app/resetGame'],
            warnAfter: 128,
          },
      immutableCheck: isTestEnvironment
        ? false
        : {
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
  missions: state.missions,
  surveillance: state.surveillance,
  storylets: state.storylets,
  suspicion: state.suspicion,
};
  saveState(stateToPersist);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
