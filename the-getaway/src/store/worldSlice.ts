import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapArea, Enemy, NPC, Position, Item } from '../game/interfaces/types';
import { createTestMapArea } from '../game/world/grid';

export interface WorldState {
  currentMapArea: MapArea;
  currentTime: number;
  inCombat: boolean;
  isPlayerTurn: boolean;
  turnCount: number;
}

// Create initial enemy using only properties from the type definition
const initialMap = createTestMapArea('Test Area'); // Use existing helper
const initialEnemy: Enemy = {
  id: crypto.randomUUID(),
  name: "Guard",
  position: { x: 7, y: 4 },
  maxHealth: 25,
  health: 25, // Correct property
  actionPoints: 6,
  maxActionPoints: 6,
  damage: 5,        // Property from Enemy type
  attackRange: 1,   // Property from Enemy type
  isHostile: true,  // Property from Enemy type
};
initialMap.entities.enemies.push(initialEnemy);
console.log("[worldSlice] Initial map generated with enemy:", initialEnemy);

const initialState: WorldState = {
  currentMapArea: initialMap,
  currentTime: 0,
  inCombat: false,
  isPlayerTurn: true,
  turnCount: 1, // Start at turn 1
};

export const worldSlice = createSlice({
  name: 'world',
  initialState,
  reducers: {
    setMapArea: (state, action: PayloadAction<MapArea>) => {
      state.currentMapArea = action.payload;
      state.inCombat = false;
      state.isPlayerTurn = true;
      state.turnCount = 1;
    },
    
    updateGameTime: (state, action: PayloadAction<number>) => {
      state.currentTime += action.payload;
    },
    
    setGameTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    
    enterCombat: (state) => {
      if (!state.inCombat) {
        console.log("[worldSlice] Entering Combat Mode");
        state.inCombat = true;
        state.isPlayerTurn = true;
        state.turnCount = 1;
      }
    },
    
    exitCombat: (state) => {
      if (state.inCombat) {
        console.log("[worldSlice] Exiting Combat Mode");
        state.inCombat = false;
        state.isPlayerTurn = true;
        state.turnCount = 1;
      }
    },
    
    switchTurn: (state) => {
      if (!state.inCombat) return;

      state.isPlayerTurn = !state.isPlayerTurn;

      if (state.isPlayerTurn) {
        // Just switched TO player turn
        state.turnCount++; // Increment turn count here
        console.log(`[worldSlice] switchTurn: Starting Player Turn ${state.turnCount}`);
        // Player AP reset is handled in GameController
      } else {
        // Just switched TO enemy turn
         console.log(`[worldSlice] switchTurn: Starting Enemy Turn (during Player Turn ${state.turnCount})`);
        console.log("[worldSlice] switchTurn: Resetting AP for all living enemies");
        state.currentMapArea.entities.enemies.forEach((enemy, index) => {
          if (enemy.health > 0) {
            // Modify draft directly
            state.currentMapArea.entities.enemies[index].actionPoints = enemy.maxActionPoints;
          }
        });
      }
    },
    
    updateEnemy: (state, action: PayloadAction<Enemy>) => {
      const updatedEnemy = action.payload;
      const index = state.currentMapArea.entities.enemies.findIndex(
        (e) => e.id === updatedEnemy.id
      );
      if (index !== -1) {
        const healthBefore = state.currentMapArea.entities.enemies[index].health;
        state.currentMapArea.entities.enemies[index] = updatedEnemy;
         console.log("[worldSlice] updateEnemy reducer: UPDATING state", {
            enemyId: updatedEnemy.id, healthBefore, healthAfter: updatedEnemy.health });

        if (updatedEnemy.health <= 0) {
          console.log(`[worldSlice updateEnemy] Enemy ${updatedEnemy.id} health <= 0. Checking remaining enemies.`);
          // Get the current list of enemies *after* the update within this reducer step
          const currentEnemiesInState = state.currentMapArea.entities.enemies;
          console.log('[worldSlice updateEnemy] Enemies in state for check:', JSON.stringify(currentEnemiesInState.map(e => ({id: e.id, health: e.health}))));

          // Check if any enemies in the updated list still have health > 0
          const livingEnemiesAfterUpdate = currentEnemiesInState.filter(e => e.health > 0);
          console.log('[worldSlice updateEnemy] Living enemies count after update:', livingEnemiesAfterUpdate.length);

          if (livingEnemiesAfterUpdate.length === 0) {
            console.log("[worldSlice updateEnemy] NO enemies left alive. Setting inCombat=false.");
            state.inCombat = false;
            state.isPlayerTurn = true; // Ensure player gets control
            state.turnCount = 1; // Reset turn count
            console.log("[worldSlice updateEnemy] State after setting inCombat=false:", { inCombat: state.inCombat, isPlayerTurn: state.isPlayerTurn, turnCount: state.turnCount });
          } else {
             console.log(`[worldSlice updateEnemy] ${livingEnemiesAfterUpdate.length} enemies still alive. Combat continues.`);
          }
        }
      } else {
         console.warn(`[worldSlice] updateEnemy reducer: Enemy ${updatedEnemy.id} not found.`);
      }
    },
    
    addEnemy: (state, action: PayloadAction<Enemy>) => {
      state.currentMapArea.entities.enemies.push(action.payload);
    },
    
    removeEnemy: (state, action: PayloadAction<string>) => {
      const enemyId = action.payload;
      state.currentMapArea.entities.enemies = state.currentMapArea.entities.enemies.filter(
        enemy => enemy.id !== enemyId
      );
    },
    
    updateNPC: (state, action: PayloadAction<NPC>) => {
      const npc = action.payload;
      const index = state.currentMapArea.entities.npcs.findIndex(n => n.id === npc.id);
      
      if (index !== -1) {
        state.currentMapArea.entities.npcs[index] = npc;
      }
    },
    
    addNPC: (state, action: PayloadAction<NPC>) => {
      state.currentMapArea.entities.npcs.push(action.payload);
    },
    
    removeNPC: (state, action: PayloadAction<string>) => {
      const npcId = action.payload;
      state.currentMapArea.entities.npcs = state.currentMapArea.entities.npcs.filter(
        npc => npc.id !== npcId
      );
    },
    
    addItemToMap: (state, action: PayloadAction<{item: Item, position: Position}>) => {
      const { item, position } = action.payload;
      const itemWithPosition = {
        ...item,
        position
      };
      state.currentMapArea.entities.items.push(itemWithPosition as Item & { position: Position });
    },
    
    removeItemFromMap: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.currentMapArea.entities.items = state.currentMapArea.entities.items.filter(
        item => item.id !== itemId
      );
    }
  }
});

export const {
  setMapArea,
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