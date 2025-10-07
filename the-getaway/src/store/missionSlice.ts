import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Locale, DEFAULT_LOCALE } from '../content/locales';
import { getMissionManifest } from '../content/missions';
import { MissionLevelState } from '../game/interfaces/missions';

export interface MissionState {
  levels: MissionLevelState[];
  currentLevelIndex: number;
  pendingAdvance: boolean;
  celebrationAcknowledged: boolean;
  lastMissionCompletedAt: number | null;
}

const buildMissionLevels = (locale: Locale): MissionLevelState[] => {
  const manifest = getMissionManifest(locale);
  return manifest.map((entry) => ({
    level: entry.level,
    levelId: entry.levelId,
    name: entry.name,
    objectives: entry.objectives.map((objective) => ({
      ...objective,
      questIds: [...objective.questIds],
    })),
  }));
};

export const buildMissionState = (locale: Locale = DEFAULT_LOCALE): MissionState => ({
  levels: buildMissionLevels(locale),
  currentLevelIndex: 0,
  pendingAdvance: false,
  celebrationAcknowledged: false,
  lastMissionCompletedAt: null,
});

const initialState: MissionState = buildMissionState(DEFAULT_LOCALE);

export const missionSlice = createSlice({
  name: 'missions',
  initialState,
  reducers: {
    missionAccomplished(state) {
      if (!state.pendingAdvance) {
        state.pendingAdvance = true;
        state.celebrationAcknowledged = false;
        state.lastMissionCompletedAt = Date.now();
      }
    },
    acknowledgeMissionAccomplished(state) {
      state.celebrationAcknowledged = true;
    },
    deferMissionAdvance(state) {
      state.celebrationAcknowledged = true;
    },
    showMissionAdvancePrompt(state) {
      if (state.pendingAdvance) {
        state.celebrationAcknowledged = false;
      }
    },
    advanceToNextLevel(state) {
      if (state.currentLevelIndex < state.levels.length - 1) {
        state.currentLevelIndex += 1;
      }
      state.pendingAdvance = false;
      state.celebrationAcknowledged = false;
    },
    resetMissions: (_state, action: PayloadAction<Locale | undefined>) => {
      return buildMissionState(action.payload ?? DEFAULT_LOCALE);
    },
    applyLocaleToMissions: (_state, action: PayloadAction<Locale>) => {
      return buildMissionState(action.payload);
    },
  },
});

export const {
  missionAccomplished,
  acknowledgeMissionAccomplished,
  deferMissionAdvance,
  showMissionAdvancePrompt,
  advanceToNextLevel,
  resetMissions,
  applyLocaleToMissions,
} = missionSlice.actions;

export default missionSlice.reducer;
