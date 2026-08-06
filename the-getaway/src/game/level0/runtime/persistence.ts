import {
  LEVEL0_CONTENT_VERSIONS,
  LEVEL0_RUN_SCHEMA_VERSION,
  LEVEL0_RUNTIME_CONTENT_VERSION,
  normalizeLevel0RunForHydration,
} from './safehouse';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import { isLevel0PlayerAppearanceId } from '../../../content/characters/spriteManifest';
import { isPointWalkableWithClearance } from '../layout/validator';
import type { WorldPoint } from '../layout/types';
import {
  ATTRIBUTE_KEYS,
  LEVEL0_ATTRIBUTE_CREATION_BUDGET,
  LEVEL0_ATTRIBUTE_CREATION_CAP,
  LEVEL0_LONG_TERM_CAP,
  LEVEL0_SKILL_CREATION_BUDGET,
  LEVEL0_SKILL_CREATION_CAP,
  SKILL_KEYS,
  isValidLevel0Callsign,
} from '../rpg/creation';
import {
  LEVEL0_CHECK_CATALOG,
  createLevel0CheckAttemptKey,
  resolveLevel0Check,
} from '../rpg/checks';
import { LEVEL0_PROVISIONAL_PROGRESSION } from '../rpg/progression';
import type {
  ContactState,
  Level0DeadlineRequirement,
  Level0RunState,
  PauseOwner,
  PlayerBuild,
  RetrySnapshot,
} from './types';

export const LEVEL0_AUTOSAVE_KEY = 'the-getaway-level0-autosave-v1';
export const LEVEL0_RETRY_KEY = 'the-getaway-level0-retry-v1';

export interface Level0PersistenceEnvelope<T> {
  kind: 'autosave' | 'retry';
  schemaVersion: number;
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
  | { status: 'conflict'; reason: 'retry-payload' | 'retry-session' | 'retry-state' };

const CONTACT_KEYS = ['lira', 'naila', 'brant'] as const;
const PAUSE_OWNERS: PauseOwner[] = [
  'menu',
  'bible',
  'settings',
  'character_creation',
  'character',
  'dossier',
  'social_feed',
  'dialogue',
  'observation',
  'terminal',
  'safehouse_action',
  'george_consultation',
  'interception',
  'retry_confirmation',
  'level_up',
  'debrief',
  'mission_recap',
  'failure',
  'completion',
];
const MISSION_STATES = new Set([
  'L0_CHARACTER_CREATION',
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
const OBJECTIVE_STATUSES = new Set([
  'hidden', 'available', 'active', 'completed', 'failed', 'superseded',
]);
const OBJECTIVE_PRECISION = new Set(['hidden', 'district', 'area', 'entrance', 'exact']);
const DEADLINE_REQUIREMENTS = new Set<Level0DeadlineRequirement>([
  'medkits-returned', 'transit-validated',
]);
const RUN_KEYS = [
  'schemaVersion',
  'contentVersions',
  'sessionId',
  'identity',
  'build',
  'rpg',
  'health',
  'paranoia',
  'worldClock',
  'mission',
  'objectives',
  'facts',
  'mapKnowledge',
  'contacts',
  'safehouse',
  'surveillance',
  'player',
  'runtimeGeneration',
  'completion',
  'failureCause',
  'failureSourceId',
  'failureMissingRequirements',
] as const;
const RETRY_KEYS = [
  ...RUN_KEYS.filter((key) =>
    key !== 'failureCause' && key !== 'failureSourceId' && key !== 'failureMissingRequirements'
  ),
  'createdAtWorldMinute',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isIntegerInRange = (value: unknown, minimum: number, maximum = Number.MAX_SAFE_INTEGER) =>
  Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;

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

const isUniqueStringArray = (value: unknown, allowEmpty = true): value is string[] =>
  Array.isArray(value) &&
  (allowEmpty || value.length > 0) &&
  value.every((entry) => typeof entry === 'string' && entry.length > 0) &&
  new Set(value).size === value.length;

const isWorldPoint = (value: unknown): value is WorldPoint =>
  isRecord(value) && hasExactKeys(value, ['x', 'y']) && isFiniteNumber(value.x) && isFiniteNumber(value.y);

const isWalkableWorldPoint = (value: unknown): boolean =>
  isWorldPoint(value) && isPointWalkableWithClearance(LEVEL0_LAYOUT_CONTRACT, value);

const isNormalizedFacing = (value: unknown): boolean => {
  if (!isWorldPoint(value)) return false;
  const length = Math.hypot(value.x, value.y);
  return Number.isFinite(length) && length > 0.000001 && Math.abs(length - 1) <= 0.001;
};

const hasCurrentContentVersions = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ['layout', 'runtime']) &&
  value.layout === LEVEL0_CONTENT_VERSIONS.layout &&
  value.runtime === LEVEL0_CONTENT_VERSIONS.runtime;

const expectedClockPhase = (minute: number) =>
  minute >= 22 * 60 ? 'curfew' : minute >= 20 * 60 ? 'blue-hour' : 'dusk';

const expectedProcessedBoundaries = (minute: number): string[] => {
  const ids: string[] = [];
  if (minute >= 20 * 60) ids.push('clock.blue_hour');
  if (minute >= 22 * 60) ids.push('clock.curfew');
  if (minute >= 24 * 60) ids.push('clock.deadline');
  return ids;
};

const isWorldClock = (value: unknown): boolean => {
  if (!isRecord(value) || !isFiniteNumber(value.currentMinute)) return false;
  const minute = value.currentMinute;
  const processed = expectedProcessedBoundaries(minute);
  const expectedLast = processed[processed.length - 1];
  return (
    hasAllowedKeys(value, [
      'currentWorldMillisecond',
      'currentMinute',
      'phase',
      'curfewActive',
      'deadlineReached',
      'processedBoundaryIds',
      'pauseOwners',
      'scheduleStates',
    ], ['lastProcessedScheduleBoundaryId']) &&
    minute >= 0 &&
    minute <= 24 * 60 &&
    isFiniteNumber(value.currentWorldMillisecond) &&
    Math.abs(value.currentWorldMillisecond - minute * 60_000) < 0.001 &&
    value.phase === expectedClockPhase(minute) &&
    value.curfewActive === (minute >= 22 * 60) &&
    value.deadlineReached === (minute >= 24 * 60) &&
    isUniqueStringArray(value.processedBoundaryIds) &&
    JSON.stringify(value.processedBoundaryIds) === JSON.stringify(processed) &&
    (value.lastProcessedScheduleBoundaryId === undefined ||
      value.lastProcessedScheduleBoundaryId === expectedLast) &&
    (expectedLast === undefined || value.lastProcessedScheduleBoundaryId === expectedLast) &&
    isUniqueStringArray(value.pauseOwners) &&
    value.pauseOwners.every((owner) => PAUSE_OWNERS.includes(owner as PauseOwner)) &&
    isRecord(value.scheduleStates) &&
    value.scheduleStates.lighting === expectedClockPhase(minute) &&
    value.scheduleStates.publicActivity === (minute >= 22 * 60 ? 'curfew' : 'active') &&
    Object.values(value.scheduleStates).every((entry) => typeof entry === 'string')
  );
};

const isSafehouseState = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, [
    'insideBoundary',
    'departureSnapshotCreated',
    'recoveryAvailable',
    'transitCredentialState',
    'debriefAvailable',
    'usedActionIds',
  ]) &&
  typeof value.insideBoundary === 'boolean' &&
  typeof value.departureSnapshotCreated === 'boolean' &&
  typeof value.recoveryAvailable === 'boolean' &&
  ['not-issued', 'issued', 'validated'].includes(String(value.transitCredentialState)) &&
  typeof value.debriefAvailable === 'boolean' &&
  isUniqueStringArray(value.usedActionIds);

const isSurveillanceState = (value: unknown): boolean =>
  isRecord(value) &&
  hasAllowedKeys(value, ['level', 'directlyObserved'], ['sourceDeviceId', 'lastKnownPosition']) &&
  ['clear', 'suspicious', 'pursuit'].includes(String(value.level)) &&
  typeof value.directlyObserved === 'boolean' &&
  (value.sourceDeviceId === undefined || typeof value.sourceDeviceId === 'string') &&
  (value.lastKnownPosition === undefined || isWalkableWorldPoint(value.lastKnownPosition));

const isPlayerCheckpoint = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['position', 'facing']) &&
  isWalkableWorldPoint(value.position) && isNormalizedFacing(value.facing);

const isCompletion = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['medkitsReturned', 'transitValidated']) &&
  typeof value.medkitsReturned === 'boolean' &&
  typeof value.transitValidated === 'boolean';

const isIdentity = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['callsign', 'appearancePresetId']) &&
  isValidLevel0Callsign(value.callsign) &&
  isLevel0PlayerAppearanceId(value.appearancePresetId);

const isBuild = (value: unknown): value is PlayerBuild => {
  if (!isRecord(value) || !isRecord(value.attributes) || !isRecord(value.skills)) return false;
  const attributes = value.attributes;
  const skills = value.skills;
  return (
    hasExactKeys(value, [
      'attributes', 'skills', 'level', 'xp', 'unspentSkillPoints', 'unspentAttributePoints',
    ]) &&
    hasExactKeys(attributes, ATTRIBUTE_KEYS) &&
    ATTRIBUTE_KEYS.every((key) => isIntegerInRange(attributes[key], 1, LEVEL0_LONG_TERM_CAP)) &&
    hasExactKeys(skills, SKILL_KEYS) &&
    SKILL_KEYS.every((key) => isIntegerInRange(skills[key], 0, LEVEL0_LONG_TERM_CAP)) &&
    isIntegerInRange(value.level, 1) &&
    isIntegerInRange(value.xp, 0) &&
    isIntegerInRange(value.unspentSkillPoints, 0) &&
    isIntegerInRange(value.unspentAttributePoints, 0)
  );
};

const isStringId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const CHECK_RESOLUTION_KEYS = [
  'resolutionId',
  'attemptKey',
  'checkId',
  'paranoiaValue',
  'knownFactIds',
  'activeContextIds',
  'attribute',
  'attributeValue',
  'skill',
  'skillValue',
  'paranoiaPenalty',
  'appliedFactIds',
  'appliedModifiers',
  'guaranteedByFactId',
  'baseRequiredTotal',
  'effectiveRequiredTotal',
  'finalTotal',
  'outcome',
  'successEffectIds',
  'failForwardEffectIds',
  'resolvedAtWorldMinute',
] as const;

const CHECK_RESULT_KEYS = [
  'checkId',
  'attribute',
  'attributeValue',
  'skill',
  'skillValue',
  'paranoiaPenalty',
  'appliedFactIds',
  'appliedModifiers',
  'guaranteedByFactId',
  'baseRequiredTotal',
  'effectiveRequiredTotal',
  'finalTotal',
  'outcome',
  'successEffectIds',
  'failForwardEffectIds',
] as const;

const isAuthoredModifier = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, ['id', 'amount', 'requiredContextId', 'localizedReasonKey']) &&
  isStringId(value.id) &&
  isFiniteNumber(value.amount) &&
  isStringId(value.requiredContextId) &&
  isStringId(value.localizedReasonKey);

const isCommittedCheckResolution = (
  key: string,
  value: unknown,
  currentWorldMinute: number,
  currentBuild: PlayerBuild,
  currentKnownFactIds: string[]
): boolean => {
  if (!isRecord(value) || !hasExactKeys(value, CHECK_RESOLUTION_KEYS)) return false;
  const catalogEntry = typeof value.checkId === 'string'
    ? LEVEL0_CHECK_CATALOG[value.checkId]
    : undefined;
  if (!catalogEntry || value.resolutionId !== key || !isStringId(value.attemptKey)) return false;
  if (!isIntegerInRange(value.paranoiaValue, 0, 100) ||
    !isUniqueStringArray(value.knownFactIds) ||
    !(value.knownFactIds as string[]).every((factId) => currentKnownFactIds.includes(factId)) ||
    !isUniqueStringArray(value.activeContextIds)) return false;
  if (!ATTRIBUTE_KEYS.includes(value.attribute as typeof ATTRIBUTE_KEYS[number]) ||
    !SKILL_KEYS.includes(value.skill as typeof SKILL_KEYS[number])) return false;
  if (value.attribute !== catalogEntry.attribute || value.skill !== catalogEntry.skill) return false;
  if (!isIntegerInRange(value.attributeValue, 1, LEVEL0_LONG_TERM_CAP) ||
    !isIntegerInRange(value.skillValue, 0, LEVEL0_LONG_TERM_CAP) ||
    ![0, 1, 2, 3].includes(Number(value.paranoiaPenalty)) ||
    !isUniqueStringArray(value.appliedFactIds) ||
    !Array.isArray(value.appliedModifiers) ||
    !value.appliedModifiers.every(isAuthoredModifier) ||
    !(value.guaranteedByFactId === null || isStringId(value.guaranteedByFactId)) ||
    !isFiniteNumber(value.baseRequiredTotal) ||
    !isFiniteNumber(value.effectiveRequiredTotal) ||
    !isFiniteNumber(value.finalTotal) ||
    !['success', 'fail-forward', 'fatal'].includes(String(value.outcome)) ||
    !isUniqueStringArray(value.successEffectIds, false) ||
    !isUniqueStringArray(value.failForwardEffectIds, false) ||
    !isFiniteNumber(value.resolvedAtWorldMinute) || value.resolvedAtWorldMinute < 0 ||
    value.resolvedAtWorldMinute > currentWorldMinute) return false;

  const historicalBuild: PlayerBuild = {
    ...currentBuild,
    attributes: {
      ...currentBuild.attributes,
      [catalogEntry.attribute]: Number(value.attributeValue),
    },
    skills: {
      ...currentBuild.skills,
      [catalogEntry.skill]: Number(value.skillValue),
    },
  };
  const expected = resolveLevel0Check({
    requirement: catalogEntry,
    build: historicalBuild,
    paranoia: Number(value.paranoiaValue),
    knownFactIds: value.knownFactIds as string[],
    activeContextIds: value.activeContextIds as string[],
  });
  return value.attemptKey === createLevel0CheckAttemptKey(
    value.checkId as string,
    value.activeContextIds as string[]
  ) && JSON.stringify(CHECK_RESULT_KEYS.map((resultKey) => value[resultKey])) ===
    JSON.stringify(CHECK_RESULT_KEYS.map((resultKey) => expected[resultKey]));
};

const isResourceEvents = (
  value: unknown,
  currentWorldMinute: number,
  expectedHealth: number,
  expectedParanoia: number
): { valid: boolean; announcedPenalties: number[] } => {
  if (!Array.isArray(value)) return { valid: false, announcedPenalties: [] };
  const ids = new Set<string>();
  let health = 100;
  let paranoia = 0;
  const announcedPenalties: number[] = [];
  const penaltyFor = (amount: number) => amount >= 90 ? 3 : amount >= 70 ? 2 : amount >= 40 ? 1 : 0;

  for (const event of value) {
    if (!isRecord(event) || !hasExactKeys(event, [
      'eventId', 'resource', 'sourceId', 'amount', 'before', 'after', 'worldMinute',
      'feedbackId', 'retryTreatment', 'crossedParanoiaPenalties',
    ]) || !isStringId(event.eventId) || ids.has(event.eventId) ||
      !['health', 'paranoia'].includes(String(event.resource)) ||
      !isStringId(event.sourceId) || !isStringId(event.feedbackId) ||
      !isFiniteNumber(event.amount) || !Number.isInteger(event.amount) || event.amount === 0 ||
      !isIntegerInRange(event.before, 0, 100) || !isIntegerInRange(event.after, 0, 100) ||
      Number(event.after) - Number(event.before) !== event.amount ||
      !isFiniteNumber(event.worldMinute) || event.worldMinute > currentWorldMinute ||
      !['captured-at-departure', 'discard-on-retry'].includes(String(event.retryTreatment)) ||
      !Array.isArray(event.crossedParanoiaPenalties) ||
      new Set(event.crossedParanoiaPenalties).size !== event.crossedParanoiaPenalties.length ||
      !(event.crossedParanoiaPenalties as unknown[]).every((penalty) =>
        typeof penalty === 'number' && Number.isInteger(penalty) && [1, 2, 3].includes(penalty)
      )) {
      return { valid: false, announcedPenalties: [] };
    }
    ids.add(event.eventId);
    if (event.resource === 'health') {
      if ((event.crossedParanoiaPenalties as unknown[]).length !== 0) {
        return { valid: false, announcedPenalties: [] };
      }
      if (event.before !== health) return { valid: false, announcedPenalties: [] };
      health = Number(event.after);
    } else {
      if (event.before !== paranoia) return { valid: false, announcedPenalties: [] };
      const beforePenalty = penaltyFor(paranoia);
      paranoia = Number(event.after);
      const afterPenalty = penaltyFor(paranoia);
      const expectedCrossings = [1, 2, 3].filter(
        (penalty) => penalty > beforePenalty && penalty <= afterPenalty
      );
      if (JSON.stringify(event.crossedParanoiaPenalties) !== JSON.stringify(expectedCrossings)) {
        return { valid: false, announcedPenalties: [] };
      }
      for (let index = announcedPenalties.length - 1; index >= 0; index -= 1) {
        if (announcedPenalties[index]! > afterPenalty) announcedPenalties.splice(index, 1);
      }
      expectedCrossings.forEach((penalty) => {
        if (!announcedPenalties.includes(penalty)) announcedPenalties.push(penalty);
      });
    }
  }

  return {
    valid: health === expectedHealth && paranoia === expectedParanoia,
    announcedPenalties,
  };
};

const isXpLedger = (
  awardedMilestoneIds: unknown,
  xpEvents: unknown,
  build: PlayerBuild,
  currentWorldMinute: number
): boolean => {
  if (!isUniqueStringArray(awardedMilestoneIds) || !Array.isArray(xpEvents)) return false;
  let expectedXp = 0;
  const seen = new Set<string>();
  for (const event of xpEvents) {
    if (!isRecord(event) || !hasExactKeys(event, [
      'milestoneId', 'amount', 'before', 'after', 'worldMinute', 'feedbackId',
    ]) || !isStringId(event.milestoneId) || seen.has(event.milestoneId) ||
      !isIntegerInRange(event.amount, 1) || !isIntegerInRange(event.before, 0) ||
      !isIntegerInRange(event.after, 0) || event.before !== expectedXp ||
      Number(event.after) !== Number(event.before) + Number(event.amount) ||
      !isFiniteNumber(event.worldMinute) || event.worldMinute > currentWorldMinute ||
      !isStringId(event.feedbackId)) return false;
    const milestone = LEVEL0_PROVISIONAL_PROGRESSION.milestones[
      event.milestoneId as keyof typeof LEVEL0_PROVISIONAL_PROGRESSION.milestones
    ];
    if (!milestone || event.amount !== milestone.amount || event.feedbackId !== milestone.feedbackId) {
      return false;
    }
    seen.add(event.milestoneId);
    expectedXp = Number(event.after);
  }
  return expectedXp === build.xp &&
    JSON.stringify(awardedMilestoneIds) === JSON.stringify(xpEvents.map((event) => event.milestoneId));
};

const isAllocationLedger = (
  value: unknown,
  build: PlayerBuild,
  currentWorldMinute: number
): boolean => {
  if (!Array.isArray(value)) return false;
  const attributes = build.attributes;
  const skills = build.skills;
  const ids = new Set<string>();
  const levelEvents: Array<Record<string, unknown>> = [];
  const skillEvents = new Map<string, Array<Record<string, unknown>>>();
  const attributeEvents = new Map<string, Array<Record<string, unknown>>>();

  for (const event of value) {
    if (!isRecord(event) || !isStringId(event.eventId) || ids.has(event.eventId) ||
      !['level', 'skill', 'attribute'].includes(String(event.kind)) ||
      !isIntegerInRange(event.before, 0) || !isIntegerInRange(event.after, 0) ||
      Number(event.after) !== Number(event.before) + 1 ||
      !isFiniteNumber(event.worldMinute) || event.worldMinute > currentWorldMinute) return false;
    ids.add(event.eventId);
    if (event.kind === 'level') {
      if (!hasExactKeys(event, ['eventId', 'kind', 'before', 'after', 'worldMinute'])) return false;
      levelEvents.push(event);
    } else {
      if (!hasExactKeys(event, ['eventId', 'kind', 'key', 'before', 'after', 'worldMinute']) ||
        !isStringId(event.key)) return false;
      const target = event.kind === 'skill' ? skillEvents : attributeEvents;
      const allowed = event.kind === 'skill' ? SKILL_KEYS : ATTRIBUTE_KEYS;
      if (!allowed.includes(event.key as never)) return false;
      target.set(event.key, [...(target.get(event.key) ?? []), event]);
    }
  }

  let expectedLevel = 1;
  for (const event of levelEvents) {
    if (event.before !== expectedLevel || event.after !== expectedLevel + 1) return false;
    expectedLevel += 1;
  }
  if (expectedLevel !== build.level) return false;

  for (const key of SKILL_KEYS) {
    const events = skillEvents.get(key) ?? [];
    let expected = Number(skills[key]) - events.length;
    if (!isIntegerInRange(expected, 0, LEVEL0_SKILL_CREATION_CAP)) return false;
    for (const event of events) {
      if (event.before !== expected || event.after !== expected + 1) return false;
      expected += 1;
    }
  }
  for (const key of ATTRIBUTE_KEYS) {
    const events = attributeEvents.get(key) ?? [];
    let expected = Number(attributes[key]) - events.length;
    if (!isIntegerInRange(expected, 1, LEVEL0_ATTRIBUTE_CREATION_CAP)) return false;
    for (const event of events) {
      if (event.before !== expected || event.after !== expected + 1) return false;
      expected += 1;
    }
  }

  const skillPool = SKILL_KEYS.reduce((sum, key) => sum + Number(skills[key]), 0) +
    Number(build.unspentSkillPoints);
  const attributePool = ATTRIBUTE_KEYS.reduce(
    (sum, key) => sum + Number(attributes[key]) - 1,
    0
  ) + Number(build.unspentAttributePoints);
  return skillPool === LEVEL0_SKILL_CREATION_BUDGET + (Number(build.level) - 1) * 2 &&
    attributePool === LEVEL0_ATTRIBUTE_CREATION_BUDGET + Math.floor(Number(build.level) / 3);
};

const isRpgLedger = (
  value: unknown,
  buildValue: PlayerBuild,
  health: number,
  paranoia: number,
  currentWorldMinute: number,
  currentKnownFactIds: string[]
): boolean => {
  if (!isRecord(value) || !hasExactKeys(value, [
    'resolvedChecks',
    'resourceEvents',
    'announcedParanoiaPenalties',
    'awardedMilestoneIds',
    'xpEvents',
    'pendingLevelUps',
    'allocationEvents',
  ]) || !isRecord(value.resolvedChecks)) return false;
  const resolvedChecks = Object.entries(value.resolvedChecks);
  if (!resolvedChecks.every(([key, resolution]) =>
    isCommittedCheckResolution(
      key,
      resolution,
      currentWorldMinute,
      buildValue,
      currentKnownFactIds
    )
  )) return false;
  const attemptKeys = resolvedChecks.map(([, resolution]) =>
    (resolution as Record<string, unknown>).attemptKey
  );
  if (new Set(attemptKeys).size !== attemptKeys.length) return false;

  const resourceValidation = isResourceEvents(
    value.resourceEvents,
    currentWorldMinute,
    health,
    paranoia
  );
  if (!resourceValidation.valid ||
    !Array.isArray(value.announcedParanoiaPenalties) ||
    JSON.stringify(value.announcedParanoiaPenalties) !==
      JSON.stringify(resourceValidation.announcedPenalties)) return false;
  if (!isXpLedger(value.awardedMilestoneIds, value.xpEvents, buildValue, currentWorldMinute) ||
    !isIntegerInRange(value.pendingLevelUps, 0) ||
    !isAllocationLedger(value.allocationEvents, buildValue, currentWorldMinute)) return false;

  const earnedLevelUps = Object.values(LEVEL0_PROVISIONAL_PROGRESSION.levelThresholds)
    .filter((threshold) => Number(buildValue.xp) >= threshold).length;
  return Number(value.pendingLevelUps) === earnedLevelUps - (Number(buildValue.level) - 1);
};

const isObjectives = (value: unknown): boolean =>
  isRecord(value) && Object.keys(value).length > 0 && Object.entries(value).every(([id, entry]) =>
    isRecord(entry) &&
    hasAllowedKeys(entry, ['objectiveId', 'status'], ['completedAtWorldMinute']) &&
    entry.objectiveId === id &&
    typeof entry.status === 'string' && OBJECTIVE_STATUSES.has(entry.status) &&
    (entry.completedAtWorldMinute === undefined || isFiniteNumber(entry.completedAtWorldMinute))
  );

const isFactLedger = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, ['known']) && isRecord(value.known) &&
  Object.entries(value.known).every(([id, fact]) =>
    isRecord(fact) && hasExactKeys(fact, ['factId', 'acquisitionIds']) &&
    fact.factId === id && isUniqueStringArray(fact.acquisitionIds, false)
  );

const isMapKnowledge = (value: unknown): boolean => {
  if (!isRecord(value) || !hasExactKeys(value, [
    'discoveredLocationIds',
    'discoveredCameraIds',
    'discoveredTerminalIds',
    'discoveredHidingContextIds',
    'discoveredBlendingContextIds',
    'objectivePrecision',
  ])) return false;
  return (
    isUniqueStringArray(value.discoveredLocationIds, false) &&
    isUniqueStringArray(value.discoveredCameraIds) &&
    isUniqueStringArray(value.discoveredTerminalIds, false) &&
    isUniqueStringArray(value.discoveredHidingContextIds) &&
    isUniqueStringArray(value.discoveredBlendingContextIds) &&
    isRecord(value.objectivePrecision) && Object.keys(value.objectivePrecision).length > 0 &&
    Object.values(value.objectivePrecision).every((entry) =>
      typeof entry === 'string' && OBJECTIVE_PRECISION.has(entry)
    )
  );
};

const isContact = (value: unknown): value is ContactState =>
  isRecord(value) &&
  hasAllowedKeys(value, ['consulted', 'acquiredFactIds'], ['lastDialogueNodeId']) &&
  typeof value.consulted === 'boolean' &&
  (value.lastDialogueNodeId === undefined || typeof value.lastDialogueNodeId === 'string') &&
  isUniqueStringArray(value.acquiredFactIds);

const isContacts = (value: unknown): boolean =>
  isRecord(value) && hasExactKeys(value, CONTACT_KEYS) && CONTACT_KEYS.every((key) => isContact(value[key]));

const isRuntimeGeneration = (value: unknown, sessionId: string): boolean =>
  isRecord(value) && hasExactKeys(value, ['generationVersion', 'seed', 'authoredVariantIds']) &&
  value.generationVersion === LEVEL0_RUNTIME_CONTENT_VERSION &&
  value.seed === `level0:${sessionId}` &&
  isRecord(value.authoredVariantIds) &&
  hasExactKeys(value.authoredVariantIds, ['layout']) &&
  value.authoredVariantIds.layout === LEVEL0_LAYOUT_CONTRACT.id;

const hasSharedRunFields = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  const sessionId = value.sessionId;
  if (!isBuild(value.build) || !isFactLedger(value.facts)) return false;
  const knownFactIds = Object.keys(
    (value.facts as { known: Record<string, unknown> }).known
  );
  return (
    value.schemaVersion === LEVEL0_RUN_SCHEMA_VERSION &&
    hasCurrentContentVersions(value.contentVersions) &&
    typeof sessionId === 'string' && sessionId.length > 0 &&
    isIdentity(value.identity) &&
    isFiniteNumber(value.health) && value.health >= 0 && value.health <= 100 &&
    isFiniteNumber(value.paranoia) && value.paranoia >= 0 && value.paranoia <= 100 &&
    isWorldClock(value.worldClock) &&
    isRpgLedger(
      value.rpg,
      value.build,
      Number(value.health),
      Number(value.paranoia),
      Number((value.worldClock as Record<string, unknown>).currentMinute),
      knownFactIds
    ) &&
    typeof value.mission === 'string' && MISSION_STATES.has(value.mission) &&
    isObjectives(value.objectives) &&
    isMapKnowledge(value.mapKnowledge) &&
    isContacts(value.contacts) &&
    isSafehouseState(value.safehouse) &&
    isSurveillanceState(value.surveillance) &&
    isPlayerCheckpoint(value.player) &&
    isRuntimeGeneration(value.runtimeGeneration, sessionId) &&
    isCompletion(value.completion)
  );
};

const isDeadlineRequirements = (value: unknown, allowEmpty: boolean): value is Level0DeadlineRequirement[] =>
  isUniqueStringArray(value, allowEmpty) &&
  value.every((requirement) => DEADLINE_REQUIREMENTS.has(requirement as Level0DeadlineRequirement));

const getExpectedDeadlineRequirements = (
  completion: Level0RunState['completion']
): Level0DeadlineRequirement[] => {
  const missing: Level0DeadlineRequirement[] = [];
  if (!completion.medkitsReturned) missing.push('medkits-returned');
  if (!completion.transitValidated) missing.push('transit-validated');
  return missing;
};

const isLevel0RunState = (value: unknown): value is Level0RunState => {
  if (!hasSharedRunFields(value) || !isRecord(value) || !hasExactKeys(value, RUN_KEYS)) return false;
  const failed = value.mission === 'L0_FAILED';
  const clock = value.worldClock as Level0RunState['worldClock'];
  const completion = value.completion as Level0RunState['completion'];
  const expectedMissing = getExpectedDeadlineRequirements(completion);
  const deadlineIncomplete = clock.deadlineReached &&
    (!completion.medkitsReturned || !completion.transitValidated);
  if (!isDeadlineRequirements(value.failureMissingRequirements, true)) return false;
  if ((value.health === 0 && value.failureCause !== 'failure.health') ||
    (value.paranoia === 100 && value.failureCause !== 'failure.paranoia')) {
    return false;
  }
  if (!failed) {
    return value.failureCause === null &&
      value.failureSourceId === null &&
      value.failureMissingRequirements.length === 0 &&
      !deadlineIncomplete;
  }
  if ((clock.pauseOwners.length > 0 && !clock.pauseOwners.includes('failure')) ||
    !isStringId(value.failureSourceId)) return false;
  if (value.failureCause === 'failure.deadline') {
    return value.failureSourceId === 'clock.deadline' &&
      value.failureMissingRequirements.length > 0 &&
      JSON.stringify(value.failureMissingRequirements) === JSON.stringify(expectedMissing) &&
      clock.deadlineReached;
  }
  if (value.failureMissingRequirements.length !== 0) return false;
  if (value.failureCause === 'failure.health') {
    const events = (value.rpg as Level0RunState['rpg']).resourceEvents;
    const finalHealthEvent = [...events].reverse().find((event) => event.resource === 'health');
    return value.health === 0 && finalHealthEvent?.sourceId === value.failureSourceId;
  }
  if (value.failureCause === 'failure.paranoia') {
    const events = (value.rpg as Level0RunState['rpg']).resourceEvents;
    const finalParanoiaEvent = [...events].reverse().find((event) => event.resource === 'paranoia');
    return value.paranoia === 100 && finalParanoiaEvent?.sourceId === value.failureSourceId;
  }
  return value.failureCause === 'failure.capture';
};

const isRetrySnapshot = (value: unknown): value is RetrySnapshot => {
  if (!hasSharedRunFields(value) || !isRecord(value) || !hasExactKeys(value, RETRY_KEYS)) {
    return false;
  }
  const departureAnchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
    (anchor) => anchor.id === 'safehouse.departure'
  );
  const position = (value.player as Level0RunState['player']).position;
  return (
    value.mission === 'L0_OPERATION_DEPARTED' &&
    isFiniteNumber(value.createdAtWorldMinute) &&
    value.createdAtWorldMinute === (value.worldClock as Record<string, unknown>).currentMinute &&
    (value.safehouse as Record<string, unknown>).departureSnapshotCreated === true &&
    departureAnchor !== undefined &&
    Math.hypot(
      position.x - departureAnchor.position.x,
      position.y - departureAnchor.position.y
    ) <= 0.0001
  );
};

const normalizeRetrySnapshot = (snapshot: RetrySnapshot): RetrySnapshot => ({
  ...JSON.parse(JSON.stringify(snapshot)) as RetrySnapshot,
  worldClock: {
    ...JSON.parse(JSON.stringify(snapshot.worldClock)) as RetrySnapshot['worldClock'],
    pauseOwners: [],
  },
});

const projectRetrySnapshotFromRun = (run: Level0RunState): RetrySnapshot => ({
  schemaVersion: run.schemaVersion,
  contentVersions: run.contentVersions,
  sessionId: run.sessionId,
  createdAtWorldMinute: run.worldClock.currentMinute,
  identity: run.identity,
  build: run.build,
  rpg: run.rpg,
  health: run.health,
  paranoia: run.paranoia,
  worldClock: run.worldClock,
  mission: run.mission,
  objectives: run.objectives,
  facts: run.facts,
  mapKnowledge: run.mapKnowledge,
  contacts: run.contacts,
  safehouse: run.safehouse,
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
  if (!payloadGuard(parsed.payload)) {
    return { status: 'incompatible', reason: 'payload' };
  }
  return {
    status: 'compatible',
    envelope: {
      ...(parsed as unknown as Level0PersistenceEnvelope<T>),
      payload: normalize(parsed.payload),
    },
  };
};

const createEnvelope = <T>(
  kind: Level0PersistenceEnvelope<T>['kind'],
  payload: T,
  timestamp: number
): Level0PersistenceEnvelope<T> => ({
  kind,
  schemaVersion: LEVEL0_RUN_SCHEMA_VERSION,
  contentVersions: { ...LEVEL0_CONTENT_VERSIONS },
  timestamp,
  payload,
});

const serializedEnvelope = <T>(
  kind: Level0PersistenceEnvelope<T>['kind'],
  payload: T,
  timestamp: number
) => JSON.stringify(createEnvelope(kind, payload, timestamp));

export const decodeLevel0Autosave = (raw: string | null): DecodeResult<Level0RunState> =>
  decodeEnvelope(
    raw,
    'autosave',
    isLevel0RunState,
    normalizeLevel0RunForHydration
  );

export const writeLevel0Autosave = (
  storage: Storage,
  run: Level0RunState,
  timestamp = Date.now()
): void => {
  if (!isLevel0RunState(run)) {
    throw new Error('Refusing to persist an invalid Level 0 autosave payload');
  }
  const normalized = normalizeLevel0RunForHydration(run);
  storage.setItem(LEVEL0_AUTOSAVE_KEY, serializedEnvelope('autosave', normalized, timestamp));
};

export const writeLevel0DepartureTransaction = (
  storage: Storage,
  departedRun: Level0RunState,
  snapshot: RetrySnapshot,
  timestamp = Date.now()
): DepartureTransactionResult => {
  if (!isLevel0RunState(departedRun) || !isRetrySnapshot(snapshot)) {
    throw new Error('Refusing to persist an invalid Level 0 departure transaction');
  }
  if (departedRun.sessionId !== snapshot.sessionId) {
    return { status: 'conflict', reason: 'retry-session' };
  }

  const normalizedRun = normalizeLevel0RunForHydration(departedRun);
  const normalizedSnapshot = normalizeRetrySnapshot(snapshot);
  const expectedSnapshot = normalizeRetrySnapshot(projectRetrySnapshotFromRun(normalizedRun));
  if (JSON.stringify(normalizedSnapshot) !== JSON.stringify(expectedSnapshot)) {
    return { status: 'conflict', reason: 'retry-state' };
  }
  const existingBytes = storage.getItem(LEVEL0_RETRY_KEY);
  let wroteRetry = false;
  let status: DepartureTransactionResult['status'] = 'written';

  if (existingBytes !== null) {
    const existing = decodeEnvelope(
      existingBytes,
      'retry',
      isRetrySnapshot,
      normalizeRetrySnapshot
    );
    if (existing.status !== 'compatible') {
      return { status: 'conflict', reason: 'retry-payload' };
    }
    if (existing.envelope.payload.sessionId !== normalizedSnapshot.sessionId) {
      return { status: 'conflict', reason: 'retry-session' };
    }
    if (JSON.stringify(existing.envelope.payload) !== JSON.stringify(normalizedSnapshot)) {
      return { status: 'conflict', reason: 'retry-state' };
    }
    status = 'reused';
  } else {
    storage.setItem(
      LEVEL0_RETRY_KEY,
      serializedEnvelope('retry', normalizedSnapshot, timestamp)
    );
    wroteRetry = true;
  }

  try {
    storage.setItem(
      LEVEL0_AUTOSAVE_KEY,
      serializedEnvelope('autosave', normalizedRun, timestamp)
    );
  } catch (error) {
    if (wroteRetry) storage.removeItem(LEVEL0_RETRY_KEY);
    throw error;
  }
  return { status };
};

export const readLevel0Retry = (storage: Storage): DecodeResult<RetrySnapshot> =>
  decodeEnvelope(
    storage.getItem(LEVEL0_RETRY_KEY),
    'retry',
    isRetrySnapshot,
    normalizeRetrySnapshot
  );

export const readLevel0Autosave = (storage: Storage): DecodeResult<Level0RunState> =>
  decodeLevel0Autosave(storage.getItem(LEVEL0_AUTOSAVE_KEY));

export const clearLevel0Persistence = (storage: Storage): void => {
  storage.removeItem(LEVEL0_AUTOSAVE_KEY);
  storage.removeItem(LEVEL0_RETRY_KEY);
};
