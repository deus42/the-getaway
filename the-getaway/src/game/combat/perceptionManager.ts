import { Enemy, Player, MapArea, AlertLevel } from '../interfaces/types';
import { isPlayerVisible, updateEnemyAlert, updateVisionDirection } from './perception';
import { PERCEPTION_CONFIG } from './perception';

export interface GuardPerceptionResult {
  enemy: Enemy;
  playerVisible: boolean;
}

/**
 * Process perception updates for all enemies in the current map area
 * Returns updated enemies and the highest alert level detected
 */
export const processPerceptionUpdates = (
  enemies: Enemy[],
  player: Player,
  mapArea: MapArea
): { updatedEnemies: Enemy[]; maxAlertLevel: AlertLevel; guardPerception: GuardPerceptionResult[] } => {
  let maxAlertLevel = AlertLevel.IDLE;
  const guardPerception: GuardPerceptionResult[] = [];

  const updatedEnemies = enemies.map((enemy) => {
    // Skip enemies without vision cones
    if (!enemy.visionCone) {
      guardPerception.push({ enemy, playerVisible: false });
      return enemy;
    }

    // Check if player is visible
    const playerVisible = isPlayerVisible(enemy, player, mapArea);

    // Update alert state
    let updatedEnemy = updateEnemyAlert(enemy, playerVisible);

    // If player is visible, update direction to face player
    if (playerVisible) {
      updatedEnemy = updateVisionDirection(updatedEnemy, player.position);
      updatedEnemy.lastKnownPlayerPosition = player.position;
    }

    guardPerception.push({ enemy: updatedEnemy, playerVisible });

    // Track max alert level
    if (updatedEnemy.alertLevel) {
      const alertRank = getAlertRank(updatedEnemy.alertLevel);
      const maxRank = getAlertRank(maxAlertLevel);
      if (alertRank > maxRank) {
        maxAlertLevel = updatedEnemy.alertLevel;
      }
    }

    return updatedEnemy;
  });

  return { updatedEnemies, maxAlertLevel, guardPerception };
};

/**
 * Get numeric rank for alert level comparison
 */
const getAlertRank = (level: AlertLevel): number => {
  switch (level) {
    case AlertLevel.IDLE:
      return 0;
    case AlertLevel.SUSPICIOUS:
      return 1;
    case AlertLevel.INVESTIGATING:
      return 2;
    case AlertLevel.ALARMED:
      return 3;
    default:
      return 0;
  }
};

/**
 * Get alert message key for localization
 */
export const getAlertMessageKey = (
  oldLevel: AlertLevel,
  newLevel: AlertLevel
): string | null => {
  // Only return message if alert level increased
  const oldRank = getAlertRank(oldLevel);
  const newRank = getAlertRank(newLevel);

  if (newRank <= oldRank) {
    return null;
  }

  switch (newLevel) {
    case AlertLevel.SUSPICIOUS:
      return 'alertSuspicious';
    case AlertLevel.INVESTIGATING:
      return 'alertInvestigating';
    case AlertLevel.ALARMED:
      return 'alertAlarmed';
    default:
      return null;
  }
};

/**
 * Check if reinforcements should be spawned
 */
export const shouldSpawnReinforcements = (
  alertLevel: AlertLevel,
  reinforcementsScheduled: boolean
): boolean => {
  return alertLevel === AlertLevel.ALARMED && !reinforcementsScheduled;
};

/**
 * Get delay before reinforcements spawn (in ms)
 */
export const getReinforcementDelay = (): number => {
  return PERCEPTION_CONFIG.reinforcementDelay;
};
