import { configureStore } from '@reduxjs/toolkit';
import { selectHudLayoutPreset } from '../store/selectors/hudLayoutSelectors';
import { RootState } from '../store';
import { createSuspicionInitialState } from '../store/suspicionSlice';
import playerReducer from '../store/playerSlice';
import worldReducer from '../store/worldSlice';
import hudLayoutReducer from '../store/hudLayoutSlice';
import settingsReducer from '../store/settingsSlice';
import questsReducer from '../store/questsSlice';
import logReducer from '../store/logSlice';
import autoBattleReducer from '../store/autoBattleSlice';
import combatFeedbackReducer from '../store/combatFeedbackSlice';
import missionsReducer from '../store/missionSlice';
import surveillanceReducer from '../store/surveillanceSlice';
import storyletReducer from '../store/storyletSlice';
import suspicionReducer from '../store/suspicionSlice';
import paranoiaReducer from '../store/paranoiaSlice';
import reputationReducer from '../store/reputationSlice';
import { MapTile } from '../game/interfaces/types';

type StateOverrides = Omit<
  Partial<RootState>,
  'world' | 'hudLayout' | 'surveillance' | 'suspicion'
> & {
  world?: Partial<RootState['world']>;
  hudLayout?: Partial<RootState['hudLayout']>;
  surveillance?: Partial<RootState['surveillance']>;
  suspicion?: Partial<RootState['suspicion']>;
};

describe('selectHudLayoutPreset', () => {
  const mockState = (overrides: StateOverrides = {}): RootState => {
    const baseStore = configureStore({
      reducer: {
        player: playerReducer,
        world: worldReducer,
        hudLayout: hudLayoutReducer,
        settings: settingsReducer,
        quests: questsReducer,
        log: logReducer,
        autoBattle: autoBattleReducer,
        combatFeedback: combatFeedbackReducer,
        missions: missionsReducer,
        surveillance: surveillanceReducer,
        storylets: storyletReducer,
        suspicion: suspicionReducer,
        paranoia: paranoiaReducer,
        reputation: reputationReducer,
      },
    });

    const baseState = baseStore.getState() as RootState;

    const suspicion = createSuspicionInitialState();
    suspicion.zones['zone-1'] = {
      zoneId: 'zone-1',
      memories: {},
      heat: { zoneId: 'zone-1', totalHeat: 0, tier: 'calm', leadingWitnessIds: [] },
      lastUpdatedAt: 0,
      lastObservationAt: null,
    };

    return {
      ...baseState,
      ...overrides,
      settings: {
        ...baseState.settings,
        ...(overrides.settings ?? {}),
      },
      world: {
        ...baseState.world,
        ...overrides.world,
        inCombat: overrides.world?.inCombat ?? false,
        engagementMode: overrides.world?.engagementMode ?? 'none',
        currentMapArea: overrides.world?.currentMapArea ?? baseState.world.currentMapArea,
      },
      hudLayout: { ...baseState.hudLayout, ...overrides.hudLayout },
      suspicion: { ...suspicion, ...overrides.suspicion },
      surveillance: { ...baseState.surveillance, ...overrides.surveillance },
    } as RootState;
  };

  it('returns exploration by default', () => {
    const state = mockState();
    expect(selectHudLayoutPreset(state)).toBe('exploration');
  });

  it('returns combat when in combat', () => {
    const state = mockState({
      world: {
        inCombat: true,
        engagementMode: 'combat',
      },
    });
    expect(selectHudLayoutPreset(state)).toBe('combat');
  });

  it('returns stealth when engagement mode is stealth', () => {
    const state = mockState({
      world: {
        inCombat: false,
        engagementMode: 'stealth',
      },
    });
    expect(selectHudLayoutPreset(state)).toBe('stealth');
  });

  it('returns stealth when detection progress is high', () => {
    const state = mockState({
      surveillance: {
        hud: {
          detectionProgress: 50, // > 45 threshold
        },
      } as RootState['surveillance'],
    });
    expect(selectHudLayoutPreset(state)).toBe('stealth');
  });

  it('returns stealth when zone heat is high', () => {
    const hotSuspicion = createSuspicionInitialState();
    hotSuspicion.zones['zone-1'] = {
      zoneId: 'zone-1',
      memories: {},
      heat: { zoneId: 'zone-1', totalHeat: 50, tier: 'tracking', leadingWitnessIds: [] },
      lastUpdatedAt: 0,
      lastObservationAt: null,
    };
    const state = mockState({
      settings: {
        reputationSystemsEnabled: true,
      },
      suspicion: hotSuspicion,
      world: {
        inCombat: false,
        engagementMode: 'none',
        currentMapArea: {
          id: 'zone-1',
          name: 'Zone 1',
          zoneId: 'zone-1',
          width: 1,
          height: 1,
          tiles: [[{ type: 'floor', position: { x: 0, y: 0 }, isWalkable: true, provideCover: false } as MapTile]],
          entities: { enemies: [], npcs: [], items: [] },
        },
      },
    });
    expect(selectHudLayoutPreset(state)).toBe('stealth');
  });

  it('prioritizes override over combat', () => {
    const state = mockState({
      hudLayout: {
        override: 'exploration',
      },
      world: {
        inCombat: true,
      },
    });
    expect(selectHudLayoutPreset(state)).toBe('exploration');
  });

  it('prioritizes override over stealth', () => {
    const state = mockState({
      hudLayout: {
        override: 'combat',
      },
      world: {
        engagementMode: 'stealth',
      },
    });
    expect(selectHudLayoutPreset(state)).toBe('combat');
  });
});
