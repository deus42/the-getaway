import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  Position,
  Item,
  PlayerSkills,
  Weapon,
  Armor,
  SkillId,
  PerkId,
  EquipmentSlot,
  Consumable,
  FactionId,
} from '../game/interfaces/types';
import { DEFAULT_PLAYER, createDefaultPersonalityProfile } from '../game/interfaces/player';
import {
  calculateDerivedStats,
  calculateMaxHP,
  calculateBaseAP,
  calculateCarryWeight,
  calculateMaxStamina,
} from '../game/systems/statCalculations';
import { processLevelUp, awardXP as awardXPHelper } from '../game/systems/progression';
import { createArmor, createConsumable, createWeapon } from '../game/inventory/inventorySystem';
import { BACKGROUND_MAP, StartingItemDefinition } from '../content/backgrounds';
import { instantiateItem } from '../content/items';
import { getSkillDefinition } from '../content/skills';
import { getPerkDefinition, evaluatePerkAvailability } from '../content/perks';
import { createLevelUpEvent, createXPNotification, LevelUpEvent } from '../utils/progressionHelpers';
import { XPNotificationData } from '../components/ui/XPNotification';
import {
  activateAdrenalineRush,
  resetGunFuForTurn,
  shouldTriggerAdrenalineRush,
  tickAdrenalineRush,
  decayGhostInvisibility,
} from '../game/systems/perks';
import { computeEncumbranceState } from '../game/inventory/encumbrance';
import {
  STAMINA_REGEN_OUT_OF_COMBAT,
  clampStamina,
  shouldEnterExhaustion,
  shouldLeaveExhaustion,
} from '../game/systems/stamina';
import {
  applyFactionDelta,
  clampFactionReputation,
  FactionStandingChange,
  ReputationAdjustmentResult,
  setFactionReputation as setFactionReputationHelper,
} from '../game/systems/factions';
import { isTwoHandedWeapon } from '../game/systems/equipmentTags';

export interface PlayerState {
  version: number;
  data: Player;
  pendingLevelUpEvents: LevelUpEvent[];
  xpNotifications: XPNotificationData[];
  pendingFactionEvents: FactionReputationEvent[];
}

export const PLAYER_STATE_VERSION = 2;

interface FactionReputationEvent {
  factionId: FactionId;
  delta: number;
  updatedValue: number;
  rivalDeltas: Partial<Record<FactionId, number>>;
  standingChanges: FactionStandingChange[];
  reason?: string;
  source?: string;
  timestamp: number;
}

type AddExperiencePayload = number | { amount: number; reason?: string };

const createFreshPlayer = (): Player => {
  const base: Player = {
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
      hotbar: [null, null, null, null, null],
    },
    karma: DEFAULT_PLAYER.karma,
    personality: createDefaultPersonalityProfile(),
    equipped: {
      weapon: undefined,
      armor: undefined,
      accessory: undefined,
      secondaryWeapon: undefined,
      meleeWeapon: undefined,
      bodyArmor: undefined,
      helmet: undefined,
      accessory1: undefined,
      accessory2: undefined,
    },
    equippedSlots: {},
    activeWeaponSlot: 'primaryWeapon',
    factionReputation: { ...DEFAULT_PLAYER.factionReputation },
    perks: [...DEFAULT_PLAYER.perks],
    pendingPerkSelections: DEFAULT_PLAYER.pendingPerkSelections,
    backgroundId: undefined,
    appearancePreset: DEFAULT_PLAYER.appearancePreset,
    perkRuntime: { ...DEFAULT_PLAYER.perkRuntime },
    encumbrance: {
      level: 'normal',
      percentage: 0,
      movementApMultiplier: 1,
      attackApMultiplier: 1,
    },
  };

  ensureStaminaFields(base);
  return base;
};

export const initialPlayerState: PlayerState = {
  version: PLAYER_STATE_VERSION,
  data: createFreshPlayer(),
  pendingLevelUpEvents: [],
  xpNotifications: [],
  pendingFactionEvents: [],
};

type InitializeCharacterPayload = {
  name: string;
  visualPreset: string;
  skills: PlayerSkills;
  backgroundId: string;
};

interface EquipItemPayload {
  itemId: string;
  slot?: EquipmentSlot;
}

interface UnequipItemPayload {
  slot: EquipmentSlot;
}

interface RepairItemPayload {
  itemId: string;
  amount: number;
}

interface SplitStackPayload {
  itemId: string;
  quantity: number;
}

interface AssignHotbarPayload {
  slotIndex: number;
  itemId: string | null;
}

interface AdjustFactionReputationPayload {
  factionId: FactionId;
  delta: number;
  reason?: string;
  source?: string;
}

interface SetFactionReputationPayload {
  factionId: FactionId;
  value: number;
  reason?: string;
  source?: string;
}

const clampSkillValue = (value: number): number => Math.max(1, Math.min(10, Math.round(value)));

/**
 * Round weight to 2 decimal places to prevent floating-point precision errors.
 * This prevents issues like 0.1 + 0.2 = 0.30000000000000004
 */
const roundWeight = (weight: number): number => Math.round(weight * 100) / 100;

const HOTBAR_CAPACITY = 5;
const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'primaryWeapon',
  'secondaryWeapon',
  'meleeWeapon',
  'bodyArmor',
  'helmet',
  'accessory1',
  'accessory2',
];

const MAX_PENDING_FACTION_EVENTS = 20;

const shouldRecordFactionEvent = (result: ReputationAdjustmentResult): boolean => {
  return (
    result.primaryDelta !== 0 ||
    Object.values(result.rivalDeltas).some((value) => value !== 0) ||
    result.standingChanges.length > 0
  );
};

const pushFactionEvent = (
  state: PlayerState,
  event: FactionReputationEvent
): void => {
  state.pendingFactionEvents.push(event);
  if (state.pendingFactionEvents.length > MAX_PENDING_FACTION_EVENTS) {
    state.pendingFactionEvents.shift();
  }
};

const recordFactionAdjustment = (
  state: PlayerState,
  factionId: FactionId,
  result: ReputationAdjustmentResult,
  metadata?: { reason?: string; source?: string }
): void => {
  if (!shouldRecordFactionEvent(result)) {
    return;
  }

  pushFactionEvent(state, {
    factionId,
    delta: result.primaryDelta,
    updatedValue: state.data.factionReputation[factionId],
    rivalDeltas: result.rivalDeltas,
    standingChanges: result.standingChanges,
    reason: metadata?.reason,
    source: metadata?.source,
    timestamp: Date.now(),
  });
};

function updateExhaustionState(player: Player): void {
  if (!Number.isFinite(player.maxStamina) || player.maxStamina <= 0) {
    player.maxStamina = 0;
    player.stamina = 0;
    player.isExhausted = false;
    return;
  }

  player.stamina = clampStamina(player.stamina, player.maxStamina);

  if (shouldEnterExhaustion(player.stamina, player.maxStamina)) {
    player.isExhausted = true;
    return;
  }

  if (player.isExhausted && shouldLeaveExhaustion(player.stamina, player.maxStamina)) {
    player.isExhausted = false;
    return;
  }

  if (!player.isExhausted && player.stamina >= player.maxStamina) {
    player.isExhausted = false;
  }
}

function updateStaminaCapacity(
  player: Player,
  newMaxStamina: number,
  options: { preserveRatio?: boolean } = {}
): void {
  const preserveRatio = options.preserveRatio ?? true;
  const sanitizedMax = Number.isFinite(newMaxStamina) && newMaxStamina > 0
    ? Math.floor(newMaxStamina)
    : 0;
  const previousMax = Number.isFinite(player.maxStamina) && player.maxStamina > 0
    ? player.maxStamina
    : 0;

  let nextStamina: number;

  if (!preserveRatio || previousMax === 0 || sanitizedMax === 0) {
    nextStamina = sanitizedMax;
  } else {
    const ratio = Math.max(0, Math.min(1, clampStamina(player.stamina, previousMax) / previousMax));
    nextStamina = Math.floor(sanitizedMax * ratio);
  }

  player.maxStamina = sanitizedMax;
  player.stamina = sanitizedMax === 0 ? 0 : clampStamina(nextStamina, sanitizedMax);
  updateExhaustionState(player);
}

function ensureStaminaFields(player: Player): void {
  if (!Number.isFinite(player.maxStamina) || player.maxStamina < 0) {
    player.maxStamina = calculateMaxStamina(player.skills.endurance);
  }

  if (!Number.isFinite(player.stamina)) {
    player.stamina = player.maxStamina;
  } else {
    player.stamina = clampStamina(player.stamina, player.maxStamina);
  }

  if (typeof player.isExhausted !== 'boolean') {
    player.isExhausted = false;
  }

  updateExhaustionState(player);
}

const ensureHotbar = (hotbar: (string | null)[] | undefined): (string | null)[] => {
  const base = hotbar ? [...hotbar] : [];
  while (base.length < HOTBAR_CAPACITY) {
    base.push(null);
  }
  return base.slice(0, HOTBAR_CAPACITY);
};

const getStackQuantity = (item: Item): number => {
  if (!item) {
    return 0;
  }

  if (!item.stackable) {
    return 1;
  }

  const rawQuantity = item.quantity ?? 1;
  if (!Number.isFinite(rawQuantity) || rawQuantity <= 0) {
    return 1;
  }

  return Math.floor(rawQuantity);
};

const deepClone = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const isWeaponItem = (item: Item): item is Weapon => {
  return (item as unknown as Record<string, unknown>).damage !== undefined;
};

const isArmorItem = (item: Item): item is Armor => {
  return (item as unknown as Record<string, unknown>).protection !== undefined;
};

type RepairScope = 'weapon' | 'armor' | 'any';

interface RepairCandidate {
  item: Item;
  ratio: number;
  equipped: boolean;
}

const collectRepairCandidates = (player: Player, scope: RepairScope): RepairCandidate[] => {
  const seen = new Set<string>();
  const candidates: RepairCandidate[] = [];

  const accept = (item: Item | undefined, equipped: boolean) => {
    if (!item || seen.has(item.id) || !item.durability) {
      return;
    }

    const max = item.durability.max;
    if (!Number.isFinite(max) || max <= 0) {
      return;
    }

    const current = item.durability.current;
    if (current >= max) {
      return;
    }

    if (scope === 'weapon' && !isWeaponItem(item)) {
      return;
    }

    if (scope === 'armor' && !isArmorItem(item)) {
      return;
    }

    const ratio = current <= 0 ? 0 : Math.max(0, Math.min(1, current / max));
    seen.add(item.id);
    candidates.push({ item, ratio, equipped });
  };

  accept(player.equipped.weapon, true);
  accept(player.equipped.secondaryWeapon, true);
  accept(player.equipped.meleeWeapon, true);
  accept(player.equipped.bodyArmor, true);
  accept(player.equipped.helmet, true);
  if (player.equippedSlots) {
    Object.values(player.equippedSlots).forEach((item) => accept(item, true));
  }

  player.inventory.items.forEach((entry) => accept(entry, false));

  return candidates;
};

const selectRepairTarget = (player: Player, scope: RepairScope): string | null => {
  const candidates = collectRepairCandidates(player, scope);
  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (a.ratio !== b.ratio) {
      return a.ratio - b.ratio;
    }
    if (a.equipped !== b.equipped) {
      return a.equipped ? -1 : 1;
    }
    return 0;
  });

  return candidates[0]?.item.id ?? null;
};

const resolveDefaultWeaponSlot = (item: Item): EquipmentSlot => {
  if (item.equipSlot) {
    return item.equipSlot;
  }

  const weapon = item as Weapon;
  const range = Number.isFinite(weapon.range) ? weapon.range : 0;
  if (range <= 1 || weapon.skillType === 'meleeCombat') {
    return 'meleeWeapon';
  }

  return 'primaryWeapon';
};

const sanitizeItemForPlayer = (item: Item | undefined, fallbackSlot?: EquipmentSlot): Item | undefined => {
  if (!item) {
    return item;
  }

  const sanitized: Item = { ...item };

  if (isWeaponItem(sanitized)) {
    const baseDurability = sanitized.durability;
    const max = Number.isFinite(baseDurability?.max) && (baseDurability?.max ?? 0) > 0
      ? Math.round(baseDurability!.max)
      : 100;
    const current = Number.isFinite(baseDurability?.current)
      ? Math.max(0, Math.round(baseDurability!.current))
      : max;
    sanitized.durability = {
      max,
      current: Math.min(max, current),
    };
    sanitized.equipSlot = fallbackSlot ?? resolveDefaultWeaponSlot(sanitized);
  } else if (isArmorItem(sanitized)) {
    const baseDurability = sanitized.durability;
    const max = Number.isFinite(baseDurability?.max) && (baseDurability?.max ?? 0) > 0
      ? Math.round(baseDurability!.max)
      : 120;
    const current = Number.isFinite(baseDurability?.current)
      ? Math.max(0, Math.round(baseDurability!.current))
      : max;
    sanitized.durability = {
      max,
      current: Math.min(max, current),
    };
    sanitized.equipSlot = fallbackSlot ?? 'bodyArmor';
  } else if (fallbackSlot) {
    sanitized.equipSlot = fallbackSlot;
  }

  if (sanitized.stackable) {
    const quantity = getStackQuantity(sanitized) || 1;
    sanitized.quantity = quantity;
    if (!Number.isFinite(sanitized.maxStack) || sanitized.maxStack === undefined || sanitized.maxStack <= 0) {
      sanitized.maxStack = Math.max(5, quantity);
    }
  } else {
    delete sanitized.quantity;
    delete sanitized.maxStack;
  }

  if (!Number.isFinite(sanitized.weight)) {
    sanitized.weight = 0;
  }

  if (!Number.isFinite(sanitized.value)) {
    sanitized.value = 0;
  }

  return sanitized;
};

const calculateInventoryWeight = (items: Item[]): number => {
  const total = items.reduce((sum, entry) => {
    const unitWeight = Number.isFinite(entry.weight) ? entry.weight : 0;
    return sum + unitWeight * getStackQuantity(entry);
  }, 0);

  return roundWeight(total);
};

const refreshInventoryMetrics = (player: Player): void => {
  player.inventory.items = player.inventory.items.map((entry) => sanitizeItemForPlayer(entry) ?? entry);
  const nextWeight = calculateInventoryWeight(player.inventory.items);
  const normalizedHotbar = ensureHotbar(player.inventory.hotbar);
  player.inventory = {
    ...player.inventory,
    currentWeight: nextWeight,
    hotbar: normalizedHotbar,
  };
  player.encumbrance = computeEncumbranceState(
    player.inventory.currentWeight,
    player.inventory.maxWeight,
    player.encumbrance
  );
};

const detachItemFromInventory = (player: Player, itemId: string): Item | undefined => {
  const index = player.inventory.items.findIndex((entry) => entry.id === itemId);
  if (index === -1) {
    return undefined;
  }

  const [item] = player.inventory.items.splice(index, 1);
  return item;
};

const resolveEquipSlot = (item: Item, explicit?: EquipmentSlot): EquipmentSlot | null => {
  if (explicit) {
    return explicit;
  }

  if (item.equipSlot) {
    return item.equipSlot;
  }

  if ('damage' in item) {
    return 'primaryWeapon';
  }

  if ('protection' in item) {
    return 'bodyArmor';
  }

  return null;
};

const placeEquippedItem = (player: Player, slot: EquipmentSlot, item?: Item): void => {
  switch (slot) {
    case 'primaryWeapon':
      player.equipped.weapon = item as Weapon | undefined;
      break;
    case 'secondaryWeapon':
      player.equipped.secondaryWeapon = item as Weapon | undefined;
      break;
    case 'meleeWeapon':
      player.equipped.meleeWeapon = item as Weapon | undefined;
      break;
    case 'bodyArmor':
      player.equipped.bodyArmor = item as Armor | undefined;
      player.equipped.armor = item as Armor | undefined;
      break;
    case 'helmet':
      player.equipped.helmet = item as Armor | undefined;
      break;
    case 'accessory1':
      player.equipped.accessory1 = item;
      break;
    case 'accessory2':
      player.equipped.accessory2 = item;
      break;
    default:
      break;
  }

  if (!player.equippedSlots) {
    player.equippedSlots = {};
  }

  if (item) {
    player.equippedSlots[slot] = item;
  } else if (player.equippedSlots) {
    delete player.equippedSlots[slot];
  }
};

const getEquippedItemBySlot = (player: Player, slot: EquipmentSlot): Item | undefined => {
  if (player.equippedSlots && player.equippedSlots[slot]) {
    return player.equippedSlots[slot];
  }

  switch (slot) {
    case 'primaryWeapon':
      return player.equipped.weapon;
    case 'secondaryWeapon':
      return player.equipped.secondaryWeapon;
    case 'meleeWeapon':
      return player.equipped.meleeWeapon;
    case 'bodyArmor':
      return player.equipped.bodyArmor ?? player.equipped.armor;
    case 'helmet':
      return player.equipped.helmet;
    case 'accessory1':
      return player.equipped.accessory1;
    case 'accessory2':
      return player.equipped.accessory2;
    default:
      return undefined;
  }
};

const cloneItem = <TItem extends Item>(item: TItem): TItem => ({ ...item });

type LocatedItem =
  | { location: 'inventory'; item: Item; index: number }
  | { location: 'equipped'; item: Item; slot: EquipmentSlot };

const findItemAcrossPlayer = (player: Player, itemId: string): LocatedItem | undefined => {
  const inventoryIndex = player.inventory.items.findIndex((entry) => entry.id === itemId);
  if (inventoryIndex !== -1) {
    return {
      location: 'inventory',
      item: player.inventory.items[inventoryIndex],
      index: inventoryIndex,
    };
  }

  for (const slot of EQUIPMENT_SLOTS) {
    const equippedItem = getEquippedItemBySlot(player, slot);
    if (equippedItem && equippedItem.id === itemId) {
      return {
        location: 'equipped',
        item: equippedItem,
        slot,
      };
    }
  }

  return undefined;
};

const equipItemInternal = (player: Player, payload: EquipItemPayload): boolean => {
  const { itemId, slot: explicitSlot } = payload;
  const inventoryItem = player.inventory.items.find((entry) => entry.id === itemId);

  if (!inventoryItem) {
    return false;
  }

  if (inventoryItem.isQuestItem) {
    return false;
  }

  if (inventoryItem.stackable) {
    return false;
  }

  if (inventoryItem.durability && inventoryItem.durability.current <= 0) {
    return false;
  }

  const slot = resolveEquipSlot(inventoryItem, explicitSlot);
  if (!slot) {
    return false;
  }

  const asWeapon = 'damage' in inventoryItem ? (inventoryItem as Weapon) : undefined;

  if (slot === 'secondaryWeapon') {
    if (asWeapon && isTwoHandedWeapon(asWeapon)) {
      return false;
    }

    const primaryWeapon = getEquippedItemBySlot(player, 'primaryWeapon') as Weapon | undefined;
    if (isTwoHandedWeapon(primaryWeapon)) {
      return false;
    }
  }

  const removedItem = detachItemFromInventory(player, itemId);
  if (!removedItem) {
    return false;
  }

  const previouslyEquipped = getEquippedItemBySlot(player, slot);
  if (previouslyEquipped) {
    player.inventory.items.push(cloneItem(previouslyEquipped));
  }

  if (
    slot === 'primaryWeapon' &&
    'damage' in removedItem &&
    isTwoHandedWeapon(removedItem as Weapon)
  ) {
    const secondaryEquipped = getEquippedItemBySlot(player, 'secondaryWeapon') as Weapon | undefined;
    if (secondaryEquipped) {
      player.inventory.items.push(cloneItem(secondaryEquipped));
      placeEquippedItem(player, 'secondaryWeapon', undefined);
      if (player.activeWeaponSlot === 'secondaryWeapon') {
        player.activeWeaponSlot = 'primaryWeapon';
      }
    }
  }

  placeEquippedItem(player, slot, removedItem);

  if (slot === 'primaryWeapon' || slot === 'secondaryWeapon' || slot === 'meleeWeapon') {
    player.activeWeaponSlot = slot;
  }

  refreshInventoryMetrics(player);
  return true;
};

const unequipItemInternal = (player: Player, payload: UnequipItemPayload): boolean => {
  const { slot } = payload;
  const equippedItem = getEquippedItemBySlot(player, slot);

  if (!equippedItem) {
    return false;
  }

  player.inventory.items.push(cloneItem(equippedItem));
  placeEquippedItem(player, slot, undefined);

  if (slot === player.activeWeaponSlot) {
    player.activeWeaponSlot = 'primaryWeapon';
  }

  refreshInventoryMetrics(player);
  return true;
};

const repairItemInternal = (player: Player, payload: RepairItemPayload): boolean => {
  const { itemId, amount } = payload;

  if (!Number.isFinite(amount) || amount <= 0) {
    return false;
  }

  const located = findItemAcrossPlayer(player, itemId);
  if (!located) {
    return false;
  }

  if (!located.item.durability) {
    return false;
  }

  const repairAmount = Math.floor(amount);
  const durability = located.item.durability;
  durability.current = Math.min(durability.max, durability.current + repairAmount);

  if (located.location === 'equipped') {
    placeEquippedItem(player, located.slot, located.item);
  }

  return true;
};

const splitStackInternal = (player: Player, payload: SplitStackPayload): Item | undefined => {
  const { itemId, quantity } = payload;

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return undefined;
  }

  const located = findItemAcrossPlayer(player, itemId);
  if (!located || located.location !== 'inventory') {
    return undefined;
  }

  const sourceItem = located.item;

  if (!sourceItem.stackable) {
    return undefined;
  }

  const available = getStackQuantity(sourceItem);
  const splitAmount = Math.floor(quantity);

  if (splitAmount >= available) {
    return undefined;
  }

  const newItem = cloneItem(sourceItem);
  newItem.id = uuidv4();
  newItem.quantity = splitAmount;

  const remaining = available - splitAmount;
  sourceItem.quantity = remaining <= 1 ? undefined : remaining;
  if (sourceItem.quantity === undefined) {
    delete sourceItem.quantity;
  }

  player.inventory.items.push(newItem);
  refreshInventoryMetrics(player);

  return newItem;
};

const assignHotbarSlotInternal = (player: Player, payload: AssignHotbarPayload): boolean => {
  const { slotIndex, itemId } = payload;

  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= HOTBAR_CAPACITY) {
    return false;
  }

  player.inventory.hotbar = ensureHotbar(player.inventory.hotbar);

  if (itemId !== null) {
    const located = findItemAcrossPlayer(player, itemId);
    if (!located || located.location !== 'inventory') {
      return false;
    }

    player.inventory.hotbar = player.inventory.hotbar.map((entry, index) =>
      entry === itemId && index !== slotIndex ? null : entry
    );

    player.inventory.hotbar[slotIndex] = itemId;
  } else {
    player.inventory.hotbar[slotIndex] = null;
  }

  return true;
};

const consumeInventoryItemInternal = (player: Player, itemId: string): boolean => {
  player.inventory.hotbar = ensureHotbar(player.inventory.hotbar);

  const itemIndex = player.inventory.items.findIndex((entry) => entry.id === itemId);
  if (itemIndex === -1) {
    return false;
  }

  const candidate = player.inventory.items[itemIndex] as Item;
  if (!candidate || !('effect' in candidate)) {
    return false;
  }

  const consumable = candidate as Consumable;

  const effect = consumable.effect;

  let repairTargetId: string | null = null;
  let repairAmount = 0;

  if (effect.type === 'repair') {
    repairAmount = Math.floor(effect.value ?? 0);
    if (repairAmount <= 0) {
      return false;
    }

    repairTargetId = selectRepairTarget(player, effect.target ?? 'any');
    if (!repairTargetId) {
      return false;
    }
  }

  let removed = false;

  if (candidate.stackable) {
    const available = getStackQuantity(candidate);
    if (available <= 1) {
      player.inventory.items.splice(itemIndex, 1);
      removed = true;
    } else {
      const nextQuantity = available - 1;
      if (nextQuantity <= 1) {
        delete consumable.quantity;
      } else {
        consumable.quantity = nextQuantity;
      }
    }
  } else {
    player.inventory.items.splice(itemIndex, 1);
    removed = true;
  }

  if (removed) {
    player.inventory.hotbar = player.inventory.hotbar.map((entry) => (entry === itemId ? null : entry));
  }

  switch (effect.type) {
    case 'health': {
      const nextHealth = Number.isFinite(effect.value) ? effect.value : 0;
      player.health = Math.min(player.maxHealth, Math.max(0, player.health + nextHealth));
      break;
    }
    case 'actionPoints': {
      const nextAp = Number.isFinite(effect.value) ? effect.value : 0;
      player.actionPoints = Math.min(
        player.maxActionPoints,
        Math.max(0, player.actionPoints + nextAp)
      );
      break;
    }
    case 'stat': {
      if (effect.statAffected) {
        const current = player.skills[effect.statAffected] ?? 0;
        const delta = Number.isFinite(effect.value) ? effect.value : 0;
        player.skills[effect.statAffected] = current + delta;
      }
      break;
    }
    case 'repair': {
      if (repairTargetId) {
        repairItemInternal(player, {
          itemId: repairTargetId,
          amount: repairAmount,
        });
      }
      break;
    }
    default:
      break;
  }

  refreshInventoryMetrics(player);

  return true;
};

const applyStartingItem = (player: Player, item: StartingItemDefinition): void => {
  switch (item.type) {
    case 'catalog': {
      const instance = instantiateItem(item.definitionId, {
        quantity: item.quantity,
        durability: item.durability,
      });

      if (item.equip) {
        const slot = resolveEquipSlot(instance);
        if (slot) {
          placeEquippedItem(player, slot, instance);
          if (slot === 'primaryWeapon' || slot === 'secondaryWeapon' || slot === 'meleeWeapon') {
            player.activeWeaponSlot = slot;
          }
          break;
        }
      }

      player.inventory.items.push(instance);
      break;
    }
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
        placeEquippedItem(player, 'primaryWeapon', weapon);
      } else {
        player.inventory.items.push(weapon);
      }
      break;
    }
    case 'armor': {
      const armor = createArmor(item.name, item.protection, item.weight, item.statModifiers);
      if (item.equip) {
        placeEquippedItem(player, 'bodyArmor', armor);
      } else {
        player.inventory.items.push(armor);
      }
      break;
    }
    case 'consumable': {
      const consumable = createConsumable(
        item.name,
        item.effectType,
        item.value,
        {
          statAffected: item.statAffected,
          weight: item.weight,
          target: item.target,
          stackable: item.stackable,
          maxStack: item.maxStack,
          quantity: item.quantity,
        }
      );
      player.inventory.items.push(consumable);
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
      break;
    }
    default:
      break;
  }

  refreshInventoryMetrics(player);
};

export const playerSlice = createSlice({
  name: 'player',
  initialState: initialPlayerState,
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
      freshPlayer.maxStamina = derived.maxStamina;
      freshPlayer.stamina = derived.maxStamina;
      freshPlayer.isExhausted = false;
      updateExhaustionState(freshPlayer);
      freshPlayer.inventory = {
        items: [],
        maxWeight: derived.carryWeight,
        currentWeight: 0,
        hotbar: [null, null, null, null, null],
      };
      freshPlayer.equipped = {
        weapon: undefined,
        armor: undefined,
        accessory: undefined,
        secondaryWeapon: undefined,
        meleeWeapon: undefined,
        bodyArmor: undefined,
        helmet: undefined,
        accessory1: undefined,
        accessory2: undefined,
      };
      freshPlayer.equippedSlots = {};
      freshPlayer.activeWeaponSlot = 'primaryWeapon';
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
          const key = faction as FactionId;
          const adjustment = value ?? 0;
          const current = freshPlayer.factionReputation[key] ?? 0;
          freshPlayer.factionReputation[key] = clampFactionReputation(current + adjustment);
        });

        background.startingEquipment.forEach((item) => applyStartingItem(freshPlayer, item));
      }

      state.data = freshPlayer;
      state.data.encumbrance = {
        level: 'normal',
        percentage: 0,
        movementApMultiplier: 1,
        attackApMultiplier: 1,
      };
    },

    adjustFactionReputation: (
      state,
      action: PayloadAction<AdjustFactionReputationPayload>
    ) => {
      const { factionId, delta, reason, source } = action.payload;
      if (!Number.isFinite(delta) || delta === 0) {
        return;
      }

      const result = applyFactionDelta(state.data.factionReputation, factionId, delta);
      state.data.factionReputation = { ...result.values };
      recordFactionAdjustment(state, factionId, result, { reason, source });
    },

    setFactionReputation: (
      state,
      action: PayloadAction<SetFactionReputationPayload>
    ) => {
      const { factionId, value, reason, source } = action.payload;
      const result = setFactionReputationHelper(state.data.factionReputation, factionId, value);
      state.data.factionReputation = { ...result.values };
      recordFactionAdjustment(state, factionId, result, { reason, source });
    },

    consumeFactionReputationEvents: (state) => {
      state.pendingFactionEvents = [];
    },

    // Move player to a new position
    movePlayer: (state, action: PayloadAction<Position>) => {
      if (state.data.encumbrance.level === 'immobile') {
        return;
      }
      const previous = state.data.position;
      state.data.position = action.payload;
      if (previous) {
        const dx = action.payload.x - previous.x;
        const dy = action.payload.y - previous.y;
        if (dx !== 0 || dy !== 0) {
          if (Math.abs(dx) >= Math.abs(dy)) {
            state.data.facing = dx >= 0 ? 'east' : 'west';
          } else {
            state.data.facing = dy >= 0 ? 'south' : 'north';
          }
        }
      }
      state.data.coverOrientation = null;
      state.data.suppression = state.data.suppression ?? 0;
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

    consumeStamina: (state, action: PayloadAction<number>) => {
      ensureStaminaFields(state.data);

      const rawCost = action.payload;
      if (!Number.isFinite(rawCost) || rawCost <= 0) {
        return;
      }

      const cost = Math.max(0, Math.floor(rawCost));
      state.data.stamina = clampStamina(state.data.stamina - cost, state.data.maxStamina);
      updateExhaustionState(state.data);
    },

    regenerateStamina: (state, action: PayloadAction<number | undefined>) => {
      ensureStaminaFields(state.data);

      const rawAmount = action.payload ?? STAMINA_REGEN_OUT_OF_COMBAT;
      if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        updateExhaustionState(state.data);
        return;
      }

      const amount = Math.max(0, Math.floor(rawAmount));
      state.data.stamina = clampStamina(state.data.stamina + amount, state.data.maxStamina);
      updateExhaustionState(state.data);
    },

    updateMaxStamina: (state) => {
      ensureStaminaFields(state.data);
      const recalculated = calculateMaxStamina(state.data.skills.endurance);
      updateStaminaCapacity(state.data, recalculated, { preserveRatio: true });
    },

    // Add experience and automatically process level-ups
    addExperience: (state, action: PayloadAction<AddExperiencePayload>) => {
      const payload = typeof action.payload === 'number'
        ? { amount: action.payload }
        : action.payload;

      const amount = payload.amount;
      if (!Number.isFinite(amount) || amount === 0) {
        return;
      }

      // Award XP
      state.data = awardXPHelper(state.data, amount);

      // Check for level-up and process
      const result = processLevelUp(state.data);
      state.data = result.player;
      ensureStaminaFields(state.data);

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
        updateStaminaCapacity(state.data, calculateMaxStamina(state.data.skills.endurance), {
          preserveRatio: false,
        });
      }

      if (amount > 0) {
        const reason = payload.reason ?? 'Experience gained';
        const currentNotifications = state.xpNotifications ?? [];
        state.xpNotifications = [
          ...currentNotifications,
          createXPNotification(amount, reason),
        ];
      }

      // Perk choices are queued via pendingPerkSelections and resolved through UI flow
    },

    // Add credits (currency)
    addCredits: (state, action: PayloadAction<number>) => {
      state.data.credits = Math.max(0, state.data.credits + action.payload);
    },

    setKarma: (state, action: PayloadAction<number>) => {
      const clamped = Math.max(-1000, Math.min(1000, action.payload));
      state.data.karma = clamped;
      state.data.personality.lastUpdated = Date.now();
      state.data.personality.lastChangeSource = 'karma:set';
    },

    adjustKarma: (state, action: PayloadAction<number>) => {
      const clamped = Math.max(-1000, Math.min(1000, state.data.karma + action.payload));
      state.data.karma = clamped;
      state.data.personality.lastUpdated = Date.now();
      state.data.personality.lastChangeSource = 'karma:adjust';
    },

    removeXPNotification: (state, action: PayloadAction<string>) => {
      const currentNotifications = state.xpNotifications ?? [];
      state.xpNotifications = currentNotifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    
    // Level up the player
    levelUp: (state) => {
      state.data.level += 1;
      state.data.maxHealth += 10;
      state.data.health = state.data.maxHealth; // Full health on level up
      state.data.maxActionPoints += 1;
      state.data.actionPoints = state.data.maxActionPoints; // Full AP on level up
      const recalculated = calculateMaxStamina(state.data.skills.endurance);
      updateStaminaCapacity(state.data, recalculated, { preserveRatio: false });
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
      const newMaxStamina = calculateMaxStamina(skills.endurance);

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

      // Update stamina capacity (preserve ratio)
      updateStaminaCapacity(state.data, newMaxStamina, { preserveRatio: true });
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
      updateStaminaCapacity(state.data, calculateMaxStamina(skills.endurance), { preserveRatio: false });
    },
    
    // Add item to inventory
    addItem: (state, action: PayloadAction<Item>) => {
      state.data.inventory.items.push(action.payload);
      refreshInventoryMetrics(state.data);
    },
    
    // Remove item from inventory
    removeItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const removed = detachItemFromInventory(state.data, itemId);
      if (removed) {
        refreshInventoryMetrics(state.data);
      }
    },
    
    // Reset player to default
    resetPlayer: (state) => {
      state.version = PLAYER_STATE_VERSION;
      state.data = createFreshPlayer();
      state.pendingLevelUpEvents = [];
      state.xpNotifications = [];
      state.pendingFactionEvents = [];
    },

    // Set the entire player data object (useful after complex operations)
    setPlayerData: (state, action: PayloadAction<Player>) => {
      const clonedPlayer = deepClone(action.payload) as Player;
      state.version = PLAYER_STATE_VERSION;
      state.data = clonedPlayer;

      if (typeof state.data.isCrouching !== 'boolean') {
        state.data.isCrouching = false;
      }

      if (!state.data.factionReputation) {
        state.data.factionReputation = { ...DEFAULT_PLAYER.factionReputation };
      }

      (['resistance', 'corpsec', 'scavengers'] as FactionId[]).forEach((factionId) => {
        const fallback = DEFAULT_PLAYER.factionReputation[factionId] ?? 0;
        const current = state.data.factionReputation[factionId];
        state.data.factionReputation[factionId] = clampFactionReputation(
          typeof current === 'number' ? current : fallback
        );
      });

      state.pendingFactionEvents = [];

      if (!state.data.perkRuntime) {
        state.data.perkRuntime = {
          gunFuShotsThisTurn: 0,
          adrenalineRushTurnsRemaining: 0,
          ghostInvisibilityTurns: 0,
          ghostConsumed: false,
        };
      }

      if (!state.data.inventory.hotbar) {
        state.data.inventory.hotbar = [null, null, null, null, null];
      }

      if (!state.data.equipped) {
        state.data.equipped = {} as Player['equipped'];
      } else {
        state.data.equipped = { ...state.data.equipped } as Player['equipped'];
      }

      if (!state.data.equippedSlots) {
        state.data.equippedSlots = {};
      }

      if (!state.data.activeWeaponSlot) {
        state.data.activeWeaponSlot = 'primaryWeapon';
      }

      if (!state.data.encumbrance) {
        state.data.encumbrance = {
          level: 'normal',
          percentage: 0,
          movementApMultiplier: 1,
          attackApMultiplier: 1,
        };
      }

      if (!state.data.personality) {
        state.data.personality = createDefaultPersonalityProfile();
      } else {
        const flags = state.data.personality.flags ?? {};
        state.data.personality = {
          ...state.data.personality,
          flags: {
            earnest: flags.earnest ?? 0,
            sarcastic: flags.sarcastic ?? 0,
            ruthless: flags.ruthless ?? 0,
            stoic: flags.stoic ?? 0,
          },
          lastUpdated: state.data.personality.lastUpdated ?? 0,
        };
      }

      state.data.inventory.items = state.data.inventory.items.map((entry) => sanitizeItemForPlayer(entry) ?? entry);
      state.data.equipped.weapon = sanitizeItemForPlayer(state.data.equipped.weapon, 'primaryWeapon') as Weapon | undefined;
      state.data.equipped.secondaryWeapon = sanitizeItemForPlayer(
        state.data.equipped.secondaryWeapon,
        'secondaryWeapon'
      ) as Weapon | undefined;
      state.data.equipped.meleeWeapon = sanitizeItemForPlayer(
        state.data.equipped.meleeWeapon,
        'meleeWeapon'
      ) as Weapon | undefined;
      state.data.equipped.bodyArmor = sanitizeItemForPlayer(
        state.data.equipped.bodyArmor,
        'bodyArmor'
      ) as Armor | undefined;
      state.data.equipped.helmet = sanitizeItemForPlayer(
        state.data.equipped.helmet,
        'helmet'
      ) as Armor | undefined;
      state.data.equipped.accessory1 = sanitizeItemForPlayer(
        state.data.equipped.accessory1,
        'accessory1'
      );
      state.data.equipped.accessory2 = sanitizeItemForPlayer(
        state.data.equipped.accessory2,
        'accessory2'
      );

      const equippedSlots = state.data.equippedSlots ?? {};
      state.data.equippedSlots = equippedSlots;

      Object.entries(equippedSlots).forEach(([slot, value]) => {
        if (!value) {
          return;
        }
        const sanitized = sanitizeItemForPlayer(value, slot as EquipmentSlot);
        equippedSlots[slot as EquipmentSlot] = sanitized as Item;
      });

      ensureStaminaFields(state.data);
      refreshInventoryMetrics(state.data);

      if (shouldTriggerAdrenalineRush(state.data)) {
        state.data = activateAdrenalineRush(state.data);
      }
    },

    setCrouching: (state, action: PayloadAction<boolean>) => {
      state.data.isCrouching = action.payload;
    },

    equipItem: (state, action: PayloadAction<EquipItemPayload>) => {
      equipItemInternal(state.data, action.payload);
    },

    unequipItem: (state, action: PayloadAction<UnequipItemPayload>) => {
      unequipItemInternal(state.data, action.payload);
    },

    repairItem: (state, action: PayloadAction<RepairItemPayload>) => {
      repairItemInternal(state.data, action.payload);
    },

    splitStack: (state, action: PayloadAction<SplitStackPayload>) => {
      splitStackInternal(state.data, action.payload);
    },

    assignHotbarSlot: (state, action: PayloadAction<AssignHotbarPayload>) => {
      assignHotbarSlotInternal(state.data, action.payload);
      refreshInventoryMetrics(state.data);
    },

    useInventoryItem: (state, action: PayloadAction<string>) => {
      consumeInventoryItemInternal(state.data, action.payload);
    },

    // Equip a weapon
    equipWeapon: (state, action: PayloadAction<string>) => {
      equipItemInternal(state.data, { itemId: action.payload, slot: 'primaryWeapon' });
    },

    // Equip armor
    equipArmor: (state, action: PayloadAction<string>) => {
      equipItemInternal(state.data, { itemId: action.payload, slot: 'bodyArmor' });
    },

    // Unequip weapon
    unequipWeapon: (state) => {
      unequipItemInternal(state.data, { slot: 'primaryWeapon' });
    },

    // Unequip armor
    unequipArmor: (state) => {
      unequipItemInternal(state.data, { slot: 'bodyArmor' });
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
      const newMaxStamina = calculateMaxStamina(skills.endurance);

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

      updateStaminaCapacity(state.data, newMaxStamina, { preserveRatio: true });
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
      const newMaxStamina = calculateMaxStamina(skills.endurance);

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

      updateStaminaCapacity(state.data, newMaxStamina, { preserveRatio: true });
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
  consumeStamina,
  regenerateStamina,
  updateMaxStamina,
  addExperience,
  addCredits,
  setKarma,
  adjustKarma,
  adjustFactionReputation,
  setFactionReputation,
  consumeFactionReputationEvents,
  removeXPNotification,
  levelUp,
  updateSkill,
  setSkill,
  addItem,
  removeItem,
  equipItem,
  unequipItem,
  repairItem,
  splitStack,
  assignHotbarSlot,
  useInventoryItem,
  resetPlayer,
  setPlayerData,
  setCrouching,
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
