import { Player, SkillId, CombatSkillId, Weapon } from '../interfaces/types';
import { getSkillDefinition } from '../../content/skills';

export const getPlayerSkillValue = (player: Player, skillId: SkillId): number => {
  return player.skillTraining[skillId] ?? 0;
};

export const isSkillTagged = (player: Player, skillId: SkillId): boolean => {
  return player.taggedSkillIds.includes(skillId);
};

const clampSkillValue = (value: number, max: number = 100): number => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(max, value);
};

export const getSkillPointIncrement = (player: Player, skillId: SkillId): number => {
  const definition = getSkillDefinition(skillId);
  return isSkillTagged(player, skillId) ? definition.taggedIncrement : definition.increment;
};

export const resolveWeaponSkillType = (weapon?: Weapon | null): CombatSkillId => {
  if (!weapon) {
    return 'meleeCombat';
  }

  return weapon.skillType ?? (weapon.range <= 1 ? 'meleeCombat' : 'smallGuns');
};

export const calculateSmallGunsHitBonus = (skillValue: number): number => {
  return clampSkillValue(skillValue) * 0.5;
};

export const calculateEnergyWeaponsBonuses = (
  skillValue: number
): { hit: number; crit: number } => {
  const clamped = clampSkillValue(skillValue);
  return {
    hit: clamped * 0.4,
    crit: clamped * 0.3,
  };
};

export const calculateMeleeCombatBonuses = (
  skillValue: number
): { hit: number; damage: number } => {
  const clamped = clampSkillValue(skillValue);
  return {
    hit: clamped * 0.35,
    damage: Math.floor(clamped / 10),
  };
};

export const calculateExplosivesBonuses = (
  skillValue: number
): { accuracy: number; radius: number } => {
  const clamped = clampSkillValue(skillValue);
  return {
    accuracy: clamped * 0.25,
    radius: Math.floor(clamped / 25),
  };
};

export const describeSkillEffect = (skillId: SkillId, skillValue: number): string => {
  const value = clampSkillValue(skillValue);

  switch (skillId) {
    case 'smallGuns': {
      const hitBonus = calculateSmallGunsHitBonus(value).toFixed(1);
      return `Hit chance bonus +${hitBonus}% with ballistic weapons`;
    }
    case 'energyWeapons': {
      const bonuses = calculateEnergyWeaponsBonuses(value);
      return `Hit +${bonuses.hit.toFixed(1)}% / Crit +${bonuses.crit.toFixed(1)}% with energy weapons`;
    }
    case 'meleeCombat': {
      const bonuses = calculateMeleeCombatBonuses(value);
      return `Hit +${bonuses.hit.toFixed(1)}% / Damage +${bonuses.damage}`;
    }
    case 'explosives': {
      const bonuses = calculateExplosivesBonuses(value);
      const radiusLabel = bonuses.radius === 1 ? 'tile' : 'tiles';
      return `Throw accuracy +${bonuses.accuracy.toFixed(1)}%, blast radius +${bonuses.radius} ${radiusLabel}`;
    }
    default:
      return 'Specialisation effects coming online soon.';
  }
};

export const getCombatSkillIds = (): CombatSkillId[] => {
  return ['smallGuns', 'energyWeapons', 'meleeCombat', 'explosives'];
};

export const getSkillPointCap = (skillId: SkillId): number => {
  return getSkillDefinition(skillId).maxValue;
};
