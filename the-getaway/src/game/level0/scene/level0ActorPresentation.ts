import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import {
  LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID,
  LEVEL0_PLAYER_APPEARANCE_IDS,
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST_BY_ID,
  CHARACTER_SPRITE_STATES,
  isLevel0PlayerAppearanceId,
  resolvePlayerSpriteSetId,
  type CharacterSpriteDirection,
  type CharacterSpriteState,
  type Level0PlayerAppearanceId,
} from '../../../content/characters/spriteManifest';
import type { WorldPoint } from '../layout/types';
import type { DirectMovementState } from '../movement/directMovement';
import type { CharacterSpriteSheetRef } from '../../visual/entities/characterSpriteAssets';

export {
  LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID,
  LEVEL0_PLAYER_APPEARANCE_IDS,
  isLevel0PlayerAppearanceId,
};
export type { Level0PlayerAppearanceId };

interface Level0ContactActorDefinition {
  actorId: 'contact_lira' | 'contact_naila' | 'contact_brant';
  anchorId: 'contact.lira' | 'contact.naila' | 'contact.brant';
  facing: CharacterSpriteDirection;
}

export interface Level0ContactActorPresentation extends Level0ContactActorDefinition {
  position: WorldPoint;
}

const CONTACT_DEFINITIONS: readonly Level0ContactActorDefinition[] = [
  { actorId: 'contact_lira', anchorId: 'contact.lira', facing: 'south-east' },
  { actorId: 'contact_naila', anchorId: 'contact.naila', facing: 'south' },
  { actorId: 'contact_brant', anchorId: 'contact.brant', facing: 'south-west' },
];

const requireAnchorPosition = (anchorId: string): WorldPoint => {
  const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find((candidate) => candidate.id === anchorId);
  if (!anchor) {
    throw new Error(`Required Level 0 actor anchor is missing: ${anchorId}`);
  }
  return { ...anchor.position };
};

export const LEVEL0_CONTACT_ACTOR_PRESENTATIONS: readonly Level0ContactActorPresentation[] =
  CONTACT_DEFINITIONS.map((definition) => ({
    ...definition,
    position: requireAnchorPosition(definition.anchorId),
  }));

export const LEVEL0_ACTOR_INTERACTION_DURATION_MS = 800;

export const LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT =
  'getaway:level0:actor-interaction-presentation';

export interface Level0ActorInteractionPresentationDetail {
  anchorId?: string;
}

export const LEVEL0_GEORGE_PRESENTATION = {
  screenHeightPx: 32,
  sourceHeightPx: 256,
  visibleAlphaHeightPx: 196,
  screenOffsetPx: { x: 42, y: -48 },
} as const;

export const resolveLevel0SceneSpriteSetIds = (
  appearancePresetId: string
): string[] => {
  const playerSpriteSetId = resolvePlayerSpriteSetId(appearancePresetId);
  return [
    ...(playerSpriteSetId ? [playerSpriteSetId] : []),
    ...LEVEL0_CONTACT_ACTOR_PRESENTATIONS.map((entry) => entry.actorId),
  ];
};

export const resolveLevel0ActorSpriteSheetRefs = (
  spriteSetId: string
): CharacterSpriteSheetRef[] => {
  const entry = CHARACTER_SPRITE_MANIFEST_BY_ID[spriteSetId];
  if (entry?.ownership === 'player') {
    return CHARACTER_SPRITE_STATES.flatMap((state) =>
      CHARACTER_SPRITE_DIRECTIONS.map((direction) => ({ spriteSetId, state, direction }))
    );
  }
  const contact = LEVEL0_CONTACT_ACTOR_PRESENTATIONS.find(
    (presentation) => presentation.actorId === spriteSetId
  );
  if (!contact) return [];
  return (['idle', 'interact'] as const).map((state) => ({
    spriteSetId,
    state,
    direction: contact.facing,
  }));
};

export const resolveLevel0SceneSpriteSheetRefs = (
  appearancePresetId: string
): CharacterSpriteSheetRef[] =>
  resolveLevel0SceneSpriteSetIds(appearancePresetId).flatMap(resolveLevel0ActorSpriteSheetRefs);

const DIRECTIONS_BY_SECTOR: readonly CharacterSpriteDirection[] = [
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
  'north',
  'north-east',
];

export const resolveLevel0SpriteDirection = (
  facing: WorldPoint
): CharacterSpriteDirection => {
  if (Math.hypot(facing.x, facing.y) < 0.0001) {
    return 'south';
  }
  const projectedFacing = {
    x: (facing.x - facing.y) * LEVEL0_LAYOUT_CONTRACT.projection.tileWidth / 2,
    y: (facing.x + facing.y) * LEVEL0_LAYOUT_CONTRACT.projection.tileHeight / 2,
  };
  const sector = Math.round(
    Math.atan2(projectedFacing.y, projectedFacing.x) / (Math.PI / 4)
  );
  const normalizedSector = ((sector % 8) + 8) % 8;
  return DIRECTIONS_BY_SECTOR[normalizedSector]!;
};

export const resolveLevel0PlayerSpriteState = (
  intentKind: DirectMovementState['intent']['kind'],
  nowMs: number,
  interactionUntilMs: number
): CharacterSpriteState => {
  if (nowMs < interactionUntilMs) return 'interact';
  return intentKind !== 'idle' ? 'move' : 'idle';
};

export const resolveLevel0GeorgeWorldPresentation = (
  playerScenePosition: WorldPoint,
  cameraZoom: number
): { position: WorldPoint; scale: number } => {
  const safeZoom = Math.max(0.01, cameraZoom);
  return {
    position: {
      x: playerScenePosition.x + LEVEL0_GEORGE_PRESENTATION.screenOffsetPx.x / safeZoom,
      y: playerScenePosition.y + LEVEL0_GEORGE_PRESENTATION.screenOffsetPx.y / safeZoom,
    },
    scale:
      LEVEL0_GEORGE_PRESENTATION.screenHeightPx /
      (LEVEL0_GEORGE_PRESENTATION.visibleAlphaHeightPx * safeZoom),
  };
};
