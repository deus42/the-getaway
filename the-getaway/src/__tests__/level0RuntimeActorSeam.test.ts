jest.mock('phaser', () => ({
  __esModule: true,
  default: {},
}));

import { createInitialLevel0RunState } from '../game/level0/runtime/safehouse';
import { createTestLevel0RunState } from '../game/level0/testing/createTestLevel0RunState';
import { createConfirmedLevel0Sample } from '../game/level0/rpg/creation';
import {
  preloadCharacterSpriteSheetRefs,
} from '../game/visual/entities/characterSpriteAssets';
import { resolveLevel0SceneSpriteSheetRefs } from '../game/level0/scene/level0ActorPresentation';
import type Phaser from 'phaser';

const createMockScene = (): Phaser.Scene => ({
  load: {
    spritesheet: jest.fn(),
  },
} as unknown as Phaser.Scene);

describe('Level 0 actor runtime seam', () => {
  it('requires a player-confirmed identity and build instead of a production sample default', () => {
    expect(() => createInitialLevel0RunState(
      'actor-missing-identity',
      undefined as never,
      undefined as never
    )).toThrow();
  });

  it('keeps test fixtures on the first grounded civilian appearance', () => {
    expect(createTestLevel0RunState('actor-default').identity.appearancePresetId).toBe(
      'player_civilian_01'
    );
  });

  it('rejects an appearance outside the grounded protagonist roster', () => {
    const sample = createConfirmedLevel0Sample('social_mental', 'Mara');
    expect(() => createInitialLevel0RunState(
      'actor-invalid',
      { ...sample.identity, appearancePresetId: 'hero_operative' },
      sample.build
    )).toThrow(
      'Unknown Level 0 appearance preset: hero_operative'
    );
  });

  it('selectively preloads the 30 reachable protagonist/contact presentation leaves', () => {
    const scene = createMockScene();
    const refs = resolveLevel0SceneSpriteSheetRefs('player_civilian_04');

    preloadCharacterSpriteSheetRefs(scene, refs);

    expect(refs).toHaveLength(30);
    expect(new Set(refs.map((ref) => `${ref.spriteSetId}:${ref.state}:${ref.direction}`)).size).toBe(30);
    expect(scene.load.spritesheet).toHaveBeenCalledTimes(30);
    expect(scene.load.spritesheet).toHaveBeenCalledWith(
      'character:player_civilian_04:idle:north:sheet',
      'characters/player_civilian_04/idle-north.png',
      { frameWidth: 64, frameHeight: 96, endFrame: 3 }
    );
    expect(scene.load.spritesheet).toHaveBeenCalledWith(
      'character:player_civilian_04:interact:north-west:sheet',
      'characters/player_civilian_04/interact-north-west.png',
      { frameWidth: 64, frameHeight: 96, endFrame: 3 }
    );
    expect(scene.load.spritesheet).toHaveBeenCalledWith(
      'character:contact_lira:interact:south-east:sheet',
      'characters/contact_lira/interact-south-east.png',
      { frameWidth: 64, frameHeight: 96, endFrame: 3 }
    );
    expect((scene.load.spritesheet as jest.Mock).mock.calls).not.toEqual(
      expect.arrayContaining([
        expect.arrayContaining([expect.stringContaining('security_hidzu')]),
        expect.arrayContaining([expect.stringContaining('civilian_delivery')]),
        expect.arrayContaining([expect.stringContaining('contact_lira:move')]),
      ])
    );
  });
});
