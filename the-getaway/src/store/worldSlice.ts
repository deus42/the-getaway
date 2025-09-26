import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { MapArea, Enemy, NPC, Position, Item } from '../game/interfaces/types';
import { mapAreas, slumsArea } from '../game/world/worldMap';
import {
  TimeOfDay,
  getCurrentTimeOfDay,
  isCurfewTime,
  DEFAULT_DAY_NIGHT_CONFIG,
} from '../game/world/dayNightCycle';

export interface WorldState {
  currentMapArea: MapArea;
  mapAreas: Record<string, MapArea>;
  currentTime: number;
  timeOfDay: TimeOfDay;
  curfewActive: boolean;
  inCombat: boolean;
  isPlayerTurn: boolean;
  turnCount: number;
}

// Initial map areas are created in worldMap.ts
const initialMap = slumsArea;
const initialEnemy: Enemy = {
  id: uuidv4(),
  name: "Guard",
  position: { x: 34, y: 24 },
  maxHealth: 25,
  health: 25,
  actionPoints: 6,
  maxActionPoints: 6,
  damage: 5,
  attackRange: 1,
  isHostile: true,
};
initialMap.entities.enemies.push(initialEnemy);
console.log("[worldSlice] Initial map generated with enemy:", initialEnemy);

const initialState: WorldState = {
  currentMapArea: initialMap,
  mapAreas,
  currentTime: 0,
  timeOfDay: getCurrentTimeOfDay(0, DEFAULT_DAY_NIGHT_CONFIG),
  curfewActive: isCurfewTime(0, DEFAULT_DAY_NIGHT_CONFIG),
  inCombat: false,
  isPlayerTurn: true,
  turnCount: 1,
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
      state.timeOfDay = getCurrentTimeOfDay(state.currentTime, DEFAULT_DAY_NIGHT_CONFIG);
      state.curfewActive = isCurfewTime(state.currentTime, DEFAULT_DAY_NIGHT_CONFIG);
    },

    setGameTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
      state.timeOfDay = getCurrentTimeOfDay(state.currentTime, DEFAULT_DAY_NIGHT_CONFIG);
      state.curfewActive = isCurfewTime(state.currentTime, DEFAULT_DAY_NIGHT_CONFIG);
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
      const incoming = action.payload;

      const syncEnemyInArea = (area: MapArea) => {
        const enemyIndex = area.entities.enemies.findIndex(
          (enemy) => enemy.id === incoming.id
        );

        if (enemyIndex === -1) {
          return;
        }

        if (incoming.health <= 0) {
          area.entities.enemies.splice(enemyIndex, 1);
        } else {
          area.entities.enemies[enemyIndex] = incoming;
        }
      };

      console.log("[worldSlice] updateEnemy reducer running", {
        enemyId: incoming.id,
        health: incoming.health,
      });

      syncEnemyInArea(state.currentMapArea);

      Object.values(state.mapAreas).forEach((area) => {
        syncEnemyInArea(area);
      });

      if (incoming.health <= 0) {
        console.log(
          `[worldSlice updateEnemy] Enemy ${incoming.id} removed from all areas.`
        );

        const livingEnemies = state.currentMapArea.entities.enemies.filter(
          (enemy) => enemy.health > 0
        );

        if (livingEnemies.length === 0) {
          console.log(
            "[worldSlice updateEnemy] No living enemies remain. Clearing combat state."
          );
          state.inCombat = false;
          state.isPlayerTurn = true;
          state.turnCount = 1;
        }
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
