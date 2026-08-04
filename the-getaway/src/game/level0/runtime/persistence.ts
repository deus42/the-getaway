import {
  LEVEL0_CONTENT_VERSIONS,
  LEVEL0_RUN_SCHEMA_VERSION,
  LEVEL0_RUNTIME_CONTENT_VERSION,
  normalizeLevel0RunForHydration,
} from './safehouse';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import {
  LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID,
  isLevel0PlayerAppearanceId,
} from '../../../content/characters/spriteManifest';
import { isPointWalkableWithClearance } from '../layout/validator';
import type { WorldPoint } from '../layout/types';
import type {
  AttributeKey,
  ContactState,
  Level0DeadlineRequirement,
  Level0RunState,
  PauseOwner,
  RetrySnapshot,
  SkillKey,
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

const ATTRIBUTE_KEYS: AttributeKey[] = ['physical', 'mental', 'social', 'technical'];
const SKILL_KEYS: SkillKey[] = [
  'stealth',
  'evasion',
  'awareness',
  'composure',
  'insight',
  'influence',
  'systems',
  'opsec',
];
const CONTACT_KEYS = ['lira', 'naila', 'brant'] as const;
const PAUSE_OWNERS: PauseOwner[] = [
  'menu',
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
  'failureMissingRequirements',
] as const;
const RETRY_KEYS = [
  ...RUN_KEYS.filter((key) => key !== 'failureCause' && key !== 'failureMissingRequirements'),
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
  typeof value.callsign === 'string' &&
  isLevel0PlayerAppearanceId(value.appearancePresetId);

const migrateRetiredAppearanceIdentity = (payload: unknown): unknown => {
  if (!isRecord(payload) || !isRecord(payload.identity)) return payload;
  if (payload.identity.appearancePresetId !== 'provisional-runtime-silhouette') return payload;
  return {
    ...payload,
    identity: {
      ...payload.identity,
      appearancePresetId: LEVEL0_DEFAULT_PLAYER_APPEARANCE_ID,
    },
  };
};

const isBuild = (value: unknown): boolean => {
  if (!isRecord(value) || !isRecord(value.attributes) || !isRecord(value.skills)) return false;
  const attributes = value.attributes;
  const skills = value.skills;
  return (
    hasExactKeys(value, [
      'attributes', 'skills', 'level', 'xp', 'unspentSkillPoints', 'unspentAttributePoints',
    ]) &&
    hasExactKeys(attributes, ATTRIBUTE_KEYS) &&
    ATTRIBUTE_KEYS.every((key) => isIntegerInRange(attributes[key], 1, 5)) &&
    hasExactKeys(skills, SKILL_KEYS) &&
    SKILL_KEYS.every((key) => isIntegerInRange(skills[key], 0, 5)) &&
    isIntegerInRange(value.level, 1) &&
    isIntegerInRange(value.xp, 0) &&
    isIntegerInRange(value.unspentSkillPoints, 0) &&
    isIntegerInRange(value.unspentAttributePoints, 0)
  );
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
  return (
    value.schemaVersion === LEVEL0_RUN_SCHEMA_VERSION &&
    hasCurrentContentVersions(value.contentVersions) &&
    typeof sessionId === 'string' && sessionId.length > 0 &&
    isIdentity(value.identity) &&
    isBuild(value.build) &&
    isFiniteNumber(value.health) && value.health >= 0 && value.health <= 100 &&
    isFiniteNumber(value.paranoia) && value.paranoia >= 0 && value.paranoia <= 100 &&
    isWorldClock(value.worldClock) &&
    typeof value.mission === 'string' && MISSION_STATES.has(value.mission) &&
    isObjectives(value.objectives) &&
    isFactLedger(value.facts) &&
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
  return (
    (value.failureCause === null || value.failureCause === 'failure.deadline') &&
    isDeadlineRequirements(value.failureMissingRequirements, !failed) &&
    (failed
      ? value.failureCause === 'failure.deadline' &&
        value.failureMissingRequirements.length > 0 &&
        JSON.stringify(value.failureMissingRequirements) === JSON.stringify(expectedMissing) &&
        clock.deadlineReached
      : value.failureCause === null && value.failureMissingRequirements.length === 0) &&
    (!deadlineIncomplete || failed)
  );
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
  normalize: (payload: T) => T,
  preparePayload: (payload: unknown) => unknown = (payload) => payload
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
  const preparedPayload = preparePayload(parsed.payload);
  if (!payloadGuard(preparedPayload)) {
    return { status: 'incompatible', reason: 'payload' };
  }
  return {
    status: 'compatible',
    envelope: {
      ...(parsed as unknown as Level0PersistenceEnvelope<T>),
      payload: normalize(preparedPayload),
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
    normalizeLevel0RunForHydration,
    migrateRetiredAppearanceIdentity
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
      normalizeRetrySnapshot,
      migrateRetiredAppearanceIdentity
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
    normalizeRetrySnapshot,
    migrateRetiredAppearanceIdentity
  );

export const readLevel0Autosave = (storage: Storage): DecodeResult<Level0RunState> =>
  decodeLevel0Autosave(storage.getItem(LEVEL0_AUTOSAVE_KEY));

export const clearLevel0Persistence = (storage: Storage): void => {
  storage.removeItem(LEVEL0_AUTOSAVE_KEY);
  storage.removeItem(LEVEL0_RETRY_KEY);
};
