import { selectHudLayoutPreset } from '../store/selectors/hudLayoutSelectors';
import { RootState } from '../store';
import { HudLayoutPreset } from '../store/hudLayoutSlice';

describe('selectHudLayoutPreset', () => {
  const mockState = (overrides: Partial<RootState> = {}): RootState => ({
    hudLayout: {
      override: null,
    },
    world: {
      inCombat: false,
      engagementMode: 'none',
      currentMapArea: {
        zoneId: 'zone-1',
      },
    },
    suspicion: {
      zones: {
        'zone-1': {
          heat: {
            totalHeat: 0,
          },
        },
      },
    },
    surveillance: {
      hud: {
        detectionProgress: 0,
      },
    },
    ...overrides,
  } as unknown as RootState);

  it('returns exploration by default', () => {
    const state = mockState();
    expect(selectHudLayoutPreset(state)).toBe('exploration');
  });

  it('returns combat when in combat', () => {
    const state = mockState({
      world: {
        inCombat: true,
        engagementMode: 'combat',
      } as any,
    });
    expect(selectHudLayoutPreset(state)).toBe('combat');
  });

  it('returns stealth when engagement mode is stealth', () => {
    const state = mockState({
      world: {
        inCombat: false,
        engagementMode: 'stealth',
      } as any,
    });
    expect(selectHudLayoutPreset(state)).toBe('stealth');
  });

  it('returns stealth when detection progress is high', () => {
    const state = mockState({
      surveillance: {
        hud: {
          detectionProgress: 50, // > 45 threshold
        },
      } as any,
    });
    expect(selectHudLayoutPreset(state)).toBe('stealth');
  });

  it('returns stealth when zone heat is high', () => {
    const state = mockState({
      suspicion: {
        zones: {
          'zone-1': {
            heat: {
              totalHeat: 50, // > 45 threshold
            },
          },
        },
      } as any,
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
      } as any,
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
      } as any,
    });
    expect(selectHudLayoutPreset(state)).toBe('combat');
  });
});
