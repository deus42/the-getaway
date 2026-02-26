import {
  Dialogue,
  DialogueNode,
  DialogueOption,
  FactionId,
  FactionStanding,
  Player,
  PlayerSkills,
  Quest,
  SkillId,
} from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';
import { startQuest, updateObjective, completeQuest } from './questSystem';
import { calculateDerivedStatsWithEquipment, calculateDerivedStats, skillCheckPasses } from '../systems/statCalculations';
import { getStandingForValue, getStandingRank } from '../systems/factions';

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

const getPlayerDialogueBonus = (player: Player, skill: keyof PlayerSkills): number => {
  try {
    const derived = calculateDerivedStatsWithEquipment(player);
    if (skill === 'charisma') {
      return derived.dialogueThresholdBonus;
    }
    return 0;
  } catch (error) {
    console.warn('[DialogueSystem] Falling back to base stats for dialogue bonus.', error);
    const derived = calculateDerivedStats(player.skills);
    return skill === 'charisma' ? derived.dialogueThresholdBonus : 0;
  }
};

type DialogueCheckVisibility = 'locked' | 'hidden';
type DialogueFactionVisibility = 'locked' | 'hidden';

export interface DialogueCheckState {
  isPassed: boolean;
  currentValue: number;
  requiredValue: number;
  visibility: DialogueCheckVisibility;
  domain: 'attribute' | 'skill';
}

export interface DialogueFactionCheckState {
  isPassed: boolean;
  visibility: DialogueFactionVisibility;
  factionId: FactionId;
  currentReputation: number;
  currentStanding: FactionStanding;
  minimumStanding?: FactionStanding;
  maximumStanding?: FactionStanding;
  minimumReputation?: number;
  maximumReputation?: number;
  failedRequirement?: 'minimumStanding' | 'maximumStanding' | 'minimumReputation' | 'maximumReputation';
}

const resolveCheckVisibility = (option: DialogueOption): DialogueCheckVisibility => {
  return option.skillCheck?.visibility ?? 'locked';
};

const resolveFactionVisibility = (option: DialogueOption): DialogueFactionVisibility => {
  return option.factionRequirement?.visibility ?? 'locked';
};

export const resolveDialogueCheckState = (
  player: Player,
  option: DialogueOption
): DialogueCheckState | null => {
  if (!option.skillCheck) {
    return null;
  }

  const { skill, threshold, domain } = option.skillCheck;
  const checkDomain = domain ?? 'attribute';
  const visibility = resolveCheckVisibility(option);

  if (checkDomain === 'skill') {
    const skillId = skill as SkillId;
    const currentValue = player.skillTraining[skillId] ?? 0;
    return {
      isPassed: currentValue >= threshold,
      currentValue,
      requiredValue: threshold,
      visibility,
      domain: checkDomain,
    };
  }

  const attributeKey = skill as keyof PlayerSkills;
  const attributeValue = player.skills[attributeKey];
  const bonus = getPlayerDialogueBonus(player, attributeKey);
  const currentValue = attributeValue + bonus;

  return {
    isPassed: skillCheckPasses(attributeValue, threshold, bonus),
    currentValue,
    requiredValue: threshold,
    visibility,
    domain: checkDomain,
  };
};

export const resolveDialogueFactionState = (
  player: Player,
  option: DialogueOption,
  reputationSystemsEnabled: boolean = true
): DialogueFactionCheckState | null => {
  if (!reputationSystemsEnabled || !option.factionRequirement) {
    return null;
  }

  const {
    factionId,
    minimumStanding,
    maximumStanding,
    minimumReputation,
    maximumReputation,
  } = option.factionRequirement;

  const currentReputation = player.factionReputation?.[factionId] ?? 0;
  const currentStanding = getStandingForValue(currentReputation).id;
  const visibility = resolveFactionVisibility(option);

  let failedRequirement: DialogueFactionCheckState['failedRequirement'];

  if (typeof minimumReputation === 'number' && currentReputation < minimumReputation) {
    failedRequirement = 'minimumReputation';
  }

  if (!failedRequirement && typeof maximumReputation === 'number' && currentReputation > maximumReputation) {
    failedRequirement = 'maximumReputation';
  }

  if (!failedRequirement && minimumStanding) {
    const currentRank = getStandingRank(currentStanding);
    const minimumRank = getStandingRank(minimumStanding);
    if (currentRank < minimumRank) {
      failedRequirement = 'minimumStanding';
    }
  }

  if (!failedRequirement && maximumStanding) {
    const currentRank = getStandingRank(currentStanding);
    const maximumRank = getStandingRank(maximumStanding);
    if (currentRank > maximumRank) {
      failedRequirement = 'maximumStanding';
    }
  }

  return {
    isPassed: !failedRequirement,
    visibility,
    factionId,
    currentReputation,
    currentStanding,
    minimumStanding,
    maximumStanding,
    minimumReputation,
    maximumReputation,
    failedRequirement,
  };
};

// Check if a skill check passes
export const checkSkillRequirement = (player: Player, option: DialogueOption): boolean => {
  const checkState = resolveDialogueCheckState(player, option);
  if (!checkState) {
    return true;
  }
  return checkState.isPassed;
};

// Filter dialogue options based on player skills
export const getAvailableOptions = (
  player: Player,
  node: DialogueNode,
  options?: { reputationSystemsEnabled?: boolean }
): DialogueOption[] => {
  const reputationEnabled = options?.reputationSystemsEnabled ?? true;
  return node.options.filter((option) => {
    const checkState = resolveDialogueCheckState(player, option);
    if (checkState && !checkState.isPassed) {
      return false;
    }
    const factionState = resolveDialogueFactionState(player, option, reputationEnabled);
    if (factionState && !factionState.isPassed) {
      return false;
    }
    return true;
  });
};

// Select a dialogue option and get next node
export const selectDialogueOption = (
  dialogue: Dialogue,
  currentNodeId: string,
  optionIndex: number,
  player: Player,
  quests: Quest[],
  options?: { reputationSystemsEnabled?: boolean }
): {
  nextNode: DialogueNode | null;
  player: Player;
  quests: Quest[];
  questEffect?: {
    type: 'started' | 'updated' | 'completed';
    questId: string;
  };
} => {
  const reputationEnabled = options?.reputationSystemsEnabled ?? true;
  const currentNode = getDialogueNode(dialogue, currentNodeId);

  if (!currentNode || optionIndex < 0 || optionIndex >= currentNode.options.length) {
    return { nextNode: null, player, quests };
  }

  const selectedOption = currentNode.options[optionIndex];

  if (!selectedOption) {
    return { nextNode: null, player, quests };
  }
  
  // Check if dialogue requirement is met
  const checkState = resolveDialogueCheckState(player, selectedOption);
  const factionState = resolveDialogueFactionState(player, selectedOption, reputationEnabled);
  if (
    (checkState ? !checkState.isPassed : false)
    || (factionState ? !factionState.isPassed : false)
  ) {
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
