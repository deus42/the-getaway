import {
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_STATES,
  getCharacterSpriteSheetPath,
  resolveEnemySpriteSetId,
  resolveNpcSpriteSetId,
  resolvePlayerSpriteSetId,
} from '../content/characters/spriteManifest';

const EXPECTED_ACTOR_IDS = [
  'player_civilian_01',
  'player_civilian_02',
  'player_civilian_03',
  'player_civilian_04',
  'contact_lira',
  'contact_naila',
  'contact_brant',
  'security_hidzu_identity',
  'security_hidzu_service',
  'civilian_transit',
  'civilian_service',
  'civilian_delivery',
] as const;

const BANNED_ID_TERMS = [
  'operative',
  'survivor',
  'tech',
  'scavenger',
  'ghost',
  'wire',
  'force',
  'enemy',
  'warden',
  'firebrand',
  'attack',
];

type RuntimeManifestEntry = {
  actorId: string;
  ownership: 'player' | 'contact' | 'security' | 'civilian';
  spriteSetId: string;
  frameSize: { width: number; height: number };
  frameCount: number;
  origin: { x: number; y: number };
  worldScale: number;
  alphaOccupancy: {
    minHeightPx: number;
    maxHeightPx: number;
    footRowPx: number;
    tolerancePx: number;
  };
  depthPolicy: string;
  portrait: {
    portraitId: string;
    path: string;
    dimensions: { width: number; height: number };
    safeArea: { x: number; y: number; width: number; height: number };
    sha256: string;
    compressedBytes: number;
    fallbackKey: string;
  };
  fallback: { kind: string; rigKey: string };
  provenance: {
    recipeId: string;
    recipeSha256: string;
    generatorSha256: string;
    pngLibrarySha256: string;
    spriteReferenceId: string;
    spriteReferenceSha256: string;
    portraitReferenceId: string;
    portraitReferenceSha256: string;
  };
};

const runtimeEntries = CHARACTER_SPRITE_MANIFEST as unknown as RuntimeManifestEntry[];

const expectSafeRuntimePath = (assetPath: string): void => {
  expect(assetPath.startsWith('/')).toBe(false);
  expect(assetPath).not.toContain('..');
  expect(assetPath).not.toContain('\\');
};

describe('canonical Level 0 actor contract', () => {
  it('contains exactly twelve grounded actors and only three noncombat states', () => {
    expect(CHARACTER_SPRITE_STATES).toEqual(['idle', 'move', 'interact']);
    expect(CHARACTER_SPRITE_DIRECTIONS).toHaveLength(8);
    expect(runtimeEntries.map((entry) => entry.actorId)).toEqual(EXPECTED_ACTOR_IDS);
    expect(runtimeEntries.map((entry) => entry.spriteSetId)).toEqual(EXPECTED_ACTOR_IDS);

    const ownershipCounts = runtimeEntries.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.ownership] = (counts[entry.ownership] ?? 0) + 1;
      return counts;
    }, {});

    expect(ownershipCounts).toEqual({ player: 4, contact: 3, security: 2, civilian: 3 });
    expect(runtimeEntries).toHaveLength(12);
  });

  it('rejects class, package, combat, and fantasy identity semantics', () => {
    for (const entry of runtimeEntries) {
      const normalizedId = `${entry.actorId}:${entry.spriteSetId}`.toLowerCase();
      for (const bannedTerm of BANNED_ID_TERMS) {
        expect(normalizedId).not.toContain(bannedTerm);
      }
    }
  });

  it('owns frame, anchor, scale, portrait, fallback, and provenance metadata', () => {
    for (const entry of runtimeEntries) {
      expect(entry.frameSize).toEqual({ width: 64, height: 96 });
      expect(entry.frameCount).toBe(4);
      expect(entry.origin).toEqual({ x: 0.5, y: 0.92 });
      expect(entry.worldScale).toBe(1.3);
      expect(entry.alphaOccupancy).toEqual({
        minHeightPx: 54,
        maxHeightPx: 64,
        footRowPx: 88,
        tolerancePx: 2,
      });
      expect(entry.depthPolicy).toBe('ground-anchor-y');
      expect(entry.fallback).toEqual({
        kind: 'neutral-diagnostic',
        rigKey: 'neutral-diagnostic-human',
      });
      expect(entry.portrait.dimensions).toEqual({ width: 256, height: 256 });
      expect(entry.portrait.safeArea).toEqual({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
      expect(entry.portrait.fallbackKey).toBe('portrait:neutral-diagnostic');
      expect(entry.portrait.path).toBe(`portraits/level0/${entry.actorId}.png`);
      expect(entry.portrait.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.portrait.compressedBytes).toBeGreaterThan(0);
      expectSafeRuntimePath(entry.portrait.path);
      expect(entry.provenance).toMatchObject({
        recipeId: 'get206-grounded-actor-v2',
        spriteReferenceId: 'get206-grounded-cast-board-v1',
        spriteReferenceSha256:
          'bc16333c07710bd9bf3d78f1dc32e082bc6585cdce280c3a7fbf6bb107f433aa',
        portraitReferenceId: 'get206-grounded-portrait-board-v1',
        portraitReferenceSha256:
          '72545015a1d9cb3a78143a666a5bb941ed0bc69385247972988e23c4f4469d54',
      });
      expect(entry.provenance.recipeSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.provenance.generatorSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.provenance.pngLibrarySha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('has a complete safe 8×3 sheet path matrix for every actor', () => {
    for (const entry of runtimeEntries) {
      for (const state of CHARACTER_SPRITE_STATES) {
        for (const direction of CHARACTER_SPRITE_DIRECTIONS) {
          const sheetPath = getCharacterSpriteSheetPath(entry.spriteSetId, state, direction);
          expect(sheetPath).toBe(`characters/${entry.spriteSetId}/${state}-${direction}.png`);
          expectSafeRuntimePath(sheetPath);
        }
      }
    }
  });

  it('resolves only authored neutral player presets and grounded resource bindings', () => {
    expect(resolvePlayerSpriteSetId('player_civilian_01')).toBe('player_civilian_01');
    expect(resolvePlayerSpriteSetId('player_civilian_04')).toBe('player_civilian_04');
    expect(resolvePlayerSpriteSetId('unknown-preset')).toBeUndefined();
    expect(resolvePlayerSpriteSetId()).toBeUndefined();

    expect(resolveNpcSpriteSetId('npc_lira_vendor')).toBe('contact_lira');
    expect(resolveNpcSpriteSetId('npc_archivist_naila')).toBe('contact_naila');
    expect(resolveNpcSpriteSetId('npc_courier_brant')).toBe('contact_brant');
    expect(resolveNpcSpriteSetId('npc_firebrand_juno')).toBeUndefined();

    expect(resolveEnemySpriteSetId('enemies.corpsec_guard')).toBe('security_hidzu_identity');
    expect(resolveEnemySpriteSetId('enemies.missing')).toBeUndefined();
  });

  it('registers exactly Takahiro broadcast and George AR as non-world presentations', () => {
    const module = jest.requireActual('../content/characters/spriteManifest') as {
      NON_WORLD_CHARACTER_PRESENTATIONS?: Record<string, unknown>;
    };
    const presentations = module.NON_WORLD_CHARACTER_PRESENTATIONS as Record<
      string,
      {
        presentationId: string;
        path: string;
        dimensions: { width: number; height: number };
        fallbackKey: string;
        background: 'opaque' | 'transparent';
      }
    >;

    expect(Object.keys(presentations)).toEqual(['takahiroBroadcast', 'georgeAr']);
    expect(presentations.takahiroBroadcast).toMatchObject({
      presentationId: 'portrait_takahiro_broadcast',
      path: 'portraits/level0/takahiro_broadcast.png',
      dimensions: { width: 256, height: 256 },
      fallbackKey: 'portrait:neutral-diagnostic',
      background: 'opaque',
    });
    expect(presentations.georgeAr).toMatchObject({
      presentationId: 'george_ar_idle',
      path: 'characters/george/george-ar-idle.png',
      dimensions: { width: 256, height: 256 },
      fallbackKey: 'ar:neutral-diagnostic',
      background: 'transparent',
    });
    expectSafeRuntimePath(presentations.takahiroBroadcast.path);
    expectSafeRuntimePath(presentations.georgeAr.path);
  });
});
