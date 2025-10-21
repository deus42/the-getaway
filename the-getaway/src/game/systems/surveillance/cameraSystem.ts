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
import { clamp } from '../../utils/math';
import { buildCameraWitnessObservation } from '../suspicion/observationBuilders';
import type { WitnessObservation } from '../suspicion/types';
import type { LogStrings } from '../../../content/system';

const PROGRESS_GAIN_PER_MS = 100 / 3000; // 0 → 100 over ~3s
const PROGRESS_DECAY_PER_MS = 100 / 4000; // decay back to idle in ~4s
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

  if (player.isCrouching) {
    effective *= 0.5;
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
      detectionActive = distance <= range && playerMoved && !player.isCrouching;
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
    progress += PROGRESS_GAIN_PER_MS * deltaMs;
    progress = Math.min(100, progress);
    lastDetectionTimestamp = timestamp;
  } else {
    progress -= PROGRESS_DECAY_PER_MS * deltaMs;
    progress = Math.max(0, progress);
  }

  let state: CameraAlertState = CameraAlertState.IDLE;

  if (progress >= 100) {
    state = CameraAlertState.ALARMED;
    progress = 100;
  } else if (progress > 0) {
    state = CameraAlertState.SUSPICIOUS;
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

  const getAlertWeight = (state: CameraAlertState): number => {
    switch (state) {
      case CameraAlertState.ALARMED:
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

    const stateChanged = runtime.alertState !== camera.alertState;
    const directionChanged = runtime.currentDirection !== camera.currentDirection;
    const positionChanged = runtime.position.x !== camera.position.x || runtime.position.y !== camera.position.y;
    const progressChanged = Math.abs(runtime.detectionProgress - camera.detectionProgress) > 0.1;
    const timestampChanged = runtime.lastDetectionTimestamp !== camera.lastDetectionTimestamp;
    const sweepDirChanged = runtime.sweepDirection !== camera.sweepDirection ||
      runtime.sweepIndex !== camera.sweepIndex ||
      Math.abs((runtime.sweepElapsedMs ?? 0) - (camera.sweepElapsedMs ?? 0)) > 0.1;

    if (
      stateChanged &&
      (runtime.alertState === CameraAlertState.SUSPICIOUS || runtime.alertState === CameraAlertState.ALARMED)
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

    if (stateChanged || directionChanged || positionChanged || progressChanged || timestampChanged || sweepDirChanged) {
      updates.push({ cameraId: camera.id, runtime, previous: camera });
    }

    if (stateChanged && runtime.alertState === CameraAlertState.ALARMED) {
      triggeredAlarm = true;
      recordAlarmForArea(zone.areaId, camera.id, timestamp);
    }

    if (runtime.isActive && runtime.alertState !== CameraAlertState.DISABLED) {
      const proximity = getProximityRadius(runtime);
      const distance = distanceBetween(runtime.position, player.position);
      if (distance <= proximity + 0.5) {
        camerasNearby += 1;
      }
    }

    if (runtime.detectionProgress > maxProgress) {
      maxProgress = runtime.detectionProgress;
      activeCameraId = camera.id;
    }

    if (getAlertWeight(runtime.alertState) > getAlertWeight(hudAlertState)) {
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
    };

    if (!runtime.isActive) {
      changes.detectionProgress = 0;
      changes.alertState = CameraAlertState.DISABLED;
      changes.lastDetectionTimestamp = undefined;
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
      if (runtime.alertState === CameraAlertState.SUSPICIOUS && previous.alertState === CameraAlertState.IDLE) {
        dispatch(addLogMessage(logStrings.alertSuspicious as string));
      }
      if (runtime.alertState === CameraAlertState.ALARMED && previous.alertState !== CameraAlertState.ALARMED) {
        dispatch(addLogMessage(logStrings.alertAlarmed as string));
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
