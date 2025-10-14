import { describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import {
  createDialogue,
  createSkillCheckDialogue,
  getAvailableOptions,
  getFirstDialogueNode,
  selectDialogueOption,
} from '../dialogueSystem';
import { createQuest } from '../questSystem';
import { DEFAULT_PLAYER, createDefaultPersonalityProfile } from '../../interfaces/player';
import { Dialogue, DialogueNode, Player } from '../../interfaces/types';

const clonePlayer = (overrides: Partial<Player> = {}): Player => ({
  ...(JSON.parse(JSON.stringify(DEFAULT_PLAYER)) as Player),
  id: uuidv4(),
  personality: createDefaultPersonalityProfile(),
  ...overrides,
});

const firstNode = (dialogue: Dialogue): DialogueNode => {
  const node = getFirstDialogueNode(dialogue);
  if (!node) {
    throw new Error('Dialogue is missing an initial node');
  }
  return node;
};

describe('dialogueSystem', () => {
  it('hides skill-locked options when requirements are not met', () => {
    const dialogue = createDialogue('npc:fray', [
      {
        text: 'How charming are you?',
        options: [
          {
            text: 'Attempt a charismatic appeal',
            nextNodeId: null,
            skillCheck: { skill: 'charisma', threshold: 8 },
          },
          {
            text: 'Keep it professional',
            nextNodeId: null,
          },
        ],
      },
    ]);

    const cautiousPlayer = clonePlayer({ skills: { ...DEFAULT_PLAYER.skills, charisma: 5 } });
    const boldPlayer = clonePlayer({ skills: { ...DEFAULT_PLAYER.skills, charisma: 9 } });

    const cautiousOptions = getAvailableOptions(cautiousPlayer, firstNode(dialogue));
    expect(cautiousOptions).toHaveLength(1);
    expect(cautiousOptions[0].text).toContain('professional');

    const confidentOptions = getAvailableOptions(boldPlayer, firstNode(dialogue));
    expect(confidentOptions).toHaveLength(2);
  });

  it('supports skill-based gating using player training values', () => {
    const dialogue = createDialogue('npc:broker', [
      {
        text: 'Convince the broker to lower prices.',
        options: [
          {
            text: 'Lean on persuasion training',
            nextNodeId: null,
            skillCheck: { skill: 'persuasion', threshold: 40, domain: 'skill' },
          },
          {
            text: 'Pay the asking price',
            nextNodeId: null,
          },
        ],
      },
    ]);

    const novice = clonePlayer();
    const veteran = clonePlayer({
      skillTraining: {
        ...DEFAULT_PLAYER.skillTraining,
        persuasion: 55,
      },
    });

    expect(getAvailableOptions(novice, firstNode(dialogue))).toHaveLength(1);
    expect(getAvailableOptions(veteran, firstNode(dialogue))).toHaveLength(2);
  });

  it('applies quest effects when selecting dialogue options', () => {
    const quest = createQuest(
      'Rescue Operative',
      'Find and extract the captured scout.',
      [
        {
          description: 'Enter the tunnels',
          type: 'explore',
          target: 'industrial-tunnels',
        },
      ],
      [{ type: 'experience', amount: 200 }]
    );

    const dialogue = createDialogue('npc:commander', [
      {
        text: 'We need you on this op.',
        options: [
          {
            text: "I'm in.",
            nextNodeId: null,
            questEffect: { questId: quest.id, effect: 'start' },
          },
          {
            text: 'Not today.',
            nextNodeId: null,
          },
        ],
      },
    ]);

    const player = clonePlayer();
    const node = firstNode(dialogue);

    const { quests, questEffect } = selectDialogueOption(
      dialogue,
      node.id,
      0,
      player,
      [quest]
    );

    expect(questEffect).toEqual({ type: 'started', questId: quest.id });
    expect(quests[0].isActive).toBe(true);
  });

  it('creates reusable skill-check dialogues with success and failure branches', () => {
    const dialogue = createSkillCheckDialogue(
      'npc:guard',
      'The guard eyes you warily.',
      {
        text: 'Convince him to let you pass',
        skill: 'charisma',
        threshold: 6,
        successText: 'Fine, but make it quick.',
        failureText: 'Absolutely not.',
      },
      {
        text: 'Back away slowly',
        responseText: 'You retreat and reconsider your options.',
      }
    );

    expect(dialogue.nodes).toHaveLength(4);
    const [, successNode, failureNode] = dialogue.nodes;
    expect(successNode.text).toBe('Fine, but make it quick.');
    expect(failureNode.text).toBe('Absolutely not.');
  });
});

