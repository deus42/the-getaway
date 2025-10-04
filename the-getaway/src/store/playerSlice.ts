import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Player, Position, Item, PlayerSkills, Weapon, Armor, SkillId, PerkId } from '../game/interfaces/types';
import { DEFAULT_PLAYER } from '../game/interfaces/player';
import { calculateDerivedStats, calculateMaxHP, calculateBaseAP, calculateCarryWeight } from '../game/systems/statCalculations';
import { processLevelUp, awardXP as awardXPHelper } from '../game/systems/progression';
import { createArmor, createConsumable, createWeapon } from '../game/inventory/inventorySystem';
import { BACKGROUND_MAP, StartingItemDefinition } from '../content/backgrounds';
import { getSkillDefinition } from '../content/skills';
import { getPerkDefinition, evaluatePerkAvailability } from '../content/perks';
import { createLevelUpEvent, LevelUpEvent } from '../utils/progressionHelpers';
import {
  activateAdrenalineRush,
  resetGunFuForTurn,
  shouldTriggerAdrenalineRush,
  tickAdrenalineRush,
  decayGhostInvisibility,
} from '../game/systems/perks';

export interface PlayerState {
  data: Player;
  pendingLevelUpEvents: LevelUpEvent[];
}

const createFreshPlayer = (): Player => ({
  ...DEFAULT_PLAYER,
  id: uuidv4(),
  position: { ...DEFAULT_PLAYER.position },
  skills: { ...DEFAULT_PLAYER.skills },
  skillTraining: { ...DEFAULT_PLAYER.skillTraining },
  taggedSkillIds: [...DEFAULT_PLAYER.taggedSkillIds],
  inventory: {
    items: [],
    maxWeight: DEFAULT_PLAYER.inventory.maxWeight,
    currentWeight: 0,
  },
  equipped: {
    weapon: undefined,
    armor: undefined,
    accessory: undefined,
  },
  factionReputation: { ...DEFAULT_PLAYER.factionReputation },
  perks: [...DEFAULT_PLAYER.perks],
  pendingPerkSelections: DEFAULT_PLAYER.pendingPerkSelections,
  backgroundId: undefined,
  appearancePreset: DEFAULT_PLAYER.appearancePreset,
  perkRuntime: { ...DEFAULT_PLAYER.perkRuntime },
});

const initialState: PlayerState = {
  data: createFreshPlayer(),
  pendingLevelUpEvents: [],
};

type InitializeCharacterPayload = {
  name: string;
  visualPreset: string;
  skills: PlayerSkills;
  backgroundId: string;
};

const clampSkillValue = (value: number): number => Math.max(1, Math.min(10, Math.round(value)));

/**
 * Round weight to 2 decimal places to prevent floating-point precision errors.
 * This prevents issues like 0.1 + 0.2 = 0.30000000000000004
 */
const roundWeight = (weight: number): number => Math.round(weight * 100) / 100;

const applyStartingItem = (player: Player, item: StartingItemDefinition): void => {
  switch (item.type) {
    case 'weapon': {
      const weapon = createWeapon(
        item.name,
        item.damage,
        item.range,
        item.apCost,
        item.weight,
        item.statModifiers,
        item.skillType
      );
      if (item.equip) {
        player.equipped.weapon = weapon;
      } else {
        player.inventory.items.push(weapon);
        player.inventory.currentWeight += weapon.weight;
      }
      break;
    }
    case 'armor': {
      const armor = createArmor(item.name, item.protection, item.weight, item.statModifiers);
      if (item.equip) {
        player.equipped.armor = armor;
      } else {
        player.inventory.items.push(armor);
        player.inventory.currentWeight += armor.weight;
      }
      break;
    }
    case 'consumable': {
      const consumable = createConsumable(
        item.name,
        item.effectType,
        item.value,
        item.statAffected,
        item.weight
      );
      player.inventory.items.push(consumable);
      player.inventory.currentWeight += consumable.weight;
      break;
    }
    case 'item': {
      const plainItem: Item = {
        id: uuidv4(),
        name: item.name,
        description: item.description,
        weight: item.weight,
        value: Math.max(10, Math.round(item.weight * 15)),
        isQuestItem: Boolean(item.isQuestItem),
      };
      player.inventory.items.push(plainItem);
      player.inventory.currentWeight += plainItem.weight;
      break;
    }
    default:
      break;
  }
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    initializeCharacter: (state, action: PayloadAction<InitializeCharacterPayload>) => {
      const { name, skills, backgroundId, visualPreset } = action.payload;

      const sanitizedSkills: PlayerSkills = {
        strength: clampSkillValue(skills.strength),
        perception: clampSkillValue(skills.perception),
        endurance: clampSkillValue(skills.endurance),
        charisma: clampSkillValue(skills.charisma),
        intelligence: clampSkillValue(skills.intelligence),
        agility: clampSkillValue(skills.agility),
        luck: clampSkillValue(skills.luck),
      };

      const derived = calculateDerivedStats(sanitizedSkills);
      const background = BACKGROUND_MAP[backgroundId];

      const freshPlayer = createFreshPlayer();
      freshPlayer.name = name;
      freshPlayer.appearancePreset = visualPreset;
      freshPlayer.skills = sanitizedSkills;
      freshPlayer.maxHealth = derived.maxHP;
      freshPlayer.health = derived.maxHP;
      freshPlayer.maxActionPoints = derived.baseAP;
      freshPlayer.actionPoints = derived.baseAP;
      freshPlayer.inventory.maxWeight = derived.carryWeight;
      freshPlayer.inventory.currentWeight = 0;
      freshPlayer.inventory.items = [];
      freshPlayer.equipped = {
        weapon: undefined,
        armor: undefined,
        accessory: undefined,
      };
      freshPlayer.perks = [];
      freshPlayer.pendingPerkSelections = 0;
      freshPlayer.backgroundId = backgroundId;
      freshPlayer.factionReputation = {
        resistance: 0,
        corpsec: 0,
        scavengers: 0,
      };
      freshPlayer.perkRuntime = {
        gunFuShotsThisTurn: 0,
        adrenalineRushTurnsRemaining: 0,
        ghostInvisibilityTurns: 0,
        ghostConsumed: false,
      };

      if (background) {
        // Background perks are optional (not yet implemented for all backgrounds)
        if (background.perk) {
          freshPlayer.perks.push(background.perk.id);
        }

        Object.entries(background.factionAdjustments).forEach(([faction, value]) => {
          const key = faction as keyof Player['factionReputation'];
          freshPlayer.factionReputation[key] += value ?? 0;
        });

        background.startingEquipment.forEach((item) => applyStartingItem(freshPlayer, item));
      }

      state.data = freshPlayer;
    },

    // Move player to a new position
    movePlayer: (state, action: PayloadAction<Position>) => {
      state.data.position = action.payload;
    },
    
    // Update player health
    updateHealth: (state, action: PayloadAction<number>) => {
      state.data.health = Math.max(0, Math.min(state.data.maxHealth, state.data.health + action.payload));

      if (shouldTriggerAdrenalineRush(state.data)) {
        state.data = activateAdrenalineRush(state.data);
      }
    },
    
    // Set player health directly
    setHealth: (state, action: PayloadAction<number>) => {
      state.data.health = Math.max(0, Math.min(state.data.maxHealth, action.payload));

      if (shouldTriggerAdrenalineRush(state.data)) {
        state.data = activateAdrenalineRush(state.data);
      }
    },
    
    // Update player action points
    updateActionPoints: (state, action: PayloadAction<number>) => {
      state.data.actionPoints = Math.max(0, Math.min(state.data.maxActionPoints, state.data.actionPoints + action.payload));
    },
    
    // Reset player action points to maximum
    resetActionPoints: (state) => {
      state.data.actionPoints = state.data.maxActionPoints;
    },
    
    // Add experience and automatically process level-ups
    addExperience: (state, action: PayloadAction<number>) => {
      // Award XP
      state.data = awardXPHelper(state.data, action.payload);

      // Check for level-up and process
      const result = processLevelUp(state.data);
      state.data = result.player;

      // Award skill points and attribute points
      if (result.skillPointsAwarded > 0) {
        state.data.skillPoints += result.skillPointsAwarded;
      }
      if (result.attributePointsAwarded > 0) {
        state.data.attributePoints += result.attributePointsAwarded;
      }

      if (result.perksUnlocked > 0) {
        state.data.pendingPerkSelections += result.perksUnlocked;
      }

      if (result.levelsGained > 0) {
        state.pendingLevelUpEvents.push(
          createLevelUpEvent(
            state.data.level,
            result.skillPointsAwarded,
            result.attributePointsAwarded,
            result.perksUnlocked
          )
        );
      }

      // Perk choices are queued via pendingPerkSelections and resolved through UI flow
    },

    // Add credits (currency)
    addCredits: (state, action: PayloadAction<number>) => {
      state.data.credits = Math.max(0, state.data.credits + action.payload);
    },
    
    // Level up the player
    levelUp: (state) => {
      state.data.level += 1;
      state.data.maxHealth += 10;
      state.data.health = state.data.maxHealth; // Full health on level up
      state.data.maxActionPoints += 1;
      state.data.actionPoints = state.data.maxActionPoints; // Full AP on level up
    },
    
    // Update a skill
    updateSkill: (state, action: PayloadAction<{ skill: keyof PlayerSkills; amount: number }>) => {
      const { skill, amount } = action.payload;
      state.data.skills[skill] = Math.max(1, Math.min(10, state.data.skills[skill] + amount));

      // Recalculate derived stats when attributes change
      const skills = state.data.skills;
      const newMaxHP = calculateMaxHP(skills.endurance);
      const newBaseAP = calculateBaseAP(skills.agility);
      const newCarryWeight = calculateCarryWeight(skills.strength);

      // Update max HP (preserve current HP ratio)
      const currentHP = Number.isFinite(state.data.health) ? state.data.health : 0;
      const currentMaxHP = Number.isFinite(state.data.maxHealth) && state.data.maxHealth > 0
        ? state.data.maxHealth
        : 1;
      const hpRatio = currentHP / currentMaxHP;
      state.data.maxHealth = newMaxHP;
      const calculatedHP = Math.floor(newMaxHP * hpRatio);
      state.data.health = Math.max(0, Math.min(Number.isFinite(calculatedHP) ? calculatedHP : newMaxHP, newMaxHP));

      // Update max AP (preserve current AP if possible)
      state.data.maxActionPoints = newBaseAP;
      state.data.actionPoints = Math.min(state.data.actionPoints, newBaseAP);

      // Update carry weight
      state.data.inventory.maxWeight = newCarryWeight;
    },

    // Set a skill directly (for character creation)
    setSkill: (state, action: PayloadAction<{ skill: keyof PlayerSkills; value: number }>) => {
      const { skill, value } = action.payload;
      state.data.skills[skill] = Math.max(1, Math.min(10, value));

      // Recalculate derived stats
      const skills = state.data.skills;
      state.data.maxHealth = calculateMaxHP(skills.endurance);
      state.data.health = state.data.maxHealth;
      state.data.maxActionPoints = calculateBaseAP(skills.agility);
      state.data.actionPoints = state.data.maxActionPoints;
      state.data.inventory.maxWeight = calculateCarryWeight(skills.strength);
    },
    
    // Add item to inventory
    addItem: (state, action: PayloadAction<Item>) => {
      const item = action.payload;
      const newWeight = roundWeight(state.data.inventory.currentWeight + item.weight);

      // Check if player can carry the item
      if (newWeight <= state.data.inventory.maxWeight) {
        state.data.inventory.items.push(item);
        state.data.inventory.currentWeight = newWeight;
      }
    },
    
    // Remove item from inventory
    removeItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const item = state.data.inventory.items.find(item => item.id === itemId);

      if (item) {
        state.data.inventory.items = state.data.inventory.items.filter(item => item.id !== itemId);
        state.data.inventory.currentWeight = roundWeight(state.data.inventory.currentWeight - item.weight);
      }
    },
    
    // Reset player to default
    resetPlayer: (state) => {
      state.data = createFreshPlayer();
      state.pendingLevelUpEvents = [];
    },

    // Set the entire player data object (useful after complex operations)
    setPlayerData: (state, action: PayloadAction<Player>) => {
      state.data = action.payload;

      if (!state.data.perkRuntime) {
        state.data.perkRuntime = {
          gunFuShotsThisTurn: 0,
          adrenalineRushTurnsRemaining: 0,
          ghostInvisibilityTurns: 0,
          ghostConsumed: false,
        };
      }

      if (shouldTriggerAdrenalineRush(state.data)) {
        state.data = activateAdrenalineRush(state.data);
      }
    },

    // Equip a weapon
    equipWeapon: (state, action: PayloadAction<string>) => {
      const weaponId = action.payload;
      const weapon = state.data.inventory.items.find(i => i.id === weaponId) as Weapon | undefined;

      if (!weapon || !('damage' in weapon)) {
        return; // Not a weapon
      }

      // Calculate final weight after swap to prevent overflow
      const oldWeaponWeight = state.data.equipped.weapon?.weight ?? 0;
      const newWeight = roundWeight(state.data.inventory.currentWeight - weapon.weight + oldWeaponWeight);

      if (newWeight > state.data.inventory.maxWeight) {
        return; // Can't swap due to weight limit
      }

      // Unequip current weapon if any (add back to inventory)
      if (state.data.equipped.weapon) {
        state.data.inventory.items.push(state.data.equipped.weapon);
        state.data.inventory.currentWeight = roundWeight(state.data.inventory.currentWeight + state.data.equipped.weapon.weight);
      }

      // Remove weapon from inventory
      state.data.inventory.items = state.data.inventory.items.filter(i => i.id !== weaponId);
      state.data.inventory.currentWeight = roundWeight(state.data.inventory.currentWeight - weapon.weight);

      // Equip weapon
      state.data.equipped.weapon = weapon;
    },

    // Equip armor
    equipArmor: (state, action: PayloadAction<string>) => {
      const armorId = action.payload;
      const armor = state.data.inventory.items.find(i => i.id === armorId) as Armor | undefined;

      if (!armor || !('protection' in armor)) {
        return; // Not armor
      }

      // Calculate final weight after swap to prevent overflow
      const oldArmorWeight = state.data.equipped.armor?.weight ?? 0;
      const newWeight = roundWeight(state.data.inventory.currentWeight - armor.weight + oldArmorWeight);

      if (newWeight > state.data.inventory.maxWeight) {
        return; // Can't swap due to weight limit
      }

      // Unequip current armor if any (add back to inventory)
      if (state.data.equipped.armor) {
        state.data.inventory.items.push(state.data.equipped.armor);
        state.data.inventory.currentWeight = roundWeight(state.data.inventory.currentWeight + state.data.equipped.armor.weight);
      }

      // Remove armor from inventory
      state.data.inventory.items = state.data.inventory.items.filter(i => i.id !== armorId);
      state.data.inventory.currentWeight = roundWeight(state.data.inventory.currentWeight - armor.weight);

      // Equip armor
      state.data.equipped.armor = armor;
    },

    // Unequip weapon
    unequipWeapon: (state) => {
      if (!state.data.equipped.weapon) {
        return;
      }

      const weapon = state.data.equipped.weapon;
      const newWeight = roundWeight(state.data.inventory.currentWeight + weapon.weight);

      // Check if unequipping would exceed weight limit
      if (newWeight > state.data.inventory.maxWeight) {
        console.warn('[PlayerSlice] Cannot unequip weapon: would exceed weight limit');
        return;
      }

      // Add weapon back to inventory
      state.data.inventory.items.push(weapon);
      state.data.inventory.currentWeight = newWeight;

      // Unequip
      state.data.equipped.weapon = undefined;
    },

    // Unequip armor
    unequipArmor: (state) => {
      if (!state.data.equipped.armor) {
        return;
      }

      const armor = state.data.equipped.armor;
      const newWeight = roundWeight(state.data.inventory.currentWeight + armor.weight);

      // Check if unequipping would exceed weight limit
      if (newWeight > state.data.inventory.maxWeight) {
        console.warn('[PlayerSlice] Cannot unequip armor: would exceed weight limit');
        return;
      }

      // Add armor back to inventory
      state.data.inventory.items.push(armor);
      state.data.inventory.currentWeight = newWeight;

      // Unequip
      state.data.equipped.armor = undefined;
    },

    consumeLevelUpEvent: (state) => {
      state.pendingLevelUpEvents.shift();
    },

    clearPendingPerkSelections: (state) => {
      state.data.pendingPerkSelections = 0;
    },

    selectPerk: (state, action: PayloadAction<PerkId>) => {
      const perkId = action.payload;

      if (state.data.pendingPerkSelections <= 0) {
        return;
      }

      if (state.data.perks.includes(perkId)) {
        return;
      }

      const definition = getPerkDefinition(perkId);
      const availability = evaluatePerkAvailability(state.data, definition);

      if (!availability.canSelect) {
        return;
      }

      state.data.perks.push(perkId);
      state.data.pendingPerkSelections = Math.max(0, state.data.pendingPerkSelections - 1);

      switch (perkId) {
        case 'gunFu':
          state.data.perkRuntime.gunFuShotsThisTurn = 0;
          break;
        case 'adrenalineRush':
          state.data.perkRuntime.adrenalineRushTurnsRemaining = 0;
          break;
        case 'ghost':
          state.data.perkRuntime.ghostConsumed = false;
          state.data.perkRuntime.ghostInvisibilityTurns = 0;
          break;
        default:
          break;
      }
    },

    beginPlayerTurn: (state) => {
      state.data = resetGunFuForTurn(state.data);

      if (state.data.perkRuntime.adrenalineRushTurnsRemaining > 0) {
        state.data = tickAdrenalineRush(state.data);
      }

      if (state.data.perkRuntime.ghostInvisibilityTurns > 0) {
        state.data = decayGhostInvisibility(state.data);
      }
    },

    // Spend skill points (for skill tree - Step 24b)
    spendSkillPoints: (state, action: PayloadAction<number>) => {
      const amount = action.payload;
      if (state.data.skillPoints >= amount && amount > 0) {
        state.data.skillPoints -= amount;
      }
    },

    allocateSkillPointToSkill: (state, action: PayloadAction<SkillId>) => {
      const skillId = action.payload;
      if (state.data.skillPoints <= 0) {
        return;
      }

      const definition = getSkillDefinition(skillId);
      const currentValue = state.data.skillTraining[skillId] ?? 0;
      const isTagged = state.data.taggedSkillIds.includes(skillId);
      const increment = isTagged ? definition.taggedIncrement : definition.increment;

      if (currentValue >= definition.maxValue) {
        return;
      }

      if (currentValue + increment > definition.maxValue) {
        return;
      }

      state.data.skillTraining[skillId] = currentValue + increment;
      state.data.skillPoints -= 1;
    },

    refundSkillPointFromSkill: (state, action: PayloadAction<SkillId>) => {
      const skillId = action.payload;
      const definition = getSkillDefinition(skillId);
      const currentValue = state.data.skillTraining[skillId] ?? 0;

      if (currentValue <= 0) {
        return;
      }

      const isTagged = state.data.taggedSkillIds.includes(skillId);
      const decrement = isTagged ? definition.taggedIncrement : definition.increment;
      const newValue = currentValue - decrement;

      if (newValue < 0) {
        return;
      }

      state.data.skillTraining[skillId] = newValue;
      state.data.skillPoints += 1;
    },

    // Spend attribute point to increase attribute
    spendAttributePoint: (state, action: PayloadAction<keyof PlayerSkills>) => {
      const attribute = action.payload;

      if (state.data.attributePoints <= 0) {
        return; // No points available
      }

      if (state.data.skills[attribute] >= 10) {
        return; // Max attribute value
      }

      // Spend point and increase attribute
      state.data.attributePoints -= 1;
      state.data.skills[attribute] += 1;

      // Recalculate derived stats
      const skills = state.data.skills;
      const newMaxHP = calculateMaxHP(skills.endurance);
      const newBaseAP = calculateBaseAP(skills.agility);
      const newCarryWeight = calculateCarryWeight(skills.strength);

      // Update max HP (preserve HP ratio)
      const currentHP = Number.isFinite(state.data.health) ? state.data.health : 0;
      const currentMaxHP = Number.isFinite(state.data.maxHealth) && state.data.maxHealth > 0
        ? state.data.maxHealth
        : 1;
      const hpRatio = currentHP / currentMaxHP;
      state.data.maxHealth = newMaxHP;
      const calculatedHP = Math.floor(newMaxHP * hpRatio);
      state.data.health = Math.max(0, Math.min(Number.isFinite(calculatedHP) ? calculatedHP : newMaxHP, newMaxHP));

      // Update max AP
      state.data.maxActionPoints = newBaseAP;
      state.data.actionPoints = Math.min(state.data.actionPoints, newBaseAP);

      // Update carry weight
      state.data.inventory.maxWeight = newCarryWeight;
    },

    refundAttributePoint: (state, action: PayloadAction<keyof PlayerSkills>) => {
      const attribute = action.payload;
      const currentValue = state.data.skills[attribute];

      if (currentValue <= 1) {
        return; // Cannot reduce below 1
      }

      // Refund point and decrease attribute
      state.data.attributePoints += 1;
      state.data.skills[attribute] -= 1;

      // Recalculate derived stats
      const skills = state.data.skills;
      const newMaxHP = calculateMaxHP(skills.endurance);
      const newBaseAP = calculateBaseAP(skills.agility);
      const newCarryWeight = calculateCarryWeight(skills.strength);

      // Update max HP (preserve HP ratio)
      const currentHP = Number.isFinite(state.data.health) ? state.data.health : 0;
      const currentMaxHP = Number.isFinite(state.data.maxHealth) && state.data.maxHealth > 0
        ? state.data.maxHealth
        : 1;
      const hpRatio = currentHP / currentMaxHP;
      state.data.maxHealth = newMaxHP;
      const calculatedHP = Math.floor(newMaxHP * hpRatio);
      state.data.health = Math.max(0, Math.min(Number.isFinite(calculatedHP) ? calculatedHP : newMaxHP, newMaxHP));

      // Update max AP
      state.data.maxActionPoints = newBaseAP;
      state.data.actionPoints = Math.min(state.data.actionPoints, newBaseAP);

      // Update carry weight
      state.data.inventory.maxWeight = newCarryWeight;
    }
  }
});

export const {
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
  setPlayerData,
  equipWeapon,
  equipArmor,
  unequipWeapon,
  unequipArmor,
  consumeLevelUpEvent,
  clearPendingPerkSelections,
  selectPerk,
  beginPlayerTurn,
  spendSkillPoints,
  spendAttributePoint,
  refundAttributePoint,
  allocateSkillPointToSkill,
  refundSkillPointFromSkill
} = playerSlice.actions;

export default playerSlice.reducer; 
