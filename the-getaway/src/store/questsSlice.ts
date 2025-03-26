import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Quest, Dialogue } from '../game/interfaces/types';

export interface QuestState {
  quests: Quest[];
  dialogues: Dialogue[];
  activeDialogue: {
    dialogueId: string | null;
    currentNodeId: string | null;
  };
}

const initialState: QuestState = {
  quests: [],
  dialogues: [],
  activeDialogue: {
    dialogueId: null,
    currentNodeId: null
  }
};

export const questsSlice = createSlice({
  name: 'quests',
  initialState,
  reducers: {
    // Add a new quest
    addQuest: (state, action: PayloadAction<Quest>) => {
      state.quests.push(action.payload);
    },
    
    // Update an existing quest
    updateQuest: (state, action: PayloadAction<Quest>) => {
      const quest = action.payload;
      const index = state.quests.findIndex(q => q.id === quest.id);
      
      if (index !== -1) {
        state.quests[index] = quest;
      }
    },
    
    // Start a quest
    startQuest: (state, action: PayloadAction<string>) => {
      const questId = action.payload;
      const quest = state.quests.find(q => q.id === questId);
      
      if (quest && !quest.isActive && !quest.isCompleted) {
        quest.isActive = true;
      }
    },
    
    // Complete a quest
    completeQuest: (state, action: PayloadAction<string>) => {
      const questId = action.payload;
      const quest = state.quests.find(q => q.id === questId);
      
      if (quest && quest.isActive) {
        quest.isActive = false;
        quest.isCompleted = true;
      }
    },
    
    // Update objective status
    updateObjectiveStatus: (
      state, 
      action: PayloadAction<{ questId: string; objectiveId: string; isCompleted: boolean }>
    ) => {
      const { questId, objectiveId, isCompleted } = action.payload;
      const quest = state.quests.find(q => q.id === questId);
      
      if (quest) {
        const objective = quest.objectives.find(o => o.id === objectiveId);
        if (objective) {
          objective.isCompleted = isCompleted;
        }
      }
    },
    
    // Update objective counter
    updateObjectiveCounter: (
      state, 
      action: PayloadAction<{ questId: string; objectiveId: string; count: number }>
    ) => {
      const { questId, objectiveId, count } = action.payload;
      const quest = state.quests.find(q => q.id === questId);
      
      if (quest) {
        const objective = quest.objectives.find(o => o.id === objectiveId);
        if (objective && (objective.type === 'collect' || objective.type === 'kill')) {
          objective.currentCount = (objective.currentCount || 0) + count;
          
          // Check if objective should be completed
          if (objective.currentCount >= (objective.count || 1)) {
            objective.isCompleted = true;
          }
        }
      }
    },
    
    // Add a dialogue
    addDialogue: (state, action: PayloadAction<Dialogue>) => {
      state.dialogues.push(action.payload);
    },
    
    // Start a dialogue interaction
    startDialogue: (state, action: PayloadAction<{ dialogueId: string; nodeId: string }>) => {
      const { dialogueId, nodeId } = action.payload;
      state.activeDialogue = {
        dialogueId,
        currentNodeId: nodeId
      };
    },
    
    // Update current dialogue node
    setDialogueNode: (state, action: PayloadAction<string | null>) => {
      state.activeDialogue.currentNodeId = action.payload;
    },
    
    // End dialogue interaction
    endDialogue: (state) => {
      state.activeDialogue = {
        dialogueId: null,
        currentNodeId: null
      };
    },
    
    // Reset all quests (for new game)
    resetQuests: (state) => {
      state.quests = [];
      state.activeDialogue = {
        dialogueId: null,
        currentNodeId: null
      };
    }
  }
});

export const {
  addQuest,
  updateQuest,
  startQuest,
  completeQuest,
  updateObjectiveStatus,
  updateObjectiveCounter,
  addDialogue,
  startDialogue,
  setDialogueNode,
  endDialogue,
  resetQuests
} = questsSlice.actions;

export default questsSlice.reducer; 