import { DEFAULT_SKILLS } from '../game/interfaces/player';
import {
  buildPlayerStatProfile,
  PLAYER_STAT_DEFINITIONS,
} from '../game/interfaces/playerStats';

describe('player stat profile', () => {
  it('produces entries for every defined stat key', () => {
    const profile = buildPlayerStatProfile(DEFAULT_SKILLS);
    const keys = profile.map((entry) => entry.key).sort();
    const expectedKeys = Object.keys(PLAYER_STAT_DEFINITIONS).sort();

    expect(keys).toEqual(expectedKeys);
  });

  it('normalises values within configured ranges', () => {
    const customSkills = {
      ...DEFAULT_SKILLS,
      strength: 12,
      perception: 0,
    };

    const profile = buildPlayerStatProfile(customSkills);
    const byKey = Object.fromEntries(profile.map((entry) => [entry.key, entry]));

    const strength = byKey.strength;
    const perception = byKey.perception;

    expect(strength.value).toBeLessThanOrEqual(strength.max);
    expect(strength.normalized).toBeCloseTo(1);

    expect(perception.value).toBeGreaterThanOrEqual(perception.min);
    expect(perception.normalized).toBeCloseTo(0);
  });
});
