jest.mock('phaser', () => ({
  __esModule: true,
  default: {},
}));

import {
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_STATES,
  getCharacterSpriteAnimationKey,
  getCharacterSpriteSheetPath,
  getCharacterSpriteTextureKey,
  resolveEnemySpriteSetId,
  resolveNpcSpriteSetId,
  resolvePlayerSpriteSetId,
} from '../content/characters/spriteManifest';
import {
  DEFAULT_CHARACTER_SPRITE_FACING,
  mapCardinalToSpriteDirection,
  resolveCharacterFacing,
} from '../game/visual/entities/characterPresentation';
import {
  areCharacterSpriteSheetRefsLoaded,
  isCharacterSpriteSetLoaded,
  preloadCharacterSpriteSheetRefs,
  preloadCharacterSpriteSheets,
  registerCharacterSpriteSheetAnimations,
  registerCharacterSpriteAnimations,
  type CharacterSpriteSheetRef,
} from '../game/visual/entities/characterSpriteAssets';
import type Phaser from 'phaser';

const createMockScene = ({
  textureExists = () => true,
  animationExists = () => false,
}: {
  textureExists?: (key: string) => boolean;
  animationExists?: (key: string) => boolean;
} = {}): Phaser.Scene => {
  const load = {
    spritesheet: jest.fn(),
  };
  const textures = {
    exists: jest.fn((key: string) => textureExists(key)),
  };
  const anims = {
    exists: jest.fn((key: string) => animationExists(key)),
    generateFrameNumbers: jest.fn((key: string, config: { start: number; end: number }) => ({
      key,
      start: config.start,
      end: config.end,
    })),
    create: jest.fn(),
  };

  return {
    load,
    textures,
    anims,
  } as unknown as Phaser.Scene;
};

describe('sprite manifest helpers', () => {
  it('resolves only authored appearance, contact, and security bindings', () => {
    expect(resolvePlayerSpriteSetId('player_civilian_03')).toBe('player_civilian_03');
    expect(resolvePlayerSpriteSetId('unknown-preset')).toBeUndefined();
    expect(resolvePlayerSpriteSetId()).toBeUndefined();

    expect(resolveNpcSpriteSetId('npc_archivist_naila')).toBe('contact_naila');
    expect(resolveNpcSpriteSetId(null)).toBeUndefined();
    expect(resolveNpcSpriteSetId('npc_missing')).toBeUndefined();
    expect(resolveEnemySpriteSetId('enemies.corpsec_guard')).toBe('security_hidzu_identity');
  });

  it('builds deterministic sheet, texture, and animation keys', () => {
    expect(getCharacterSpriteSheetPath('player_civilian_01', 'move', 'north-east')).toBe(
      'characters/player_civilian_01/move-north-east.png'
    );
    expect(getCharacterSpriteTextureKey('player_civilian_01', 'move', 'north-east')).toBe(
      'character:player_civilian_01:move:north-east:sheet'
    );
    expect(getCharacterSpriteAnimationKey('player_civilian_01', 'move', 'north-east')).toBe(
      'player_civilian_01:move:north-east'
    );
  });
});

describe('character presentation helpers', () => {
  it('maps cardinals to sprite directions and defaults south', () => {
    expect(mapCardinalToSpriteDirection('north')).toBe('north');
    expect(mapCardinalToSpriteDirection('east')).toBe('east');
    expect(mapCardinalToSpriteDirection('west')).toBe('west');
    expect(mapCardinalToSpriteDirection('south')).toBe('south');
    expect(mapCardinalToSpriteDirection(undefined)).toBe('south');
  });

  it('resolves diagonal and cardinal facing from movement deltas', () => {
    expect(resolveCharacterFacing({ x: 1, y: 1 }, { x: 2, y: 0 })).toBe('north-east');
    expect(resolveCharacterFacing({ x: 1, y: 1 }, { x: 2, y: 2 })).toBe('south-east');
    expect(resolveCharacterFacing({ x: 1, y: 1 }, { x: 0, y: 2 })).toBe('south-west');
    expect(resolveCharacterFacing({ x: 1, y: 1 }, { x: 0, y: 0 })).toBe('north-west');
    expect(resolveCharacterFacing({ x: 1, y: 1 }, { x: 2, y: 1 })).toBe('east');
    expect(resolveCharacterFacing({ x: 1, y: 1 }, { x: 0, y: 1 })).toBe('west');
    expect(resolveCharacterFacing({ x: 1, y: 1 }, { x: 1, y: 2 })).toBe('south');
    expect(resolveCharacterFacing({ x: 1, y: 1 }, { x: 1, y: 0 })).toBe('north');
  });

  it('falls back to the supplied cardinal or previous facing when stationary', () => {
    expect(
      resolveCharacterFacing(undefined, { x: 4, y: 5 }, 'west', DEFAULT_CHARACTER_SPRITE_FACING)
    ).toBe('west');
    expect(
      resolveCharacterFacing(
        { x: 4, y: 5 },
        { x: 4, y: 5 },
        undefined,
        'north-east'
      )
    ).toBe('north-east');
  });
});

describe('character sprite asset registration', () => {
  it('deduplicates and registers only valid requested sheet leaves', () => {
    const scene = createMockScene();
    const refs: CharacterSpriteSheetRef[] = [
      { spriteSetId: 'player_civilian_01', state: 'idle', direction: 'north' },
      { spriteSetId: 'player_civilian_01', state: 'idle', direction: 'north' },
      { spriteSetId: 'contact_lira', state: 'interact', direction: 'south-east' },
      { spriteSetId: 'unknown-set', state: 'idle', direction: 'south' },
    ];

    preloadCharacterSpriteSheetRefs(scene, refs);
    registerCharacterSpriteSheetAnimations(scene, refs);

    expect(scene.load.spritesheet).toHaveBeenCalledTimes(2);
    expect(scene.anims.create).toHaveBeenCalledTimes(2);
    expect(scene.anims.create).toHaveBeenCalledWith(expect.objectContaining({
      key: 'contact_lira:interact:south-east',
      repeat: 0,
    }));
    expect(areCharacterSpriteSheetRefsLoaded(scene, refs.slice(0, 3))).toBe(true);
    expect(areCharacterSpriteSheetRefsLoaded(scene, refs)).toBe(false);
  });

  it('rejects a partial presentation when one requested texture is missing', () => {
    const missing = getCharacterSpriteTextureKey('contact_lira', 'interact', 'south-east');
    const scene = createMockScene({ textureExists: (key) => key !== missing });
    const refs: CharacterSpriteSheetRef[] = [
      { spriteSetId: 'contact_lira', state: 'idle', direction: 'south-east' },
      { spriteSetId: 'contact_lira', state: 'interact', direction: 'south-east' },
    ];

    expect(areCharacterSpriteSheetRefsLoaded(scene, refs)).toBe(false);
  });

  it('preloads every state and direction sheet from the manifest', () => {
    const scene = createMockScene();

    preloadCharacterSpriteSheets(scene);

    const expectedCallCount =
      CHARACTER_SPRITE_MANIFEST.length *
      CHARACTER_SPRITE_STATES.length *
      CHARACTER_SPRITE_DIRECTIONS.length;

    expect(scene.load.spritesheet).toHaveBeenCalledTimes(expectedCallCount);
    expect(scene.load.spritesheet).toHaveBeenCalledWith(
      'character:player_civilian_01:idle:north:sheet',
      'characters/player_civilian_01/idle-north.png',
      {
        frameWidth: 64,
        frameHeight: 96,
        endFrame: 3,
      }
    );
  });

  it('requires every sheet in a sprite set to be loaded before treating it as available', () => {
    const missingTextureKey = getCharacterSpriteTextureKey('player_civilian_01', 'interact', 'north-west');
    const scene = createMockScene({
      textureExists: (key) => key !== missingTextureKey,
    });

    expect(isCharacterSpriteSetLoaded(scene, 'player_civilian_01')).toBe(false);
    expect(isCharacterSpriteSetLoaded(scene, 'contact_naila')).toBe(true);
    expect(isCharacterSpriteSetLoaded(scene, 'missing-set')).toBe(false);
    expect(isCharacterSpriteSetLoaded(scene, undefined)).toBe(false);
  });

  it('registers looping and non-looping animations only for loaded sprite sets', () => {
    const skippedSpriteSet = 'contact_naila';
    const scene = createMockScene({
      textureExists: (key) => !key.startsWith(`character:${skippedSpriteSet}:`),
      animationExists: (key) => key === getCharacterSpriteAnimationKey('player_civilian_01', 'idle', 'north'),
    });

    registerCharacterSpriteAnimations(scene);

    const expectedCreatedAnimations =
      (CHARACTER_SPRITE_MANIFEST.length - 1) *
        CHARACTER_SPRITE_STATES.length *
        CHARACTER_SPRITE_DIRECTIONS.length -
      1;

    expect(scene.anims.create).toHaveBeenCalledTimes(expectedCreatedAnimations);

    const interactAnimation = (scene.anims.create as jest.Mock).mock.calls
      .map(([config]) => config)
      .find((config) => config.key === getCharacterSpriteAnimationKey('player_civilian_01', 'interact', 'south'));
    const idleAnimation = (scene.anims.create as jest.Mock).mock.calls
      .map(([config]) => config)
      .find((config) => config.key === getCharacterSpriteAnimationKey('player_civilian_01', 'idle', 'south'));

    expect(interactAnimation).toMatchObject({
      key: 'player_civilian_01:interact:south',
      frameRate: CHARACTER_SPRITE_MANIFEST[0].stateFps.interact,
      repeat: 0,
      frames: {
        key: 'character:player_civilian_01:interact:south:sheet',
        start: 0,
        end: 3,
      },
    });
    expect(idleAnimation).toMatchObject({
      key: 'player_civilian_01:idle:south',
      frameRate: CHARACTER_SPRITE_MANIFEST[0].stateFps.idle,
      repeat: -1,
      frames: {
        key: 'character:player_civilian_01:idle:south:sheet',
        start: 0,
        end: 3,
      },
    });
    expect((scene.anims.create as jest.Mock).mock.calls).not.toContainEqual([
      expect.objectContaining({ key: getCharacterSpriteAnimationKey(skippedSpriteSet, 'idle', 'north') }),
    ]);
  });
});
