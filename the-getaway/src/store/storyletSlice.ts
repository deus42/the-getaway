import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  StoryletResolution,
  StoryletRuntimeEntry,
  StoryletRuntimeSnapshot,
  StoryletTriggerType,
  StoryletTag,
} from '../game/quests/storylets/storyletTypes';
import {
  buildStoryActorPool,
  deriveArcFromMissionIndex,
  evaluateStorylet,
} from '../game/quests/storylets/storyletEngine';
import { getStoryletLibrary } from '../game/quests/storylets/storyletRegistry';
import {
  applyStoryletTemplate,
  getStoryletLocaleStrings,
  resolveOutcomeLocaleVariant,
} from '../content/storylets';
import type { AppDispatch, RootState } from '.';
import { addLogMessage } from './logSlice';
import { adjustFactionReputation, updateHealth, adjustPersonalityTrait } from './playerSlice';
import { StoryletTriggerContext } from '../game/quests/storylets/storyletTypes';
import { Locale, DEFAULT_LOCALE } from '../content/locales';

interface StoryletQueueItem {
  id: string;
  storyletId: string;
  branchId: string;
  title: string;
  synopsis: string;
  narrative: string;
  epilogue?: string;
  logLine?: string;
  resolvedRoles: Record<
    string,
    {
      id: string;
      name: string;
      relationship?: string;
    }
  >;
  triggeredAt: number;
  locale: Locale;
  outcomeLocalizationKey: string;
  variantKey?: string;
}

interface EnqueuePayload {
  resolution: StoryletResolution;
  queueItem: StoryletQueueItem;
  locationId?: string;
}

export interface StoryletState {
  entries: Record<string, StoryletRuntimeEntry>;
  lastSeenByLocation: Record<string, string>;
  queue: StoryletQueueItem[];
}

const initialState: StoryletState = {
  entries: {},
  lastSeenByLocation: {},
  queue: [],
};

const storyletSlice = createSlice({
  name: 'storylets',
  initialState,
  reducers: {
    enqueueStorylet(state, action: PayloadAction<EnqueuePayload>) {
      const { resolution, queueItem, locationId } = action.payload;
      const existing = state.entries[resolution.storyletId] ?? {
        storyletId: resolution.storyletId,
        lastTriggeredAt: null,
        cooldownExpiresAt: null,
        timesTriggered: 0,
      };

      existing.lastTriggeredAt = resolution.timestamp;
      existing.cooldownExpiresAt = resolution.cooldownExpiresAt;
      existing.timesTriggered += 1;

      state.entries[resolution.storyletId] = existing;

      if (locationId) {
        state.lastSeenByLocation[locationId] = resolution.storyletId;
      }

      state.queue.push(queueItem);
    },
    dequeueStorylet(state, action: PayloadAction<string | undefined>) {
      const targetId = action.payload;

      if (!targetId) {
        state.queue.shift();
        return;
      }

      state.queue = state.queue.filter((entry) => entry.id !== targetId);
    },
    clearStorylets: () => initialState,
  },
});

export const { enqueueStorylet, dequeueStorylet, clearStorylets } = storyletSlice.actions;
export default storyletSlice.reducer;

export interface StoryletTriggerRequest {
  type: StoryletTriggerType;
  locationId?: string;
  missionId?: string;
  tags?: StoryletTag[];
}

type AppThunk<ReturnType = void> = (dispatch: AppDispatch, getState: () => RootState) => ReturnType;

const buildTriggerContext = (
  request: StoryletTriggerRequest,
  state: RootState,
  now: number
): StoryletTriggerContext => {
  const arc = deriveArcFromMissionIndex(state.missions.currentLevelIndex);
  const locationId = request.locationId ?? state.world.currentMapArea?.id;

  const tags = new Set<StoryletTag>(request.tags ?? []);

  if (request.type === 'patrolAmbush') {
    tags.add('ambush');
  }

  if (request.type === 'campfireRest') {
    tags.add('rest');
    tags.add('relationship');
  }

  const player = state.player.data;
  if (player.maxHealth > 0 && player.health < player.maxHealth * 0.7) {
    tags.add('injury');
  }

  return {
    type: request.type,
    arc,
    timestamp: now,
    locationId,
    missionId: request.missionId,
    tags: Array.from(tags),
  };
};

const snapshotRuntime = (state: StoryletState): StoryletRuntimeSnapshot => ({
  entries: { ...state.entries },
  lastSeenByLocation: { ...state.lastSeenByLocation },
});

const buildQueueItem = (
  resolution: StoryletResolution,
  locale: Locale
): StoryletQueueItem => {
  const strings = getStoryletLocaleStrings(locale);
  const playLocale = strings.plays[resolution.storyletId];

  const roleTokens: Record<string, string> = {};
  const resolvedRoles: StoryletQueueItem['resolvedRoles'] = {};

  Object.entries(resolution.resolvedRoles).forEach(([roleId, actor]) => {
    roleTokens[roleId] = actor.name;
    resolvedRoles[roleId] = {
      id: actor.id,
      name: actor.name,
      relationship: actor.relationship,
    };
  });

  const outcomeLocale = playLocale?.outcomes[resolution.branch.id];
  const variant = outcomeLocale
    ? resolveOutcomeLocaleVariant(outcomeLocale, resolution.outcome.variantKey)
    : undefined;

  const narrative = variant
    ? applyStoryletTemplate(variant.narrative, roleTokens)
    : '';
  const epilogue = variant?.epilogue
    ? applyStoryletTemplate(variant.epilogue, roleTokens)
    : undefined;

  const logLine = variant?.logLine
    ? applyStoryletTemplate(variant.logLine, roleTokens)
    : undefined;

  return {
    id: uuidv4(),
    storyletId: resolution.storyletId,
    branchId: resolution.branch.id,
    title: playLocale?.title ?? resolution.play.id,
    synopsis: playLocale?.synopsis ?? '',
    narrative,
    epilogue,
    logLine,
    resolvedRoles,
    triggeredAt: resolution.timestamp,
    locale,
    outcomeLocalizationKey: resolution.outcome.localizationKey,
    variantKey: resolution.outcome.variantKey,
  };
};

const applyStoryletEffects = (
  resolution: StoryletResolution,
  locale: Locale,
  dispatch: AppDispatch
) => {
  const strings = getStoryletLocaleStrings(locale);
  const roleTokens: Record<string, string> = {};

  Object.entries(resolution.resolvedRoles).forEach(([roleId, actor]) => {
    roleTokens[roleId] = actor.name;
  });

  resolution.outcome.effects.forEach((effect) => {
    switch (effect.type) {
      case 'log': {
        const raw =
          strings.logs[effect.logKey] ??
          resolution.play.titleKey ??
          effect.logKey;
        const message = applyStoryletTemplate(raw, roleTokens);
        dispatch(addLogMessage(message));
        break;
      }
      case 'faction': {
        dispatch(
          adjustFactionReputation({
            factionId: effect.factionId,
            delta: effect.delta,
            reason: effect.reason ?? 'storylet',
            source: resolution.storyletId,
          })
        );
        break;
      }
      case 'playerHealth': {
        dispatch(updateHealth(effect.delta));
        break;
      }
      case 'traitDelta': {
        if (effect.target === 'player') {
          dispatch(
            adjustPersonalityTrait({
              trait: effect.trait,
              delta: effect.delta,
              source: resolution.storyletId,
            })
          );
        }
        break;
      }
      default:
        break;
    }
  });
};

export const triggerStorylet =
  (request: StoryletTriggerRequest): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const now = Date.now();
    const locale = state.settings?.locale ?? DEFAULT_LOCALE;

    const trigger = buildTriggerContext(request, state, now);
    const runtime = snapshotRuntime(state.storylets);
    const plays = getStoryletLibrary();
    const actorPool = buildStoryActorPool({
      player: state.player.data,
      npcs: state.world.currentMapArea.entities.npcs,
    });

    const resolution = evaluateStorylet({
      plays,
      runtime,
      trigger,
      actorPool,
      now,
      locationId: trigger.locationId,
    });

    if (!resolution) {
      return;
    }

    applyStoryletEffects(resolution, locale, dispatch);

    const queueItem = buildQueueItem(resolution, locale);

    dispatch(
      enqueueStorylet({
        resolution,
        queueItem,
        locationId: trigger.locationId,
      })
    );
  };

export const selectStoryletQueue = (state: RootState): StoryletQueueItem[] => state.storylets.queue;
