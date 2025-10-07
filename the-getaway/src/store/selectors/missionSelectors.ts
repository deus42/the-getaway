import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import {
  MissionProgressSnapshot,
  ResolvedMissionObjective,
  MissionObjectiveDefinition,
} from '../../game/interfaces/missions';
import { Quest } from '../../game/interfaces/types';

const selectMissionState = (state: RootState) => state.missions;
const selectQuestState = (state: RootState) => state.quests.quests;

export const selectCurrentMissionLevel = createSelector(selectMissionState, (missions) => {
  return missions.levels[missions.currentLevelIndex] ?? null;
});

const resolveObjective = (objective: MissionObjectiveDefinition, quests: Quest[]): ResolvedMissionObjective => {
  const questMatches = objective.questIds.map((questId) => quests.find((quest) => quest.id === questId));
  const totalQuests = objective.questIds.length;
  const completedQuests = questMatches.filter((quest) => quest?.isCompleted).length;
  const isComplete = totalQuests === 0 ? false : completedQuests === totalQuests;

  return {
    ...objective,
    totalQuests,
    completedQuests,
    isComplete,
  };
};

const mapResolvedObjectives = (objectives: MissionObjectiveDefinition[], quests: Quest[]): ResolvedMissionObjective[] =>
  objectives.map((objective) => resolveObjective(objective, quests));

export const selectMissionProgress = createSelector(
  [selectCurrentMissionLevel, selectQuestState],
  (level, quests): MissionProgressSnapshot | null => {
    if (!level) {
      return null;
    }

    const primary = mapResolvedObjectives(
      level.objectives.filter((objective) => objective.kind === 'primary'),
      quests
    );

    const side = mapResolvedObjectives(
      level.objectives.filter((objective) => objective.kind === 'side'),
      quests
    );

    const allPrimaryComplete = primary.length > 0 && primary.every((objective) => objective.isComplete);

    return {
      level: level.level,
      levelId: level.levelId,
      name: level.name,
      primary,
      side,
      allPrimaryComplete,
    };
  }
);

export const selectPrimaryObjectives = createSelector(
  selectMissionProgress,
  (progress) => progress?.primary ?? []
);

export const selectSideObjectives = createSelector(
  selectMissionProgress,
  (progress) => progress?.side ?? []
);

export const selectNextPrimaryObjective = createSelector(
  selectMissionProgress,
  (progress) => progress?.primary.find((objective) => !objective.isComplete) ?? null
);

export const selectNextSideObjective = createSelector(
  selectMissionProgress,
  (progress) => progress?.side.find((objective) => !objective.isComplete) ?? null
);

export const selectAllPrimaryObjectivesComplete = createSelector(
  selectMissionProgress,
  (progress) => progress?.allPrimaryComplete ?? false
);

export const selectMissionPendingAdvance = createSelector(
  selectMissionState,
  (missions) => missions.pendingAdvance
);

export const selectMissionCelebrationAcknowledged = createSelector(
  selectMissionState,
  (missions) => missions.celebrationAcknowledged
);

export const selectCurrentLevelNumber = createSelector(
  selectMissionProgress,
  (progress) => progress?.level ?? 0
);

export const selectCurrentLevelName = createSelector(
  selectMissionProgress,
  (progress) => progress?.name ?? ''
);
