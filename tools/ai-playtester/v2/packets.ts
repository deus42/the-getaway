import {
  PLAYTEST_CONTROLS,
  PLAYTEST_VERBS,
  type PlaytestPacketV1,
} from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import type { GateMode } from './cli.ts';

export interface ReviewedPlaytestPacketV1 extends PlaytestPacketV1 {
  workerBudgetMs: number;
}

const common = {
  schema: 'playtest_packet_v1' as const,
  revision: 6,
  ticket: 'GET-179',
  viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  locale: 'en' as const,
  allowedVisibleInputs: [
    'Left click on visible controls and choices',
    'W/A/S/D or arrow keys to move',
    'E or the visible Interact control',
    'O or the visible Observation control',
    'Escape for the visible MENU control or to close an open visible surface',
  ],
  computerUsePolicy: {
    actionTools: ['click', 'press_key'],
    keys: [
      'w',
      'a',
      's',
      'd',
      'e',
      'o',
      'up',
      'down',
      'left',
      'right',
      'escape',
    ],
  },
  allowedVerbs: [...PLAYTEST_VERBS],
  allowedControls: [...PLAYTEST_CONTROLS],
  requiredProbeIds: [
    'level0.creation',
    'level0.lira-acceptance',
    'level0.preparation',
    'level0.manifest-unknown',
  ],
  requiredInvariants: [
    { id: 'window-marker', description: 'The assigned visible run marker stays present.' },
    { id: 'capture-before-action', description: 'Every input is enclosed by app-state captures.' },
    { id: 'visible-inputs-only', description: 'Gameplay changes only through visible player input.' },
    { id: 'no-runtime-errors', description: 'No page crash or uncaught runtime error occurs.' },
    { id: 'observation-exercised', description: 'Observation is visibly opened and resumed.' },
  ],
  evidenceRequirements: {
    milestoneScreenshots: true,
    trace: true,
    console: true,
    pageErrors: true,
    network: true,
    workerTranscript: true,
    replayEvidence: false,
  },
  reviewedAt: '2026-08-10T15:15:32.000Z',
} satisfies Omit<
  PlaytestPacketV1,
  'packetId' | 'mode' | 'visibleGoal' | 'startState' | 'playerPersonas' | 'workerCount'
>;

const affectedPacket: ReviewedPlaytestPacketV1 = {
  ...common,
  packetId: 'get-179.level0-preparation.affected.v1',
  mode: 'affected',
  visibleGoal:
    'Start a new game as The Neighbor, enter the district, open and resume Observation, then meet Lira and visibly accept her operation so preparation begins.',
  startState: { kind: 'new-game' },
  playerPersonas: [{
    id: 'deliberate-new-player',
    brief: 'Act like a first-time player who reads visible feedback and checks that each input worked.',
  }],
  workerCount: 1,
  workerBudgetMs: 5 * 60_000,
};

const closeoutPacket: ReviewedPlaytestPacketV1 = {
  ...common,
  packetId: 'get-179.level0-preparation.closeout.v1',
  mode: 'closeout',
  visibleGoal:
    'From New Game, select The Neighbor, enter the district, open and resume Observation, then meet Lira and visibly accept her operation so preparation begins.',
  startState: { kind: 'new-game' },
  playerPersonas: [
    {
      id: 'deliberate-new-player',
      brief: 'Act like a first-time player who reads visible feedback and confirms each transition.',
    },
    {
      id: 'impatient-returning-player',
      brief: 'Act like a returning player moving efficiently while still verifying visible results.',
    },
  ],
  workerCount: 2,
  workerBudgetMs: 25 * 60_000,
};

const get204CollisionInvariants = [
  { id: 'window-marker', description: 'The assigned visible run marker stays present.' },
  { id: 'capture-before-action', description: 'Every input is enclosed by app-state captures.' },
  { id: 'visible-inputs-only', description: 'Gameplay changes only through visible player input.' },
  { id: 'no-runtime-errors', description: 'No page crash or uncaught runtime error occurs.' },
];

const get204CloseoutInvariants = [
  ...get204CollisionInvariants,
  {
    id: 'four-block-coverage',
    description:
      'The live visible marker proves all four blocks and the source-measured collision route completed.',
  },
];

const get204VisibleInputs = [
  ...common.allowedVisibleInputs,
  'The visible GET-204 MOVE TO collision-checkpoint button',
];

const get204AffectedPacket: ReviewedPlaytestPacketV1 = {
  ...common,
  revision: 7,
  ticket: 'GET-204',
  packetId: 'get-204.city-collision.affected.v1',
  mode: 'affected',
  visibleGoal:
    'Start a new game as The Neighbor, enter the district, then use ordinary visible controls to test at least five visibly open city destinations around the safehouse streets, sidewalks, and lot padding. Confirm each direct destination is accepted and the protagonist can continue moving without entering a visible building.',
  startState: { kind: 'new-game' },
  playerPersonas: [{
    id: 'deliberate-route-tester',
    brief: 'Move deliberately, read visible movement feedback, and test open space beside several different buildings.',
  }],
  workerCount: 1,
  requiredProbeIds: ['level0.creation'],
  requiredInvariants: get204CollisionInvariants,
  allowedVisibleInputs: get204VisibleInputs,
  reviewedAt: '2026-08-10T15:52:00.000Z',
  workerBudgetMs: 8 * 60_000,
};

const get204CloseoutPacket: ReviewedPlaytestPacketV1 = {
  ...common,
  revision: 7,
  ticket: 'GET-204',
  packetId: 'get-204.city-collision.closeout.v1',
  mode: 'closeout',
  visibleGoal:
    'From New Game as The Neighbor, enter the district and remain in that same attempt. Use only the visible MOVE TO collision-checkpoint button to follow the reviewed direct-movement route; each click submits one ordinary destination through production collision rather than teleporting. After each click, call get_app_state repeatedly while the button says MOVING, then click the next MOVE TO button when it appears. Do not open Menu, start another New Game, restart, or free-roam. Return pass immediately only when the marker simultaneously shows BLOCK COVERAGE 4/4, ALL FOUR BLOCKS VISITED, and CITY COLLISION ROUTE COMPLETE; otherwise return blocked unless a repeatable visible collision regression is proven.',
  startState: { kind: 'new-game' },
  playerPersonas: [
    {
      id: 'systematic-route-tester',
      brief: 'Cover each block methodically and verify visible feedback after every movement target.',
    },
    {
      id: 'impatient-returning-player',
      brief: 'Cross the district efficiently while probing shortcuts and tight visible passages.',
    },
  ],
  workerCount: 2,
  requiredProbeIds: ['level0.creation'],
  requiredInvariants: get204CloseoutInvariants,
  allowedVisibleInputs: get204VisibleInputs,
  reviewedAt: '2026-08-10T15:52:00.000Z',
  workerBudgetMs: 8 * 60_000,
};

const packetCatalog = new Map<string, ReviewedPlaytestPacketV1>([
  [`GET-179:affected`, affectedPacket],
  [`GET-179:closeout`, closeoutPacket],
  [`GET-204:affected`, get204AffectedPacket],
  [`GET-204:closeout`, get204CloseoutPacket],
]);

export const resolvePlaytestPacket = (
  ticket: string,
  mode: GateMode
): ReviewedPlaytestPacketV1 => {
  const packet = packetCatalog.get(`${ticket}:${mode}`);
  if (!packet) {
    throw new Error(`No reviewed PlaytestPacketV1 exists for ${ticket} in ${mode} mode.`);
  }
  return packet;
};
