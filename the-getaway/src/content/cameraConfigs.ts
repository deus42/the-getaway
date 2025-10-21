import { CameraDefinition } from '../game/interfaces/types';

export interface ZoneCameraConfig {
  zoneId: string;
  cameras: CameraDefinition[];
}

const EVENING_CURFEW_PHASES: CameraDefinition['activationPhases'] = ['evening', 'night'];

const zoneCameraConfigs: ZoneCameraConfig[] = [
  {
    zoneId: 'downtown_checkpoint',
    cameras: [
      {
        id: 'downtown_training_static',
        type: 'static',
        position: { x: 28, y: 18 },
        range: 6,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        sweep: {
          angles: [300, 270, 240],
          cycleDurationMs: 2600,
        },
      },
      {
        id: 'downtown_static_01',
        type: 'static',
        position: { x: 18, y: 22 },
        range: 8,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        sweep: {
          angles: [310, 270, 230],
          cycleDurationMs: 3200,
        },
      },
      {
        id: 'downtown_static_02',
        type: 'static',
        position: { x: 52, y: 20 },
        range: 8,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        sweep: {
          angles: [45, 90, 135],
          cycleDurationMs: 3000,
        },
      },
      {
        id: 'downtown_motion_01',
        type: 'motionSensor',
        position: { x: 36, y: 44 },
        range: 4,
        fieldOfView: 360,
        activationPhases: EVENING_CURFEW_PHASES,
        motionRadius: 4,
      },
      {
        id: 'downtown_drone_01',
        type: 'drone',
        position: { x: 70, y: 16 },
        range: 10,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        patrolPath: {
          waypoints: [
            { x: 70, y: 16 },
            { x: 78, y: 28 },
            { x: 64, y: 34 },
            { x: 56, y: 22 },
          ],
          travelDurationMs: 12000,
        },
        sweep: {
          angles: [0, 45, 0, -45],
          cycleDurationMs: 2800,
        },
      },
    ],
  },
  {
    zoneId: 'gov_complex',
    cameras: [
      {
        id: 'gov_static_01',
        type: 'static',
        position: { x: 14, y: 12 },
        range: 9,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        sweep: {
          angles: [315, 270, 225, 180],
          cycleDurationMs: 3600,
        },
      },
      {
        id: 'gov_static_02',
        type: 'static',
        position: { x: 40, y: 10 },
        range: 9,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        sweep: {
          angles: [0, 45, 90],
          cycleDurationMs: 3600,
        },
      },
      {
        id: 'gov_motion_01',
        type: 'motionSensor',
        position: { x: 27, y: 26 },
        range: 4,
        fieldOfView: 360,
        activationPhases: EVENING_CURFEW_PHASES,
        motionRadius: 4,
      },
      {
        id: 'gov_motion_02',
        type: 'motionSensor',
        position: { x: 48, y: 26 },
        range: 4,
        fieldOfView: 360,
        activationPhases: EVENING_CURFEW_PHASES,
        motionRadius: 4,
      },
      {
        id: 'gov_drone_01',
        type: 'drone',
        position: { x: 56, y: 18 },
        range: 12,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        patrolPath: {
          waypoints: [
            { x: 56, y: 18 },
            { x: 70, y: 24 },
            { x: 60, y: 36 },
            { x: 46, y: 28 },
          ],
          travelDurationMs: 14000,
        },
        sweep: {
          angles: [15, 0, -15],
          cycleDurationMs: 2600,
        },
      },
      {
        id: 'gov_static_03',
        type: 'static',
        position: { x: 32, y: 6 },
        range: 9,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        sweep: {
          angles: [200, 240, 280],
          cycleDurationMs: 3400,
        },
      },
    ],
  },
  {
    zoneId: 'corporate_plaza',
    cameras: [
      {
        id: 'corp_static_01',
        type: 'static',
        position: { x: 12, y: 12 },
        range: 8,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        sweep: {
          angles: [40, 0, -40],
          cycleDurationMs: 3000,
        },
      },
      {
        id: 'corp_motion_01',
        type: 'motionSensor',
        position: { x: 26, y: 22 },
        range: 4,
        fieldOfView: 360,
        activationPhases: EVENING_CURFEW_PHASES,
        motionRadius: 4,
      },
      {
        id: 'corp_drone_01',
        type: 'drone',
        position: { x: 34, y: 14 },
        range: 10,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        patrolPath: {
          waypoints: [
            { x: 34, y: 14 },
            { x: 42, y: 16 },
            { x: 40, y: 28 },
            { x: 30, y: 24 },
          ],
          travelDurationMs: 10000,
        },
        sweep: {
          angles: [90, 120, 90, 60],
          cycleDurationMs: 2400,
        },
      },
    ],
  },
  {
    zoneId: 'industrial_corridor',
    cameras: [
      {
        id: 'ind_static_01',
        type: 'static',
        position: { x: 8, y: 32 },
        range: 9,
        fieldOfView: 90,
        activationPhases: EVENING_CURFEW_PHASES,
        sweep: {
          angles: [180, 210, 240],
          cycleDurationMs: 3200,
        },
      },
      {
        id: 'ind_motion_01',
        type: 'motionSensor',
        position: { x: 22, y: 40 },
        range: 4,
        fieldOfView: 360,
        activationPhases: EVENING_CURFEW_PHASES,
        motionRadius: 4,
      },
    ],
  },
  {
    zoneId: 'resistance_safehouse',
    cameras: [],
  },
];

export const getCameraConfigsForZone = (zoneId: string): CameraDefinition[] => {
  const config = zoneCameraConfigs.find((entry) => entry.zoneId === zoneId);
  return config ? config.cameras.map((camera) => ({ ...camera })) : [];
};

export const listCameraConfigZones = (): string[] => zoneCameraConfigs.map((config) => config.zoneId);

export const CAMERA_CONFIGS = zoneCameraConfigs;
