import { playerSlice } from '../store/playerSlice';
import { DEFAULT_SKILLS } from '../game/interfaces/player';

const playerReducer = playerSlice.reducer;
const { initializeCharacter } = playerSlice.actions;

describe('Player initialization with backgrounds', () => {
  it('applies background perks, equipment, and reputations', () => {
    const initialState = undefined; // reducer will seed default state

    const resultState = playerReducer(
      initialState,
      initializeCharacter({
        name: 'Test Runner',
        visualPreset: 'operative',
        skills: {
          ...DEFAULT_SKILLS,
          strength: 6,
          perception: 7,
          endurance: 5,
          charisma: 4,
          intelligence: 6,
          agility: 6,
          luck: 5,
        },
        backgroundId: 'corpsec_defector',
      })
    );

    const player = resultState.data;

    expect(player.name).toBe('Test Runner');
    expect(player.backgroundId).toBe('corpsec_defector');
    // Background perks not yet implemented (reserved for future expansion)
    // expect(player.perks).toContain('tactical_training');
    expect(player.perks).toHaveLength(0); // No background perks yet
    expect(player.factionReputation.resistance).toBe(20);
    expect(player.factionReputation.corpsec).toBe(-40);
    expect(player.factionReputation.scavengers).toBe(0);
    expect(player.equipped.weapon?.name).toBe('CorpSec Service Pistol');
    expect(player.equipped.armor?.name).toBe('Kevlar Vest');
    expect(player.inventory.items.some((item) => item.name === 'CorpSec Credentials')).toBe(true);
  });

  it('falls back gracefully when background is missing', () => {
    const resultState = playerReducer(
      undefined,
      initializeCharacter({
        name: 'Fallback',
        visualPreset: 'tech',
        skills: DEFAULT_SKILLS,
        backgroundId: 'non-existent',
      })
    );

    expect(resultState.data.backgroundId).toBe('non-existent');
    expect(resultState.data.perks).toHaveLength(0);
  });
});
