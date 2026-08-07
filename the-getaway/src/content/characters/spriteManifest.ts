import {
  ACTOR_PORTRAIT_INTEGRITY,
  GENERATED_ACTOR_PROVENANCE,
  NON_WORLD_PRESENTATION_INTEGRITY,
} from './generatedActorAssetIntegrity';

export const CHARACTER_SPRITE_STATES = ['idle', 'move', 'interact'] as const;
export type CharacterSpriteState = (typeof CHARACTER_SPRITE_STATES)[number];

export const CHARACTER_SPRITE_DIRECTIONS = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
] as const;
export type CharacterSpriteDirection = (typeof CHARACTER_SPRITE_DIRECTIONS)[number];

export const LEVEL0_PLAYER_APPEARANCE_IDS = [
  'player_civilian_01',
  'player_civilian_02',
  'player_civilian_03',
  'player_civilian_04',
] as const;

export type Level0PlayerAppearanceId = (typeof LEVEL0_PLAYER_APPEARANCE_IDS)[number];

/** One camera-independent production scale for every grounded Level 0 human. */
export const LEVEL0_ACTOR_WORLD_SCALE = 0.96 as const;

export const LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID: Level0PlayerAppearanceId =
  'player_civilian_01';

export const isLevel0PlayerAppearanceId = (
  value: unknown
): value is Level0PlayerAppearanceId =>
  typeof value === 'string' &&
  LEVEL0_PLAYER_APPEARANCE_IDS.includes(value as Level0PlayerAppearanceId);

export type CharacterActorOwnership = 'player' | 'contact' | 'security' | 'civilian';

export interface CharacterSpriteFrameSize {
  width: 64;
  height: 96;
}

export interface CharacterSpriteFrameMetrics {
  alphaBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  alphaPixelCount: number;
  footContactRowPx: number;
}

export interface CharacterSpriteSheetMetrics {
  schemaVersion: 2;
  actorId: string;
  frameWidth: 64;
  frameHeight: 96;
  origin: {
    x: 0.5;
    y: 0.92;
  };
  alphaOccupancy: CharacterAlphaOccupancyContract;
  states: Record<
    CharacterSpriteState,
    Record<CharacterSpriteDirection, { frames: CharacterSpriteFrameMetrics[] }>
  >;
}

export interface CharacterAlphaOccupancyContract {
  minHeightPx: 54;
  maxHeightPx: 64;
  footRowPx: 88;
  tolerancePx: 2;
}

export interface CharacterAssetProvenance {
  recipeId: 'get206-grounded-actor-v3';
  recipeSha256: string;
  generatorSha256: string;
  pngLibrarySha256: string;
  spriteReferenceId: 'get206-grounded-cast-board-v1';
  spriteReferenceSha256: 'bc16333c07710bd9bf3d78f1dc32e082bc6585cdce280c3a7fbf6bb107f433aa';
  portraitReferenceId: 'get206-grounded-portrait-board-v1';
  portraitReferenceSha256: '72545015a1d9cb3a78143a666a5bb941ed0bc69385247972988e23c4f4469d54';
}

export interface CharacterPortraitManifestEntry {
  portraitId: string;
  path: string;
  dimensions: {
    width: 256;
    height: 256;
  };
  safeArea: {
    x: 0.1;
    y: 0.1;
    width: 0.8;
    height: 0.8;
  };
  sha256: string;
  compressedBytes: number;
  decodedBytes: number;
  fallbackKey: 'portrait:neutral-diagnostic';
}

export interface CharacterSpriteBindings {
  appearancePresetIds?: readonly string[];
  dialogueIds?: readonly string[];
  resourceKeys?: readonly string[];
  visualRoleKey?: string;
}

export interface CharacterSpriteManifestEntry {
  actorId: string;
  ownership: CharacterActorOwnership;
  spriteSetId: string;
  bindings: CharacterSpriteBindings;
  frameSize: CharacterSpriteFrameSize;
  frameCount: 4;
  stateFps: Record<CharacterSpriteState, number>;
  origin: {
    x: 0.5;
    y: 0.92;
  };
  footAnchorTolerancePx: 2;
  worldScale: typeof LEVEL0_ACTOR_WORLD_SCALE;
  alphaOccupancy: CharacterAlphaOccupancyContract;
  depthPolicy: 'ground-anchor-y';
  portrait: CharacterPortraitManifestEntry;
  fallback: {
    kind: 'neutral-diagnostic';
    rigKey: 'neutral-diagnostic-human';
  };
  provenance: CharacterAssetProvenance;
}

export interface NonWorldCharacterPresentationEntry {
  presentationId: string;
  path: string;
  dimensions: {
    width: 256;
    height: 256;
  };
  safeArea: {
    x: 0.1;
    y: 0.1;
    width: 0.8;
    height: 0.8;
  };
  sha256: string;
  compressedBytes: number;
  decodedBytes: number;
  fallbackKey: 'portrait:neutral-diagnostic' | 'ar:neutral-diagnostic';
  background: 'opaque' | 'transparent';
  provenance: CharacterAssetProvenance;
}

const SHARED_FRAME_SIZE: CharacterSpriteFrameSize = {
  width: 64,
  height: 96,
};

const SHARED_STATE_FPS: Record<CharacterSpriteState, number> = {
  idle: 4,
  move: 7,
  interact: 5,
};

const SHARED_ORIGIN = {
  x: 0.5,
  y: 0.92,
} as const;

const SHARED_ALPHA_OCCUPANCY: CharacterAlphaOccupancyContract = {
  minHeightPx: 54,
  maxHeightPx: 64,
  footRowPx: 88,
  tolerancePx: 2,
};

const SHARED_PROVENANCE: CharacterAssetProvenance = {
  recipeId: GENERATED_ACTOR_PROVENANCE.recipeId,
  recipeSha256: GENERATED_ACTOR_PROVENANCE.recipe.sha256,
  generatorSha256: GENERATED_ACTOR_PROVENANCE.generator.sha256,
  pngLibrarySha256: GENERATED_ACTOR_PROVENANCE.pngLibrary.sha256,
  spriteReferenceId: GENERATED_ACTOR_PROVENANCE.spriteReference.id,
  spriteReferenceSha256: GENERATED_ACTOR_PROVENANCE.spriteReference.sha256,
  portraitReferenceId: GENERATED_ACTOR_PROVENANCE.portraitReference.id,
  portraitReferenceSha256: GENERATED_ACTOR_PROVENANCE.portraitReference.sha256,
};

const createPortrait = (actorId: string): CharacterPortraitManifestEntry => {
  const integrity = ACTOR_PORTRAIT_INTEGRITY[actorId];
  if (!integrity) throw new Error(`Missing generated portrait integrity for ${actorId}`);
  return {
    portraitId: `portrait_${actorId}`,
    path: `portraits/level0/${actorId}.png`,
    dimensions: { width: 256, height: 256 },
    safeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    ...integrity,
    fallbackKey: 'portrait:neutral-diagnostic',
  };
};

const createEntry = (
  actorId: string,
  ownership: CharacterActorOwnership,
  bindings: CharacterSpriteBindings
): CharacterSpriteManifestEntry => ({
  actorId,
  ownership,
  spriteSetId: actorId,
  bindings,
  frameSize: SHARED_FRAME_SIZE,
  frameCount: 4,
  stateFps: SHARED_STATE_FPS,
  origin: SHARED_ORIGIN,
  footAnchorTolerancePx: 2,
  worldScale: LEVEL0_ACTOR_WORLD_SCALE,
  alphaOccupancy: SHARED_ALPHA_OCCUPANCY,
  depthPolicy: 'ground-anchor-y',
  portrait: createPortrait(actorId),
  fallback: {
    kind: 'neutral-diagnostic',
    rigKey: 'neutral-diagnostic-human',
  },
  provenance: SHARED_PROVENANCE,
});

export const CHARACTER_SPRITE_MANIFEST: CharacterSpriteManifestEntry[] = [
  createEntry('player_civilian_01', 'player', {
    appearancePresetIds: ['player_civilian_01'],
    visualRoleKey: 'protagonist-preset-01',
  }),
  createEntry('player_civilian_02', 'player', {
    appearancePresetIds: ['player_civilian_02'],
    visualRoleKey: 'protagonist-preset-02',
  }),
  createEntry('player_civilian_03', 'player', {
    appearancePresetIds: ['player_civilian_03'],
    visualRoleKey: 'protagonist-preset-03',
  }),
  createEntry('player_civilian_04', 'player', {
    appearancePresetIds: ['player_civilian_04'],
    visualRoleKey: 'protagonist-preset-04',
  }),
  createEntry('contact_lira', 'contact', {
    dialogueIds: ['npc_lira_vendor'],
    visualRoleKey: 'medical-supplies-contact',
  }),
  createEntry('contact_naila', 'contact', {
    dialogueIds: ['npc_archivist_naila'],
    visualRoleKey: 'systems-contact',
  }),
  createEntry('contact_brant', 'contact', {
    dialogueIds: ['npc_courier_brant'],
    visualRoleKey: 'service-courier-contact',
  }),
  createEntry('security_hidzu_identity', 'security', {
    resourceKeys: ['enemies.corpsec_guard'],
    visualRoleKey: 'identity-verification-staff',
  }),
  createEntry('security_hidzu_service', 'security', {
    resourceKeys: ['npcs.hidzu_service_verifier'],
    visualRoleKey: 'service-verification-staff',
  }),
  createEntry('civilian_transit', 'civilian', {
    visualRoleKey: 'transit-commuter',
  }),
  createEntry('civilian_service', 'civilian', {
    visualRoleKey: 'service-worker',
  }),
  createEntry('civilian_delivery', 'civilian', {
    visualRoleKey: 'delivery-worker',
  }),
];

export const CHARACTER_SPRITE_MANIFEST_BY_ID = CHARACTER_SPRITE_MANIFEST.reduce<
  Record<string, CharacterSpriteManifestEntry>
>((acc, entry) => {
  acc[entry.spriteSetId] = entry;
  return acc;
}, {});

export const NON_WORLD_CHARACTER_PRESENTATIONS = {
  takahiroBroadcast: {
    presentationId: 'portrait_takahiro_broadcast',
    path: 'portraits/level0/takahiro_broadcast.png',
    dimensions: { width: 256, height: 256 },
    safeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    ...NON_WORLD_PRESENTATION_INTEGRITY.takahiroBroadcast,
    fallbackKey: 'portrait:neutral-diagnostic',
    background: 'opaque',
    provenance: SHARED_PROVENANCE,
  },
  georgeAr: {
    presentationId: 'george_ar_idle',
    path: 'characters/george/george-ar-idle.png',
    dimensions: { width: 256, height: 256 },
    safeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    ...NON_WORLD_PRESENTATION_INTEGRITY.georgeAr,
    fallbackKey: 'ar:neutral-diagnostic',
    background: 'transparent',
    provenance: SHARED_PROVENANCE,
  },
} as const satisfies Record<string, NonWorldCharacterPresentationEntry>;

export const getCharacterSpriteSheetPath = (
  spriteSetId: string,
  state: CharacterSpriteState,
  direction: CharacterSpriteDirection
): string => `characters/${spriteSetId}/${state}-${direction}.png`;

export const getCharacterSpriteMetricsPath = (spriteSetId: string): string =>
  `characters/${spriteSetId}/sheet-metrics.json`;

export const getCharacterSpriteTextureKey = (
  spriteSetId: string,
  state: CharacterSpriteState,
  direction: CharacterSpriteDirection
): string => `character:${spriteSetId}:${state}:${direction}:sheet`;

export const getCharacterSpriteAnimationKey = (
  spriteSetId: string,
  state: CharacterSpriteState,
  direction: CharacterSpriteDirection
): string => `${spriteSetId}:${state}:${direction}`;

export const resolvePlayerSpriteSetId = (appearancePreset?: string): string | undefined => {
  if (!appearancePreset) {
    return undefined;
  }

  return CHARACTER_SPRITE_MANIFEST.find(
    (entry) =>
      entry.ownership === 'player' &&
      entry.bindings.appearancePresetIds?.includes(appearancePreset)
  )?.spriteSetId;
};

export const resolveNpcSpriteSetId = (dialogueId?: string | null): string | undefined => {
  if (!dialogueId) {
    return undefined;
  }

  return CHARACTER_SPRITE_MANIFEST.find(
    (entry) =>
      entry.ownership === 'contact' && entry.bindings.dialogueIds?.includes(dialogueId)
  )?.spriteSetId;
};

export const resolveEnemySpriteSetId = (resourceKey?: string | null): string | undefined => {
  if (!resourceKey) {
    return undefined;
  }

  return CHARACTER_SPRITE_MANIFEST.find(
    (entry) =>
      entry.ownership === 'security' && entry.bindings.resourceKeys?.includes(resourceKey)
  )?.spriteSetId;
};
