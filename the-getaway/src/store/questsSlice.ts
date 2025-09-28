import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Quest, Dialogue } from '../game/interfaces/types';

export interface QuestState {
  quests: Quest[];
  dialogues: Dialogue[];
  activeDialogue: {
    dialogueId: string | null;
    currentNodeId: string | null;
  };
  lastBriefing: {
    dialogueId: string | null;
    nodeId: string | null;
  };
}

const initialDialogues: Dialogue[] = [
  {
    id: 'npc_lira_vendor',
    npcId: 'Lira the Smuggler',
    nodes: [
      {
        id: 'intro',
        text: 'Lira flicks ash from a smuggled cigarette. "Need gear, intel, or a favour? Silver buys silence, but favours buy survival."',
        options: [
          {
            text: 'Show me what’s moving on the street.',
            nextNodeId: 'trade',
            skillCheck: {
              skill: 'charisma',
              threshold: 6,
            },
          },
          {
            text: 'Any shipments gone missing recently?',
            nextNodeId: 'quest',
            questEffect: {
              questId: 'quest_market_cache',
              effect: 'start',
            },
          },
          {
            text: 'Keep your head low, Lira.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'trade',
        text: '"Merch is scarce, but creds talk. Bring me transit tokens and I’ll open the reserve locker."',
        options: [
          {
            text: 'I’ll see what I can find.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'quest',
        text: '"Corporate patrol seized my street cache. Slip into Downtown and liberate what’s mine—we both profit."',
        options: [
          {
            text: 'Consider it done.',
            nextNodeId: null,
          },
        ],
      },
    ],
  },
  {
    id: 'npc_archivist_naila',
    npcId: 'Archivist Naila',
    nodes: [
      {
        id: 'intro',
        text: 'Naila adjusts her cracked lenses. "Knowledge is leverage. Help me expose the patrol manifests and I’ll clear your path."',
        options: [
          {
            text: 'What do you need recovered?',
            nextNodeId: 'mission',
            questEffect: {
              questId: 'quest_datapad_truth',
              effect: 'start',
            },
          },
          {
            text: 'Maybe later.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'mission',
        text: '"Rumours say Lira handles a datapad with the manifests I need. Retrieve it and I’ll map patrol rotations for you."',
        options: [
          {
            text: 'I’ll recover the datapad.',
            nextNodeId: null,
          },
        ],
      },
    ],
  },
  {
    id: 'npc_courier_brant',
    npcId: 'Courier Brant',
    nodes: [
      {
        id: 'intro',
        text: 'Brant adjusts a battered messenger bag. "My runners vanished after curfew. Help me find them and I’ll share my routes."',
        options: [
          {
            text: 'Point me towards their last drop.',
            nextNodeId: 'task',
            questEffect: {
              questId: 'quest_courier_network',
              effect: 'start',
            },
          },
          {
            text: 'Not my priority right now.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'task',
        text: '"They were logging tram tokens near the transit hub. Check the plazas and bring back whatever they cached."',
        options: [
          {
            text: 'Stay mobile, Brant.',
            nextNodeId: null,
          },
        ],
      },
    ],
  },
];

const initialQuests: Quest[] = [
  {
    id: 'quest_market_cache',
    name: 'Market Cache Recovery',
    description: 'Lira wants her seized Smuggler cache liberated from a Downtown patrol route.',
    isActive: false,
    isCompleted: false,
    objectives: [
      {
        id: 'recover-keycard',
        description: 'Secure the Corporate Keycard hidden in Downtown.',
        isCompleted: false,
        type: 'collect',
        target: 'Corporate Keycard',
        count: 1,
        currentCount: 0,
      },
      {
        id: 'return-to-lira',
        description: 'Return to Lira in the Slums.',
        isCompleted: false,
        type: 'talk',
        target: 'Lira the Smuggler',
      },
    ],
    rewards: [
      { type: 'currency', amount: 80 },
      { type: 'item', id: 'Encrypted Datapad', amount: 1 },
    ],
  },
  {
    id: 'quest_datapad_truth',
    name: 'Manifests of Control',
    description: 'Archivist Naila needs the Encrypted Datapad to expose patrol rotations.',
    isActive: false,
    isCompleted: false,
    objectives: [
      {
        id: 'obtain-datapad',
        description: 'Acquire the Encrypted Datapad from the Slums cache.',
        isCompleted: false,
        type: 'collect',
        target: 'Encrypted Datapad',
        count: 1,
        currentCount: 0,
      },
      {
        id: 'deliver-naila',
        description: 'Deliver the datapad to Archivist Naila in Downtown.',
        isCompleted: false,
        type: 'talk',
        target: 'Archivist Naila',
      },
    ],
    rewards: [
      { type: 'experience', amount: 120 },
      { type: 'item', id: 'Transit Tokens', amount: 1 },
    ],
  },
  {
    id: 'quest_courier_network',
    name: 'Courier Network Rescue',
    description: 'Courier Brant lost contact with his runners near the transit hub.',
    isActive: false,
    isCompleted: false,
    objectives: [
      {
        id: 'find-transit-tokens',
        description: 'Collect Transit Tokens scattered around Downtown plazas.',
        isCompleted: false,
        type: 'collect',
        target: 'Transit Tokens',
        count: 3,
        currentCount: 0,
      },
      {
        id: 'report-brant',
        description: 'Report back to Courier Brant with the recovered tokens.',
        isCompleted: false,
        type: 'talk',
        target: 'Courier Brant',
      },
    ],
    rewards: [
      { type: 'experience', amount: 90 },
      { type: 'currency', amount: 60 },
    ],
  },
];

const initialState: QuestState = {
  quests: initialQuests,
  dialogues: initialDialogues,
  activeDialogue: {
    dialogueId: null,
    currentNodeId: null,
  },
  lastBriefing: {
    dialogueId: null,
    nodeId: null,
  },
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
      state.lastBriefing = {
        dialogueId,
        nodeId,
      };
    },
    
    // Update current dialogue node
    setDialogueNode: (state, action: PayloadAction<string | null>) => {
      state.activeDialogue.currentNodeId = action.payload;
      if (action.payload) {
        state.lastBriefing = {
          dialogueId: state.activeDialogue.dialogueId,
          nodeId: action.payload,
        };
      }
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
      state.lastBriefing = {
        dialogueId: null,
        nodeId: null,
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
