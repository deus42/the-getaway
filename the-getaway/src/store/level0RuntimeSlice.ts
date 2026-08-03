import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { LEVEL0_LAYOUT_CONTRACT } from '../content/levels/level0/layoutContract';
import {
  applySafehouseRest,
  applySafehouseWait,
  createInitialLevel0RunState,
  normalizeLevel0RunForHydration,
  restoreLevel0RetrySnapshot,
} from '../game/level0/runtime/safehouse';
import type {
  Level0RunState,
  PauseOwner,
  RetrySnapshot,
  SafehouseActionId,
} from '../game/level0/runtime/types';
import {
  acquirePauseOwner,
  advanceWorldClock,
  releasePauseOwner,
} from '../game/level0/runtime/worldClock';
import type { WorldClockEvent } from '../game/level0/runtime/worldClock';
import type { WorldPoint } from '../game/level0/layout/types';

export interface Level0RuntimeState {
  status: 'idle' | 'active' | 'incompatible';
  run: Level0RunState | null;
  feedbackId: string | null;
  clockEventIds: string[];
  sceneRevision: number;
}

export const initialLevel0RuntimeState: Level0RuntimeState = {
  status: 'idle',
  run: null,
  feedbackId: null,
  clockEventIds: [],
  sceneRevision: 0,
};

const safehouseBoundary = LEVEL0_LAYOUT_CONTRACT.anchors.find(
  (anchor) => anchor.id === 'safehouse.boundary'
);

if (!safehouseBoundary) {
  throw new Error('Level 0 layout requires safehouse.boundary');
}

const isInsideSafehouseBoundary = (position: WorldPoint): boolean => {
  const distance = Math.hypot(
    position.x - safehouseBoundary.position.x,
    position.y - safehouseBoundary.position.y
  );
  return distance <= safehouseBoundary.radius;
};

const applyClockFailure = (run: Level0RunState, events: WorldClockEvent[]): Level0RunState => {
  const deadline = events.find((event) => event.kind === 'deadline-failure');
  if (!deadline || deadline.kind !== 'deadline-failure') {
    return run;
  }
  return {
    ...run,
    worldClock: acquirePauseOwner(run.worldClock, 'failure'),
    mission: 'L0_FAILED',
    failureCause: 'failure.deadline',
    failureMissingRequirements: [...deadline.missing],
  };
};

const level0RuntimeSlice = createSlice({
  name: 'level0Runtime',
  initialState: initialLevel0RuntimeState,
  reducers: {
    initializeLevel0Run: (
      _state,
      action: PayloadAction<{ sessionId: string }>
    ): Level0RuntimeState => ({
      status: 'active',
      run: createInitialLevel0RunState(action.payload.sessionId),
      feedbackId: null,
      clockEventIds: [],
      sceneRevision: 1,
    }),
    hydrateLevel0Run: (
      _state,
      action: PayloadAction<Level0RunState>
    ): Level0RuntimeState => ({
      status: 'active',
      run: normalizeLevel0RunForHydration(action.payload),
      feedbackId: null,
      clockEventIds: [],
      sceneRevision: 1,
    }),
    markLevel0SaveIncompatible: (state) => {
      state.status = 'incompatible';
      state.run = null;
      state.feedbackId = 'save.incompatible';
      state.clockEventIds = [];
      state.sceneRevision += 1;
    },
    clearLevel0Run: () => initialLevel0RuntimeState,
    acquireLevel0Pause: (state, action: PayloadAction<PauseOwner>) => {
      if (!state.run) return;
      state.run.worldClock = acquirePauseOwner(state.run.worldClock, action.payload);
    },
    releaseLevel0Pause: (state, action: PayloadAction<PauseOwner>) => {
      if (!state.run) return;
      state.run.worldClock = releasePauseOwner(state.run.worldClock, action.payload);
    },
    advanceLevel0Clock: (
      state,
      action: PayloadAction<{ realDeltaMilliseconds: number }>
    ) => {
      if (!state.run || state.run.mission === 'L0_FAILED' || state.run.mission === 'L0_COMPLETE') {
        return;
      }
      const result = advanceWorldClock(state.run.worldClock, {
        realMilliseconds: action.payload.realDeltaMilliseconds,
        activeExploration: true,
        completion: state.run.completion,
      });
      state.run.worldClock = result.state;
      state.clockEventIds = result.events.map((event) => event.id);
      state.run = applyClockFailure(state.run, result.events);
    },
    syncLevel0PlayerCheckpoint: (
      state,
      action: PayloadAction<{ position: WorldPoint; facing: WorldPoint }>
    ) => {
      if (!state.run) return;
      state.run.player = {
        position: { ...action.payload.position },
        facing: { ...action.payload.facing },
      };
      state.run.safehouse.insideBoundary = isInsideSafehouseBoundary(action.payload.position);
    },
    setLevel0Feedback: (state, action: PayloadAction<string | null>) => {
      state.feedbackId = action.payload;
    },
    applyLevel0SafehouseAction: (state, action: PayloadAction<SafehouseActionId>) => {
      if (!state.run) return;
      const result = action.payload === 'wait'
        ? applySafehouseWait(state.run)
        : action.payload === 'rest'
          ? applySafehouseRest(state.run)
          : null;
      if (!result) {
        state.feedbackId = `safehouse.action.${action.payload}.not_implemented`;
        return;
      }
      state.run = result.run;
      state.clockEventIds = result.clockEventIds;
      state.feedbackId = result.applied
        ? `safehouse.action.${action.payload}.applied`
        : result.blockedReasonId ?? 'safehouse.blocked';
    },
    commitLevel0Departure: (state, action: PayloadAction<Level0RunState>) => {
      state.run = action.payload;
      state.feedbackId = 'safehouse.departure.complete';
      state.clockEventIds = [];
      state.sceneRevision += 1;
    },
    restoreLevel0Retry: (state, action: PayloadAction<RetrySnapshot>) => {
      state.status = 'active';
      state.run = restoreLevel0RetrySnapshot(action.payload);
      state.feedbackId = 'retry.restored';
      state.clockEventIds = [];
      state.sceneRevision += 1;
    },
  },
});

export const {
  acquireLevel0Pause,
  advanceLevel0Clock,
  applyLevel0SafehouseAction,
  clearLevel0Run,
  commitLevel0Departure,
  hydrateLevel0Run,
  initializeLevel0Run,
  markLevel0SaveIncompatible,
  releaseLevel0Pause,
  restoreLevel0Retry,
  setLevel0Feedback,
  syncLevel0PlayerCheckpoint,
} = level0RuntimeSlice.actions;

export default level0RuntimeSlice.reducer;
