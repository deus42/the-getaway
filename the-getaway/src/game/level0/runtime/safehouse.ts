import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import { resolvePlayerSpriteSetId } from '../../../content/characters/spriteManifest';
import {
  acquirePauseOwner,
  createWorldClockState,
  jumpWorldClockMinutes,
} from './worldClock';
import type {
  Level0RunState,
  RetrySnapshot,
  SafehouseActionAvailability,
  SafehouseActionId,
} from './types';

export const LEVEL0_RUN_SCHEMA_VERSION = 1;
export const LEVEL0_RUNTIME_CONTENT_VERSION = 'level0-runtime-v1';

export const LEVEL0_CONTENT_VERSIONS = {
  layout: LEVEL0_LAYOUT_CONTRACT.id,
  runtime: LEVEL0_RUNTIME_CONTENT_VERSION,
} as const;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getRequiredAnchorPosition = (anchorId: string) => {
  const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find((candidate) => candidate.id === anchorId);
  if (!anchor) {
    throw new Error(`Required Level 0 anchor is missing: ${anchorId}`);
  }
  return { ...anchor.position };
};

export const createInitialLevel0RunState = (
  sessionId: string,
  appearancePresetId = 'player_civilian_01'
): Level0RunState => {
  if (!sessionId.trim()) {
    throw new Error('Level 0 session ID is required');
  }
  if (!resolvePlayerSpriteSetId(appearancePresetId)) {
    throw new Error(`Unknown Level 0 appearance preset: ${appearancePresetId}`);
  }

  return {
    schemaVersion: LEVEL0_RUN_SCHEMA_VERSION,
    contentVersions: { ...LEVEL0_CONTENT_VERSIONS },
    sessionId,
    identity: {
      callsign: '',
      appearancePresetId,
    },
    build: {
      attributes: { physical: 1, mental: 1, social: 1, technical: 1 },
      skills: {
        stealth: 0,
        evasion: 0,
        awareness: 0,
        composure: 0,
        insight: 0,
        influence: 0,
        systems: 0,
        opsec: 0,
      },
      level: 1,
      xp: 0,
      unspentSkillPoints: 0,
      unspentAttributePoints: 0,
    },
    health: 100,
    paranoia: 0,
    worldClock: createWorldClockState(),
    // T3 starts at preparation so departure/Retry can be proven before T7/T9/T10
    // insert creation, Lira, and authored preparation content.
    mission: 'L0_PREPARATION',
    objectives: {
      'objective.runtime.explore': {
        objectiveId: 'objective.runtime.explore',
        status: 'active',
      },
    },
    facts: { known: {} },
    mapKnowledge: {
      discoveredLocationIds: ['safehouse.boundary', 'contact.lira'],
      discoveredCameraIds: [],
      discoveredTerminalIds: ['terminal.outbound_transit'],
      discoveredHidingContextIds: [],
      discoveredBlendingContextIds: [],
      objectivePrecision: { 'objective.runtime.explore': 'district' },
    },
    contacts: {
      lira: { consulted: false, acquiredFactIds: [] },
      naila: { consulted: false, acquiredFactIds: [] },
      brant: { consulted: false, acquiredFactIds: [] },
    },
    safehouse: {
      insideBoundary: true,
      departureSnapshotCreated: false,
      recoveryAvailable: true,
      transitCredentialState: 'not-issued',
      debriefAvailable: false,
      usedActionIds: [],
    },
    surveillance: {
      level: 'clear',
      directlyObserved: false,
    },
    player: {
      position: getRequiredAnchorPosition('safehouse.spawn'),
      facing: { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    },
    runtimeGeneration: {
      generationVersion: LEVEL0_RUNTIME_CONTENT_VERSION,
      seed: `level0:${sessionId}`,
      authoredVariantIds: { layout: LEVEL0_LAYOUT_CONTRACT.id },
    },
    completion: {
      medkitsReturned: false,
      transitValidated: false,
    },
    failureCause: null,
    failureMissingRequirements: [],
  };
};

export const normalizeLevel0RunForHydration = (run: Level0RunState): Level0RunState => {
  const durablePauseOwners = run.mission === 'L0_FAILED'
    ? ['failure' as const]
    : run.mission === 'L0_COMPLETE'
      ? ['completion' as const]
      : [];
  return {
    ...clone(run),
    worldClock: {
      ...clone(run.worldClock),
      pauseOwners: durablePauseOwners,
    },
  };
};

export const evaluateSafehouseAction = (
  run: Level0RunState,
  actionId: SafehouseActionId
): SafehouseActionAvailability => {
  const base = {
    actionId,
    evaluatedAgainstSurveillanceLevel: run.surveillance.level,
    directlyObserved: run.surveillance.directlyObserved,
  };

  const blocked = (blockedReasonId: string): SafehouseActionAvailability => ({
    ...base,
    available: false,
    blockedReasonId,
  });

  if (!run.safehouse.insideBoundary) {
    return blocked('safehouse.blocked.not_inside');
  }
  // Provisional OPEN-SAFE-001 seam: the boundary never changes network state,
  // and all planning/recovery actions require Clear plus no direct observer.
  if (run.surveillance.level !== 'clear') {
    return blocked('safehouse.blocked.network_not_clear');
  }
  if (run.surveillance.directlyObserved) {
    return blocked('safehouse.blocked.observed');
  }
  if (actionId === 'depart') {
    if (run.mission !== 'L0_PREPARATION') {
      return blocked('safehouse.blocked.preparation_incomplete');
    }
    if (run.safehouse.departureSnapshotCreated) {
      return blocked('safehouse.blocked.already_departed');
    }
  }
  if (
    actionId === 'outbound-transit' &&
    run.safehouse.transitCredentialState !== 'issued'
  ) {
    return blocked('safehouse.blocked.credential_missing');
  }

  return { ...base, available: true };
};

export interface SafehouseEffectResult {
  applied: boolean;
  run: Level0RunState;
  blockedReasonId?: string;
  clockEventIds: string[];
}

const applyClockResult = (
  run: Level0RunState,
  clockResult: ReturnType<typeof jumpWorldClockMinutes>
): Level0RunState => {
  const deadlineFailure = clockResult.events.some((event) => event.kind === 'deadline-failure');
  const deadlineEvent = clockResult.events.find((event) => event.kind === 'deadline-failure');
  const worldClock = deadlineFailure
    ? acquirePauseOwner(clockResult.state, 'failure')
    : clockResult.state;
  return {
    ...run,
    worldClock,
    mission: deadlineFailure ? 'L0_FAILED' : run.mission,
    failureCause: deadlineFailure ? 'failure.deadline' : run.failureCause,
    failureMissingRequirements: deadlineEvent?.kind === 'deadline-failure'
      ? [...deadlineEvent.missing]
      : run.failureMissingRequirements,
  };
};

const recordSafehouseAction = (run: Level0RunState, actionId: SafehouseActionId) => ({
  ...run,
  safehouse: {
    ...run.safehouse,
    usedActionIds: run.safehouse.usedActionIds.includes(actionId)
      ? run.safehouse.usedActionIds
      : [...run.safehouse.usedActionIds, actionId],
  },
});

export const applySafehouseWait = (run: Level0RunState): SafehouseEffectResult => {
  const availability = evaluateSafehouseAction(run, 'wait');
  if (!availability.available) {
    return {
      applied: false,
      run,
      blockedReasonId: availability.blockedReasonId,
      clockEventIds: [],
    };
  }
  const clockResult = jumpWorldClockMinutes(run.worldClock, 30, run.completion);
  const next = recordSafehouseAction(applyClockResult(run, clockResult), 'wait');
  return {
    applied: true,
    run: next,
    clockEventIds: clockResult.events.map((event) => event.id),
  };
};

export const applySafehouseRest = (run: Level0RunState): SafehouseEffectResult => {
  const availability = evaluateSafehouseAction(run, 'rest');
  if (!availability.available) {
    return {
      applied: false,
      run,
      blockedReasonId: availability.blockedReasonId,
      clockEventIds: [],
    };
  }
  const clockResult = jumpWorldClockMinutes(run.worldClock, 30, run.completion);
  const recovered = {
    ...applyClockResult(run, clockResult),
    health: 100,
    paranoia: Math.max(0, run.paranoia - 40),
  };
  return {
    applied: true,
    run: recordSafehouseAction(recovered, 'rest'),
    clockEventIds: clockResult.events.map((event) => event.id),
  };
};

export const departLevel0Operation = (
  run: Level0RunState,
  position: { x: number; y: number }
): { run: Level0RunState; snapshot: RetrySnapshot | null; created: boolean } => {
  const availability = evaluateSafehouseAction(run, 'depart');
  if (!availability.available) {
    return { run, snapshot: null, created: false };
  }

  const departedRun: Level0RunState = {
    ...run,
    mission: 'L0_OPERATION_DEPARTED',
    worldClock: { ...run.worldClock, pauseOwners: [...run.worldClock.pauseOwners] },
    safehouse: {
      ...run.safehouse,
      insideBoundary: false,
      departureSnapshotCreated: true,
      usedActionIds: run.safehouse.usedActionIds.includes('depart')
        ? run.safehouse.usedActionIds
        : [...run.safehouse.usedActionIds, 'depart'],
    },
    surveillance: {
      ...run.surveillance,
      level: 'clear',
      directlyObserved: false,
    },
    player: {
      position: { ...position },
      facing: { ...run.player.facing },
    },
    failureCause: null,
    failureMissingRequirements: [],
  };

  const snapshot: RetrySnapshot = clone({
    schemaVersion: departedRun.schemaVersion,
    contentVersions: departedRun.contentVersions,
    sessionId: departedRun.sessionId,
    createdAtWorldMinute: departedRun.worldClock.currentMinute,
    identity: departedRun.identity,
    build: departedRun.build,
    health: departedRun.health,
    paranoia: departedRun.paranoia,
    worldClock: departedRun.worldClock,
    mission: departedRun.mission,
    objectives: departedRun.objectives,
    facts: departedRun.facts,
    mapKnowledge: departedRun.mapKnowledge,
    contacts: departedRun.contacts,
    safehouse: departedRun.safehouse,
    surveillance: departedRun.surveillance,
    player: departedRun.player,
    runtimeGeneration: departedRun.runtimeGeneration,
    completion: departedRun.completion,
  });

  return { run: departedRun, snapshot, created: true };
};

export const restoreLevel0RetrySnapshot = (snapshot: RetrySnapshot): Level0RunState => {
  const restored = clone(snapshot);
  return {
    schemaVersion: restored.schemaVersion,
    contentVersions: restored.contentVersions,
    sessionId: restored.sessionId,
    identity: restored.identity,
    build: restored.build,
    health: restored.health,
    paranoia: restored.paranoia,
    worldClock: { ...restored.worldClock, pauseOwners: [] },
    mission: restored.mission,
    objectives: restored.objectives,
    facts: restored.facts,
    mapKnowledge: restored.mapKnowledge,
    contacts: restored.contacts,
    safehouse: { ...restored.safehouse, insideBoundary: false },
    surveillance: restored.surveillance,
    player: restored.player,
    runtimeGeneration: restored.runtimeGeneration,
    completion: restored.completion,
    failureCause: null,
    failureMissingRequirements: [],
  };
};
