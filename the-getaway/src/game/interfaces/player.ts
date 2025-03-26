import { Player, PlayerSkills, Position } from './types';
import { v4 as uuidv4 } from 'uuid';

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

// Default player configuration
export const DEFAULT_PLAYER: Player = {
  id: uuidv4(),
  name: 'Player',
  position: { x: 0, y: 0 },
  health: 100,
  maxHealth: 100,
  actionPoints: 6,
  maxActionPoints: 6,
  skills: DEFAULT_SKILLS,
  level: 1,
  experience: 0,
  inventory: {
    items: [],
    maxWeight: 150,
    currentWeight: 0
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