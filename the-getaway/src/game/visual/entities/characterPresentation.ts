import type {
  CharacterSpriteDirection,
  CharacterSpriteState,
} from '../../../content/characters/spriteManifest';
import type { CardinalDirection, Position } from '../../interfaces/types';
import type { EntityVisualRole } from '../contracts';

export interface CharacterRenderDescriptor {
  role: EntityVisualRole;
  spriteSetId?: string;
  animationState: CharacterSpriteState;
  facing: CharacterSpriteDirection;
  attackTriggered?: boolean;
  accentHex?: string;
  styleVariant?: string;
}

export interface CharacterPresentationState {
  isSpriteBacked: boolean;
  spriteSetId?: string;
  currentFacing: CharacterSpriteDirection;
  currentAnimationState: CharacterSpriteState;
  pendingAnimationState: CharacterSpriteState;
  pendingFacing: CharacterSpriteDirection;
  lastGridPosition: Position;
  animationLockUntil: number | null;
}

export const DEFAULT_CHARACTER_SPRITE_FACING: CharacterSpriteDirection = 'south';

export const mapCardinalToSpriteDirection = (
  direction?: CardinalDirection | null
): CharacterSpriteDirection => {
  switch (direction) {
    case 'north':
      return 'north';
    case 'east':
      return 'east';
    case 'west':
      return 'west';
    case 'south':
    default:
      return 'south';
  }
};

export const resolveCharacterFacing = (
  previousPosition: Position | null | undefined,
  nextPosition: Position,
  fallbackCardinal?: CardinalDirection | null,
  previousFacing: CharacterSpriteDirection = DEFAULT_CHARACTER_SPRITE_FACING
): CharacterSpriteDirection => {
  if (previousPosition) {
    const deltaX = nextPosition.x - previousPosition.x;
    const deltaY = nextPosition.y - previousPosition.y;

    if (deltaX > 0 && deltaY < 0) {
      return 'north-east';
    }
    if (deltaX > 0 && deltaY > 0) {
      return 'south-east';
    }
    if (deltaX < 0 && deltaY > 0) {
      return 'south-west';
    }
    if (deltaX < 0 && deltaY < 0) {
      return 'north-west';
    }
    if (deltaX > 0) {
      return 'east';
    }
    if (deltaX < 0) {
      return 'west';
    }
    if (deltaY > 0) {
      return 'south';
    }
    if (deltaY < 0) {
      return 'north';
    }
  }

  if (fallbackCardinal) {
    return mapCardinalToSpriteDirection(fallbackCardinal);
  }

  return previousFacing;
};
