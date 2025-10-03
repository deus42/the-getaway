import { Player, PlayerSkills, PlayerSkillValues, Position } from './types';
import { v4 as uuidv4 } from 'uuid';
import { calculateMaxHP, calculateBaseAP, calculateCarryWeight } from '../systems/statCalculations';

// Default skill values
export const DEFAULT_SKILLS: PlayerSkills = {
  strength: 5,
  perception: 5,
  endurance: 5,
  charisma: 5,
  intelligence: 5,
  agility: 5,
  luck: 5
};

// Calculate derived stats from DEFAULT_SKILLS
const defaultMaxHP = calculateMaxHP(DEFAULT_SKILLS.endurance);
const defaultBaseAP = calculateBaseAP(DEFAULT_SKILLS.agility);
const defaultCarryWeight = calculateCarryWeight(DEFAULT_SKILLS.strength);

const createDefaultSkillTraining = (): PlayerSkillValues => ({
  smallGuns: 0,
  energyWeapons: 0,
  meleeCombat: 0,
  explosives: 0,
  hacking: 0,
  engineering: 0,
  science: 0,
  medicine: 0,
  stealth: 0,
  scavenging: 0,
  persuasion: 0,
  intimidation: 0,
  barter: 0,
});

// Default player configuration
export const DEFAULT_PLAYER: Player = {
  id: uuidv4(),
  name: 'Player',
  position: { x: 3, y: 1 },
  health: defaultMaxHP,
  maxHealth: defaultMaxHP,
  actionPoints: defaultBaseAP,
  maxActionPoints: defaultBaseAP,
  skills: DEFAULT_SKILLS,
  skillTraining: createDefaultSkillTraining(),
  taggedSkillIds: [],
  level: 1,
  experience: 0,
  credits: 0,
  skillPoints: 0,
  attributePoints: 0,
  backgroundId: undefined,
  perks: [],
  pendingPerkSelections: 0,
  factionReputation: {
    resistance: 0,
    corpsec: 0,
    scavengers: 0,
  },
  appearancePreset: undefined,
  inventory: {
    items: [],
    maxWeight: defaultCarryWeight,
    currentWeight: 0
  },
  equipped: {
    weapon: undefined,
    armor: undefined,
    accessory: undefined
  },
  perkRuntime: {
    gunFuShotsThisTurn: 0,
    adrenalineRushTurnsRemaining: 0,
    ghostInvisibilityTurns: 0,
    ghostConsumed: false,
  }
};

// Calculate experience needed for next level
export const calculateExperienceForNextLevel = (currentLevel: number): number => {
  return currentLevel * 100;
};

// Check if player can level up
export const canLevelUp = (player: Player): boolean => {
  const experienceNeeded = calculateExperienceForNextLevel(player.level);
  return player.experience >= experienceNeeded;
};

// Level up player
export const levelUp = (player: Player): Player => {
  if (!canLevelUp(player)) {
    return player;
  }

  const experienceNeeded = calculateExperienceForNextLevel(player.level);
  
  return {
    ...player,
    level: player.level + 1,
    experience: player.experience - experienceNeeded,
    maxHealth: player.maxHealth + 10,
    health: player.maxHealth + 10, // Full health on level up
    maxActionPoints: player.maxActionPoints + 1,
    actionPoints: player.maxActionPoints + 1, // Full AP on level up
  };
};

// Update player position
export const movePlayer = (player: Player, newPosition: Position): Player => {
  return {
    ...player,
    position: newPosition
  };
};

// Modify player health
export const modifyPlayerHealth = (player: Player, amount: number): Player => {
  const newHealth = Math.max(0, Math.min(player.health + amount, player.maxHealth));
  return {
    ...player,
    health: newHealth
  };
};

// Modify player action points
export const modifyPlayerActionPoints = (player: Player, amount: number): Player => {
  const newAP = Math.max(0, Math.min(player.actionPoints + amount, player.maxActionPoints));
  return {
    ...player,
    actionPoints: newAP
  };
};

// Reset player action points (e.g., at start of turn)
export const resetPlayerActionPoints = (player: Player): Player => {
  return {
    ...player,
    actionPoints: player.maxActionPoints
  };
};

// Increase player skill
export const increasePlayerSkill = (
  player: Player, 
  skill: keyof PlayerSkills, 
  amount: number = 1
): Player => {
  return {
    ...player,
    skills: {
      ...player.skills,
      [skill]: player.skills[skill] + amount
    }
  };
}; 
