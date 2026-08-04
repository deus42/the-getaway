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

type SpriteBackedPresentationState = CharacterPresentationState;

type SpriteReadabilityPresentation = {
  rimAlpha: number;
  rimScaleMultiplier: number;
  contactShadowAlpha: number;
  haloAlpha: number;
  beaconAlpha: number;
};

const resolveSpriteReadabilityPresentation = (
  animationState: CharacterRenderDescriptor['animationState']
): SpriteReadabilityPresentation => {
  switch (animationState) {
    case 'interact':
      return {
        rimAlpha: 0.5,
        rimScaleMultiplier: 1.075,
        contactShadowAlpha: 0.4,
        haloAlpha: 0.3,
        beaconAlpha: 0.34,
      };
    case 'move':
      return {
        rimAlpha: 0.48,
        rimScaleMultiplier: 1.07,
        contactShadowAlpha: 0.36,
        haloAlpha: 0.28,
        beaconAlpha: 0.2,
      };
    case 'idle':
    default:
      return {
        rimAlpha: 0.46,
        rimScaleMultiplier: 1.065,
        contactShadowAlpha: 0.38,
        haloAlpha: 0.24,
        beaconAlpha: 0.18,
      };
  }
};

const drawSpriteContactShadow = (
  shadow: Phaser.GameObjects.Graphics,
  frameWidth: number,
  worldScale: number
): void => {
  shadow.clear();
  shadow.fillStyle(0x020617, 1);
  shadow.fillEllipse(
    0,
    5,
    frameWidth * worldScale * 0.58,
    Math.max(7, frameWidth * worldScale * 0.16)
  );
};

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

    const spriteRim = this.scene.add.sprite(
      0,
      0,
      getCharacterSpriteTextureKey(descriptor.spriteSetId, 'idle', descriptor.facing),
      0
    );
    spriteRim.setOrigin(entry.origin.x, entry.origin.y);
    spriteRim.setScale(entry.worldScale * 1.065);
    spriteRim.setTint(0x020617);

    const contactShadow = this.scene.add.graphics();
    drawSpriteContactShadow(
      contactShadow,
      entry.frameSize.width,
      entry.worldScale
    );

    token.base.setAlpha(0.16);
    token.column.setAlpha(0.01);
    token.beacon.setAlpha(0.18);

    token.container.addAt(contactShadow, 2);
    token.container.addAt(spriteRim, 3);
    token.container.addAt(sprite, 4);
    token.sprite = sprite;
    token.spriteRim = spriteRim;
    token.spriteContactShadow = contactShadow;
    token.container.setData('spriteBody', sprite);
    token.container.setData('spriteRim', spriteRim);
    token.container.setData('spriteContactShadow', contactShadow);

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
    presentation.animationLockUntil = null;
    const resolvedAnimationState = descriptor.animationState;
    const resolvedFacing = descriptor.facing;

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

    const entry = CHARACTER_SPRITE_MANIFEST_BY_ID[spriteSetId];
    const readability = resolveSpriteReadabilityPresentation(resolvedAnimationState);

    sprite.setY(-2 + bobOffset);
    if (token.spriteRim && entry) {
      token.spriteRim.setY(-2 + bobOffset);
      token.spriteRim.setScale(entry.worldScale * readability.rimScaleMultiplier);
      token.spriteRim.setAlpha(readability.rimAlpha);
    }
    token.spriteContactShadow?.setAlpha(readability.contactShadowAlpha);
    token.halo.setAlpha(readability.haloAlpha);
    token.beacon.setAlpha(readability.beaconAlpha);
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

    this.playAnimationOnSprite(sprite, animationKey, forceRestart);
    if (token.spriteRim) {
      this.playAnimationOnSprite(token.spriteRim, animationKey, forceRestart);
    }
  }

  private playAnimationOnSprite(
    sprite: Phaser.GameObjects.Sprite,
    animationKey: string,
    forceRestart: boolean
  ): void {
    const currentAnimationKey = sprite.anims.currentAnim?.key;
    if (forceRestart || currentAnimationKey !== animationKey || !sprite.anims.isPlaying) {
      sprite.play(animationKey, true);
    }
  }
}
