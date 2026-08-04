import Phaser from 'phaser';
import {
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_MANIFEST_BY_ID,
  CHARACTER_SPRITE_STATES,
  getCharacterSpriteAnimationKey,
  getCharacterSpriteSheetPath,
  getCharacterSpriteTextureKey,
  type CharacterSpriteDirection,
  type CharacterSpriteState,
} from '../../../content/characters/spriteManifest';

export interface CharacterSpriteSheetRef {
  spriteSetId: string;
  state: CharacterSpriteState;
  direction: CharacterSpriteDirection;
}

const isAuthoredSheetRef = (ref: CharacterSpriteSheetRef): boolean =>
  Boolean(CHARACTER_SPRITE_MANIFEST_BY_ID[ref.spriteSetId]) &&
  CHARACTER_SPRITE_STATES.includes(ref.state) &&
  CHARACTER_SPRITE_DIRECTIONS.includes(ref.direction);

const dedupeAuthoredSheetRefs = (
  refs: readonly CharacterSpriteSheetRef[]
): CharacterSpriteSheetRef[] => {
  const byTextureKey = new Map<string, CharacterSpriteSheetRef>();
  refs.forEach((ref) => {
    if (!isAuthoredSheetRef(ref)) return;
    byTextureKey.set(
      getCharacterSpriteTextureKey(ref.spriteSetId, ref.state, ref.direction),
      ref
    );
  });
  return [...byTextureKey.values()];
};

const expandSpriteSetRefs = (spriteSetId: string): CharacterSpriteSheetRef[] =>
  CHARACTER_SPRITE_STATES.flatMap((state) =>
    CHARACTER_SPRITE_DIRECTIONS.map((direction) => ({ spriteSetId, state, direction }))
  );

export const preloadCharacterSpriteSheetRefs = (
  scene: Phaser.Scene,
  refs: readonly CharacterSpriteSheetRef[]
): void => {
  dedupeAuthoredSheetRefs(refs).forEach((ref) => {
    const entry = CHARACTER_SPRITE_MANIFEST_BY_ID[ref.spriteSetId]!;
    scene.load.spritesheet(
      getCharacterSpriteTextureKey(ref.spriteSetId, ref.state, ref.direction),
      getCharacterSpriteSheetPath(ref.spriteSetId, ref.state, ref.direction),
      {
        frameWidth: entry.frameSize.width,
        frameHeight: entry.frameSize.height,
        endFrame: entry.frameCount - 1,
      }
    );
  });
};

export const preloadCharacterSpriteSheets = (
  scene: Phaser.Scene,
  spriteSetIds?: readonly string[]
): void => {
  const entries = spriteSetIds
    ? [...new Set(spriteSetIds)]
        .map((spriteSetId) => CHARACTER_SPRITE_MANIFEST_BY_ID[spriteSetId])
        .filter((entry): entry is (typeof CHARACTER_SPRITE_MANIFEST)[number] => Boolean(entry))
    : CHARACTER_SPRITE_MANIFEST;

  preloadCharacterSpriteSheetRefs(
    scene,
    entries.flatMap((entry) => expandSpriteSetRefs(entry.spriteSetId))
  );
};

const isCharacterSpriteTextureLoaded = (
  scene: Phaser.Scene,
  spriteSetId: string,
  state: (typeof CHARACTER_SPRITE_STATES)[number],
  direction: (typeof CHARACTER_SPRITE_DIRECTIONS)[number]
): boolean => scene.textures.exists(getCharacterSpriteTextureKey(spriteSetId, state, direction));

export const areCharacterSpriteSheetRefsLoaded = (
  scene: Phaser.Scene,
  refs: readonly CharacterSpriteSheetRef[]
): boolean => {
  if (refs.length === 0 || refs.some((ref) => !isAuthoredSheetRef(ref))) return false;
  return dedupeAuthoredSheetRefs(refs).every((ref) =>
    isCharacterSpriteTextureLoaded(scene, ref.spriteSetId, ref.state, ref.direction)
  );
};

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

  return areCharacterSpriteSheetRefsLoaded(scene, expandSpriteSetRefs(spriteSetId));
};

export const registerCharacterSpriteSheetAnimations = (
  scene: Phaser.Scene,
  refs: readonly CharacterSpriteSheetRef[]
): void => {
  dedupeAuthoredSheetRefs(refs).forEach((ref) => {
    if (!isCharacterSpriteTextureLoaded(scene, ref.spriteSetId, ref.state, ref.direction)) return;
    const entry = CHARACTER_SPRITE_MANIFEST_BY_ID[ref.spriteSetId]!;
    const animationKey = getCharacterSpriteAnimationKey(
      ref.spriteSetId,
      ref.state,
      ref.direction
    );
    if (scene.anims.exists(animationKey)) return;
    scene.anims.create({
      key: animationKey,
      frames: scene.anims.generateFrameNumbers(
        getCharacterSpriteTextureKey(ref.spriteSetId, ref.state, ref.direction),
        { start: 0, end: entry.frameCount - 1 }
      ),
      frameRate: entry.stateFps[ref.state],
      repeat: ref.state === 'interact' ? 0 : -1,
    });
  });
};

export const registerCharacterSpriteAnimations = (scene: Phaser.Scene): void => {
  CHARACTER_SPRITE_MANIFEST.forEach((entry) => {
    if (!isCharacterSpriteSetLoaded(scene, entry.spriteSetId)) {
      return;
    }

    registerCharacterSpriteSheetAnimations(scene, expandSpriteSetRefs(entry.spriteSetId));
  });
};
