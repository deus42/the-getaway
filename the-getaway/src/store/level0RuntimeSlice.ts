import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { LEVEL0_LAYOUT_CONTRACT } from '../content/levels/level0/layoutContract';
import type { WorldPoint } from '../game/level0/layout/types';
import {
  commitLevel0GateVerdict,
  type CommitLevel0GateInput,
} from '../game/level0/rpg/gates';
import {
  applyLevel0ParanoiaEffect,
  type Level0ParanoiaEffectInput,
} from '../game/level0/rpg/paranoia';
import {
  applySafehouseResearch,
  applySafehouseRest,
  applySafehouseWait,
  createInitialLevel0RunState,
  normalizeLevel0RunForHydration,
  restartLevel0Attempt,
} from '../game/level0/runtime/safehouse';
import type {
  Level0CoverId,
  Level0ResearchOptionId,
  Level0RunState,
  OperationAttemptBaseline,
  PauseOwner,
  SafehouseActionId,
} from '../game/level0/runtime/types';
import {
  acquirePauseOwner,
  advanceWorldClock,
  releasePauseOwner,
} from '../game/level0/runtime/worldClock';
import type { WorldClockEvent } from '../game/level0/runtime/worldClock';

export interface Level0RuntimeState {
  status: 'idle' | 'active' | 'incompatible';
  run: Level0RunState | null;
  feedbackId: string | null;
  feedbackParanoiaEventIds: string[];
  clockEventIds: string[];
  sceneRevision: number;
}

export const initialLevel0RuntimeState: Level0RuntimeState = {
  status: 'idle',
  run: null,
  feedbackId: null,
  feedbackParanoiaEventIds: [],
  clockEventIds: [],
  sceneRevision: 0,
};

const safehouseBoundary = LEVEL0_LAYOUT_CONTRACT.anchors.find(
  (anchor) => anchor.id === 'safehouse.boundary'
);

if (!safehouseBoundary) throw new Error('Level 0 layout requires safehouse.boundary');

const isInsideSafehouseBoundary = (position: WorldPoint): boolean => Math.hypot(
  position.x - safehouseBoundary.position.x,
  position.y - safehouseBoundary.position.y
) <= safehouseBoundary.radius;

const applyClockFailure = (run: Level0RunState, events: WorldClockEvent[]): Level0RunState => {
  const deadline = events.find((event) => event.kind === 'deadline-failure');
  if (!deadline || deadline.kind !== 'deadline-failure') return run;
  return {
    ...run,
    worldClock: acquirePauseOwner(run.worldClock, 'failure'),
    mission: 'L0_FAILED',
    failureCause: 'failure.deadline',
    failureSourceId: 'clock.deadline',
    failureMissingRequirements: [...deadline.missing],
  };
};

const level0RuntimeSlice = createSlice({
  name: 'level0Runtime',
  initialState: initialLevel0RuntimeState,
  reducers: {
    initializeLevel0Run: (
      _state,
      action: PayloadAction<{ sessionId: string; coverId: Level0CoverId }>
    ): Level0RuntimeState => ({
      status: 'active',
      run: createInitialLevel0RunState(action.payload.sessionId, action.payload.coverId),
      feedbackId: null,
      feedbackParanoiaEventIds: [],
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
      feedbackParanoiaEventIds: [],
      clockEventIds: [],
      sceneRevision: 1,
    }),
    markLevel0SaveIncompatible: (state) => {
      state.status = 'incompatible';
      state.run = null;
      state.feedbackId = 'save.incompatible';
      state.feedbackParanoiaEventIds = [];
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
      state.feedbackParanoiaEventIds = [];
    },
    applyLevel0SafehouseAction: (state, action: PayloadAction<SafehouseActionId>) => {
      if (!state.run) return;
      const eventCount = state.run.rpg.paranoiaEvents.length;
      const result = action.payload === 'wait'
        ? applySafehouseWait(state.run)
        : action.payload === 'rest'
          ? applySafehouseRest(state.run)
          : null;
      if (!result) {
        state.feedbackId = `safehouse.action.${action.payload}.not_implemented`;
        state.feedbackParanoiaEventIds = [];
        return;
      }
      state.run = result.run;
      state.clockEventIds = result.clockEventIds;
      state.feedbackParanoiaEventIds = result.applied
        ? result.run.rpg.paranoiaEvents.slice(eventCount).map((event) => event.eventId)
        : [];
      state.feedbackId = state.feedbackParanoiaEventIds.length > 0
        ? null
        : result.applied
          ? `safehouse.action.${action.payload}.applied`
          : result.blockedReasonId ?? 'safehouse.blocked';
    },
    researchLevel0Ability: (state, action: PayloadAction<Level0ResearchOptionId>) => {
      if (!state.run) return;
      const result = applySafehouseResearch(state.run, action.payload);
      state.run = result.run;
      state.clockEventIds = result.clockEventIds;
      state.feedbackParanoiaEventIds = [];
      state.feedbackId = result.applied
        ? 'research.applied'
        : result.blockedReasonId ?? 'research.blocked';
    },
    commitLevel0Gate: (state, action: PayloadAction<CommitLevel0GateInput>) => {
      if (!state.run) return;
      const result = commitLevel0GateVerdict(state.run, action.payload);
      state.run = result.run;
      state.feedbackParanoiaEventIds = [];
      state.feedbackId = result.verdict
        ? result.verdict.reasonId
        : result.blockedReasonId ?? 'gate.blocked';
    },
    applyLevel0Paranoia: (state, action: PayloadAction<Level0ParanoiaEffectInput>) => {
      if (!state.run) return;
      const result = applyLevel0ParanoiaEffect(state.run, action.payload);
      state.run = result.run;
      state.feedbackParanoiaEventIds = result.applied && result.event
        ? [result.event.eventId]
        : [];
      state.feedbackId = result.applied
        ? result.event?.feedbackId ?? null
        : result.event?.feedbackId ?? 'paranoia.effect.not_applied';
      if (result.run.mission === 'L0_FAILED') state.sceneRevision += 1;
    },
    commitLevel0Departure: (state, action: PayloadAction<Level0RunState>) => {
      state.run = action.payload;
      state.feedbackId = 'safehouse.departure.complete';
      state.feedbackParanoiaEventIds = [];
      state.clockEventIds = [];
      state.sceneRevision += 1;
    },
    restartAttempt: (state, action: PayloadAction<OperationAttemptBaseline>) => {
      state.status = 'active';
      state.run = restartLevel0Attempt(action.payload);
      state.feedbackId = 'restart_attempt.restored';
      state.feedbackParanoiaEventIds = [];
      state.clockEventIds = [];
      state.sceneRevision += 1;
    },
  },
});

export const {
  acquireLevel0Pause,
  advanceLevel0Clock,
  applyLevel0Paranoia,
  applyLevel0SafehouseAction,
  clearLevel0Run,
  commitLevel0Departure,
  commitLevel0Gate,
  hydrateLevel0Run,
  initializeLevel0Run,
  markLevel0SaveIncompatible,
  releaseLevel0Pause,
  researchLevel0Ability,
  restartAttempt,
  setLevel0Feedback,
  syncLevel0PlayerCheckpoint,
} = level0RuntimeSlice.actions;

export default level0RuntimeSlice.reducer;
