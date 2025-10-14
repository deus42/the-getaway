import { describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import {
  XP_REWARDS,
  awardXP,
  calculateXPForLevel,
  calculateXPProgress,
  canLevelUp,
  processLevelUp,
  shouldAwardAttributePoint,
  shouldUnlockPerkSelection,
} from '../progression';
import { DEFAULT_PLAYER, createDefaultPersonalityProfile } from '../../interfaces/player';
import { Player } from '../../interfaces/types';

const clonePlayer = (overrides: Partial<Player> = {}): Player => ({
  ...(JSON.parse(JSON.stringify(DEFAULT_PLAYER)) as Player),
  id: uuidv4(),
  personality: createDefaultPersonalityProfile(),
  ...overrides,
});

describe('progression system', () => {
  it('calculates XP requirements using the quadratic scaling formula', () => {
    expect(calculateXPForLevel(1)).toBe(0);
    expect(calculateXPForLevel(2)).toBe(260);
    expect(calculateXPForLevel(5)).toBe(875);
  });

  it('determines when a player is eligible to level up', () => {
    const xpForNext = calculateXPForLevel(2);
    expect(canLevelUp(xpForNext, 1)).toBe(true);
    expect(canLevelUp(xpForNext - 1, 1)).toBe(false);
  });

  it('processes multiple level gains and awards skill/attribute/perk bonuses', () => {
    const basePlayer = clonePlayer({
      experience: calculateXPForLevel(2) + calculateXPForLevel(3),
      level: 1,
      skills: {
        ...DEFAULT_PLAYER.skills,
        intelligence: 8,
        endurance: 6,
      },
    });

    const result = processLevelUp(basePlayer);

    expect(result.levelsGained).toBe(2);
    expect(result.skillPointsAwarded).toBeGreaterThan(0);
    expect(result.attributePointsAwarded).toBeGreaterThan(0);
    expect(result.player.level).toBe(3);
    expect(result.player.health).toBe(result.player.maxHealth);
    expect(result.perksUnlocked).toBeGreaterThanOrEqual(0);
  });

  it('never produces negative XP and supports XP rewards table lookups', () => {
    const player = clonePlayer({ experience: 10 });
    const updated = awardXP(player, -50);
    expect(updated.experience).toBe(0);

    const guardReward = XP_REWARDS.enemyLevel[5];
    expect(guardReward).toBeGreaterThan(0);
  });

  it('computes progress percentage toward the next level', () => {
    const progress = calculateXPProgress(130, 1);
    expect(progress).toBeCloseTo((130 / calculateXPForLevel(2)) * 100, 5);
  });

  it('encodes perk and attribute unlock cadence', () => {
    expect(shouldAwardAttributePoint(0)).toBe(false);
    expect(shouldAwardAttributePoint(2)).toBe(true);
    expect(shouldUnlockPerkSelection(2)).toBe(true);
    expect(shouldUnlockPerkSelection(3)).toBe(false);
  });
});

