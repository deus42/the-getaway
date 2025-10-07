import {
  calculateXPForLevel,
  calculateTotalXPForLevel,
  calculateSkillPointsAwarded,
  shouldAwardAttributePoint,
  shouldUnlockPerkSelection,
  canLevelUp,
  processLevelUp,
  awardXP,
  calculateXPProgress,
  formatXPDisplay,
  XP_REWARDS
} from '../game/systems/progression';
import { Player, PlayerSkills } from '../game/interfaces/types';
import { DEFAULT_PLAYER, createDefaultPersonalityProfile } from '../game/interfaces/player';
import { v4 as uuidv4 } from 'uuid';

const createMockPlayer = (overrides?: Partial<Player>): Player => {
  const defaultSkills: PlayerSkills = {
    strength: 5,
    perception: 5,
    endurance: 5,
    charisma: 5,
    intelligence: 5,
    agility: 5,
    luck: 5
  };

  const base: Player = {
    id: uuidv4(),
    name: 'Test Player',
    position: { x: 0, y: 0 },
    health: 100,
    maxHealth: 100,
    actionPoints: 10,
    maxActionPoints: 10,
    stamina: 100,
    maxStamina: 100,
    isExhausted: false,
    isCrouching: false,
    skills: defaultSkills,
    skillTraining: { ...DEFAULT_PLAYER.skillTraining },
    taggedSkillIds: [...DEFAULT_PLAYER.taggedSkillIds],
    level: 1,
    experience: 0,
    credits: 0,
    skillPoints: 0,
    attributePoints: 0,
    backgroundId: undefined,
    perks: [],
    factionReputation: {
      resistance: 0,
      corpsec: 0,
      scavengers: 0,
    },
    appearancePreset: undefined,
  inventory: {
    items: [],
    maxWeight: 50,
    currentWeight: 0,
    hotbar: [null, null, null, null, null],
  },
  equipped: {
    weapon: undefined,
    armor: undefined,
    accessory: undefined,
    secondaryWeapon: undefined,
    meleeWeapon: undefined,
    bodyArmor: undefined,
    helmet: undefined,
    accessory1: undefined,
    accessory2: undefined,
  },
  equippedSlots: {},
  activeWeaponSlot: 'primaryWeapon',
  pendingPerkSelections: 0,
  karma: 0,
  personality: createDefaultPersonalityProfile(),
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
  };

  return {
    ...base,
    ...overrides,
    karma: overrides?.karma ?? base.karma,
    personality: overrides?.personality ?? {
      ...base.personality,
      flags: { ...base.personality.flags },
    },
  };
};

describe('XP Progression System', () => {
  describe('calculateXPForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(calculateXPForLevel(1)).toBe(0);
    });

    it('should calculate correct XP for level 2', () => {
      // Formula: 100 * 2 * (1 + 2 * 0.15) = 200 * 1.3 = 260
      expect(calculateXPForLevel(2)).toBe(260);
    });

    it('should calculate correct XP for level 3', () => {
      // Formula: 100 * 3 * (1 + 3 * 0.15) = 300 * 1.45 = 435
      expect(calculateXPForLevel(3)).toBe(435);
    });

    it('should calculate correct XP for level 5', () => {
      // Formula: 100 * 5 * (1 + 5 * 0.15) = 500 * 1.75 = 875
      expect(calculateXPForLevel(5)).toBe(875);
    });

    it('should calculate correct XP for level 10', () => {
      // Formula: 100 * 10 * (1 + 10 * 0.15) = 1000 * 2.5 = 2500
      expect(calculateXPForLevel(10)).toBe(2500);
    });
  });

  describe('calculateTotalXPForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(calculateTotalXPForLevel(1)).toBe(0);
    });

    it('should calculate cumulative XP correctly', () => {
      const level2XP = calculateXPForLevel(2);
      expect(calculateTotalXPForLevel(2)).toBe(level2XP);

      const level3XP = calculateXPForLevel(2) + calculateXPForLevel(3);
      expect(calculateTotalXPForLevel(3)).toBe(level3XP);
    });
  });

  describe('calculateSkillPointsAwarded', () => {
    it('should award 3 points for INT 1-2', () => {
      expect(calculateSkillPointsAwarded(1)).toBe(3);
      expect(calculateSkillPointsAwarded(2)).toBe(3);
    });

    it('should award 4 points for INT 3-5', () => {
      expect(calculateSkillPointsAwarded(3)).toBe(4);
      expect(calculateSkillPointsAwarded(4)).toBe(4);
      expect(calculateSkillPointsAwarded(5)).toBe(4);
    });

    it('should award 5 points for INT 6-8', () => {
      expect(calculateSkillPointsAwarded(6)).toBe(5);
      expect(calculateSkillPointsAwarded(7)).toBe(5);
      expect(calculateSkillPointsAwarded(8)).toBe(5);
    });

    it('should award 6 points for INT 9-10', () => {
      expect(calculateSkillPointsAwarded(9)).toBe(6);
      expect(calculateSkillPointsAwarded(10)).toBe(6);
    });
  });

  describe('shouldAwardAttributePoint', () => {
    it('should award at every positive level', () => {
      expect(shouldAwardAttributePoint(1)).toBe(true);
      expect(shouldAwardAttributePoint(2)).toBe(true);
      expect(shouldAwardAttributePoint(3)).toBe(true);
      expect(shouldAwardAttributePoint(10)).toBe(true);
    });

    it('should not award at non-positive levels', () => {
      expect(shouldAwardAttributePoint(0)).toBe(false);
      expect(shouldAwardAttributePoint(-2)).toBe(false);
    });
  });

  describe('shouldUnlockPerkSelection', () => {
    it('should unlock at levels 2, 4, 6, 8', () => {
      expect(shouldUnlockPerkSelection(2)).toBe(true);
      expect(shouldUnlockPerkSelection(4)).toBe(true);
      expect(shouldUnlockPerkSelection(6)).toBe(true);
      expect(shouldUnlockPerkSelection(8)).toBe(true);
    });

    it('should not unlock at odd levels', () => {
      expect(shouldUnlockPerkSelection(1)).toBe(false);
      expect(shouldUnlockPerkSelection(3)).toBe(false);
      expect(shouldUnlockPerkSelection(5)).toBe(false);
    });
  });

  describe('canLevelUp', () => {
    it('should return true if XP meets requirement', () => {
      const xpForLevel2 = calculateXPForLevel(2);
      expect(canLevelUp(xpForLevel2, 1)).toBe(true);
      expect(canLevelUp(xpForLevel2 + 100, 1)).toBe(true);
    });

    it('should return false if XP is insufficient', () => {
      const xpForLevel2 = calculateXPForLevel(2);
      expect(canLevelUp(xpForLevel2 - 1, 1)).toBe(false);
      expect(canLevelUp(0, 1)).toBe(false);
    });
  });

  describe('processLevelUp', () => {
    it('should not level up if insufficient XP', () => {
      const player = createMockPlayer({ level: 1, experience: 100 });
      const result = processLevelUp(player);

      expect(result.levelsGained).toBe(0);
      expect(result.player.level).toBe(1);
      expect(result.player.experience).toBe(100);
    });

    it('should level up once with sufficient XP', () => {
      const xpForLevel2 = calculateXPForLevel(2);
      const player = createMockPlayer({ level: 1, experience: xpForLevel2 });
      const result = processLevelUp(player);

      expect(result.levelsGained).toBe(1);
      expect(result.player.level).toBe(2);
      expect(result.player.experience).toBe(0);
      expect(result.skillPointsAwarded).toBe(4); // INT 5 = 4 points
      expect(result.attributePointsAwarded).toBe(1); // Attribute point every level
      expect(result.perksUnlocked).toBe(1); // Level 2 unlocks perk
    });

    it('should handle multiple level-ups', () => {
      const xpForLevel2 = calculateXPForLevel(2);
      const xpForLevel3 = calculateXPForLevel(3);
      const player = createMockPlayer({ level: 1, experience: xpForLevel2 + xpForLevel3 });
      const result = processLevelUp(player);

      expect(result.levelsGained).toBe(2);
      expect(result.player.level).toBe(3);
      expect(result.skillPointsAwarded).toBe(8); // 4 points * 2 levels
      expect(result.perksUnlocked).toBe(1); // Level 2 only
      expect(result.attributePointsAwarded).toBe(2); // Attribute point each level
    });

    it('should increase max health on level up', () => {
      const xpForLevel2 = calculateXPForLevel(2);
      const player = createMockPlayer({ level: 1, experience: xpForLevel2, maxHealth: 100 });
      const result = processLevelUp(player);

      expect(result.player.maxHealth).toBe(105); // +5 HP
      expect(result.player.health).toBe(105); // Full heal
    });

    it('should increase AP every 5 levels', () => {
      const xpToLevel5 = [2, 3, 4, 5].reduce((sum, level) => sum + calculateXPForLevel(level), 0);
      const player = createMockPlayer({ level: 1, experience: xpToLevel5, maxActionPoints: 10 });
      const result = processLevelUp(player);

      expect(result.player.level).toBe(5);
      expect(result.player.maxActionPoints).toBe(11); // +1 AP at level 5
      expect(result.player.actionPoints).toBe(11); // Full AP
    });

    it('should award more skill points with higher intelligence', () => {
      const xpForLevel2 = calculateXPForLevel(2);
      const highIntPlayer = createMockPlayer({
        level: 1,
        experience: xpForLevel2,
        skills: {
          strength: 5,
          perception: 5,
          endurance: 5,
          charisma: 5,
          intelligence: 9, // High INT
          agility: 5,
          luck: 5
        }
      });
      const result = processLevelUp(highIntPlayer);

      expect(result.skillPointsAwarded).toBe(6); // INT 9 = 6 points
    });
  });

  describe('awardXP', () => {
    it('should add XP to player', () => {
      const player = createMockPlayer({ experience: 100 });
      const result = awardXP(player, 50);

      expect(result.experience).toBe(150);
    });

    it('should prevent negative XP', () => {
      const player = createMockPlayer({ experience: 50 });
      const result = awardXP(player, -100);

      expect(result.experience).toBe(0);
    });
  });

  describe('calculateXPProgress', () => {
    it('should calculate percentage correctly', () => {
      const xpForLevel2 = calculateXPForLevel(2);
      const halfXP = Math.floor(xpForLevel2 / 2);

      expect(calculateXPProgress(halfXP, 1)).toBeCloseTo(50, 0);
      expect(calculateXPProgress(xpForLevel2, 1)).toBe(100);
      expect(calculateXPProgress(0, 1)).toBe(0);
    });
  });

  describe('formatXPDisplay', () => {
    it('should format XP display string', () => {
      const xpForLevel2 = calculateXPForLevel(2);
      expect(formatXPDisplay(100, 1)).toBe(`100 / ${xpForLevel2} XP`);
    });
  });

  describe('XP_REWARDS constants', () => {
    it('should have correct quest XP values', () => {
      expect(XP_REWARDS.QUEST_EASY).toBe(50);
      expect(XP_REWARDS.QUEST_MEDIUM).toBe(100);
      expect(XP_REWARDS.QUEST_HARD).toBe(150);
      expect(XP_REWARDS.QUEST_MAIN).toBe(200);
    });

    it('should have correct combat XP values', () => {
      expect(XP_REWARDS.ENEMY_WEAK).toBe(10);
      expect(XP_REWARDS.ENEMY_NORMAL).toBe(25);
      expect(XP_REWARDS.ENEMY_ELITE).toBe(40);
      expect(XP_REWARDS.ENEMY_BOSS).toBe(50);
    });

    it('should have peaceful resolution multiplier', () => {
      expect(XP_REWARDS.PEACEFUL_RESOLUTION_MULTIPLIER).toBe(1.25);
    });
  });
});
