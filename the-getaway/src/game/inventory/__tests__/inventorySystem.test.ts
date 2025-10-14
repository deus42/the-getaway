import { describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import {
  addItemToInventory,
  canAddItemToInventory,
  createArmor,
  createConsumable,
  createWeapon,
  equipArmor,
  equipWeapon,
  removeItemFromInventory,
  sortInventoryByCategory,
  unequipArmor,
  unequipWeapon,
  useConsumableItem,
} from '../inventorySystem';
import { DEFAULT_PLAYER, createDefaultPersonalityProfile } from '../../interfaces/player';
import { Consumable, Item, Player } from '../../interfaces/types';

const clonePlayer = (overrides: Partial<Player> = {}): Player => {
  const base = JSON.parse(JSON.stringify(DEFAULT_PLAYER)) as Player;
  return {
    ...base,
    id: uuidv4(),
    personality: createDefaultPersonalityProfile(),
    inventory: {
      ...base.inventory,
      items: [],
      currentWeight: 0,
    },
    equipped: {
      ...base.equipped,
      weapon: undefined,
      armor: undefined,
    },
    ...overrides,
  };
};

const createItem = (name: string, weight: number): Item => ({
  id: uuidv4(),
  name,
  description: name,
  weight,
  value: 10,
  isQuestItem: false,
});

describe('inventorySystem', () => {
  describe('capacity checks', () => {
    it('prevents adding items that would exceed max weight', () => {
      const player = clonePlayer({
        inventory: { ...DEFAULT_PLAYER.inventory, items: [], currentWeight: 49, maxWeight: 50, hotbar: [null, null, null, null, null] },
      });
      const heavyItem = createItem('Heavy Crate', 5);

      expect(canAddItemToInventory(player, heavyItem)).toBe(false);
      const updated = addItemToInventory(player, heavyItem);
      expect(updated.inventory.items).toHaveLength(0);
      expect(updated.inventory.currentWeight).toBe(player.inventory.currentWeight);
    });

    it('updates current weight when items are added and removed', () => {
      const player = clonePlayer();
      const item = createItem('Spare Parts', 4);

      const withItem = addItemToInventory(player, item);
      expect(withItem.inventory.items).toContain(item);
      expect(withItem.inventory.currentWeight).toBe(4);

      const withoutItem = removeItemFromInventory(withItem, item.id);
      expect(withoutItem.inventory.items).toHaveLength(0);
      expect(withoutItem.inventory.currentWeight).toBe(0);
    });
  });

  describe('equipment management', () => {
    it('equipping a weapon removes it from inventory and respects swaps', () => {
      const player = clonePlayer();
      const pistol = createWeapon('Pistol', 8, 4, 3, 2);
      const smg = createWeapon('SMG', 10, 5, 4, 3);

      let updated = addItemToInventory(player, pistol);
      updated = addItemToInventory(updated, smg);

      updated = equipWeapon(updated, pistol.id);
      expect(updated.equipped.weapon?.id).toBe(pistol.id);
      expect(updated.inventory.items.some((item) => item.id === pistol.id)).toBe(false);

      updated = equipWeapon(updated, smg.id);
      expect(updated.equipped.weapon?.id).toBe(smg.id);
      expect(updated.inventory.items.some((item) => item.id === pistol.id)).toBe(true);
    });

    it('unequipping armor returns it to the inventory', () => {
      const player = clonePlayer();
      const armor = createArmor('Kevlar Vest', 6, 8);
      let updated = addItemToInventory(player, armor);

      updated = equipArmor(updated, armor.id);
      expect(updated.equipped.armor?.id).toBe(armor.id);
      expect(updated.inventory.items).toHaveLength(0);

      updated = unequipArmor(updated);
      expect(updated.equipped.armor).toBeUndefined();
      expect(updated.inventory.items.some((item) => item.id === armor.id)).toBe(true);
    });

    it('unequipping a weapon respects inventory capacity', () => {
      const player = clonePlayer();
      const axe = createWeapon('Axe', 14, 1, 4, 9, undefined, 'meleeCombat');

      let updated = addItemToInventory(player, axe);
      updated = equipWeapon(updated, axe.id);

      expect(updated.equipped.weapon?.id).toBe(axe.id);
      expect(updated.inventory.items).toHaveLength(0);

      const afterUnequip = unequipWeapon(updated);
      expect(afterUnequip.equipped.weapon).toBeUndefined();
      expect(afterUnequip.inventory.items.some((item) => item.id === axe.id)).toBe(true);
      expect(afterUnequip.inventory.currentWeight).toBe(axe.weight);
    });
  });

  describe('consumables', () => {
    it('applies consumable effects without exceeding max health or action points', () => {
      const player = clonePlayer({ health: 60, maxHealth: 80, actionPoints: 4, maxActionPoints: 8 });
      const medkit = createConsumable('Medkit', 'health', 30, { stackable: false, weight: 1 });
      const stim = createConsumable('Stimpack', 'actionPoints', 5, { stackable: false, weight: 0.2 });

      let updated = addItemToInventory(player, medkit);
      updated = useConsumableItem(updated, medkit.id);
      expect(updated.health).toBe(80);
      expect(updated.inventory.items).toHaveLength(0);

      updated = addItemToInventory(updated, stim);
      updated = useConsumableItem(updated, stim.id);
      expect(updated.actionPoints).toBe(8);
    });

    it('supports stackable consumables via quantity metadata', () => {
      const player = clonePlayer();
      const batteries = createConsumable('Battery Pack', 'stat', 1, {
        stackable: true,
        maxStack: 10,
        quantity: 3,
        statAffected: 'intelligence',
      });

      const updated = addItemToInventory(player, batteries);
      const storedConsumable = updated.inventory.items[0] as Consumable;
      expect(storedConsumable.quantity).toBe(3);
      expect(storedConsumable.maxStack).toBe(10);
    });
  });

  describe('sorting', () => {
    it('sorts quest items, weapons, armor, consumables, and other items in priority order', () => {
      const player = clonePlayer();

      const questItem: Item = {
        id: uuidv4(),
        name: 'Encrypted Chip',
        description: 'Story MacGuffin',
        weight: 1,
        value: 0,
        isQuestItem: true,
      };

      const pistol = createWeapon('Pistol', 8, 4, 3, 2);
      const armor = createArmor('Jacket', 3, 4);
      const medkit = createConsumable('Medkit', 'health', 25, { stackable: false });
      const scrap = createItem('Scrap', 2);

      let updated = player;
      [scrap, medkit, armor, pistol, questItem].forEach((item) => {
        updated = addItemToInventory(updated, item);
      });

      updated = sortInventoryByCategory(updated);
      const orderedNames = updated.inventory.items.map((item) => item.name);

      expect(orderedNames).toEqual(['Encrypted Chip', pistol.name, armor.name, medkit.name, scrap.name]);
    });
  });
});
