import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import { isPointWalkable } from '../layout/validator';
import { isLevel0AnchorKnown } from '../runtime/mapKnowledge';
import type { AppDispatch, RootState } from '../../../store';
import { advanceLevel0Clock } from '../../../store/level0RuntimeSlice';
import type { Level0RuntimeState } from '../../../store/level0RuntimeSlice';
import {
  GETAWAY_AGENT_START_LEVEL0_EVENT,
  GETAWAY_AGENT_VERSION,
  shouldEnableGetawayAgentBridge,
  validateAgentAction,
  type GetawayAgentAction,
  type GetawayAgentActionResult,
  type GetawayAgentSnapshot,
} from '../../playtest/agentBridge';
import {
  LEVEL0_AGENT_INTERACTION_EVENT,
  LEVEL0_AGENT_MOVE_EVENT,
  LEVEL0_AGENT_MOVE_RESULT_EVENT,
  LEVEL0_AGENT_RETRY_EVENT,
} from './events';
import type { Level0AgentMoveResultDetail } from './events';

export {
  LEVEL0_AGENT_INTERACTION_EVENT,
  LEVEL0_AGENT_MOVE_EVENT,
  LEVEL0_AGENT_MOVE_RESULT_EVENT,
  LEVEL0_AGENT_RETRY_EVENT,
} from './events';
export { GETAWAY_AGENT_START_LEVEL0_EVENT } from '../../playtest/agentBridge';

interface Level0AgentStore {
  getState(): RootState & { level0Runtime: Level0RuntimeState };
  dispatch: AppDispatch;
}

const asPosition = (point: { x: number; y: number }) => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
});

const layoutExtents = (() => {
  const xs = LEVEL0_LAYOUT_CONTRACT.bounds.map((point) => point.x);
  const ys = LEVEL0_LAYOUT_CONTRACT.bounds.map((point) => point.y);
  const minimumX = Math.floor(Math.min(...xs));
  const maximumX = Math.ceil(Math.max(...xs));
  const minimumY = Math.floor(Math.min(...ys));
  const maximumY = Math.ceil(Math.max(...ys));
  return {
    minimumX,
    maximumX,
    minimumY,
    maximumY,
    width: maximumX - minimumX,
    height: maximumY - minimumY,
  };
})();

const walkableTileCount = (() => {
  let count = 0;
  for (let y = layoutExtents.minimumY; y < layoutExtents.maximumY; y += 1) {
    for (let x = layoutExtents.minimumX; x < layoutExtents.maximumX; x += 1) {
      if (isPointWalkable(LEVEL0_LAYOUT_CONTRACT, { x, y })) count += 1;
    }
  }
  return count;
})();

const nearbyWalkableTiles = (position: { x: number; y: number }) => {
  const center = asPosition(position);
  const candidates: Array<{ x: number; y: number }> = [];
  for (let radius = 1; radius <= 3; radius += 1) {
    for (let y = center.y - radius; y <= center.y + radius; y += 1) {
      for (let x = center.x - radius; x <= center.x + radius; x += 1) {
        if (
          (x !== center.x || y !== center.y) &&
          isPointWalkable(LEVEL0_LAYOUT_CONTRACT, { x, y }) &&
          !candidates.some((candidate) => candidate.x === x && candidate.y === y)
        ) {
          candidates.push({ x, y });
        }
      }
    }
  }
  return candidates.slice(0, 12);
};

const emptySnapshot = (state: ReturnType<Level0AgentStore['getState']>): GetawayAgentSnapshot => {
  const run = state.level0Runtime.run;
  const position = run?.player.position ?? { x: 0, y: 0 };
  const objectives = run
    ? Object.values(run.objectives).map((objective) => ({
        questId: 'level0-tokyo-escape',
        questName: 'Tokyo Escape',
        objectiveId: objective.objectiveId,
        description: objective.objectiveId,
        type: 'explore' as const,
        target: objective.objectiveId,
        isCompleted: objective.status === 'completed',
        isActive: objective.status === 'active',
      }))
    : [];
  const knownAnchors = run
    ? LEVEL0_LAYOUT_CONTRACT.anchors.filter((anchor) => isLevel0AnchorKnown(run, anchor))
    : [];
  const contacts = knownAnchors.filter((anchor) => anchor.kind === 'contact');
  const cameraAnchors = knownAnchors.filter((anchor) => anchor.kind === 'camera');
  const objectiveAnchors = LEVEL0_LAYOUT_CONTRACT.anchors.filter(
    (anchor) => anchor.kind === 'objective' && run !== null && isLevel0AnchorKnown(run, anchor)
  );

  return {
    schema: 'getaway_agent_snapshot_v1',
    bridgeVersion: GETAWAY_AGENT_VERSION,
    timestamp: new Date().toISOString(),
    url: typeof window === 'undefined' ? null : window.location.href,
    player: {
      id: 'level0-player',
      name: run?.identity.callsign || 'Unnamed expatriate',
      health: run?.health ?? 0,
      maxHealth: 100,
      actionPoints: 0,
      maxActionPoints: 0,
      stamina: 0,
      maxStamina: 0,
      position: asPosition(position),
      facing: run ? `${run.player.facing.x.toFixed(2)},${run.player.facing.y.toFixed(2)}` : 'unknown',
      movementProfile: 'direct-collision-slide',
      stealthModeEnabled: false,
      stealthCooldownExpiresAt: null,
      level: run?.build.level ?? 1,
      credits: 0,
      inventoryCount: 0,
    },
    world: {
      areaId: LEVEL0_LAYOUT_CONTRACT.id,
      areaName: 'Hidzu-controlled Tokyo',
      zoneId: 'level0-outdoor-district',
      map: {
        width: layoutExtents.width,
        height: layoutExtents.height,
        tileCount: layoutExtents.width * layoutExtents.height,
        walkableTileCount,
        nearbyWalkableTiles: nearbyWalkableTiles(position),
      },
      currentTime: (run?.worldClock.currentMinute ?? 0) * 60,
      timeOfDay: run?.worldClock.phase ?? 'dusk',
      curfewActive: run?.worldClock.curfewActive ?? false,
      inCombat: false,
      isPlayerTurn: true,
      engagementMode: 'direct-exploration',
      globalAlertLevel: run?.surveillance.level ?? 'clear',
      workbenchAvailable: false,
    },
    stealth: {
      enabled: false,
      curfewActive: run?.worldClock.curfewActive ?? false,
      camerasNearby: cameraAnchors.filter(
        (anchor) => Math.hypot(anchor.position.x - position.x, anchor.position.y - position.y) <= 12
      ).length,
      detectionProgress: 0,
      activeCameraId: run?.surveillance.sourceDeviceId ?? null,
      cameraAlertState: run?.surveillance.level ?? 'clear',
      networkAlertActive: run?.surveillance.level !== 'clear',
    },
    paranoia: {
      value: run?.paranoia ?? 0,
      tier: run && run.paranoia >= 70 ? 'high' : run && run.paranoia >= 40 ? 'elevated' : 'calm',
      frozen: (run?.worldClock.pauseOwners.length ?? 0) > 0,
    },
    suspicion: {
      paused: (run?.worldClock.pauseOwners.length ?? 0) > 0,
      zones: [],
    },
    objectives,
    mission: {
      currentLevelIndex: 0,
      pendingAdvance: run?.mission === 'L0_COMPLETE',
      celebrationAcknowledged: false,
      levels: [{
        level: 0,
        levelId: LEVEL0_LAYOUT_CONTRACT.id,
        name: run?.mission ?? 'Level 0 not started',
        zoneId: 'level0-outdoor-district',
        objectiveCount: objectives.length,
      }],
    },
    npcs: contacts.map((anchor) => ({
      id: anchor.id,
      name: anchor.id.replace('contact.', '').toUpperCase(),
      dialogueId: `${anchor.id}.dialogue`,
      isInteractive: true,
      factionId: 'neutral',
      socialTags: ['contact'],
      position: asPosition(anchor.position),
      health: 100,
      maxHealth: 100,
    })),
    items: objectiveAnchors.map((anchor) => ({
      id: anchor.id,
      definitionId: anchor.ownerId,
      name: anchor.id.replace('objective.', '').toUpperCase(),
      isQuestItem: true,
      quantity: 1,
      position: asPosition(anchor.position),
      tags: ['level0-objective'],
    })),
    enemies: [],
    cameras: cameraAnchors.map((anchor) => ({
      id: anchor.id,
      type: 'hidzu-network-camera',
      position: asPosition(anchor.position),
      isActive: true,
      alertState: run?.surveillance.level ?? 'clear',
      detectionProgress: 0,
      range: 12,
    })),
    dialogue: {
      active: false,
      dialogueId: null,
      currentNodeId: null,
      options: [],
    },
    overlays: {
      missionFailureOpen: run?.mission === 'L0_FAILED',
      missionCompletionPending: run?.mission === 'L0_COMPLETE',
      activeDialogue: false,
    },
    recentLogs: state.level0Runtime.feedbackId ? [state.level0Runtime.feedbackId] : [],
  };
};

const currentObjectiveId = (snapshot: GetawayAgentSnapshot): string | null =>
  snapshot.objectives.find((objective) => objective.isActive)?.objectiveId ?? null;

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, Math.max(0, milliseconds)));

const waitForPlayerIdle = async (
  store: Level0AgentStore,
  target: { x: number; y: number } | null,
  timeoutMilliseconds: number
): Promise<'idle' | 'timeout' | 'no-intent'> => {
  if (!target) return 'no-intent';
  const deadline = Date.now() + Math.max(250, timeoutMilliseconds);
  let previous = store.getState().level0Runtime.run?.player.position;
  let stableSamples = 0;
  while (Date.now() < deadline) {
    await wait(120);
    const current = store.getState().level0Runtime.run?.player.position;
    if (
      previous && current &&
      Math.hypot(current.x - previous.x, current.y - previous.y) < 0.01
    ) {
      const arrived = Math.hypot(current.x - target.x, current.y - target.y) <= 0.2;
      stableSamples += 1;
      if (arrived && stableSamples >= 3) return 'idle';
    } else {
      stableSamples = 0;
    }
    previous = current;
  }
  return 'timeout';
};

const requestSceneMovement = (
  position: { x: number; y: number },
  timeoutMilliseconds = 750
): Promise<Level0AgentMoveResultDetail | null> => new Promise((resolve) => {
  const requestId = `move-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const timeout = window.setTimeout(() => {
    window.removeEventListener(LEVEL0_AGENT_MOVE_RESULT_EVENT, handleResult);
    resolve(null);
  }, timeoutMilliseconds);
  const handleResult = (event: Event) => {
    const detail = (event as CustomEvent<Level0AgentMoveResultDetail>).detail;
    if (detail?.requestId !== requestId) return;
    window.clearTimeout(timeout);
    window.removeEventListener(LEVEL0_AGENT_MOVE_RESULT_EVENT, handleResult);
    resolve(detail);
  };
  window.addEventListener(LEVEL0_AGENT_MOVE_RESULT_EVENT, handleResult);
  window.dispatchEvent(new CustomEvent(LEVEL0_AGENT_MOVE_EVENT, {
    detail: { requestId, ...position },
  }));
});

interface Level0AgentRuntimeContext {
  acceptedMovementTarget: { x: number; y: number } | null;
}

const dispatchAction = async (
  store: Level0AgentStore,
  action: GetawayAgentAction,
  context: Level0AgentRuntimeContext
): Promise<GetawayAgentActionResult> => {
  const before = emptySnapshot(store.getState());
  const validation = validateAgentAction(action);
  if (!validation.ok) {
    return {
      ok: false,
      action: action.type,
      message: validation.message,
      status: 'rejected',
      reason: 'invalid-action',
      beforeObjectiveId: currentObjectiveId(before),
      afterObjectiveId: currentObjectiveId(before),
      stateChanged: false,
      evidenceHint: 'The typed bridge rejected malformed input before any runtime event.',
      snapshot: before,
    };
  }

  let status: GetawayAgentActionResult['status'] = 'ok';
  let reason = 'runtime-event-dispatched';
  let message = `Dispatched ${action.type} through the Level 0 runtime.`;

  switch (action.type) {
    case 'startLevel0':
      context.acceptedMovementTarget = null;
      window.dispatchEvent(new CustomEvent(GETAWAY_AGENT_START_LEVEL0_EVENT));
      break;
    case 'clickTile': {
      context.acceptedMovementTarget = null;
      const movement = await requestSceneMovement(action.position);
      if (!movement) {
        status = 'rejected';
        reason = 'scene-not-listening';
        message = 'The Level 0 scene did not acknowledge the movement request.';
      } else if (!movement.accepted) {
        status = 'rejected';
        reason = movement.reason;
        message = `The Level 0 scene rejected movement: ${movement.reason}.`;
      } else {
        context.acceptedMovementTarget = { ...action.position };
        reason = movement.reason;
        message = 'The Level 0 scene accepted the direct movement intent.';
      }
      break;
    }
    case 'interactNpc': {
      const requested = (action.id ?? action.role ?? action.name ?? '').toLowerCase();
      const contact = ['lira', 'naila', 'brant'].find((name) => requested.includes(name));
      if (!contact) {
        status = 'rejected';
        reason = 'unknown-contact';
        message = 'The requested Level 0 contact does not exist.';
      } else {
        window.dispatchEvent(
          new CustomEvent(LEVEL0_AGENT_INTERACTION_EVENT, { detail: { anchorId: `contact.${contact}` } })
        );
      }
      break;
    }
    case 'retryMission':
      window.dispatchEvent(new CustomEvent(LEVEL0_AGENT_RETRY_EVENT));
      break;
    case 'wait':
      await wait(action.ms ?? 500);
      reason = 'wait-completed';
      message = `Waited ${action.ms ?? 500}ms without mutating authored state.`;
      break;
    case 'waitForPlayerIdle': {
      const idleResult = await waitForPlayerIdle(
        store,
        context.acceptedMovementTarget,
        action.timeoutMs ?? 6_000
      );
      status = idleResult === 'idle' ? 'ok' : 'timeout';
      if (idleResult === 'idle') context.acceptedMovementTarget = null;
      reason = idleResult === 'idle'
        ? 'player-idle'
        : idleResult === 'no-intent'
          ? 'player-idle-no-accepted-intent'
          : 'player-idle-timeout';
      message = idleResult === 'idle'
        ? 'Player position settled through canonical runtime checkpoints.'
        : idleResult === 'no-intent'
          ? 'No acknowledged movement intent is available to wait for.'
          : 'Player position did not reach the acknowledged target before the timeout.';
      break;
    }
    case 'waitForDialogue':
    case 'waitForObjectiveChange':
      await wait(Math.min(action.timeoutMs ?? 250, 1_000));
      status = 'no-op';
      reason = 'content-not-owned-by-get-203';
      message = `${action.type} is a bounded compatibility wait; its authored system is not implemented in GET-203.`;
      break;
    case 'toggleStealth':
      status = 'rejected';
      reason = 'removed-system';
      message = 'The retired global stealth toggle is not part of the canonical Level 0 design.';
      break;
    case 'collectItem':
    case 'chooseDialogueOption':
    case 'continueMission':
    case 'focusObjective':
      status = 'rejected';
      reason = 'content-not-owned-by-get-203';
      message = `${action.type} belongs to a later canonical content ticket.`;
      break;
    case 'advanceMission':
    case 'triggerMissionFailure':
    case 'setClock':
      status = 'rejected';
      reason = 'debug-mutation-removed';
      message = `${action.type} cannot bypass the canonical runtime state machine.`;
      break;
  }

  const after = emptySnapshot(store.getState());
  return {
    ok: status === 'ok' || status === 'no-op',
    action: action.type,
    message,
    status,
    reason,
    beforeObjectiveId: currentObjectiveId(before),
    afterObjectiveId: currentObjectiveId(after),
    stateChanged: JSON.stringify(before.player.position) !== JSON.stringify(after.player.position) ||
      before.world.currentTime !== after.world.currentTime ||
      before.mission.levels[0]?.name !== after.mission.levels[0]?.name,
    evidenceHint: 'Snapshot is derived from the canonical Level 0 store and authored layout contract.',
    snapshot: after,
  };
};

export const installLevel0AgentBridge = (options: {
  store: Level0AgentStore;
  search?: string;
  nodeEnv?: string;
}): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const search = options.search ?? window.location.search;
  if (!shouldEnableGetawayAgentBridge(search, options.nodeEnv)) {
    delete window.__getawayAgent;
    delete window.render_game_to_text;
    delete window.advanceTime;
    return () => undefined;
  }

  const runtimeContext: Level0AgentRuntimeContext = { acceptedMovementTarget: null };

  window.__getawayAgent = {
    version: GETAWAY_AGENT_VERSION,
    snapshot: () => emptySnapshot(options.store.getState()),
    dispatch: (action) => dispatchAction(options.store, action, runtimeContext),
  };
  window.render_game_to_text = () => JSON.stringify({
    runtime: options.store.getState().level0Runtime.run,
    agent: emptySnapshot(options.store.getState()),
  });
  window.advanceTime = (realMilliseconds: number) => {
    options.store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: realMilliseconds }));
  };

  return () => {
    if (window.__getawayAgent?.version === GETAWAY_AGENT_VERSION) delete window.__getawayAgent;
    delete window.render_game_to_text;
    delete window.advanceTime;
  };
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (realMilliseconds: number) => void;
  }
}
