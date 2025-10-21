import { Player, Enemy, MapArea, AlertLevel, CameraRuntimeState, CameraAlertState } from '../../interfaces/types';
import { EnvironmentFlags } from '../../interfaces/environment';
import { TimeOfDay } from '../../world/dayNightCycle';
import { WitnessObservation } from './types';
import { clamp } from '../../utils/math';

const rankAlertLevel = (level: AlertLevel): number => {
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

const computeDistance = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const computeLightingModifier = (
  timeOfDay: TimeOfDay,
  flags: EnvironmentFlags
): number => {
  if (flags.blackoutTier === 'rolling') {
    return 0.55;
  }
  if (flags.blackoutTier === 'brownout') {
    return 0.65;
  }

  if (timeOfDay === 'night') {
    return 0.7;
  }
  if (timeOfDay === 'evening' || timeOfDay === 'morning') {
    return 0.85;
  }

  return 1;
};

const computeDisguiseModifier = (player: Player): number => {
  const stealthTraining = player.skillTraining?.stealth ?? 0;
  const agility = player.skills.agility ?? 5;

  const stealthReduction = Math.min(stealthTraining / 120, 0.35);
  const agilityReduction = Math.max(0, (agility - 6) * 0.03);
  const totalReduction = Math.min(0.45, stealthReduction + agilityReduction);

  return clamp(1 - totalReduction, 0.55, 1);
};

const computePostureModifier = (player: Player): number => (player.isCrouching ? 0.65 : 1);

const formatCameraLabel = (camera: CameraRuntimeState): string => {
  const explicitLabel = (camera as { label?: string }).label;
  if (typeof explicitLabel === 'string' && explicitLabel.trim().length > 0) {
    return explicitLabel;
  }

  return camera.id
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

interface GuardObservationParams {
  enemy: Enemy;
  player: Player;
  mapArea: MapArea;
  timeOfDay: TimeOfDay;
  environmentFlags: EnvironmentFlags;
  playerVisible: boolean;
  timestamp: number;
}

export const buildGuardWitnessObservation = ({
  enemy,
  player,
  mapArea,
  timeOfDay,
  environmentFlags,
  playerVisible,
  timestamp,
}: GuardObservationParams): WitnessObservation | null => {
  const cone = enemy.visionCone;
  if (!cone || !playerVisible) {
    return null;
  }

  const alertLevel = enemy.alertLevel ?? AlertLevel.IDLE;

  const distance = computeDistance(enemy.position, player.position);
  const range = cone.range || 8;

  const baseCertainty = clamp(0.7 + rankAlertLevel(alertLevel) * 0.06, 0.6, 0.95);
  const distanceModifier = clamp(1 - distance / (range + 1), 0.25, 1);
  const lightingModifier = computeLightingModifier(timeOfDay, environmentFlags);
  const disguiseModifier = computeDisguiseModifier(player);
  const postureModifier = computePostureModifier(player);

  return {
    witnessId: enemy.id,
    witnessLabel: enemy.name ?? 'Guard',
    targetId: player.id,
    zoneId: mapArea.zoneId,
    areaId: mapArea.id,
    timestamp,
    source: 'guard',
    recognitionChannel: 'face',
    baseCertainty,
    distanceModifier,
    lightingModifier,
    disguiseModifier,
    postureModifier,
    reported: rankAlertLevel(alertLevel) >= rankAlertLevel(AlertLevel.INVESTIGATING),
    location: { ...enemy.position },
  };
};

interface CameraObservationParams {
  camera: CameraRuntimeState;
  player: Player;
  mapArea: MapArea;
  timeOfDay: TimeOfDay;
  environmentFlags: EnvironmentFlags;
  timestamp: number;
  alertState: CameraAlertState;
}

export const buildCameraWitnessObservation = ({
  camera,
  player,
  mapArea,
  timeOfDay,
  environmentFlags,
  timestamp,
  alertState,
}: CameraObservationParams): WitnessObservation => {
  const distance = computeDistance(camera.position, player.position);
  const range = camera.range || 8;

  const baseCertainty =
    alertState === CameraAlertState.ALARMED
      ? 0.88
      : alertState === CameraAlertState.SUSPICIOUS
      ? 0.65
      : 0.5;

  const distanceModifier = clamp(1 - distance / (range + 1), 0.3, 1);
  const lightingModifier = computeLightingModifier(timeOfDay, environmentFlags);
  const disguiseModifier = computeDisguiseModifier(player);
  const postureModifier = computePostureModifier(player);

  return {
    witnessId: camera.id,
    witnessLabel: formatCameraLabel(camera),
    targetId: player.id,
    zoneId: mapArea.zoneId,
    areaId: mapArea.id,
    timestamp,
    source: 'camera',
    recognitionChannel: 'face',
    baseCertainty,
    distanceModifier,
    lightingModifier,
    disguiseModifier,
    postureModifier,
    reported: alertState === CameraAlertState.ALARMED,
    location: { ...camera.position },
  };
};
