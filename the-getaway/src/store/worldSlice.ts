import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { MapArea, Enemy, NPC, Position, Item, AlertLevel, TileType } from '../game/interfaces/types';
import {
  EnvironmentFlags,
  EnvironmentState,
  WeatherStateSnapshot,
  SignageStateSnapshot,
  RumorSetSnapshot,
  EnvironmentalNoteInstance,
} from '../game/interfaces/environment';
import { DEFAULT_LOCALE, Locale } from '../content/locales';
import { getLevel0Content } from '../content/levels/level0';
import { DEFAULT_GUARD_ARCHETYPE_ID } from '../content/ai/guardArchetypes';
import { buildWorldResources, MapConnection } from '../game/world/worldMap';
import {
  TimeOfDay,
  getCurrentTimeOfDay,
  isCurfewTime,
  DEFAULT_DAY_NIGHT_CONFIG,
} from '../game/world/dayNightCycle';
import { findNearestWalkablePosition, getAdjacentWalkablePositions } from '../game/world/grid';
import { createScopedLogger } from '../utils/logger';
import { getZoneMetadata } from '../content/zones';

export interface WorkbenchStatus {
  available: boolean;
  locationName?: string;
  type?: 'safehouse' | 'market' | 'industrial';
  feeRequired?: number;
  note?: string;
}

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
  environment: EnvironmentState;
  /** Engagement mode for HUD and turn semantics */
  engagementMode: 'none' | 'stealth' | 'combat' | 'dialog';
  /** Incrementing nonce used for UI-driven stealth toggle requests. */
  stealthToggleRequestNonce: number;
  workbenchAvailable: boolean;
  workbenchStatus: WorkbenchStatus;
}

const log = createScopedLogger('worldSlice');

const createInitialEnvironmentState = (): EnvironmentState => ({
  flags: {
    gangHeat: 'low',
    curfewLevel: 0,
    supplyScarcity: 'norm',
    blackoutTier: 'none',
  },
  weather: {
    presetId: null,
    rainIntensity: 0,
    thunderActive: false,
    sirenLoop: false,
    updatedAt: 0,
    timeOfDay: null,
  },
  signage: {},
  rumorSets: {},
  notes: [],
});

const isPositionInsideBuildingFootprint = (area: MapArea, position: Position): boolean =>
  (area.buildings ?? []).some((building) => {
    const { from, to } = building.footprint;
    return (
      position.x >= from.x &&
      position.x <= to.x &&
      position.y >= from.y &&
      position.y <= to.y
    );
  });

const buildEnemy = (name: string): Enemy => ({
  id: uuidv4(),
  name,
  position: { x: 34, y: 24 },
  facing: 'west',
  coverOrientation: null,
  suppression: 0,
  maxHealth: 45,
  health: 45,
  actionPoints: 4,
  maxActionPoints: 4,
  damage: 7,
  attackRange: 2,
  isHostile: true,
  visionCone: {
    range: 10,
    angle: 90,
    direction: 180, // facing left initially
  },
  alertLevel: AlertLevel.IDLE,
  alertProgress: 0,
  lastKnownPlayerPosition: null,
  aiProfileId: DEFAULT_GUARD_ARCHETYPE_ID,
  aiState: 'patrol',
  aiLastTransitionAt: 0,
  aiCooldowns: {},
});

export const NIGHT_START_SECONDS = Math.floor(
  DEFAULT_DAY_NIGHT_CONFIG.dayEndTime * DEFAULT_DAY_NIGHT_CONFIG.cycleDuration
);
export const DAY_START_SECONDS = Math.floor(
  DEFAULT_DAY_NIGHT_CONFIG.dayStartTime * DEFAULT_DAY_NIGHT_CONFIG.cycleDuration
);
export const MIDDAY_SECONDS = Math.floor(
  ((DEFAULT_DAY_NIGHT_CONFIG.dayStartTime + DEFAULT_DAY_NIGHT_CONFIG.eveningStartTime) / 2)
    * DEFAULT_DAY_NIGHT_CONFIG.cycleDuration
);

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
  log.debug('Initial map generated with enemy:', initialEnemy);

  const initialTime = MIDDAY_SECONDS;

  return {
    currentMapArea,
    mapAreas: resources.mapAreas,
    mapConnections: resources.connections,
    currentTime: initialTime,
    timeOfDay: getCurrentTimeOfDay(initialTime, DEFAULT_DAY_NIGHT_CONFIG),
    curfewActive: isCurfewTime(initialTime, DEFAULT_DAY_NIGHT_CONFIG),
    inCombat: false,
    isPlayerTurn: true,
    turnCount: 1,
    globalAlertLevel: AlertLevel.IDLE,
    reinforcementsScheduled: false,
    environment: createInitialEnvironmentState(),
    engagementMode: 'none',
    stealthToggleRequestNonce: 0,
    workbenchAvailable: false,
    workbenchStatus: { available: false, note: 'No workbench nearby' },
  };
};

const initialState: WorldState = buildWorldState(DEFAULT_LOCALE);

export const worldSlice = createSlice({
  name: 'world',
  initialState,
  reducers: {
    setEnvironmentFlags: (state, action: PayloadAction<Partial<EnvironmentFlags>>) => {
      state.environment.flags = {
        ...state.environment.flags,
        ...action.payload,
      };
    },
    setWorkbenchAvailable: (state, action: PayloadAction<boolean>) => {
      state.workbenchAvailable = action.payload;
      state.workbenchStatus = {
        available: action.payload,
        note: action.payload ? undefined : 'No workbench nearby',
      };
    },
    setWorkbenchStatus: (state, action: PayloadAction<WorkbenchStatus>) => {
      state.workbenchStatus = { ...action.payload };
      state.workbenchAvailable = action.payload.available;
    },

    applyEnvironmentWeather: (state, action: PayloadAction<WeatherStateSnapshot>) => {
      state.environment.weather = { ...action.payload };
    },

    applyEnvironmentSignage: (
      state,
      action: PayloadAction<{ signId: string; snapshot: SignageStateSnapshot }>
    ) => {
      const { signId, snapshot } = action.payload;
      state.environment.signage = {
        ...state.environment.signage,
        [signId]: { ...snapshot },
      };
    },

    removeEnvironmentSignage: (state, action: PayloadAction<string>) => {
      const nextSignage = { ...state.environment.signage };
      delete nextSignage[action.payload];
      state.environment.signage = nextSignage;
    },

    applyEnvironmentRumorSet: (
      state,
      action: PayloadAction<{ groupId: string; snapshot: RumorSetSnapshot }>
    ) => {
      const { groupId, snapshot } = action.payload;
      state.environment.rumorSets = {
        ...state.environment.rumorSets,
        [groupId]: { ...snapshot },
      };
    },

    removeEnvironmentRumorSet: (state, action: PayloadAction<string>) => {
      const nextRumorSets = { ...state.environment.rumorSets };
      delete nextRumorSets[action.payload];
      state.environment.rumorSets = nextRumorSets;
    },

    registerEnvironmentalNote: (state, action: PayloadAction<EnvironmentalNoteInstance>) => {
      const incoming = action.payload;
      const existingIndex = state.environment.notes.findIndex(
        (note) => note.instanceId === incoming.instanceId
      );

      if (existingIndex >= 0) {
        state.environment.notes[existingIndex] = { ...incoming };
      } else {
        state.environment.notes.push({ ...incoming });
      }
    },

    clearEnvironmentalNotesForArea: (state, action: PayloadAction<string>) => {
      const areaId = action.payload;
      state.environment.notes = state.environment.notes.filter(
        (note) => note.areaId !== areaId
      );
    },

    setNpcAmbientProfile: (
      state,
      action: PayloadAction<{
        profile: NPC['ambientProfile'] | null;
        match: { dialogueId?: string; name?: string };
      }>
    ) => {
      const { profile, match } = action.payload;
      const { dialogueId, name } = match;

      const applyProfile = (npcs: NPC[]): NPC[] => {
        let mutated = false;

        const updated = npcs.map((npc) => {
          const dialogueMatches = dialogueId ? npc.dialogueId === dialogueId : false;
          const nameMatches = name ? npc.name === name : false;

          if (!dialogueMatches && !nameMatches) {
            return npc;
          }

          mutated = true;
          return {
            ...npc,
            ambientProfile: profile ? { ...profile } : undefined,
          };
        });

        return mutated ? updated : npcs;
      };

      state.currentMapArea.entities.npcs = applyProfile(state.currentMapArea.entities.npcs);

      Object.values(state.mapAreas).forEach((area) => {
        area.entities.npcs = applyProfile(area.entities.npcs);
      });
    },

    setMapArea: (state, action: PayloadAction<MapArea>) => {
      state.currentMapArea = action.payload;
      state.inCombat = false;
      state.isPlayerTurn = true;
      state.turnCount = 1;
      state.engagementMode = 'none';
      state.workbenchAvailable = false;
      state.workbenchStatus = { available: false, note: 'No workbench nearby' };
    },

    setCurrentMapAreaZoneMetadata: (state, action: PayloadAction<{ zoneId: string }>) => {
      const zone = getZoneMetadata(action.payload.zoneId);
      const currentArea = state.currentMapArea;

      currentArea.zoneId = zone.zoneId;
      currentArea.name = zone.name;
      currentArea.displayName = zone.name;
      currentArea.level = zone.level;
      currentArea.summary = zone.summary;
      currentArea.dangerRating = zone.danger;
      currentArea.hazards = [...zone.hazards];
      currentArea.objectives = [...zone.objectives];
      state.workbenchAvailable = false;
      state.workbenchStatus = { available: false, note: 'No workbench nearby' };

      const storedArea = state.mapAreas[currentArea.id];
      if (storedArea) {
        storedArea.zoneId = currentArea.zoneId;
        storedArea.name = currentArea.name;
        storedArea.displayName = currentArea.displayName;
        storedArea.level = currentArea.level;
        storedArea.summary = currentArea.summary;
        storedArea.dangerRating = currentArea.dangerRating;
        storedArea.hazards = [...currentArea.hazards];
        storedArea.objectives = [...currentArea.objectives];
      }
    },

    updateGameTime: (state, action: PayloadAction<number>) => {
      state.currentTime += action.payload;
      state.timeOfDay = getCurrentTimeOfDay(state.currentTime, DEFAULT_DAY_NIGHT_CONFIG);
      state.curfewActive = isCurfewTime(state.currentTime, DEFAULT_DAY_NIGHT_CONFIG);
      if (state.curfewActive) {
        state.environment.flags.curfewLevel = state.reinforcementsScheduled ? 3 : 2;
      } else {
        state.environment.flags.curfewLevel = 0;
      }

      if (state.environment.flags.blackoutTier !== 'rolling') {
        state.environment.flags.blackoutTier = state.curfewActive ? 'brownout' : 'none';
      }
    },

    setGameTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
      state.timeOfDay = getCurrentTimeOfDay(state.currentTime, DEFAULT_DAY_NIGHT_CONFIG);
      state.curfewActive = isCurfewTime(state.currentTime, DEFAULT_DAY_NIGHT_CONFIG);
      if (state.curfewActive) {
        state.environment.flags.curfewLevel = state.reinforcementsScheduled ? 3 : 2;
      } else {
        state.environment.flags.curfewLevel = 0;
      }

      if (state.environment.flags.blackoutTier !== 'rolling') {
        state.environment.flags.blackoutTier = state.curfewActive ? 'brownout' : 'none';
      }
    },

    enterCombat: (state) => {
      if (!state.inCombat) {
        // Validate that there are living enemies before entering combat
        const livingEnemies = state.currentMapArea.entities.enemies.filter(
          (enemy) => enemy.health > 0
        );

        if (livingEnemies.length === 0) {
          log.debug('Cannot enter combat: no living enemies');
          return;
        }

        log.debug('Entering Combat Mode');
        state.inCombat = true;
        state.isPlayerTurn = true;
        state.turnCount = 1;
        state.engagementMode = 'combat';
      }
    },

    exitCombat: (state) => {
      if (state.inCombat) {
        log.debug('Exiting Combat Mode');
        state.inCombat = false;
        state.isPlayerTurn = true;
        state.turnCount = 1;
        state.engagementMode = 'none';
      }
    },

    setEngagementMode: (state, action: PayloadAction<'none' | 'stealth' | 'combat' | 'dialog'>) => {
      state.engagementMode = action.payload;
    },

    requestStealthToggle: (state) => {
      state.stealthToggleRequestNonce += 1;
    },

    switchTurn: (state) => {
      if (!state.inCombat) return;

      state.isPlayerTurn = !state.isPlayerTurn;

      if (state.isPlayerTurn) {
        state.turnCount++;
        log.debug(`switchTurn: Starting Player Turn ${state.turnCount}`);
      } else {
        log.debug(`switchTurn: Starting Enemy Turn (during Player Turn ${state.turnCount})`);
        log.debug('switchTurn: Resetting AP for all living enemies');
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

      log.debug('updateEnemy reducer running', {
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
        log.debug(`updateEnemy: Enemy ${incoming.id} removed from all areas.`);

        const livingEnemies = state.currentMapArea.entities.enemies.filter(
          (enemy) => enemy.health > 0
        );

        if (livingEnemies.length === 0) {
          log.debug('updateEnemy: No living enemies remain. Clearing combat state.');
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
      const tile = state.currentMapArea.tiles[position.y]?.[position.x];
      if (!tile) {
        return;
      }

      if (!tile.isWalkable || tile.type === TileType.DOOR || tile.type === TileType.WALL) {
        return;
      }

      if (isPositionInsideBuildingFootprint(state.currentMapArea, position)) {
        return;
      }

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

    removeItemInstanceFromMap: (
      state,
      action: PayloadAction<{ id?: string; position?: Position; name?: string }>
    ) => {
      const { id, position, name } = action.payload;
      const before = state.currentMapArea.entities.items;
      const filtered = before.filter((item) => {
        const matchesId = Boolean(id && item.id === id);
        const matchesPositionName = Boolean(
          position &&
            item.position?.x === position.x &&
            item.position?.y === position.y &&
            (!name || item.name === name)
        );
        return !(matchesId || matchesPositionName);
      });

      if (filtered.length !== before.length) {
        state.currentMapArea.entities.items = filtered;
      }
    },

    applyLocaleToWorld: (_state, action: PayloadAction<Locale>) => {
      return buildWorldState(action.payload);
    },

    setGlobalAlertLevel: (state, action: PayloadAction<AlertLevel>) => {
      state.globalAlertLevel = action.payload;
      const nextGangHeat =
        action.payload === AlertLevel.ALARMED
          ? 'high'
          : action.payload === AlertLevel.IDLE
          ? 'low'
          : 'med';

      const nextScarcity =
        action.payload === AlertLevel.ALARMED
          ? 'rationed'
          : action.payload === AlertLevel.IDLE
          ? 'norm'
          : 'tight';

      state.environment.flags.gangHeat = nextGangHeat;
      state.environment.flags.supplyScarcity = nextScarcity;

      if (action.payload === AlertLevel.ALARMED) {
        state.environment.flags.blackoutTier = 'rolling';
        state.environment.flags.curfewLevel = Math.max(state.environment.flags.curfewLevel, 3);
      } else if (state.environment.flags.blackoutTier === 'rolling') {
        state.environment.flags.blackoutTier = state.curfewActive ? 'brownout' : 'none';
        state.environment.flags.curfewLevel = state.curfewActive ? 2 : 0;
      }
    },

    scheduleReinforcements: (state) => {
      state.reinforcementsScheduled = true;
      state.environment.flags.curfewLevel = 3;
      if (state.globalAlertLevel === AlertLevel.ALARMED) {
        state.environment.flags.blackoutTier = 'rolling';
      }
    },

    clearReinforcementsSchedule: (state) => {
      state.reinforcementsScheduled = false;
      state.environment.flags.curfewLevel = state.curfewActive ? 2 : 0;
      if (state.environment.flags.blackoutTier !== 'rolling') {
        state.environment.flags.blackoutTier = state.curfewActive ? 'brownout' : 'none';
      }
    },
  },
});

export const {
  setEnvironmentFlags,
  applyEnvironmentWeather,
  applyEnvironmentSignage,
  removeEnvironmentSignage,
  applyEnvironmentRumorSet,
  removeEnvironmentRumorSet,
  registerEnvironmentalNote,
  clearEnvironmentalNotesForArea,
  setNpcAmbientProfile,
  setMapArea,
  setCurrentMapAreaZoneMetadata,
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
  removeItemInstanceFromMap,
  applyLocaleToWorld,
  setGlobalAlertLevel,
  scheduleReinforcements,
  clearReinforcementsSchedule,
  setEngagementMode,
  requestStealthToggle,
  setWorkbenchAvailable,
  setWorkbenchStatus,
} = worldSlice.actions;

export default worldSlice.reducer;
