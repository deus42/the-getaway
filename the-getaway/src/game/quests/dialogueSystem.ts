import { Dialogue, DialogueNode, DialogueOption, Player, Quest } from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';
import { startQuest, updateObjective, completeQuest } from './questSystem';

// Create a dialogue
export const createDialogue = (npcId: string, nodes: Omit<DialogueNode, 'id'>[]): Dialogue => {
  return {
    id: uuidv4(),
    npcId,
    nodes: nodes.map(node => ({
      ...node,
      id: uuidv4()
    }))
  };
};

// Get dialogue node by ID
export const getDialogueNode = (dialogue: Dialogue, nodeId: string): DialogueNode | undefined => {
  return dialogue.nodes.find(node => node.id === nodeId);
};

// Get first node of a dialogue
export const getFirstDialogueNode = (dialogue: Dialogue): DialogueNode | undefined => {
  return dialogue.nodes[0];
};

// Check if a skill check passes
export const checkSkillRequirement = (player: Player, option: DialogueOption): boolean => {
  if (!option.skillCheck) {
    return true; // No skill check required
  }
  
  const { skill, threshold } = option.skillCheck;
  return player.skills[skill] >= threshold;
};

// Filter dialogue options based on player skills
export const getAvailableOptions = (player: Player, node: DialogueNode): DialogueOption[] => {
  return node.options.filter(option => checkSkillRequirement(player, option));
};

// Select a dialogue option and get next node
export const selectDialogueOption = (
  dialogue: Dialogue,
  currentNodeId: string,
  optionIndex: number,
  player: Player,
  quests: Quest[]
): {
  nextNode: DialogueNode | null;
  player: Player;
  quests: Quest[];
  questEffect?: {
    type: 'started' | 'updated' | 'completed';
    questId: string;
  };
} => {
  const currentNode = getDialogueNode(dialogue, currentNodeId);
  
  if (!currentNode || optionIndex >= currentNode.options.length) {
    return { nextNode: null, player, quests };
  }
  
  const selectedOption = currentNode.options[optionIndex];
  
  // Check if skill requirement is met
  if (!checkSkillRequirement(player, selectedOption)) {
    return { nextNode: null, player, quests };
  }
  
  // Handle quest effects if any
  let updatedPlayer = { ...player };
  let updatedQuests = [...quests];
  let questEffect: { type: 'started' | 'updated' | 'completed'; questId: string; } | undefined;
  
  if (selectedOption.questEffect) {
    const { questId, effect, objectiveId } = selectedOption.questEffect;
    
    switch (effect) {
      case 'start': {
        const startResult = startQuest(updatedPlayer, updatedQuests, questId);
        updatedPlayer = startResult.player;
        updatedQuests = startResult.quests;
        questEffect = { type: 'started', questId };
        break;
      }
      case 'update': {
        if (objectiveId) {
          updatedQuests = updateObjective(updatedQuests, questId, objectiveId, true);
          questEffect = { type: 'updated', questId };
        }
        break;
      }
      case 'complete': {
        const completeResult = completeQuest(updatedPlayer, updatedQuests, questId);
        updatedPlayer = completeResult.player;
        updatedQuests = completeResult.quests;
        questEffect = { type: 'completed', questId };
        break;
      }
    }
  }
  
  // Get next node if available
  const nextNode = selectedOption.nextNodeId 
    ? getDialogueNode(dialogue, selectedOption.nextNodeId) ?? null
    : null;
  
  return { 
    nextNode, 
    player: updatedPlayer, 
    quests: updatedQuests,
    questEffect
  };
};

// Create a dialogue with a skill check
export const createSkillCheckDialogue = (
  npcId: string,
  initialText: string,
  skillCheckOption: {
    text: string;
    skill: keyof Player['skills'];
    threshold: number;
    successText: string;
    failureText: string;
  },
  standardOption: {
    text: string;
    responseText: string;
  }
): Dialogue => {
  // Create node IDs in advance
  const initialNodeId = uuidv4();
  const successNodeId = uuidv4();
  const failureNodeId = uuidv4();
  const standardResponseNodeId = uuidv4();
  
  // Create dialogue structure
  return {
    id: uuidv4(),
    npcId,
    nodes: [
      {
        id: initialNodeId,
        text: initialText,
        options: [
          {
            text: skillCheckOption.text,
            nextNodeId: null, // Will be determined by skill check at runtime
            skillCheck: {
              skill: skillCheckOption.skill,
              threshold: skillCheckOption.threshold
            }
          },
          {
            text: standardOption.text,
            nextNodeId: standardResponseNodeId
          }
        ]
      },
      {
        id: successNodeId,
        text: skillCheckOption.successText,
        options: [
          {
            text: "Goodbye.",
            nextNodeId: null
          }
        ]
      },
      {
        id: failureNodeId,
        text: skillCheckOption.failureText,
        options: [
          {
            text: "Goodbye.",
            nextNodeId: null
          }
        ]
      },
      {
        id: standardResponseNodeId,
        text: standardOption.responseText,
        options: [
          {
            text: "Goodbye.",
            nextNodeId: null
          }
        ]
      }
    ]
  };
};

// Create a simple quest-giving dialogue
export const createQuestGivingDialogue = (
  npcId: string,
  questId: string,
  introText: string,
  questDescription: string,
  acceptText: string,
  rejectText: string,
  alreadyAcceptedText: string
): Dialogue => {
  // Create node IDs in advance
  const initialNodeId = uuidv4();
  const questInfoNodeId = uuidv4();
  const acceptNodeId = uuidv4();
  const rejectNodeId = uuidv4();
  const alreadyAcceptedNodeId = uuidv4();
  
  // Create dialogue structure
  return {
    id: uuidv4(),
    npcId,
    nodes: [
      {
        id: initialNodeId,
        text: introText,
        options: [
          {
            text: "Tell me more.",
            nextNodeId: questInfoNodeId
          },
          {
            text: "Not interested.",
            nextNodeId: null
          }
        ]
      },
      {
        id: questInfoNodeId,
        text: questDescription,
        options: [
          {
            text: "I'll do it.",
            nextNodeId: acceptNodeId,
            questEffect: {
              questId,
              effect: 'start'
            }
          },
          {
            text: "No thanks.",
            nextNodeId: rejectNodeId
          }
        ]
      },
      {
        id: acceptNodeId,
        text: acceptText,
        options: [
          {
            text: "Goodbye.",
            nextNodeId: null
          }
        ]
      },
      {
        id: rejectNodeId,
        text: rejectText,
        options: [
          {
            text: "Goodbye.",
            nextNodeId: null
          }
        ]
      },
      {
        id: alreadyAcceptedNodeId,
        text: alreadyAcceptedText,
        options: [
          {
            text: "Goodbye.",
            nextNodeId: null
          }
        ]
      }
    ]
  };
}; 