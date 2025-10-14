import { selectActiveQuests, selectObjectiveQueue, selectPrimaryObjective, selectSecondaryObjective } from '../store/selectors/questSelectors';
import type { RootState } from '../store';
import type { Quest, QuestObjective } from '../game/interfaces/types';
import { store } from '../store';

describe('questSelectors', () => {
  const createObjective = (overrides: Partial<QuestObjective>): QuestObjective => ({
    id: 'objective-1',
    description: 'Test objective',
    isCompleted: false,
    type: 'explore',
    target: 'Test Target',
    ...overrides,
  });

  const createQuest = (overrides: Partial<Quest>): Quest => ({
    id: 'quest-1',
    name: 'Side Quest',
    description: 'Test quest',
    objectives: [],
    rewards: [],
    isActive: true,
    isCompleted: false,
    ...overrides,
  });

  const deepClone = <T>(value: T): T => {
    if (value instanceof Set) {
      return new Set(Array.from(value, (item) => deepClone(item))) as unknown as T;
    }
    if (Array.isArray(value)) {
      return value.map((item) => deepClone(item)) as unknown as T;
    }
    if (value && typeof value === 'object') {
      const result: Record<PropertyKey, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        result[key] = deepClone(val);
      });
      return result as T;
    }
    return value;
  };

  const createBaseState = (): RootState => deepClone(store.getState()) as RootState;

  it('filters active non-completed quests', () => {
    const quests: Quest[] = [
      createQuest({ id: 'main-quest', name: 'Main Quest', objectives: [], isActive: true }),
      createQuest({ id: 'side', name: 'Side Quest', isActive: false }),
      createQuest({ id: 'completed', name: 'Done', isCompleted: true }),
    ];

    const state = createBaseState();
    state.quests.quests = quests;
    const result = selectActiveQuests(state);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('main-quest');
  });

  it('sorts objective queue by priority and flags primary quest', () => {
    const quests: Quest[] = [
      createQuest({
        id: 'main-story',
        name: 'Main Story',
        objectives: [
          createObjective({ id: 'm1', description: 'Primary objective', isCompleted: false, type: 'explore' }),
          createObjective({ id: 'm2', description: 'Secondary objective', isCompleted: false, type: 'explore' }),
        ],
      }),
      createQuest({
        id: 'datapad-fetch',
        name: 'Datapad Recovery',
        objectives: [
          createObjective({ id: 'd1', description: 'Recover datapad', isCompleted: false, type: 'collect' }),
        ],
      }),
      createQuest({
        id: 'side-hustle',
        name: 'Neighborhood Favors',
        objectives: [
          createObjective({ id: 's1', description: 'Help locals', isCompleted: false, type: 'talk' }),
        ],
      }),
    ];

    const state = createBaseState();
    state.quests.quests = quests;
    const queue = selectObjectiveQueue(state);

    const orderedIds = queue.map((entry) => entry.questId);
    expect(orderedIds.slice(0, 2)).toEqual(['main-story', 'main-story']);
    expect(queue[0].isPrimary).toBe(true);
    expect(queue[2].questId).toBe('datapad-fetch');
    expect(queue[3].questId).toBe('side-hustle');
  });

  it('returns primary and secondary objectives when available', () => {
    const quests: Quest[] = [
      createQuest({
        id: 'main-story',
        name: 'Main Story',
        objectives: [
          createObjective({ id: 'm1', description: 'Step one', isCompleted: false, type: 'explore' }),
          createObjective({ id: 'm2', description: 'Step two', isCompleted: false, type: 'explore' }),
        ],
      }),
    ];

    const state = createBaseState();
    state.quests.quests = quests;
    expect(selectPrimaryObjective(state)?.objective.id).toBe('m1');
    expect(selectSecondaryObjective(state)?.objective.id).toBe('m2');
  });

  it('handles empty queues gracefully', () => {
    const state = createBaseState();
    state.quests.quests = [];
    expect(selectObjectiveQueue(state)).toHaveLength(0);
   expect(selectPrimaryObjective(state)).toBeNull();
    expect(selectSecondaryObjective(state)).toBeNull();
  });
});
