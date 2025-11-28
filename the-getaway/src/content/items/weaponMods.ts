import {
  WeaponModId,
  WeaponModSlot,
  WeaponTag,
  WeaponTypeId,
} from '../../game/interfaces/types';

export interface WeaponModEffect {
  damageMultiplier?: number;
  hitChanceBonus?: number;
  hitChancePenalty?: number;
  critChanceBonus?: number;
  magazineSizeMultiplier?: number;
  silenced?: boolean;
  armorPiercingFactor?: number;
  addTags?: WeaponTag[];
}

export interface WeaponModCraftRequirement {
  skill: 'engineering';
  level: number;
  timeSeconds: number;
  station: 'workbench';
  inputs: Array<{ id: string; quantity: number }>;
}

export interface WeaponModDefinition {
  id: WeaponModId;
  name: string;
  slot: WeaponModSlot;
  compatibleWeaponTypes: WeaponTypeId[];
  description: string;
  effect: WeaponModEffect;
  crafting: WeaponModCraftRequirement;
  weight: number;
  value: number;
}

const weaponModDefinitions: Record<WeaponModId, WeaponModDefinition> = {
  weapon_mod_reflex_sight: {
    id: 'weapon_mod_reflex_sight',
    name: 'Reflex Sight',
    slot: 'optics',
    compatibleWeaponTypes: ['pistol', 'rifle', 'shotgun', 'smg'],
    description: 'Compact optic that tightens aim for a modest accuracy bump.',
    effect: {
      hitChanceBonus: 0.1,
    },
    crafting: {
      skill: 'engineering',
      level: 15,
      timeSeconds: 20,
      station: 'workbench',
      inputs: [
        { id: 'resource_electronic_parts', quantity: 2 },
        { id: 'resource_metal_scrap', quantity: 1 },
      ],
    },
    weight: 0.4,
    value: 140,
  },
  weapon_mod_extended_magazine: {
    id: 'weapon_mod_extended_magazine',
    name: 'Extended Magazine',
    slot: 'magazine',
    compatibleWeaponTypes: ['pistol', 'rifle', 'smg'],
    description: 'Reinforced mag body with extended spring to carry more rounds.',
    effect: {
      magazineSizeMultiplier: 1.5,
    },
    crafting: {
      skill: 'engineering',
      level: 20,
      timeSeconds: 25,
      station: 'workbench',
      inputs: [
        { id: 'resource_metal_scrap', quantity: 3 },
        { id: 'resource_electronic_parts', quantity: 1 },
      ],
    },
    weight: 0.6,
    value: 180,
  },
  weapon_mod_suppressor: {
    id: 'weapon_mod_suppressor',
    name: 'Suppressor',
    slot: 'barrel',
    compatibleWeaponTypes: ['pistol', 'rifle', 'smg'],
    description: 'Baffled suppressor to bleed muzzle blast; trades a touch of punch for stealth.',
    effect: {
      silenced: true,
      damageMultiplier: 0.95,
      addTags: ['silenced'],
    },
    crafting: {
      skill: 'engineering',
      level: 25,
      timeSeconds: 30,
      station: 'workbench',
      inputs: [
        { id: 'resource_metal_scrap', quantity: 4 },
        { id: 'resource_textile_fiber', quantity: 1 },
      ],
    },
    weight: 0.7,
    value: 210,
  },
  weapon_mod_long_barrel: {
    id: 'weapon_mod_long_barrel',
    name: 'Long Barrel',
    slot: 'barrel',
    compatibleWeaponTypes: ['rifle', 'shotgun'],
    description: 'Extended barrel for tighter grouping and higher muzzle energy.',
    effect: {
      damageMultiplier: 1.15,
      hitChancePenalty: 0.05,
    },
    crafting: {
      skill: 'engineering',
      level: 15,
      timeSeconds: 15,
      station: 'workbench',
      inputs: [{ id: 'resource_metal_scrap', quantity: 3 }],
    },
    weight: 0.9,
    value: 160,
  },
  weapon_mod_laser_sight: {
    id: 'weapon_mod_laser_sight',
    name: 'Laser Sight',
    slot: 'optics',
    compatibleWeaponTypes: ['pistol', 'rifle', 'smg'],
    description: 'Stabilised emitter that sharpens aim and ups crit timing.',
    effect: {
      hitChanceBonus: 0.15,
      critChanceBonus: 5,
    },
    crafting: {
      skill: 'engineering',
      level: 30,
      timeSeconds: 35,
      station: 'workbench',
      inputs: [{ id: 'resource_electronic_parts', quantity: 3 }],
    },
    weight: 0.5,
    value: 240,
  },
  weapon_mod_armor_piercing_barrel: {
    id: 'weapon_mod_armor_piercing_barrel',
    name: 'Armor-Piercing Barrel',
    slot: 'barrel',
    compatibleWeaponTypes: ['rifle', 'shotgun'],
    description: 'Ported bore tuned for penetrator rounds; bites through armor plating.',
    effect: {
      armorPiercingFactor: 0.5,
      addTags: ['armorPiercing'],
    },
    crafting: {
      skill: 'engineering',
      level: 35,
      timeSeconds: 40,
      station: 'workbench',
      inputs: [
        { id: 'resource_metal_scrap', quantity: 5 },
        { id: 'resource_chemical_compound', quantity: 2 },
      ],
    },
    weight: 1,
    value: 260,
  },
};

export const getWeaponModDefinition = (id: WeaponModId): WeaponModDefinition => {
  const definition = weaponModDefinitions[id];
  if (!definition) {
    throw new Error(`[weaponMods] Unknown weapon mod id: ${id}`);
  }
  return definition;
};

export const listWeaponModDefinitions = (): WeaponModDefinition[] => Object.values(weaponModDefinitions);
