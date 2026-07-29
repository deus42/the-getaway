import type { MapBuildingDefinition, Position } from '../../game/interfaces/types';
import type { Get155PreviewFrameId } from './atlasFrames';

export const GET155_LEVEL0_ANCHOR_BUILDING_ID = 'block_1_1';

export interface Get155Level0Placement {
  readonly frameId: Get155PreviewFrameId;
  readonly anchor: Position;
  readonly collisionTiles: readonly Position[];
}

const PLACEMENT_OFFSETS = {
  buildingArtDeco: { x: 6, y: -8 },
  streetlight: { x: 4, y: -7 },
  neonSign: { x: 6, y: -6 },
  crate: { x: 4, y: -5 },
} as const satisfies Record<Get155PreviewFrameId, Position>;

const COLLISION_OFFSETS = {
  buildingArtDeco: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  streetlight: [{ x: 0, y: 0 }],
  neonSign: [{ x: 0, y: 0 }],
  crate: [{ x: 0, y: 0 }],
} as const satisfies Record<Get155PreviewFrameId, readonly Position[]>;

const GET155_PLACEMENT_ORDER: readonly Get155PreviewFrameId[] = [];

const addPosition = (left: Position, right: Position): Position => ({
  x: left.x + right.x,
  y: left.y + right.y,
});

export const resolveGet155Level0Placements = (
  anchorBuilding: Pick<MapBuildingDefinition, 'door'> | null | undefined
): Get155Level0Placement[] => {
  if (!anchorBuilding) {
    return [];
  }

  return GET155_PLACEMENT_ORDER.map((frameId) => {
    const anchor = addPosition(anchorBuilding.door, PLACEMENT_OFFSETS[frameId]);

    return {
      frameId,
      anchor,
      collisionTiles: COLLISION_OFFSETS[frameId].map((offset) => addPosition(anchor, offset)),
    };
  });
};
