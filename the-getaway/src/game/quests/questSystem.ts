import { Quest, QuestObjective, QuestReward, Player } from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';

// Create a new quest
export const createQuest = (
  name: string,
  description: string,
  objectives: Omit<QuestObjective, 'id' | 'isCompleted'>[],
  rewards: QuestReward[]
): Quest => {
  return {
    id: uuidv4(),
    name,
    description,
    isActive: false,
    isCompleted: false,
    objectives: objectives.map(objective => ({
      ...objective,
      id: uuidv4(),
      isCompleted: false,
      currentCount: objective.type === 'collect' || objective.type === 'kill' ? 0 : undefined
    })),
    rewards
  };
};

// Start a quest
export const startQuest = (player: Player, quests: Quest[], questId: string): { player: Player, quests: Quest[] } => {
  const questIndex = quests.findIndex(q => q.id === questId);
  
  if (questIndex === -1) {
    return { player, quests }; // Quest not found
  }
  
  // Make sure quest isn't already active or completed
  if (quests[questIndex].isActive || quests[questIndex].isCompleted) {
    return { player, quests };
  }
  
  const updatedQuests = [...quests];
  updatedQuests[questIndex] = {
    ...updatedQuests[questIndex],
    isActive: true
  };
  
  return { player, quests: updatedQuests };
};

// Update an objective
export const updateObjective = (
  quests: Quest[], 
  questId: string, 
  objectiveId: string, 
  isCompleted: boolean,
  currentCount?: number
): Quest[] => {
  const questIndex = quests.findIndex(q => q.id === questId);
  
  if (questIndex === -1) {
    return quests; // Quest not found
  }
  
  const objectiveIndex = quests[questIndex].objectives.findIndex(o => o.id === objectiveId);
  
  if (objectiveIndex === -1) {
    return quests; // Objective not found
  }
  
  const updatedObjectives = [...quests[questIndex].objectives];
  updatedObjectives[objectiveIndex] = {
    ...updatedObjectives[objectiveIndex],
    isCompleted,
    currentCount
  };
  
  const updatedQuests = [...quests];
  updatedQuests[questIndex] = {
    ...updatedQuests[questIndex],
    objectives: updatedObjectives
  };
  
  return updatedQuests;
};

// Check if all objectives are completed for a quest
export const areAllObjectivesCompleted = (quest: Quest): boolean => {
  return quest.objectives.every(objective => objective.isCompleted);
};

// Update objective count (for collection or kill objectives)
export const updateObjectiveCount = (
  quests: Quest[], 
  questId: string, 
  objectiveId: string, 
  increment: number = 1
): Quest[] => {
  const questIndex = quests.findIndex(q => q.id === questId);
  
  if (questIndex === -1) {
    return quests; // Quest not found
  }
  
  const objectiveIndex = quests[questIndex].objectives.findIndex(o => o.id === objectiveId);
  
  if (objectiveIndex === -1) {
    return quests; // Objective not found
  }
  
  const objective = quests[questIndex].objectives[objectiveIndex];
  
  // Only update count for collection or kill objectives
  if (objective.type !== 'collect' && objective.type !== 'kill') {
    return quests;
  }
  
  // Update count
  const currentCount = objective.currentCount || 0;
  const newCount = currentCount + increment;
  const targetCount = objective.count || 1;
  
  // Check if objective is now completed
  const isCompleted = newCount >= targetCount;
  
  return updateObjective(quests, questId, objectiveId, isCompleted, newCount);
};

// Complete a quest and get rewards
export const completeQuest = (
  player: Player, 
  quests: Quest[], 
  questId: string
): { player: Player, quests: Quest[] } => {
  const questIndex = quests.findIndex(q => q.id === questId);
  
  if (questIndex === -1) {
    return { player, quests }; // Quest not found
  }
  
  const quest = quests[questIndex];
  
  // Make sure quest is active and all objectives are completed
  if (!quest.isActive || !areAllObjectivesCompleted(quest)) {
    return { player, quests };
  }
  
  // Update quest status
  const updatedQuests = [...quests];
  updatedQuests[questIndex] = {
    ...updatedQuests[questIndex],
    isCompleted: true,
    isActive: false
  };
  
  // Apply rewards
  let updatedPlayer = { ...player };
  
  for (const reward of quest.rewards) {
    switch (reward.type) {
      case 'experience':
        updatedPlayer = {
          ...updatedPlayer,
          experience: updatedPlayer.experience + reward.amount
        };
        break;
      // Other reward types would be handled here
    }
  }
  
  return { player: updatedPlayer, quests: updatedQuests };
};

// Get active quests
export const getActiveQuests = (quests: Quest[]): Quest[] => {
  return quests.filter(quest => quest.isActive && !quest.isCompleted);
};

// Get completed quests
export const getCompletedQuests = (quests: Quest[]): Quest[] => {
  return quests.filter(quest => quest.isCompleted);
};

// Create a simple delivery quest
export const createDeliveryQuest = (
  name: string,
  description: string,
  target: string,
  experienceReward: number
): Quest => {
  return createQuest(
    name,
    description,
    [
      {
        description: `Deliver the message to ${target}`,
        type: 'talk',
        target
      }
    ],
    [
      {
        type: 'experience',
        amount: experienceReward
      }
    ]
  );
}; 