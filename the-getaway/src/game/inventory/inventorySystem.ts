import {
  Item,
  Player,
  Weapon,
  Armor,
  Consumable,
  CombatSkillId,
  EquipmentSlot,
  StatModifiers,
  ConsumableEffectType,
  WeaponTag,
  ArmorTag,
} from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';

// Check if player can add an item to inventory (based on weight)
export const canAddItemToInventory = (player: Player, item: Item): boolean => {
  const newTotalWeight = player.inventory.currentWeight + item.weight;
  return newTotalWeight <= player.inventory.maxWeight;
};

// Add an item to inventory
export const addItemToInventory = (player: Player, item: Item): Player => {
  if (!canAddItemToInventory(player, item)) {
    return player; // Cannot add item
  }
  
  const newInventory = {
    ...player.inventory,
    items: [...player.inventory.items, item],
    currentWeight: player.inventory.currentWeight + item.weight
  };
  
  return {
    ...player,
    inventory: newInventory
  };
};

// Remove an item from inventory
export const removeItemFromInventory = (player: Player, itemId: string): Player => {
  const item = player.inventory.items.find(i => i.id === itemId);
  
  if (!item) {
    return player; // Item not found
  }
  
  const newInventory = {
    ...player.inventory,
    items: player.inventory.items.filter(i => i.id !== itemId),
    currentWeight: player.inventory.currentWeight - item.weight
  };
  
  return {
    ...player,
    inventory: newInventory
  };
};

// Find an item in inventory
export const findItemInInventory = (player: Player, itemId: string): Item | undefined => {
  return player.inventory.items.find(item => item.id === itemId);
};

// Use a consumable item
export const useConsumableItem = (player: Player, itemId: string): Player => {
  const item = player.inventory.items.find(i => i.id === itemId) as Consumable | undefined;
  
  if (!item || !('effect' in item)) {
    return player; // Item not found or not a consumable
  }
  
  let updatedPlayer = removeItemFromInventory(player, itemId);
  
  // Apply item effects
  switch (item.effect.type) {
    case 'health':
      updatedPlayer = {
        ...updatedPlayer,
        health: Math.min(
          updatedPlayer.health + item.effect.value, 
          updatedPlayer.maxHealth
        )
      };
      break;
    case 'actionPoints':
      updatedPlayer = {
        ...updatedPlayer,
        actionPoints: Math.min(
          updatedPlayer.actionPoints + item.effect.value,
          updatedPlayer.maxActionPoints
        )
      };
      break;
    case 'stat':
      if (item.effect.statAffected) {
        updatedPlayer = {
          ...updatedPlayer,
          skills: {
            ...updatedPlayer.skills,
            [item.effect.statAffected]: 
              updatedPlayer.skills[item.effect.statAffected] + item.effect.value
          }
        };
      }
      break;
  }
  
  return updatedPlayer;
};

// Sort inventory items by category
export const sortInventoryByCategory = (player: Player): Player => {
  const sortedItems = [...player.inventory.items].sort((a, b) => {
    const getItemType = (item: Item): number => {
      if ('damage' in item) return 1; // Weapon
      if ('protection' in item) return 2; // Armor
      if ('effect' in item) return 3; // Consumable
      if (item.isQuestItem) return 0; // Quest item
      return 4; // Other items
    };
    
    return getItemType(a) - getItemType(b);
  });
  
  return {
    ...player,
    inventory: {
      ...player.inventory,
      items: sortedItems
    }
  };
};

const clampDurability = (maxValue: number, current?: number): { current: number; max: number } => {
  const max = Math.max(1, Math.round(maxValue));
  const currentValue = Number.isFinite(current) ? Math.round(current ?? max) : max;
  return {
    max,
    current: Math.min(max, Math.max(0, currentValue)),
  };
};

export interface WeaponCreationOptions {
  statModifiers?: StatModifiers;
  skillType?: CombatSkillId;
  durability?: { max?: number; current?: number };
  equipSlot?: EquipmentSlot;
  value?: number;
  tags?: WeaponTag[];
}

// Create a basic weapon
export const createWeapon = (
  name: string,
  damage: number,
  range: number,
  apCost: number,
  weight: number,
  statModifiers?: StatModifiers,
  skillType: CombatSkillId = range <= 1 ? 'meleeCombat' : 'smallGuns',
  options: WeaponCreationOptions = {}
): Weapon => {
  const resolvedEquipSlot: EquipmentSlot = options.equipSlot
    ?? (range <= 1 || skillType === 'meleeCombat' ? 'meleeWeapon' : 'primaryWeapon');

  const durability = clampDurability(options.durability?.max ?? 100, options.durability?.current);

  return {
    id: uuidv4(),
    name,
    description: `A ${name} that deals ${damage} damage.`,
    damage,
    range,
    apCost,
    weight,
    value: options.value ?? damage * 10,
    isQuestItem: false,
    skillType,
    slot: 'weapon',
    statModifiers: options.statModifiers ?? statModifiers,
    equipSlot: resolvedEquipSlot,
    durability,
    stackable: false,
    tags: options.tags,
  };
};

export interface ArmorCreationOptions {
  statModifiers?: StatModifiers;
  durability?: { max?: number; current?: number };
  equipSlot?: EquipmentSlot;
  value?: number;
  tags?: ArmorTag[];
}

// Create basic armor
export const createArmor = (
  name: string,
  protection: number,
  weight: number,
  statModifiers?: StatModifiers,
  options: ArmorCreationOptions = {}
): Armor => {
  const durability = clampDurability(options.durability?.max ?? 120, options.durability?.current);
  const equipSlot: EquipmentSlot = options.equipSlot ?? 'bodyArmor';

  return {
    id: uuidv4(),
    name,
    description: `${name} that provides ${protection} protection.`,
    protection,
    weight,
    value: options.value ?? protection * 15,
    isQuestItem: false,
    slot: 'armor',
    statModifiers: options.statModifiers ?? statModifiers,
    durability,
    equipSlot,
    stackable: false,
    tags: options.tags,
  };
};

export interface ConsumableCreationOptions {
  statAffected?: keyof Player['skills'];
  weight?: number;
  duration?: number;
  target?: 'weapon' | 'armor' | 'any';
  stackable?: boolean;
  maxStack?: number;
  quantity?: number;
  value?: number;
  description?: string;
  tags?: string[];
}

// Create a consumable item
export const createConsumable = (
  name: string,
  effectType: ConsumableEffectType,
  value: number,
  options: ConsumableCreationOptions = {}
): Consumable => {
  const {
    statAffected,
    weight = 0.5,
    duration,
    target,
    stackable = true,
    maxStack = 5,
    quantity = 1,
    description,
    tags,
  } = options;

  let resolvedDescription = description ?? '';

  if (!resolvedDescription) {
    switch (effectType) {
      case 'health':
        resolvedDescription = `Restores ${value} health points.`;
        break;
      case 'actionPoints':
        resolvedDescription = `Restores ${value} action points.`;
        break;
      case 'stat':
        resolvedDescription = statAffected
          ? `Increases ${statAffected} by ${value} for a short duration.`
          : `Boosts a core stat by ${value}.`;
        break;
      case 'repair':
        resolvedDescription = `Repairs ${value} durability on equipped gear.`;
        break;
      default:
        resolvedDescription = `Utility consumable.`;
    }
  }

  const effectDuration = duration ?? (effectType === 'stat' ? 3 : undefined);

  const consumable: Consumable = {
    id: uuidv4(),
    name,
    description: resolvedDescription,
    weight,
    value: options.value ?? value * 5,
    isQuestItem: false,
    stackable,
    maxStack,
    quantity: stackable ? quantity : undefined,
    effect: {
      type: effectType,
      statAffected,
      value,
      duration: effectDuration,
      target,
    },
    tags,
  };

  if (!stackable) {
    delete consumable.quantity;
    delete consumable.maxStack;
  }

  return consumable;
};

// Create starter items for the player
export const createStarterItems = (): Item[] => {
  return [
    createWeapon('Pistol', 5, 3, 2, 2),
    createConsumable('Medkit', 'health', 30, { weight: 1, stackable: false }),
    createConsumable('Stimpack', 'actionPoints', 3, { weight: 0.5 }),
  ];
};

// Equip a weapon
export const equipWeapon = (player: Player, weaponId: string): Player => {
  const weapon = player.inventory.items.find(i => i.id === weaponId) as Weapon | undefined;

  if (!weapon || !('damage' in weapon)) {
    return player; // Not a weapon
  }

  // Unequip current weapon if any
  let updatedPlayer = player;
  if (player.equipped.weapon) {
    updatedPlayer = addItemToInventory(updatedPlayer, player.equipped.weapon);
  }

  // Remove weapon from inventory and equip it
  updatedPlayer = removeItemFromInventory(updatedPlayer, weaponId);

  return {
    ...updatedPlayer,
    equipped: {
      ...updatedPlayer.equipped,
      weapon
    }
  };
};

// Equip armor
export const equipArmor = (player: Player, armorId: string): Player => {
  const armor = player.inventory.items.find(i => i.id === armorId) as Armor | undefined;

  if (!armor || !('protection' in armor)) {
    return player; // Not armor
  }

  // Unequip current armor if any
  let updatedPlayer = player;
  if (player.equipped.armor) {
    updatedPlayer = addItemToInventory(updatedPlayer, player.equipped.armor);
  }

  // Remove armor from inventory and equip it
  updatedPlayer = removeItemFromInventory(updatedPlayer, armorId);

  return {
    ...updatedPlayer,
    equipped: {
      ...updatedPlayer.equipped,
      armor
    }
  };
};

// Unequip weapon
export const unequipWeapon = (player: Player): Player => {
  if (!player.equipped.weapon) {
    return player;
  }

  const updatedPlayer = addItemToInventory(player, player.equipped.weapon);

  return {
    ...updatedPlayer,
    equipped: {
      ...updatedPlayer.equipped,
      weapon: undefined
    }
  };
};

// Unequip armor
export const unequipArmor = (player: Player): Player => {
  if (!player.equipped.armor) {
    return player;
  }

  const updatedPlayer = addItemToInventory(player, player.equipped.armor);

  return {
    ...updatedPlayer,
    equipped: {
      ...updatedPlayer.equipped,
      armor: undefined
    }
  };
}; 
