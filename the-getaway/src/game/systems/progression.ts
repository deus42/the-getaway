import { Player } from '../interfaces/types';
import { calculateMaxStamina } from './statCalculations';

/**
 * XP Sources with concrete values
 */
export const XP_REWARDS = {
  // Quest completion
  QUEST_EASY: 50,
  QUEST_MEDIUM: 100,
  QUEST_HARD: 150,
  QUEST_MAIN: 200,

  // Combat
  ENEMY_WEAK: 10,
  ENEMY_NORMAL: 25,
  ENEMY_ELITE: 40,
  ENEMY_BOSS: 50,

  // Exploration & Skills
  LOCATION_DISCOVERED: 10,
  SKILL_CHECK_SUCCESS: 5,
  SKILL_CHECK_HARD: 10,
  SKILL_CHECK_VERY_HARD: 15,

  // Bonuses
  PEACEFUL_RESOLUTION_MULTIPLIER: 1.25, // +25% XP for peaceful quest resolution
} as const;

/**
 * Calculate XP required for a specific level
 * Formula: xpRequired = 100 * level * (1 + level * 0.15)
 *
 * @param level - Target level
 * @returns XP required to reach that level from previous level
 *
 * @example
 * Level 2: 115 XP
 * Level 3: 345 XP (230 more from level 2)
 * Level 5: 1,150 XP
 * Level 10: 2,150 XP
 */
export const calculateXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return Math.floor(100 * level * (1 + level * 0.15));
};

/**
 * Calculate total XP required to reach a level from level 1
 * @param level - Target level
 * @returns Total XP needed from level 1
 */
export const calculateTotalXPForLevel = (level: number): number => {
  if (level <= 1) return 0;

  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += calculateXPForLevel(i);
  }
  return totalXP;
};

/**
 * Calculate skill points awarded on level-up based on Intelligence
 * Formula: 3 + floor(intelligence / 3)
 *
 * @param intelligence - Player's intelligence attribute
 * @returns Number of skill points awarded
 *
 * @example
 * Intelligence 5: 4 points
 * Intelligence 6: 5 points
 * Intelligence 9: 6 points
 */
export const calculateSkillPointsAwarded = (intelligence: number): number => {
  return 3 + Math.floor(intelligence / 3);
};

/**
 * Check if player should receive an attribute point at this level
 * Attribute points granted every 3 levels (3, 6, 9, 12, etc.)
 *
 * @param level - Player's new level
 * @returns True if attribute point should be awarded
 */
export const shouldAwardAttributePoint = (level: number): boolean => {
  return level > 0;
};

/**
 * Check if player should unlock perk selection at this level
 * Perks unlocked every 2 levels (2, 4, 6, 8, etc.)
 *
 * @param level - Player's new level
 * @returns True if perk selection should be unlocked
 */
export const shouldUnlockPerkSelection = (level: number): boolean => {
  return level > 0 && level % 2 === 0;
};

/**
 * Check if player can level up
 * @param currentXP - Player's current XP
 * @param currentLevel - Player's current level
 * @returns True if player has enough XP to level up
 */
export const canLevelUp = (currentXP: number, currentLevel: number): boolean => {
  const xpNeeded = calculateXPForLevel(currentLevel + 1);
  return currentXP >= xpNeeded;
};

/**
 * Process level-up and return updated player data
 * Handles multiple level-ups if player earned enough XP
 *
 * @param player - Current player state
 * @returns Updated player with new level, stats, and rewards
 */
export const processLevelUp = (player: Player): {
  player: Player;
  levelsGained: number;
  skillPointsAwarded: number;
  attributePointsAwarded: number;
  perksUnlocked: number;
} => {
  let levelsGained = 0;
  let skillPointsAwarded = 0;
  let attributePointsAwarded = 0;
  let perksUnlocked = 0;

  const updatedPlayer = { ...player };

  // Process sequential level-ups
  while (canLevelUp(updatedPlayer.experience, updatedPlayer.level)) {
    const xpForNextLevel = calculateXPForLevel(updatedPlayer.level + 1);

    // Deduct XP and increase level
    updatedPlayer.experience -= xpForNextLevel;
    updatedPlayer.level += 1;
    levelsGained++;

    // Award skill points based on Intelligence
    const skillPoints = calculateSkillPointsAwarded(updatedPlayer.skills.intelligence);
    skillPointsAwarded += skillPoints;

    // Check for attribute point
    if (shouldAwardAttributePoint(updatedPlayer.level)) {
      attributePointsAwarded++;
    }

    // Check for perk unlock
    if (shouldUnlockPerkSelection(updatedPlayer.level)) {
      perksUnlocked++;
    }

    // Health and AP increase on level-up (small bonus)
    updatedPlayer.maxHealth += 5;
    updatedPlayer.health = updatedPlayer.maxHealth; // Full heal on level-up
    updatedPlayer.maxStamina = calculateMaxStamina(updatedPlayer.skills.endurance);
    updatedPlayer.stamina = updatedPlayer.maxStamina;
    updatedPlayer.isExhausted = false;

    // Small AP increase every few levels
    if (updatedPlayer.level % 5 === 0) {
      updatedPlayer.maxActionPoints += 1;
      updatedPlayer.actionPoints = updatedPlayer.maxActionPoints;
    }
  }

  return {
    player: updatedPlayer,
    levelsGained,
    skillPointsAwarded,
    attributePointsAwarded,
    perksUnlocked
  };
};

/**
 * Award XP to player
 * @param player - Current player state
 * @param amount - XP to award
 * @returns Updated player with new XP (does not process level-up)
 */
export const awardXP = (player: Player, amount: number): Player => {
  return {
    ...player,
    experience: Math.max(0, player.experience + amount) // Prevent negative XP
  };
};

/**
 * Calculate XP progress percentage toward next level
 * @param currentXP - Player's current XP
 * @param currentLevel - Player's current level
 * @returns Percentage (0-100) of progress to next level
 */
export const calculateXPProgress = (currentXP: number, currentLevel: number): number => {
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  if (xpForNextLevel === 0) return 100;
  return Math.min(100, (currentXP / xpForNextLevel) * 100);
};

/**
 * Format XP display string
 * @param currentXP - Player's current XP
 * @param currentLevel - Player's current level
 * @returns Formatted string like "115 / 230 XP"
 */
export const formatXPDisplay = (currentXP: number, currentLevel: number): string => {
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  return `${currentXP} / ${xpForNextLevel} XP`;
};
