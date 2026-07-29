import {
  buildAgentCombatTraceNote,
  chooseAgentCombatAction,
  countNoProgressActionTraces,
  isObjectiveStallRetryTrace,
} from '../game/playtest/agentCombatStrategy';
import type { GetawayAgentSnapshot } from '../game/playtest/agentBridge';

const makeSnapshot = (
  overrides: Partial<GetawayAgentSnapshot> = {}
): GetawayAgentSnapshot => ({
  schema: 'getaway_agent_snapshot_v1',
  bridgeVersion: 'getaway-agent-v1',
  timestamp: '2026-05-06T00:00:00.000Z',
  url: 'http://localhost:5174/?agent=1',
  player: {
    id: 'player',
    name: 'Agent',
    health: 100,
    maxHealth: 100,
    actionPoints: 5,
    maxActionPoints: 6,
    stamina: 100,
    maxStamina: 100,
    position: { x: 36, y: 20 },
    facing: 'south',
    movementProfile: 'walk',
    stealthModeEnabled: false,
    stealthCooldownExpiresAt: null,
    level: 1,
    credits: 0,
    inventoryCount: 0,
  },
  world: {
    areaId: 'downtown',
    areaName: 'Downtown',
    zoneId: 'downtown',
    map: {
      width: 64,
      height: 64,
      tileCount: 4096,
      walkableTileCount: 2000,
      nearbyWalkableTiles: [],
    },
    currentTime: 79200,
    timeOfDay: 'night',
    curfewActive: true,
    inCombat: true,
    isPlayerTurn: true,
    engagementMode: 'combat',
    globalAlertLevel: 'investigating',
    workbenchAvailable: false,
  },
  stealth: {
    enabled: false,
    curfewActive: true,
    camerasNearby: 0,
    detectionProgress: 0,
    activeCameraId: null,
    cameraAlertState: 'clear',
    networkAlertActive: false,
  },
  paranoia: {
    value: 8,
    tier: 'settled',
    frozen: false,
  },
  suspicion: {
    paused: false,
    zones: [],
  },
  objectives: [{
    questId: 'quest_market_cache',
    questName: 'Recover Lira\'s Confiscated Cache',
    objectiveId: 'recover-keycard',
    description: 'Recover the Corporate Keycard.',
    type: 'collect',
    target: 'Corporate Keycard',
    currentCount: 0,
    count: 1,
    isCompleted: false,
    isActive: true,
  }],
  mission: {
    currentLevelIndex: 0,
    pendingAdvance: false,
    celebrationAcknowledged: false,
    levels: [],
  },
  npcs: [],
  items: [{
    id: 'keycard-1',
    definitionId: 'corporate_keycard',
    resourceKey: 'items.corporate_keycard',
    name: 'Corporate Keycard',
    isQuestItem: true,
    quantity: 1,
    position: { x: 43, y: 21 },
    tags: ['keycard'],
  }],
  enemies: [],
  cameras: [],
  dialogue: {
    active: false,
    dialogueId: null,
    currentNodeId: null,
    options: [],
  },
  overlays: {
    missionFailureOpen: false,
    missionCompletionPending: false,
    activeDialogue: false,
  },
  recentLogs: [],
  ...overrides,
});

describe('agent combat strategy', () => {
  it('waits while combat is not actionable for the player', () => {
    expect(chooseAgentCombatAction(makeSnapshot({
      world: {
        ...makeSnapshot().world,
        isPlayerTurn: false,
      },
    }))).toEqual({ type: 'wait', ms: 750 });

    expect(chooseAgentCombatAction(makeSnapshot({
      player: {
        ...makeSnapshot().player,
        actionPoints: 0,
      },
    }))).toEqual({ type: 'wait', ms: 750 });
  });

  it('prioritizes the keycard objective under authored curfew combat pressure', () => {
    const action = chooseAgentCombatAction(makeSnapshot({
      enemies: [
        {
          id: 'far-guard',
          name: 'Far Guard',
          position: { x: 43, y: 21 },
          health: 4,
          maxHealth: 4,
          isHostile: true,
        },
        {
          id: 'near-guard',
          name: 'Near Guard',
          position: { x: 35, y: 20 },
          health: 4,
          maxHealth: 4,
          isHostile: true,
        },
      ],
    }));

    expect(action).toEqual({ type: 'collectItem', role: 'corporate_keycard' });
  });

  it('targets the nearest living hostile before non-escape objective collection', () => {
    const action = chooseAgentCombatAction(makeSnapshot({
      objectives: [{
        questId: 'quest_datapad_truth',
        questName: 'Manifests of Control',
        objectiveId: 'obtain-datapad',
        description: 'Recover the Encrypted Datapad.',
        type: 'collect',
        target: 'Encrypted Datapad',
        currentCount: 0,
        count: 1,
        isCompleted: false,
        isActive: true,
      }],
      items: [{
        id: 'datapad-1',
        definitionId: 'encrypted_datapad',
        resourceKey: 'items.encrypted_datapad',
        name: 'Encrypted Datapad',
        isQuestItem: true,
        quantity: 1,
        position: { x: 43, y: 21 },
        tags: ['datapad'],
      }],
      enemies: [
        {
          id: 'far-guard',
          name: 'Far Guard',
          position: { x: 43, y: 21 },
          health: 4,
          maxHealth: 4,
          isHostile: true,
        },
        {
          id: 'near-guard',
          name: 'Near Guard',
          position: { x: 35, y: 20 },
          health: 4,
          maxHealth: 4,
          isHostile: true,
        },
      ],
    }));

    expect(action).toEqual({ type: 'clickTile', position: { x: 35, y: 20 } });
  });

  it('tie-breaks hostile targets by lower health and stable id', () => {
    const lowerHealthAction = chooseAgentCombatAction(makeSnapshot({
      objectives: [],
      items: [],
      enemies: [
        {
          id: 'guard-b',
          name: 'Guard B',
          position: { x: 35, y: 20 },
          health: 4,
          maxHealth: 4,
          isHostile: true,
        },
        {
          id: 'guard-a',
          name: 'Guard A',
          position: { x: 37, y: 20 },
          health: 2,
          maxHealth: 4,
          isHostile: true,
        },
      ],
    }));
    expect(lowerHealthAction).toEqual({ type: 'clickTile', position: { x: 37, y: 20 } });

    const stableIdAction = chooseAgentCombatAction(makeSnapshot({
      objectives: [],
      items: [],
      enemies: [
        {
          id: 'guard-b',
          name: 'Guard B',
          position: { x: 35, y: 20 },
          health: 4,
          maxHealth: 4,
          isHostile: true,
        },
        {
          id: 'guard-a',
          name: 'Guard A',
          position: { x: 37, y: 20 },
          health: 4,
          maxHealth: 4,
          isHostile: true,
        },
      ],
    }));
    expect(stableIdAction).toEqual({ type: 'clickTile', position: { x: 37, y: 20 } });
  });

  it('collects the active objective item after combat has no living hostiles', () => {
    expect(chooseAgentCombatAction(makeSnapshot())).toEqual({
      type: 'collectItem',
      role: 'corporate_keycard',
    });
  });

  it('marks combat target trace entries so objective stall detection ignores them', () => {
    const snapshot = makeSnapshot({
      enemies: [{
        id: 'guard-a',
        name: 'Guard A',
        position: { x: 37, y: 20 },
        health: 4,
        maxHealth: 4,
        isHostile: true,
      }],
    });
    const action = chooseAgentCombatAction(snapshot)!;
    const traceNote = buildAgentCombatTraceNote(snapshot, action)!;
    const objective = snapshot.objectives[0];

    expect(isObjectiveStallRetryTrace({
      action: JSON.stringify(action),
      result: [
        'Clicked tile 37,20.',
        'beforeObjective=recover-keycard',
        'afterObjective=recover-keycard',
        'stateChanged=true',
        `strategy=${traceNote}`,
      ].join(' | '),
    }, objective)).toBe(false);

    expect(isObjectiveStallRetryTrace({
      action: JSON.stringify({ type: 'clickTile', position: { x: 43, y: 21 } }),
      result: [
        'Clicked tile 43,21.',
        'beforeObjective=recover-keycard',
        'afterObjective=recover-keycard',
        'stateChanged=true',
      ].join(' | '),
    }, objective)).toBe(true);
  });

  it('counts repeated no-progress stealth toggles for playtest profile blockers', () => {
    expect(countNoProgressActionTraces([
      {
        action: '{"type":"toggleStealth"}',
        result: 'Requested stealth toggle. | status=ok | stateChanged=false',
      },
      {
        action: '{"type":"clickTile","position":{"x":25,"y":19}}',
        result: 'Clicked tile 25,19. | status=ok | stateChanged=false',
      },
      {
        action: '{"type":"toggleStealth"}',
        result: 'Requested stealth toggle. | status=ok | stateChanged=true',
      },
      {
        action: '{"type":"toggleStealth"}',
        result: 'Requested stealth toggle. | status=ok | stateChanged=false',
      },
    ], 'toggleStealth')).toBe(2);
  });
});
