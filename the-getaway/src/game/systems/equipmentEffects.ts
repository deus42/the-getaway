import { Player, StatModifiers, PlayerSkills } from '../interfaces/types';
import { getArmorBonusFromPerks } from './perks';

/**
 * Aggregate bonuses from all equipped items
 */
export interface EquipmentBonuses extends StatModifiers {
  totalArmorRating: number;
  totalAPPenalty: number;
  totalDamageBonus: number;
}

/**
 * Get aggregate bonuses from all equipped items
 * @param player - Player with equipped items
 * @returns Aggregated equipment bonuses
 */
export const getEquippedBonuses = (player: Player): EquipmentBonuses => {
  const bonuses: EquipmentBonuses = {
    strengthBonus: 0,
    perceptionBonus: 0,
    enduranceBonus: 0,
    charismaBonus: 0,
    intelligenceBonus: 0,
    agilityBonus: 0,
    luckBonus: 0,
    totalArmorRating: 0,
    totalAPPenalty: 0,
    totalDamageBonus: 0
  };

  const { weapon, armor } = player.equipped;

  // Aggregate weapon bonuses
  if (weapon && weapon.statModifiers) {
    aggregateModifiers(bonuses, weapon.statModifiers);
  }

  // Aggregate armor bonuses
  if (armor) {
    // Armor provides protection (armor rating)
    bonuses.totalArmorRating += armor.protection || 0;

    if (armor.statModifiers) {
      aggregateModifiers(bonuses, armor.statModifiers);
    }
  }

  // Note: accessory bonuses can be added in the future

  return bonuses;
};

/**
 * Helper to aggregate stat modifiers into bonuses object
 */
function aggregateModifiers(bonuses: EquipmentBonuses, modifiers: StatModifiers): void {
  bonuses.strengthBonus = (bonuses.strengthBonus || 0) + (modifiers.strengthBonus || 0);
  bonuses.perceptionBonus = (bonuses.perceptionBonus || 0) + (modifiers.perceptionBonus || 0);
  bonuses.enduranceBonus = (bonuses.enduranceBonus || 0) + (modifiers.enduranceBonus || 0);
  bonuses.charismaBonus = (bonuses.charismaBonus || 0) + (modifiers.charismaBonus || 0);
  bonuses.intelligenceBonus = (bonuses.intelligenceBonus || 0) + (modifiers.intelligenceBonus || 0);
  bonuses.agilityBonus = (bonuses.agilityBonus || 0) + (modifiers.agilityBonus || 0);
  bonuses.luckBonus = (bonuses.luckBonus || 0) + (modifiers.luckBonus || 0);
  bonuses.totalArmorRating = (bonuses.totalArmorRating || 0) + (modifiers.armorRating || 0);
  bonuses.totalAPPenalty = (bonuses.totalAPPenalty || 0) + (modifiers.apPenalty || 0);
  bonuses.totalDamageBonus = (bonuses.totalDamageBonus || 0) + (modifiers.damageBonus || 0);
}

/**
 * Calculate effective attributes including equipment bonuses
 * @param baseSkills - Base player attributes
 * @param bonuses - Equipment bonuses
 * @returns Effective attributes with equipment applied
 */
export const calculateEffectiveSkills = (
  baseSkills: PlayerSkills,
  bonuses: EquipmentBonuses
): PlayerSkills => {
  return {
    strength: baseSkills.strength + (bonuses.strengthBonus || 0),
    perception: baseSkills.perception + (bonuses.perceptionBonus || 0),
    endurance: baseSkills.endurance + (bonuses.enduranceBonus || 0),
    charisma: baseSkills.charisma + (bonuses.charismaBonus || 0),
    intelligence: baseSkills.intelligence + (bonuses.intelligenceBonus || 0),
    agility: baseSkills.agility + (bonuses.agilityBonus || 0),
    luck: baseSkills.luck + (bonuses.luckBonus || 0)
  };
};

/**
 * Calculate effective armor rating (damage reduction)
 * @param player - Player with equipped items
 * @returns Total armor rating from equipment
 */
export const getEffectiveArmorRating = (player: Player): number => {
  const bonuses = getEquippedBonuses(player);
  return bonuses.totalArmorRating + getArmorBonusFromPerks(player);
};

/**
 * Calculate effective action point maximum
 * @param baseAP - Base AP from attributes
 * @param bonuses - Equipment bonuses
 * @returns Effective max AP with penalties applied
 */
export const getEffectiveMaxAP = (baseAP: number, bonuses: EquipmentBonuses): number => {
  return Math.max(1, baseAP - (bonuses.totalAPPenalty || 0));
};

/**
 * Calculate effective damage bonus
 * @param baseDamage - Base weapon damage
 * @param bonuses - Equipment bonuses
 * @param strengthBonus - Melee damage bonus from strength
 * @returns Total damage with all bonuses
 */
export const getEffectiveDamage = (
  baseDamage: number,
  bonuses: EquipmentBonuses,
  strengthBonus: number = 0
): number => {
  return baseDamage + (bonuses.totalDamageBonus || 0) + strengthBonus;
};

/**
 * Apply damage reduction from armor
 * @param incomingDamage - Raw damage before armor
 * @param armorRating - Armor rating (flat reduction)
 * @returns Damage after armor reduction (minimum 1)
 */
export const applyArmorReduction = (incomingDamage: number, armorRating: number): number => {
  const reducedDamage = incomingDamage - armorRating;
  return Math.max(1, reducedDamage); // Minimum 1 damage always gets through
};
