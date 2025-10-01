import { configureStore } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import playerReducer, {
  initializeCharacter,
  movePlayer,
  updateHealth,
  setHealth,
  updateActionPoints,
  resetActionPoints,
  addExperience,
  addCredits,
  levelUp,
  updateSkill,
  setSkill,
  addItem,
  removeItem,
  resetPlayer,
  equipWeapon,
  equipArmor,
  unequipWeapon,
  unequipArmor,
  spendSkillPoints,
  spendAttributePoint,
  PlayerState,
} from '../store/playerSlice';
import { Item, Weapon, Armor } from '../game/interfaces/types';
import { DEFAULT_SKILLS } from '../game/interfaces/player';

const createTestStore = (preloadedState?: { player: PlayerState }) => {
  return configureStore({
    reducer: {
      player: playerReducer,
    },
    preloadedState,
  });
};

describe('playerSlice', () => {
  describe('initializeCharacter', () => {
    it('initializes character with name, skills, and background', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Alex Ghost',
          skills: { ...DEFAULT_SKILLS, intelligence: 8 },
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const player = store.getState().player.data;
      expect(player.name).toBe('Alex Ghost');
      expect(player.skills.intelligence).toBe(8);
      expect(player.backgroundId).toBe('corpsec_defector');
      expect(player.appearancePreset).toBe('preset_1');
    });

    it('clamps skill values between 1 and 10', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: { ...DEFAULT_SKILLS, strength: 15, agility: -2 },
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const player = store.getState().player.data;
      expect(player.skills.strength).toBe(10);
      expect(player.skills.agility).toBe(1);
    });

    it('calculates derived stats from skills', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: { ...DEFAULT_SKILLS, endurance: 8, agility: 7 },
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const player = store.getState().player.data;
      expect(player.maxHealth).toBeGreaterThan(0);
      expect(player.health).toBe(player.maxHealth);
      expect(player.maxActionPoints).toBeGreaterThan(0);
      expect(player.actionPoints).toBe(player.maxActionPoints);
    });

    it('applies background perks and equipment', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const player = store.getState().player.data;
      expect(player.perks.length).toBeGreaterThan(0);
    });
  });

  describe('movement and position', () => {
    it('updates player position', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(movePlayer({ x: 10, y: 15 }));

      const player = store.getState().player.data;
      expect(player.position.x).toBe(10);
      expect(player.position.y).toBe(15);
    });
  });

  describe('health management', () => {
    it('updates health within bounds', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const initialHealth = store.getState().player.data.health;

      store.dispatch(updateHealth(-20));
      expect(store.getState().player.data.health).toBe(initialHealth - 20);

      store.dispatch(updateHealth(50));
      expect(store.getState().player.data.health).toBeLessThanOrEqual(
        store.getState().player.data.maxHealth
      );
    });

    it('prevents health from going below 0', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(updateHealth(-9999));
      expect(store.getState().player.data.health).toBe(0);
    });

    it('sets health directly', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(setHealth(50));
      expect(store.getState().player.data.health).toBe(50);
    });
  });

  describe('action points management', () => {
    it('updates action points within bounds', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const initialAP = store.getState().player.data.actionPoints;

      store.dispatch(updateActionPoints(-2));
      expect(store.getState().player.data.actionPoints).toBe(initialAP - 2);
    });

    it('resets action points to maximum', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(updateActionPoints(-5));
      store.dispatch(resetActionPoints());

      const player = store.getState().player.data;
      expect(player.actionPoints).toBe(player.maxActionPoints);
    });
  });

  describe('experience and leveling', () => {
    it('adds experience points', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addExperience(50));
      expect(store.getState().player.data.experience).toBe(50);
    });

    it('processes level-ups automatically when adding XP', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const initialLevel = store.getState().player.data.level;

      // Add enough XP to level up
      store.dispatch(addExperience(500));

      const player = store.getState().player.data;
      expect(player.level).toBeGreaterThan(initialLevel);
    });

    it('awards skill points on level up', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: { ...DEFAULT_SKILLS, intelligence: 7 },
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addExperience(500));

      const player = store.getState().player.data;
      expect(player.skillPoints).toBeGreaterThan(0);
    });

    it('levelUp increases level and stats', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const beforeLevel = store.getState().player.data.level;
      const beforeMaxHP = store.getState().player.data.maxHealth;

      store.dispatch(levelUp());

      const player = store.getState().player.data;
      expect(player.level).toBe(beforeLevel + 1);
      expect(player.maxHealth).toBe(beforeMaxHP + 10);
      expect(player.health).toBe(player.maxHealth);
    });
  });

  describe('credits management', () => {
    it('adds credits', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addCredits(100));
      expect(store.getState().player.data.credits).toBe(100);

      store.dispatch(addCredits(50));
      expect(store.getState().player.data.credits).toBe(150);
    });

    it('prevents negative credits', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addCredits(-500));
      expect(store.getState().player.data.credits).toBe(0);
    });
  });

  describe('skill management', () => {
    it('updates skill values', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(updateSkill({ skill: 'strength', amount: 2 }));
      expect(store.getState().player.data.skills.strength).toBe(7);
    });

    it('clamps skills between 1 and 10', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(updateSkill({ skill: 'strength', amount: 20 }));
      expect(store.getState().player.data.skills.strength).toBe(10);

      store.dispatch(updateSkill({ skill: 'agility', amount: -20 }));
      expect(store.getState().player.data.skills.agility).toBe(1);
    });

    it('recalculates derived stats when skills change', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const beforeMaxHP = store.getState().player.data.maxHealth;

      store.dispatch(updateSkill({ skill: 'endurance', amount: 3 }));

      const afterMaxHP = store.getState().player.data.maxHealth;
      expect(afterMaxHP).toBeGreaterThan(beforeMaxHP);
    });

    it('setSkill directly sets a skill value', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(setSkill({ skill: 'intelligence', value: 9 }));
      expect(store.getState().player.data.skills.intelligence).toBe(9);
    });
  });

  describe('inventory management', () => {
    it('adds item to inventory', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const item: Item = {
        id: uuidv4(),
        name: 'Test Item',
        description: 'A test item',
        weight: 2,
        value: 50,
        isQuestItem: false,
      };

      const beforeWeight = store.getState().player.data.inventory.currentWeight;
      store.dispatch(addItem(item));

      const player = store.getState().player.data;
      expect(player.inventory.items).toContainEqual(item);
      expect(player.inventory.currentWeight).toBe(beforeWeight + 2);
    });

    it('prevents adding items that exceed max weight', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const heavyItem: Item = {
        id: uuidv4(),
        name: 'Heavy Item',
        description: 'Too heavy',
        weight: 9999,
        value: 50,
        isQuestItem: false,
      };

      const beforeCount = store.getState().player.data.inventory.items.length;
      store.dispatch(addItem(heavyItem));

      const afterCount = store.getState().player.data.inventory.items.length;
      expect(afterCount).toBe(beforeCount);
    });

    it('removes item from inventory', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const item: Item = {
        id: uuidv4(),
        name: 'Test Item',
        description: 'A test item',
        weight: 2,
        value: 50,
        isQuestItem: false,
      };

      store.dispatch(addItem(item));
      const beforeWeight = store.getState().player.data.inventory.currentWeight;

      store.dispatch(removeItem(item.id));

      const player = store.getState().player.data;
      expect(player.inventory.items).not.toContainEqual(item);
      expect(player.inventory.currentWeight).toBe(beforeWeight - 2);
    });
  });

  describe('equipment management', () => {
    it('equips a weapon from inventory', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const weapon: Weapon = {
        id: uuidv4(),
        name: 'Test Pistol',
        description: 'A test weapon',
        weight: 3,
        value: 100,
        damage: 15,
        range: 10,
        apCost: 3,
        isQuestItem: false,
      };

      store.dispatch(addItem(weapon));
      store.dispatch(equipWeapon(weapon.id));

      const player = store.getState().player.data;
      expect(player.equipped.weapon).toEqual(weapon);
      expect(player.inventory.items).not.toContainEqual(weapon);
    });

    it('unequips current weapon when equipping new one', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const weapon1: Weapon = {
        id: uuidv4(),
        name: 'Weapon 1',
        description: 'First weapon',
        weight: 3,
        value: 100,
        damage: 15,
        range: 10,
        apCost: 3,
        isQuestItem: false,
      };

      const weapon2: Weapon = {
        id: uuidv4(),
        name: 'Weapon 2',
        description: 'Second weapon',
        weight: 4,
        value: 150,
        damage: 20,
        range: 12,
        apCost: 4,
        isQuestItem: false,
      };

      store.dispatch(addItem(weapon1));
      store.dispatch(addItem(weapon2));
      store.dispatch(equipWeapon(weapon1.id));
      store.dispatch(equipWeapon(weapon2.id));

      const player = store.getState().player.data;
      expect(player.equipped.weapon).toEqual(weapon2);
      expect(player.inventory.items).toContainEqual(weapon1);
    });

    it('unequips weapon back to inventory', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const weapon: Weapon = {
        id: uuidv4(),
        name: 'Test Pistol',
        description: 'A test weapon',
        weight: 3,
        value: 100,
        damage: 15,
        range: 10,
        apCost: 3,
        isQuestItem: false,
      };

      store.dispatch(addItem(weapon));
      store.dispatch(equipWeapon(weapon.id));
      store.dispatch(unequipWeapon());

      const player = store.getState().player.data;
      expect(player.equipped.weapon).toBeUndefined();
      expect(player.inventory.items).toContainEqual(weapon);
    });

    it('equips armor from inventory', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const armor: Armor = {
        id: uuidv4(),
        name: 'Test Armor',
        description: 'A test armor',
        weight: 5,
        value: 200,
        protection: 10,
        isQuestItem: false,
      };

      store.dispatch(addItem(armor));
      store.dispatch(equipArmor(armor.id));

      const player = store.getState().player.data;
      expect(player.equipped.armor).toEqual(armor);
      expect(player.inventory.items).not.toContainEqual(armor);
    });

    it('unequips armor back to inventory', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const armor: Armor = {
        id: uuidv4(),
        name: 'Test Armor',
        description: 'A test armor',
        weight: 5,
        value: 200,
        protection: 10,
        isQuestItem: false,
      };

      store.dispatch(addItem(armor));
      store.dispatch(equipArmor(armor.id));
      store.dispatch(unequipArmor());

      const player = store.getState().player.data;
      expect(player.equipped.armor).toBeUndefined();
      expect(player.inventory.items).toContainEqual(armor);
    });
  });

  describe('skill point spending', () => {
    it('spends skill points', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      // Award skill points through level up
      store.dispatch(addExperience(500));

      const beforePoints = store.getState().player.data.skillPoints;
      store.dispatch(spendSkillPoints(2));

      const afterPoints = store.getState().player.data.skillPoints;
      expect(afterPoints).toBe(beforePoints - 2);
    });

    it('prevents spending more points than available', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const beforePoints = store.getState().player.data.skillPoints;
      store.dispatch(spendSkillPoints(999));

      const afterPoints = store.getState().player.data.skillPoints;
      expect(afterPoints).toBe(beforePoints);
    });
  });

  describe('attribute point spending', () => {
    it('spends attribute point to increase skill', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      // Award attribute points through level up
      store.dispatch(addExperience(500));

      const beforePoints = store.getState().player.data.attributePoints;
      const beforeStrength = store.getState().player.data.skills.strength;

      if (beforePoints > 0) {
        store.dispatch(spendAttributePoint('strength'));

        const afterPoints = store.getState().player.data.attributePoints;
        const afterStrength = store.getState().player.data.skills.strength;

        expect(afterPoints).toBe(beforePoints - 1);
        expect(afterStrength).toBe(beforeStrength + 1);
      }
    });

    it('prevents spending attribute points when none available', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const beforeStrength = store.getState().player.data.skills.strength;
      store.dispatch(spendAttributePoint('strength'));

      const afterStrength = store.getState().player.data.skills.strength;
      expect(afterStrength).toBe(beforeStrength);
    });

    it('prevents increasing skill beyond max value of 10', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: { ...DEFAULT_SKILLS, strength: 10 },
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      // Award attribute points
      store.dispatch(addExperience(500));

      const beforePoints = store.getState().player.data.attributePoints;
      store.dispatch(spendAttributePoint('strength'));

      const afterPoints = store.getState().player.data.attributePoints;
      expect(afterPoints).toBe(beforePoints); // Point not spent
      expect(store.getState().player.data.skills.strength).toBe(10);
    });
  });

  describe('resetPlayer', () => {
    it('resets player to default state', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test Character',
          skills: { ...DEFAULT_SKILLS, strength: 8 },
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(resetPlayer());

      const player = store.getState().player.data;
      expect(player.name).toBe('Player');
      expect(player.level).toBe(1);
      expect(player.experience).toBe(0);
    });
  });
});
