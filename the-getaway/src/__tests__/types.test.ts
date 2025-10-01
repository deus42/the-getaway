import { createBasicMapArea, isPositionWalkable } from '../game/world/grid';
import { DEFAULT_PLAYER } from '../game/interfaces/player';
import { executeAttack, calculateHitChance, setRandomGenerator } from '../game/combat/combatSystem';
import { canAddItemToInventory, createWeapon } from '../game/inventory/inventorySystem';
import { createQuest, areAllObjectivesCompleted } from '../game/quests/questSystem';
import { TileType } from '../game/interfaces/types';

describe('Game Types and Basic Functionality', () => {
  afterEach(() => {
    setRandomGenerator();
  });

  // Player tests
  describe('Player', () => {
    test('DEFAULT_PLAYER should have correct initial values', () => {
      expect(DEFAULT_PLAYER.health).toBe(100);
      expect(DEFAULT_PLAYER.maxHealth).toBe(100);
      expect(DEFAULT_PLAYER.actionPoints).toBe(6);
      expect(DEFAULT_PLAYER.maxActionPoints).toBe(6);
      expect(DEFAULT_PLAYER.level).toBe(1);
      expect(DEFAULT_PLAYER.experience).toBe(0);
      expect(DEFAULT_PLAYER.skills.strength).toBe(5);
      expect(DEFAULT_PLAYER.inventory.items.length).toBe(0);
      expect(DEFAULT_PLAYER.inventory.maxWeight).toBe(50);
    });
  });
  
  // Combat system tests
  describe('Combat System', () => {
    test('calculateHitChance should return lower value when target has cover', () => {
      const attacker = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
      };

      const target = {
        ...DEFAULT_PLAYER,
        id: 'target-player',
        position: { x: 1, y: 1 },
      };

      const normalHitChance = calculateHitChance(attacker, target, false);
      const coverHitChance = calculateHitChance(attacker, target, true);

      expect(coverHitChance).toBeLessThan(normalHitChance);
    });
    
    test('executeAttack should reduce target health on hit', () => {
      const attacker = {
        ...DEFAULT_PLAYER,
        position: { x: 0, y: 0 },
        actionPoints: 6
      };
      
      const target = {
        ...DEFAULT_PLAYER,
        id: 'target-1',
        position: { x: 1, y: 0 },
        health: 100
      };
      
      setRandomGenerator(() => 0.1);
      
      const result = executeAttack(attacker, target, false);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.newTarget.health).toBeLessThan(target.health);
      expect(result.newAttacker.actionPoints).toBeLessThan(attacker.actionPoints);
    });
  });
  
  // Grid system tests
  describe('Grid System', () => {
    test('createBasicMapArea should create a grid with walls on the edges', () => {
      const mapArea = createBasicMapArea('Test Area', 5, 5);
      
      expect(mapArea.width).toBe(5);
      expect(mapArea.height).toBe(5);
      
      // Check if edges are walls
      for (let x = 0; x < 5; x++) {
        expect(mapArea.tiles[0][x].type).toBe(TileType.WALL);
        expect(mapArea.tiles[0][x].isWalkable).toBe(false);
        expect(mapArea.tiles[4][x].type).toBe(TileType.WALL);
        expect(mapArea.tiles[4][x].isWalkable).toBe(false);
      }
      
      for (let y = 0; y < 5; y++) {
        expect(mapArea.tiles[y][0].type).toBe(TileType.WALL);
        expect(mapArea.tiles[y][0].isWalkable).toBe(false);
        expect(mapArea.tiles[y][4].type).toBe(TileType.WALL);
        expect(mapArea.tiles[y][4].isWalkable).toBe(false);
      }
      
      // Check if center is floor
      expect(mapArea.tiles[2][2].type).toBe(TileType.FLOOR);
      expect(mapArea.tiles[2][2].isWalkable).toBe(true);
    });
    
    test('isPositionWalkable should return correct values', () => {
      const mapArea = createBasicMapArea('Test Area', 5, 5);
      
      // Edge (wall) should not be walkable
      expect(isPositionWalkable({ x: 0, y: 0 }, mapArea)).toBe(false);
      
      // Inside position should be walkable
      expect(isPositionWalkable({ x: 2, y: 2 }, mapArea)).toBe(true);
      
      // Out of bounds should not be walkable
      expect(isPositionWalkable({ x: 10, y: 10 }, mapArea)).toBe(false);
    });
  });
  
  // Inventory system tests
  describe('Inventory System', () => {
    test('canAddItemToInventory should check weight limits', () => {
      const player = {
        ...DEFAULT_PLAYER,
        inventory: {
          ...DEFAULT_PLAYER.inventory,
          currentWeight: 40,
        },
      };
      
      const lightItem = createWeapon('Light Weapon', 5, 2, 2, 5);
      const heavyItem = createWeapon('Heavy Weapon', 10, 1, 3, 20);
      
      expect(canAddItemToInventory(player, lightItem)).toBe(true);
      expect(canAddItemToInventory(player, heavyItem)).toBe(false);
    });
  });
  
  // Quest system tests
  describe('Quest System', () => {
    test('areAllObjectivesCompleted should check all objectives', () => {
      const quest = createQuest(
        'Test Quest',
        'A test quest',
        [
          {
            description: 'First objective',
            type: 'talk',
            target: 'npc-1'
          },
          {
            description: 'Second objective',
            type: 'collect',
            target: 'item-1',
            count: 3
          }
        ],
        [
          {
            type: 'experience',
            amount: 100
          }
        ]
      );
      
      expect(areAllObjectivesCompleted(quest)).toBe(false);
      
      // Update objectives to completed
      const updatedQuest = {
        ...quest,
        objectives: quest.objectives.map(obj => ({
          ...obj,
          isCompleted: true,
          currentCount: obj.type === 'collect' ? 3 : undefined
        }))
      };
      
      expect(areAllObjectivesCompleted(updatedQuest)).toBe(true);
    });
  });
}); 
