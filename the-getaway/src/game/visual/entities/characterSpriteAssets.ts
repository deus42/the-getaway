import Phaser from 'phaser';
import {
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_MANIFEST_BY_ID,
  CHARACTER_SPRITE_STATES,
  getCharacterSpriteAnimationKey,
  getCharacterSpriteSheetPath,
  getCharacterSpriteTextureKey,
} from '../../../content/characters/spriteManifest';

export const preloadCharacterSpriteSheets = (scene: Phaser.Scene): void => {
  CHARACTER_SPRITE_MANIFEST.forEach((entry) => {
    CHARACTER_SPRITE_STATES.forEach((state) => {
      CHARACTER_SPRITE_DIRECTIONS.forEach((direction) => {
        scene.load.spritesheet(
          getCharacterSpriteTextureKey(entry.spriteSetId, state, direction),
          getCharacterSpriteSheetPath(entry.spriteSetId, state, direction),
          {
            frameWidth: entry.frameSize.width,
            frameHeight: entry.frameSize.height,
            endFrame: entry.frameCount - 1,
          }
        );
      });
    });
  });
};

const isCharacterSpriteTextureLoaded = (
  scene: Phaser.Scene,
  spriteSetId: string,
  state: (typeof CHARACTER_SPRITE_STATES)[number],
  direction: (typeof CHARACTER_SPRITE_DIRECTIONS)[number]
): boolean => scene.textures.exists(getCharacterSpriteTextureKey(spriteSetId, state, direction));

export const isCharacterSpriteSetLoaded = (
  scene: Phaser.Scene,
  spriteSetId?: string
): spriteSetId is string => {
  if (!spriteSetId) {
    return false;
  }

  const entry = CHARACTER_SPRITE_MANIFEST_BY_ID[spriteSetId];
  if (!entry) {
    return false;
  }

  return CHARACTER_SPRITE_STATES.every((state) =>
    CHARACTER_SPRITE_DIRECTIONS.every((direction) =>
      isCharacterSpriteTextureLoaded(scene, spriteSetId, state, direction)
    )
  );
};

export const registerCharacterSpriteAnimations = (scene: Phaser.Scene): void => {
  CHARACTER_SPRITE_MANIFEST.forEach((entry) => {
    if (!isCharacterSpriteSetLoaded(scene, entry.spriteSetId)) {
      return;
    }

    CHARACTER_SPRITE_STATES.forEach((state) => {
      CHARACTER_SPRITE_DIRECTIONS.forEach((direction) => {
        const animationKey = getCharacterSpriteAnimationKey(entry.spriteSetId, state, direction);
        if (scene.anims.exists(animationKey)) {
          return;
        }

        scene.anims.create({
          key: animationKey,
          frames: scene.anims.generateFrameNumbers(
            getCharacterSpriteTextureKey(entry.spriteSetId, state, direction),
            {
              start: 0,
              end: entry.frameCount - 1,
            }
          ),
          frameRate: entry.stateFps[state],
          repeat: state === 'attack' ? 0 : -1,
        });
      });
    });
  });
};
