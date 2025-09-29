import { Enemy, Player, Position, MapArea, AlertLevel, VisionCone } from '../interfaces/types';

// Constants for perception tuning
export const PERCEPTION_CONFIG = {
  suspicionThreshold: 30,      // Progress needed to reach SUSPICIOUS
  investigationThreshold: 60,  // Progress needed to reach INVESTIGATING
  alarmThreshold: 100,         // Progress needed to reach ALARMED

  progressGainPerTick: 10,     // How fast alert increases when player is visible
  progressDecayPerTick: 5,     // How fast alert decreases when player is hidden

  defaultVisionRange: 8,       // Default vision range in tiles
  defaultVisionAngle: 90,      // Default field of view in degrees

  reinforcementDelay: 2000,    // ms before reinforcements spawn
};

/**
 * Calculate if a position is within an enemy's vision cone
 */
export const isInVisionCone = (
  enemyPos: Position,
  targetPos: Position,
  visionCone: VisionCone
): boolean => {
  const dx = targetPos.x - enemyPos.x;
  const dy = targetPos.y - enemyPos.y;

  // Calculate distance
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > visionCone.range) {
    return false;
  }

  // Calculate angle to target (in degrees)
  const angleToTarget = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize angles to 0-360
  const normalizedAngle = (angleToTarget + 360) % 360;
  const normalizedDirection = (visionCone.direction + 360) % 360;

  // Calculate angle difference
  let angleDiff = Math.abs(normalizedAngle - normalizedDirection);
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }

  // Check if within cone angle
  return angleDiff <= visionCone.angle / 2;
};

/**
 * Check line of sight between two positions (simplified - checks if walls block)
 */
export const hasLineOfSight = (
  start: Position,
  end: Position,
  mapArea: MapArea
): boolean => {
  // Bresenham's line algorithm to check tiles between start and end
  const tiles = getLineOfSightTiles(start, end);

  for (const tile of tiles) {
    // Skip start and end positions
    if ((tile.x === start.x && tile.y === start.y) ||
        (tile.x === end.x && tile.y === end.y)) {
      continue;
    }

    // Check if position is within bounds
    if (tile.x < 0 || tile.y < 0 || tile.y >= mapArea.height || tile.x >= mapArea.width) {
      return false;
    }

    // Check if tile blocks vision (walls, etc.)
    const mapTile = mapArea.tiles[tile.y][tile.x];
    if (!mapTile.isWalkable && mapTile.type !== 'cover') {
      return false;
    }
  }

  return true;
};

/**
 * Get all tiles along a line between two positions using Bresenham's algorithm
 */
const getLineOfSightTiles = (start: Position, end: Position): Position[] => {
  const tiles: Position[] = [];

  let x0 = Math.floor(start.x);
  let y0 = Math.floor(start.y);
  const x1 = Math.floor(end.x);
  const y1 = Math.floor(end.y);

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    tiles.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return tiles;
};

/**
 * Check if player is visible to an enemy
 */
export const isPlayerVisible = (
  enemy: Enemy,
  player: Player,
  mapArea: MapArea
): boolean => {
  // If no vision cone, enemy can't see
  if (!enemy.visionCone) {
    return false;
  }

  // Check if player is in vision cone
  if (!isInVisionCone(enemy.position, player.position, enemy.visionCone)) {
    return false;
  }

  // Check line of sight
  return hasLineOfSight(enemy.position, player.position, mapArea);
};

/**
 * Update enemy alert state based on player visibility
 */
export const updateEnemyAlert = (
  enemy: Enemy,
  playerVisible: boolean
): Enemy => {
  const currentProgress = enemy.alertProgress ?? 0;

  // Update progress
  let newProgress = currentProgress;
  if (playerVisible) {
    newProgress = Math.min(100, currentProgress + PERCEPTION_CONFIG.progressGainPerTick);
  } else {
    newProgress = Math.max(0, currentProgress - PERCEPTION_CONFIG.progressDecayPerTick);
  }

  // Determine new alert level based on progress
  let newLevel = AlertLevel.IDLE;
  if (newProgress >= PERCEPTION_CONFIG.alarmThreshold) {
    newLevel = AlertLevel.ALARMED;
  } else if (newProgress >= PERCEPTION_CONFIG.investigationThreshold) {
    newLevel = AlertLevel.INVESTIGATING;
  } else if (newProgress >= PERCEPTION_CONFIG.suspicionThreshold) {
    newLevel = AlertLevel.SUSPICIOUS;
  }

  // Track last known position when player becomes visible
  const lastKnown = playerVisible ? undefined : enemy.lastKnownPlayerPosition;

  return {
    ...enemy,
    alertProgress: newProgress,
    alertLevel: newLevel,
    lastKnownPlayerPosition: lastKnown,
  };
};

/**
 * Update alert direction for an enemy to face the player or last known position
 */
export const updateVisionDirection = (
  enemy: Enemy,
  targetPos: Position
): Enemy => {
  if (!enemy.visionCone) {
    return enemy;
  }

  const dx = targetPos.x - enemy.position.x;
  const dy = targetPos.y - enemy.position.y;

  // Calculate angle in degrees (0 = right, 90 = down, 180 = left, 270 = up)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const normalizedAngle = (angle + 360) % 360;

  return {
    ...enemy,
    visionCone: {
      ...enemy.visionCone,
      direction: normalizedAngle,
    },
  };
};

/**
 * Get all tiles within a vision cone (for rendering)
 */
export const getVisionConeTiles = (
  position: Position,
  visionCone: VisionCone,
  mapArea: MapArea
): Position[] => {
  const tiles: Position[] = [];
  const { range } = visionCone;

  // Check tiles in a square around the enemy, then filter to cone
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const tilePos = { x: position.x + dx, y: position.y + dy };

      // Skip out of bounds
      if (tilePos.x < 0 || tilePos.y < 0 ||
          tilePos.y >= mapArea.height || tilePos.x >= mapArea.width) {
        continue;
      }

      // Check if in cone
      if (isInVisionCone(position, tilePos, visionCone)) {
        // Only add if line of sight exists
        if (hasLineOfSight(position, tilePos, mapArea)) {
          tiles.push(tilePos);
        }
      }
    }
  }

  return tiles;
};