import { Player, Weapon, PerkId } from '../interfaces/types';

export const playerHasPerk = (player: Player, perkId: PerkId): boolean => {
  return player.perks.includes(perkId);
};

export const isRangedWeapon = (weapon?: Weapon): boolean => {
  if (!weapon) {
    return false;
  }
  return weapon.range > 1;
};

export const getRangedHitBonusFromPerks = (player: Player): number => {
  if (playerHasPerk(player, 'steadyHands')) {
    return 0.1; // +10%
  }
  return 0;
};

export const getArmorBonusFromPerks = (player: Player): number => {
  return playerHasPerk(player, 'toughness') ? 3 : 0;
};

export const shouldGunFuAttackBeFree = (player: Player): boolean => {
  if (!playerHasPerk(player, 'gunFu')) {
    return false;
  }
  return player.perkRuntime.gunFuShotsThisTurn <= 0;
};

export const registerGunFuAttack = (player: Player): Player => {
  if (!playerHasPerk(player, 'gunFu')) {
    return player;
  }

  return {
    ...player,
    perkRuntime: {
      ...player.perkRuntime,
      gunFuShotsThisTurn: player.perkRuntime.gunFuShotsThisTurn + 1,
    },
  };
};

export const resetGunFuForTurn = (player: Player): Player => {
  if (!playerHasPerk(player, 'gunFu')) {
    return player;
  }

  return {
    ...player,
    perkRuntime: {
      ...player.perkRuntime,
      gunFuShotsThisTurn: 0,
    },
  };
};

export const shouldTriggerAdrenalineRush = (player: Player): boolean => {
  if (!playerHasPerk(player, 'adrenalineRush')) {
    return false;
  }

  const healthRatio = player.maxHealth > 0 ? player.health / player.maxHealth : 0;
  return healthRatio <= 0.3 && player.perkRuntime.adrenalineRushTurnsRemaining <= 0;
};

export const activateAdrenalineRush = (player: Player): Player => {
  if (!playerHasPerk(player, 'adrenalineRush')) {
    return player;
  }

  return {
    ...player,
    actionPoints: Math.min(player.actionPoints + 2, player.maxActionPoints + 2),
    perkRuntime: {
      ...player.perkRuntime,
      adrenalineRushTurnsRemaining: 3,
    },
  };
};

export const tickAdrenalineRush = (player: Player): Player => {
  if (!playerHasPerk(player, 'adrenalineRush')) {
    return player;
  }

  const turns = Math.max(0, player.perkRuntime.adrenalineRushTurnsRemaining - 1);
  return {
    ...player,
    actionPoints: Math.min(player.actionPoints + 2, player.maxActionPoints + 2),
    perkRuntime: {
      ...player.perkRuntime,
      adrenalineRushTurnsRemaining: turns,
    },
  };
};

export const recordGhostActivation = (player: Player): Player => {
  if (!playerHasPerk(player, 'ghost')) {
    return player;
  }

  if (player.perkRuntime.ghostConsumed) {
    return player;
  }

  return {
    ...player,
    perkRuntime: {
      ...player.perkRuntime,
      ghostInvisibilityTurns: 2,
      ghostConsumed: true,
    },
  };
};

export const decayGhostInvisibility = (player: Player): Player => {
  if (!playerHasPerk(player, 'ghost')) {
    return player;
  }

  if (player.perkRuntime.ghostInvisibilityTurns <= 0) {
    return player;
  }

  return {
    ...player,
    perkRuntime: {
      ...player.perkRuntime,
      ghostInvisibilityTurns: Math.max(0, player.perkRuntime.ghostInvisibilityTurns - 1),
    },
  };
};
