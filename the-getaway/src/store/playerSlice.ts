import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Player, Position, Item, PlayerSkills } from '../game/interfaces/types';
import { DEFAULT_PLAYER } from '../game/interfaces/player';
import { calculateMaxHP, calculateBaseAP, calculateCarryWeight } from '../game/systems/statCalculations';

export interface PlayerState {
  data: Player;
}

const initialState: PlayerState = {
  data: DEFAULT_PLAYER
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    // Move player to a new position
    movePlayer: (state, action: PayloadAction<Position>) => {
      state.data.position = action.payload;
    },
    
    // Update player health
    updateHealth: (state, action: PayloadAction<number>) => {
      state.data.health = Math.max(0, Math.min(state.data.maxHealth, state.data.health + action.payload));
    },
    
    // Set player health directly
    setHealth: (state, action: PayloadAction<number>) => {
      state.data.health = Math.max(0, Math.min(state.data.maxHealth, action.payload));
    },
    
    // Update player action points
    updateActionPoints: (state, action: PayloadAction<number>) => {
      state.data.actionPoints = Math.max(0, Math.min(state.data.maxActionPoints, state.data.actionPoints + action.payload));
    },
    
    // Reset player action points to maximum
    resetActionPoints: (state) => {
      state.data.actionPoints = state.data.maxActionPoints;
    },
    
    // Add experience
    addExperience: (state, action: PayloadAction<number>) => {
      state.data.experience += action.payload;
    },

    // Add credits (currency)
    addCredits: (state, action: PayloadAction<number>) => {
      state.data.credits = Math.max(0, state.data.credits + action.payload);
    },
    
    // Level up the player
    levelUp: (state) => {
      state.data.level += 1;
      state.data.maxHealth += 10;
      state.data.health = state.data.maxHealth; // Full health on level up
      state.data.maxActionPoints += 1;
      state.data.actionPoints = state.data.maxActionPoints; // Full AP on level up
    },
    
    // Update a skill
    updateSkill: (state, action: PayloadAction<{ skill: keyof PlayerSkills; amount: number }>) => {
      const { skill, amount } = action.payload;
      state.data.skills[skill] = Math.max(1, Math.min(10, state.data.skills[skill] + amount));

      // Recalculate derived stats when attributes change
      const skills = state.data.skills;
      const newMaxHP = calculateMaxHP(skills.endurance);
      const newBaseAP = calculateBaseAP(skills.agility);
      const newCarryWeight = calculateCarryWeight(skills.strength);

      // Update max HP (preserve current HP ratio)
      const hpRatio = state.data.maxHealth > 0 ? state.data.health / state.data.maxHealth : 1;
      state.data.maxHealth = newMaxHP;
      state.data.health = Math.min(state.data.health, Math.floor(newMaxHP * hpRatio));

      // Update max AP (preserve current AP if possible)
      state.data.maxActionPoints = newBaseAP;
      state.data.actionPoints = Math.min(state.data.actionPoints, newBaseAP);

      // Update carry weight
      state.data.inventory.maxWeight = newCarryWeight;
    },

    // Set a skill directly (for character creation)
    setSkill: (state, action: PayloadAction<{ skill: keyof PlayerSkills; value: number }>) => {
      const { skill, value } = action.payload;
      state.data.skills[skill] = Math.max(1, Math.min(10, value));

      // Recalculate derived stats
      const skills = state.data.skills;
      state.data.maxHealth = calculateMaxHP(skills.endurance);
      state.data.health = state.data.maxHealth;
      state.data.maxActionPoints = calculateBaseAP(skills.agility);
      state.data.actionPoints = state.data.maxActionPoints;
      state.data.inventory.maxWeight = calculateCarryWeight(skills.strength);
    },
    
    // Add item to inventory
    addItem: (state, action: PayloadAction<Item>) => {
      const item = action.payload;
      const newWeight = state.data.inventory.currentWeight + item.weight;
      
      // Check if player can carry the item
      if (newWeight <= state.data.inventory.maxWeight) {
        state.data.inventory.items.push(item);
        state.data.inventory.currentWeight = newWeight;
      }
    },
    
    // Remove item from inventory
    removeItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const item = state.data.inventory.items.find(item => item.id === itemId);
      
      if (item) {
        state.data.inventory.items = state.data.inventory.items.filter(item => item.id !== itemId);
        state.data.inventory.currentWeight -= item.weight;
      }
    },
    
    // Reset player to default
    resetPlayer: (state) => {
      state.data = DEFAULT_PLAYER;
    },

    // Set the entire player data object (useful after complex operations)
    setPlayerData: (state, action: PayloadAction<Player>) => {
      state.data = action.payload;
    }
  }
});

export const {
  movePlayer,
  updateHealth,
  setHealth,
  updateActionPoints,
  resetActionPoints,
  addExperience,
  addCredits,
  levelUp,
  updateSkill,
  setSkill,
  addItem,
  removeItem,
  resetPlayer,
  setPlayerData
} = playerSlice.actions;

export default playerSlice.reducer; 