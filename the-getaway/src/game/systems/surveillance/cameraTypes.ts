import {
  CameraAlertState,
  CameraDefinition,
  CameraRuntimeState,
} from '../../interfaces/types';
import {
  clamp,
  lerp,
  radiansToDegrees,
  shortestAngleBetween,
  wrapDegrees,
} from '../../utils/math';

const MIN_SWEEP_DURATION = 400;
const DEFAULT_SWEEP_DURATION = 3200;

const safeCycleDuration = (value?: number): number => {
  const sanitized = typeof value === 'number' && Number.isFinite(value) ? Math.abs(value) : DEFAULT_SWEEP_DURATION;
  return Math.max(MIN_SWEEP_DURATION, sanitized);
};

const normaliseAngle = (angle: number): number => {
  const wrapped = wrapDegrees(angle);
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

export const createCameraRuntimeState = (
  definition: CameraDefinition
): CameraRuntimeState => {
  const sweepAngles = definition.sweep?.angles ?? [];
  const initialDirection = sweepAngles.length > 0
    ? normaliseAngle(sweepAngles[0])
    : normaliseAngle(definition.fieldOfView >= 360 ? 0 : definition.fieldOfView / 2);

  return {
    ...definition,
    alertState: CameraAlertState.IDLE,
    detectionProgress: 0,
    isActive: false,
    hackState: {},
    lastDetectionTimestamp: undefined,
    currentDirection: initialDirection,
    sweepDirection: 1,
    sweepElapsedMs: 0,
    sweepIndex: 0,
    patrolProgressMs: 0,
    currentWaypointIndex: 0,
    networkAlertContributionAt: undefined,
  };
};

type SweepResult = {
  direction: number;
  sweepDirection: 1 | -1;
  sweepIndex: number;
  sweepElapsedMs: number;
};

const advanceSweep = (
  camera: CameraRuntimeState,
  deltaMs: number,
  relative: boolean,
  baseDirection: number
): SweepResult => {
  const sweep = camera.sweep;
  if (!sweep || sweep.angles.length === 0) {
    return {
      direction: relative ? baseDirection : camera.currentDirection,
      sweepDirection: camera.sweepDirection ?? 1,
      sweepIndex: camera.sweepIndex ?? 0,
      sweepElapsedMs: camera.sweepElapsedMs ?? 0,
    };
  }

  const angles = sweep.angles;
  const count = angles.length;

  if (count === 1) {
    const absolute = relative ? baseDirection + angles[0] : angles[0];
    return {
      direction: normaliseAngle(absolute),
      sweepDirection: camera.sweepDirection ?? 1,
      sweepIndex: 0,
      sweepElapsedMs: 0,
    };
  }

  let sweepDirection: 1 | -1 = camera.sweepDirection ?? 1;
  let currentIndex = clamp(camera.sweepIndex ?? 0, 0, count - 1);
  let elapsed = (camera.sweepElapsedMs ?? 0) + deltaMs;

  const segmentDuration = safeCycleDuration(sweep.cycleDurationMs) / (count - 1);

  while (elapsed >= segmentDuration) {
    elapsed -= segmentDuration;
    let nextIndex = currentIndex + sweepDirection;

    if (nextIndex >= count) {
      sweepDirection = -1;
      nextIndex = count - 2;
    } else if (nextIndex < 0) {
      sweepDirection = 1;
      nextIndex = 1;
    }

    currentIndex = clamp(nextIndex, 0, count - 1);
  }

  const nextIndex = clamp(currentIndex + sweepDirection, 0, count - 1);
  const ratio = clamp(segmentDuration === 0 ? 0 : elapsed / segmentDuration, 0, 1);

  const startAngle = angles[currentIndex];
  const endAngle = angles[nextIndex];
  const diff = shortestAngleBetween(startAngle, endAngle);
  const interpolated = startAngle + diff * ratio;
  const absolute = relative ? baseDirection + interpolated : interpolated;

  return {
    direction: normaliseAngle(absolute),
    sweepDirection,
    sweepIndex: currentIndex,
    sweepElapsedMs: elapsed,
  };
};

export const updateStaticCameraOrientation = (
  camera: CameraRuntimeState,
  deltaMs: number
): CameraRuntimeState => {
  const sweep = advanceSweep(camera, deltaMs, false, 0);
  camera.currentDirection = sweep.direction;
  camera.sweepDirection = sweep.sweepDirection;
  camera.sweepIndex = sweep.sweepIndex;
  camera.sweepElapsedMs = sweep.sweepElapsedMs;
  return camera;
};

const wrapWaypointIndex = (index: number, count: number): number => {
  if (count === 0) {
    return 0;
  }
  if (index < 0) {
    return count - 1;
  }
  if (index >= count) {
    return 0;
  }
  return index;
};

export const updateDroneCameraOrientation = (
  camera: CameraRuntimeState,
  deltaMs: number
): CameraRuntimeState => {
  const path = camera.patrolPath;
  if (!path || path.waypoints.length === 0) {
    return updateStaticCameraOrientation(camera, deltaMs);
  }

  const waypoints = path.waypoints;
  const segmentDuration = safeCycleDuration(path.travelDurationMs) / waypoints.length;
  let progress = (camera.patrolProgressMs ?? 0) + deltaMs;
  let currentIndex = wrapWaypointIndex(camera.currentWaypointIndex ?? 0, waypoints.length);
  let nextIndex = wrapWaypointIndex(currentIndex + 1, waypoints.length);

  while (progress >= segmentDuration) {
    progress -= segmentDuration;
    currentIndex = nextIndex;
    nextIndex = wrapWaypointIndex(currentIndex + 1, waypoints.length);
  }

  const from = waypoints[currentIndex];
  const to = waypoints[nextIndex];

  const ratio = segmentDuration <= 0 ? 0 : clamp(progress / segmentDuration, 0, 1);
  const interpolatedX = lerp(from.x, to.x, ratio);
  const interpolatedY = lerp(from.y, to.y, ratio);

  const heading = Math.atan2(to.y - from.y, to.x - from.x);
  const headingDegrees = radiansToDegrees(heading);

  const sweep = advanceSweep(camera, deltaMs, true, headingDegrees);

  camera.position = { x: interpolatedX, y: interpolatedY };
  camera.currentDirection = sweep.direction;
  camera.currentWaypointIndex = currentIndex;
  camera.patrolProgressMs = progress;
  camera.sweepDirection = sweep.sweepDirection;
  camera.sweepIndex = sweep.sweepIndex;
  camera.sweepElapsedMs = sweep.sweepElapsedMs;

  return camera;
};

export const updateCameraOrientation = (
  camera: CameraRuntimeState,
  deltaMs: number
): CameraRuntimeState => {
  switch (camera.type) {
    case 'drone':
      return updateDroneCameraOrientation(camera, deltaMs);
    case 'static':
    case 'motionSensor':
    default:
      return updateStaticCameraOrientation(camera, deltaMs);
  }
};

export const isCameraDisabled = (camera: CameraRuntimeState, timestamp: number): boolean => {
  const { hackState } = camera;
  if (!hackState) {
    return false;
  }
  if (hackState.disabledUntil && hackState.disabledUntil > timestamp) {
    return true;
  }
  return false;
};

export const isCameraLoopingFootage = (camera: CameraRuntimeState, timestamp: number): boolean => {
  const { hackState } = camera;
  return Boolean(hackState?.loopFootageUntil && hackState.loopFootageUntil > timestamp);
};

export const resetCameraAlertState = (camera: CameraRuntimeState): CameraRuntimeState => {
  camera.alertState = CameraAlertState.IDLE;
  camera.detectionProgress = 0;
  camera.lastDetectionTimestamp = undefined;
  return camera;
};
