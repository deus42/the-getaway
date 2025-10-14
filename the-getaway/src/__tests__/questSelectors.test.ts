import { selectActiveQuests, selectObjectiveQueue, selectPrimaryObjective, selectSecondaryObjective } from '../store/selectors/questSelectors';
import type { RootState } from '../store';
import type { Quest } from '../game/interfaces/types';

describe('questSelectors', () => {
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

  const baseState: RootState = {
    player: {
      version: 1,
      data: {
        id: 'player',
        name: 'Runner',
        position: { x: 0, y: 0 },
        health: 100,
        maxHealth: 100,
        actionPoints: 6,
        maxActionPoints: 6,
        stamina: 100,
        maxStamina: 100,
        isExhausted: false,
        isCrouching: false,
        skills: {
          strength: 5,
          perception: 5,
          endurance: 5,
          charisma: 5,
          intelligence: 5,
          agility: 5,
          luck: 5,
        },
        skillTraining: {},
        taggedSkillIds: [],
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
        equipped: {},
        equippedSlots: {},
        activeWeaponSlot: 'primaryWeapon',
        perks: [],
        pendingPerkSelections: 0,
        perkRuntime: {
          gunFuShotsThisTurn: 0,
          adrenalineRushTurnsRemaining: 0,
          ghostInvisibilityTurns: 0,
          ghostConsumed: false,
        },
        encumbrance: {
          level: 'normal',
          percentage: 0,
          movementApMultiplier: 1,
          attackApMultiplier: 1,
        },
        factionReputation: {
          resistance: 0,
          corpsec: 0,
          scavengers: 0,
        },
        personality: {
          dominantTrait: 'earnest',
          flags: {
            earnest: 0,
            sarcastic: 0,
            ruthless: 0,
            stoic: 0,
          },
        },
        backgroundId: undefined,
        appearancePreset: undefined,
        karma: 0,
      },
      pendingLevelUpEvents: [],
      xpNotifications: [],
      pendingFactionEvents: [],
    },
    world: {
      currentMapId: 'map',
      mapAreas: {},
      discoveredPointsOfInterest: {},
      knownConnections: {},
      isFastTravelUnlocked: false,
      currentMapArea: {
        id: 'map',
        name: 'Test',
        zoneId: 'zone',
        width: 5,
        height: 5,
        tiles: [],
        entities: { enemies: [], npcs: [], items: [] },
      },
      exploration: {
        visitedCells: {},
        fogOfWar: {},
        lastUpdatedTurn: 0,
      },
    },
    quests: {
      quests: [],
      completedQuestIds: new Set(),
    },
    log: {
      entries: [],
      lastUpdated: 0,
    },
    settings: {
      locale: 'en',
      uiScale: 1,
      tutorialEnabled: true,
      audio: { master: 1, music: 1, effects: 1 },
    },
    combatFeedback: {
      events: [],
    },
    missions: {
      missions: [],
      completedObjectives: {},
    },
    surveillance: {
      zones: {},
      hud: {
        overlayEnabled: false,
        camerasNearby: 0,
        detectionProgress: 0,
        activeCameraId: null,
        alertState: 'idle',
        networkAlertActive: false,
        networkAlertExpiresAt: null,
      },
      curfewBanner: {
        visible: false,
        lastActivatedAt: null,
      },
    },
  } as unknown as RootState;

  it('filters active non-completed quests', () => {
    const quests: Quest[] = [
      createQuest({ id: 'main-quest', name: 'Main Quest', objectives: [], isActive: true }),
      createQuest({ id: 'side', name: 'Side Quest', isActive: false }),
      createQuest({ id: 'completed', name: 'Done', isCompleted: true }),
    ];

    const state = { ...baseState, quests: { quests, completedQuestIds: new Set() } } as RootState;
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
          { id: 'm1', description: 'Primary objective', isCompleted: false, type: 'story' },
          { id: 'm2', description: 'Secondary objective', isCompleted: false, type: 'story' },
        ],
      }),
      createQuest({
        id: 'datapad-fetch',
        name: 'Datapad Recovery',
        objectives: [
          { id: 'd1', description: 'Recover datapad', isCompleted: false, type: 'fetch' },
        ],
      }),
      createQuest({
        id: 'side-hustle',
        name: 'Neighborhood Favors',
        objectives: [
          { id: 's1', description: 'Help locals', isCompleted: false, type: 'talk' },
        ],
      }),
    ];

    const state = { ...baseState, quests: { quests, completedQuestIds: new Set() } } as RootState;
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
          { id: 'm1', description: 'Step one', isCompleted: false, type: 'story' },
          { id: 'm2', description: 'Step two', isCompleted: false, type: 'story' },
        ],
      }),
    ];

    const state = { ...baseState, quests: { quests, completedQuestIds: new Set() } } as RootState;
    expect(selectPrimaryObjective(state)?.objective.id).toBe('m1');
    expect(selectSecondaryObjective(state)?.objective.id).toBe('m2');
  });

  it('handles empty queues gracefully', () => {
    const state = { ...baseState, quests: { quests: [], completedQuestIds: new Set() } } as RootState;
    expect(selectObjectiveQueue(state)).toHaveLength(0);
    expect(selectPrimaryObjective(state)).toBeNull();
    expect(selectSecondaryObjective(state)).toBeNull();
  });
});
