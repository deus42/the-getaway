import {
  Weapon,
  WeaponModAttachment,
  WeaponModId,
  WeaponModSlot,
} from '../interfaces/types';
import { getWeaponModDefinition } from '../../content/items/weaponMods';

export interface WeaponModEffectSummary {
  damageMultiplier: number;
  hitChanceBonus: number;
  critChanceBonus: number;
  magazineSizeMultiplier: number;
  silenced: boolean;
  armorPiercingFactor?: number;
}

const defaultEffect: WeaponModEffectSummary = {
  damageMultiplier: 1,
  hitChanceBonus: 0,
  critChanceBonus: 0,
  magazineSizeMultiplier: 1,
  silenced: false,
};

export const aggregateWeaponModEffects = (
  weapon?: Weapon,
  attachmentsOverride?: WeaponModAttachment[]
): WeaponModEffectSummary => {
  if (!weapon) {
    return { ...defaultEffect };
  }

  const attachments = attachmentsOverride ?? weapon.attachedMods ?? [];

  return attachments.reduce<WeaponModEffectSummary>((acc, attachment) => {
    try {
      const definition = getWeaponModDefinition(attachment.modId);
      const effect = definition.effect;

      if (effect.damageMultiplier !== undefined) {
        acc.damageMultiplier *= effect.damageMultiplier;
      }

      if (effect.hitChanceBonus !== undefined) {
        acc.hitChanceBonus += effect.hitChanceBonus;
      }

      if (effect.hitChancePenalty !== undefined) {
        acc.hitChanceBonus -= effect.hitChancePenalty;
      }

      if (effect.critChanceBonus !== undefined) {
        acc.critChanceBonus += effect.critChanceBonus;
      }

      if (effect.magazineSizeMultiplier !== undefined) {
        acc.magazineSizeMultiplier *= effect.magazineSizeMultiplier;
      }

      if (effect.armorPiercingFactor !== undefined) {
        acc.armorPiercingFactor =
          acc.armorPiercingFactor !== undefined
            ? Math.min(acc.armorPiercingFactor, effect.armorPiercingFactor)
            : effect.armorPiercingFactor;
      }

      if (effect.silenced || effect.addTags?.includes('silenced')) {
        acc.silenced = true;
      }

      if (effect.addTags?.includes('armorPiercing')) {
        acc.armorPiercingFactor = acc.armorPiercingFactor ?? 0.5;
      }
    } catch (error) {
      void error;
    }

    return acc;
  }, { ...defaultEffect });
};

export const validateWeaponModCompatibility = (
  weapon: Weapon | undefined,
  modId: WeaponModId,
  slot: WeaponModSlot
): { compatible: boolean; reason?: string } => {
  if (!weapon) {
    return { compatible: false, reason: 'Weapon not found' };
  }

  const slotList = weapon.modSlots ?? [];
  if (!slotList.includes(slot)) {
    return { compatible: false, reason: 'This weapon has no matching slot.' };
  }

  const definition = getWeaponModDefinition(modId);
  if (definition.slot !== slot) {
    return { compatible: false, reason: 'Mod slot mismatch.' };
  }

  const weaponType = weapon.weaponType ?? 'pistol';
  if (!definition.compatibleWeaponTypes.includes(weaponType)) {
    return { compatible: false, reason: 'Not compatible with this weapon type.' };
  }

  return { compatible: true };
};
