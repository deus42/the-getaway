import Phaser from 'phaser';
import {
  type CharacterSpriteDirection,
  CHARACTER_SPRITE_MANIFEST_BY_ID,
  getCharacterSpriteAnimationKey,
  getCharacterSpriteTextureKey,
} from '../../../content/characters/spriteManifest';
import type { CharacterToken } from '../../utils/IsoObjectFactory';
import { CharacterRigFactory, resolveCharacterTokenOptions } from './CharacterRigFactory';
import type { VisualTheme } from '../contracts';
import { isCharacterSpriteSetLoaded } from './characterSpriteAssets';
import type {
  CharacterPresentationState,
  CharacterRenderDescriptor,
} from './characterPresentation';
import { DEFAULT_CHARACTER_SPRITE_FACING } from './characterPresentation';
import type { IsoObjectFactory } from '../../utils/IsoObjectFactory';

type SpriteBackedPresentationState = CharacterPresentationState & {
  attackReleaseEvent?: Phaser.Time.TimerEvent;
};

const DEFAULT_ATTACK_LOCK_MS = 420;

export const resolveAttackReleasePresentation = (
  presentation: {
    spriteSetId?: string;
    pendingAnimationState?: CharacterRenderDescriptor['animationState'];
    pendingFacing?: CharacterSpriteDirection;
    currentAnimationState: CharacterRenderDescriptor['animationState'];
    currentFacing: CharacterSpriteDirection;
  },
  fallbackSpriteSetId: string
): {
  spriteSetId: string;
  animationState: CharacterRenderDescriptor['animationState'];
  facing: CharacterSpriteDirection;
} => ({
  spriteSetId: presentation.spriteSetId ?? fallbackSpriteSetId,
  animationState: presentation.pendingAnimationState ?? presentation.currentAnimationState,
  facing: presentation.pendingFacing ?? presentation.currentFacing,
});

export class SpriteCharacterRigFactory {
  private readonly fallbackFactory: CharacterRigFactory;

  private readonly presentationByToken = new WeakMap<CharacterToken, SpriteBackedPresentationState>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly isoFactory: IsoObjectFactory,
    private readonly theme: VisualTheme
  ) {
    this.fallbackFactory = new CharacterRigFactory(isoFactory, theme);
  }

  public createToken(
    descriptor: CharacterRenderDescriptor,
    gridX: number,
    gridY: number
  ): CharacterToken {
    if (!this.canUseSpriteSet(descriptor.spriteSetId)) {
      const token = this.fallbackFactory.createToken(descriptor.role, gridX, gridY);
      this.presentationByToken.set(token, {
        isSpriteBacked: false,
        spriteSetId: descriptor.spriteSetId,
        currentFacing: descriptor.facing,
        currentAnimationState: descriptor.animationState,
        pendingAnimationState: descriptor.animationState,
        pendingFacing: descriptor.facing,
        lastGridPosition: { x: gridX, y: gridY },
        animationLockUntil: null,
      });
      token.container.setData('characterFacing', descriptor.facing);
      token.container.setData('characterAnimationState', descriptor.animationState);
      return token;
    }

    const entry = CHARACTER_SPRITE_MANIFEST_BY_ID[descriptor.spriteSetId];
    const token = this.isoFactory.createCharacterToken(
      gridX,
      gridY,
      resolveCharacterTokenOptions(this.theme, descriptor.role)
    );
    const sprite = this.scene.add.sprite(
      0,
      0,
      getCharacterSpriteTextureKey(descriptor.spriteSetId, 'idle', descriptor.facing),
      0
    );
    sprite.setOrigin(entry.origin.x, entry.origin.y);
    sprite.setScale(entry.worldScale);

    token.base.setAlpha(0.22);
    token.column.setAlpha(0.01);
    token.beacon.setAlpha(0.18);

    token.container.addAt(sprite, 2);
    token.sprite = sprite;
    token.container.setData('spriteBody', sprite);

    const presentation: SpriteBackedPresentationState = {
      isSpriteBacked: true,
      spriteSetId: descriptor.spriteSetId,
      currentFacing: descriptor.facing ?? DEFAULT_CHARACTER_SPRITE_FACING,
      currentAnimationState: descriptor.animationState,
      pendingAnimationState: descriptor.animationState,
      pendingFacing: descriptor.facing,
      lastGridPosition: { x: gridX, y: gridY },
      animationLockUntil: null,
    };

    this.presentationByToken.set(token, presentation);
    this.applySpritePresentation(token, descriptor, presentation, true);
    token.container.once(Phaser.GameObjects.Events.DESTROY, () => {
      presentation.attackReleaseEvent?.remove(false);
      this.presentationByToken.delete(token);
    });

    return token;
  }

  public positionToken(
    token: CharacterToken,
    descriptor: CharacterRenderDescriptor,
    gridX: number,
    gridY: number
  ): void {
    const presentation = this.presentationByToken.get(token);
    if (!presentation || !presentation.isSpriteBacked) {
      this.fallbackFactory.positionToken(token, gridX, gridY);
      if (presentation) {
        presentation.lastGridPosition = { x: gridX, y: gridY };
        presentation.currentFacing = descriptor.facing;
        presentation.currentAnimationState = descriptor.animationState;
      }
      token.container.setData('characterFacing', descriptor.facing);
      token.container.setData('characterAnimationState', descriptor.animationState);
      return;
    }

    this.isoFactory.positionCharacterToken(token, gridX, gridY);
    this.applySpritePresentation(token, descriptor, presentation, false);
    presentation.lastGridPosition = { x: gridX, y: gridY };
  }

  private canUseSpriteSet(spriteSetId?: string): spriteSetId is string {
    return Boolean(spriteSetId) && isCharacterSpriteSetLoaded(this.scene, spriteSetId);
  }

  private applySpritePresentation(
    token: CharacterToken,
    descriptor: CharacterRenderDescriptor,
    presentation: SpriteBackedPresentationState,
    forceRestart: boolean
  ): void {
    const sprite = token.sprite;
    if (!sprite || !presentation.spriteSetId) {
      return;
    }
    const spriteSetId = presentation.spriteSetId;

    const now = Date.now();
    presentation.pendingAnimationState = descriptor.animationState;
    presentation.pendingFacing = descriptor.facing;

    if (descriptor.attackTriggered) {
      presentation.animationLockUntil = now + DEFAULT_ATTACK_LOCK_MS;
      presentation.attackReleaseEvent?.remove(false);
      presentation.attackReleaseEvent = this.scene.time.delayedCall(DEFAULT_ATTACK_LOCK_MS, () => {
        const latest = this.presentationByToken.get(token);
        if (!latest || !latest.isSpriteBacked) {
          return;
        }
        const releasePresentation = resolveAttackReleasePresentation(
          latest,
          spriteSetId
        );
        latest.animationLockUntil = null;
        this.playSpriteAnimation(
          token,
          releasePresentation.spriteSetId,
          releasePresentation.animationState,
          releasePresentation.facing,
          true
        );
        latest.currentAnimationState = releasePresentation.animationState;
        latest.currentFacing = releasePresentation.facing;
        token.container.setData('characterFacing', releasePresentation.facing);
        token.container.setData('characterAnimationState', releasePresentation.animationState);
      });
    }

    const isAttackLocked =
      presentation.animationLockUntil !== null && presentation.animationLockUntil > now;
    const resolvedAnimationState = isAttackLocked ? 'attack' : descriptor.animationState;
    const resolvedFacing = isAttackLocked ? presentation.currentFacing : descriptor.facing;

    this.playSpriteAnimation(
      token,
      spriteSetId,
      resolvedAnimationState,
      resolvedFacing,
      forceRestart
    );

    presentation.currentAnimationState = resolvedAnimationState;
    presentation.currentFacing = resolvedFacing;
    token.container.setData('characterFacing', resolvedFacing);
    token.container.setData('characterAnimationState', resolvedAnimationState);

    const bobOffset =
      resolvedAnimationState === 'move'
        ? Math.sin(
            (
              presentation.lastGridPosition.x * 17 +
              presentation.lastGridPosition.y * 31 +
              now * 0.018
            ) %
              (Math.PI * 2)
          ) * 2
        : resolvedAnimationState === 'interact'
          ? Math.sin(now * 0.01) * 1.5
          : 0;

    sprite.setY(-2 + bobOffset);
    token.halo.setAlpha(resolvedAnimationState === 'move' ? 0.32 : 0.24);
    token.beacon.setAlpha(resolvedAnimationState === 'interact' ? 0.38 : 0.18);
  }

  private playSpriteAnimation(
    token: CharacterToken,
    spriteSetId: string,
    state: CharacterRenderDescriptor['animationState'],
    facing: CharacterSpriteDirection,
    forceRestart: boolean
  ): void {
    const sprite = token.sprite;
    if (!sprite) {
      return;
    }

    const animationKey = getCharacterSpriteAnimationKey(spriteSetId, state, facing);
    if (!this.scene.anims.exists(animationKey)) {
      return;
    }

    const currentAnimationKey = sprite.anims.currentAnim?.key;
    if (forceRestart || currentAnimationKey !== animationKey || !sprite.anims.isPlaying) {
      sprite.play(animationKey, true);
    }
  }
}
