import {
  CameraAlertState,
  Enemy,
  MapArea,
  SurveillanceZoneState,
  AlertLevel,
} from '../../interfaces/types';
import { isInVisionCone, hasLineOfSight } from '../../combat/perception';
import { PARANOIA_CONFIG } from '../../../content/paranoia/paranoiaConfig';
import {
  ParanoiaRuntimeState,
  ParanoiaStimuliResult,
  ParanoiaTickContext,
} from './types';
import { getHeatProfileForZone } from '../../../content/suspicion/heatProfiles';
import { clamp } from '../../utils/math';

const DEFAULT_RUNTIME_STATE = (): ParanoiaRuntimeState => ({
  cameraAlarmedAt: {},
  guardAlertRank: {},
  lastCurfewActive: false,
  lastLowHealth: false,
  lastLowAmmo: false,
  lastSafehouse: false,
});

export const createParanoiaRuntime = (): ParanoiaRuntimeState => DEFAULT_RUNTIME_STATE();

const alertRank = (alertLevel: AlertLevel | undefined): number => {
  switch (alertLevel) {
    case AlertLevel.ALARMED:
      return 3;
    case AlertLevel.INVESTIGATING:
      return 2;
    case AlertLevel.SUSPICIOUS:
      return 1;
    default:
      return 0;
  }
};

const determineCameraRange = (camera: SurveillanceZoneState['cameras'][string]): number => {
  if (camera.type === 'motionSensor') {
    return camera.motionRadius ?? camera.range;
  }
  return camera.range;
};

const resolveSafehousePresence = (mapArea: MapArea | null, surveillance: SurveillanceZoneState | undefined): boolean => {
  if (!mapArea) {
    return false;
  }

  if (mapArea.zoneId?.toLowerCase().includes('safehouse')) {
    return true;
  }

  if (mapArea.name?.toLowerCase().includes('safehouse')) {
    return true;
  }

  if (surveillance?.zoneId?.toLowerCase().includes('safehouse')) {
    return true;
  }

  return false;
};

const normalizeHeat = (zoneHeat: number, crackdownThreshold: number): number => {
  if (crackdownThreshold <= 0) {
    return 0;
  }
  return clamp(zoneHeat / crackdownThreshold, 0, 1);
};

const resolveLuckSpikeMultiplier = (luck: number): number => {
  if (luck >= 7) {
    return 0.5;
  }
  if (luck >= 5) {
    return 0.8;
  }
  return 1;
};

const resolveDaylightReliefActive = (
  timeOfDay: ParanoiaTickContext['timeOfDay'],
  curfewActive: boolean,
  cameraGain: number,
  guardCount: number
): boolean => {
  if (timeOfDay !== 'day' || curfewActive) {
    return false;
  }
  if (cameraGain > 0.02) {
    return false;
  }
  return guardCount === 0;
};

export const evaluateParanoiaStimuli = (
  context: ParanoiaTickContext,
  runtime: ParanoiaRuntimeState
): ParanoiaStimuliResult => {
  const seconds = Math.max(0, context.deltaMs) / 1000;

  const gains: Record<string, number> = {};
  const losses: Record<string, number> = {};
  const spikes: Record<string, number> = {};

  const player = context.player;
  const mapArea = context.mapArea;
  const surveillanceZone = context.surveillanceZone;

  const perception = Math.max(1, player.skills.perception ?? 5);
  const endurance = Math.max(1, player.skills.endurance ?? 5);
  const intelligence = Math.max(1, player.skills.intelligence ?? 5);
  const charisma = Math.max(1, player.skills.charisma ?? 5);
  const luck = Math.max(1, player.skills.luck ?? 5);

  const attributeGainFactor = clamp(
    1 + perception * 0.02 - endurance * 0.03 - intelligence * 0.03 - charisma * 0.02,
    0.5,
    1.8
  );
  const attributeDecayFactor = 1 + endurance * 0.02 + intelligence * 0.02 + luck * 0.01;
  const luckSpikeMultiplier = resolveLuckSpikeMultiplier(luck);

  // Surveillance proximity and cone exposure
  if (surveillanceZone && mapArea) {
    let proximityGain = 0;
    let coneGain = 0;

    Object.values(surveillanceZone.cameras).forEach((camera) => {
      if (!camera.isActive || camera.alertState === CameraAlertState.DISABLED) {
        return;
      }

      const range = determineCameraRange(camera);
      const dx = camera.position.x - player.position.x;
      const dy = camera.position.y - player.position.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= PARANOIA_CONFIG.surveillance.proximityRadius) {
        const closeness = 1 - Math.min(distance / PARANOIA_CONFIG.surveillance.proximityRadius, 1);
        proximityGain += closeness * PARANOIA_CONFIG.surveillance.proximityGainPerSecond * seconds;
      }

      if (camera.type !== 'motionSensor') {
        const inCone = isInVisionCone(camera.position, player.position, {
          range,
          angle: camera.fieldOfView,
          direction: camera.currentDirection,
        });
        if (inCone && hasLineOfSight(camera.position, player.position, mapArea)) {
          coneGain += PARANOIA_CONFIG.surveillance.coneGainPerSecond * seconds;
        }
      }

      if (camera.alertState === CameraAlertState.ALARMED) {
        const lastSpike = runtime.cameraAlarmedAt[camera.id] ?? 0;
        const cooldownMs = 10_000;
        if (context.timestamp - lastSpike >= cooldownMs) {
          spikes[`camera:${camera.id}`] =
            PARANOIA_CONFIG.surveillance.alertSpike * luckSpikeMultiplier;
          runtime.cameraAlarmedAt[camera.id] = context.timestamp;
        }
      }
    });

    if (proximityGain > 0) {
      const capped = Math.min(
        proximityGain,
        PARANOIA_CONFIG.surveillance.maxProximityContributionPerSecond * seconds
      );
      gains.camerasProximity = capped;
    }

    if (coneGain > 0) {
      gains.camerasSweep = coneGain;
    }
  }

  // Guard line-of-sight and pursuit
  let guardLosCount = 0;
  context.enemies.forEach((enemy: Enemy) => {
    if (!mapArea || !enemy.visionCone) {
      runtime.guardAlertRank[enemy.id] = alertRank(enemy.alertLevel);
      return;
    }

    const playerVisible = isInVisionCone(enemy.position, player.position, enemy.visionCone)
      ? hasLineOfSight(enemy.position, player.position, mapArea)
      : false;

    if (playerVisible) {
      guardLosCount += 1;
      gains[`guardLOS:${enemy.id}`] =
        (gains[`guardLOS:${enemy.id}`] ?? 0) +
        PARANOIA_CONFIG.guards.lineOfSightGainPerSecond * seconds;
    }

    const currentRank = alertRank(enemy.alertLevel);
    const previousRank = runtime.guardAlertRank[enemy.id] ?? 0;
    runtime.guardAlertRank[enemy.id] = currentRank;

    if (enemy.alertLevel === AlertLevel.ALARMED) {
      gains[`guardPursuit:${enemy.id}`] =
        (gains[`guardPursuit:${enemy.id}`] ?? 0) +
        PARANOIA_CONFIG.guards.pursuitGainPerSecond * seconds;
    }

    if (currentRank >= 3 && previousRank < 3) {
      spikes[`guardChase:${enemy.id}`] =
        PARANOIA_CONFIG.guards.pursuitSpike * luckSpikeMultiplier;
    }
  });

  // Regional heat multiplier & baseline
  let heatNormalized = 0;
  if (context.zoneHeat) {
    const profile = getHeatProfileForZone(context.mapArea?.zoneId ?? null);
    heatNormalized = normalizeHeat(context.zoneHeat.totalHeat, profile.tierThresholds.crackdown);
    if (heatNormalized > 0) {
      gains.heat = heatNormalized * PARANOIA_CONFIG.heat.baselineGainPerSecond * seconds;
    }
  }

  // Time-of-day pressure
  if (context.timeOfDay === 'night') {
    gains.night = PARANOIA_CONFIG.circadian.nightGainPerSecond * seconds;
  }

  if (context.curfewActive && !runtime.lastCurfewActive) {
    spikes.curfew = PARANOIA_CONFIG.circadian.curfewSpike * luckSpikeMultiplier;
  }
  runtime.lastCurfewActive = context.curfewActive;

  // Health stress
  const maxHealth = Math.max(1, player.maxHealth);
  const healthRatio = player.health / maxHealth;
  if (healthRatio < PARANOIA_CONFIG.health.criticalThreshold) {
    gains.lowHealth =
      PARANOIA_CONFIG.health.sustainedGainPerSecond * seconds;
    if (!runtime.lastLowHealth) {
      spikes.lowHealth = PARANOIA_CONFIG.health.spike * luckSpikeMultiplier;
    }
    runtime.lastLowHealth = true;
  } else {
    runtime.lastLowHealth = false;
  }

  // Ammo stress placeholder – not yet wired in inventory data
  runtime.lastLowAmmo = false;

  // Environmental hazards
  const staminaDrain = context.environmentImpacts.travel.staminaDrainPerMinute;
  if (staminaDrain > 0) {
    gains.hazards =
      (gains.hazards ?? 0) + PARANOIA_CONFIG.hazards.smogGainPerSecond * seconds;
  }

  if (context.environmentImpacts.travel.visibilityMultiplier < 0.75) {
    gains.hazards =
      (gains.hazards ?? 0) + PARANOIA_CONFIG.hazards.blackoutGainPerSecond * seconds;
  }

  // Safehouse relief
  const inSafehouse = resolveSafehousePresence(mapArea, surveillanceZone);
  if (inSafehouse) {
    losses.safehouse =
      (losses.safehouse ?? 0) + PARANOIA_CONFIG.safehouse.reliefPerSecond * seconds;
    if (!runtime.lastSafehouse) {
      losses.safehouseEntry =
        (losses.safehouseEntry ?? 0) + PARANOIA_CONFIG.safehouse.entryRelief;
    }
  }
  runtime.lastSafehouse = inSafehouse;

  // Daylight comfort
  if (
    resolveDaylightReliefActive(context.timeOfDay, context.curfewActive, gains.camerasProximity ?? 0, guardLosCount)
  ) {
    losses.daylight =
      (losses.daylight ?? 0) + PARANOIA_CONFIG.circadian.daylightReliefPerSecond * seconds;
  }

  // Apply heat multiplier to non-heat gains
  const gainMultiplierFromHeat = 1 + heatNormalized;
  const adjustedGains: Record<string, number> = {};
  Object.entries(gains).forEach(([key, value]) => {
    if (key === 'heat') {
      adjustedGains[key] = value;
      return;
    }
    adjustedGains[key] = value * gainMultiplierFromHeat;
  });

  const multipliers = {
    gain: attributeGainFactor,
    decay: attributeDecayFactor,
  };

  // Apply luck mitigation to spikes
  Object.keys(spikes).forEach((key) => {
    spikes[key] = spikes[key] * luckSpikeMultiplier;
  });

  return {
    gains: adjustedGains,
    losses,
    spikes,
    multipliers,
  };
};
