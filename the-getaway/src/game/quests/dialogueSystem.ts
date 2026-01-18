import { Dialogue, DialogueNode, DialogueOption, Player, PlayerSkills, Quest, SkillId } from '../interfaces/types';
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

// Check if a skill check passes
export const checkSkillRequirement = (player: Player, option: DialogueOption): boolean => {
  if (!option.skillCheck) {
    return true; // No skill check required
  }

  const { skill, threshold, domain } = option.skillCheck;
  const checkDomain = domain ?? 'attribute';

  if (checkDomain === 'skill') {
    const skillId = skill as SkillId;
    const currentValue = player.skillTraining[skillId] ?? 0;
    return currentValue >= threshold;
  }

  const attributeKey = skill as keyof PlayerSkills;
  const attributeValue = player.skills[attributeKey];
  const bonus = getPlayerDialogueBonus(player, attributeKey);

  return skillCheckPasses(attributeValue, threshold, bonus);
};

const checkFactionRequirement = (
  player: Player,
  option: DialogueOption,
  reputationSystemsEnabled: boolean = true
): boolean => {
  if (!reputationSystemsEnabled || !option.factionRequirement) {
    return true;
  }

  const { factionId, minimumStanding, maximumStanding, minimumReputation, maximumReputation } =
    option.factionRequirement;
  const value = player.factionReputation?.[factionId] ?? 0;
  const standing = getStandingForValue(value);

  if (typeof minimumReputation === 'number' && value < minimumReputation) {
    return false;
  }

  if (typeof maximumReputation === 'number' && value > maximumReputation) {
    return false;
  }

  if (minimumStanding) {
    const currentRank = getStandingRank(standing.id);
    const minimumRank = getStandingRank(minimumStanding);
    if (currentRank < minimumRank) {
      return false;
    }
  }

  if (maximumStanding) {
    const currentRank = getStandingRank(standing.id);
    const maximumRank = getStandingRank(maximumStanding);
    if (currentRank > maximumRank) {
      return false;
    }
  }

  return true;
};

// Filter dialogue options based on player skills
export const getAvailableOptions = (
  player: Player,
  node: DialogueNode,
  options?: { reputationSystemsEnabled?: boolean }
): DialogueOption[] => {
  const reputationEnabled = options?.reputationSystemsEnabled ?? true;
  return node.options.filter(
    (option) =>
      checkSkillRequirement(player, option)
      && checkFactionRequirement(player, option, reputationEnabled)
  );
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
  
  // Check if skill requirement is met
  if (
    !checkSkillRequirement(player, selectedOption)
    || !checkFactionRequirement(player, selectedOption, reputationEnabled)
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
