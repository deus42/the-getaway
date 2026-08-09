import type { CharacterSpriteDirection } from '../../../content/characters/spriteManifest';
import {
  LEVEL0_CURFEW_MINUTE,
  LEVEL0_START_MINUTE,
  LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE,
  LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE,
} from '../runtime/worldClock';
import type { CrowdState } from './streetMoments';

export type CivilianPhase = 'arriving' | 'holding' | 'departing' | 'inactive';

export interface Level0CivilianGroupMember {
  id: string;
  spriteSetId: string;
  offset: { x: number; y: number };
  facing: CharacterSpriteDirection;
}

export type Level0CivilianGroupId = 'civilians.delivery_activity' | 'civilians.public_queue';

export interface Level0CivilianGroup {
  id: Level0CivilianGroupId;
  contextAnchorId: 'blend.delivery_activity' | 'blend.public_queue';
  arrivingFromMinute: number;
  holdingFromMinute: number;
  departingFromMinute: number;
  inactiveFromMinute: number;
  members: Level0CivilianGroupMember[];
}

// OPEN-CIV-001 trial: two small authored groups, not a simulated crowd. Three
// service workers hold the delivery context and depart at 21:00; four civilians
// hold the queue and depart at 21:30. Both are inactive by curfew.
export const LEVEL0_CIVILIAN_GROUPS: Record<Level0CivilianGroupId, Level0CivilianGroup> = {
  'civilians.delivery_activity': {
    id: 'civilians.delivery_activity',
    contextAnchorId: 'blend.delivery_activity',
    arrivingFromMinute: LEVEL0_START_MINUTE,
    holdingFromMinute: 19 * 60,
    departingFromMinute: LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE,
    inactiveFromMinute: LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE,
    members: [
      {
        id: 'city.civilian.delivery-1',
        spriteSetId: 'civilian_delivery',
        offset: { x: -0.6, y: -0.3 },
        facing: 'south-west',
      },
      {
        id: 'city.civilian.delivery-2',
        spriteSetId: 'civilian_service',
        offset: { x: 0.45, y: -0.1 },
        facing: 'west',
      },
      {
        id: 'city.civilian.delivery-3',
        spriteSetId: 'civilian_delivery',
        offset: { x: 0, y: 0.5 },
        facing: 'north-east',
      },
    ],
  },
  'civilians.public_queue': {
    id: 'civilians.public_queue',
    contextAnchorId: 'blend.public_queue',
    arrivingFromMinute: LEVEL0_START_MINUTE,
    holdingFromMinute: 19 * 60 + 15,
    departingFromMinute: LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE,
    inactiveFromMinute: LEVEL0_CURFEW_MINUTE,
    members: [
      {
        id: 'city.civilian.queue-1',
        spriteSetId: 'civilian_transit',
        offset: { x: -0.9, y: 0 },
        facing: 'east',
      },
      {
        id: 'city.civilian.queue-2',
        spriteSetId: 'civilian_transit',
        offset: { x: -0.3, y: 0.15 },
        facing: 'east',
      },
      {
        id: 'city.civilian.queue-3',
        spriteSetId: 'civilian_service',
        offset: { x: 0.3, y: 0 },
        facing: 'east',
      },
      {
        id: 'city.civilian.queue-4',
        spriteSetId: 'civilian_delivery',
        offset: { x: 0.9, y: 0.15 },
        facing: 'north-east',
      },
    ],
  },
};

export const civilianGroupPhaseAt = (
  group: Level0CivilianGroup,
  minute: number
): CivilianPhase => {
  if (minute >= group.inactiveFromMinute) return 'inactive';
  if (minute >= group.departingFromMinute) return 'departing';
  if (minute >= group.holdingFromMinute) return 'holding';
  if (minute >= group.arrivingFromMinute) return 'arriving';
  return 'inactive';
};

// Presentation targets per phase: departing members drift toward the street
// edge and fade; arriving members fade in slightly offset from their hold spot.
export const CIVILIAN_PHASE_PRESENTATION: Record<
  CivilianPhase,
  { alpha: number; offsetShift: { x: number; y: number } }
> = {
  arriving: { alpha: 0.75, offsetShift: { x: 0.35, y: 0.2 } },
  holding: { alpha: 1, offsetShift: { x: 0, y: 0 } },
  departing: { alpha: 0.55, offsetShift: { x: -0.5, y: -0.3 } },
  inactive: { alpha: 0, offsetShift: { x: -0.9, y: -0.5 } },
};

// Crowd thinning for the static GET-204 dressing civilians: which population
// actors are hidden at each derived crowd state. Presentation-only; the locked
// GET-204 contract itself is not modified.
export const GET204_CROWD_HIDDEN_ACTOR_IDS: Record<CrowdState, readonly string[]> = {
  evening: [],
  thinning: ['get204.civilian.transit-b'],
  sparse: ['get204.civilian.transit-b', 'get204.civilian.transit-a', 'get204.civilian.delivery'],
  cleared: [
    'get204.civilian.transit-b',
    'get204.civilian.transit-a',
    'get204.civilian.delivery',
    'get204.civilian.service',
  ],
};
