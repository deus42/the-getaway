export const PLAYTEST_PACKET_V1_SCHEMA = 'playtest_packet_v1' as const;
export const AI_GAMER_VERDICT_V2_SCHEMA = 'ai_gamer_verdict_v2' as const;
export const PLAYTEST_GATE_REPORT_V2_SCHEMA = 'playtest_gate_report_v2' as const;

export const PLAYTEST_VERBS = [
  'move',
  'observe',
  'interact',
  'choose',
  'useContext',
  'consultGeorge',
] as const;

export const PLAYTEST_CONTROLS = ['start', 'wait', 'restartAttempt'] as const;
export const PLAYTEST_COMPUTER_USE_ACTIONS = [
  'click',
  'press_key',
  'scroll',
  'drag',
] as const;
export const GATE_OUTCOMES = ['pass', 'fail', 'blocked'] as const;
export const PLAYTEST_EVIDENCE_CLASSES = [
  'live-guided',
  'deterministic-reachable',
  'fixture-only',
] as const;

export type PlaytestVerb = typeof PLAYTEST_VERBS[number];
export type PlaytestControl = typeof PLAYTEST_CONTROLS[number];
export type PlaytestComputerUseAction = typeof PLAYTEST_COMPUTER_USE_ACTIONS[number];
export type GateOutcome = typeof GATE_OUTCOMES[number];
export type PlaytestEvidenceClass = typeof PLAYTEST_EVIDENCE_CLASSES[number];

export type PlaytestCommand =
  | { kind: 'verb'; verb: PlaytestVerb }
  | { kind: 'control'; control: 'start' | 'restartAttempt' }
  | { kind: 'control'; control: 'wait'; durationMs: number };

export interface PlaytestPacketViewportV1 {
  width: number;
  height: number;
  deviceScaleFactor: number;
}

export type PlaytestPacketStartStateV1 =
  | { kind: 'new-game' }
  | { kind: 'checkpoint'; checkpointId: string; provenanceRef: string };

export interface PlaytestPacketPersonaV1 {
  id: string;
  brief: string;
}

export interface PlaytestPacketInvariantV1 {
  id: string;
  description: string;
}

export interface PlaytestPacketEvidenceRequirementsV1 {
  milestoneScreenshots: true;
  trace: true;
  console: true;
  pageErrors: true;
  network: true;
  workerTranscript: true;
  replayEvidence: boolean;
}

export interface PlaytestPacketComputerUsePolicyV1 {
  actionTools: PlaytestComputerUseAction[];
  keys: string[];
}

export interface PlaytestPacketV1 {
  schema: typeof PLAYTEST_PACKET_V1_SCHEMA;
  packetId: string;
  revision: number;
  ticket: string;
  mode: 'affected' | 'closeout';
  visibleGoal: string;
  startState: PlaytestPacketStartStateV1;
  viewport: PlaytestPacketViewportV1;
  locale: 'en' | 'uk';
  allowedVisibleInputs: string[];
  computerUsePolicy: PlaytestPacketComputerUsePolicyV1;
  playerPersonas: PlaytestPacketPersonaV1[];
  workerCount: 1 | 2;
  allowedVerbs: PlaytestVerb[];
  allowedControls: PlaytestControl[];
  requiredProbeIds: string[];
  requiredInvariants: PlaytestPacketInvariantV1[];
  evidenceRequirements: PlaytestPacketEvidenceRequirementsV1;
  reviewedAt: string;
}

export interface AiGamerModelProvenanceV2 {
  requested: 'gpt-5.6-sol';
  effective: string;
  reasoningEffort: 'high';
  codexVersion: string;
  catalogEvidenceRef: string;
  runtimeEvidenceRef: string;
}

export interface AiGamerWorkerProvenanceV2 {
  browserApp: string;
  marker: string;
  transcriptRef: string;
  transcriptSha256: string;
  integrityValid: boolean;
}

export interface AiGamerVerdictV2 {
  schema: typeof AI_GAMER_VERDICT_V2_SCHEMA;
  packetId: string;
  workerId: string;
  outcome: GateOutcome;
  evidenceClass: PlaytestEvidenceClass;
  visibleGoalMet: boolean;
  summary: string;
  evidenceRefs: string[];
  warnings: string[];
  model: AiGamerModelProvenanceV2;
  worker: AiGamerWorkerProvenanceV2;
}

export interface PlaytestGateProbeResultV2 {
  probeId: string;
  state: 'met' | 'unmet' | 'unavailable';
  acceptanceEligible: boolean;
  evidenceRefs: string[];
}

export interface PlaytestGateInvariantResultV2 {
  invariantId: string;
  state: 'met' | 'unmet' | 'unavailable';
  acceptanceEligible: boolean;
  evidenceRefs: string[];
}

export interface PlaytestGateProbeTimelineEntryV2 {
  capturedAt: string;
  probeId: string;
  from: 'met' | 'unmet' | 'unavailable';
  to: 'met' | 'unmet' | 'unavailable';
  evidenceRefs: string[];
}

export interface PlaytestGateFindingV2 {
  id: string;
  kind: 'regression' | 'warning' | 'blocker';
  title: string;
  summary: string;
  evidenceRefs: string[];
}

export interface PlaytestGateReportV2 {
  schema: typeof PLAYTEST_GATE_REPORT_V2_SCHEMA;
  runId: string;
  ticket: string;
  mode: 'affected' | 'closeout';
  packetId: string;
  packetRevision: number | null;
  packetSha256: string | null;
  packetEvidenceRef: string | null;
  outcome: GateOutcome;
  exitCode: 0 | 1 | 2 | 3;
  startedAt: string;
  completedAt: string;
  retention: 'concise' | 'diagnostic';
  verdicts: AiGamerVerdictV2[];
  probeResults: PlaytestGateProbeResultV2[];
  invariantEvidenceBasis: 'derived';
  invariantResults: PlaytestGateInvariantResultV2[];
  probeTimeline: PlaytestGateProbeTimelineEntryV2[];
  evidenceRefs: string[];
  warnings: string[];
  findings: PlaytestGateFindingV2[];
  quorum: {
    required: 1 | 2;
    valid: number;
    decidingWorkerIds: string[];
  };
}

export type PlaytestValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isNonEmptyString);

const isIsoDateTime = (value: unknown): value is string =>
  isNonEmptyString(value) && !Number.isNaN(Date.parse(value));

const isSha256 = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);

const hasExactKeys = (value: Record<string, unknown>, keys: string[]): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const isExactStringTuple = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  value.every((entry, index) => entry === expected[index]);

const includes = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && values.includes(value as T);

export const validatePlaytestCommand = (value: unknown): PlaytestValidationResult => {
  if (!isRecord(value)) return { ok: false, reason: 'invalid-command' };

  if (value.kind === 'verb') {
    return hasExactKeys(value, ['kind', 'verb']) && includes(PLAYTEST_VERBS, value.verb)
      ? { ok: true }
      : { ok: false, reason: 'unknown-or-legacy-verb' };
  }

  if (value.kind !== 'control' || !includes(PLAYTEST_CONTROLS, value.control)) {
    return { ok: false, reason: 'unknown-or-legacy-command' };
  }
  if (value.control === 'wait') {
    return hasExactKeys(value, ['kind', 'control', 'durationMs']) &&
      typeof value.durationMs === 'number' &&
      Number.isFinite(value.durationMs) &&
      value.durationMs >= 0 &&
      value.durationMs <= 60_000
      ? { ok: true }
      : { ok: false, reason: 'invalid-wait-control' };
  }
  return hasExactKeys(value, ['kind', 'control'])
    ? { ok: true }
    : { ok: false, reason: 'invalid-control' };
};

export const validatePlaytestPacketV1 = (value: unknown): PlaytestValidationResult => {
  if (!isRecord(value) || value.schema !== PLAYTEST_PACKET_V1_SCHEMA) {
    return { ok: false, reason: 'invalid-packet-schema' };
  }
  if (
    !isNonEmptyString(value.packetId) ||
    typeof value.revision !== 'number' ||
    !Number.isInteger(value.revision) ||
    value.revision < 1 ||
    typeof value.ticket !== 'string' ||
    !/^GET-\d+$/.test(value.ticket) ||
    !isNonEmptyString(value.visibleGoal) ||
    (value.mode !== 'affected' && value.mode !== 'closeout') ||
    (value.workerCount !== 1 && value.workerCount !== 2) ||
    !isRecord(value.startState) ||
    !isRecord(value.viewport) ||
    typeof value.viewport.width !== 'number' ||
    !Number.isInteger(value.viewport.width) ||
    value.viewport.width < 320 ||
    typeof value.viewport.height !== 'number' ||
    !Number.isInteger(value.viewport.height) ||
    value.viewport.height < 568 ||
    typeof value.viewport.deviceScaleFactor !== 'number' ||
    !Number.isFinite(value.viewport.deviceScaleFactor) ||
    value.viewport.deviceScaleFactor <= 0 ||
    (value.locale !== 'en' && value.locale !== 'uk') ||
    !isStringArray(value.allowedVisibleInputs) ||
    value.allowedVisibleInputs.length === 0 ||
    !isRecord(value.computerUsePolicy) ||
    !Array.isArray(value.computerUsePolicy.actionTools) ||
    value.computerUsePolicy.actionTools.length === 0 ||
    !value.computerUsePolicy.actionTools.every((tool) =>
      includes(PLAYTEST_COMPUTER_USE_ACTIONS, tool)
    ) ||
    !isStringArray(value.computerUsePolicy.keys) ||
    !Array.isArray(value.playerPersonas) ||
    !value.playerPersonas.every((persona) =>
      isRecord(persona) && isNonEmptyString(persona.id) && isNonEmptyString(persona.brief)
    ) ||
    !isExactStringTuple(value.allowedVerbs, PLAYTEST_VERBS) ||
    !isExactStringTuple(value.allowedControls, PLAYTEST_CONTROLS) ||
    !isStringArray(value.requiredProbeIds) ||
    value.requiredProbeIds.length === 0 ||
    !Array.isArray(value.requiredInvariants) ||
    !value.requiredInvariants.every((invariant) =>
      isRecord(invariant) && isNonEmptyString(invariant.id) && isNonEmptyString(invariant.description)
    ) ||
    !isRecord(value.evidenceRequirements) ||
    value.evidenceRequirements.milestoneScreenshots !== true ||
    value.evidenceRequirements.trace !== true ||
    value.evidenceRequirements.console !== true ||
    value.evidenceRequirements.pageErrors !== true ||
    value.evidenceRequirements.network !== true ||
    value.evidenceRequirements.workerTranscript !== true ||
    typeof value.evidenceRequirements.replayEvidence !== 'boolean' ||
    !isIsoDateTime(value.reviewedAt)
  ) {
    return { ok: false, reason: 'invalid-packet' };
  }
  if (value.mode === 'closeout' && value.startState.kind !== 'new-game') {
    return { ok: false, reason: 'closeout-must-start-new-game' };
  }
  if (
    value.startState.kind !== 'new-game' &&
    (
      value.startState.kind !== 'checkpoint' ||
      !isNonEmptyString(value.startState.checkpointId) ||
      !isNonEmptyString(value.startState.provenanceRef)
    )
  ) {
    return { ok: false, reason: 'invalid-start-state' };
  }
  if (
    value.startState.kind === 'checkpoint' &&
    value.evidenceRequirements.replayEvidence !== true
  ) {
    return { ok: false, reason: 'checkpoint-requires-replay-evidence' };
  }
  if (value.playerPersonas.length !== value.workerCount) {
    return { ok: false, reason: 'persona-worker-count-mismatch' };
  }
  if (new Set(value.playerPersonas.map((persona) => persona.id)).size !== value.playerPersonas.length) {
    return { ok: false, reason: 'duplicate-player-persona' };
  }
  if (new Set(value.requiredProbeIds).size !== value.requiredProbeIds.length) {
    return { ok: false, reason: 'duplicate-required-probe' };
  }
  if (
    new Set(value.computerUsePolicy.actionTools).size !==
      value.computerUsePolicy.actionTools.length ||
    new Set(value.computerUsePolicy.keys.map((key) => key.toLowerCase())).size !==
      value.computerUsePolicy.keys.length ||
    (
      value.computerUsePolicy.actionTools.includes('press_key')
        ? value.computerUsePolicy.keys.length === 0
        : value.computerUsePolicy.keys.length !== 0
    )
  ) {
    return { ok: false, reason: 'invalid-computer-use-policy' };
  }
  const invariantIds = value.requiredInvariants.map((invariant) => invariant.id);
  if (new Set(invariantIds).size !== invariantIds.length) {
    return { ok: false, reason: 'duplicate-required-invariant' };
  }
  return { ok: true };
};

export const validateAiGamerVerdictV2 = (value: unknown): PlaytestValidationResult => {
  if (!isRecord(value) || value.schema !== AI_GAMER_VERDICT_V2_SCHEMA) {
    return { ok: false, reason: 'invalid-verdict-schema' };
  }
  if (
    !isNonEmptyString(value.packetId) ||
    !isNonEmptyString(value.workerId) ||
    !includes(GATE_OUTCOMES, value.outcome) ||
    !includes(PLAYTEST_EVIDENCE_CLASSES, value.evidenceClass) ||
    typeof value.visibleGoalMet !== 'boolean' ||
    !isNonEmptyString(value.summary) ||
    !isStringArray(value.evidenceRefs) ||
    !isStringArray(value.warnings) ||
    !isRecord(value.model) ||
    value.model.requested !== 'gpt-5.6-sol' ||
    !isNonEmptyString(value.model.effective) ||
    value.model.reasoningEffort !== 'high' ||
    !isNonEmptyString(value.model.codexVersion) ||
    !isNonEmptyString(value.model.catalogEvidenceRef) ||
    !isNonEmptyString(value.model.runtimeEvidenceRef) ||
    !isRecord(value.worker) ||
    !isNonEmptyString(value.worker.browserApp) ||
    !isNonEmptyString(value.worker.marker) ||
    !isNonEmptyString(value.worker.transcriptRef) ||
    !isSha256(value.worker.transcriptSha256) ||
    typeof value.worker.integrityValid !== 'boolean'
  ) {
    return { ok: false, reason: 'invalid-verdict' };
  }
  if (value.outcome === 'pass' && value.evidenceClass === 'fixture-only') {
    return { ok: false, reason: 'fixture-only-cannot-pass' };
  }
  if (value.outcome === 'pass' && (!value.visibleGoalMet || value.evidenceRefs.length === 0)) {
    return { ok: false, reason: 'passing-verdict-missing-evidence' };
  }
  if (
    value.outcome !== 'blocked' &&
    (
      value.model.effective !== 'gpt-5.6-sol' ||
      value.worker.integrityValid !== true
    )
  ) {
    return { ok: false, reason: 'deciding-verdict-missing-provenance' };
  }
  return { ok: true };
};

const isProbeResult = (value: unknown): value is PlaytestGateProbeResultV2 =>
  isRecord(value) &&
  isNonEmptyString(value.probeId) &&
  includes(['met', 'unmet', 'unavailable'] as const, value.state) &&
  typeof value.acceptanceEligible === 'boolean' &&
  isStringArray(value.evidenceRefs);

const isInvariantResult = (value: unknown): value is PlaytestGateInvariantResultV2 =>
  isRecord(value) &&
  isNonEmptyString(value.invariantId) &&
  includes(['met', 'unmet', 'unavailable'] as const, value.state) &&
  typeof value.acceptanceEligible === 'boolean' &&
  isStringArray(value.evidenceRefs);

const isProbeTimelineEntry = (value: unknown): value is PlaytestGateProbeTimelineEntryV2 =>
  isRecord(value) &&
  isIsoDateTime(value.capturedAt) &&
  isNonEmptyString(value.probeId) &&
  includes(['met', 'unmet', 'unavailable'] as const, value.from) &&
  includes(['met', 'unmet', 'unavailable'] as const, value.to) &&
  isStringArray(value.evidenceRefs);

const isFinding = (value: unknown): value is PlaytestGateFindingV2 =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  includes(['regression', 'warning', 'blocker'] as const, value.kind) &&
  isNonEmptyString(value.title) &&
  isNonEmptyString(value.summary) &&
  isStringArray(value.evidenceRefs);

export const validatePlaytestGateReportV2 = (value: unknown): PlaytestValidationResult => {
  if (!isRecord(value) || value.schema !== PLAYTEST_GATE_REPORT_V2_SCHEMA) {
    return { ok: false, reason: 'invalid-gate-report-schema' };
  }
  if (value.invariantEvidenceBasis !== 'derived') {
    return { ok: false, reason: 'invalid-gate-invariant-evidence-basis' };
  }
  if (
    !isNonEmptyString(value.runId) ||
    typeof value.ticket !== 'string' ||
    !/^GET-\d+$/.test(value.ticket) ||
    (value.mode !== 'affected' && value.mode !== 'closeout') ||
    !isNonEmptyString(value.packetId) ||
    !includes(GATE_OUTCOMES, value.outcome) ||
    typeof value.exitCode !== 'number' ||
    ![0, 1, 2, 3].includes(value.exitCode) ||
    !isIsoDateTime(value.startedAt) ||
    !isIsoDateTime(value.completedAt) ||
    (value.retention !== 'concise' && value.retention !== 'diagnostic') ||
    !Array.isArray(value.verdicts) ||
    !Array.isArray(value.probeResults) ||
    !value.probeResults.every(isProbeResult) ||
    !Array.isArray(value.invariantResults) ||
    !value.invariantResults.every(isInvariantResult) ||
    !Array.isArray(value.probeTimeline) ||
    !value.probeTimeline.every(isProbeTimelineEntry) ||
    !isStringArray(value.evidenceRefs) ||
    !isStringArray(value.warnings) ||
    !Array.isArray(value.findings) ||
    !value.findings.every(isFinding) ||
    !isRecord(value.quorum) ||
    (value.quorum.required !== 1 && value.quorum.required !== 2) ||
    typeof value.quorum.valid !== 'number' ||
    !Number.isInteger(value.quorum.valid) ||
    value.quorum.valid < 0 ||
    !isStringArray(value.quorum.decidingWorkerIds)
  ) {
    return { ok: false, reason: 'invalid-gate-report' };
  }

  const hasPacketBinding =
    typeof value.packetRevision === 'number' &&
    Number.isInteger(value.packetRevision) &&
    value.packetRevision >= 1 &&
    isSha256(value.packetSha256) &&
    isNonEmptyString(value.packetEvidenceRef);
  const hasNoPacketBinding =
    value.packetRevision === null &&
    value.packetSha256 === null &&
    value.packetEvidenceRef === null;
  if (!hasPacketBinding && !hasNoPacketBinding) {
    return { ok: false, reason: 'invalid-gate-packet-binding' };
  }
  if (value.outcome !== 'blocked' && !hasPacketBinding) {
    return { ok: false, reason: 'deciding-gate-missing-packet-binding' };
  }
  if (
    hasPacketBinding &&
    !(value.evidenceRefs as unknown[]).includes(value.packetEvidenceRef)
  ) {
    return { ok: false, reason: 'gate-packet-artifact-missing-from-evidence' };
  }

  const expectedExitCodes: Record<GateOutcome, readonly number[]> = {
    pass: [0],
    fail: [1],
    blocked: [2, 3],
  };
  if (!expectedExitCodes[value.outcome].includes(value.exitCode)) {
    return { ok: false, reason: 'gate-outcome-exit-code-mismatch' };
  }
  if (
    (value.outcome === 'pass' && value.retention !== 'concise') ||
    (value.outcome !== 'pass' && value.retention !== 'diagnostic')
  ) {
    return { ok: false, reason: 'gate-outcome-retention-mismatch' };
  }

  const verdicts = value.verdicts as unknown[];
  for (const verdict of verdicts) {
    const validation = validateAiGamerVerdictV2(verdict);
    if (!validation.ok) return validation;
    if ((verdict as AiGamerVerdictV2).packetId !== value.packetId) {
      return { ok: false, reason: 'verdict-packet-mismatch' };
    }
  }

  if (value.outcome === 'pass') {
    const fixtureVerdict = verdicts.find((verdict) =>
      isRecord(verdict) && verdict.evidenceClass === 'fixture-only'
    );
    if (fixtureVerdict) return { ok: false, reason: 'fixture-only-cannot-pass' };
    if (
      value.probeResults.length === 0 ||
      value.invariantResults.length === 0 ||
      value.probeResults.some((probe) => probe.state !== 'met') ||
      value.probeResults.some((probe) => probe.acceptanceEligible !== true) ||
      value.probeResults.some((probe) => probe.evidenceRefs.length === 0) ||
      value.invariantResults.some((invariant) => invariant.state !== 'met') ||
      value.invariantResults.some((invariant) => invariant.acceptanceEligible !== true) ||
      value.invariantResults.some((invariant) => invariant.evidenceRefs.length === 0) ||
      value.evidenceRefs.length === 0 ||
      value.quorum.valid < value.quorum.required
    ) {
      return { ok: false, reason: 'passing-gate-missing-evidence' };
    }
  }
  const decidingWorkerIds = value.quorum.decidingWorkerIds;
  if (
    value.outcome !== 'blocked' &&
    (
      decidingWorkerIds.length !== value.quorum.required ||
      new Set(decidingWorkerIds).size !== decidingWorkerIds.length ||
      decidingWorkerIds.some((workerId) => !verdicts.some((verdict) =>
        isRecord(verdict) && verdict.workerId === workerId && verdict.outcome === value.outcome
      ))
    )
  ) {
    return { ok: false, reason: 'invalid-deciding-quorum' };
  }
  if (value.outcome === 'fail' && !value.findings.some((finding) => finding.kind === 'regression')) {
    return { ok: false, reason: 'failure-missing-proven-regression' };
  }
  if (value.outcome === 'blocked' && !value.findings.some((finding) => finding.kind === 'blocker')) {
    return { ok: false, reason: 'blocked-missing-blocker' };
  }
  return { ok: true };
};
