/**
 * Represents an item in the game
 */
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  value: number;
  weight: number;
  stackable: boolean;
  maxStack?: number;
  
  // Optional properties based on type
  healAmount?: number;
  damageAmount?: number;
  defense?: number;
  statModifiers?: Record<string, number>;
  requirements?: Record<string, number>;
  
  // Visual properties
  icon: string;
  spriteKey?: string;
}

/**
 * Types of items in the game
 */
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'quest' | 'equippable' | 'misc';

/**
 * Rarity levels for items
 */
export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

/**
 * Slots where equipment can be worn
 */
export enum EquipmentSlot {
  HEAD = 'head',
  BODY = 'body',
  LEGS = 'legs',
  FEET = 'feet',
  HANDS = 'hands',
  MAIN_HAND = 'mainHand',
  OFF_HAND = 'offHand',
  ACCESSORY = 'accessory'
} 