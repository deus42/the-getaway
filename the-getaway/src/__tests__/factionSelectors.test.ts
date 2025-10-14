import type { RootState } from '../store';
import type { FactionStandingId } from '../game/systems/factions';

jest.mock('../game/systems/factions', () => {
  return {
    getFactionDefinitions: jest.fn(() => [
      { id: 'resistance', order: 1, definition: { name: 'Resistance', description: 'Grassroots', defaultReputation: 10 } },
      { id: 'corpsec', order: 2, definition: { name: 'CorpSec', description: 'Corporate', defaultReputation: -20 } },
    ]),
    getFactionMetadata: jest.fn((id: string) => ({
      definition: {
        id,
        name: id.toUpperCase(),
        description: `${id} desc`,
        defaultReputation: id === 'corpsec' ? -20 : 0,
      },
    })),
    getFactionStandingSummary: jest.fn((id: string, value: number) => ({
      value,
      standing: {
        id: (`standing-${id}`) as FactionStandingId,
        label: `${id}-label`,
        color: id === 'corpsec' ? '#f00' : '#0f0',
        icon: `${id}-icon`,
      },
      effects: [`${id}-effect`],
      nextThreshold: { value: value + 10, label: 'Next' },
    })),
  };
});

import { selectFactionDefinitions, selectFactionReputationMap, selectPendingFactionEvents, makeSelectFactionStanding, selectAllFactionStandings } from '../store/selectors/factionSelectors';
import * as factionModule from '../game/systems/factions';

const factionsMock = factionModule as jest.Mocked<typeof factionModule>;

describe('factionSelectors', () => {
  const buildState = (overrides?: Partial<RootState['player']>): RootState => ({
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
          resistance: 15,
          corpsec: -30,
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
      pendingFactionEvents: [{ factionId: 'corpsec', delta: -10 }],
      ...(overrides ?? {}),
    },
    world: {} as RootState['world'],
    quests: { quests: [], completedQuestIds: new Set() },
    log: { entries: [], lastUpdated: 0 },
    settings: {
      locale: 'en',
      uiScale: 1,
      tutorialEnabled: true,
      audio: { master: 1, music: 1, effects: 1 },
    },
    combatFeedback: { events: [] },
    missions: { missions: [], completedObjectives: {} },
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
      curfewBanner: { visible: false, lastActivatedAt: null },
    },
  } as RootState);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns faction definitions from content module', () => {
    expect(selectFactionDefinitions()).toHaveLength(2);
    expect(factionsMock.getFactionDefinitions).toHaveBeenCalled();
  });

  it('clones faction reputation maps and pending events', () => {
    const state = buildState();
    const reputation = selectFactionReputationMap(state);
    const events = selectPendingFactionEvents(state);

    expect(reputation).toEqual({ resistance: 15, corpsec: -30, scavengers: 0 });
    expect(reputation).not.toBe(state.player.data.factionReputation);
    expect(events).toEqual([{ factionId: 'corpsec', delta: -10 }]);
    expect(events).not.toBe(state.player.pendingFactionEvents);
  });

  it('provides enriched standing for specific faction', () => {
    const state = buildState();
    const selectResistance = makeSelectFactionStanding('resistance');
    const standing = selectResistance(state);

    expect(factionsMock.getFactionMetadata).toHaveBeenCalledWith('resistance');
    expect(factionsMock.getFactionStandingSummary).toHaveBeenCalledWith('resistance', 15);
    expect(standing).toMatchObject({
      factionId: 'resistance',
      name: 'RESISTANCE',
      standingId: 'standing-resistance',
      standingLabel: 'resistance-label',
      effects: ['resistance-effect'],
    });
  });

  it('falls back to default reputation when faction not present', () => {
    const state = buildState({
      data: {
        ...buildState().player.data,
        factionReputation: {
          resistance: 15,
        },
      },
    });

    const selectCorpSec = makeSelectFactionStanding('corpsec');
    selectCorpSec(state);

    expect(factionsMock.getFactionStandingSummary).toHaveBeenCalledWith('corpsec', -20);
  });

  it('returns standings for all factions in definition order', () => {
    const state = buildState();
    const standings = selectAllFactionStandings(state);

    expect(standings.map((entry) => entry.factionId)).toEqual(['resistance', 'corpsec']);
    expect(factionsMock.getFactionMetadata).toHaveBeenCalledWith('corpsec');
  });
});
