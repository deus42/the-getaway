// Core Game Types and Interfaces

// Position in the game grid
export interface Position {
  x: number;
  y: number;
}

// Base entity interface
export interface Entity {
  id: string;
  name: string;
  position: Position;
  health: number;
  maxHealth: number;
}

// Player specific attributes
export interface Player extends Entity {
  actionPoints: number;
  maxActionPoints: number;
  skills: PlayerSkills;
  level: number;
  experience: number;
  credits: number;
  skillPoints: number; // Unspent skill points for skill tree allocation
  attributePoints: number; // Unspent attribute points for SPECIAL increases
  inventory: {
    items: Item[];
    maxWeight: number;
    currentWeight: number;
  };
  equipped: {
    weapon?: Weapon;
    armor?: Armor;
    accessory?: Item;
  };
}

// Alert state for enemies with perception
export enum AlertLevel {
  IDLE = 'idle',
  SUSPICIOUS = 'suspicious',
  INVESTIGATING = 'investigating',
  ALARMED = 'alarmed'
}

// Vision cone configuration
export interface VisionCone {
  range: number;        // How far the enemy can see (in tiles)
  angle: number;        // Field of view in degrees (e.g., 90 for 90° cone)
  direction: number;    // Direction enemy is facing in degrees (0 = right, 90 = down, etc.)
}

// Enemy specific attributes
export interface Enemy extends Entity {
  actionPoints: number;
  maxActionPoints: number;
  damage: number;
  attackRange: number;
  isHostile: boolean;
  visionCone?: VisionCone;
  alertLevel?: AlertLevel;
  alertProgress?: number;    // 0-100, increases when player is in sight
  lastKnownPlayerPosition?: Position | null;
}

// NPC specific attributes
export interface NPC extends Entity {
  routine: RoutePoint[];
  dialogueId: string;
  isInteractive: boolean;
}

// Player skills
export interface PlayerSkills {
  strength: number;
  perception: number;
  endurance: number;
  charisma: number;
  intelligence: number;
  agility: number;
  luck: number;
}

// Item interface
export interface Item {
  id: string;
  name: string;
  description: string;
  weight: number;
  value: number;
  isQuestItem: boolean;
}

// Equipment stat modifiers
export interface StatModifiers {
  strengthBonus?: number;
  perceptionBonus?: number;
  enduranceBonus?: number;
  charismaBonus?: number;
  intelligenceBonus?: number;
  agilityBonus?: number;
  luckBonus?: number;
  armorRating?: number;
  apPenalty?: number;
  damageBonus?: number;
}

// Equipment slots
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

// Weapon extends item
export interface Weapon extends Item {
  damage: number;
  range: number;
  apCost: number;
  slot: 'weapon';
  statModifiers?: StatModifiers;
}

// Armor extends item
export interface Armor extends Item {
  protection: number;
  slot: 'armor';
  statModifiers?: StatModifiers;
}

// Consumable extends item
export interface Consumable extends Item {
  effect: {
    type: 'health' | 'actionPoints' | 'stat';
    statAffected?: keyof PlayerSkills;
    value: number;
    duration?: number;
  };
}

// Quest interface
export interface Quest {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  objectives: QuestObjective[];
  rewards: QuestReward[];
}

// Quest objective
export interface QuestObjective {
  id: string;
  description: string;
  isCompleted: boolean;
  type: 'collect' | 'talk' | 'kill' | 'explore';
  target: string;
  count?: number;
  currentCount?: number;
}

// Quest reward
export interface QuestReward {
  type: 'item' | 'experience' | 'currency';
  id?: string;
  amount: number;
}

// Dialogue interface
export interface Dialogue {
  id: string;
  npcId: string;
  nodes: DialogueNode[];
}

// Dialogue node
export interface DialogueNode {
  id: string;
  text: string;
  options: DialogueOption[];
}

// Dialogue option
export interface DialogueOption {
  text: string;
  nextNodeId: string | null;
  skillCheck?: {
    skill: keyof PlayerSkills;
    threshold: number;
  };
  questEffect?: {
    questId: string;
    effect: 'start' | 'complete' | 'update';
    objectiveId?: string;
  };
}

// NPC routine point
export interface RoutePoint {
  position: Position;
  timeOfDay: 'morning' | 'day' | 'evening' | 'night';
  duration: number; // in seconds
}

// Game state
export interface GameState {
  player: Player;
  entities: {
    enemies: Enemy[];
    npcs: NPC[];
  };
  worldState: {
    timeOfDay: 'morning' | 'day' | 'evening' | 'night';
    currentTime: number; // in seconds since game start
    inCombat: boolean;
  };
  quests: Quest[];
  dialogues: Dialogue[];
}

// Grid tile types
export enum TileType {
  FLOOR = 'floor',
  WALL = 'wall',
  DOOR = 'door',
  COVER = 'cover',
  WATER = 'water',
  TRAP = 'trap'
}

// Map tile interface
export interface MapTile {
  type: TileType;
  position: Position;
  isWalkable: boolean;
  provideCover: boolean;
}

// Map area/zone
export interface MapArea {
  id: string;
  name: string;
  level?: number;
  objectives?: string[];
  isInterior?: boolean;
  width: number;
  height: number;
  tiles: MapTile[][];
  entities: {
    enemies: Enemy[];
    npcs: NPC[];
    items: Item[];
  };
} 
