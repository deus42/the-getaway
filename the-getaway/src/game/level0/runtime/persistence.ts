import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import { isPointWalkableWithClearance } from '../layout/validator';
import type { WorldPoint } from '../layout/types';
import { LEVEL0_COVER_CATALOG, isLevel0CoverId } from '../rpg/creation';
import {
  LEVEL0_ABILITY_CATALOG,
  LEVEL0_GATE_CATALOG,
} from '../rpg/gates';
import { LEVEL0_RESEARCH_CATALOG } from '../rpg/research';
import type {
  Level0AbilityId,
  Level0ResearchOptionId,
} from '../rpg/types';
import {
  LEVEL0_CONTENT_VERSIONS,
  LEVEL0_RUN_SCHEMA_VERSION,
  LEVEL0_RUNTIME_CONTENT_VERSION,
  normalizeLevel0RunForHydration,
} from './safehouse';
import type {
  ContactState,
  Level0DeadlineRequirement,
  Level0RunState,
  OperationAttemptBaseline,
  PauseOwner,
} from './types';

export const LEVEL0_AUTOSAVE_KEY = 'the-getaway-level0-autosave-v3';
export const LEVEL0_ATTEMPT_BASELINE_KEY = 'the-getaway-level0-attempt-baseline-v3';

const RETIRED_LEVEL0_KEYS = [
  'the-getaway-level0-autosave-v1',
  'the-getaway-level0-retry-v1',
] as const;

export interface Level0PersistenceEnvelope<T> {
  kind: 'autosave' | 'operation-attempt-baseline';
  schemaVersion: 3;
  contentVersions: Record<string, string>;
  timestamp: number;
  payload: T;
}

type DecodeResult<T> =
  | { status: 'absent' }
  | { status: 'incompatible'; reason: 'malformed' | 'schema-version' | 'content-version' | 'payload' }
  | { status: 'compatible'; envelope: Level0PersistenceEnvelope<T> };

export type DepartureTransactionResult =
  | { status: 'written' | 'reused' }
  | { status: 'conflict'; reason: 'baseline-payload' | 'baseline-session' | 'baseline-state' };

const PAUSE_OWNERS: PauseOwner[] = [
  'menu',
  'bible',
  'settings',
  'cover_select',
  'character',
  'dossier',
  'social_feed',
  'dialogue',
  'observation',
  'terminal',
  'safehouse_action',
  'george_consultation',
  'interception',
  'restart_attempt_confirmation',
  'research',
  'debrief',
  'mission_recap',
  'failure',
  'completion',
];

const MISSION_STATES = new Set([
  'L0_COVER_SELECT',
  'L0_SAFEHOUSE_INTRO',
  'L0_LIRA_BRIEFING',
  'L0_PREPARATION',
  'L0_OPERATION_DEPARTED',
  'L0_INFILTRATION',
  'L0_MEDKITS_SECURED',
  'L0_ESCAPE',
  'L0_LIRA_RETURN',
  'L0_TRANSIT_VALIDATION',
  'L0_DEBRIEF',
  'L0_COMPLETE',
  'L0_FAILED',
]);

const RUN_KEYS = [
  'schemaVersion',
  'contentVersions',
  'sessionId',
  'identity',
  'abilities',
  'rpg',
  'paranoia',
  'worldClock',
  'mission',
  'objectives',
  'facts',
  'mapKnowledge',
  'contacts',
  'safehouse',
  'recovery',
  'surveillance',
  'player',
  'runtimeGeneration',
  'completion',
  'failureCause',
  'failureSourceId',
  'failureMissingRequirements',
] as const;

const BASELINE_KEYS = [
  'schemaVersion',
  'contentVersions',
  'sessionId',
  'createdAtWorldMinute',
  'identity',
  'abilities',
  'rpg',
  'paranoia',
  'worldClock',
  'mission',
  'objectives',
  'facts',
  'mapKnowledge',
  'contacts',
  'safehouse',
  'recovery',
  'surveillance',
  'player',
  'runtimeGeneration',
  'completion',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const hasAllowedKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = []
): boolean => required.every((key) => key in value) &&
  Object.keys(value).every((key) => required.includes(key) || optional.includes(key));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isIntegerInRange = (value: unknown, minimum: number, maximum: number): boolean =>
  Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isUniqueStringArray = (value: unknown, allowEmpty = true): value is string[] =>
  Array.isArray(value) && (allowEmpty || value.length > 0) &&
  value.every(isNonEmptyString) && new Set(value).size === value.length;

const isWorldPoint = (value: unknown): value is WorldPoint =>
  isRecord(value) && hasExactKeys(value, ['x', 'y']) &&
  isFiniteNumber(value.x) && isFiniteNumber(value.y);

const isWalkableWorldPoint = (value: unknown): value is WorldPoint =>
  isWorldPoint(value) && isPointWalkableWithClearance(LEVEL0_LAYOUT_CONTRACT, value);

const isNormalizedFacing = (value: unknown): boolean => {
  if (!isWorldPoint(value)) return false;
  const length = Math.hypot(value.x, value.y);
  return length > 0.000001 && Math.abs(length - 1) <= 0.001;
};

const hasCurrentContentVersions = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['layout', 'runtime']) &&
  value.layout === LEVEL0_CONTENT_VERSIONS.layout &&
  value.runtime === LEVEL0_CONTENT_VERSIONS.runtime;

const expectedClockPhase = (minute: number) =>
  minute >= 22 * 60 ? 'curfew' : minute >= 20 * 60 ? 'blue-hour' : 'dusk';

const expectedProcessedBoundaries = (minute: number): string[] => {
  const ids: string[] = [];
  if (minute >= 21 * 60) ids.push('clock.2100');
  if (minute >= 21 * 60 + 30) ids.push('clock.2130');
  if (minute >= 22 * 60) ids.push('clock.2200');
  if (minute >= 23 * 60 + 30) ids.push('clock.2330');
  return ids;
};

const isWorldClock = (value: unknown): boolean => {
  if (!isRecord(value) || !isFiniteNumber(value.currentMinute)) return false;
  const minute = value.currentMinute;
  const boundaries = expectedProcessedBoundaries(minute);
  const lastBoundary = boundaries[boundaries.length - 1];
  return hasAllowedKeys(value, [
    'currentWorldMillisecond',
    'currentMinute',
    'phase',
    'curfewActive',
    'deadlineReached',
    'processedBoundaryIds',
    'pauseOwners',
    'scheduleStates',
  ], ['lastProcessedScheduleBoundaryId']) &&
    minute >= 0 && minute <= 24 * 60 &&
    isFiniteNumber(value.currentWorldMillisecond) &&
    Math.abs(value.currentWorldMillisecond - minute * 60_000) < 0.001 &&
    value.phase === expectedClockPhase(minute) &&
    value.curfewActive === (minute >= 22 * 60) &&
    value.deadlineReached === (minute >= 24 * 60) &&
    isUniqueStringArray(value.processedBoundaryIds) &&
    JSON.stringify(value.processedBoundaryIds) === JSON.stringify(boundaries) &&
    (lastBoundary === undefined
      ? value.lastProcessedScheduleBoundaryId === undefined
      : value.lastProcessedScheduleBoundaryId === lastBoundary) &&
    isUniqueStringArray(value.pauseOwners) &&
    value.pauseOwners.every((owner) => PAUSE_OWNERS.includes(owner as PauseOwner)) &&
    isRecord(value.scheduleStates) &&
    value.scheduleStates.lighting === expectedClockPhase(minute) &&
    value.scheduleStates.publicActivity === (minute >= 22 * 60 ? 'curfew' : 'active') &&
    Object.values(value.scheduleStates).every(isNonEmptyString);
};

const isIdentity = (value: unknown): boolean => {
  if (!isRecord(value) || !hasExactKeys(value, ['coverId', 'appearancePresetId']) ||
    !isLevel0CoverId(value.coverId)) return false;
  const cover = LEVEL0_COVER_CATALOG[value.coverId];
  return cover.playable && value.appearancePresetId === cover.appearancePresetId;
};

const ABILITY_IDS = new Set(Object.keys(LEVEL0_ABILITY_CATALOG));
const RESEARCH_IDS = Object.keys(LEVEL0_RESEARCH_CATALOG) as Level0ResearchOptionId[];

const isAbilities = (value: unknown, identity: unknown, facts: unknown, rpg: unknown): boolean => {
  if (!isRecord(value) || !hasExactKeys(value, ['heldAbilityIds', 'researchState']) ||
    !isUniqueStringArray(value.heldAbilityIds, false) ||
    !value.heldAbilityIds.every((id) => ABILITY_IDS.has(id)) ||
    !isRecord(value.researchState) || !hasExactKeys(value.researchState, RESEARCH_IDS) ||
    !Object.values(value.researchState).every((state) =>
      ['unavailable', 'available', 'consumed'].includes(String(state))
    ) || !isRecord(identity) || !isLevel0CoverId(identity.coverId) ||
    !isRecord(facts) || !isRecord(facts.known) || !isRecord(rpg) || !Array.isArray(rpg.researchEvents)) {
    return false;
  }
  const expected = new Set<Level0AbilityId>(
    LEVEL0_COVER_CATALOG[identity.coverId].startingAbilityIds
  );
  const eventByOption = new Map<string, Record<string, unknown>>();
  for (const rawEvent of rpg.researchEvents) {
    if (!isRecord(rawEvent) || !isNonEmptyString(rawEvent.optionId)) return false;
    eventByOption.set(rawEvent.optionId, rawEvent);
    if (isNonEmptyString(rawEvent.grantedAbilityId)) {
      expected.add(rawEvent.grantedAbilityId as Level0AbilityId);
    }
  }
  if (JSON.stringify([...expected]) !== JSON.stringify(value.heldAbilityIds)) return false;
  for (const optionId of RESEARCH_IDS) {
    const option = LEVEL0_RESEARCH_CATALOG[optionId];
    const state = value.researchState[optionId];
    const factKnown = option.requiredFactId in facts.known;
    const completed = eventByOption.has(optionId);
    if (state === 'consumed' ? !completed || factKnown : completed) return false;
    if (state === 'available' && !factKnown) return false;
    if (state === 'unavailable' && factKnown) return false;
  }
  return true;
};

const expectedTierEntries = (before: number, after: number): string[] =>
  after > before
    ? ([['uneasy', 40], ['shaken', 70], ['breaking', 90]] as const)
      .filter(([, floor]) => before < floor && after >= floor)
      .map(([tier]) => tier)
    : [];

const isParanoiaLedger = (
  value: unknown,
  expectedParanoia: number,
  currentWorldMinute: number,
  baselineCreated: boolean
): { valid: boolean; announced: string[] } => {
  if (!Array.isArray(value)) return { valid: false, announced: [] };
  const ids = new Set<string>();
  const announced: string[] = [];
  let paranoia = 0;
  for (const event of value) {
    if (!isRecord(event) || !hasExactKeys(event, [
      'eventId',
      'sourceId',
      'amount',
      'before',
      'after',
      'worldMinute',
      'feedbackId',
      'attemptTreatment',
      'newlyEnteredTiers',
    ]) || !isNonEmptyString(event.eventId) || ids.has(event.eventId) ||
      !isNonEmptyString(event.sourceId) || !isNonEmptyString(event.feedbackId) ||
      !isFiniteNumber(event.amount) || !Number.isInteger(event.amount) || event.amount === 0 ||
      !isIntegerInRange(event.before, 0, 100) || !isIntegerInRange(event.after, 0, 100) ||
      Number(event.before) !== paranoia || Number(event.after) - Number(event.before) !== event.amount ||
      !isFiniteNumber(event.worldMinute) || event.worldMinute < 0 || event.worldMinute > currentWorldMinute ||
      !['captured-in-baseline', 'discard-on-restart'].includes(String(event.attemptTreatment)) ||
      !isUniqueStringArray(event.newlyEnteredTiers) ||
      JSON.stringify(event.newlyEnteredTiers) !==
        JSON.stringify(expectedTierEntries(Number(event.before), Number(event.after)))) {
      return { valid: false, announced: [] };
    }
    if (!baselineCreated && event.attemptTreatment !== 'captured-in-baseline') {
      return { valid: false, announced: [] };
    }
    ids.add(event.eventId);
    paranoia = Number(event.after);
    (event.newlyEnteredTiers as string[]).forEach((tier) => {
      if (!announced.includes(tier)) announced.push(tier);
    });
  }
  return { valid: paranoia === expectedParanoia, announced };
};

const isGateResolutions = (value: unknown, currentWorldMinute: number): boolean => {
  if (!isRecord(value)) return false;
  const attempts = new Set<string>();
  return Object.entries(value).every(([key, raw]) => {
    if (!isRecord(raw) || !hasExactKeys(raw, [
      'gateId',
      'path',
      'status',
      'reasonId',
      'presentation',
      'abilityId',
      'factId',
      'costedPathId',
      'paranoiaTier',
      'resolutionId',
      'attemptKey',
      'resolvedAtWorldMinute',
    ]) || raw.resolutionId !== key || !isNonEmptyString(raw.gateId) ||
      !(raw.gateId in LEVEL0_GATE_CATALOG) ||
      !['ability', 'fact', 'costed'].includes(String(raw.path)) ||
      !['met', 'not-met'].includes(String(raw.status)) || !isNonEmptyString(raw.reasonId) ||
      raw.presentation !== 'result' || !isNonEmptyString(raw.attemptKey) ||
      attempts.has(raw.attemptKey) || !isFiniteNumber(raw.resolvedAtWorldMinute) ||
      raw.resolvedAtWorldMinute < 0 || raw.resolvedAtWorldMinute > currentWorldMinute ||
      !['calm', 'uneasy', 'shaken', 'breaking'].includes(String(raw.paranoiaTier))) return false;
    const requirement = LEVEL0_GATE_CATALOG[raw.gateId as keyof typeof LEVEL0_GATE_CATALOG];
    if (raw.abilityId !== requirement.abilityPath || raw.factId !== requirement.factPath ||
      raw.costedPathId !== requirement.costedPath) return false;
    attempts.add(raw.attemptKey);
    return true;
  });
};

const isResearchEvents = (value: unknown, currentWorldMinute: number): boolean => {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  const options = new Set<string>();
  return value.every((raw) => {
    if (!isRecord(raw) || !hasExactKeys(raw, [
      'eventId',
      'optionId',
      'consumedFactId',
      'grantedAbilityId',
      'worldMinuteCost',
      'completedAtWorldMinute',
    ]) || !isNonEmptyString(raw.eventId) || ids.has(raw.eventId) ||
      !isNonEmptyString(raw.optionId) || !(raw.optionId in LEVEL0_RESEARCH_CATALOG) ||
      options.has(raw.optionId) || !isFiniteNumber(raw.completedAtWorldMinute) ||
      raw.completedAtWorldMinute < 0 || raw.completedAtWorldMinute > currentWorldMinute) return false;
    const option = LEVEL0_RESEARCH_CATALOG[raw.optionId as Level0ResearchOptionId];
    if (raw.consumedFactId !== option.requiredFactId ||
      raw.grantedAbilityId !== option.grantedAbilityId ||
      raw.worldMinuteCost !== option.worldMinuteCost) return false;
    ids.add(raw.eventId);
    options.add(raw.optionId);
    return true;
  });
};

const isRpgLedger = (
  value: unknown,
  paranoia: number,
  currentWorldMinute: number,
  baselineCreated: boolean
): boolean => {
  if (!isRecord(value) || !hasExactKeys(value, [
    'gateResolutions',
    'paranoiaEvents',
    'announcedParanoiaTiers',
    'researchEvents',
  ]) || !isGateResolutions(value.gateResolutions, currentWorldMinute) ||
    !isResearchEvents(value.researchEvents, currentWorldMinute)) return false;
  const paranoiaLedger = isParanoiaLedger(
    value.paranoiaEvents,
    paranoia,
    currentWorldMinute,
    baselineCreated
  );
  return paranoiaLedger.valid && isUniqueStringArray(value.announcedParanoiaTiers) &&
    JSON.stringify(value.announcedParanoiaTiers) === JSON.stringify(paranoiaLedger.announced);
};

const isFacts = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['known']) && isRecord(value.known) &&
  Object.entries(value.known).every(([id, fact]) =>
    isRecord(fact) && hasExactKeys(fact, ['factId', 'acquisitionIds']) &&
    fact.factId === id && isUniqueStringArray(fact.acquisitionIds, false)
  );

const isObjectives = (value: unknown): boolean =>
  isRecord(value) && Object.keys(value).length > 0 && Object.entries(value).every(([id, entry]) =>
    isRecord(entry) && hasAllowedKeys(entry, ['objectiveId', 'status'], ['completedAtWorldMinute']) &&
    entry.objectiveId === id &&
    ['hidden', 'available', 'active', 'completed', 'failed', 'superseded'].includes(String(entry.status)) &&
    (entry.completedAtWorldMinute === undefined || isFiniteNumber(entry.completedAtWorldMinute))
  );

const isMapKnowledge = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, [
    'discoveredLocationIds',
    'discoveredCameraIds',
    'discoveredTerminalIds',
    'discoveredHidingContextIds',
    'discoveredBlendingContextIds',
    'objectivePrecision',
  ]) && isUniqueStringArray(value.discoveredLocationIds, false) &&
  isUniqueStringArray(value.discoveredCameraIds) &&
  isUniqueStringArray(value.discoveredTerminalIds, false) &&
  isUniqueStringArray(value.discoveredHidingContextIds) &&
  isUniqueStringArray(value.discoveredBlendingContextIds) &&
  isRecord(value.objectivePrecision) && Object.keys(value.objectivePrecision).length > 0 &&
  Object.values(value.objectivePrecision).every((precision) =>
    ['hidden', 'district', 'area', 'entrance', 'exact'].includes(String(precision))
  );

const isContact = (value: unknown): value is ContactState =>
  isRecord(value) && hasAllowedKeys(value, ['consulted', 'acquiredFactIds'], ['lastDialogueNodeId']) &&
  typeof value.consulted === 'boolean' &&
  (value.lastDialogueNodeId === undefined || isNonEmptyString(value.lastDialogueNodeId)) &&
  isUniqueStringArray(value.acquiredFactIds);

const isContacts = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['lira', 'naila', 'brant']) &&
  ['lira', 'naila', 'brant'].every((key) => isContact(value[key]));

const isSafehouse = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, [
    'insideBoundary',
    'operationAttemptBaselineCreated',
    'recoveryAvailable',
    'transitCredentialState',
    'debriefAvailable',
    'usedActionIds',
  ]) && typeof value.insideBoundary === 'boolean' &&
  typeof value.operationAttemptBaselineCreated === 'boolean' &&
  typeof value.recoveryAvailable === 'boolean' &&
  ['not-issued', 'issued', 'validated'].includes(String(value.transitCredentialState)) &&
  typeof value.debriefAvailable === 'boolean' && isUniqueStringArray(value.usedActionIds);

const isSurveillance = (value: unknown): boolean =>
  isRecord(value) && hasAllowedKeys(value, ['level', 'directlyObserved'], [
    'sourceDeviceId', 'lastKnownPosition',
  ]) && ['clear', 'suspicious', 'pursuit'].includes(String(value.level)) &&
  typeof value.directlyObserved === 'boolean' &&
  (value.sourceDeviceId === undefined || isNonEmptyString(value.sourceDeviceId)) &&
  (value.lastKnownPosition === undefined || isWalkableWorldPoint(value.lastKnownPosition));

const isPlayer = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['position', 'facing']) &&
  isWalkableWorldPoint(value.position) && isNormalizedFacing(value.facing);

const isRuntimeGeneration = (value: unknown, sessionId: string): boolean =>
  isRecord(value) && hasExactKeys(value, ['generationVersion', 'seed', 'authoredVariantIds']) &&
  value.generationVersion === LEVEL0_RUNTIME_CONTENT_VERSION && value.seed === `level0:${sessionId}` &&
  isRecord(value.authoredVariantIds) && hasExactKeys(value.authoredVariantIds, ['layout']) &&
  value.authoredVariantIds.layout === LEVEL0_LAYOUT_CONTRACT.id;

const isCompletion = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['medkitsReturned', 'transitValidated']) &&
  typeof value.medkitsReturned === 'boolean' && typeof value.transitValidated === 'boolean';

const GROUNDING_ACTION_IDS = [
  'grounding.transit-road-vending-coffee',
  'grounding.market-ring-shrine',
] as const;

const isAttemptRecovery = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ['usedGroundingActionIds', 'difficultSurveillanceEscapeReliefUsed']) &&
  isUniqueStringArray(value.usedGroundingActionIds) &&
  (value.usedGroundingActionIds as string[]).every((id) =>
    (GROUNDING_ACTION_IDS as readonly string[]).includes(id)
  ) &&
  typeof value.difficultSurveillanceEscapeReliefUsed === 'boolean';

const hasSharedFields = (value: unknown): boolean => {
  if (!isRecord(value) || value.schemaVersion !== LEVEL0_RUN_SCHEMA_VERSION ||
    !hasCurrentContentVersions(value.contentVersions) || !isNonEmptyString(value.sessionId) ||
    !isIdentity(value.identity) || !isIntegerInRange(value.paranoia, 0, 100) ||
    !isWorldClock(value.worldClock) || !isNonEmptyString(value.mission) ||
    !MISSION_STATES.has(value.mission) || !isObjectives(value.objectives) ||
    !isFacts(value.facts) || !isMapKnowledge(value.mapKnowledge) || !isContacts(value.contacts) ||
    !isSafehouse(value.safehouse) || !isAttemptRecovery(value.recovery) ||
    !isSurveillance(value.surveillance) ||
    !isPlayer(value.player) || !isRuntimeGeneration(value.runtimeGeneration, value.sessionId) ||
    !isCompletion(value.completion)) return false;
  const currentWorldMinute = Number((value.worldClock as Record<string, unknown>).currentMinute);
  const baselineCreated = Boolean(
    (value.safehouse as Record<string, unknown>).operationAttemptBaselineCreated
  );
  return isRpgLedger(value.rpg, Number(value.paranoia), currentWorldMinute, baselineCreated) &&
    isAbilities(value.abilities, value.identity, value.facts, value.rpg);
};

const deadlineRequirements = (completion: Level0RunState['completion']): Level0DeadlineRequirement[] => {
  const missing: Level0DeadlineRequirement[] = [];
  if (!completion.medkitsReturned) missing.push('medkits-returned');
  if (!completion.transitValidated) missing.push('transit-validated');
  return missing;
};

const isLevel0RunState = (value: unknown): value is Level0RunState => {
  if (!isRecord(value) || !hasExactKeys(value, RUN_KEYS) || !hasSharedFields(value) ||
    !isUniqueStringArray(value.failureMissingRequirements)) return false;
  const failed = value.mission === 'L0_FAILED';
  const failureCause = value.failureCause;
  const clock = value.worldClock as Level0RunState['worldClock'];
  const completion = value.completion as Level0RunState['completion'];
  const expectedMissing = deadlineRequirements(completion);
  if (!failed) {
    return failureCause === null && value.failureSourceId === null &&
      value.failureMissingRequirements.length === 0 &&
      !(clock.deadlineReached && expectedMissing.length > 0) && Number(value.paranoia) < 100;
  }
  if (!isNonEmptyString(value.failureSourceId) || !clock.pauseOwners.includes('failure')) return false;
  if (failureCause === 'failure.breakdown') {
    const events = (value.rpg as Level0RunState['rpg']).paranoiaEvents;
    return Number(value.paranoia) === 100 && value.failureMissingRequirements.length === 0 &&
      events[events.length - 1]?.sourceId === value.failureSourceId;
  }
  if (failureCause === 'failure.deadline') {
    return clock.deadlineReached && value.failureSourceId === 'clock.deadline' &&
      JSON.stringify(value.failureMissingRequirements) === JSON.stringify(expectedMissing) &&
      expectedMissing.length > 0;
  }
  return failureCause === 'failure.capture' && value.failureMissingRequirements.length === 0;
};

const isOperationAttemptBaseline = (value: unknown): value is OperationAttemptBaseline => {
  if (!isRecord(value) || !hasExactKeys(value, BASELINE_KEYS) || !hasSharedFields(value) ||
    value.mission !== 'L0_OPERATION_DEPARTED' ||
    !isFiniteNumber(value.createdAtWorldMinute) ||
    value.createdAtWorldMinute !== (value.worldClock as Record<string, unknown>).currentMinute ||
    (value.safehouse as Record<string, unknown>).operationAttemptBaselineCreated !== true) return false;
  const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find((candidate) => candidate.id === 'safehouse.departure');
  const position = (value.player as Level0RunState['player']).position;
  return Boolean(anchor) && Math.hypot(
    position.x - anchor!.position.x,
    position.y - anchor!.position.y
  ) <= 0.0001;
};

const normalizeBaseline = (baseline: OperationAttemptBaseline): OperationAttemptBaseline => ({
  ...JSON.parse(JSON.stringify(baseline)) as OperationAttemptBaseline,
  worldClock: {
    ...JSON.parse(JSON.stringify(baseline.worldClock)) as OperationAttemptBaseline['worldClock'],
    pauseOwners: [],
  },
});

const projectBaselineFromRun = (run: Level0RunState): OperationAttemptBaseline => ({
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

const decodeEnvelope = <T>(
  raw: string | null,
  expectedKind: Level0PersistenceEnvelope<T>['kind'],
  payloadGuard: (value: unknown) => value is T,
  normalize: (payload: T) => T
): DecodeResult<T> => {
  if (raw === null) return { status: 'absent' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'incompatible', reason: 'malformed' };
  }
  if (!isRecord(parsed) || parsed.kind !== expectedKind || !isFiniteNumber(parsed.timestamp)) {
    return { status: 'incompatible', reason: 'malformed' };
  }
  if (parsed.schemaVersion !== LEVEL0_RUN_SCHEMA_VERSION) {
    return { status: 'incompatible', reason: 'schema-version' };
  }
  if (!hasCurrentContentVersions(parsed.contentVersions)) {
    return { status: 'incompatible', reason: 'content-version' };
  }
  if (!payloadGuard(parsed.payload)) return { status: 'incompatible', reason: 'payload' };
  return {
    status: 'compatible',
    envelope: {
      kind: expectedKind,
      schemaVersion: LEVEL0_RUN_SCHEMA_VERSION,
      contentVersions: { ...LEVEL0_CONTENT_VERSIONS },
      timestamp: parsed.timestamp,
      payload: normalize(parsed.payload),
    },
  };
};

const serializeEnvelope = <T>(
  kind: Level0PersistenceEnvelope<T>['kind'],
  payload: T,
  timestamp: number
): string => JSON.stringify({
  kind,
  schemaVersion: LEVEL0_RUN_SCHEMA_VERSION,
  contentVersions: { ...LEVEL0_CONTENT_VERSIONS },
  timestamp,
  payload,
});

export const decodeLevel0Autosave = (raw: string | null): DecodeResult<Level0RunState> =>
  decodeEnvelope(raw, 'autosave', isLevel0RunState, normalizeLevel0RunForHydration);

export const writeLevel0Autosave = (
  storage: Storage,
  run: Level0RunState,
  timestamp = Date.now()
): void => {
  if (!isLevel0RunState(run)) {
    throw new Error('Refusing to persist an invalid Level 0 autosave payload');
  }
  storage.setItem(
    LEVEL0_AUTOSAVE_KEY,
    serializeEnvelope('autosave', normalizeLevel0RunForHydration(run), timestamp)
  );
};

export const writeLevel0DepartureTransaction = (
  storage: Storage,
  departedRun: Level0RunState,
  baseline: OperationAttemptBaseline,
  timestamp = Date.now()
): DepartureTransactionResult => {
  if (!isLevel0RunState(departedRun) || !isOperationAttemptBaseline(baseline)) {
    throw new Error('Refusing to persist an invalid Level 0 departure transaction');
  }
  if (departedRun.sessionId !== baseline.sessionId) {
    return { status: 'conflict', reason: 'baseline-session' };
  }
  const normalizedRun = normalizeLevel0RunForHydration(departedRun);
  const normalizedBaseline = normalizeBaseline(baseline);
  const expected = normalizeBaseline(projectBaselineFromRun(normalizedRun));
  if (JSON.stringify(normalizedBaseline) !== JSON.stringify(expected)) {
    return { status: 'conflict', reason: 'baseline-state' };
  }
  const existingBytes = storage.getItem(LEVEL0_ATTEMPT_BASELINE_KEY);
  let wroteBaseline = false;
  let status: DepartureTransactionResult['status'] = 'written';
  if (existingBytes !== null) {
    const existing = decodeEnvelope(
      existingBytes,
      'operation-attempt-baseline',
      isOperationAttemptBaseline,
      normalizeBaseline
    );
    if (existing.status !== 'compatible') {
      return { status: 'conflict', reason: 'baseline-payload' };
    }
    if (existing.envelope.payload.sessionId !== normalizedBaseline.sessionId) {
      return { status: 'conflict', reason: 'baseline-session' };
    }
    if (JSON.stringify(existing.envelope.payload) !== JSON.stringify(normalizedBaseline)) {
      return { status: 'conflict', reason: 'baseline-state' };
    }
    status = 'reused';
  } else {
    storage.setItem(
      LEVEL0_ATTEMPT_BASELINE_KEY,
      serializeEnvelope('operation-attempt-baseline', normalizedBaseline, timestamp)
    );
    wroteBaseline = true;
  }
  try {
    storage.setItem(
      LEVEL0_AUTOSAVE_KEY,
      serializeEnvelope('autosave', normalizedRun, timestamp)
    );
  } catch (error) {
    if (wroteBaseline) storage.removeItem(LEVEL0_ATTEMPT_BASELINE_KEY);
    throw error;
  }
  return { status };
};

export const readLevel0OperationAttemptBaseline = (
  storage: Storage
): DecodeResult<OperationAttemptBaseline> => decodeEnvelope(
  storage.getItem(LEVEL0_ATTEMPT_BASELINE_KEY),
  'operation-attempt-baseline',
  isOperationAttemptBaseline,
  normalizeBaseline
);

export const readLevel0Autosave = (storage: Storage): DecodeResult<Level0RunState> =>
  decodeLevel0Autosave(storage.getItem(LEVEL0_AUTOSAVE_KEY));

export const clearLevel0Persistence = (storage: Storage): void => {
  storage.removeItem(LEVEL0_AUTOSAVE_KEY);
  storage.removeItem(LEVEL0_ATTEMPT_BASELINE_KEY);
  RETIRED_LEVEL0_KEYS.forEach((key) => storage.removeItem(key));
};
