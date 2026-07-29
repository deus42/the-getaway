export const CHARACTER_SPRITE_STATES = ['idle', 'move', 'attack', 'interact'] as const;
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

export interface CharacterSpriteFrameSize {
  width: number;
  height: number;
}

export interface CharacterSpritePalette {
  accentColor?: number;
  glowColor?: number;
  shadowColor?: number;
}

export interface CharacterSpriteSheetMetrics {
  frameWidth: number;
  frameHeight: number;
  origin: {
    x: number;
    y: number;
  };
  footAnchorTolerancePx: number;
  states: Record<
    CharacterSpriteState,
    Record<CharacterSpriteDirection, { frameFootAnchorsPx: number[] }>
  >;
}

type HeroSpriteOwnership = {
  kind: 'hero';
  appearancePresets: string[];
};

type NpcSpriteOwnership = {
  kind: 'npc';
  dialogueId: string;
};

type EnemySpriteOwnership = {
  kind: 'enemy';
  resourceKey: string;
};

export interface CharacterSpriteManifestEntry {
  spriteSetId: string;
  owner: HeroSpriteOwnership | NpcSpriteOwnership | EnemySpriteOwnership;
  frameSize: CharacterSpriteFrameSize;
  frameCount: 4;
  stateFps: Record<CharacterSpriteState, number>;
  origin: {
    x: number;
    y: number;
  };
  footAnchorTolerancePx: number;
  worldScale: number;
  fallbackPalette?: CharacterSpritePalette;
}

const SHARED_FRAME_SIZE: CharacterSpriteFrameSize = {
  width: 64,
  height: 96,
};

const SHARED_STATE_FPS: Record<CharacterSpriteState, number> = {
  idle: 4,
  move: 7,
  attack: 9,
  interact: 5,
};

const createEntry = (
  spriteSetId: string,
  owner: CharacterSpriteManifestEntry['owner'],
  fallbackPalette: CharacterSpritePalette,
  worldScale = 1.18
): CharacterSpriteManifestEntry => ({
  spriteSetId,
  owner,
  frameSize: SHARED_FRAME_SIZE,
  frameCount: 4,
  stateFps: SHARED_STATE_FPS,
  origin: {
    x: 0.5,
    y: 0.92,
  },
  footAnchorTolerancePx: 2,
  worldScale,
  fallbackPalette,
});

export const CHARACTER_SPRITE_MANIFEST: CharacterSpriteManifestEntry[] = [
  createEntry(
    'hero_operative',
    { kind: 'hero', appearancePresets: ['operative', 'default'] },
    { accentColor: 0x5b7775, glowColor: 0x50bfd0, shadowColor: 0x0b0d12 },
    1.27
  ),
  createEntry(
    'hero_survivor',
    { kind: 'hero', appearancePresets: ['survivor'] },
    { accentColor: 0xd99a50, glowColor: 0xd99a50, shadowColor: 0x1b1f24 },
    1.27
  ),
  createEntry(
    'hero_tech',
    { kind: 'hero', appearancePresets: ['tech'] },
    { accentColor: 0x5b7775, glowColor: 0x50bfd0, shadowColor: 0x0b0d12 },
    1.27
  ),
  createEntry(
    'hero_scavenger',
    { kind: 'hero', appearancePresets: ['scavenger'] },
    { accentColor: 0x9a7748, glowColor: 0xd99a50, shadowColor: 0x2a201c },
    1.27
  ),
  createEntry('npc_lira_vendor', { kind: 'npc', dialogueId: 'npc_lira_vendor' }, {
    accentColor: 0xf472b6,
    glowColor: 0xf9a8d4,
    shadowColor: 0x500724,
  }),
  createEntry('npc_archivist_naila', { kind: 'npc', dialogueId: 'npc_archivist_naila' }, {
    accentColor: 0x60a5fa,
    glowColor: 0x93c5fd,
    shadowColor: 0x172554,
  }),
  createEntry('npc_courier_brant', { kind: 'npc', dialogueId: 'npc_courier_brant' }, {
    accentColor: 0xf59e0b,
    glowColor: 0xfbbf24,
    shadowColor: 0x78350f,
  }),
  createEntry('npc_firebrand_juno', { kind: 'npc', dialogueId: 'npc_firebrand_juno' }, {
    accentColor: 0xef4444,
    glowColor: 0xf87171,
    shadowColor: 0x450a0a,
  }),
  createEntry('npc_seraph_warden', { kind: 'npc', dialogueId: 'npc_seraph_warden' }, {
    accentColor: 0xa78bfa,
    glowColor: 0xc4b5fd,
    shadowColor: 0x2e1065,
  }),
  createEntry('npc_drone_handler_kesh', { kind: 'npc', dialogueId: 'npc_drone_handler_kesh' }, {
    accentColor: 0x14b8a6,
    glowColor: 0x2dd4bf,
    shadowColor: 0x042f2e,
  }),
  createEntry('npc_medic_yara', { kind: 'npc', dialogueId: 'npc_medic_yara' }, {
    accentColor: 0x10b981,
    glowColor: 0x34d399,
    shadowColor: 0x022c22,
  }),
  createEntry('npc_captain_reyna', { kind: 'npc', dialogueId: 'npc_captain_reyna' }, {
    accentColor: 0x8e4147,
    glowColor: 0xbc4d54,
    shadowColor: 0x2f1518,
  }),
  createEntry('npc_orn_patrol_sentry', { kind: 'npc', dialogueId: 'npc_guard_orn' }, {
    accentColor: 0xd99a50,
    glowColor: 0xd99a50,
    shadowColor: 0x0b0d12,
  }, 1.2),
  createEntry('enemy_corpsec_sweep_captain', { kind: 'enemy', resourceKey: 'enemies.corpsec_guard' }, {
    accentColor: 0x8e4147,
    glowColor: 0xbc4d54,
    shadowColor: 0x0b0d12,
  }, 1.2),
];

export const CHARACTER_SPRITE_MANIFEST_BY_ID = CHARACTER_SPRITE_MANIFEST.reduce<
  Record<string, CharacterSpriteManifestEntry>
>((acc, entry) => {
  acc[entry.spriteSetId] = entry;
  return acc;
}, {});

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
  if (appearancePreset) {
    const matched = CHARACTER_SPRITE_MANIFEST.find(
      (entry) =>
        entry.owner.kind === 'hero' &&
        entry.owner.appearancePresets.includes(appearancePreset)
    );
    if (matched) {
      return matched.spriteSetId;
    }
  }

  return CHARACTER_SPRITE_MANIFEST.find(
    (entry) =>
      entry.owner.kind === 'hero' &&
      entry.owner.appearancePresets.includes('operative')
  )?.spriteSetId;
};

export const resolveNpcSpriteSetId = (dialogueId?: string | null): string | undefined => {
  if (!dialogueId) {
    return undefined;
  }

  return CHARACTER_SPRITE_MANIFEST.find(
    (entry) => entry.owner.kind === 'npc' && entry.owner.dialogueId === dialogueId
  )?.spriteSetId;
};

export const resolveEnemySpriteSetId = (resourceKey?: string | null): string | undefined => {
  if (!resourceKey) {
    return undefined;
  }

  return CHARACTER_SPRITE_MANIFEST.find(
    (entry) => entry.owner.kind === 'enemy' && entry.owner.resourceKey === resourceKey
  )?.spriteSetId;
};
