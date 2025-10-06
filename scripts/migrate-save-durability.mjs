#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const PENALTIES = {
  normal: { movement: 1, attack: 1 },
  heavy: { movement: 1.25, attack: 1.1 },
  overloaded: { movement: 2, attack: 1.25 },
  immobile: { movement: Number.POSITIVE_INFINITY, attack: Number.POSITIVE_INFINITY },
};

const roundWeight = (value) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

const isWeapon = (item) => item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'damage');
const isArmor = (item) => item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'protection');

const defaultWeaponSlot = (item) => {
  if (!item) {
    return undefined;
  }
  if (item.equipSlot) {
    return item.equipSlot;
  }
  const range = Number.isFinite(item.range) ? item.range : 0;
  if (isWeapon(item) && (range <= 1 || item.skillType === 'meleeCombat')) {
    return 'meleeWeapon';
  }
  return 'primaryWeapon';
};

const ensureDurability = (item) => {
  if (!item || typeof item !== 'object') {
    return;
  }

  if (isWeapon(item) || isArmor(item)) {
    const defaultMax = isArmor(item) ? 120 : 100;
    const max = Number.isFinite(item?.durability?.max) && item.durability.max > 0
      ? Math.round(item.durability.max)
      : defaultMax;
    const current = Number.isFinite(item?.durability?.current)
      ? Math.max(0, Math.round(item.durability.current))
      : max;
    item.durability = { max, current: Math.min(max, current) };
  }
};

const ensureEquipSlot = (item, fallbackSlot) => {
  if (!item || typeof item !== 'object') {
    return;
  }
  if (item.equipSlot) {
    return;
  }
  if (fallbackSlot) {
    item.equipSlot = fallbackSlot;
    return;
  }
  if (isWeapon(item)) {
    item.equipSlot = defaultWeaponSlot(item);
    return;
  }
  if (isArmor(item)) {
    item.equipSlot = 'bodyArmor';
  }
};

const ensureStackingFields = (item) => {
  if (!item || typeof item !== 'object') {
    return;
  }
  if (item.stackable) {
    const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 1;
    item.quantity = quantity;
    if (!Number.isFinite(item.maxStack) || item.maxStack <= 0) {
      item.maxStack = Math.max(1, quantity, 5);
    }
  } else {
    delete item.quantity;
    delete item.maxStack;
  }
};

const migrateItem = (item, fallbackSlot) => {
  if (!item || typeof item !== 'object') {
    return item;
  }

  ensureDurability(item);
  ensureEquipSlot(item, fallbackSlot);
  ensureStackingFields(item);

  if (!Number.isFinite(item.weight)) {
    item.weight = 0;
  }

  if (!Number.isFinite(item.value)) {
    item.value = 0;
  }

  return item;
};

const ensureHotbar = (hotbar = []) => {
  const normalized = [...hotbar];
  while (normalized.length < 5) {
    normalized.push(null);
  }
  return normalized.slice(0, 5);
};

const computeInventoryWeight = (items = []) => {
  return roundWeight(items.reduce((total, entry) => {
    if (!entry || typeof entry !== 'object') {
      return total;
    }
    const quantity = entry.stackable ? (Number.isFinite(entry.quantity) && entry.quantity > 0 ? entry.quantity : 1) : 1;
    const weight = Number.isFinite(entry.weight) ? entry.weight : 0;
    return total + weight * quantity;
  }, 0));
};

const resolveEncumbranceLevel = (percentage) => {
  if (percentage >= 120) {
    return 'immobile';
  }
  if (percentage >= 100) {
    return 'overloaded';
  }
  if (percentage >= 80) {
    return 'heavy';
  }
  return 'normal';
};

const computeEncumbrance = (currentWeight, maxWeight) => {
  const base = maxWeight > 0 ? (currentWeight / maxWeight) * 100 : 0;
  const percentage = roundWeight(base);
  const level = resolveEncumbranceLevel(percentage);
  const penalties = PENALTIES[level] ?? PENALTIES.normal;
  return {
    level,
    percentage,
    movementApMultiplier: penalties.movement,
    attackApMultiplier: penalties.attack,
  };
};

const migrateInventory = (player) => {
  if (!player.inventory) {
    player.inventory = { items: [], maxWeight: 0, currentWeight: 0, hotbar: [null, null, null, null, null] };
  }

  player.inventory.items = (player.inventory.items ?? []).map((item) => migrateItem(item));
  player.inventory.hotbar = ensureHotbar(player.inventory.hotbar);
  const maxWeight = Number.isFinite(player.inventory.maxWeight) ? player.inventory.maxWeight : 0;
  player.inventory.maxWeight = maxWeight;
  player.inventory.currentWeight = computeInventoryWeight(player.inventory.items);
};

const migrateEquipped = (player) => {
  if (!player.equipped) {
    player.equipped = {};
  }

  player.equipped.weapon = migrateItem(player.equipped.weapon, 'primaryWeapon');
  player.equipped.secondaryWeapon = migrateItem(player.equipped.secondaryWeapon, 'secondaryWeapon');
  player.equipped.meleeWeapon = migrateItem(player.equipped.meleeWeapon, 'meleeWeapon');
  player.equipped.bodyArmor = migrateItem(player.equipped.bodyArmor, 'bodyArmor');
  player.equipped.helmet = migrateItem(player.equipped.helmet, 'helmet');
  player.equipped.accessory1 = migrateItem(player.equipped.accessory1, 'accessory1');
  player.equipped.accessory2 = migrateItem(player.equipped.accessory2, 'accessory2');
};

const migrateEquippedSlots = (player) => {
  if (!player.equippedSlots || typeof player.equippedSlots !== 'object') {
    player.equippedSlots = {};
  }

  Object.entries(player.equippedSlots).forEach(([slot, item]) => {
    migrateItem(item, slot);
  });
};

const migratePlayer = (player) => {
  if (!player || typeof player !== 'object') {
    return;
  }

  migrateInventory(player);
  migrateEquipped(player);
  migrateEquippedSlots(player);

  const currentWeight = player.inventory.currentWeight ?? 0;
  const maxWeight = player.inventory.maxWeight ?? 0;
  player.encumbrance = computeEncumbrance(currentWeight, maxWeight);
  if (!player.activeWeaponSlot) {
    player.activeWeaponSlot = 'primaryWeapon';
  }
};

const migrateState = (state) => {
  if (!state || typeof state !== 'object') {
    return state;
  }

  if (state.player?.data) {
    migratePlayer(state.player.data);
  }

  return state;
};

const usage = () => {
  console.log('Usage: node migrate-save-durability.mjs <input.json> [output.json]');
  console.log('If no output path is supplied, the script overwrites the input file in place.');
};

const [inputArg, outputArg] = process.argv.slice(2);

if (!inputArg) {
  usage();
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);
const outputPath = outputArg ? path.resolve(process.cwd(), outputArg) : inputPath;

if (!fs.existsSync(inputPath)) {
  console.error(`[migrate] Input file not found: ${inputPath}`);
  process.exit(1);
}

try {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(raw);
  const migrated = migrateState(parsed);
  fs.writeFileSync(outputPath, JSON.stringify(migrated, null, 2));
  console.log(`[migrate] Wrote migrated state to ${outputPath}`);
} catch (error) {
  console.error('[migrate] Failed to migrate state:', error.message);
  process.exit(1);
}
