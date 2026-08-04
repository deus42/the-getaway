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
  AttributeKey,
  Level0RunState,
  PauseOwner,
  PlayerBuild,
  PlayerIdentity,
  RetrySnapshot,
  SafehouseActionId,
  SkillKey,
} from '../game/level0/runtime/types';
import {
  acquirePauseOwner,
  advanceWorldClock,
  releasePauseOwner,
} from '../game/level0/runtime/worldClock';
import type { WorldClockEvent } from '../game/level0/runtime/worldClock';
import type { WorldPoint } from '../game/level0/layout/types';
import {
  commitLevel0CheckResolution,
  type CommitLevel0CheckInput,
} from '../game/level0/rpg/checks';
import {
  applyLevel0ResourceEffect,
  createLevel0ResourceEffect,
  type Level0ResourceEffectInput,
} from '../game/level0/rpg/resources';
import {
  activatePendingLevelUp,
  allocateLevel0AttributePoint,
  allocateLevel0SkillPoint,
  awardLevel0Milestone as awardLevel0MilestoneDomain,
  type Level0MilestoneId,
} from '../game/level0/rpg/progression';

export interface Level0RuntimeState {
  status: 'idle' | 'active' | 'incompatible';
  run: Level0RunState | null;
  feedbackId: string | null;
  feedbackResourceEventIds: string[];
  clockEventIds: string[];
  sceneRevision: number;
}

export const initialLevel0RuntimeState: Level0RuntimeState = {
  status: 'idle',
  run: null,
  feedbackId: null,
  feedbackResourceEventIds: [],
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
      action: PayloadAction<{
        sessionId: string;
        identity: PlayerIdentity;
        build: PlayerBuild;
      }>
    ): Level0RuntimeState => ({
      status: 'active',
      run: createInitialLevel0RunState(
        action.payload.sessionId,
        action.payload.identity,
        action.payload.build
      ),
      feedbackId: null,
      feedbackResourceEventIds: [],
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
      feedbackResourceEventIds: [],
      clockEventIds: [],
      sceneRevision: 1,
    }),
    markLevel0SaveIncompatible: (state) => {
      state.status = 'incompatible';
      state.run = null;
      state.feedbackId = 'save.incompatible';
      state.feedbackResourceEventIds = [];
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
      state.feedbackResourceEventIds = [];
    },
    applyLevel0SafehouseAction: (state, action: PayloadAction<SafehouseActionId>) => {
      if (!state.run) return;
      const resourceEventCount = state.run.rpg.resourceEvents.length;
      const result = action.payload === 'wait'
        ? applySafehouseWait(state.run)
        : action.payload === 'rest'
          ? applySafehouseRest(state.run)
          : null;
      if (!result) {
        state.feedbackId = `safehouse.action.${action.payload}.not_implemented`;
        state.feedbackResourceEventIds = [];
        return;
      }
      state.run = result.run;
      state.clockEventIds = result.clockEventIds;
      state.feedbackResourceEventIds = result.applied
        ? result.run.rpg.resourceEvents.slice(resourceEventCount).map((event) => event.eventId)
        : [];
      state.feedbackId = state.feedbackResourceEventIds.length > 0
        ? null
        : result.applied
          ? `safehouse.action.${action.payload}.applied`
          : result.blockedReasonId ?? 'safehouse.blocked';
    },
    commitLevel0RpgCheck: (state, action: PayloadAction<CommitLevel0CheckInput>) => {
      if (!state.run) return;
      const result = commitLevel0CheckResolution(state.run, action.payload);
      state.run = result.run;
      state.feedbackResourceEventIds = [];
      state.feedbackId = result.resolution
        ? `check.result.${result.resolution.outcome}`
        : result.blockedReasonId;
    },
    applyLevel0Resource: (
      state,
      action: PayloadAction<Omit<Level0ResourceEffectInput, 'worldMinute'>>
    ) => {
      if (!state.run) return;
      const result = applyLevel0ResourceEffect(state.run, createLevel0ResourceEffect({
        ...action.payload,
        worldMinute: state.run.worldClock.currentMinute,
      }));
      state.run = result.run;
      state.feedbackResourceEventIds = result.applied && result.event
        ? [result.event.eventId]
        : [];
      state.feedbackId = result.applied
        ? null
        : result.event?.feedbackId ?? 'resource.effect.not_applied';
      if (result.run.mission === 'L0_FAILED') state.sceneRevision += 1;
    },
    awardLevel0Milestone: (state, action: PayloadAction<Level0MilestoneId>) => {
      if (!state.run) return;
      const result = awardLevel0MilestoneDomain(state.run, action.payload);
      state.run = result.run;
      state.feedbackResourceEventIds = [];
      state.feedbackId = result.applied
        ? result.run.rpg.xpEvents[result.run.rpg.xpEvents.length - 1]?.feedbackId ?? null
        : result.blockedReasonId ?? 'progression.milestone.already_awarded';
    },
    activateLevel0PendingLevel: (state) => {
      if (!state.run) return;
      const result = activatePendingLevelUp(state.run);
      state.run = result.run;
      state.feedbackResourceEventIds = [];
      state.feedbackId = result.applied
        ? 'level_up.activated'
        : result.blockedReasonId ?? 'level_up.blocked';
    },
    allocateLevel0Skill: (state, action: PayloadAction<SkillKey>) => {
      if (!state.run) return;
      const result = allocateLevel0SkillPoint(state.run, action.payload);
      state.run = result.run;
      state.feedbackResourceEventIds = [];
      state.feedbackId = result.applied
        ? 'level_up.skill.allocated'
        : result.blockedReasonId ?? 'level_up.blocked';
    },
    allocateLevel0Attribute: (state, action: PayloadAction<AttributeKey>) => {
      if (!state.run) return;
      const result = allocateLevel0AttributePoint(state.run, action.payload);
      state.run = result.run;
      state.feedbackResourceEventIds = [];
      state.feedbackId = result.applied
        ? 'level_up.attribute.allocated'
        : result.blockedReasonId ?? 'level_up.blocked';
    },
    commitLevel0Departure: (state, action: PayloadAction<Level0RunState>) => {
      state.run = action.payload;
      state.feedbackId = 'safehouse.departure.complete';
      state.feedbackResourceEventIds = [];
      state.clockEventIds = [];
      state.sceneRevision += 1;
    },
    restoreLevel0Retry: (state, action: PayloadAction<RetrySnapshot>) => {
      state.status = 'active';
      state.run = restoreLevel0RetrySnapshot(action.payload);
      state.feedbackId = 'retry.restored';
      state.feedbackResourceEventIds = [];
      state.clockEventIds = [];
      state.sceneRevision += 1;
    },
  },
});

export const {
  acquireLevel0Pause,
  advanceLevel0Clock,
  activateLevel0PendingLevel,
  allocateLevel0Attribute,
  allocateLevel0Skill,
  applyLevel0Resource,
  applyLevel0SafehouseAction,
  awardLevel0Milestone,
  clearLevel0Run,
  commitLevel0Departure,
  commitLevel0RpgCheck,
  hydrateLevel0Run,
  initializeLevel0Run,
  markLevel0SaveIncompatible,
  releaseLevel0Pause,
  restoreLevel0Retry,
  setLevel0Feedback,
  syncLevel0PlayerCheckpoint,
} = level0RuntimeSlice.actions;

export default level0RuntimeSlice.reducer;
