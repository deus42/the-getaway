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

// Skill tree identifiers
export type SkillBranchId = 'combat' | 'tech' | 'survival' | 'social';

export type CombatSkillId = 'smallGuns' | 'energyWeapons' | 'meleeCombat' | 'explosives';
export type TechSkillId = 'hacking' | 'engineering' | 'science';
export type SurvivalSkillId = 'medicine' | 'stealth' | 'scavenging';
export type SocialSkillId = 'persuasion' | 'intimidation' | 'barter';

export type SkillId =
  | CombatSkillId
  | TechSkillId
  | SurvivalSkillId
  | SocialSkillId;

export type PerkCategory = 'combat' | 'utility' | 'dialogue' | 'capstone';

export type PerkId =
  | 'steadyHands'
  | 'toughness'
  | 'quickDraw'
  | 'adrenalineRush'
  | 'silentRunner'
  | 'gunFu'
  | 'ghost'
  | 'executioner';

export interface PerkRuntimeState {
  gunFuShotsThisTurn: number;
  adrenalineRushTurnsRemaining: number;
  ghostInvisibilityTurns: number;
  ghostConsumed: boolean;
}

export type PlayerSkillValues = Record<SkillId, number>;

export type PersonalityTrait = 'earnest' | 'sarcastic' | 'ruthless' | 'stoic';

export type PersonalityFlags = Record<PersonalityTrait, number>;

export type FactionId = 'resistance' | 'corpsec' | 'scavengers';
export type FactionStanding = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied';

export interface PersonalityProfile {
  alignment: PersonalityTrait;
  flags: PersonalityFlags;
  lastUpdated: number;
  lastChangeSource?: string;
}

// Player entity with core stats, skill tree progress, and equipment
export interface EncumbranceState {
  level: 'normal' | 'heavy' | 'overloaded' | 'immobile';
  percentage: number;
  movementApMultiplier: number;
  attackApMultiplier: number;
  warning?: string;
}

export interface Player extends Entity {
  actionPoints: number;
  maxActionPoints: number;
  stamina: number;
  maxStamina: number;
  isExhausted: boolean;
  isCrouching: boolean;
  skills: PlayerSkills;
  skillTraining: PlayerSkillValues;
  taggedSkillIds: SkillId[];
  level: number;
  experience: number;
  credits: number;
  skillPoints: number; // Unspent skill points for skill tree allocation
  attributePoints: number; // Unspent attribute points for SPECIAL increases
  backgroundId?: string;
  perks: string[];
  pendingPerkSelections: number;
  karma: number;
  personality: PersonalityProfile;
  factionReputation: Record<FactionId, number>;
  appearancePreset?: string;
  inventory: {
    items: Item[];
    maxWeight: number;
    currentWeight: number;
    hotbar: (string | null)[];
  };
  equipped: {
    weapon?: Weapon;
    armor?: Armor;
    accessory?: Item;
    secondaryWeapon?: Weapon;
    meleeWeapon?: Weapon;
    bodyArmor?: Armor;
    helmet?: Armor;
    accessory1?: Item;
    accessory2?: Item;
  };
  equippedSlots?: Partial<Record<EquipmentSlot, Item>>;
  activeWeaponSlot?: 'primaryWeapon' | 'secondaryWeapon' | 'meleeWeapon';
  perkRuntime: PerkRuntimeState;
  encumbrance: EncumbranceState;
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

export type CameraType = 'static' | 'motionSensor' | 'drone';

export type SurveillanceActivationPhase = 'morning' | 'day' | 'evening' | 'night';

export enum CameraAlertState {
  IDLE = 'idle',
  SUSPICIOUS = 'suspicious',
  ALARMED = 'alarmed',
  DISABLED = 'disabled',
}

export interface CameraSweepConfig {
  angles: number[];
  cycleDurationMs: number;
}

export interface CameraPathConfig {
  waypoints: Position[];
  travelDurationMs: number;
}

export interface CameraHackState {
  loopFootageUntil?: number;
  disabledUntil?: number;
  redirectUntil?: number;
}

export interface CameraDefinition {
  id: string;
  type: CameraType;
  position: Position;
  range: number;
  fieldOfView: number;
  activationPhases: SurveillanceActivationPhase[];
  sweep?: CameraSweepConfig;
  motionRadius?: number;
  patrolPath?: CameraPathConfig;
}

export interface CameraRuntimeState extends CameraDefinition {
  alertState: CameraAlertState;
  detectionProgress: number;
  isActive: boolean;
  hackState: CameraHackState;
  lastDetectionTimestamp?: number;
  currentDirection: number;
  sweepDirection?: 1 | -1;
  sweepElapsedMs?: number;
  sweepIndex?: number;
  patrolProgressMs?: number;
  currentWaypointIndex?: number;
  networkAlertContributionAt?: number;
}

export interface CameraNetworkAlert {
  triggeredAt: number;
  expiresAt: number;
  contributingCameraIds: string[];
}

export interface SurveillanceZoneState {
  areaId: string;
  zoneId: string;
  cameras: Record<string, CameraRuntimeState>;
  networkAlert: CameraNetworkAlert | null;
  lastUpdatedAt: number;
}

export interface SurveillanceHUDState {
  overlayEnabled: boolean;
  camerasNearby: number;
  detectionProgress: number;
  activeCameraId: string | null;
  alertState: CameraAlertState;
  networkAlertActive: boolean;
  networkAlertExpiresAt: number | null;
}

export interface SurveillanceState {
  zones: Record<string, SurveillanceZoneState>;
  hud: SurveillanceHUDState;
  curfewBanner: {
    visible: boolean;
    lastActivatedAt: number | null;
  };
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

export type EquipmentSlot =
  | 'primaryWeapon'
  | 'secondaryWeapon'
  | 'meleeWeapon'
  | 'bodyArmor'
  | 'helmet'
  | 'accessory1'
  | 'accessory2';

export interface Durability {
  current: number;
  max: number;
}

// Item interface
export interface Item {
  id: string;
  name: string;
  description: string;
  weight: number;
  value: number;
  isQuestItem: boolean;
  position?: Position;
  stackable?: boolean;
  maxStack?: number;
  quantity?: number;
  durability?: Durability;
  equipSlot?: EquipmentSlot;
  statModifiers?: StatModifiers;
  tags?: string[];
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

// Weapon extends item
export interface Weapon extends Item {
  damage: number;
  range: number;
  apCost: number;
  skillType: CombatSkillId;
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
export type ConsumableEffectType = 'health' | 'actionPoints' | 'stat' | 'repair';

export interface ConsumableEffect {
  type: ConsumableEffectType;
  value: number;
  duration?: number;
  statAffected?: keyof PlayerSkills;
  target?: 'weapon' | 'armor' | 'any';
}

export interface Consumable extends Item {
  effect: ConsumableEffect;
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
  speaker?: string;
}

// Dialogue option
export interface DialogueOption {
  text: string;
  nextNodeId: string | null;
  skillCheck?: {
    skill: keyof PlayerSkills | SkillId;
    threshold: number;
    domain?: 'attribute' | 'skill';
  };
  factionRequirement?: {
    factionId: FactionId;
    minimumStanding?: FactionStanding;
    maximumStanding?: FactionStanding;
    minimumReputation?: number;
    maximumReputation?: number;
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
  skillRequirement?: {
    skill: SkillId;
    threshold: number;
  };
}

// Map area/zone
export interface MapArea {
  id: string;
  name: string;
  zoneId: string;
  level?: number;
  objectives?: string[];
  isInterior?: boolean;
  factionRequirement?: {
    factionId: FactionId;
    minimumStanding?: FactionStanding;
    minimumReputation?: number;
  };
  width: number;
  height: number;
  tiles: MapTile[][];
  entities: {
    enemies: Enemy[];
    npcs: NPC[];
    items: Item[];
  };
} 
