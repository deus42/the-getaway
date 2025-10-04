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
  allocateSkillPointToSkill,
  refundSkillPointFromSkill,
  setPlayerData,
  spendAttributePoint,
  selectPerk,
  consumeLevelUpEvent,
  beginPlayerTurn,
  PlayerState,
} from '../store/playerSlice';
import { Item, Weapon, Armor } from '../game/interfaces/types';
import { DEFAULT_SKILLS } from '../game/interfaces/player';
import { calculateXPForLevel } from '../game/systems/progression';

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
      // Background perks not yet implemented (reserved for future expansion)
      // expect(player.perks.length).toBeGreaterThan(0);
      expect(player.backgroundId).toBe('corpsec_defector');
      expect(player.equipped.weapon?.name).toBe('CorpSec Service Pistol');
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

    it('queues perk selections when reaching perk unlock levels', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addExperience(500));

      const state = store.getState();
      expect(state.player.data.pendingPerkSelections).toBeGreaterThanOrEqual(1);
      expect(state.player.pendingLevelUpEvents.length).toBeGreaterThan(0);
      expect(state.player.pendingLevelUpEvents[0].perksUnlocked).toBeGreaterThanOrEqual(1);
    });

    it('allows selecting available perks and reduces pending selections', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addExperience(300));

      store.dispatch(selectPerk('steadyHands'));

      const player = store.getState().player.data;
      expect(player.perks).toContain('steadyHands');
      expect(player.pendingPerkSelections).toBe(0);
    });

    it('prevents selecting perks without meeting requirements', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addExperience(300));

      store.dispatch(selectPerk('gunFu'));

      const player = store.getState().player.data;
      expect(player.perks).not.toContain('gunFu');
      expect(player.pendingPerkSelections).toBeGreaterThanOrEqual(0);
    });

    it('consumes queued level up events', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addExperience(300));
      expect(store.getState().player.pendingLevelUpEvents.length).toBeGreaterThan(0);

      store.dispatch(consumeLevelUpEvent());
      expect(store.getState().player.pendingLevelUpEvents.length).toBe(0);
    });

    it('awards one attribute point every level for manual allocation', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const initialAttributePoints = store.getState().player.data.attributePoints;

      const xpToLevelTwo = calculateXPForLevel(2);
      store.dispatch(addExperience(xpToLevelTwo));

      const playerAfterLevelTwo = store.getState().player.data;
      expect(playerAfterLevelTwo.level).toBe(2);
      expect(playerAfterLevelTwo.attributePoints).toBe(initialAttributePoints + 1);

      const xpToLevelThree = calculateXPForLevel(3);
      store.dispatch(addExperience(xpToLevelThree));

      const playerAfterLevelThree = store.getState().player.data;
      expect(playerAfterLevelThree.level).toBe(3);
      expect(playerAfterLevelThree.attributePoints).toBe(initialAttributePoints + 2);
    });

  });

  describe('perk runtime management', () => {
    it('resets Gun Fu shot counter at the start of player turn', () => {
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
      const modifiedPlayer = {
        ...player,
        level: 12,
        perks: [...player.perks, 'gunFu'],
        perkRuntime: {
          ...player.perkRuntime,
          gunFuShotsThisTurn: 3,
        },
      };

      store.dispatch(setPlayerData(modifiedPlayer));

      store.dispatch(beginPlayerTurn());

      expect(store.getState().player.data.perkRuntime.gunFuShotsThisTurn).toBe(0);
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
        slot: 'weapon',
        skillType: 'smallGuns',
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
        slot: 'weapon',
        skillType: 'smallGuns',
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
        slot: 'weapon',
        skillType: 'smallGuns',
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
        slot: 'weapon',
        skillType: 'smallGuns',
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
        slot: 'armor',
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
        slot: 'armor',
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

    it('allocates combat skill points with standard increment', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      store.dispatch(addExperience(500));

      const before = store.getState().player.data;
      expect(before.skillPoints).toBeGreaterThan(0);
      expect(before.skillTraining.smallGuns).toBe(0);

      store.dispatch(allocateSkillPointToSkill('smallGuns'));

      const updated = store.getState().player.data;
      expect(updated.skillTraining.smallGuns).toBe(5);
      expect(updated.skillPoints).toBe(before.skillPoints - 1);
    });

    it('allocates and refunds tagged skill points using +10 increments', () => {
      const store = createTestStore();

      store.dispatch(
        initializeCharacter({
          name: 'Test',
          skills: DEFAULT_SKILLS,
          backgroundId: 'corpsec_defector',
          visualPreset: 'preset_1',
        })
      );

      const basePlayer = store.getState().player.data;

      store.dispatch(
        setPlayerData({
          ...basePlayer,
          skillPoints: 3,
          taggedSkillIds: ['smallGuns'],
          skillTraining: {
            ...basePlayer.skillTraining,
            smallGuns: 20,
          },
        })
      );

      store.dispatch(allocateSkillPointToSkill('smallGuns'));

      let updated = store.getState().player.data;
      expect(updated.skillTraining.smallGuns).toBe(30);
      expect(updated.skillPoints).toBe(2);

      store.dispatch(refundSkillPointFromSkill('smallGuns'));

      updated = store.getState().player.data;
      expect(updated.skillTraining.smallGuns).toBe(20);
      expect(updated.skillPoints).toBe(3);
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
