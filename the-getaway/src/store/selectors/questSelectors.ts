import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Quest, QuestObjective } from '../../game/interfaces/types';

export interface ObjectiveQueueEntry {
  questId: string;
  questName: string;
  questDescription: string;
  objective: QuestObjective;
  priority: number;
  isPrimary: boolean;
}

const selectQuestState = (state: RootState) => state.quests.quests;

export const selectActiveQuests = createSelector(selectQuestState, (quests) =>
  quests.filter((quest) => quest.isActive && !quest.isCompleted)
);

const computePriority = (quest: Quest, index: number): number => {
  if (/main/i.test(quest.id) || /main/i.test(quest.name)) {
    return -50 + index;
  }

  if (/datapad|operation|cold|iron/i.test(quest.id)) {
    return -25 + index;
  }

  return index;
};

export const selectObjectiveQueue = createSelector(selectActiveQuests, (quests) => {
  const queue: ObjectiveQueueEntry[] = [];

  quests.forEach((quest, questIndex) => {
    quest.objectives
      .filter((objective) => !objective.isCompleted)
      .forEach((objective, objectiveIndex) => {
        queue.push({
          questId: quest.id,
          questName: quest.name,
          questDescription: quest.description,
          objective,
          priority: computePriority(quest, questIndex) * 10 + objectiveIndex,
          isPrimary: questIndex === 0,
        });
      });
  });

  return queue.sort((a, b) => a.priority - b.priority);
});

export const selectPrimaryObjective = createSelector(
  selectObjectiveQueue,
  (queue) => queue.length > 0 ? queue[0] : null
);

export const selectSecondaryObjective = createSelector(
  selectObjectiveQueue,
  (queue) => queue.length > 1 ? queue[1] : null
);
