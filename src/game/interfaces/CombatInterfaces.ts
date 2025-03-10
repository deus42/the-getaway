/**
 * Realistic damage types for a dystopian urban environment
 */
export enum DamageType {
  BALLISTIC = 'ballistic',       // Bullets, firearms
  MELEE = 'melee',               // Close combat, knives, fists
  EXPLOSIVE = 'explosive',       // Grenades, mines, explosives
  FIRE = 'fire',                 // Molotovs, incendiary devices
  ELECTRIC = 'electric',         // Tasers, electric traps
  ENVIRONMENTAL = 'environmental' // Radiation, chemicals
}

/**
 * Interface for damage calculation parameters
 */
export interface DamageParams {
  amount: number;
  type: DamageType;
  source?: Phaser.GameObjects.GameObject;
  isCritical?: boolean;
  armorPiercing?: boolean;       // Bypasses some armor
  distanceModifier?: number;     // Damage falloff based on distance
}

/**
 * Interface for realistic combat stats
 */
export interface CombatStats {
  // Primary attributes
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  
  // Combat abilities
  armor: number;          // Protective gear effectiveness
  accuracy: number;       // Chance to hit targets
  evasion: number;        // Chance to dodge incoming attacks
  perception: number;     // Ability to detect threats
  actionPoints: number;   // AP available per turn
  maxActionPoints: number;
  
  // Resistances
  ballisticResistance: number;   // Resistance to bullets
  meleeResistance: number;       // Resistance to melee attacks
  explosiveResistance: number;   // Resistance to explosions
  fireResistance: number;        // Resistance to fire
  electricResistance: number;    // Resistance to electric damage
  environmentalResistance: number; // Resistance to radiation, chemicals
}

/**
 * Common status effects in a dystopian combat scenario
 */
export enum StatusEffectType {
  BLEEDING = 'bleeding',          // Taking damage over time
  STUNNED = 'stunned',            // Reduced AP, can't perform certain actions
  SUPPRESSED = 'suppressed',      // Accuracy penalty
  DISORIENTED = 'disoriented',    // Reduced perception and accuracy
  BURNING = 'burning',            // Fire damage over time
  POISONED = 'poisoned',          // Chemical exposure, damage over time
  FATIGUED = 'fatigued',          // Reduced stamina regen
  PANICKED = 'panicked',          // Random movement, can't take complex actions
  WOUNDED = 'wounded'             // Reduced max health until treated
}

/**
 * Detailed status effect representation
 */
export interface StatusEffect {
  type: StatusEffectType;
  duration: number;         // In turns or seconds
  intensity: number;        // Severity of effect (1-5)
  damagePerTurn?: number;   // For DOT effects
  statModifiers?: {         // Specific stat impacts
    [key: string]: number;  // e.g., { "accuracy": -20, "evasion": -10 }
  };
  canStack?: boolean;       // Whether multiple instances stack
  visualEffect?: string;    // Reference to visual effect to display
}

/**
 * Realistic attack options for urban combat
 */
export interface AttackOptions {
  name: string;
  description?: string;
  damageType: DamageType;
  baseDamage: number;
  apCost: number;             // Action points needed
  staminaCost?: number;       // Stamina required
  range: number;              // In grid squares or meters
  minimumRange?: number;      // Minimum effective range
  accuracy: number;           // Base accuracy modifier
  critChance?: number;        // Chance for critical hit
  critMultiplier?: number;    // Damage multiplier on crit
  armorPiercing?: number;     // How much armor is ignored (0-100%)
  areaOfEffect?: number;      // Radius of effect
  spreadPattern?: string;     // For shotguns, explosives, etc.
  coverPenetration?: number;  // Ability to shoot through cover
  ammoType?: string;          // Type of ammunition used
  ammoUsed?: number;          // Rounds consumed per attack
  effects?: StatusEffect[];   // Status effects applied on hit
  cooldown?: number;          // Turns before usable again
  isLoud?: boolean;           // Whether attack alerts enemies
  requiresLineOfSight?: boolean; // Whether direct line of sight is needed
} 