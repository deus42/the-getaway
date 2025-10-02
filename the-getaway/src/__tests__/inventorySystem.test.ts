import {
  canAddItemToInventory,
  addItemToInventory,
  removeItemFromInventory,
  findItemInInventory,
  useConsumableItem,
  sortInventoryByCategory,
  createWeapon,
  createArmor,
  createConsumable,
  createStarterItems,
  equipWeapon,
  equipArmor,
  unequipWeapon,
  unequipArmor,
} from '../game/inventory/inventorySystem';
import { Player, Item } from '../game/interfaces/types';
import { DEFAULT_PLAYER, DEFAULT_SKILLS } from '../game/interfaces/player';
import { v4 as uuidv4 } from 'uuid';

const createTestPlayer = (): Player => ({
  ...DEFAULT_PLAYER,
  id: uuidv4(),
  name: 'Test Player',
  position: { x: 0, y: 0 },
  health: 100,
  maxHealth: 100,
  actionPoints: 10,
  maxActionPoints: 10,
  skills: { ...DEFAULT_SKILLS },
  level: 1,
  experience: 0,
  credits: 0,
  skillPoints: 0,
  attributePoints: 0,
  inventory: {
    items: [],
    maxWeight: 50,
    currentWeight: 0,
  },
  equipped: {
    weapon: undefined,
    armor: undefined,
    accessory: undefined,
  },
  perks: [],
  factionReputation: {
    resistance: 0,
    corpsec: 0,
    scavengers: 0,
  },
  backgroundId: undefined,
  appearancePreset: undefined,
});

describe('inventorySystem', () => {
  describe('canAddItemToInventory', () => {
    it('returns true if item weight is within capacity', () => {
      const player = createTestPlayer();
      const item: Item = {
        id: uuidv4(),
        name: 'Light Item',
        description: 'A light item',
        weight: 5,
        value: 10,
        isQuestItem: false,
      };

      expect(canAddItemToInventory(player, item)).toBe(true);
    });

    it('returns false if item weight exceeds capacity', () => {
      const player = createTestPlayer();
      const item: Item = {
        id: uuidv4(),
        name: 'Heavy Item',
        description: 'A very heavy item',
        weight: 100,
        value: 10,
        isQuestItem: false,
      };

      expect(canAddItemToInventory(player, item)).toBe(false);
    });

    it('accounts for current inventory weight', () => {
      const player = createTestPlayer();
      player.inventory.currentWeight = 45;

      const item: Item = {
        id: uuidv4(),
        name: 'Item',
        description: 'An item',
        weight: 10,
        value: 10,
        isQuestItem: false,
      };

      expect(canAddItemToInventory(player, item)).toBe(false);
    });
  });

  describe('addItemToInventory', () => {
    it('adds item to inventory and updates weight', () => {
      const player = createTestPlayer();
      const item: Item = {
        id: uuidv4(),
        name: 'Test Item',
        description: 'A test item',
        weight: 5,
        value: 10,
        isQuestItem: false,
      };

      const updatedPlayer = addItemToInventory(player, item);

      expect(updatedPlayer.inventory.items).toContain(item);
      expect(updatedPlayer.inventory.currentWeight).toBe(5);
    });

    it('does not add item if weight capacity exceeded', () => {
      const player = createTestPlayer();
      const heavyItem: Item = {
        id: uuidv4(),
        name: 'Heavy Item',
        description: 'Too heavy',
        weight: 100,
        value: 10,
        isQuestItem: false,
      };

      const updatedPlayer = addItemToInventory(player, heavyItem);

      expect(updatedPlayer.inventory.items).not.toContain(heavyItem);
      expect(updatedPlayer.inventory.currentWeight).toBe(0);
    });
  });

  describe('removeItemFromInventory', () => {
    it('removes item and updates weight', () => {
      const player = createTestPlayer();
      const item: Item = {
        id: uuidv4(),
        name: 'Test Item',
        description: 'A test item',
        weight: 5,
        value: 10,
        isQuestItem: false,
      };

      let updatedPlayer = addItemToInventory(player, item);
      updatedPlayer = removeItemFromInventory(updatedPlayer, item.id);

      expect(updatedPlayer.inventory.items).not.toContain(item);
      expect(updatedPlayer.inventory.currentWeight).toBe(0);
    });

    it('does nothing if item not found', () => {
      const player = createTestPlayer();
      const updatedPlayer = removeItemFromInventory(player, 'nonexistent-id');

      expect(updatedPlayer).toEqual(player);
    });
  });

  describe('findItemInInventory', () => {
    it('finds item by id', () => {
      const player = createTestPlayer();
      const item: Item = {
        id: uuidv4(),
        name: 'Test Item',
        description: 'A test item',
        weight: 5,
        value: 10,
        isQuestItem: false,
      };

      const updatedPlayer = addItemToInventory(player, item);
      const foundItem = findItemInInventory(updatedPlayer, item.id);

      expect(foundItem).toEqual(item);
    });

    it('returns undefined if item not found', () => {
      const player = createTestPlayer();
      const foundItem = findItemInInventory(player, 'nonexistent-id');

      expect(foundItem).toBeUndefined();
    });
  });

  describe('useConsumableItem', () => {
    it('applies health effect and removes item', () => {
      const player = createTestPlayer();
      player.health = 50;

      const healthPack = createConsumable('Medkit', 'health', 30);
      let updatedPlayer = addItemToInventory(player, healthPack);
      updatedPlayer = useConsumableItem(updatedPlayer, healthPack.id);

      expect(updatedPlayer.health).toBe(80);
      expect(updatedPlayer.inventory.items).not.toContain(healthPack);
    });

    it('caps health at maxHealth', () => {
      const player = createTestPlayer();
      player.health = 90;
      player.maxHealth = 100;

      const healthPack = createConsumable('Medkit', 'health', 30);
      let updatedPlayer = addItemToInventory(player, healthPack);
      updatedPlayer = useConsumableItem(updatedPlayer, healthPack.id);

      expect(updatedPlayer.health).toBe(100);
    });

    it('applies action points effect and removes item', () => {
      const player = createTestPlayer();
      player.actionPoints = 5;
      player.maxActionPoints = 10;

      const stimpack = createConsumable('Stimpack', 'actionPoints', 3);
      let updatedPlayer = addItemToInventory(player, stimpack);
      updatedPlayer = useConsumableItem(updatedPlayer, stimpack.id);

      expect(updatedPlayer.actionPoints).toBe(8);
      expect(updatedPlayer.inventory.items).not.toContain(stimpack);
    });

    it('caps action points at maxActionPoints', () => {
      const player = createTestPlayer();
      player.actionPoints = 9;
      player.maxActionPoints = 10;

      const stimpack = createConsumable('Stimpack', 'actionPoints', 3);
      let updatedPlayer = addItemToInventory(player, stimpack);
      updatedPlayer = useConsumableItem(updatedPlayer, stimpack.id);

      expect(updatedPlayer.actionPoints).toBe(10);
    });

    it('applies stat effect and removes item', () => {
      const player = createTestPlayer();
      const initialStrength = player.skills.strength;

      const strengthBoost = createConsumable('Strength Serum', 'stat', 2, 'strength');
      let updatedPlayer = addItemToInventory(player, strengthBoost);
      updatedPlayer = useConsumableItem(updatedPlayer, strengthBoost.id);

      expect(updatedPlayer.skills.strength).toBe(initialStrength + 2);
      expect(updatedPlayer.inventory.items).not.toContain(strengthBoost);
    });

    it('does nothing if item not found', () => {
      const player = createTestPlayer();
      const updatedPlayer = useConsumableItem(player, 'nonexistent-id');

      expect(updatedPlayer).toEqual(player);
    });

    it('does nothing if item is not a consumable', () => {
      const player = createTestPlayer();
      const weapon = createWeapon('Pistol', 10, 5, 3, 2);

      let updatedPlayer = addItemToInventory(player, weapon);
      const beforeHealth = updatedPlayer.health;
      updatedPlayer = useConsumableItem(updatedPlayer, weapon.id);

      expect(updatedPlayer.health).toBe(beforeHealth);
      expect(updatedPlayer.inventory.items).toContain(weapon);
    });
  });

  describe('sortInventoryByCategory', () => {
    it('sorts items by category: quest, weapon, armor, consumable, other', () => {
      const player = createTestPlayer();

      const questItem: Item = {
        id: uuidv4(),
        name: 'Quest Item',
        description: 'Important',
        weight: 1,
        value: 100,
        isQuestItem: true,
      };

      const weapon = createWeapon('Pistol', 10, 5, 3, 2);
      const armor = createArmor('Vest', 5, 3);
      const consumable = createConsumable('Medkit', 'health', 30);
      const regularItem: Item = {
        id: uuidv4(),
        name: 'Scrap',
        description: 'Regular item',
        weight: 1,
        value: 5,
        isQuestItem: false,
      };

      let updatedPlayer = player;
      // Add in reverse order
      updatedPlayer = addItemToInventory(updatedPlayer, regularItem);
      updatedPlayer = addItemToInventory(updatedPlayer, consumable);
      updatedPlayer = addItemToInventory(updatedPlayer, armor);
      updatedPlayer = addItemToInventory(updatedPlayer, weapon);
      updatedPlayer = addItemToInventory(updatedPlayer, questItem);

      updatedPlayer = sortInventoryByCategory(updatedPlayer);

      const items = updatedPlayer.inventory.items;
      expect(items[0]).toEqual(questItem); // Quest items first
      expect(items[1]).toEqual(weapon); // Weapons second
      expect(items[2]).toEqual(armor); // Armor third
      expect(items[3]).toEqual(consumable); // Consumables fourth
      expect(items[4]).toEqual(regularItem); // Regular items last
    });
  });

  describe('createWeapon', () => {
    it('creates a weapon with specified properties', () => {
      const weapon = createWeapon('Test Pistol', 15, 10, 3, 2);

      expect(weapon.name).toBe('Test Pistol');
      expect(weapon.damage).toBe(15);
      expect(weapon.range).toBe(10);
      expect(weapon.apCost).toBe(3);
      expect(weapon.weight).toBe(2);
      expect(weapon.value).toBe(150); // damage * 10
      expect(weapon.slot).toBe('weapon');
      expect(weapon.skillType).toBe('smallGuns');
    });

    it('creates weapon with stat modifiers', () => {
      const weapon = createWeapon('Special Pistol', 15, 10, 3, 2, {
        perceptionBonus: 2,
        agilityBonus: 1,
      });

      expect(weapon.statModifiers).toEqual({ perceptionBonus: 2, agilityBonus: 1 });
    });

    it('respects explicit skill type overrides', () => {
      const weapon = createWeapon('Laser Rifle', 20, 9, 4, 4, undefined, 'energyWeapons');
      expect(weapon.skillType).toBe('energyWeapons');
    });
  });

  describe('createArmor', () => {
    it('creates armor with specified properties', () => {
      const armor = createArmor('Test Vest', 10, 5);

      expect(armor.name).toBe('Test Vest');
      expect(armor.protection).toBe(10);
      expect(armor.weight).toBe(5);
      expect(armor.value).toBe(150); // protection * 15
      expect(armor.slot).toBe('armor');
    });

    it('creates armor with stat modifiers', () => {
      const armor = createArmor('Heavy Armor', 20, 10, {
        enduranceBonus: 2,
        strengthBonus: -1,
      });

      expect(armor.statModifiers).toEqual({ enduranceBonus: 2, strengthBonus: -1 });
    });
  });

  describe('createConsumable', () => {
    it('creates health consumable', () => {
      const medkit = createConsumable('Medkit', 'health', 30);

      expect(medkit.name).toBe('Medkit');
      expect(medkit.effect.type).toBe('health');
      expect(medkit.effect.value).toBe(30);
      expect(medkit.description).toContain('30 health');
    });

    it('creates action points consumable', () => {
      const stimpack = createConsumable('Stimpack', 'actionPoints', 3);

      expect(stimpack.name).toBe('Stimpack');
      expect(stimpack.effect.type).toBe('actionPoints');
      expect(stimpack.effect.value).toBe(3);
      expect(stimpack.description).toContain('3 action points');
    });

    it('creates stat consumable with duration', () => {
      const booster = createConsumable('Strength Boost', 'stat', 2, 'strength');

      expect(booster.name).toBe('Strength Boost');
      expect(booster.effect.type).toBe('stat');
      expect(booster.effect.value).toBe(2);
      expect(booster.effect.statAffected).toBe('strength');
      expect(booster.effect.duration).toBe(3);
    });
  });

  describe('createStarterItems', () => {
    it('creates an array of starter items', () => {
      const items = createStarterItems();

      expect(items).toHaveLength(3);
      expect(items[0]).toHaveProperty('damage'); // Weapon
      expect(items[1]).toHaveProperty('effect'); // Consumable
      expect(items[2]).toHaveProperty('effect'); // Consumable
    });
  });

  describe('equipWeapon', () => {
    it('equips weapon from inventory', () => {
      const player = createTestPlayer();
      const weapon = createWeapon('Pistol', 10, 5, 3, 2);

      let updatedPlayer = addItemToInventory(player, weapon);
      updatedPlayer = equipWeapon(updatedPlayer, weapon.id);

      expect(updatedPlayer.equipped.weapon).toEqual(weapon);
      expect(updatedPlayer.inventory.items).not.toContain(weapon);
    });

    it('unequips current weapon when equipping new one', () => {
      const player = createTestPlayer();
      const weapon1 = createWeapon('Pistol', 10, 5, 3, 2);
      const weapon2 = createWeapon('Rifle', 20, 10, 5, 4);

      let updatedPlayer = addItemToInventory(player, weapon1);
      updatedPlayer = addItemToInventory(updatedPlayer, weapon2);

      updatedPlayer = equipWeapon(updatedPlayer, weapon1.id);
      updatedPlayer = equipWeapon(updatedPlayer, weapon2.id);

      expect(updatedPlayer.equipped.weapon).toEqual(weapon2);
      expect(updatedPlayer.inventory.items).toContain(weapon1);
      expect(updatedPlayer.inventory.items).not.toContain(weapon2);
    });

    it('does nothing if item is not a weapon', () => {
      const player = createTestPlayer();
      const armor = createArmor('Vest', 5, 3);

      let updatedPlayer = addItemToInventory(player, armor);
      updatedPlayer = equipWeapon(updatedPlayer, armor.id);

      expect(updatedPlayer.equipped.weapon).toBeUndefined();
      expect(updatedPlayer.inventory.items).toContain(armor);
    });
  });

  describe('equipArmor', () => {
    it('equips armor from inventory', () => {
      const player = createTestPlayer();
      const armor = createArmor('Vest', 10, 5);

      let updatedPlayer = addItemToInventory(player, armor);
      updatedPlayer = equipArmor(updatedPlayer, armor.id);

      expect(updatedPlayer.equipped.armor).toEqual(armor);
      expect(updatedPlayer.inventory.items).not.toContain(armor);
    });

    it('unequips current armor when equipping new one', () => {
      const player = createTestPlayer();
      const armor1 = createArmor('Light Vest', 5, 3);
      const armor2 = createArmor('Heavy Vest', 15, 8);

      let updatedPlayer = addItemToInventory(player, armor1);
      updatedPlayer = addItemToInventory(updatedPlayer, armor2);

      updatedPlayer = equipArmor(updatedPlayer, armor1.id);
      updatedPlayer = equipArmor(updatedPlayer, armor2.id);

      expect(updatedPlayer.equipped.armor).toEqual(armor2);
      expect(updatedPlayer.inventory.items).toContain(armor1);
      expect(updatedPlayer.inventory.items).not.toContain(armor2);
    });

    it('does nothing if item is not armor', () => {
      const player = createTestPlayer();
      const weapon = createWeapon('Pistol', 10, 5, 3, 2);

      let updatedPlayer = addItemToInventory(player, weapon);
      updatedPlayer = equipArmor(updatedPlayer, weapon.id);

      expect(updatedPlayer.equipped.armor).toBeUndefined();
      expect(updatedPlayer.inventory.items).toContain(weapon);
    });
  });

  describe('unequipWeapon', () => {
    it('unequips weapon back to inventory', () => {
      const player = createTestPlayer();
      const weapon = createWeapon('Pistol', 10, 5, 3, 2);

      let updatedPlayer = addItemToInventory(player, weapon);
      updatedPlayer = equipWeapon(updatedPlayer, weapon.id);
      updatedPlayer = unequipWeapon(updatedPlayer);

      expect(updatedPlayer.equipped.weapon).toBeUndefined();
      expect(updatedPlayer.inventory.items).toContain(weapon);
    });

    it('does nothing if no weapon equipped', () => {
      const player = createTestPlayer();
      const updatedPlayer = unequipWeapon(player);

      expect(updatedPlayer).toEqual(player);
    });
  });

  describe('unequipArmor', () => {
    it('unequips armor back to inventory', () => {
      const player = createTestPlayer();
      const armor = createArmor('Vest', 10, 5);

      let updatedPlayer = addItemToInventory(player, armor);
      updatedPlayer = equipArmor(updatedPlayer, armor.id);
      updatedPlayer = unequipArmor(updatedPlayer);

      expect(updatedPlayer.equipped.armor).toBeUndefined();
      expect(updatedPlayer.inventory.items).toContain(armor);
    });

    it('does nothing if no armor equipped', () => {
      const player = createTestPlayer();
      const updatedPlayer = unequipArmor(player);

      expect(updatedPlayer).toEqual(player);
    });
  });
});
