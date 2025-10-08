import {
  createDialogue,
  getDialogueNode,
  getFirstDialogueNode,
  checkSkillRequirement,
  getAvailableOptions,
  selectDialogueOption,
  createSkillCheckDialogue,
  createQuestGivingDialogue,
} from '../game/quests/dialogueSystem';
import { Dialogue, DialogueNode, DialogueOption, Player, Quest } from '../game/interfaces/types';
import { DEFAULT_PLAYER, DEFAULT_SKILLS } from '../game/interfaces/player';
import { v4 as uuidv4 } from 'uuid';

const createTestPlayer = (overrides?: Partial<Player>): Player => ({
  ...DEFAULT_PLAYER,
  id: uuidv4(),
  name: 'Test Player',
  position: { x: 0, y: 0 },
  health: 100,
  maxHealth: 100,
  actionPoints: 10,
  maxActionPoints: 10,
  skills: { ...DEFAULT_SKILLS },
  level: 1,
  experience: 0,
  credits: 0,
  skillPoints: 0,
  attributePoints: 0,
  inventory: {
    items: [],
    maxWeight: 50,
    currentWeight: 0,
    hotbar: [null, null, null, null, null],
  },
  equipped: {
    weapon: undefined,
    armor: undefined,
    accessory: undefined,
    secondaryWeapon: undefined,
    meleeWeapon: undefined,
    bodyArmor: undefined,
    helmet: undefined,
    accessory1: undefined,
    accessory2: undefined,
  },
  equippedSlots: {},
  activeWeaponSlot: 'primaryWeapon',
  perks: [],
  factionReputation: {
    resistance: 0,
    corpsec: 0,
    scavengers: 0,
  },
  backgroundId: undefined,
  appearancePreset: undefined,
  encumbrance: {
    level: 'normal',
    percentage: 0,
    movementApMultiplier: 1,
    attackApMultiplier: 1,
  },
  ...overrides,
});

const createTestQuest = (): Quest => ({
  id: uuidv4(),
  name: 'Test Quest',
  description: 'A test quest',
  isActive: false,
  isCompleted: false,
  objectives: [
    {
      id: uuidv4(),
      description: 'Test objective',
      type: 'talk',
      target: 'npc-1',
      isCompleted: false,
    },
  ],
  rewards: [{ type: 'experience', amount: 100 }],
});

describe('dialogueSystem', () => {
  describe('createDialogue', () => {
    it('creates dialogue with generated IDs', () => {
      const dialogue = createDialogue('npc-1', [
        {
          text: 'Hello',
          speaker: 'NPC',
          options: [],
        },
      ]);

      expect(dialogue.id).toBeDefined();
      expect(dialogue.npcId).toBe('npc-1');
      expect(dialogue.nodes).toHaveLength(1);
      expect(dialogue.nodes[0].id).toBeDefined();
      expect(dialogue.nodes[0].text).toBe('Hello');
    });

    it('creates dialogue with multiple nodes', () => {
      const dialogue = createDialogue('npc-1', [
        { text: 'Node 1', speaker: 'NPC', options: [] },
        { text: 'Node 2', speaker: 'NPC', options: [] },
      ]);

      expect(dialogue.nodes).toHaveLength(2);
      expect(dialogue.nodes[0].id).not.toBe(dialogue.nodes[1].id);
    });
  });

  describe('getDialogueNode', () => {
    it('finds node by ID', () => {
      const dialogue = createDialogue('npc-1', [
        { text: 'Node 1', speaker: 'NPC', options: [] },
        { text: 'Node 2', speaker: 'NPC', options: [] },
      ]);

      const node = getDialogueNode(dialogue, dialogue.nodes[1].id);

      expect(node).toBeDefined();
      expect(node?.text).toBe('Node 2');
    });

    it('returns undefined for non-existent node', () => {
      const dialogue = createDialogue('npc-1', [
        { text: 'Node 1', speaker: 'NPC', options: [] },
      ]);

      const node = getDialogueNode(dialogue, 'nonexistent-id');

      expect(node).toBeUndefined();
    });
  });

  describe('getFirstDialogueNode', () => {
    it('returns first node', () => {
      const dialogue = createDialogue('npc-1', [
        { text: 'First', speaker: 'NPC', options: [] },
        { text: 'Second', speaker: 'NPC', options: [] },
      ]);

      const node = getFirstDialogueNode(dialogue);

      expect(node).toBeDefined();
      expect(node?.text).toBe('First');
    });

    it('returns undefined for empty dialogue', () => {
      const dialogue: Dialogue = {
        id: uuidv4(),
        npcId: 'npc-1',
        nodes: [],
      };

      const node = getFirstDialogueNode(dialogue);

      expect(node).toBeUndefined();
    });
  });

  describe('checkSkillRequirement', () => {
    it('passes when no skill check required', () => {
      const player = createTestPlayer();
      const option: DialogueOption = {
        text: 'Option',
        nextNodeId: null,
      };

      expect(checkSkillRequirement(player, option)).toBe(true);
    });

    it('passes when skill meets threshold', () => {
      const player = createTestPlayer({
        skills: { ...DEFAULT_SKILLS, charisma: 8 },
      });
      const option: DialogueOption = {
        text: 'Option',
        nextNodeId: null,
        skillCheck: {
          skill: 'charisma',
          threshold: 5,
        },
      };

      expect(checkSkillRequirement(player, option)).toBe(true);
    });

    it('fails when skill below threshold', () => {
      const player = createTestPlayer({
        skills: { ...DEFAULT_SKILLS, charisma: 3 },
      });
      const option: DialogueOption = {
        text: 'Option',
        nextNodeId: null,
        skillCheck: {
          skill: 'charisma',
          threshold: 8,
        },
      };

      expect(checkSkillRequirement(player, option)).toBe(false);
    });

    it('passes when trained skill meets threshold', () => {
      const player = createTestPlayer({
        skillTraining: {
          ...DEFAULT_PLAYER.skillTraining,
          hacking: 60,
        },
      });

      const option: DialogueOption = {
        text: 'Hack access panel',
        nextNodeId: null,
        skillCheck: {
          skill: 'hacking',
          threshold: 50,
          domain: 'skill',
        },
      };

      expect(checkSkillRequirement(player, option)).toBe(true);
    });

    it('fails when trained skill is below threshold', () => {
      const player = createTestPlayer({
        skillTraining: {
          ...DEFAULT_PLAYER.skillTraining,
          hacking: 10,
        },
      });

      const option: DialogueOption = {
        text: 'Hack access panel',
        nextNodeId: null,
        skillCheck: {
          skill: 'hacking',
          threshold: 40,
          domain: 'skill',
        },
      };

      expect(checkSkillRequirement(player, option)).toBe(false);
    });
  });

  describe('getAvailableOptions', () => {
    it('returns all options when no skill checks', () => {
      const player = createTestPlayer();
      const node: DialogueNode = {
        id: uuidv4(),
        text: 'Hello',
        speaker: 'NPC',
        options: [
          { text: 'Option 1', nextNodeId: null },
          { text: 'Option 2', nextNodeId: null },
        ],
      };

      const available = getAvailableOptions(player, node);

      expect(available).toHaveLength(2);
    });

    it('filters options based on skill checks', () => {
      const player = createTestPlayer({
        skills: { ...DEFAULT_SKILLS, charisma: 3 },
      });
      const node: DialogueNode = {
        id: uuidv4(),
        text: 'Hello',
        speaker: 'NPC',
        options: [
          {
            text: 'Persuade',
            nextNodeId: null,
            skillCheck: { skill: 'charisma', threshold: 8 },
          },
          { text: 'Regular option', nextNodeId: null },
        ],
      };

      const available = getAvailableOptions(player, node);

      expect(available).toHaveLength(1);
      expect(available[0].text).toBe('Regular option');
    });

    it('includes skill check options player can pass', () => {
      const player = createTestPlayer({
        skills: { ...DEFAULT_SKILLS, intelligence: 9 },
      });
      const node: DialogueNode = {
        id: uuidv4(),
        text: 'Hello',
        speaker: 'NPC',
        options: [
          {
            text: 'Smart option',
            nextNodeId: null,
            skillCheck: { skill: 'intelligence', threshold: 7 },
          },
          { text: 'Regular option', nextNodeId: null },
        ],
      };

      const available = getAvailableOptions(player, node);

      expect(available).toHaveLength(2);
    });

    it('filters options when faction requirements are not met', () => {
      const player = createTestPlayer();
      const node: DialogueNode = {
        id: uuidv4(),
        text: 'Faction gate',
        speaker: 'NPC',
        options: [
          {
            text: 'Resistance intel',
            nextNodeId: null,
            factionRequirement: {
              factionId: 'resistance',
              minimumStanding: 'friendly',
            },
          },
          {
            text: 'Scavenger trade',
            nextNodeId: null,
            factionRequirement: {
              factionId: 'scavengers',
              minimumStanding: 'neutral',
            },
          },
        ],
      };

      const available = getAvailableOptions(player, node);

      expect(available).toHaveLength(1);
      expect(available[0].text).toBe('Scavenger trade');
    });
  });

  describe('selectDialogueOption', () => {
    it('returns next node when option selected', () => {
      const node2Id = uuidv4();
      const dialogue = createDialogue('npc-1', [
        {
          text: 'Node 1',
          speaker: 'NPC',
          options: [{ text: 'Go to node 2', nextNodeId: node2Id }],
        },
        { text: 'Node 2', speaker: 'NPC', options: [] },
      ]);
      dialogue.nodes[1].id = node2Id;

      const player = createTestPlayer();
      const result = selectDialogueOption(
        dialogue,
        dialogue.nodes[0].id,
        0,
        player,
        []
      );

      expect(result.nextNode).toBeDefined();
      expect(result.nextNode?.text).toBe('Node 2');
    });

    it('returns null when selecting invalid option index', () => {
      const dialogue = createDialogue('npc-1', [
        {
          text: 'Node 1',
          speaker: 'NPC',
          options: [{ text: 'Option', nextNodeId: null }],
        },
      ]);

      const player = createTestPlayer();
      const result = selectDialogueOption(
        dialogue,
        dialogue.nodes[0].id,
        999,
        player,
        []
      );

      expect(result.nextNode).toBeNull();
    });

    it('returns null when skill check fails', () => {
      const dialogue = createDialogue('npc-1', [
        {
          text: 'Node 1',
          speaker: 'NPC',
          options: [
            {
              text: 'Persuade',
              nextNodeId: null,
              skillCheck: { skill: 'charisma', threshold: 10 },
            },
          ],
        },
      ]);

      const player = createTestPlayer({
        skills: { ...DEFAULT_SKILLS, charisma: 3 },
      });
      const result = selectDialogueOption(
        dialogue,
        dialogue.nodes[0].id,
        0,
        player,
        []
      );

      expect(result.nextNode).toBeNull();
    });

    it('starts quest when option has quest start effect', () => {
      const quest = createTestQuest();
      const dialogue = createDialogue('npc-1', [
        {
          text: 'Node 1',
          speaker: 'NPC',
          options: [
            {
              text: 'Accept quest',
              nextNodeId: null,
              questEffect: { questId: quest.id, effect: 'start' },
            },
          ],
        },
      ]);

      const player = createTestPlayer();
      const result = selectDialogueOption(
        dialogue,
        dialogue.nodes[0].id,
        0,
        player,
        [quest]
      );

      expect(result.questEffect).toEqual({
        type: 'started',
        questId: quest.id,
      });
      const updatedQuest = result.quests.find((q) => q.id === quest.id);
      expect(updatedQuest?.isActive).toBe(true);
    });

    it('updates objective when option has quest update effect', () => {
      const quest = createTestQuest();
      quest.isActive = true;
      const objectiveId = quest.objectives[0].id;

      const dialogue = createDialogue('npc-1', [
        {
          text: 'Node 1',
          speaker: 'NPC',
          options: [
            {
              text: 'Complete objective',
              nextNodeId: null,
              questEffect: {
                questId: quest.id,
                effect: 'update',
                objectiveId,
              },
            },
          ],
        },
      ]);

      const player = createTestPlayer();
      const result = selectDialogueOption(
        dialogue,
        dialogue.nodes[0].id,
        0,
        player,
        [quest]
      );

      expect(result.questEffect).toEqual({
        type: 'updated',
        questId: quest.id,
      });
      const updatedQuest = result.quests.find((q) => q.id === quest.id);
      expect(updatedQuest?.objectives[0].isCompleted).toBe(true);
    });

    it('completes quest when option has quest complete effect', () => {
      const quest = createTestQuest();
      quest.isActive = true;
      quest.objectives[0].isCompleted = true;

      const dialogue = createDialogue('npc-1', [
        {
          text: 'Node 1',
          speaker: 'NPC',
          options: [
            {
              text: 'Turn in quest',
              nextNodeId: null,
              questEffect: { questId: quest.id, effect: 'complete' },
            },
          ],
        },
      ]);

      const player = createTestPlayer();
      const result = selectDialogueOption(
        dialogue,
        dialogue.nodes[0].id,
        0,
        player,
        [quest]
      );

      expect(result.questEffect).toEqual({
        type: 'completed',
        questId: quest.id,
      });
      const updatedQuest = result.quests.find((q) => q.id === quest.id);
      expect(updatedQuest?.isCompleted).toBe(true);
      expect(updatedQuest?.isActive).toBe(false);
    });
  });

  describe('createSkillCheckDialogue', () => {
    it('creates dialogue with skill check structure', () => {
      const dialogue = createSkillCheckDialogue(
        'npc-1',
        'Initial text',
        {
          text: 'Persuade',
          skill: 'charisma',
          threshold: 7,
          successText: 'Success',
          failureText: 'Failure',
        },
        {
          text: 'Regular option',
          responseText: 'Regular response',
        }
      );

      expect(dialogue.npcId).toBe('npc-1');
      expect(dialogue.nodes).toHaveLength(4);
      expect(dialogue.nodes[0].text).toBe('Initial text');
      expect(dialogue.nodes[0].options).toHaveLength(2);
      expect(dialogue.nodes[0].options[0].skillCheck).toBeDefined();
      expect(dialogue.nodes[0].options[0].skillCheck?.skill).toBe('charisma');
      expect(dialogue.nodes[0].options[0].skillCheck?.threshold).toBe(7);
    });
  });

  describe('createQuestGivingDialogue', () => {
    it('creates quest-giving dialogue structure', () => {
      const questId = uuidv4();
      const dialogue = createQuestGivingDialogue(
        'npc-1',
        questId,
        'Intro',
        'Quest description',
        'Accept text',
        'Reject text',
        'Already accepted'
      );

      expect(dialogue.npcId).toBe('npc-1');
      expect(dialogue.nodes).toHaveLength(5);
      expect(dialogue.nodes[0].text).toBe('Intro');
      expect(dialogue.nodes[1].text).toBe('Quest description');
      expect(dialogue.nodes[1].options[0].questEffect).toBeDefined();
      expect(dialogue.nodes[1].options[0].questEffect?.questId).toBe(questId);
      expect(dialogue.nodes[1].options[0].questEffect?.effect).toBe('start');
    });
  });
});
