import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { MapArea, Enemy, NPC, Position, Item, AlertLevel } from '../game/interfaces/types';
import { DEFAULT_LOCALE, Locale } from '../content/locales';
import { getLevel0Content } from '../content/levels/level0';
import { buildWorldResources, MapConnection } from '../game/world/worldMap';
import {
  TimeOfDay,
  getCurrentTimeOfDay,
  isCurfewTime,
  DEFAULT_DAY_NIGHT_CONFIG,
} from '../game/world/dayNightCycle';
import { findNearestWalkablePosition, getAdjacentWalkablePositions } from '../game/world/grid';

export interface WorldState {
  currentMapArea: MapArea;
  mapAreas: Record<string, MapArea>;
  mapConnections: MapConnection[];
  currentTime: number;
  timeOfDay: TimeOfDay;
  curfewActive: boolean;
  inCombat: boolean;
  isPlayerTurn: boolean;
  turnCount: number;
  globalAlertLevel: AlertLevel;
  reinforcementsScheduled: boolean;
}

const buildEnemy = (name: string): Enemy => ({
  id: uuidv4(),
  name,
  position: { x: 34, y: 24 },
  maxHealth: 25,
  health: 25,
  actionPoints: 6,
  maxActionPoints: 6,
  damage: 5,
  attackRange: 1,
  isHostile: true,
  visionCone: {
    range: 8,
    angle: 90,
    direction: 180, // facing left initially
  },
  alertLevel: AlertLevel.IDLE,
  alertProgress: 0,
  lastKnownPlayerPosition: null,
});

const buildWorldState = (locale: Locale): WorldState => {
  const resources = buildWorldResources({ locale });
  const content = getLevel0Content(locale);

  const currentMapArea = resources.slumsArea;
  const initialEnemy = buildEnemy(content.world.initialEnemyName);
  const sanitizedPosition = findNearestWalkablePosition(initialEnemy.position, currentMapArea);
  if (sanitizedPosition) {
    initialEnemy.position = sanitizedPosition;
  }
  currentMapArea.entities.enemies.push(initialEnemy);
  console.log('[worldSlice] Initial map generated with enemy:', initialEnemy);

  return {
    currentMapArea,
    mapAreas: resources.mapAreas,
    mapConnections: resources.connections,
    currentTime: 0,
    timeOfDay: getCurrentTimeOfDay(0, DEFAULT_DAY_NIGHT_CONFIG),
    curfewActive: isCurfewTime(0, DEFAULT_DAY_NIGHT_CONFIG),
    inCombat: false,
    isPlayerTurn: true,
    turnCount: 1,
    globalAlertLevel: AlertLevel.IDLE,
    reinforcementsScheduled: false,
  };
};

const initialState: WorldState = buildWorldState(DEFAULT_LOCALE);

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
        console.log('[worldSlice] Entering Combat Mode');
        state.inCombat = true;
        state.isPlayerTurn = true;
        state.turnCount = 1;
      }
    },

    exitCombat: (state) => {
      if (state.inCombat) {
        console.log('[worldSlice] Exiting Combat Mode');
        state.inCombat = false;
        state.isPlayerTurn = true;
        state.turnCount = 1;
      }
    },

    switchTurn: (state) => {
      if (!state.inCombat) return;

      state.isPlayerTurn = !state.isPlayerTurn;

      if (state.isPlayerTurn) {
        state.turnCount++;
        console.log(`[worldSlice] switchTurn: Starting Player Turn ${state.turnCount}`);
      } else {
        console.log(`[worldSlice] switchTurn: Starting Enemy Turn (during Player Turn ${state.turnCount})`);
        console.log('[worldSlice] switchTurn: Resetting AP for all living enemies');
        state.currentMapArea.entities.enemies.forEach((enemy, index) => {
          if (enemy.health > 0) {
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
          return false;
        }

        if (incoming.health <= 0) {
          area.entities.enemies.splice(enemyIndex, 1);
        } else {
          area.entities.enemies[enemyIndex] = incoming;
        }

        area.entities.enemies = [...area.entities.enemies];
        return true;
      };

      console.log('[worldSlice] updateEnemy reducer running', {
        enemyId: incoming.id,
        health: incoming.health,
      });

      const updatedCurrentArea = syncEnemyInArea(state.currentMapArea);

      Object.values(state.mapAreas).forEach((area) => {
        const updated = syncEnemyInArea(area);
        if (!updatedCurrentArea && updated && area.id === state.currentMapArea.id) {
          state.currentMapArea.entities.enemies = [...state.currentMapArea.entities.enemies];
        }
      });

      if (incoming.health <= 0) {
        console.log(`[worldSlice updateEnemy] Enemy ${incoming.id} removed from all areas.`);

        const livingEnemies = state.currentMapArea.entities.enemies.filter(
          (enemy) => enemy.health > 0
        );

        if (livingEnemies.length === 0) {
          console.log('[worldSlice updateEnemy] No living enemies remain. Clearing combat state.');
          state.inCombat = false;
          state.isPlayerTurn = true;
          state.turnCount = 1;
        }
      }
    },

    addEnemy: (state, action: PayloadAction<Enemy>) => {
      const enemy = { ...action.payload };
      let spawnPosition = findNearestWalkablePosition(enemy.position, state.currentMapArea);

      if (!spawnPosition) {
        const candidates = getAdjacentWalkablePositions(enemy.position, state.currentMapArea, undefined, []);
        const openCandidate = candidates.find((candidate) =>
          state.currentMapArea.entities.enemies.every(
            (existing) => existing.position.x !== candidate.x || existing.position.y !== candidate.y
          )
        );
        spawnPosition = openCandidate ?? enemy.position;
      }

      enemy.position = spawnPosition;

      state.currentMapArea.entities.enemies.push(enemy);
      state.currentMapArea.entities.enemies = [...state.currentMapArea.entities.enemies];
    },

    removeEnemy: (state, action: PayloadAction<string>) => {
      const enemyId = action.payload;
      state.currentMapArea.entities.enemies = state.currentMapArea.entities.enemies.filter(
        (enemy) => enemy.id !== enemyId
      );
      state.currentMapArea.entities.enemies = [...state.currentMapArea.entities.enemies];
    },

    updateNPC: (state, action: PayloadAction<NPC>) => {
      const npc = action.payload;
      const index = state.currentMapArea.entities.npcs.findIndex((n) => n.id === npc.id);

      if (index !== -1) {
        state.currentMapArea.entities.npcs[index] = npc;
        state.currentMapArea.entities.npcs = [...state.currentMapArea.entities.npcs];
      }
    },

    addNPC: (state, action: PayloadAction<NPC>) => {
      state.currentMapArea.entities.npcs.push(action.payload);
      state.currentMapArea.entities.npcs = [...state.currentMapArea.entities.npcs];
    },

    removeNPC: (state, action: PayloadAction<string>) => {
      const npcId = action.payload;
      state.currentMapArea.entities.npcs = state.currentMapArea.entities.npcs.filter(
        (npc) => npc.id !== npcId
      );
      state.currentMapArea.entities.npcs = [...state.currentMapArea.entities.npcs];
    },

    addItemToMap: (state, action: PayloadAction<{ item: Item; position: Position }>) => {
      const { item, position } = action.payload;
      const itemWithPosition = {
        ...item,
        position,
      } as Item & { position: Position };
      state.currentMapArea.entities.items.push(itemWithPosition);
    },

    removeItemFromMap: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.currentMapArea.entities.items = state.currentMapArea.entities.items.filter(
        (item) => item.id !== itemId
      );
    },

    applyLocaleToWorld: (_state, action: PayloadAction<Locale>) => {
      return buildWorldState(action.payload);
    },

    setGlobalAlertLevel: (state, action: PayloadAction<AlertLevel>) => {
      state.globalAlertLevel = action.payload;
    },

    scheduleReinforcements: (state) => {
      state.reinforcementsScheduled = true;
    },

    clearReinforcementsSchedule: (state) => {
      state.reinforcementsScheduled = false;
    },
  },
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
  removeItemFromMap,
  applyLocaleToWorld,
  setGlobalAlertLevel,
  scheduleReinforcements,
  clearReinforcementsSchedule,
} = worldSlice.actions;

export default worldSlice.reducer;
