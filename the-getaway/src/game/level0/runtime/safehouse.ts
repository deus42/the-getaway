import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import { validateLevel0CoverSelection } from '../rpg/creation';
import { deriveLevel0ParanoiaTier } from '../rpg/gates';
import { applyLevel0ParanoiaEffect } from '../rpg/paranoia';
import {
  LEVEL0_RESEARCH_CATALOG,
  applyLevel0Research,
  synchronizeLevel0ResearchState,
} from '../rpg/research';
import type { Level0CoverId, Level0ResearchOptionId } from '../rpg/types';
import {
  acquirePauseOwner,
  createWorldClockState,
  jumpWorldClockMinutes,
} from './worldClock';
import type {
  Level0RunState,
  OperationAttemptBaseline,
  OperationAttemptBaselineReadback,
  SafehouseActionAvailability,
  SafehouseActionId,
} from './types';

export const LEVEL0_RUN_SCHEMA_VERSION = 3 as const;
export const LEVEL0_RUNTIME_CONTENT_VERSION = 'level0-runtime-v3';

export const LEVEL0_CONTENT_VERSIONS = {
  layout: LEVEL0_LAYOUT_CONTRACT.id,
  runtime: LEVEL0_RUNTIME_CONTENT_VERSION,
} as const;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getRequiredAnchorPosition = (anchorId: string) => {
  const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find((candidate) => candidate.id === anchorId);
  if (!anchor) throw new Error(`Required Level 0 anchor is missing: ${anchorId}`);
  return { ...anchor.position };
};

export const createInitialLevel0RunState = (
  sessionId: string,
  coverId: Level0CoverId
): Level0RunState => {
  if (!sessionId.trim()) throw new Error('Level 0 session ID is required');
  const selection = validateLevel0CoverSelection(coverId);
  if (!selection.valid || !selection.identity || !selection.abilities) {
    throw new Error(`Level 0 requires an available authored cover: ${selection.reasonId}`);
  }
  return {
    schemaVersion: LEVEL0_RUN_SCHEMA_VERSION,
    contentVersions: { ...LEVEL0_CONTENT_VERSIONS },
    sessionId,
    identity: clone(selection.identity),
    abilities: clone(selection.abilities),
    rpg: {
      gateResolutions: {},
      paranoiaEvents: [],
      announcedParanoiaTiers: [],
      researchEvents: [],
    },
    paranoia: 0,
    worldClock: createWorldClockState(),
    mission: 'L0_SAFEHOUSE_INTRO',
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
      operationAttemptBaselineCreated: false,
      recoveryAvailable: true,
      transitCredentialState: 'not-issued',
      debriefAvailable: false,
      usedActionIds: [],
    },
    recovery: {
      usedGroundingActionIds: [],
      difficultSurveillanceEscapeReliefUsed: false,
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
    failureSourceId: null,
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
    abilities: {
      ...clone(run.abilities),
      researchState: synchronizeLevel0ResearchState(
        Object.keys(run.facts.known),
        run.abilities.researchState
      ),
    },
    worldClock: { ...clone(run.worldClock), pauseOwners: durablePauseOwners },
  };
};

const requiresProtectedSafehouseState = (actionId: SafehouseActionId): boolean =>
  !['character', 'dossier'].includes(actionId);

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
  if (run.mission === 'L0_FAILED' || run.mission === 'L0_COMPLETE') {
    return blocked('safehouse.blocked.terminal');
  }
  if (!run.safehouse.insideBoundary) return blocked('safehouse.blocked.not_inside');
  if (requiresProtectedSafehouseState(actionId) && run.surveillance.level !== 'clear') {
    return blocked('safehouse.blocked.network_not_clear');
  }
  if (requiresProtectedSafehouseState(actionId) && run.surveillance.directlyObserved) {
    return blocked('safehouse.blocked.observed');
  }
  if (actionId === 'depart') {
    if (run.mission !== 'L0_PREPARATION') {
      return blocked('safehouse.blocked.preparation_incomplete');
    }
    if (run.safehouse.operationAttemptBaselineCreated) {
      return blocked('safehouse.blocked.already_departed');
    }
  }
  if (actionId === 'outbound-transit' &&
    run.safehouse.transitCredentialState !== 'issued') {
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

export const applyClockResult = (
  run: Level0RunState,
  clockResult: ReturnType<typeof jumpWorldClockMinutes>
): Level0RunState => {
  const deadlineEvent = clockResult.events.find((event) => event.kind === 'deadline-failure');
  const deadlineFailure = deadlineEvent?.kind === 'deadline-failure';
  return {
    ...run,
    worldClock: deadlineFailure
      ? acquirePauseOwner(clockResult.state, 'failure')
      : clockResult.state,
    mission: deadlineFailure ? 'L0_FAILED' : run.mission,
    failureCause: deadlineFailure ? 'failure.deadline' : run.failureCause,
    failureSourceId: deadlineFailure ? 'clock.deadline' : run.failureSourceId,
    failureMissingRequirements: deadlineFailure
      ? [...deadlineEvent.missing]
      : run.failureMissingRequirements,
  };
};

const recordSafehouseAction = (run: Level0RunState, actionId: SafehouseActionId): Level0RunState => ({
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
    return { applied: false, run, blockedReasonId: availability.blockedReasonId, clockEventIds: [] };
  }
  const clockResult = jumpWorldClockMinutes(run.worldClock, 30, run.completion);
  return {
    applied: true,
    run: recordSafehouseAction(applyClockResult(run, clockResult), 'wait'),
    clockEventIds: clockResult.events.map((event) => event.id),
  };
};

export const applySafehouseRest = (run: Level0RunState): SafehouseEffectResult => {
  const availability = evaluateSafehouseAction(run, 'rest');
  if (!availability.available) {
    return { applied: false, run, blockedReasonId: availability.blockedReasonId, clockEventIds: [] };
  }
  const clockResult = jumpWorldClockMinutes(run.worldClock, 30, run.completion);
  let recovered = applyClockResult(run, clockResult);
  if (recovered.mission !== 'L0_FAILED' && recovered.paranoia > 0) {
    recovered = applyLevel0ParanoiaEffect(recovered, {
      eventId: `safehouse.rest.paranoia.${recovered.worldClock.currentMinute}`,
      amount: -40,
      sourceId: 'safehouse.rest',
      feedbackId: 'paranoia.safehouse_rest',
    }).run;
  }
  return {
    applied: true,
    run: recordSafehouseAction(recovered, 'rest'),
    clockEventIds: clockResult.events.map((event) => event.id),
  };
};

export const applySafehouseResearch = (
  run: Level0RunState,
  optionId: Level0ResearchOptionId
): SafehouseEffectResult => {
  const availability = evaluateSafehouseAction(run, 'research');
  if (!availability.available) {
    return { applied: false, run, blockedReasonId: availability.blockedReasonId, clockEventIds: [] };
  }
  const option = LEVEL0_RESEARCH_CATALOG[optionId];
  const knownFactIds = Object.keys(run.facts.known);
  const researchState = synchronizeLevel0ResearchState(
    knownFactIds,
    run.abilities.researchState
  );
  const research = applyLevel0Research({
    option,
    knownFactIds,
    heldAbilityIds: run.abilities.heldAbilityIds,
    researchState,
  });
  if (!research.applied || !research.consumedFactId || !research.grantedAbilityId) {
    return { applied: false, run, blockedReasonId: research.reasonId, clockEventIds: [] };
  }
  const clockResult = jumpWorldClockMinutes(
    run.worldClock,
    research.worldMinuteCost,
    run.completion
  );
  const facts = { ...run.facts.known };
  delete facts[research.consumedFactId];
  const advanced = applyClockResult({
    ...run,
    facts: { known: facts },
    abilities: {
      heldAbilityIds: research.heldAbilityIds,
      researchState: research.researchState,
    },
    rpg: {
      ...run.rpg,
      researchEvents: [
        ...run.rpg.researchEvents,
        {
          eventId: `${optionId}.${run.rpg.researchEvents.length + 1}`,
          optionId,
          consumedFactId: research.consumedFactId,
          grantedAbilityId: research.grantedAbilityId,
          worldMinuteCost: research.worldMinuteCost,
          completedAtWorldMinute: clockResult.state.currentMinute,
        },
      ],
    },
  }, clockResult);
  return {
    applied: true,
    run: recordSafehouseAction(advanced, 'research'),
    clockEventIds: clockResult.events.map((event) => event.id),
  };
};

const projectOperationAttemptBaseline = (run: Level0RunState): OperationAttemptBaseline => clone({
  schemaVersion: run.schemaVersion,
  contentVersions: run.contentVersions,
  sessionId: run.sessionId,
  createdAtWorldMinute: run.worldClock.currentMinute,
  identity: run.identity,
  abilities: run.abilities,
  rpg: run.rpg,
  paranoia: run.paranoia,
  worldClock: run.worldClock,
  mission: run.mission,
  objectives: run.objectives,
  facts: run.facts,
  mapKnowledge: run.mapKnowledge,
  contacts: run.contacts,
  safehouse: run.safehouse,
  recovery: run.recovery,
  surveillance: run.surveillance,
  player: run.player,
  runtimeGeneration: run.runtimeGeneration,
  completion: run.completion,
});

export const departLevel0Operation = (
  run: Level0RunState,
  position: { x: number; y: number }
): { run: Level0RunState; baseline: OperationAttemptBaseline | null; created: boolean } => {
  const availability = evaluateSafehouseAction(run, 'depart');
  if (!availability.available) return { run, baseline: null, created: false };
  const departedRun: Level0RunState = {
    ...run,
    mission: 'L0_OPERATION_DEPARTED',
    worldClock: { ...run.worldClock, pauseOwners: [...run.worldClock.pauseOwners] },
    safehouse: {
      ...run.safehouse,
      insideBoundary: false,
      operationAttemptBaselineCreated: true,
      usedActionIds: run.safehouse.usedActionIds.includes('depart')
        ? run.safehouse.usedActionIds
        : [...run.safehouse.usedActionIds, 'depart'],
    },
    player: { position: { ...position }, facing: { ...run.player.facing } },
    failureCause: null,
    failureSourceId: null,
    failureMissingRequirements: [],
  };
  return {
    run: departedRun,
    baseline: projectOperationAttemptBaseline(departedRun),
    created: true,
  };
};

export const restartLevel0Attempt = (baseline: OperationAttemptBaseline): Level0RunState => {
  const restored = clone(baseline);
  return {
    schemaVersion: restored.schemaVersion,
    contentVersions: restored.contentVersions,
    sessionId: restored.sessionId,
    identity: restored.identity,
    abilities: restored.abilities,
    rpg: restored.rpg,
    paranoia: restored.paranoia,
    worldClock: { ...restored.worldClock, pauseOwners: [] },
    mission: restored.mission,
    objectives: restored.objectives,
    facts: restored.facts,
    mapKnowledge: restored.mapKnowledge,
    contacts: restored.contacts,
    safehouse: { ...restored.safehouse, insideBoundary: false },
    recovery: restored.recovery,
    surveillance: restored.surveillance,
    player: restored.player,
    runtimeGeneration: restored.runtimeGeneration,
    completion: restored.completion,
    failureCause: null,
    failureSourceId: null,
    failureMissingRequirements: [],
  };
};

export const createOperationAttemptBaselineReadback = (
  baseline: OperationAttemptBaseline
): OperationAttemptBaselineReadback => ({
  departureWorldMinute: baseline.createdAtWorldMinute,
  contactsConsulted: (['naila', 'brant'] as const).filter(
    (contact) => baseline.contacts[contact].consulted
  ),
  paranoiaTier: deriveLevel0ParanoiaTier(baseline.paranoia) as OperationAttemptBaselineReadback['paranoiaTier'],
  heldAbilityIds: [...baseline.abilities.heldAbilityIds],
  localizedRestorationMeaningKey: 'restart_attempt.restores_departure_baseline',
});
