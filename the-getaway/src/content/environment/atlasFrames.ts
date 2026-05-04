export const LEVEL0_ENVIRONMENT_ATLAS_KEY = 'level0Environment';
export const LEVEL0_ENVIRONMENT_ATLAS_IMAGE_PATH = 'atlases/level0_environment.png';
export const LEVEL0_ENVIRONMENT_ATLAS_JSON_PATH = 'atlases/level0_environment.json';
export const LEVEL0_ENVIRONMENT_NORMAL_KEY = 'level0EnvironmentNormal';
export const LEVEL0_ENVIRONMENT_NORMAL_PATH = 'normals/level0_environment_n.png';
export const GET155_PREVIEW_ATLAS_KEY = 'get155Preview';
export const GET155_PREVIEW_ATLAS_IMAGE_PATH = 'atlases/get155_preview.png';
export const GET155_PREVIEW_ATLAS_JSON_PATH = 'atlases/get155_preview.json';

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
  keypad: {
    frame: 'pickup_keypad',
    origin: { x: 0.5, y: 0.84 },
    scale: 0.54,
    alpha: 0.96,
  },
  datapad: {
    frame: 'pickup_datapad',
    origin: { x: 0.5, y: 0.84 },
    scale: 0.54,
    alpha: 0.96,
  },
  transitToken: {
    frame: 'pickup_transit_token',
    origin: { x: 0.5, y: 0.82 },
    scale: 0.52,
    alpha: 0.95,
  },
  medkit: {
    frame: 'pickup_medkit',
    origin: { x: 0.5, y: 0.84 },
    scale: 0.5,
    alpha: 0.94,
  },
} as const satisfies Record<string, EnvironmentAtlasFrameDefinition>;

export type Level0EnvironmentPropFrameId = keyof typeof LEVEL0_ENVIRONMENT_PROP_FRAMES;

export const GET155_PREVIEW_PROP_FRAMES = {
  buildingArtDeco: {
    frame: 'building_art_deco_a',
    origin: { x: 0.5, y: 0.94 },
    scale: 0.3,
    alpha: 0.92,
  },
  crate: {
    frame: 'prop_crate_a',
    origin: { x: 0.5, y: 0.88 },
    scale: 0.48,
    alpha: 0.92,
  },
  streetlight: {
    frame: 'prop_streetlight_a',
    origin: { x: 0.5, y: 0.91 },
    scale: 0.6,
    alpha: 0.94,
  },
  neonSign: {
    frame: 'prop_neon_sign_a',
    origin: { x: 0.5, y: 0.9 },
    scale: 0.55,
    alpha: 0.92,
  },
} as const satisfies Record<string, EnvironmentAtlasFrameDefinition>;

export type Get155PreviewFrameId = keyof typeof GET155_PREVIEW_PROP_FRAMES;
