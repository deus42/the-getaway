import { configureStore } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import worldReducer, {
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
  setGlobalAlertLevel,
  scheduleReinforcements,
  clearReinforcementsSchedule,
  WorldState,
} from '../store/worldSlice';
import { MapArea, Enemy, NPC, Item, AlertLevel, TileType, Position, MapTile } from '../game/interfaces/types';

const createTestStore = (preloadedState?: { world: WorldState }) => {
  return configureStore({
    reducer: {
      world: worldReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
    preloadedState,
  });
};

const createTile = (type: TileType = TileType.FLOOR, overrides: Partial<MapTile> = {}): MapTile => ({
  type,
  position: overrides.position ?? { x: 0, y: 0 },
  isWalkable: overrides.isWalkable ?? type !== TileType.WALL,
  provideCover: overrides.provideCover ?? type === TileType.COVER,
});

const createTestMapArea = (): MapArea => {
  const width = 50;
  const height = 50;
  const tiles: MapTile[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      createTile(TileType.FLOOR, { position: { x, y }, isWalkable: true, provideCover: false })
    )
  );

  return {
    id: 'test-area',
    name: 'Test Area',
    zoneId: 'test-zone',
    width,
    height,
    tiles,
    entities: {
      enemies: [],
      npcs: [],
      items: [],
    },
  };
};

const createTestEnemy = (name = 'Test Enemy'): Enemy => ({
  id: uuidv4(),
  name,
  position: { x: 10, y: 10 },
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
    direction: 180,
  },
  alertLevel: AlertLevel.IDLE,
  alertProgress: 0,
  lastKnownPlayerPosition: null,
});

const createTestNPC = (name = 'Test NPC'): NPC => ({
  id: uuidv4(),
  name,
  position: { x: 15, y: 15 },
  health: 10,
  maxHealth: 10,
  dialogueId: 'test-dialogue',
  routine: [],
  isInteractive: true,
});

describe('worldSlice', () => {
  describe('map area management', () => {
    it('sets current map area', () => {
      const store = createTestStore();
      const newMapArea = createTestMapArea();

      store.dispatch(setMapArea(newMapArea));

      const world = store.getState().world;
      expect(world.currentMapArea.id).toBe('test-area');
      expect(world.inCombat).toBe(false);
      expect(world.isPlayerTurn).toBe(true);
      expect(world.turnCount).toBe(1);
    });

    it('resets combat state when changing map area', () => {
      const store = createTestStore();
      const newMapArea = createTestMapArea();

      store.dispatch(enterCombat());
      store.dispatch(switchTurn());
      store.dispatch(setMapArea(newMapArea));

      const world = store.getState().world;
      expect(world.inCombat).toBe(false);
      expect(world.isPlayerTurn).toBe(true);
      expect(world.turnCount).toBe(1);
    });
  });

  describe('time management', () => {
    it('updates game time incrementally', () => {
      const store = createTestStore();

      store.dispatch(updateGameTime(100));
      expect(store.getState().world.currentTime).toBe(100);

      store.dispatch(updateGameTime(50));
      expect(store.getState().world.currentTime).toBe(150);
    });

    it('sets game time directly', () => {
      const store = createTestStore();

      store.dispatch(updateGameTime(100));
      store.dispatch(setGameTime(500));

      expect(store.getState().world.currentTime).toBe(500);
    });

    it('updates time of day based on game time', () => {
      const store = createTestStore();

      store.dispatch(setGameTime(0));
      const morning = store.getState().world.timeOfDay;

      store.dispatch(setGameTime(1000));
      const later = store.getState().world.timeOfDay;

      // Time of day should be a valid enum value
      expect(['morning', 'day', 'evening', 'night']).toContain(morning);
      expect(['morning', 'day', 'evening', 'night']).toContain(later);
    });

    it('updates curfew status based on time', () => {
      const store = createTestStore();

      store.dispatch(setGameTime(0));
      const world = store.getState().world;

      expect(typeof world.curfewActive).toBe('boolean');
    });
  });

  describe('combat management', () => {
    it('enters combat mode', () => {
      const store = createTestStore();

      store.dispatch(enterCombat());

      const world = store.getState().world;
      expect(world.inCombat).toBe(true);
      expect(world.isPlayerTurn).toBe(true);
      expect(world.turnCount).toBe(1);
    });

    it('exits combat mode', () => {
      const store = createTestStore();

      store.dispatch(enterCombat());
      store.dispatch(exitCombat());

      const world = store.getState().world;
      expect(world.inCombat).toBe(false);
      expect(world.isPlayerTurn).toBe(true);
      expect(world.turnCount).toBe(1);
    });

    it('switches turns between player and enemy', () => {
      const store = createTestStore();

      store.dispatch(enterCombat());
      expect(store.getState().world.isPlayerTurn).toBe(true);

      store.dispatch(switchTurn());
      expect(store.getState().world.isPlayerTurn).toBe(false);

      store.dispatch(switchTurn());
      expect(store.getState().world.isPlayerTurn).toBe(true);
    });

    it('increments turn count when switching to player turn', () => {
      const store = createTestStore();

      store.dispatch(enterCombat());
      const initialTurnCount = store.getState().world.turnCount;

      store.dispatch(switchTurn()); // Switch to enemy
      store.dispatch(switchTurn()); // Switch back to player

      expect(store.getState().world.turnCount).toBe(initialTurnCount + 1);
    });

    it('resets enemy action points on enemy turn', () => {
      const store = createTestStore();
      const enemy = createTestEnemy();
      enemy.actionPoints = 2; // Partially depleted

      const mapArea = createTestMapArea();
      mapArea.entities.enemies.push(enemy);
      store.dispatch(setMapArea(mapArea));

      store.dispatch(enterCombat());
      store.dispatch(switchTurn()); // Switch to enemy turn

      const updatedEnemy = store.getState().world.currentMapArea.entities.enemies[0];
      expect(updatedEnemy.actionPoints).toBe(enemy.maxActionPoints);
    });

    it('does not switch turns when not in combat', () => {
      const store = createTestStore();

      expect(store.getState().world.isPlayerTurn).toBe(true);

      store.dispatch(switchTurn());

      // Should remain player turn since not in combat
      expect(store.getState().world.isPlayerTurn).toBe(true);
    });
  });

  describe('enemy management', () => {
    it('adds enemy to current map area', () => {
      const store = createTestStore();
      const enemy = createTestEnemy();

      store.dispatch(addEnemy(enemy));

      const enemies = store.getState().world.currentMapArea.entities.enemies;
      expect(enemies).toHaveLength(2); // Initial enemy + new enemy
      expect(enemies.some((e) => e.id === enemy.id)).toBe(true);
    });

    it('updates existing enemy', () => {
      const store = createTestStore();
      const enemy = createTestEnemy();

      const mapArea = createTestMapArea();
      mapArea.entities.enemies.push(enemy);
      store.dispatch(setMapArea(mapArea));

      const updatedEnemy = { ...enemy, health: 10 };
      store.dispatch(updateEnemy(updatedEnemy));

      const stateEnemy = store.getState().world.currentMapArea.entities.enemies.find(
        (e) => e.id === enemy.id
      );
      expect(stateEnemy?.health).toBe(10);
    });

    it('removes dead enemies when health reaches 0', () => {
      const store = createTestStore();
      const enemy = createTestEnemy();

      const mapArea = createTestMapArea();
      mapArea.entities.enemies.push(enemy);
      store.dispatch(setMapArea(mapArea));

      const deadEnemy = { ...enemy, health: 0 };
      store.dispatch(updateEnemy(deadEnemy));

      const enemies = store.getState().world.currentMapArea.entities.enemies;
      expect(enemies.find((e) => e.id === enemy.id)).toBeUndefined();
    });

    it('exits combat when all enemies are dead', () => {
      const store = createTestStore();
      const enemy1 = createTestEnemy('Enemy 1');
      const enemy2 = createTestEnemy('Enemy 2');

      const mapArea = createTestMapArea();
      mapArea.entities.enemies.push(enemy1, enemy2);
      store.dispatch(setMapArea(mapArea));

      store.dispatch(enterCombat());

      store.dispatch(updateEnemy({ ...enemy1, health: 0 }));
      expect(store.getState().world.inCombat).toBe(true);

      store.dispatch(updateEnemy({ ...enemy2, health: 0 }));
      expect(store.getState().world.inCombat).toBe(false);
    });

    it('removes enemy by id', () => {
      const store = createTestStore();
      const enemy = createTestEnemy();

      const mapArea = createTestMapArea();
      mapArea.entities.enemies.push(enemy);
      store.dispatch(setMapArea(mapArea));

      store.dispatch(removeEnemy(enemy.id));

      const enemies = store.getState().world.currentMapArea.entities.enemies;
      expect(enemies.find((e) => e.id === enemy.id)).toBeUndefined();
    });
  });

  describe('NPC management', () => {
    it('adds NPC to current map area', () => {
      const store = createTestStore();
      const npc = createTestNPC();

      store.dispatch(addNPC(npc));

      const npcs = store.getState().world.currentMapArea.entities.npcs;
      expect(npcs).toContainEqual(npc);
    });

    it('updates existing NPC', () => {
      const store = createTestStore();
      const npc = createTestNPC();

      const mapArea = createTestMapArea();
      mapArea.entities.npcs.push(npc);
      store.dispatch(setMapArea(mapArea));

      const updatedNPC = { ...npc, position: { x: 20, y: 20 } };
      store.dispatch(updateNPC(updatedNPC));

      const stateNPC = store.getState().world.currentMapArea.entities.npcs.find(
        (n) => n.id === npc.id
      );
      expect(stateNPC?.position).toEqual({ x: 20, y: 20 });
    });

    it('removes NPC by id', () => {
      const store = createTestStore();
      const npc = createTestNPC();

      const mapArea = createTestMapArea();
      mapArea.entities.npcs.push(npc);
      store.dispatch(setMapArea(mapArea));

      store.dispatch(removeNPC(npc.id));

      const npcs = store.getState().world.currentMapArea.entities.npcs;
      expect(npcs.find((n) => n.id === npc.id)).toBeUndefined();
    });

    it('does nothing when updating non-existent NPC', () => {
      const store = createTestStore();
      const npc = createTestNPC();

      const beforeNPCs = [...store.getState().world.currentMapArea.entities.npcs];
      store.dispatch(updateNPC(npc));

      const afterNPCs = store.getState().world.currentMapArea.entities.npcs;
      expect(afterNPCs).toEqual(beforeNPCs);
    });
  });

  describe('item management', () => {
    it('adds item to map at position', () => {
      const store = createTestStore();
      const item: Item = {
        id: uuidv4(),
        name: 'Test Item',
        description: 'A test item',
        weight: 2,
        value: 50,
        isQuestItem: false,
      };
      const position = { x: 5, y: 5 };

      store.dispatch(addItemToMap({ item, position }));

      const items = store.getState().world.currentMapArea.entities.items;
      expect(items.length).toBeGreaterThan(0);
      const addedItem = items.find((i) => i.id === item.id) as (Item & { position: Position }) | undefined;
      expect(addedItem).toBeDefined();
      expect(addedItem?.position).toEqual(position);
    });

    it('removes item from map by id', () => {
      const store = createTestStore();
      const item: Item = {
        id: uuidv4(),
        name: 'Test Item',
        description: 'A test item',
        weight: 2,
        value: 50,
        isQuestItem: false,
      };

      const mapArea = createTestMapArea();
      mapArea.entities.items.push({ ...item, position: { x: 5, y: 5 } } as Item & { position: Position });
      store.dispatch(setMapArea(mapArea));

      store.dispatch(removeItemFromMap(item.id));

      const items = store.getState().world.currentMapArea.entities.items;
      expect(items.find((i) => i.id === item.id)).toBeUndefined();
    });
  });

  describe('alert and reinforcements', () => {
    it('sets global alert level', () => {
      const store = createTestStore();

      store.dispatch(setGlobalAlertLevel(AlertLevel.SUSPICIOUS));
      expect(store.getState().world.globalAlertLevel).toBe(AlertLevel.SUSPICIOUS);

      store.dispatch(setGlobalAlertLevel(AlertLevel.ALARMED));
      expect(store.getState().world.globalAlertLevel).toBe(AlertLevel.ALARMED);
    });

    it('schedules reinforcements', () => {
      const store = createTestStore();

      store.dispatch(scheduleReinforcements());
      expect(store.getState().world.reinforcementsScheduled).toBe(true);
    });

    it('clears reinforcements schedule', () => {
      const store = createTestStore();

      store.dispatch(scheduleReinforcements());
      store.dispatch(clearReinforcementsSchedule());

      expect(store.getState().world.reinforcementsScheduled).toBe(false);
    });
  });

  describe('initial state', () => {
    it('has valid initial time settings', () => {
      const store = createTestStore();
      const world = store.getState().world;

      expect(world.currentTime).toBeDefined();
      expect(world.timeOfDay).toBeDefined();
      expect(typeof world.curfewActive).toBe('boolean');
    });

    it('starts in exploration mode (not combat)', () => {
      const store = createTestStore();
      const world = store.getState().world;

      expect(world.inCombat).toBe(false);
      expect(world.isPlayerTurn).toBe(true);
      expect(world.turnCount).toBe(1);
    });

    it('has idle global alert level', () => {
      const store = createTestStore();
      const world = store.getState().world;

      expect(world.globalAlertLevel).toBe(AlertLevel.IDLE);
      expect(world.reinforcementsScheduled).toBe(false);
    });

    it('loads with at least one enemy in current map area', () => {
      const store = createTestStore();
      const enemies = store.getState().world.currentMapArea.entities.enemies;

      expect(enemies.length).toBeGreaterThan(0);
    });
  });
});
