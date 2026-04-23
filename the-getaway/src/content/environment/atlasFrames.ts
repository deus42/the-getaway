export const LEVEL0_ENVIRONMENT_ATLAS_KEY = 'level0Environment';
export const LEVEL0_ENVIRONMENT_ATLAS_IMAGE_PATH = 'atlases/level0_environment.png';
export const LEVEL0_ENVIRONMENT_ATLAS_JSON_PATH = 'atlases/level0_environment.json';
export const LEVEL0_ENVIRONMENT_NORMAL_KEY = 'level0EnvironmentNormal';
export const LEVEL0_ENVIRONMENT_NORMAL_PATH = 'normals/level0_environment_n.png';

export interface EnvironmentAtlasFrameDefinition {
  readonly frame: string;
  readonly origin: {
    readonly x: number;
    readonly y: number;
  };
  readonly scale: number;
  readonly alpha: number;
}

export const LEVEL0_ENVIRONMENT_SURFACE_FRAMES = {
  roadWear: {
    frame: 'utility_patch',
    origin: { x: 0.5, y: 0.58 },
    scale: 0.48,
    alpha: 0.54,
  },
  puddle: {
    frame: 'puddle_tile',
    origin: { x: 0.5, y: 0.58 },
    scale: 0.56,
    alpha: 0.58,
  },
  grate: {
    frame: 'grate_tile',
    origin: { x: 0.5, y: 0.58 },
    scale: 0.5,
    alpha: 0.56,
  },
} as const satisfies Record<string, EnvironmentAtlasFrameDefinition>;

export type Level0EnvironmentSurfaceFrameId = keyof typeof LEVEL0_ENVIRONMENT_SURFACE_FRAMES;

export const LEVEL0_ENVIRONMENT_PROP_FRAMES = {
  crate: {
    frame: 'dumpster_stack',
    origin: { x: 0.5, y: 0.88 },
    scale: 0.5,
    alpha: 0.88,
  },
  streetlight: {
    frame: 'street_lamp',
    origin: { x: 0.5, y: 0.86 },
    scale: 0.62,
    alpha: 0.92,
  },
  sign: {
    frame: 'neon_panel',
    origin: { x: 0.5, y: 0.84 },
    scale: 0.56,
    alpha: 0.86,
  },
  barrier: {
    frame: 'barricade_cart',
    origin: { x: 0.5, y: 0.88 },
    scale: 0.54,
    alpha: 0.88,
  },
  camera: {
    frame: 'camera_mast',
    origin: { x: 0.5, y: 0.88 },
    scale: 0.6,
    alpha: 0.9,
  },
  entryFacade: {
    frame: 'door_canopy',
    origin: { x: 0.5, y: 0.76 },
    scale: 0.5,
    alpha: 0.84,
  },
} as const satisfies Record<string, EnvironmentAtlasFrameDefinition>;

export type Level0EnvironmentPropFrameId = keyof typeof LEVEL0_ENVIRONMENT_PROP_FRAMES;
