import { v4 as uuidv4 } from 'uuid';
import {
  Item,
  Consumable,
  ConsumableEffectType,
} from '../../game/interfaces/types';
import {
  createWeapon,
  createArmor,
  createConsumable,
  WeaponCreationOptions,
  ArmorCreationOptions,
  ConsumableCreationOptions,
} from '../../game/inventory/inventorySystem';
import { PARANOIA_CONFIG } from '../paranoia/paranoiaConfig';

export type ItemDefinitionId =
  | 'weapon_corpsec_service_pistol'
  | 'weapon_shiv_knife'
  | 'weapon_industrial_crowbar'
  | 'armor_kevlar_vest'
  | 'armor_layered_leather_jacket'
  | 'armor_utility_hoodie'
  | 'consumable_field_medkit'
  | 'consumable_basic_repair_kit'
  | 'consumable_calm_tabs'
  | 'consumable_cigarette_pack'
  | 'misc_lockpick_set'
  | 'misc_corpsec_credentials'
  | 'misc_custom_deck'
  | 'misc_emp_charge'
  | 'misc_gas_mask'
  | 'misc_encrypted_datapad'
  | 'misc_corporate_keycard'
  | 'misc_holo_projector_lens';

type ItemPrototype = Omit<Item, 'id'>;

type ConsumablePrototype = Omit<Consumable, 'id'>;

const clonePrototype = <T extends ItemPrototype | ConsumablePrototype>(prototype: T): T => {
  return JSON.parse(JSON.stringify(prototype)) as T;
};

const stripId = <T extends { id: string }>(entity: T): Omit<T, 'id'> => {
  const { id: _unusedId, ...rest } = entity;
  void _unusedId;
  return rest;
};

const weaponPrototype = (
  name: string,
  damage: number,
  range: number,
  apCost: number,
  weight: number,
  options?: WeaponCreationOptions
): ItemPrototype => {
  return stripId(
    createWeapon(
      name,
      damage,
      range,
      apCost,
      weight,
      options?.statModifiers,
      options?.skillType,
      options
    )
  );
};

const armorPrototype = (
  name: string,
  protection: number,
  weight: number,
  options?: ArmorCreationOptions
): ItemPrototype => {
  return stripId(createArmor(name, protection, weight, options?.statModifiers, options));
};

const consumablePrototype = (
  name: string,
  effectType: ConsumableEffectType,
  value: number,
  options?: ConsumableCreationOptions
): ConsumablePrototype => {
  return stripId(createConsumable(name, effectType, value, options));
};

const questItemPrototype = (prototype: ItemPrototype): ItemPrototype => prototype;

const ITEM_CATALOG: Record<ItemDefinitionId, ItemPrototype> = {
  weapon_corpsec_service_pistol: weaponPrototype('CorpSec Service Pistol', 12, 6, 3, 3, {
    durability: { max: 120 },
    statModifiers: { perceptionBonus: 1 },
  }),
  weapon_shiv_knife: weaponPrototype('Shiv Knife', 8, 1, 2, 1, {
    durability: { max: 80 },
    skillType: 'meleeCombat',
    statModifiers: { agilityBonus: 1 },
  }),
  weapon_industrial_crowbar: weaponPrototype('Industrial Crowbar', 14, 1, 3, 5, {
    durability: { max: 150 },
    skillType: 'meleeCombat',
    statModifiers: { strengthBonus: 1 },
    tags: ['twoHanded'],
  }),
  armor_kevlar_vest: armorPrototype('Kevlar Vest', 4, 6, {
    durability: { max: 140 },
    statModifiers: { enduranceBonus: 1, apPenalty: 1 },
    tags: ['heavyArmor'],
  }),
  armor_layered_leather_jacket: armorPrototype('Layered Leather Jacket', 2, 3, {
    durability: { max: 90 },
    statModifiers: { agilityBonus: 1, apPenalty: 0.5 },
    tags: ['mediumArmor'],
  }),
  armor_utility_hoodie: armorPrototype('Utility Hoodie', 1, 2, {
    durability: { max: 80 },
    statModifiers: { intelligenceBonus: 1 },
    tags: ['lightArmor'],
  }),
  consumable_field_medkit: consumablePrototype('Field Medkit', 'health', 35, {
    weight: 1.2,
    stackable: false,
    description: 'A compact trauma kit stocked with coagulants and synth-sutures. Restores a solid chunk of vitality.',
  }),
  consumable_basic_repair_kit: consumablePrototype('Repair Patch Kit', 'repair', 25, {
    weight: 0.8,
    target: 'any',
    maxStack: 5,
    quantity: 1,
    description: 'Self-curing resin, nano-thread, and sealant for emergency weapon or armor repairs.',
  }),
  consumable_calm_tabs: consumablePrototype('CalmTabs', 'paranoia', PARANOIA_CONFIG.calmTabs.relief, {
    weight: 0.1,
    maxStack: 4,
    quantity: 2,
    description: 'Pharma-grade microdoses. Lowers paranoia spikes when chewed slowly.',
    tags: ['paranoia:calmtabs'],
  }),
  consumable_cigarette_pack: consumablePrototype('Nicotine Pack', 'paranoia', PARANOIA_CONFIG.cigarettes.relief, {
    weight: 0.2,
    maxStack: 3,
    quantity: 3,
    description: 'Cheap nicotine laced with synth-herbs. Calms nerves briefly but leaves a haze.',
    tags: ['paranoia:cigarettes'],
  }),
  misc_lockpick_set: questItemPrototype({
    name: 'Lockpick Set',
    description: 'Handmade picks tucked in wrap bandages. Essential for doors and dead drops.',
    weight: 0.3,
    value: 45,
    isQuestItem: false,
  }),
  misc_corpsec_credentials: questItemPrototype({
    name: 'CorpSec Credentials',
    description: 'Forged badge and access card from your old unit. May open a door—or raise a gun.',
    weight: 0.5,
    value: 120,
    isQuestItem: true,
  }),
  misc_custom_deck: questItemPrototype({
    name: 'Custom Deck',
    description: 'Portable intrusion rig with cracked firmware and glowing keycaps.',
    weight: 2,
    value: 160,
    isQuestItem: false,
  }),
  misc_emp_charge: questItemPrototype({
    name: 'EMP Charge',
    description: 'One-shot pulse device that fries cameras and briefly blinds drones.',
    weight: 1,
    value: 180,
    isQuestItem: false,
  }),
  misc_gas_mask: questItemPrototype({
    name: 'Gas Mask',
    description: 'Filters patched with scavenged cloth. Keeps the toxic smog out—for a while.',
    weight: 2,
    value: 90,
    isQuestItem: false,
  }),
  misc_encrypted_datapad: questItemPrototype({
    name: 'Encrypted Datapad',
    description: 'Contains black market manifests guarded by Lira.',
    weight: 1,
    value: 150,
    isQuestItem: true,
  }),
  misc_corporate_keycard: questItemPrototype({
    name: 'Corporate Keycard',
    description: 'Security clearance stolen from a tower executive.',
    weight: 0.2,
    value: 200,
    isQuestItem: true,
  }),
  misc_holo_projector_lens: questItemPrototype({
    name: 'Holo Projector Lens',
    description: 'A prismatic lens ripped from a corporate holo-billboard. Can spoof patrol IDs when paired with the right codec.',
    weight: 0.3,
    value: 220,
    isQuestItem: false,
  }),
};

export interface InstantiateItemOptions {
  quantity?: number;
  durability?: { current?: number; max?: number };
  id?: string;
}

export const getItemPrototype = (definitionId: ItemDefinitionId): ItemPrototype => {
  const prototype = ITEM_CATALOG[definitionId];
  if (!prototype) {
    throw new Error(`[items] Unknown item definition: ${definitionId}`);
  }
  return clonePrototype(prototype);
};

export const instantiateItem = (
  definitionId: ItemDefinitionId,
  options: InstantiateItemOptions = {}
): Item => {
  const prototype = getItemPrototype(definitionId);
  const item: Item = {
    id: options.id ?? uuidv4(),
    ...prototype,
  };

  if (options.quantity !== undefined && item.stackable) {
    const sanitized = Math.max(1, Math.floor(options.quantity));
    item.quantity = sanitized;
  }

  if (options.durability && item.durability) {
    const max = options.durability.max ?? item.durability.max;
    const current = options.durability.current ?? item.durability.current;
    item.durability = {
      max,
      current: Math.min(max, Math.max(0, current)),
    };
  }

  if (!item.stackable) {
    delete item.quantity;
  }

  return item;
};

export const listItemDefinitions = (): Array<{ id: ItemDefinitionId; prototype: ItemPrototype }> => {
  return (Object.keys(ITEM_CATALOG) as ItemDefinitionId[]).map((id) => ({
    id,
    prototype: getItemPrototype(id),
  }));
};
