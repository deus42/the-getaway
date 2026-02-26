import { createSelector } from '@reduxjs/toolkit';
import { getNarrativeLocaleBundle } from '../../content/locales';
import { QUEST_DEFINITION_BY_ID } from '../../content/quests';
import { Quest, QuestObjective, QuestReward } from '../../game/interfaces/types';
import { RootState } from '..';
import { selectMissionProgress } from './missionSelectors';

export interface OpsBriefingQuestModel {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  kind: 'primary' | 'side';
  giverName: string | null;
  missionSummary: string | null;
  isActive: boolean;
  isCompleted: boolean;
}

export interface OpsBriefingModel {
  primaryObjectives: NonNullable<ReturnType<typeof selectMissionProgress>>['primary'];
  activeSideQuests: OpsBriefingQuestModel[];
  availableSideQuests: OpsBriefingQuestModel[];
  completedQuests: OpsBriefingQuestModel[];
}

const selectQuestState = (state: RootState) => state.quests.quests;
const selectLocale = (state: RootState) => state.settings.locale;

const toQuestModel = (
  quest: Quest,
  bundle: ReturnType<typeof getNarrativeLocaleBundle>
): OpsBriefingQuestModel => {
  const definition = QUEST_DEFINITION_BY_ID[quest.id];
  const kind = definition?.kind ?? 'primary';
  const giverKey = definition?.relatedNpcKeys?.[0];
  const giverName = giverKey ? bundle.npcs[giverKey]?.name ?? null : null;
  const missionSummary =
    definition?.missionKey && definition.missionKey in bundle.missions
      ? bundle.missions[definition.missionKey]?.summary ?? null
      : null;

  return {
    id: quest.id,
    name: quest.name,
    description: quest.description,
    objectives: quest.objectives,
    rewards: quest.rewards,
    kind,
    giverName,
    missionSummary,
    isActive: quest.isActive,
    isCompleted: quest.isCompleted,
  };
};

export const selectOpsBriefingModel = createSelector(
  [selectMissionProgress, selectQuestState, selectLocale],
  (missionProgress, quests, locale): OpsBriefingModel => {
    const bundle = getNarrativeLocaleBundle(locale);
    const sideQuestModels = quests
      .map((quest) => toQuestModel(quest, bundle))
      .filter((quest) => quest.kind === 'side');

    const activeSideQuests = sideQuestModels
      .filter((quest) => quest.isActive && !quest.isCompleted)
      .sort((a, b) => a.name.localeCompare(b.name));

    const availableSideQuests = sideQuestModels
      .filter((quest) => !quest.isActive && !quest.isCompleted)
      .sort((a, b) => a.name.localeCompare(b.name));

    const completedQuests = quests
      .map((quest) => toQuestModel(quest, bundle))
      .filter((quest) => quest.isCompleted)
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      primaryObjectives: missionProgress?.primary ?? [],
      activeSideQuests,
      availableSideQuests,
      completedQuests,
    };
  }
);
