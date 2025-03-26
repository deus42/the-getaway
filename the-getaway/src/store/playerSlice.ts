import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Player, Position, Item, PlayerSkills } from '../game/interfaces/types';
import { DEFAULT_PLAYER } from '../game/interfaces/player';

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
      state.data.skills[skill] += amount;
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
  levelUp,
  updateSkill,
  addItem,
  removeItem,
  resetPlayer
} = playerSlice.actions;

export default playerSlice.reducer; 