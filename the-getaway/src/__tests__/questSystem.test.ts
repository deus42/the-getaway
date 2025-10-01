import {
  createQuest,
  startQuest,
  updateObjective,
  areAllObjectivesCompleted,
  updateObjectiveCount,
  completeQuest,
  getActiveQuests,
  getCompletedQuests,
  createDeliveryQuest,
} from '../game/quests/questSystem';
import { Quest, Player } from '../game/interfaces/types';
import { DEFAULT_PLAYER, DEFAULT_SKILLS } from '../game/interfaces/player';
import { v4 as uuidv4 } from 'uuid';

const createTestPlayer = (): Player => ({
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
  },
  equipped: {
    weapon: undefined,
    armor: undefined,
    accessory: undefined,
  },
  perks: [],
  factionReputation: {
    resistance: 0,
    corpsec: 0,
    scavengers: 0,
  },
  backgroundId: undefined,
  appearancePreset: undefined,
});

describe('questSystem', () => {
  describe('createQuest', () => {
    it('creates a quest with basic properties', () => {
      const quest = createQuest(
        'Test Quest',
        'A test quest',
        [
          { description: 'Talk to NPC', type: 'talk', target: 'npc-1' },
        ],
        [{ type: 'experience', amount: 100 }]
      );

      expect(quest.name).toBe('Test Quest');
      expect(quest.description).toBe('A test quest');
      expect(quest.isActive).toBe(false);
      expect(quest.isCompleted).toBe(false);
      expect(quest.objectives).toHaveLength(1);
      expect(quest.rewards).toHaveLength(1);
    });

    it('assigns unique IDs to objectives', () => {
      const quest = createQuest(
        'Multi-Objective Quest',
        'Multiple objectives',
        [
          { description: 'Objective 1', type: 'talk', target: 'npc-1' },
          { description: 'Objective 2', type: 'talk', target: 'npc-2' },
        ],
        []
      );

      expect(quest.objectives[0].id).toBeDefined();
      expect(quest.objectives[1].id).toBeDefined();
      expect(quest.objectives[0].id).not.toBe(quest.objectives[1].id);
    });

    it('initializes objectives with isCompleted false', () => {
      const quest = createQuest(
        'Test Quest',
        'Test',
        [{ description: 'Objective', type: 'talk', target: 'npc-1' }],
        []
      );

      expect(quest.objectives[0].isCompleted).toBe(false);
    });

    it('initializes count-based objectives with currentCount 0', () => {
      const quest = createQuest(
        'Collection Quest',
        'Collect items',
        [
          { description: 'Collect 5 items', type: 'collect', target: 'item-1', count: 5 },
          { description: 'Kill 3 enemies', type: 'kill', target: 'enemy-1', count: 3 },
        ],
        []
      );

      expect(quest.objectives[0].currentCount).toBe(0);
      expect(quest.objectives[1].currentCount).toBe(0);
    });
  });

  describe('startQuest', () => {
    it('activates a quest', () => {
      const player = createTestPlayer();
      const quest = createQuest('Test', 'Test quest', [], []);
      const quests = [quest];

      const result = startQuest(player, quests, quest.id);

      expect(result.quests[0].isActive).toBe(true);
    });

    it('does not activate already active quest', () => {
      const player = createTestPlayer();
      const quest = createQuest('Test', 'Test quest', [], []);
      quest.isActive = true;
      const quests = [quest];

      const result = startQuest(player, quests, quest.id);

      expect(result.quests[0].isActive).toBe(true);
      expect(result.quests).toEqual(quests);
    });

    it('does not activate completed quest', () => {
      const player = createTestPlayer();
      const quest = createQuest('Test', 'Test quest', [], []);
      quest.isCompleted = true;
      const quests = [quest];

      const result = startQuest(player, quests, quest.id);

      expect(result.quests[0].isCompleted).toBe(true);
      expect(result.quests).toEqual(quests);
    });

    it('returns unchanged data for non-existent quest', () => {
      const player = createTestPlayer();
      const quests: Quest[] = [];

      const result = startQuest(player, quests, 'nonexistent-id');

      expect(result.player).toBe(player);
      expect(result.quests).toBe(quests);
    });
  });

  describe('updateObjective', () => {
    it('marks objective as completed', () => {
      const quest = createQuest(
        'Test',
        'Test quest',
        [{ description: 'Objective', type: 'talk', target: 'npc-1' }],
        []
      );
      const quests = [quest];
      const objectiveId = quest.objectives[0].id;

      const updatedQuests = updateObjective(quests, quest.id, objectiveId, true);

      expect(updatedQuests[0].objectives[0].isCompleted).toBe(true);
    });

    it('updates objective current count', () => {
      const quest = createQuest(
        'Test',
        'Test quest',
        [{ description: 'Collect items', type: 'collect', target: 'item-1', count: 5 }],
        []
      );
      const quests = [quest];
      const objectiveId = quest.objectives[0].id;

      const updatedQuests = updateObjective(quests, quest.id, objectiveId, false, 3);

      expect(updatedQuests[0].objectives[0].currentCount).toBe(3);
      expect(updatedQuests[0].objectives[0].isCompleted).toBe(false);
    });

    it('returns unchanged quests for non-existent quest', () => {
      const quests: Quest[] = [];
      const result = updateObjective(quests, 'nonexistent-id', 'objective-id', true);

      expect(result).toBe(quests);
    });

    it('returns unchanged quests for non-existent objective', () => {
      const quest = createQuest('Test', 'Test quest', [], []);
      const quests = [quest];

      const result = updateObjective(quests, quest.id, 'nonexistent-objective', true);

      expect(result).toEqual(quests);
    });
  });

  describe('areAllObjectivesCompleted', () => {
    it('returns true when all objectives completed', () => {
      const quest = createQuest(
        'Test',
        'Test quest',
        [
          { description: 'Obj 1', type: 'talk', target: 'npc-1' },
          { description: 'Obj 2', type: 'talk', target: 'npc-2' },
        ],
        []
      );

      quest.objectives[0].isCompleted = true;
      quest.objectives[1].isCompleted = true;

      expect(areAllObjectivesCompleted(quest)).toBe(true);
    });

    it('returns false when some objectives incomplete', () => {
      const quest = createQuest(
        'Test',
        'Test quest',
        [
          { description: 'Obj 1', type: 'talk', target: 'npc-1' },
          { description: 'Obj 2', type: 'talk', target: 'npc-2' },
        ],
        []
      );

      quest.objectives[0].isCompleted = true;
      quest.objectives[1].isCompleted = false;

      expect(areAllObjectivesCompleted(quest)).toBe(false);
    });

    it('returns true for quest with no objectives', () => {
      const quest = createQuest('Test', 'Test quest', [], []);

      expect(areAllObjectivesCompleted(quest)).toBe(true);
    });
  });

  describe('updateObjectiveCount', () => {
    it('increments count for collect objective', () => {
      const quest = createQuest(
        'Collection Quest',
        'Collect items',
        [{ description: 'Collect 5 items', type: 'collect', target: 'item-1', count: 5 }],
        []
      );
      const quests = [quest];
      const objectiveId = quest.objectives[0].id;

      const updated1 = updateObjectiveCount(quests, quest.id, objectiveId, 1);
      expect(updated1[0].objectives[0].currentCount).toBe(1);
      expect(updated1[0].objectives[0].isCompleted).toBe(false);

      const updated2 = updateObjectiveCount(updated1, quest.id, objectiveId, 4);
      expect(updated2[0].objectives[0].currentCount).toBe(5);
      expect(updated2[0].objectives[0].isCompleted).toBe(true);
    });

    it('increments count for kill objective', () => {
      const quest = createQuest(
        'Kill Quest',
        'Kill enemies',
        [{ description: 'Kill 3 enemies', type: 'kill', target: 'enemy-1', count: 3 }],
        []
      );
      const quests = [quest];
      const objectiveId = quest.objectives[0].id;

      let updated = quests;
      updated = updateObjectiveCount(updated, quest.id, objectiveId);
      updated = updateObjectiveCount(updated, quest.id, objectiveId);
      updated = updateObjectiveCount(updated, quest.id, objectiveId);

      expect(updated[0].objectives[0].currentCount).toBe(3);
      expect(updated[0].objectives[0].isCompleted).toBe(true);
    });

    it('does not update count for talk objective', () => {
      const quest = createQuest(
        'Talk Quest',
        'Talk to NPC',
        [{ description: 'Talk to NPC', type: 'talk', target: 'npc-1' }],
        []
      );
      const quests = [quest];
      const objectiveId = quest.objectives[0].id;

      const updated = updateObjectiveCount(quests, quest.id, objectiveId);

      expect(updated).toEqual(quests);
    });

    it('marks objective complete when count reaches target', () => {
      const quest = createQuest(
        'Collection Quest',
        'Collect items',
        [{ description: 'Collect 3 items', type: 'collect', target: 'item-1', count: 3 }],
        []
      );
      const quests = [quest];
      const objectiveId = quest.objectives[0].id;

      const updated = updateObjectiveCount(quests, quest.id, objectiveId, 3);

      expect(updated[0].objectives[0].isCompleted).toBe(true);
    });

    it('returns unchanged quests for non-existent quest', () => {
      const quests: Quest[] = [];
      const result = updateObjectiveCount(quests, 'nonexistent-id', 'objective-id');

      expect(result).toBe(quests);
    });

    it('returns unchanged quests for non-existent objective', () => {
      const quest = createQuest('Test', 'Test quest', [], []);
      const quests = [quest];

      const result = updateObjectiveCount(quests, quest.id, 'nonexistent-objective');

      expect(result).toEqual(quests);
    });
  });

  describe('completeQuest', () => {
    it('completes quest and awards experience', () => {
      const player = createTestPlayer();
      const quest = createQuest(
        'Test Quest',
        'Test',
        [{ description: 'Objective', type: 'talk', target: 'npc-1' }],
        [{ type: 'experience', amount: 100 }]
      );
      quest.isActive = true;
      quest.objectives[0].isCompleted = true;

      const quests = [quest];

      const result = completeQuest(player, quests, quest.id);

      expect(result.quests[0].isCompleted).toBe(true);
      expect(result.quests[0].isActive).toBe(false);
      expect(result.player.experience).toBe(100);
    });

    it('does not complete quest if not active', () => {
      const player = createTestPlayer();
      const quest = createQuest('Test', 'Test', [], []);
      quest.isActive = false;
      quest.objectives[0] = {
        id: uuidv4(),
        description: 'Objective',
        type: 'talk',
        target: 'npc-1',
        isCompleted: true,
      };

      const quests = [quest];
      const result = completeQuest(player, quests, quest.id);

      expect(result.quests[0].isCompleted).toBe(false);
      expect(result.player.experience).toBe(0);
    });

    it('does not complete quest if objectives incomplete', () => {
      const player = createTestPlayer();
      const quest = createQuest(
        'Test',
        'Test',
        [{ description: 'Objective', type: 'talk', target: 'npc-1' }],
        [{ type: 'experience', amount: 100 }]
      );
      quest.isActive = true;
      quest.objectives[0].isCompleted = false;

      const quests = [quest];
      const result = completeQuest(player, quests, quest.id);

      expect(result.quests[0].isCompleted).toBe(false);
      expect(result.player.experience).toBe(0);
    });

    it('returns unchanged data for non-existent quest', () => {
      const player = createTestPlayer();
      const quests: Quest[] = [];

      const result = completeQuest(player, quests, 'nonexistent-id');

      expect(result.player).toBe(player);
      expect(result.quests).toBe(quests);
    });
  });

  describe('getActiveQuests', () => {
    it('returns only active quests', () => {
      const quest1 = createQuest('Active 1', 'Test', [], []);
      quest1.isActive = true;

      const quest2 = createQuest('Inactive', 'Test', [], []);
      quest2.isActive = false;

      const quest3 = createQuest('Active 2', 'Test', [], []);
      quest3.isActive = true;

      const quest4 = createQuest('Completed', 'Test', [], []);
      quest4.isActive = true;
      quest4.isCompleted = true;

      const quests = [quest1, quest2, quest3, quest4];
      const activeQuests = getActiveQuests(quests);

      expect(activeQuests).toHaveLength(2);
      expect(activeQuests).toContain(quest1);
      expect(activeQuests).toContain(quest3);
    });

    it('returns empty array when no active quests', () => {
      const quest = createQuest('Inactive', 'Test', [], []);
      quest.isActive = false;

      const quests = [quest];
      const activeQuests = getActiveQuests(quests);

      expect(activeQuests).toHaveLength(0);
    });
  });

  describe('getCompletedQuests', () => {
    it('returns only completed quests', () => {
      const quest1 = createQuest('Active', 'Test', [], []);
      quest1.isActive = true;

      const quest2 = createQuest('Completed 1', 'Test', [], []);
      quest2.isCompleted = true;

      const quest3 = createQuest('Completed 2', 'Test', [], []);
      quest3.isCompleted = true;

      const quests = [quest1, quest2, quest3];
      const completedQuests = getCompletedQuests(quests);

      expect(completedQuests).toHaveLength(2);
      expect(completedQuests).toContain(quest2);
      expect(completedQuests).toContain(quest3);
    });

    it('returns empty array when no completed quests', () => {
      const quest = createQuest('Active', 'Test', [], []);
      quest.isActive = true;

      const quests = [quest];
      const completedQuests = getCompletedQuests(quests);

      expect(completedQuests).toHaveLength(0);
    });
  });

  describe('createDeliveryQuest', () => {
    it('creates a delivery quest with correct structure', () => {
      const quest = createDeliveryQuest(
        'Delivery Mission',
        'Deliver package to Marcus',
        'Marcus',
        150
      );

      expect(quest.name).toBe('Delivery Mission');
      expect(quest.description).toBe('Deliver package to Marcus');
      expect(quest.objectives).toHaveLength(1);
      expect(quest.objectives[0].type).toBe('talk');
      expect(quest.objectives[0].target).toBe('Marcus');
      expect(quest.objectives[0].description).toContain('Marcus');
      expect(quest.rewards).toHaveLength(1);
      expect(quest.rewards[0].type).toBe('experience');
      expect(quest.rewards[0].amount).toBe(150);
    });
  });
});
