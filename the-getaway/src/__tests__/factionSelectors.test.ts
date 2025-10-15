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
import { store } from '../store';

const factionsMock = factionModule as jest.Mocked<typeof factionModule>;

describe('factionSelectors', () => {
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

  const createFactionEvent = (delta: number) =>
    ({
      factionId: 'corpsec',
      delta,
      updatedValue: -30 + delta,
      rivalDeltas: {},
      standingChanges: [],
      timestamp: Date.now(),
    }) as unknown as RootState['player']['pendingFactionEvents'][number];

  const buildState = (overrides?: Partial<RootState['player']>): RootState => {
    const state = deepClone(store.getState()) as RootState;
    const overrideData = overrides?.data;

    state.player = {
      ...state.player,
      ...overrides,
      data: {
        ...state.player.data,
        ...overrideData,
        factionReputation: {
          ...state.player.data.factionReputation,
          resistance: 15,
          corpsec: -30,
          scavengers: 0,
          ...(overrideData?.factionReputation ?? {}),
        },
        personality: overrideData?.personality
          ? {
              ...state.player.data.personality,
              ...overrideData.personality,
              flags: {
                ...state.player.data.personality.flags,
                ...(overrideData.personality.flags ?? {}),
              },
            }
        : state.player.data.personality,
      },
      pendingFactionEvents: overrides?.pendingFactionEvents ?? [createFactionEvent(-10)],
    };

    return state;
  };

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
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ factionId: 'corpsec', delta: -10 });
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
    const state = buildState();
    delete (state.player.data.factionReputation as Record<string, number>).corpsec;

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
