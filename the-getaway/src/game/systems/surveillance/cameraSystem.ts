import { AppDispatch } from '../../../store';
import { addLogMessage } from '../../../store/logSlice';
import {
  registerZoneCameras,
  updateCameraState,
  setCameraNetworkAlert,
  setCurfewBanner,
  clearZoneCameras,
  updateHudState,
} from '../../../store/surveillanceSlice';
import {
  scheduleReinforcements,
  setGlobalAlertLevel,
} from '../../../store/worldSlice';
import { getCameraConfigsForZone } from '../../../content/cameraConfigs';
import {
  CameraAlertState,
  CameraRuntimeState,
  MapArea,
  Player,
  SurveillanceZoneState,
  AlertLevel,
} from '../../interfaces/types';
import { TimeOfDay } from '../../world/dayNightCycle';
import type { EnvironmentFlags } from '../../interfaces/environment';
import {
  createCameraRuntimeState,
  updateCameraOrientation,
  isCameraDisabled,
  isCameraLoopingFootage,
} from './cameraTypes';
import { hasLineOfSight, isInVisionCone } from '../../combat/perception';
import { Position, SkillId } from '../../interfaces/types';
import { clamp, radiansToDegrees } from '../../utils/math';
import { buildCameraWitnessObservation } from '../suspicion/observationBuilders';
import type { WitnessObservation } from '../suspicion/types';
import type { LogStrings } from '../../../content/system';

const PROGRESS_GAIN_PER_MS = 100 / 3000; // 0 → 100 over ~3s
const PROGRESS_DECAY_PER_MS = 100 / 4000; // decay back to idle in ~4s
const INVESTIGATING_THRESHOLD = 60;
const ALARMED_THRESHOLD = 100;
const NETWORK_ALERT_WINDOW_MS = 60000;
const NETWORK_ALERT_DURATION_MS = 5 * 60 * 1000;

interface AreaRuntimeCache {
  lastPlayerPosition?: Position;
  lastUpdateTimestamp?: number;
  hudSnapshot?: {
    camerasNearby: number;
    detectionProgress: number;
    alertState: CameraAlertState;
    activeCameraId: string | null;
    networkAlertActive: boolean;
    networkAlertExpiresAt: number | null;
  };
}

const areaRuntimeCache: Record<string, AreaRuntimeCache> = {};
const alarmHistoryByArea: Record<string, Array<{ cameraId: string; timestamp: number }>> = {};

const shouldCameraBeActive = (camera: CameraRuntimeState, timeOfDay: TimeOfDay): boolean => {
  if (!camera.activationPhases || camera.activationPhases.length === 0) {
    return true;
  }
  return camera.activationPhases.includes(timeOfDay);
};

const normaliseDegrees = (degrees: number): number => {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

const computeDirectionToPlayer = (camera: CameraRuntimeState, player: Player): number => {
  const angleRadians = Math.atan2(player.position.y - camera.position.y, player.position.x - camera.position.x);
  const degrees = radiansToDegrees(angleRadians);
  return normaliseDegrees(degrees);
};

const distanceBetween = (a: Position, b: Position): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getPlayerSkillValue = (player: Player, skillId: SkillId): number => {
  const trained = player.skillTraining?.[skillId];
  if (typeof trained === 'number') {
    return trained;
  }
  return 0;
};

const computeEffectiveRange = (camera: CameraRuntimeState, player: Player): number => {
  const baseRange = camera.type === 'motionSensor'
    ? camera.motionRadius ?? camera.range
    : camera.range;

  const stealth = getPlayerSkillValue(player, 'stealth');
  const stealthReduction = clamp(stealth / 200, 0, 0.75);
  let effective = baseRange * (1 - stealthReduction);

  // Movement profile influences how easily cameras pick up the player
  const movementFactor = player.movementProfile === 'silent'
    ? 0.8
    : player.movementProfile === 'sprint'
    ? 1.2
    : 1;
  effective *= movementFactor;
  if (player.stealthModeEnabled) {
    effective *= 0.75;
  }

  return Math.max(1, effective);
};

const evaluateDetection = (
  camera: CameraRuntimeState,
  previous: CameraRuntimeState,
  player: Player,
  mapArea: MapArea,
  playerMoved: boolean,
  deltaMs: number,
  timestamp: number
): {
  state: CameraAlertState;
  progress: number;
  detectionActive: boolean;
  lastDetectionTimestamp?: number;
} => {
  if (!camera.isActive) {
    return {
      state: CameraAlertState.DISABLED,
      progress: 0,
      detectionActive: false,
      lastDetectionTimestamp: undefined,
    };
  }

  if (isCameraDisabled(previous, timestamp)) {
    return {
      state: CameraAlertState.DISABLED,
      progress: 0,
      detectionActive: false,
      lastDetectionTimestamp: undefined,
    };
  }

  const looping = isCameraLoopingFootage(previous, timestamp);
  const range = computeEffectiveRange(camera, player);
  const distance = distanceBetween(camera.position, player.position);
  let detectionActive = false;

  if (!looping) {
    if (camera.type === 'motionSensor') {
      // Silent movement avoids tripping motion sensors; sprinting makes it easier
      const motionSensitive = player.movementProfile !== 'silent';
      detectionActive = distance <= range && playerMoved && motionSensitive;
    } else {
      const coneHit = isInVisionCone(
        camera.position,
        player.position,
        {
          range,
          angle: camera.fieldOfView,
          direction: camera.currentDirection,
        }
      );

      if (coneHit && hasLineOfSight(camera.position, player.position, mapArea)) {
        detectionActive = true;
      }
    }
  }

  let progress = previous.detectionProgress;
  let lastDetectionTimestamp = previous.lastDetectionTimestamp;

  if (detectionActive) {
    // Hacking talent dampens camera detection gains; movement profile also impacts gain
    const hacking = getPlayerSkillValue(player, 'hacking');
    const hackingDampen = clamp(hacking / 400, 0, 0.25); // up to -25%
    const movementGainFactor = player.movementProfile === 'silent' ? 0.7 : player.movementProfile === 'sprint' ? 1.2 : 1;
    const stealthModifier = player.stealthModeEnabled ? 0.75 : 1;
    progress +=
      PROGRESS_GAIN_PER_MS *
      deltaMs *
      (1 - hackingDampen) *
      movementGainFactor *
      stealthModifier;
    progress = Math.min(ALARMED_THRESHOLD, progress);
    lastDetectionTimestamp = timestamp;
  } else {
    const decayRate = previous.trackingPlayer ? PROGRESS_DECAY_PER_MS * 1.8 : PROGRESS_DECAY_PER_MS;
    progress -= decayRate * deltaMs;
    progress = Math.max(0, progress);
  }

  const state = resolveCameraAlertStateFromProgress(progress);
  if (state === CameraAlertState.ALARMED) {
    progress = ALARMED_THRESHOLD;
  }

  return {
    state,
    progress,
    detectionActive,
    lastDetectionTimestamp,
  };
};

const recordAlarmForArea = (areaId: string, cameraId: string, timestamp: number) => {
  if (!alarmHistoryByArea[areaId]) {
    alarmHistoryByArea[areaId] = [];
  }
  alarmHistoryByArea[areaId].push({ cameraId, timestamp });
  alarmHistoryByArea[areaId] = alarmHistoryByArea[areaId].filter(
    (entry) => timestamp - entry.timestamp <= NETWORK_ALERT_WINDOW_MS
  );
};

const shouldTriggerNetworkAlert = (areaId: string): boolean => {
  const history = alarmHistoryByArea[areaId];
  if (!history) {
    return false;
  }
  return history.length >= 3;
};

const getCameraAlertWeight = (state: CameraAlertState): number => {
  switch (state) {
    case CameraAlertState.ALARMED:
      return 4;
    case CameraAlertState.INVESTIGATING:
      return 3;
    case CameraAlertState.SUSPICIOUS:
      return 2;
    case CameraAlertState.IDLE:
      return 1;
    case CameraAlertState.DISABLED:
    default:
      return 0;
  }
};

export const resolveCameraAlertStateFromProgress = (
  progressValue: number
): CameraAlertState => {
  if (progressValue >= ALARMED_THRESHOLD) {
    return CameraAlertState.ALARMED;
  }

  if (progressValue >= INVESTIGATING_THRESHOLD) {
    return CameraAlertState.INVESTIGATING;
  }

  if (progressValue > 0) {
    return CameraAlertState.SUSPICIOUS;
  }

  return CameraAlertState.IDLE;
};

export const initializeZoneSurveillance = (
  params: {
    area: MapArea;
    timeOfDay: TimeOfDay;
    dispatch: AppDispatch;
    timestamp: number;
  }
): void => {
  const { area, timeOfDay, dispatch, timestamp } = params;
  const definitions = getCameraConfigsForZone(area.zoneId);

  const runtimeCameras = definitions.map((definition) => {
    const runtime = createCameraRuntimeState(definition);
    const active = shouldCameraBeActive(runtime, timeOfDay);
    runtime.isActive = active;
    runtime.alertState = active ? CameraAlertState.IDLE : CameraAlertState.DISABLED;
    runtime.detectionProgress = 0;
    runtime.lastDetectionTimestamp = undefined;
    return runtime;
  });

  dispatch(
    registerZoneCameras({
      areaId: area.id,
      zoneId: area.zoneId,
      cameras: runtimeCameras,
      timestamp,
    })
  );

  areaRuntimeCache[area.id] = {
    lastPlayerPosition: undefined,
    lastUpdateTimestamp: timestamp,
    hudSnapshot: undefined,
  };
  alarmHistoryByArea[area.id] = [];
};

export const teardownZoneSurveillance = (
  params: { areaId: string; dispatch: AppDispatch }
): void => {
  const { areaId, dispatch } = params;
  dispatch(clearZoneCameras({ areaId }));
  delete areaRuntimeCache[areaId];
  delete alarmHistoryByArea[areaId];
};

export const handleTimeOfDayForSurveillance = (
  params: {
    zone: SurveillanceZoneState | undefined;
    area: MapArea | null;
    timeOfDay: TimeOfDay;
    dispatch: AppDispatch;
    timestamp: number;
    showBanner?: boolean;
  }
): void => {
  const { zone, area, timeOfDay, dispatch, timestamp, showBanner } = params;
  if (!zone || !area) {
    return;
  }

  const updates: Array<{ cameraId: string; changes: Partial<CameraRuntimeState> }> = [];
  let activatedAny = false;

  Object.values(zone.cameras).forEach((camera) => {
    const shouldActivate = shouldCameraBeActive(camera, timeOfDay);
    if (shouldActivate === camera.isActive) {
      if (shouldActivate) {
        return;
      }
      const alreadyDisabled =
        camera.alertState === CameraAlertState.DISABLED && (camera.detectionProgress ?? 0) === 0;
      if (alreadyDisabled) {
        return;
      }
    }

    const changes: Partial<CameraRuntimeState> = {
      isActive: shouldActivate,
      detectionProgress: shouldActivate ? camera.detectionProgress : 0,
      lastDetectionTimestamp: shouldActivate ? camera.lastDetectionTimestamp : undefined,
      alertState: shouldActivate ? CameraAlertState.IDLE : CameraAlertState.DISABLED,
      trackingPlayer: shouldActivate ? false : false,
      trackingDirection: undefined,
    };

    if (!shouldActivate) {
      activatedAny = activatedAny || camera.isActive;
    } else {
      activatedAny = true;
    }

    updates.push({ cameraId: camera.id, changes });
  });

  updates.forEach((update) => {
    dispatch(
      updateCameraState({
        areaId: zone.areaId,
        cameraId: update.cameraId,
        changes: update.changes,
        timestamp,
      })
    );
  });

  if (showBanner && activatedAny && timeOfDay !== 'day' && timeOfDay !== 'morning') {
    dispatch(setCurfewBanner({ visible: true, timestamp }));
  }
};

interface SurveillanceUpdateParams {
  zone: SurveillanceZoneState;
  mapArea: MapArea;
  player: Player;
  deltaMs: number;
  timestamp: number;
  dispatch: AppDispatch;
  logStrings: LogStrings;
  reinforcementsScheduled: boolean;
  globalAlertLevel: AlertLevel;
  timeOfDay: TimeOfDay;
  environmentFlags: EnvironmentFlags;
  worldTimeSeconds: number;
  onWitnessObservation?: (observation: WitnessObservation) => void;
}

export const updateSurveillance = (
  params: SurveillanceUpdateParams
): void => {
  const {
    zone,
    mapArea,
    player,
    deltaMs,
    timestamp,
    dispatch,
    logStrings,
    reinforcementsScheduled,
    globalAlertLevel,
    timeOfDay,
    environmentFlags,
    worldTimeSeconds,
    onWitnessObservation,
  } = params;

  const cache = areaRuntimeCache[zone.areaId] ?? { lastPlayerPosition: undefined };
  const previousPlayerPosition = cache.lastPlayerPosition;
  const playerMoved = !previousPlayerPosition
    ? false
    : previousPlayerPosition.x !== player.position.x || previousPlayerPosition.y !== player.position.y;

  const getProximityRadius = (camera: CameraRuntimeState): number => {
    return camera.type === 'motionSensor'
      ? camera.motionRadius ?? camera.range
      : camera.range;
  };

  let camerasNearby = 0;
  let maxProgress = 0;
  let hudAlertState: CameraAlertState = CameraAlertState.IDLE;
  let activeCameraId: string | null = null;

  const updates: Array<{ cameraId: string; runtime: CameraRuntimeState; previous: CameraRuntimeState }> = [];
  let triggeredNetwork = false;
  let triggeredAlarm = false;

  Object.values(zone.cameras).forEach((camera) => {
    const runtime: CameraRuntimeState = {
      ...camera,
      position: { ...camera.position },
      hackState: { ...camera.hackState },
    };

    updateCameraOrientation(runtime, deltaMs);

    const detection = evaluateDetection(runtime, camera, player, mapArea, playerMoved, deltaMs, timestamp);

    runtime.alertState = detection.state;
    runtime.detectionProgress = detection.progress;
    runtime.lastDetectionTimestamp = detection.lastDetectionTimestamp;

    if (runtime.alertState === CameraAlertState.DISABLED) {
      runtime.detectionProgress = 0;
    }

    if (runtime.type !== 'motionSensor') {
      const shouldLock =
        runtime.isActive
        && detection.detectionActive
        && (
          runtime.alertState === CameraAlertState.SUSPICIOUS
          || runtime.alertState === CameraAlertState.INVESTIGATING
          || runtime.alertState === CameraAlertState.ALARMED
        );

      if (shouldLock) {
        const lockDirection = computeDirectionToPlayer(runtime, player);
        runtime.trackingPlayer = true;
        runtime.trackingDirection = lockDirection;
        runtime.currentDirection = lockDirection;
      } else if (runtime.trackingPlayer) {
        runtime.trackingPlayer = false;
        runtime.trackingDirection = undefined;
      }
    } else if (runtime.trackingPlayer) {
      runtime.trackingPlayer = false;
      runtime.trackingDirection = undefined;
    }

    const stateChanged = runtime.alertState !== camera.alertState;
    const directionChanged = runtime.currentDirection !== camera.currentDirection;
    const positionChanged = runtime.position.x !== camera.position.x || runtime.position.y !== camera.position.y;
    const progressChanged = Math.abs(runtime.detectionProgress - camera.detectionProgress) > 0.1;
    const timestampChanged = runtime.lastDetectionTimestamp !== camera.lastDetectionTimestamp;
    const sweepDirChanged = runtime.sweepDirection !== camera.sweepDirection ||
      runtime.sweepIndex !== camera.sweepIndex ||
      Math.abs((runtime.sweepElapsedMs ?? 0) - (camera.sweepElapsedMs ?? 0)) > 0.1;
    const trackingChanged = (runtime.trackingPlayer ?? false) !== (camera.trackingPlayer ?? false);
    const trackingDirectionChanged = runtime.trackingDirection !== camera.trackingDirection;

    if (
      stateChanged &&
      (
        runtime.alertState === CameraAlertState.SUSPICIOUS
        || runtime.alertState === CameraAlertState.INVESTIGATING
        || runtime.alertState === CameraAlertState.ALARMED
      )
    ) {
      const observation = buildCameraWitnessObservation({
        camera: runtime,
        player,
        mapArea,
        timeOfDay,
        environmentFlags,
        timestamp: worldTimeSeconds,
        alertState: runtime.alertState,
      });

      if (onWitnessObservation) {
        onWitnessObservation(observation);
      }
    }

    if (
      stateChanged
      || directionChanged
      || positionChanged
      || progressChanged
      || timestampChanged
      || sweepDirChanged
      || trackingChanged
      || trackingDirectionChanged
    ) {
      updates.push({ cameraId: camera.id, runtime, previous: camera });
    }

    if (stateChanged && runtime.alertState === CameraAlertState.ALARMED) {
      triggeredAlarm = true;
      recordAlarmForArea(zone.areaId, camera.id, timestamp);
    }

    if (runtime.isActive && runtime.alertState !== CameraAlertState.DISABLED) {
      const proximity = getProximityRadius(runtime);
      if (distanceBetween(runtime.position, player.position) <= proximity + 0.5) {
        camerasNearby += 1;
      }
    }

    if (runtime.detectionProgress > maxProgress) {
      maxProgress = runtime.detectionProgress;
      activeCameraId = camera.id;
    }

    if (getCameraAlertWeight(runtime.alertState) > getCameraAlertWeight(hudAlertState)) {
      hudAlertState = runtime.alertState;
    }
  });

  updates.forEach(({ cameraId, runtime, previous }) => {
    const changes: Partial<CameraRuntimeState> = {
      alertState: runtime.alertState,
      detectionProgress: runtime.detectionProgress,
      currentDirection: runtime.currentDirection,
      lastDetectionTimestamp: runtime.lastDetectionTimestamp,
      position: runtime.position,
      sweepDirection: runtime.sweepDirection,
      sweepIndex: runtime.sweepIndex,
      sweepElapsedMs: runtime.sweepElapsedMs,
      patrolProgressMs: runtime.patrolProgressMs,
      currentWaypointIndex: runtime.currentWaypointIndex,
      trackingPlayer: runtime.trackingPlayer,
      trackingDirection: runtime.trackingDirection,
    };

    if (!runtime.isActive) {
      changes.detectionProgress = 0;
      changes.alertState = CameraAlertState.DISABLED;
      changes.lastDetectionTimestamp = undefined;
      changes.trackingPlayer = false;
      changes.trackingDirection = undefined;
    }

    dispatch(
      updateCameraState({
        areaId: zone.areaId,
        cameraId,
        changes,
        timestamp,
      })
    );

    if (previous.alertState !== runtime.alertState) {
      const previousWeight = getCameraAlertWeight(previous.alertState);
      const nextWeight = getCameraAlertWeight(runtime.alertState);

      if (nextWeight > previousWeight) {
        if (runtime.alertState === CameraAlertState.SUSPICIOUS) {
          dispatch(addLogMessage(logStrings.cameraAlertSuspicious as string));
        } else if (runtime.alertState === CameraAlertState.INVESTIGATING) {
          dispatch(addLogMessage(logStrings.cameraAlertInvestigating as string));
        } else if (runtime.alertState === CameraAlertState.ALARMED) {
          dispatch(addLogMessage(logStrings.cameraAlertAlarmed as string));
        }
      }
    }
  });

  const history = alarmHistoryByArea[zone.areaId] ?? [];
  let effectiveNetworkAlert = zone.networkAlert;

  if (effectiveNetworkAlert && effectiveNetworkAlert.expiresAt <= timestamp) {
    dispatch(
      setCameraNetworkAlert({
        areaId: zone.areaId,
        alert: null,
      })
    );
    effectiveNetworkAlert = null;
  }

  if (!effectiveNetworkAlert && shouldTriggerNetworkAlert(zone.areaId)) {
    triggeredNetwork = true;
    const contributors = history.slice(-3).map((entry) => entry.cameraId);
    effectiveNetworkAlert = {
      triggeredAt: timestamp,
      expiresAt: timestamp + NETWORK_ALERT_DURATION_MS,
      contributingCameraIds: contributors,
    };
    dispatch(
      setCameraNetworkAlert({
        areaId: zone.areaId,
        alert: effectiveNetworkAlert,
      })
    );
  }

  const hudSnapshot = {
    camerasNearby,
    detectionProgress: Number(Math.min(100, maxProgress).toFixed(2)),
    alertState: hudAlertState,
    activeCameraId,
    networkAlertActive: Boolean(effectiveNetworkAlert),
    networkAlertExpiresAt: effectiveNetworkAlert?.expiresAt ?? null,
  };

  const prevHud = cache.hudSnapshot;
  const snapshotChanged =
    !prevHud ||
    prevHud.camerasNearby !== hudSnapshot.camerasNearby ||
    Math.abs(prevHud.detectionProgress - hudSnapshot.detectionProgress) > 0.5 ||
    prevHud.alertState !== hudSnapshot.alertState ||
    prevHud.activeCameraId !== hudSnapshot.activeCameraId ||
    prevHud.networkAlertActive !== hudSnapshot.networkAlertActive ||
    prevHud.networkAlertExpiresAt !== hudSnapshot.networkAlertExpiresAt;

  if (snapshotChanged) {
    dispatch(updateHudState(hudSnapshot));
    cache.hudSnapshot = hudSnapshot;
  }

  if (triggeredAlarm && !reinforcementsScheduled) {
    dispatch(addLogMessage(logStrings.reinforcementsIncoming as string));
    dispatch(scheduleReinforcements());
    dispatch(setGlobalAlertLevel(AlertLevel.ALARMED));
  } else if (triggeredNetwork) {
    dispatch(addLogMessage(logStrings.curfewReinforcement as string));
    dispatch(setGlobalAlertLevel(AlertLevel.ALARMED));
  } else if (triggeredAlarm && globalAlertLevel !== AlertLevel.ALARMED) {
    dispatch(setGlobalAlertLevel(AlertLevel.ALARMED));
  }

  areaRuntimeCache[zone.areaId] = {
    ...cache,
    lastPlayerPosition: { ...player.position },
    lastUpdateTimestamp: timestamp,
  };
};
