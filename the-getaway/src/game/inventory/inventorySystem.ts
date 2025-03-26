import { Item, Player, Weapon, Armor, Consumable } from '../interfaces/types';
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

// Create a basic weapon
export const createWeapon = (
  name: string,
  damage: number,
  range: number,
  apCost: number,
  weight: number
): Weapon => {
  return {
    id: uuidv4(),
    name,
    description: `A ${name} that deals ${damage} damage.`,
    damage,
    range,
    apCost,
    weight,
    value: damage * 10,
    isQuestItem: false
  };
};

// Create basic armor
export const createArmor = (
  name: string,
  protection: number,
  weight: number
): Armor => {
  return {
    id: uuidv4(),
    name,
    description: `${name} that provides ${protection} protection.`,
    protection,
    weight,
    value: protection * 15,
    isQuestItem: false
  };
};

// Create a consumable item
export const createConsumable = (
  name: string,
  effectType: 'health' | 'actionPoints' | 'stat',
  value: number,
  statAffected?: keyof Player['skills'],
  weight: number = 0.5
): Consumable => {
  let description = '';
  
  switch (effectType) {
    case 'health':
      description = `Restores ${value} health points.`;
      break;
    case 'actionPoints':
      description = `Restores ${value} action points.`;
      break;
    case 'stat':
      description = `Increases ${statAffected} by ${value}.`;
      break;
  }
  
  return {
    id: uuidv4(),
    name,
    description,
    weight,
    value: value * 5,
    isQuestItem: false,
    effect: {
      type: effectType,
      statAffected,
      value,
      duration: effectType === 'stat' ? 3 : undefined // Duration for stat effects in turns
    }
  };
};

// Create starter items for the player
export const createStarterItems = (): Item[] => {
  return [
    createWeapon('Pistol', 5, 3, 2, 2),
    createConsumable('Medkit', 'health', 30, undefined, 1),
    createConsumable('Stimpack', 'actionPoints', 3, undefined, 0.5)
  ];
}; 