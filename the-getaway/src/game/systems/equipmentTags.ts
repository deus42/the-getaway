import { Armor, ArmorTag, Weapon, WeaponTag } from '../interfaces/types';

export const hasWeaponTag = (weapon: Weapon | undefined, tag: WeaponTag): boolean => {
  return weapon?.tags?.includes(tag) ?? false;
};

export const hasArmorTag = (armor: Armor | undefined, tag: ArmorTag): boolean => {
  return armor?.tags?.includes(tag) ?? false;
};

export const isTwoHandedWeapon = (weapon: Weapon | undefined): boolean => {
  return hasWeaponTag(weapon, 'twoHanded');
};
