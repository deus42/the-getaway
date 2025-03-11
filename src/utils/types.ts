/**
 * Character data structure 
 */
export interface Character {
  id: string;
  name: string;
  faction: Faction;
  background: Background;
  stats: CharacterStats;
  inventory: InventoryItem[];
  equipment: Equipment;
  health: number;
  maxHealth: number;
  actionPoints: number;
  maxActionPoints: number;
  level: number;
  experience: number;
  skills: string[];
  status: StatusEffect[];
}

/**
 * Faction types
 */
export type Faction = 'resistance' | 'nomad' | 'corporate' | 'regime' | 'neutral';

/**
 * Character background
 */
export type Background = 'soldier' | 'hacker' | 'medic' | 'engineer' | 'scavenger' | 'diplomat';

/**
 * Character abilities and attributes
 */
export interface CharacterStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  perception: number;
  charisma: number;
}

/**
 * Status effect on a character
 */
export interface StatusEffect {
  type: string;
  duration: number;
  intensity: number;
  source?: string;
}

/**
 * Equipment slots 
 */
export interface Equipment {
  head?: InventoryItem;
  body?: InventoryItem;
  legs?: InventoryItem;
  feet?: InventoryItem;
  mainHand?: InventoryItem;
  offHand?: InventoryItem;
  accessory1?: InventoryItem;
  accessory2?: InventoryItem;
}

/**
 * Item in inventory
 */
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  value: number;
  weight: number;
  quantity: number;
  maxStack: number;
  effects?: ItemEffect[];
  requirements?: Partial<CharacterStats>;
  usable: boolean;
  equipable: boolean;
  equipSlot?: keyof Equipment;
}

/**
 * Item categories
 */
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'quest' | 'ammo' | 'miscellaneous';

/**
 * Item rarity levels
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Effect when using an item
 */
export interface ItemEffect {
  type: string;
  value: number;
  duration?: number;
}

/**
 * Quest data structure
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  isActive: boolean;
  isCompleted: boolean;
  factionId: string;
  requiredLevel?: number;
  prerequisiteQuests?: string[];
}

/**
 * Quest objective
 */
export interface QuestObjective {
  id: string;
  description: string;
  type: QuestObjectiveType;
  target: string;
  quantity: number;
  progress: number;
  isCompleted: boolean;
  location?: {
    x: number;
    y: number;
    radius: number;
  };
}

/**
 * Types of quest objectives
 */
export type QuestObjectiveType = 'kill' | 'collect' | 'talk' | 'escort' | 'locate' | 'defend';

/**
 * Rewards for completing a quest
 */
export interface QuestReward {
  type: 'item' | 'experience' | 'reputation' | 'money';
  id?: string;
  amount: number;
  faction?: string;
}

/**
 * Game settings
 */
export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  language: string;
  fullscreen: boolean;
  showTutorials: boolean;
}

/**
 * Game save data
 */
export interface GameSave {
  id: string;
  timestamp: number;
  playTime: number;
  character: Character;
  location: {
    map: string;
    x: number;
    y: number;
  };
  quests: Quest[];
  gameVersion: string;
  screenshot?: string;
}
