import { Enemy, Player, Position, MapArea, Weapon, Armor } from '../interfaces/types';
import { isPositionWalkable } from '../world/grid';
import {
  calculateDerivedStatsWithEquipment,
  calculateDerivedStats,
} from '../systems/statCalculations';
import {
  getEquippedBonuses,
  getEffectiveDamage,
  applyArmorReduction,
  getEffectiveArmorRating,
} from '../systems/equipmentEffects';
import {
  calculateEnergyWeaponsBonuses,
  calculateExplosivesBonuses,
  calculateMeleeCombatBonuses,
  calculateSmallGunsHitBonus,
  getPlayerSkillValue,
  resolveWeaponSkillType,
} from '../systems/skillTree';
import {
  playerHasPerk,
  getRangedHitBonusFromPerks,
  shouldGunFuAttackBeFree,
  registerGunFuAttack,
  isRangedWeapon,
} from '../systems/perks';
import { isMovementBlockedByEncumbrance } from '../inventory/encumbrance';

// Constants
export const DEFAULT_ATTACK_DAMAGE = 5;
export const DEFAULT_ATTACK_COST = 1;
export const DEFAULT_MOVEMENT_COST = 1;
export const COVER_DAMAGE_REDUCTION = 0.5;

export type RandomGenerator = () => number;

let randomGenerator: RandomGenerator = () => Math.random();

export const setRandomGenerator = (generator?: RandomGenerator): void => {
  randomGenerator = generator ?? (() => Math.random());
};

const getRandomRoll = (): number => {
  const roll = randomGenerator();

  if (!Number.isFinite(roll) || Number.isNaN(roll)) {
    throw new Error('[CombatSystem] Random generator must return a finite number between 0 and 1.');
  }

  if (roll < 0 || roll > 1) {
    throw new Error('[CombatSystem] Random generator must return a value between 0 and 1.');
  }

  return roll;
};

export type CombatEventType = 'weaponDamaged' | 'weaponBroken' | 'armorDamaged' | 'armorBroken';

export interface CombatEvent {
  type: CombatEventType;
  message: string;
}

const clonePlayerState = (player: Player): Player => ({
  ...player,
  equipped: { ...player.equipped },
  encumbrance: { ...player.encumbrance },
  inventory: {
    ...player.inventory,
    items: [...player.inventory.items],
    hotbar: [...player.inventory.hotbar],
  },
  equippedSlots: player.equippedSlots ? { ...player.equippedSlots } : {},
  perkRuntime: { ...player.perkRuntime },
});

const DURABILITY_CRITICAL_THRESHOLD = 0.25;

const getDurabilityRatio = (item?: Weapon | Armor): number => {
  const durability = item?.durability;
  if (!durability || durability.max <= 0) {
    return 1;
  }

  const ratio = durability.current / durability.max;
  if (!Number.isFinite(ratio)) {
    return 1;
  }

  return Math.max(0, Math.min(1, ratio));
};

const getDurabilityModifier = (item?: Weapon | Armor): number => {
  const ratio = getDurabilityRatio(item);

  if (ratio <= 0) {
    return 0;
  }

  if (ratio <= DURABILITY_CRITICAL_THRESHOLD) {
    return 0.75;
  }

  if (ratio <= 0.5) {
    return 0.9;
  }

  return 1;
};

const decayDurability = <TItem extends Weapon | Armor>(item: TItem, amount = 1): TItem => {
  if (!item.durability) {
    return item;
  }

  const nextCurrent = Math.max(0, item.durability.current - amount);
  return {
    ...item,
    durability: {
      ...item.durability,
      current: nextCurrent,
    },
  };
};

const pushDurabilityEvents = (
  events: CombatEvent[],
  kind: 'weapon' | 'armor',
  itemName: string,
  previousRatio: number,
  nextRatio: number
): void => {
  if (previousRatio > 0 && nextRatio === 0) {
    events.push({
      type: kind === 'weapon' ? 'weaponBroken' : 'armorBroken',
      message:
        kind === 'weapon'
          ? `${itemName} has broken—switch weapons or repair it to continue fighting.`
          : `${itemName} is shredded! Incoming damage will hit you directly.`,
    });
    return;
  }

  if (
    previousRatio > DURABILITY_CRITICAL_THRESHOLD &&
    nextRatio <= DURABILITY_CRITICAL_THRESHOLD &&
    nextRatio > 0
  ) {
    events.push({
      type: kind === 'weapon' ? 'weaponDamaged' : 'armorDamaged',
      message:
        kind === 'weapon'
          ? `${itemName} is about to fail. Repair it soon to avoid misfires.`
          : `${itemName} can barely absorb hits—seek repairs immediately.`,
    });
  }
};

const resolveEncumberedAttackCost = (player: Player, baseCost: number): number => {
  const encumbrance = player.encumbrance;
  const multiplier = encumbrance?.attackApMultiplier ?? 1;

  if (!Number.isFinite(multiplier)) {
    return Number.POSITIVE_INFINITY;
  }

  const adjusted = Math.ceil(baseCost * Math.max(multiplier, 0));
  return Math.max(0, adjusted);
};

const resolveMovementCost = (entity: Player | Enemy): number => {
  if ('skills' in entity) {
    const player = entity as Player;
    if (isMovementBlockedByEncumbrance(player.encumbrance)) {
      return Number.POSITIVE_INFINITY;
    }

    const multiplier = player.encumbrance?.movementApMultiplier ?? 1;
    if (!Number.isFinite(multiplier)) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.max(1, Math.ceil(DEFAULT_MOVEMENT_COST * Math.max(multiplier, 0)));
  }

  return DEFAULT_MOVEMENT_COST;
};

const resolveAttackCost = (attacker: Player | Enemy): number => {
  if ('skills' in attacker) {
    const playerAttacker = attacker as Player;
    const baseCost = playerAttacker.equipped.weapon?.apCost ?? DEFAULT_ATTACK_COST;
    const clampedBase = Math.max(0, baseCost);

    if (shouldGunFuAttackBeFree(playerAttacker)) {
      return 0;
    }

    return resolveEncumberedAttackCost(playerAttacker, clampedBase);
  }

  return DEFAULT_ATTACK_COST;
};

// Types for combat actions
export type CombatAction = 
  | { type: 'move', targetPosition: Position, cost: number }
  | { type: 'attack', targetId: string, damage: number, cost: number };

// Check if entities are adjacent
export const areEntitiesAdjacent = (pos1: Position, pos2: Position): boolean => {
  const xDiff = Math.abs(pos1.x - pos2.x);
  const yDiff = Math.abs(pos1.y - pos2.y);
  return (xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1);
};

// Check if position is in attack range
export const isInAttackRange = (attacker: Position, target: Position, range: number): boolean => {
  // Validate range is a positive finite number
  if (!Number.isFinite(range) || range <= 0) {
    console.warn('[CombatSystem] Invalid attack range:', range);
    return false;
  }

  const distance = Math.sqrt(
    Math.pow(target.x - attacker.x, 2) + Math.pow(target.y - attacker.y, 2)
  );
  // Ensure distance is greater than 0 and within range
  return distance > 0 && distance <= range;
};

// Calculate distance between two positions
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(
    Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
  );
};

// Calculate manhattan distance (grid movement) between two positions
export const calculateManhattanDistance = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
};

// Calculate if attack hits based on cover
const getPlayerDerivedStats = (entity: Player) => {
  try {
    return calculateDerivedStatsWithEquipment(entity);
  } catch (error) {
    console.warn('[CombatSystem] Failed to calculate equipment-aware stats, falling back to base attributes.', error);
    return calculateDerivedStats(entity.skills);
  }
};

export const calculateHitChance = (
  attacker: Player | Enemy,
  target: Player | Enemy,
  isBehindCover: boolean
): number => {
  const distance = calculateDistance(attacker.position, target.position);

  // Start from a conservative baseline; distance and cover apply first.
  let hitChance = 0.65 - distance * 0.05;

  if (isBehindCover) {
    hitChance *= 1 - COVER_DAMAGE_REDUCTION;
  }

  // Player-based modifiers
  if ('skills' in attacker) {
    const playerAttacker = attacker as Player;
    const attackerStats = getPlayerDerivedStats(playerAttacker);
    hitChance += attackerStats.hitChanceModifier / 100;

    const weaponSkill = resolveWeaponSkillType(playerAttacker.equipped.weapon);
    const skillValue = getPlayerSkillValue(playerAttacker, weaponSkill);

    switch (weaponSkill) {
      case 'smallGuns': {
        hitChance += calculateSmallGunsHitBonus(skillValue) / 100;
        break;
      }
      case 'energyWeapons': {
        const bonuses = calculateEnergyWeaponsBonuses(skillValue);
        hitChance += bonuses.hit / 100;
        break;
      }
      case 'meleeCombat': {
        const bonuses = calculateMeleeCombatBonuses(skillValue);
        hitChance += bonuses.hit / 100;
        break;
      }
      case 'explosives': {
        const bonuses = calculateExplosivesBonuses(skillValue);
        hitChance += bonuses.accuracy / 100;
        break;
      }
      default:
        break;
    }

    if (isRangedWeapon(playerAttacker.equipped.weapon)) {
      hitChance += getRangedHitBonusFromPerks(playerAttacker);
    }
  }

  if ('skills' in target) {
    const targetStats = getPlayerDerivedStats(target as Player);
    hitChance -= targetStats.dodgeChance / 100;
  }

  const finalHitChance = Math.max(0.1, Math.min(0.95, hitChance));

  console.log('[CombatSystem] calculateHitChance:', {
    attacker: attacker.id,
    target: target.id,
    distance,
    isBehindCover,
    finalHitChance,
  });

  return finalHitChance;
};

// Execute an attack
export const executeAttack = (
  attacker: Player | Enemy,
  target: Player | Enemy,
  isBehindCover: boolean
): {
  success: boolean;
  damage: number;
  isCritical: boolean;
  newAttacker: Player | Enemy;
  newTarget: Player | Enemy;
  events?: CombatEvent[];
} => {
  const attackCost = resolveAttackCost(attacker);

  if (!Number.isFinite(attackCost) || attacker.actionPoints < attackCost) {
    return {
      success: false,
      damage: 0,
      isCritical: false,
      newAttacker: attacker,
      newTarget: target,
      events: undefined,
    };
  }

  if ('skills' in attacker) {
    const playerAttacker = attacker as Player;
    const equippedWeapon = playerAttacker.equipped.weapon;

    if (equippedWeapon?.durability && equippedWeapon.durability.current <= 0) {
      return {
        success: false,
        damage: 0,
        isCritical: false,
        newAttacker: attacker,
        newTarget: target,
        events: [
          {
            type: 'weaponBroken',
            message: `${equippedWeapon.name} is inoperable—repair or swap weapons before attacking.`,
          },
        ],
      };
    }
  }

  const events: CombatEvent[] = [];

  const hitChance = calculateHitChance(attacker, target, isBehindCover);
  const roll = getRandomRoll();
  const hit = roll <= hitChance;

  let damageAmount = 0;
  let isCritical = false;

  let attackerClone: Player | Enemy = attacker;
  let targetClone: Player | Enemy;

  let equippedWeapon: Weapon | undefined;
  let weaponModifier = 1;

  if ('skills' in attacker) {
    equippedWeapon = (attacker as Player).equipped.weapon;
    weaponModifier = getDurabilityModifier(equippedWeapon);
  }

  let armorModifier = 1;
  let equippedArmor: Armor | undefined;

  if ('skills' in target) {
    const targetPlayer = target as Player;
    equippedArmor = targetPlayer.equipped.bodyArmor ?? targetPlayer.equipped.armor;
    armorModifier = getDurabilityModifier(equippedArmor);
  }

  if (hit) {
    let critChanceBonus = 0;

    if ('skills' in attacker) {
      const playerAttacker = attacker as Player;
      const attackerDerived = getPlayerDerivedStats(playerAttacker);
      const bonuses = getEquippedBonuses(playerAttacker);
      const baseWeaponDamage = equippedWeapon?.damage ?? DEFAULT_ATTACK_DAMAGE;
      const isMeleeAttack = !equippedWeapon || equippedWeapon.range <= 1;
      const strengthBonus = isMeleeAttack ? attackerDerived.meleeDamageBonus : 0;

      const weaponSkill = resolveWeaponSkillType(equippedWeapon);
      const skillValue = getPlayerSkillValue(playerAttacker, weaponSkill);

      damageAmount = getEffectiveDamage(baseWeaponDamage, bonuses, strengthBonus);

      switch (weaponSkill) {
        case 'energyWeapons': {
          const bonusesBySkill = calculateEnergyWeaponsBonuses(skillValue);
          critChanceBonus = bonusesBySkill.crit;
          break;
        }
        case 'meleeCombat': {
          const bonusesBySkill = calculateMeleeCombatBonuses(skillValue);
          damageAmount += bonusesBySkill.damage;
          break;
        }
        case 'explosives':
        case 'smallGuns':
        default:
          break;
      }

      damageAmount = Math.round(damageAmount * weaponModifier);
      damageAmount = Math.max(0, damageAmount);

      const totalCriticalChance = Math.max(0, Math.min(95, attackerDerived.criticalChance + critChanceBonus));
      let criticalApplied = false;

      if (!('skills' in target) && playerHasPerk(playerAttacker, 'executioner')) {
        const enemyTarget = target as Enemy;
        if (enemyTarget.maxHealth > 0 && enemyTarget.health <= enemyTarget.maxHealth * 0.25) {
          damageAmount = Math.round(damageAmount * 1.5);
          criticalApplied = true;
          isCritical = true;
        }
      }

      if (!criticalApplied && totalCriticalChance > 0) {
        const critRoll = getRandomRoll();
        if (critRoll <= totalCriticalChance / 100) {
          damageAmount = Math.round(damageAmount * 1.5);
          isCritical = true;
        }
      }
    } else {
      damageAmount = 'damage' in attacker ? attacker.damage : DEFAULT_ATTACK_DAMAGE;
    }

    if ('skills' in target && damageAmount > 0) {
      const targetPlayer = target as Player;
      const armorRating = Math.round(getEffectiveArmorRating(targetPlayer) * armorModifier);
      if (armorRating > 0) {
        damageAmount = applyArmorReduction(damageAmount, armorRating);
      }
    }
  }

  if ('skills' in target) {
    const targetPlayer = target as Player;
    const targetClonePlayer = clonePlayerState(targetPlayer);
    targetClonePlayer.health = Math.max(0, targetPlayer.health - damageAmount);

    if (hit && equippedArmor?.durability) {
      const previousRatio = getDurabilityRatio(equippedArmor);
      const updatedArmor = decayDurability(equippedArmor, 1);
      const nextRatio = getDurabilityRatio(updatedArmor);

      pushDurabilityEvents(events, 'armor', updatedArmor.name, previousRatio, nextRatio);

      if (targetClonePlayer.equipped.bodyArmor?.id === equippedArmor.id) {
        targetClonePlayer.equipped.bodyArmor = updatedArmor;
      }
      if (targetClonePlayer.equipped.armor?.id === equippedArmor.id) {
        targetClonePlayer.equipped.armor = updatedArmor;
      }
      if (targetClonePlayer.equippedSlots?.bodyArmor?.id === equippedArmor.id) {
        targetClonePlayer.equippedSlots.bodyArmor = updatedArmor;
      }
    }

    targetClone = targetClonePlayer;
  } else {
    targetClone = {
      ...target,
      health: Math.max(0, target.health - damageAmount),
    };
  }

  if ('skills' in attacker) {
    const playerAttacker = attacker as Player;
    const attackerPlayerClone = clonePlayerState(playerAttacker);

    if (equippedWeapon) {
      const previousRatio = getDurabilityRatio(equippedWeapon);
      const updatedWeapon = decayDurability(equippedWeapon, 1);
      const nextRatio = getDurabilityRatio(updatedWeapon);

      if (equippedWeapon.durability) {
        pushDurabilityEvents(events, 'weapon', updatedWeapon.name, previousRatio, nextRatio);
      }

      attackerPlayerClone.equipped.weapon = updatedWeapon;
      if (attackerPlayerClone.equippedSlots?.primaryWeapon?.id === equippedWeapon.id) {
        attackerPlayerClone.equippedSlots.primaryWeapon = updatedWeapon;
      }
    }

    attackerPlayerClone.actionPoints = Math.max(0, attackerPlayerClone.actionPoints - attackCost);

    attackerClone = registerGunFuAttack(attackerPlayerClone);
  } else {
    attackerClone = {
      ...attacker,
      actionPoints: Math.max(0, attacker.actionPoints - attackCost),
    };
  }

  return {
    success: hit,
    damage: damageAmount,
    isCritical,
    newAttacker: attackerClone,
    newTarget: targetClone,
    events: events.length > 0 ? events : undefined,
  };
};

// Check if entity can move to position (considers AP, adjacency, obstacles, player, other enemies)
export const canMoveToPosition = (
  entity: Player | Enemy,
  targetPosition: Position,
  mapArea: MapArea, // Need mapArea for full walkability check
  player: Player,   // Need player
  enemies: Enemy[]  // Need enemies
): boolean => {
  // Check if entity has enough AP
  const movementCost = resolveMovementCost(entity);

  if (!Number.isFinite(movementCost) || entity.actionPoints < movementCost) {
    return false;
  }
  
  // Check if target position is adjacent
  if (!areEntitiesAdjacent(entity.position, targetPosition)) {
    // Note: This check might be redundant if called only on adjacent positions
    return false;
  }
  
  // Check if target position is walkable (considering map, player, enemies)
  // Exclude the moving entity itself from the collision check
  const otherEnemies = enemies.filter(e => e.id !== entity.id);
  const effectivePlayer = (entity.id === player.id) ? 
      {...player, position: {x: -1, y: -1}} : // Temporarily move player off-grid if it's the entity moving
      player; 

  return isPositionWalkable(targetPosition, mapArea, effectivePlayer, otherEnemies);
};

// Execute a move
export const executeMove = (
  entity: Player | Enemy,
  targetPosition: Position
): Player | Enemy => {
  const movementCost = resolveMovementCost(entity);

  if (!Number.isFinite(movementCost) || movementCost === Number.POSITIVE_INFINITY) {
    return entity;
  }

  // Update position and AP
  return {
    ...entity,
    position: targetPosition,
    actionPoints: Math.max(0, entity.actionPoints - movementCost)
  };
};

// Initialize combat
export const initializeCombat = (
  player: Player,
  enemies: Enemy[]
): { player: Player; enemies: Enemy[] } => {
  // Reset player AP
  const refreshedPlayer = {
    ...player,
    actionPoints: player.maxActionPoints
  };
  
  // Reset enemies AP
  const refreshedEnemies = enemies.map(enemy => ({
    ...enemy,
    actionPoints: enemy.maxActionPoints
  }));
  
  return { player: refreshedPlayer, enemies: refreshedEnemies };
};

// End combat turn (refresh AP)
export const endCombatTurn = (
  player: Player,
  enemies: Enemy[],
  isPlayerTurn: boolean
): { player: Player; enemies: Enemy[]; isPlayerTurn: boolean } => {
  if (isPlayerTurn) {
    // End player turn, reset enemies AP
    const refreshedEnemies = enemies.map(enemy => ({
      ...enemy,
      actionPoints: enemy.maxActionPoints
    }));
    
    return { 
      player, 
      enemies: refreshedEnemies, 
      isPlayerTurn: false 
    };
  } else {
    // End enemy turn, reset player AP
    const refreshedPlayer = {
      ...player,
      actionPoints: player.maxActionPoints
    };
    
    return { 
      player: refreshedPlayer, 
      enemies, 
      isPlayerTurn: true 
    };
  }
}; 
