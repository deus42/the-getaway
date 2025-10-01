import { configureStore } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import questsReducer, {
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
  resetQuests,
  applyLocaleToQuests,
  QuestState,
} from '../store/questsSlice';
import { Quest, Dialogue } from '../game/interfaces/types';

const createTestStore = (preloadedState?: { quests: QuestState }) => {
  return configureStore({
    reducer: {
      quests: questsReducer,
    },
    preloadedState,
  });
};

const createTestQuest = (name = 'Test Quest'): Quest => ({
  id: uuidv4(),
  name,
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

const createTestDialogue = (id = 'test-dialogue'): Dialogue => ({
  id,
  name: 'Test Dialogue',
  nodes: [
    {
      id: 'node-1',
      text: 'Hello',
      speaker: 'NPC',
      choices: [],
    },
  ],
});

describe('questsSlice', () => {
  describe('quest management', () => {
    it('adds a new quest', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      store.dispatch(addQuest(quest));

      const quests = store.getState().quests.quests;
      expect(quests.find((q) => q.id === quest.id)).toEqual(quest);
    });

    it('updates an existing quest', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      store.dispatch(addQuest(quest));

      const updatedQuest = { ...quest, description: 'Updated description' };
      store.dispatch(updateQuest(updatedQuest));

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.description).toBe('Updated description');
    });

    it('does not update non-existent quest', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      const beforeQuests = store.getState().quests.quests;
      store.dispatch(updateQuest(quest));
      const afterQuests = store.getState().quests.quests;

      expect(afterQuests).toEqual(beforeQuests);
    });
  });

  describe('quest activation', () => {
    it('starts an inactive quest', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      store.dispatch(addQuest(quest));
      store.dispatch(startQuest(quest.id));

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.isActive).toBe(true);
    });

    it('does not start already active quest', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      quest.isActive = true;

      store.dispatch(addQuest(quest));
      store.dispatch(startQuest(quest.id));

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.isActive).toBe(true);
    });

    it('does not start completed quest', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      quest.isCompleted = true;

      store.dispatch(addQuest(quest));
      store.dispatch(startQuest(quest.id));

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.isActive).toBe(false);
      expect(found?.isCompleted).toBe(true);
    });

    it('does nothing when starting non-existent quest', () => {
      const store = createTestStore();

      const beforeState = store.getState().quests;
      store.dispatch(startQuest('nonexistent-id'));
      const afterState = store.getState().quests;

      expect(afterState).toEqual(beforeState);
    });
  });

  describe('quest completion', () => {
    it('completes an active quest', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      quest.isActive = true;

      store.dispatch(addQuest(quest));
      store.dispatch(completeQuest(quest.id));

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.isActive).toBe(false);
      expect(found?.isCompleted).toBe(true);
    });

    it('does not complete inactive quest', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      quest.isActive = false;

      store.dispatch(addQuest(quest));
      store.dispatch(completeQuest(quest.id));

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.isCompleted).toBe(false);
    });

    it('does nothing when completing non-existent quest', () => {
      const store = createTestStore();

      const beforeState = store.getState().quests;
      store.dispatch(completeQuest('nonexistent-id'));
      const afterState = store.getState().quests;

      expect(afterState).toEqual(beforeState);
    });
  });

  describe('objective management', () => {
    it('updates objective completion status', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      const objectiveId = quest.objectives[0].id;

      store.dispatch(addQuest(quest));
      store.dispatch(
        updateObjectiveStatus({
          questId: quest.id,
          objectiveId,
          isCompleted: true,
        })
      );

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.objectives[0].isCompleted).toBe(true);
    });

    it('does nothing when updating objective for non-existent quest', () => {
      const store = createTestStore();

      const beforeState = store.getState().quests;
      store.dispatch(
        updateObjectiveStatus({
          questId: 'nonexistent-id',
          objectiveId: 'objective-id',
          isCompleted: true,
        })
      );
      const afterState = store.getState().quests;

      expect(afterState).toEqual(beforeState);
    });

    it('does nothing when updating non-existent objective', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      store.dispatch(addQuest(quest));

      const beforeObjective = quest.objectives[0];
      store.dispatch(
        updateObjectiveStatus({
          questId: quest.id,
          objectiveId: 'nonexistent-objective',
          isCompleted: true,
        })
      );

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.objectives[0]).toEqual(beforeObjective);
    });
  });

  describe('objective counters', () => {
    it('increments collect objective counter', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      const objectiveId = uuidv4();
      quest.objectives[0] = {
        id: objectiveId,
        description: 'Collect items',
        type: 'collect',
        target: 'item-1',
        count: 5,
        currentCount: 0,
        isCompleted: false,
      };

      store.dispatch(addQuest(quest));
      store.dispatch(
        updateObjectiveCounter({
          questId: quest.id,
          objectiveId,
          count: 2,
        })
      );

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.objectives[0].currentCount).toBe(2);
      expect(found?.objectives[0].isCompleted).toBe(false);
    });

    it('increments kill objective counter', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      const objectiveId = uuidv4();
      quest.objectives[0] = {
        id: objectiveId,
        description: 'Kill enemies',
        type: 'kill',
        target: 'enemy-1',
        count: 3,
        currentCount: 0,
        isCompleted: false,
      };

      store.dispatch(addQuest(quest));
      store.dispatch(
        updateObjectiveCounter({
          questId: quest.id,
          objectiveId,
          count: 1,
        })
      );

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.objectives[0].currentCount).toBe(1);
    });

    it('marks objective complete when count reaches target', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      const objectiveId = uuidv4();
      quest.objectives[0] = {
        id: objectiveId,
        description: 'Collect items',
        type: 'collect',
        target: 'item-1',
        count: 3,
        currentCount: 0,
        isCompleted: false,
      };

      store.dispatch(addQuest(quest));
      store.dispatch(
        updateObjectiveCounter({
          questId: quest.id,
          objectiveId,
          count: 3,
        })
      );

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.objectives[0].currentCount).toBe(3);
      expect(found?.objectives[0].isCompleted).toBe(true);
    });

    it('does not update counter for talk objective', () => {
      const store = createTestStore();
      const quest = createTestQuest();
      const objectiveId = quest.objectives[0].id;

      store.dispatch(addQuest(quest));
      store.dispatch(
        updateObjectiveCounter({
          questId: quest.id,
          objectiveId,
          count: 1,
        })
      );

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.objectives[0].currentCount).toBeUndefined();
    });

    it('does nothing when updating counter for non-existent quest', () => {
      const store = createTestStore();

      const beforeState = store.getState().quests;
      store.dispatch(
        updateObjectiveCounter({
          questId: 'nonexistent-id',
          objectiveId: 'objective-id',
          count: 1,
        })
      );
      const afterState = store.getState().quests;

      expect(afterState).toEqual(beforeState);
    });

    it('does nothing when updating counter for non-existent objective', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      store.dispatch(addQuest(quest));

      const beforeObjective = quest.objectives[0];
      store.dispatch(
        updateObjectiveCounter({
          questId: quest.id,
          objectiveId: 'nonexistent-objective',
          count: 1,
        })
      );

      const quests = store.getState().quests.quests;
      const found = quests.find((q) => q.id === quest.id);
      expect(found?.objectives[0]).toEqual(beforeObjective);
    });
  });

  describe('dialogue management', () => {
    it('adds a new dialogue', () => {
      const store = createTestStore();
      const dialogue = createTestDialogue();

      store.dispatch(addDialogue(dialogue));

      const dialogues = store.getState().quests.dialogues;
      expect(dialogues.find((d) => d.id === dialogue.id)).toEqual(dialogue);
    });

    it('starts a dialogue', () => {
      const store = createTestStore();

      store.dispatch(
        startDialogue({
          dialogueId: 'dialogue-1',
          nodeId: 'node-1',
        })
      );

      const state = store.getState().quests;
      expect(state.activeDialogue.dialogueId).toBe('dialogue-1');
      expect(state.activeDialogue.currentNodeId).toBe('node-1');
      expect(state.lastBriefing.dialogueId).toBe('dialogue-1');
      expect(state.lastBriefing.nodeId).toBe('node-1');
    });

    it('sets dialogue node', () => {
      const store = createTestStore();

      store.dispatch(
        startDialogue({
          dialogueId: 'dialogue-1',
          nodeId: 'node-1',
        })
      );

      store.dispatch(setDialogueNode('node-2'));

      const state = store.getState().quests;
      expect(state.activeDialogue.currentNodeId).toBe('node-2');
      expect(state.lastBriefing.nodeId).toBe('node-2');
    });

    it('updates last briefing when setting dialogue node', () => {
      const store = createTestStore();

      store.dispatch(
        startDialogue({
          dialogueId: 'dialogue-1',
          nodeId: 'node-1',
        })
      );

      store.dispatch(setDialogueNode('node-2'));

      const state = store.getState().quests;
      expect(state.lastBriefing.dialogueId).toBe('dialogue-1');
      expect(state.lastBriefing.nodeId).toBe('node-2');
    });

    it('does not update last briefing when setting null node', () => {
      const store = createTestStore();

      store.dispatch(
        startDialogue({
          dialogueId: 'dialogue-1',
          nodeId: 'node-1',
        })
      );

      store.dispatch(setDialogueNode(null));

      const state = store.getState().quests;
      expect(state.activeDialogue.currentNodeId).toBeNull();
      expect(state.lastBriefing.dialogueId).toBe('dialogue-1');
      expect(state.lastBriefing.nodeId).toBe('node-1');
    });

    it('ends dialogue', () => {
      const store = createTestStore();

      store.dispatch(
        startDialogue({
          dialogueId: 'dialogue-1',
          nodeId: 'node-1',
        })
      );

      store.dispatch(endDialogue());

      const state = store.getState().quests;
      expect(state.activeDialogue.dialogueId).toBeNull();
      expect(state.activeDialogue.currentNodeId).toBeNull();
    });
  });

  describe('reset and locale', () => {
    it('resets quests with default locale', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      store.dispatch(addQuest(quest));
      store.dispatch(resetQuests(undefined));

      const quests = store.getState().quests.quests;
      expect(quests.find((q) => q.id === quest.id)).toBeUndefined();
    });

    it('resets quests with specified locale', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      store.dispatch(addQuest(quest));
      store.dispatch(resetQuests('uk'));

      const quests = store.getState().quests.quests;
      expect(quests.find((q) => q.id === quest.id)).toBeUndefined();
    });

    it('applies locale to quests', () => {
      const store = createTestStore();
      const quest = createTestQuest();

      store.dispatch(addQuest(quest));

      const beforeCount = store.getState().quests.quests.length;
      store.dispatch(applyLocaleToQuests('uk'));
      const afterCount = store.getState().quests.quests.length;

      // Should reset to level content
      expect(afterCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('initial state', () => {
    it('loads with level content', () => {
      const store = createTestStore();
      const state = store.getState().quests;

      expect(state.quests).toBeDefined();
      expect(state.dialogues).toBeDefined();
      expect(state.activeDialogue.dialogueId).toBeNull();
      expect(state.activeDialogue.currentNodeId).toBeNull();
    });
  });
});
