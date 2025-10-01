import { PlayerSkills } from '../interfaces/types';

/**
 * Derived Stats - calculated from primary attributes
 */
export interface DerivedStats {
  maxHP: number;
  baseAP: number;
  carryWeight: number;
  criticalChance: number;
  dialogueThresholdBonus: number;
  skillPointsPerLevel: number;
  hitChanceModifier: number;
  dodgeChance: number;
  meleeDamageBonus: number;
}

/**
 * Calculate all derived stats from player attributes
 * @param skills - Player's primary SPECIAL attributes
 * @returns Object containing all derived stat values
 */
export const calculateDerivedStats = (skills: PlayerSkills): DerivedStats => {
  const {
    strength,
    perception,
    endurance,
    charisma,
    intelligence,
    agility,
    luck,
  } = skills;

  return {
    // Max HP = 50 + (endurance * 10)
    // Example: Endurance 7 = 120 HP
    maxHP: 50 + endurance * 10,

    // Base AP = 6 + floor((agility - 5) * 0.5)
    // Example: Agility 8 = 7 AP, Agility 4 = 5 AP
    baseAP: 6 + Math.floor((agility - 5) * 0.5),

    // Carry Weight = 25 + (strength * 5) kg
    // Example: Strength 6 = 55 kg capacity
    carryWeight: 25 + strength * 5,

    // Critical Chance = 5 + (perception * 2) + (luck * 2)%
    // Example: Perception 7, Luck 5 = 5 + 14 + 10 = 29% base crit
    criticalChance: 5 + perception * 2 + luck * 2,

    // Dialogue Threshold Bonus = floor(charisma / 2)
    // Example: Charisma 8 gives +4 to persuasion checks
    dialogueThresholdBonus: Math.floor(charisma / 2),

    // Skill Points per Level = 3 + floor(intelligence / 3)
    // Example: Intelligence 9 gives 6 points/level
    skillPointsPerLevel: 3 + Math.floor(intelligence / 3),

    // Hit Chance Modifier = (perception - 5) * 3%
    // Example: Perception 7 = +6% hit chance
    hitChanceModifier: (perception - 5) * 3,

    // Dodge Chance = (agility - 5) * 2%
    // Example: Agility 8 = +6% dodge
    dodgeChance: (agility - 5) * 2,

    // Melee Damage Bonus = floor(strength / 2)
    // Example: Strength 7 = +3 melee damage
    meleeDamageBonus: Math.floor(strength / 2),
  };
};

/**
 * Calculate maximum HP based on endurance
 */
export const calculateMaxHP = (endurance: number): number => {
  return 50 + endurance * 10;
};

/**
 * Calculate base AP based on agility
 */
export const calculateBaseAP = (agility: number): number => {
  return 6 + Math.floor((agility - 5) * 0.5);
};

/**
 * Calculate carry weight based on strength
 */
export const calculateCarryWeight = (strength: number): number => {
  return 25 + strength * 5;
};

/**
 * Calculate critical chance based on perception and luck
 */
export const calculateCriticalChance = (perception: number, luck: number): number => {
  return 5 + perception * 2 + luck * 2;
};

/**
 * Calculate dialogue threshold bonus based on charisma
 */
export const calculateDialogueBonus = (charisma: number): number => {
  return Math.floor(charisma / 2);
};

/**
 * Calculate skill points awarded per level based on intelligence
 */
export const calculateSkillPointsPerLevel = (intelligence: number): number => {
  return 3 + Math.floor(intelligence / 3);
};

/**
 * Calculate hit chance modifier based on perception
 * @param perception - Perception attribute value
 * @param baseHitChance - Base hit chance percentage (typically 50-80%)
 * @returns Modified hit chance percentage
 */
export const calculateHitChance = (perception: number, baseHitChance: number): number => {
  const modifier = (perception - 5) * 3;
  return Math.max(5, Math.min(95, baseHitChance + modifier));
};

/**
 * Calculate dodge chance based on agility
 */
export const calculateDodgeChance = (agility: number): number => {
  return Math.max(0, (agility - 5) * 2);
};

/**
 * Calculate melee damage bonus based on strength
 */
export const calculateMeleeDamageBonus = (strength: number): number => {
  return Math.floor(strength / 2);
};

/**
 * Check if a skill check passes based on attribute and threshold
 * @param attributeValue - Player's attribute value (e.g., Charisma 7)
 * @param threshold - Required threshold (e.g., 6)
 * @param bonus - Optional bonus to add to attribute (from perks, items, etc.)
 * @returns True if check passes
 */
export const skillCheckPasses = (
  attributeValue: number,
  threshold: number,
  bonus: number = 0
): boolean => {
  return attributeValue + bonus >= threshold;
};

/**
 * Format a stat value with modifier display
 * @param baseValue - Base stat value
 * @param modifiedValue - Modified stat value after bonuses
 * @returns Formatted string like "7 (+2)" or "5"
 */
export const formatStatWithModifier = (baseValue: number, modifiedValue: number): string => {
  const modifier = modifiedValue - baseValue;
  if (modifier === 0) {
    return baseValue.toString();
  }
  const sign = modifier > 0 ? '+' : '';
  return `${modifiedValue} (${sign}${modifier})`;
};
