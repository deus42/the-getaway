import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapArea, Enemy, NPC, Position, Item } from '../game/interfaces/types';
import { createTestMapArea } from '../game/world/grid';

export interface WorldState {
  currentMapArea: MapArea;
  currentTime: number;
  inCombat: boolean;
  isPlayerTurn: boolean;
}

const initialState: WorldState = {
  currentMapArea: createTestMapArea('Test Area'),
  currentTime: 0, // Time in seconds since game start
  inCombat: false,
  isPlayerTurn: true
};

export const worldSlice = createSlice({
  name: 'world',
  initialState,
  reducers: {
    // Set the current map area
    setCurrentMapArea: (state, action: PayloadAction<MapArea>) => {
      state.currentMapArea = action.payload;
    },
    
    // Update game time
    updateGameTime: (state, action: PayloadAction<number>) => {
      state.currentTime += action.payload;
    },
    
    // Set game time directly
    setGameTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    
    // Enter combat mode
    enterCombat: (state) => {
      state.inCombat = true;
      state.isPlayerTurn = true;
    },
    
    // Exit combat mode
    exitCombat: (state) => {
      state.inCombat = false;
    },
    
    // Switch turns in combat
    switchTurn: (state) => {
      state.isPlayerTurn = !state.isPlayerTurn;
    },
    
    // Update an enemy in the current map
    updateEnemy: (state, action: PayloadAction<Enemy>) => {
      const enemy = action.payload;
      const index = state.currentMapArea.entities.enemies.findIndex(e => e.id === enemy.id);
      
      if (index !== -1) {
        state.currentMapArea.entities.enemies[index] = enemy;
      }
    },
    
    // Add an enemy to the current map
    addEnemy: (state, action: PayloadAction<Enemy>) => {
      state.currentMapArea.entities.enemies.push(action.payload);
    },
    
    // Remove an enemy from the current map
    removeEnemy: (state, action: PayloadAction<string>) => {
      const enemyId = action.payload;
      state.currentMapArea.entities.enemies = state.currentMapArea.entities.enemies.filter(
        enemy => enemy.id !== enemyId
      );
    },
    
    // Update an NPC in the current map
    updateNPC: (state, action: PayloadAction<NPC>) => {
      const npc = action.payload;
      const index = state.currentMapArea.entities.npcs.findIndex(n => n.id === npc.id);
      
      if (index !== -1) {
        state.currentMapArea.entities.npcs[index] = npc;
      }
    },
    
    // Add an NPC to the current map
    addNPC: (state, action: PayloadAction<NPC>) => {
      state.currentMapArea.entities.npcs.push(action.payload);
    },
    
    // Remove an NPC from the current map
    removeNPC: (state, action: PayloadAction<string>) => {
      const npcId = action.payload;
      state.currentMapArea.entities.npcs = state.currentMapArea.entities.npcs.filter(
        npc => npc.id !== npcId
      );
    },
    
    // Add an item to the current map
    addItemToMap: (state, action: PayloadAction<{item: Item, position: Position}>) => {
      const { item, position } = action.payload;
      const itemWithPosition = {
        ...item,
        position
      };
      state.currentMapArea.entities.items.push(itemWithPosition as Item & { position: Position });
    },
    
    // Remove an item from the current map
    removeItemFromMap: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.currentMapArea.entities.items = state.currentMapArea.entities.items.filter(
        item => item.id !== itemId
      );
    }
  }
});

export const {
  setCurrentMapArea,
  updateGameTime,
  setGameTime,
  enterCombat,
  exitCombat,
  switchTurn,
  updateEnemy,
  addEnemy,
  removeEnemy,
  updateNPC,
  addNPC,
  removeNPC,
  addItemToMap,
  removeItemFromMap
} = worldSlice.actions;

export default worldSlice.reducer; 