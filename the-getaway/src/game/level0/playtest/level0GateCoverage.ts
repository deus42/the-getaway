export const GET204_GATE_BLOCK_IDS = [
  'safehouse-backstreet',
  'public-transit-contact',
  'controlled-logistics',
  'service-seam',
] as const;

export type Get204GateBlockId = typeof GET204_GATE_BLOCK_IDS[number];

export interface Get204GateWaypoint {
  blockId: Get204GateBlockId;
  direction: 'NORTH/UP' | 'EAST/RIGHT' | 'SOUTH/DOWN' | 'WEST/LEFT';
}

interface WorldPosition {
  x: number;
  y: number;
}

export interface Get204GateRouteCheckpoint {
  id: string;
  label: string;
  evidenceKind: 'lot-padding' | 'loop-connector' | 'street-threshold';
  position: WorldPosition;
}

export const GET204_GATE_ROUTE_START: WorldPosition = { x: 15.5, y: 31.5 };

/**
 * Visible AI Gamer route through the same direct-movement/collision path used
 * by ordinary canvas clicks. Every segment is sampled by the focused contract
 * test at the production player-clearance radius. The four lot-padding stops
 * are the representative points that were falsely blocked before GET-204's
 * source-measured footprint correction.
 */
export const GET204_GATE_ROUTE_CHECKPOINTS: readonly Get204GateRouteCheckpoint[] = [
  {
    id: 'safehouse-lot-padding',
    label: 'safehouse lot padding',
    evidenceKind: 'lot-padding',
    position: { x: 19, y: 36 },
  },
  {
    id: 'safehouse-loop-return',
    label: 'safehouse loop return',
    evidenceKind: 'loop-connector',
    position: { x: 15.5, y: 31.5 },
  },
  {
    id: 'public-cross-street',
    label: 'public cross-street connector',
    evidenceKind: 'loop-connector',
    position: { x: 15.5, y: 22 },
  },
  {
    id: 'public-lot-padding',
    label: 'public lot padding',
    evidenceKind: 'lot-padding',
    position: { x: 15, y: 12.5 },
  },
  {
    id: 'public-cross-street-return',
    label: 'public cross-street return',
    evidenceKind: 'loop-connector',
    position: { x: 15.5, y: 22 },
  },
  {
    id: 'central-intersection',
    label: 'central intersection',
    evidenceKind: 'street-threshold',
    position: { x: 29, y: 22 },
  },
  {
    id: 'public-security-bypass-west',
    label: 'public security south bypass',
    evidenceKind: 'loop-connector',
    position: { x: 29, y: 23 },
  },
  {
    id: 'public-security-bypass-east',
    label: 'controlled security south bypass',
    evidenceKind: 'loop-connector',
    position: { x: 42, y: 23 },
  },
  {
    id: 'controlled-approach',
    label: 'controlled approach connector',
    evidenceKind: 'loop-connector',
    position: { x: 42, y: 22 },
  },
  {
    id: 'controlled-lot-padding',
    label: 'controlled lot padding',
    evidenceKind: 'lot-padding',
    position: { x: 42, y: 17 },
  },
  {
    id: 'controlled-approach-return',
    label: 'controlled approach return',
    evidenceKind: 'loop-connector',
    position: { x: 42, y: 22 },
  },
  {
    id: 'logistics-connector',
    label: 'logistics connector',
    evidenceKind: 'loop-connector',
    position: { x: 44, y: 22 },
  },
  {
    id: 'service-street',
    label: 'service street threshold',
    evidenceKind: 'street-threshold',
    position: { x: 44, y: 34.5 },
  },
  {
    id: 'service-lot-padding',
    label: 'service lot padding',
    evidenceKind: 'lot-padding',
    position: { x: 47, y: 38.5 },
  },
] as const;

export const resolveGet204GateBlockId = (position: WorldPosition): Get204GateBlockId => {
  const west = position.x < 29;
  const north = position.y < 22;
  if (west && north) return 'public-transit-contact';
  if (!west && north) return 'controlled-logistics';
  if (!west) return 'service-seam';
  return 'safehouse-backstreet';
};

export const appendVisitedGet204GateBlock = (
  visited: readonly Get204GateBlockId[],
  position: WorldPosition
): readonly Get204GateBlockId[] => {
  const blockId = resolveGet204GateBlockId(position);
  return visited.includes(blockId) ? visited : [...visited, blockId];
};

const blockCenters: Record<Get204GateBlockId, WorldPosition> = {
  'safehouse-backstreet': { x: 14.625, y: 32.875 },
  'public-transit-contact': { x: 14.625, y: 11.125 },
  'controlled-logistics': { x: 43.375, y: 11.125 },
  'service-seam': { x: 43.375, y: 32.875 },
};

export const resolveNextGet204GateWaypoint = (
  visited: readonly Get204GateBlockId[],
  position: WorldPosition
): Get204GateWaypoint | null => {
  const blockId = GET204_GATE_BLOCK_IDS.find((candidate) => !visited.includes(candidate));
  if (!blockId) return null;
  const target = blockCenters[blockId];
  const deltaX = target.x - position.x;
  const deltaY = target.y - position.y;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return { blockId, direction: deltaX > 0 ? 'EAST/RIGHT' : 'WEST/LEFT' };
  }
  return { blockId, direction: deltaY > 0 ? 'SOUTH/DOWN' : 'NORTH/UP' };
};
