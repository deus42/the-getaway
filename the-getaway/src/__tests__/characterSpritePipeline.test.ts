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
  resolveNpcSpriteSetId,
  resolvePlayerSpriteSetId,
} from '../content/characters/spriteManifest';
import {
  DEFAULT_CHARACTER_SPRITE_FACING,
  mapCardinalToSpriteDirection,
  resolveCharacterFacing,
} from '../game/visual/entities/characterPresentation';
import {
  isCharacterSpriteSetLoaded,
  preloadCharacterSpriteSheets,
  registerCharacterSpriteAnimations,
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
  it('resolves sprite set ids for hero appearance presets and NPC dialogue ids', () => {
    expect(resolvePlayerSpriteSetId('tech')).toBe('hero_tech');
    expect(resolvePlayerSpriteSetId('unknown-preset')).toBe('hero_operative');
    expect(resolvePlayerSpriteSetId()).toBe('hero_operative');

    expect(resolveNpcSpriteSetId('npc_archivist_naila')).toBe('npc_archivist_naila');
    expect(resolveNpcSpriteSetId(null)).toBeUndefined();
    expect(resolveNpcSpriteSetId('npc_missing')).toBeUndefined();
  });

  it('builds deterministic sheet, texture, and animation keys', () => {
    expect(getCharacterSpriteSheetPath('hero_operative', 'move', 'north-east')).toBe(
      'characters/hero_operative/move-north-east.png'
    );
    expect(getCharacterSpriteTextureKey('hero_operative', 'move', 'north-east')).toBe(
      'character:hero_operative:move:north-east:sheet'
    );
    expect(getCharacterSpriteAnimationKey('hero_operative', 'move', 'north-east')).toBe(
      'hero_operative:move:north-east'
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
  it('preloads every state and direction sheet from the manifest', () => {
    const scene = createMockScene();

    preloadCharacterSpriteSheets(scene);

    const expectedCallCount =
      CHARACTER_SPRITE_MANIFEST.length *
      CHARACTER_SPRITE_STATES.length *
      CHARACTER_SPRITE_DIRECTIONS.length;

    expect(scene.load.spritesheet).toHaveBeenCalledTimes(expectedCallCount);
    expect(scene.load.spritesheet).toHaveBeenCalledWith(
      'character:hero_operative:idle:north:sheet',
      'characters/hero_operative/idle-north.png',
      {
        frameWidth: 64,
        frameHeight: 96,
        endFrame: 3,
      }
    );
  });

  it('requires every sheet in a sprite set to be loaded before treating it as available', () => {
    const missingTextureKey = getCharacterSpriteTextureKey('hero_operative', 'attack', 'north-west');
    const scene = createMockScene({
      textureExists: (key) => key !== missingTextureKey,
    });

    expect(isCharacterSpriteSetLoaded(scene, 'hero_operative')).toBe(false);
    expect(isCharacterSpriteSetLoaded(scene, 'npc_archivist_naila')).toBe(true);
    expect(isCharacterSpriteSetLoaded(scene, 'missing-set')).toBe(false);
    expect(isCharacterSpriteSetLoaded(scene, undefined)).toBe(false);
  });

  it('registers looping and non-looping animations only for loaded sprite sets', () => {
    const skippedSpriteSet = 'npc_archivist_naila';
    const scene = createMockScene({
      textureExists: (key) => !key.startsWith(`character:${skippedSpriteSet}:`),
      animationExists: (key) => key === getCharacterSpriteAnimationKey('hero_operative', 'idle', 'north'),
    });

    registerCharacterSpriteAnimations(scene);

    const expectedCreatedAnimations =
      (CHARACTER_SPRITE_MANIFEST.length - 1) *
        CHARACTER_SPRITE_STATES.length *
        CHARACTER_SPRITE_DIRECTIONS.length -
      1;

    expect(scene.anims.create).toHaveBeenCalledTimes(expectedCreatedAnimations);

    const attackAnimation = (scene.anims.create as jest.Mock).mock.calls
      .map(([config]) => config)
      .find((config) => config.key === getCharacterSpriteAnimationKey('hero_operative', 'attack', 'south'));
    const idleAnimation = (scene.anims.create as jest.Mock).mock.calls
      .map(([config]) => config)
      .find((config) => config.key === getCharacterSpriteAnimationKey('hero_operative', 'idle', 'south'));

    expect(attackAnimation).toMatchObject({
      key: 'hero_operative:attack:south',
      frameRate: CHARACTER_SPRITE_MANIFEST[0].stateFps.attack,
      repeat: 0,
      frames: {
        key: 'character:hero_operative:attack:south:sheet',
        start: 0,
        end: 3,
      },
    });
    expect(idleAnimation).toMatchObject({
      key: 'hero_operative:idle:south',
      frameRate: CHARACTER_SPRITE_MANIFEST[0].stateFps.idle,
      repeat: -1,
      frames: {
        key: 'character:hero_operative:idle:south:sheet',
        start: 0,
        end: 3,
      },
    });
    expect((scene.anims.create as jest.Mock).mock.calls).not.toContainEqual([
      expect.objectContaining({ key: getCharacterSpriteAnimationKey(skippedSpriteSet, 'idle', 'north') }),
    ]);
  });
});
