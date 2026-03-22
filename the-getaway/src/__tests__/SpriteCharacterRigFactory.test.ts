jest.mock('phaser', () => ({
  __esModule: true,
  default: {
    GameObjects: {
      Events: {
        DESTROY: 'destroy',
      },
    },
  },
}));

import { resolveAttackReleasePresentation } from '../game/visual/entities/SpriteCharacterRigFactory';

describe('resolveAttackReleasePresentation', () => {
  it('falls back to the original sprite set id when the latest presentation loses it', () => {
    expect(
      resolveAttackReleasePresentation(
        {
          spriteSetId: undefined,
          pendingAnimationState: 'move',
          pendingFacing: 'east',
          currentAnimationState: 'idle',
          currentFacing: 'south',
        },
        'hero_operative'
      )
    ).toEqual({
      spriteSetId: 'hero_operative',
      animationState: 'move',
      facing: 'east',
    });
  });

  it('falls back to the current animation and facing when pending values are unavailable', () => {
    expect(
      resolveAttackReleasePresentation(
        {
          spriteSetId: 'npc_lira_vendor',
          pendingAnimationState: undefined,
          pendingFacing: undefined,
          currentAnimationState: 'interact',
          currentFacing: 'south-west',
        },
        'hero_operative'
      )
    ).toEqual({
      spriteSetId: 'npc_lira_vendor',
      animationState: 'interact',
      facing: 'south-west',
    });
  });
});
