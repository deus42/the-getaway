import { createHash, randomUUID } from 'node:crypto';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  AI_GAMER_VERDICT_V2_SCHEMA,
  PLAYTEST_GATE_REPORT_V2_SCHEMA,
  validatePlaytestPacketV1,
  type AiGamerVerdictV2,
  type GateOutcome,
  type PlaytestGateFindingV2,
  type PlaytestGateInvariantResultV2,
  type PlaytestGateProbeResultV2,
  type PlaytestGateProbeTimelineEntryV2,
  type PlaytestGateReportV2,
  type PlaytestPacketPersonaV1,
} from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import { launchWorkerBrowser, reserveLiveBrowserTargets } from './browserRuntime.ts';
import {
  browserTargetsRequireSequentialExecution,
  type BrowserTarget,
} from './browser.ts';
import {
  prepareVerifiedCheckpoint,
  type VerifiedPlaytestCheckpoint,
} from './checkpointRuntime.ts';
import { exitCodeForOutcome, parseCliArgs, type GateCliOptions } from './cli.ts';
import { ReadOnlyPlaytestObserver, type ObserverResult } from './observer.ts';
import { repoRoot, reportRoot } from './paths.ts';
import { resolvePlaytestPacket, type ReviewedPlaytestPacketV1 } from './packets.ts';
import { bindReviewedPacket, type ReviewedPacketBinding } from './packetEvidence.ts';
import { buildWorkerPrompt } from './prompt.ts';
import {
  recoverableWorkerBlockKind,
  replaceRecoverableProtocolBlocks,
  type ProtocolReplacement,
} from './protocolRetry.ts';
import {
  resolveQuorumWithTieBreaker,
  type QuorumDecision,
  type WorkerVerdict,
} from './quorum.ts';
import {
  collectRunEvidenceRefs,
  normalizeGateEvidenceRefs,
  normalizeGateFindings,
  pruneConciseWorkerArtifacts,
  selectWorkerEvidenceRefs,
  writeGateReport,
} from './report.ts';
import { ensureDevServer, type DevServerHandle } from './server.ts';
import { classifyWorkerEvidence, type ClassifiedWorkerEvidence } from './verdict.ts';
import {
  closeReleaseSafeWorkerBrowsers,
  executeCodexWorker,
  resolveWorkerDirectory,
  runCodexPreflight,
  type CodexPreflightEvidence,
  type RawWorkerExecution,
} from './workerRuntime.ts';

interface WorkerRunRecord {
  raw: RawWorkerExecution;
  observer: ObserverResult;
  classification: ClassifiedWorkerEvidence;
  verdict: AiGamerVerdictV2;
}

const prefixRef = (workerId: string, ref: string): string =>
  `workers/${workerId}/${ref}`;

const createRunId = (ticket: string, mode: string): string => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${stamp}-${ticket.toLowerCase()}-${mode}-${randomUUID().slice(0, 8)}`;
};

const digest = (value: string): string => createHash('sha256').update(value).digest('hex');

const createPrivateDirectory = async (directory: string): Promise<void> => {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
};

const syntheticTicket = (argv: readonly string[]): string =>
  argv.find((argument) => /^GET-\d+$/.test(argument)) ?? 'GET-0';

const createBlockedFinding = (
  id: string,
  title: string,
  summary: string,
  evidenceRefs: string[]
): PlaytestGateFindingV2 => ({
  id,
  kind: 'blocker',
  title,
  summary,
  evidenceRefs,
});

const writeBlockedReport = async (input: {
  runId: string;
  runDirectory: string;
  ticket: string;
  mode: 'affected' | 'closeout';
  packetId: string;
  packetBinding?: ReviewedPacketBinding;
  requiredQuorum: 1 | 2;
  startedAt: string;
  exitCode: 2 | 3;
  reason: string;
  evidenceRefs?: string[];
}): Promise<void> => {
  const evidenceRefs = normalizeGateEvidenceRefs([
    ...(input.evidenceRefs ?? []),
    ...(input.packetBinding ? [input.packetBinding.evidenceRef] : []),
    'report.json',
    'report.md',
  ]);
  const report: PlaytestGateReportV2 = {
    schema: PLAYTEST_GATE_REPORT_V2_SCHEMA,
    runId: input.runId,
    ticket: input.ticket,
    mode: input.mode,
    packetId: input.packetId,
    packetRevision: input.packetBinding?.revision ?? null,
    packetSha256: input.packetBinding?.sha256 ?? null,
    packetEvidenceRef: input.packetBinding?.evidenceRef ?? null,
    outcome: 'blocked',
    exitCode: input.exitCode,
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    retention: 'diagnostic',
    verdicts: [],
    probeResults: [],
    invariantEvidenceBasis: 'derived',
    invariantResults: [],
    probeTimeline: [],
    evidenceRefs,
    warnings: [],
    findings: [createBlockedFinding('gate-operational-blocker', 'AI Gamer gate blocked', input.reason, evidenceRefs)],
    quorum: { required: input.requiredQuorum, valid: 0, decidingWorkerIds: [] },
  };
  await writeGateReport(input.runDirectory, report);
};

const runWorkerGroup = async (input: {
  runId: string;
  packet: ReviewedPlaytestPacketV1;
  preflight: CodexPreflightEvidence;
  baseUrl: string;
  targets: BrowserTarget[];
  personas: PlaytestPacketPersonaV1[];
  workerIds: string[];
  checkpoint?: VerifiedPlaytestCheckpoint;
}): Promise<WorkerRunRecord[]> => {
  if (browserTargetsRequireSequentialExecution(input.targets)) {
    const records: WorkerRunRecord[] = [];
    for (let index = 0; index < input.targets.length; index += 1) {
      const [record] = await runWorkerGroup({
        ...input,
        targets: [input.targets[index]],
        personas: [input.personas[index]],
        workerIds: [input.workerIds[index]],
      });
      records.push(record);
    }
    return records;
  }

  const browsers = [] as Awaited<ReturnType<typeof launchWorkerBrowser>>[];
  const browserReleaseSafe: boolean[] = [];
  try {
    for (let index = 0; index < input.targets.length; index += 1) {
      const browser = await launchWorkerBrowser({
        target: input.targets[index],
        baseUrl: input.baseUrl,
        marker: randomUUID(),
        viewport: input.packet.viewport,
        locale: input.packet.locale,
        checkpointStorageEntries: input.checkpoint?.storageEntries,
      });
      browsers.push(browser);
      browserReleaseSafe.push(true);
    }

    const observers = browsers.map((browser, index) => new ReadOnlyPlaytestObserver(
      browser.context,
      browser.page,
      browser.marker,
      input.packet.requiredProbeIds,
      resolveWorkerDirectory(input.runId, input.workerIds[index])
    ));
    await Promise.all(observers.map((observer) => observer.start()));

    const executions = await Promise.allSettled(browsers.map((browser, index) => {
      const workerId = input.workerIds[index];
      const workerDirectory = resolveWorkerDirectory(input.runId, workerId);
      return executeCodexWorker({
        workerId,
        codexVersion: input.preflight.codexVersion.replace(/^codex-cli\s+/, ''),
        browserApp: browser.target.app,
        marker: browser.marker,
        browserExecutablePath: browser.target.executablePath,
        browserProfileDirectory: browser.profileDirectory,
        browserRootPid: browser.rootPid,
        prompt: buildWorkerPrompt({
          packet: input.packet,
          persona: input.personas[index],
          browserApp: browser.target.app,
          marker: browser.marker,
        }),
        budgetMs: input.packet.workerBudgetMs,
        workerDirectory,
        computerUsePolicy: input.packet.computerUsePolicy,
        onComputerUseCall: (call) => observers[index].recordComputerUseCall(call),
        onSynchronizedComputerUseCapture: (request) =>
          observers[index].synchronizeComputerUseCapture(request),
        onBrowserReleaseSafetyChange: (releaseSafe) => {
          browserReleaseSafe[index] = releaseSafe;
        },
      });
    }));
    const observerResults = await Promise.all(observers.map((observer) => observer.stop()));

    const records: WorkerRunRecord[] = [];
    for (let index = 0; index < executions.length; index += 1) {
      const execution = executions[index];
      if (execution.status === 'rejected') throw execution.reason;
      const raw = execution.value;
      const observer = observerResults[index];
      const classification = classifyWorkerEvidence({
        requiredInvariants: input.packet.requiredInvariants,
        response: raw.response,
        responseError: raw.responseError,
        exitCode: raw.exitCode,
        timedOut: raw.timedOut,
        supervisorViolation: raw.supervisorViolation,
        transcriptAudit: raw.transcriptAudit,
        observer,
      });
      const workerEvidence = selectWorkerEvidenceRefs(classification.outcome, [
        ...observer.evidenceRefs,
        raw.runtimeAttestationRef,
        raw.browserTargetAttestationRef,
        raw.computerUseLedgerRef,
        raw.transcriptSummaryRef,
        ...(classification.outcome === 'pass'
          ? []
          : [raw.transcriptRef, raw.stderrRef]),
      ])
        .map((ref) => prefixRef(raw.workerId, ref));
      const verdict: AiGamerVerdictV2 = {
        schema: AI_GAMER_VERDICT_V2_SCHEMA,
        packetId: input.packet.packetId,
        workerId: raw.workerId,
        outcome: classification.outcome,
        evidenceClass: 'live-guided',
        visibleGoalMet: raw.response?.visibleGoalMet ?? false,
        summary: raw.response?.summary ??
          (classification.reasons.join(' ') || 'Worker produced no usable verdict.'),
        evidenceRefs: workerEvidence,
        warnings: classification.warnings,
        model: {
          requested: 'gpt-5.6-sol',
          effective: raw.runtimeAttestation.model,
          reasoningEffort: raw.runtimeAttestation.reasoningEffort,
          codexVersion: input.preflight.codexVersion,
          catalogEvidenceRef: input.preflight.catalogEvidenceRef,
          runtimeEvidenceRef: prefixRef(raw.workerId, raw.runtimeAttestationRef),
        },
        worker: {
          browserApp: raw.browserApp,
          marker: raw.marker,
          transcriptRef: prefixRef(
            raw.workerId,
            classification.outcome === 'pass' ? raw.transcriptSummaryRef : raw.transcriptRef
          ),
          transcriptSha256: raw.transcriptSha256,
          integrityValid: classification.integrityValid,
        },
      };
      records.push({ raw, observer, classification, verdict });
    }
    return records;
  } finally {
    const quarantined = await closeReleaseSafeWorkerBrowsers(
      browsers,
      browserReleaseSafe
    );
    if (quarantined.length > 0) {
      throw new Error(
        `Worker descendant cleanup was not proven; isolated browser target(s) ` +
        `${quarantined.map((index) => browsers[index].target.app).join(', ')} remain quarantined.`
      );
    }
  }
};

const asQuorumVerdict = (record: WorkerRunRecord): WorkerVerdict => ({
  workerId: record.raw.workerId,
  outcome: record.classification.outcome,
  evidenceValid: record.classification.evidenceValid,
  integrityValid: record.classification.integrityValid,
});

const workerRetryCandidate = (record: WorkerRunRecord) => ({
    outcome: record.classification.outcome,
    supervisorViolation: record.raw.supervisorViolation,
    transcriptBlockingReasons: record.raw.transcriptAudit.blockingReasons,
    responsePresent: record.raw.response !== undefined,
    responseSummary: record.raw.response?.summary,
    responseError: record.raw.responseError,
    timedOut: record.raw.timedOut,
  });

const isRecoverableWorkerBlock = (record: WorkerRunRecord): boolean =>
  recoverableWorkerBlockKind(workerRetryCandidate(record)) !== undefined;

const stableDiagnosticEvidenceRefs = (record: WorkerRunRecord): string[] =>
  normalizeGateEvidenceRefs([
    prefixRef(record.raw.workerId, record.raw.runtimeAttestationRef),
    prefixRef(record.raw.workerId, record.raw.browserTargetAttestationRef),
    prefixRef(record.raw.workerId, record.raw.computerUseLedgerRef),
    prefixRef(record.raw.workerId, record.raw.transcriptSummaryRef),
  ]);

const writeProtocolReplacementEvidence = async (
  runDirectory: string,
  replacements: readonly ProtocolReplacement<WorkerRunRecord>[]
): Promise<string | undefined> => {
  if (replacements.length === 0) return undefined;
  const evidenceRef = 'protocol-replacements.json';
  await writeFile(path.join(runDirectory, evidenceRef), `${JSON.stringify({
    schema: 'ai_gamer_protocol_replacements_v1',
    maxReplacementsPerWorkerSlot: 2,
    replacements: replacements.map(({ slotIndex, attempt, superseded, replacement }) => ({
      slotIndex,
      attempt,
      supersededWorkerId: superseded.raw.workerId,
      replacementWorkerId: replacement.raw.workerId,
      retryClass: recoverableWorkerBlockKind(workerRetryCandidate(superseded)),
      supervisorViolation: superseded.raw.supervisorViolation,
      transcriptSha256: superseded.raw.transcriptSha256,
      evidenceRefs: stableDiagnosticEvidenceRefs(superseded),
    })),
  }, null, 2)}\n`, 'utf8');
  await chmod(path.join(runDirectory, evidenceRef), 0o600);
  return evidenceRef;
};

const decidingIds = (
  decision: QuorumDecision,
  records: readonly WorkerRunRecord[]
): string[] => decision.state === 'resolved'
  ? records
    .filter((record) => record.classification.outcome === decision.outcome)
    .map((record) => record.raw.workerId)
    .slice(0, records.length > 1 ? 2 : 1)
  : [];

const prefixProbeResult = (
  workerId: string,
  probe: PlaytestGateProbeResultV2
): PlaytestGateProbeResultV2 => ({
  ...probe,
  evidenceRefs: probe.evidenceRefs.map((ref) => prefixRef(workerId, ref)),
});

const aggregateProbeResults = (
  packet: ReviewedPlaytestPacketV1,
  decidingRecords: readonly WorkerRunRecord[]
): PlaytestGateProbeResultV2[] => packet.requiredProbeIds.map((probeId) => {
  const results = decidingRecords
    .map((record) => {
      const result = record.observer.probeResults.find((probe) => probe.probeId === probeId);
      return result ? prefixProbeResult(record.raw.workerId, result) : undefined;
    })
    .filter((result): result is PlaytestGateProbeResultV2 => Boolean(result));
  const allMet = results.length === decidingRecords.length &&
    results.length > 0 &&
    results.every((result) => result.state === 'met' && result.acceptanceEligible);
  return {
    probeId,
    state: allMet
      ? 'met'
      : results.some((result) => result.state === 'unmet') ? 'unmet' : 'unavailable',
    acceptanceEligible: allMet,
    evidenceRefs: normalizeGateEvidenceRefs(results.flatMap((result) => result.evidenceRefs)),
  };
});

const aggregateTimeline = (records: readonly WorkerRunRecord[]): PlaytestGateProbeTimelineEntryV2[] =>
  records.flatMap((record) => record.observer.probeTimeline.map((entry) => ({
    ...entry,
    evidenceRefs: entry.evidenceRefs.map((ref) => prefixRef(record.raw.workerId, ref)),
  })));

const aggregateInvariantResults = (
  packet: ReviewedPlaytestPacketV1,
  decidingRecords: readonly WorkerRunRecord[]
): PlaytestGateInvariantResultV2[] => packet.requiredInvariants.map((required) => {
  const results = decidingRecords
    .map((record) => {
      const result = record.classification.invariantResults.find(
        (candidate) => candidate.invariantId === required.id
      );
      return result ? {
        ...result,
        evidenceRefs: result.evidenceRefs.map((ref) => prefixRef(record.raw.workerId, ref)),
      } : undefined;
    })
    .filter((result): result is PlaytestGateInvariantResultV2 => Boolean(result));
  const allMet = results.length === decidingRecords.length &&
    results.length > 0 &&
    results.every((result) => result.state === 'met' && result.acceptanceEligible);
  return {
    invariantId: required.id,
    state: allMet
      ? 'met'
      : results.some((result) => result.state === 'unmet') ? 'unmet' : 'unavailable',
    acceptanceEligible: allMet,
    evidenceRefs: normalizeGateEvidenceRefs(results.flatMap((result) => result.evidenceRefs)),
  };
});

const buildFindings = (
  records: readonly WorkerRunRecord[],
  decision: QuorumDecision
): PlaytestGateFindingV2[] => {
  const findings = records.flatMap((record): PlaytestGateFindingV2[] => {
    if (record.classification.outcome === 'fail' && record.raw.response?.regression) {
      return [{
        id: `${record.raw.workerId}-proven-regression`,
        kind: 'regression',
        title: record.raw.response.regression.title,
        summary: record.raw.response.regression.observed,
        evidenceRefs: record.verdict.evidenceRefs,
      }];
    }
    if (record.classification.outcome === 'blocked') {
      return [createBlockedFinding(
        `${record.raw.workerId}-blocked`,
        `${record.raw.workerId} was blocked`,
        record.classification.reasons.join(' '),
        record.verdict.evidenceRefs
      )];
    }
    return [];
  });
  if (decision.state === 'blocked') {
    findings.push(createBlockedFinding(
      'quorum-blocked',
      'AI Gamer quorum was not evidence-valid',
      decision.reason,
      records.flatMap((record) => record.verdict.evidenceRefs)
    ));
  }
  return findings;
};

const finalizeReport = async (input: {
  runId: string;
  runDirectory: string;
  packet: ReviewedPlaytestPacketV1;
  startedAt: string;
  preflight: CodexPreflightEvidence;
  records: WorkerRunRecord[];
  supersededRecords?: WorkerRunRecord[];
  additionalEvidenceRefs?: string[];
  additionalWarnings?: string[];
  decision: QuorumDecision;
  serverEvidenceRef: string;
  checkpoint?: VerifiedPlaytestCheckpoint;
  packetBinding: ReviewedPacketBinding;
}): Promise<PlaytestGateReportV2> => {
  const outcome: GateOutcome = input.decision.state === 'resolved'
    ? input.decision.outcome
    : 'blocked';
  const decidingWorkerIds = decidingIds(input.decision, input.records);
  const decidingRecords = input.records.filter((record) =>
    decidingWorkerIds.includes(record.raw.workerId)
  );
  const evidenceRefs = normalizeGateEvidenceRefs([
    input.preflight.catalogEvidenceRef,
    input.preflight.computerUseBinaryEvidenceRef,
    input.serverEvidenceRef,
    input.packetBinding.evidenceRef,
    ...(input.checkpoint?.evidenceRefs ?? []),
    ...input.records.flatMap((record) => record.verdict.evidenceRefs),
    ...(input.additionalEvidenceRefs ?? []),
    'report.json',
    'report.md',
  ]);
  const report: PlaytestGateReportV2 = {
    schema: PLAYTEST_GATE_REPORT_V2_SCHEMA,
    runId: input.runId,
    ticket: input.packet.ticket,
    mode: input.packet.mode,
    packetId: input.packet.packetId,
    packetRevision: input.packetBinding.revision,
    packetSha256: input.packetBinding.sha256,
    packetEvidenceRef: input.packetBinding.evidenceRef,
    outcome,
    exitCode: exitCodeForOutcome(outcome),
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    retention: outcome === 'pass' ? 'concise' : 'diagnostic',
    verdicts: input.records.map((record) => record.verdict),
    probeResults: aggregateProbeResults(
      input.packet,
      decidingRecords.length > 0 ? decidingRecords : input.records
    ),
    invariantEvidenceBasis: 'derived',
    invariantResults: aggregateInvariantResults(
      input.packet,
      decidingRecords.length > 0 ? decidingRecords : input.records
    ),
    probeTimeline: aggregateTimeline(input.records),
    evidenceRefs,
    warnings: normalizeGateEvidenceRefs([
      ...input.records.flatMap((record) => record.classification.warnings),
      ...(input.additionalWarnings ?? []),
    ]),
    findings: normalizeGateFindings(buildFindings(input.records, input.decision)),
    quorum: {
      required: input.packet.workerCount,
      valid: input.records.filter((record) =>
        record.classification.evidenceValid && record.classification.integrityValid
      ).length,
      decidingWorkerIds,
    },
  };
  await writeGateReport(input.runDirectory, report);
  if (outcome === 'pass') {
    await Promise.all([...input.records, ...(input.supersededRecords ?? [])].map((record) =>
      pruneConciseWorkerArtifacts(resolveWorkerDirectory(input.runId, record.raw.workerId))
    ));
  }
  return report;
};

const writeDryRun = async (input: {
  runDirectory: string;
  options: GateCliOptions;
  packet: ReviewedPlaytestPacketV1;
  preflight: CodexPreflightEvidence;
  targets: BrowserTarget[];
  checkpoint?: VerifiedPlaytestCheckpoint;
  packetBinding: ReviewedPacketBinding;
}): Promise<void> => {
  const plan = {
    schema: 'playtest_gate_dry_run_v1',
    valid: true,
    ticket: input.options.ticket,
    mode: input.options.mode,
    packetId: input.packet.packetId,
    packetRevision: input.packetBinding.revision,
    packetSha256: input.packetBinding.sha256,
    packetEvidenceRef: input.packetBinding.evidenceRef,
    workerCount: input.packet.workerCount,
    workerBudgetMs: input.packet.workerBudgetMs,
    startState: input.packet.startState,
    checkpointEvidenceRefs: input.checkpoint?.evidenceRefs ?? [],
    requestedModel: input.preflight.model.slug,
    reasoningEffort: 'high',
    computerUseBinaryEvidenceRef: input.preflight.computerUseBinaryEvidenceRef,
    browserApps: input.targets.map((target) => target.app),
  };
  await writeFile(
    path.join(input.runDirectory, 'dry-run.json'),
    `${JSON.stringify(plan, null, 2)}\n`,
    'utf8'
  );
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
};

export const runPlaytestGate = async (argv: readonly string[]): Promise<0 | 1 | 2 | 3> => {
  const startedAt = new Date().toISOString();
  let options: GateCliOptions;
  try {
    options = parseCliArgs(argv);
  } catch (error) {
    const ticket = syntheticTicket(argv);
    const runId = createRunId(ticket, 'invalid');
    const runDirectory = path.join(reportRoot, runId);
    await createPrivateDirectory(runDirectory);
    await writeBlockedReport({
      runId,
      runDirectory,
      ticket,
      mode: 'affected',
      packetId: 'unavailable',
      requiredQuorum: 1,
      startedAt,
      exitCode: 3,
      reason: (error as Error).message,
    });
    process.stderr.write(`${(error as Error).message}\nReport: ${path.join(runDirectory, 'report.md')}\n`);
    return 3;
  }

  const runId = createRunId(options.ticket, options.mode);
  const runDirectory = path.join(reportRoot, runId);
  await createPrivateDirectory(runDirectory);
  let packet: ReviewedPlaytestPacketV1;
  let packetBinding: ReviewedPacketBinding;
  try {
    packet = resolvePlaytestPacket(options.ticket, options.mode);
    const validation = validatePlaytestPacketV1(packet);
    if (!validation.ok) throw new Error(`Invalid reviewed packet: ${validation.reason}`);
    packetBinding = await bindReviewedPacket(runDirectory, packet);
  } catch (error) {
    await writeBlockedReport({
      runId,
      runDirectory,
      ticket: options.ticket,
      mode: options.mode,
      packetId: 'unavailable',
      requiredQuorum: 1,
      startedAt,
      exitCode: 3,
      reason: (error as Error).message,
    });
    process.stderr.write(`${(error as Error).message}\nReport: ${path.join(runDirectory, 'report.md')}\n`);
    return 3;
  }

  let server: DevServerHandle | undefined;
  let preflight: CodexPreflightEvidence | undefined;
  let checkpoint: VerifiedPlaytestCheckpoint | undefined;
  try {
    checkpoint = await prepareVerifiedCheckpoint({
      repoRoot,
      runDirectory,
      mode: packet.mode,
      startState: packet.startState,
    });
    const verifiedPreflight = await runCodexPreflight(runDirectory);
    preflight = verifiedPreflight;
    const targets = await reserveLiveBrowserTargets(packet.workerCount);
    if (options.dryRun) {
      await writeDryRun({
        runDirectory,
        options,
        packet,
        preflight: verifiedPreflight,
        targets,
        checkpoint,
        packetBinding,
      });
      return 0;
    }

    server = await ensureDevServer(runDirectory);
    const initialIds = Array.from(
      { length: packet.workerCount },
      (_, index) => `worker-${index + 1}`
    );
    const initialRecords = await runWorkerGroup({
      runId,
      packet,
      preflight: verifiedPreflight,
      baseUrl: server.baseUrl,
      targets,
      personas: packet.playerPersonas,
      workerIds: initialIds,
      checkpoint,
    });
    await server.ensureAlive();
    const protocolResolution = await replaceRecoverableProtocolBlocks(
      initialRecords,
      isRecoverableWorkerBlock,
      async (_record, slotIndex, attempt) => {
        await server!.ensureAlive();
        const replacementTargets = await reserveLiveBrowserTargets(1);
        const replacementId = `${initialIds[slotIndex]}-replacement-${attempt}`;
        const [replacement] = await runWorkerGroup({
          runId,
          packet,
          preflight: verifiedPreflight,
          baseUrl: server!.baseUrl,
          targets: replacementTargets,
          personas: [packet.playerPersonas[slotIndex]],
          workerIds: [replacementId],
          checkpoint,
        });
        await server!.ensureAlive();
        return replacement;
      },
      2
    );
    const protocolReplacementEvidenceRef = await writeProtocolReplacementEvidence(
      runDirectory,
      protocolResolution.replacements
    );
    const protocolReplacementWarnings = protocolResolution.replacements.map(
      ({ superseded, replacement }) =>
        `${superseded.raw.workerId} was superseded by ${replacement.raw.workerId} after a bounded ${recoverableWorkerBlockKind(workerRetryCandidate(superseded))} worker block; only the fresh replacement participates in quorum.`
    );
    const protocolDiagnosticEvidenceRefs = protocolResolution.supersededRecords.flatMap(
      stableDiagnosticEvidenceRefs
    );
    const quorumResolution = await resolveQuorumWithTieBreaker(
      packet.workerCount,
      protocolResolution.activeRecords.map(asQuorumVerdict),
      async () => {
        const tieTargets = await reserveLiveBrowserTargets(1);
        const tiePersona: PlaytestPacketPersonaV1 = {
          id: 'blind-tie-breaker',
          brief: 'Act as a fresh player and judge only what this visible run shows.',
        };
        const [tieRecord] = await runWorkerGroup({
          runId,
          packet,
          preflight: verifiedPreflight,
          baseUrl: server!.baseUrl,
          targets: tieTargets,
          personas: [tiePersona],
          workerIds: ['tie-breaker'],
          checkpoint,
        });
        return { record: tieRecord, verdict: asQuorumVerdict(tieRecord) };
      }
    );
    const records = quorumResolution.tieBreakerRecord
      ? [...protocolResolution.activeRecords, quorumResolution.tieBreakerRecord]
      : [...protocolResolution.activeRecords];
    const decision = quorumResolution.decision;
    await server.ensureAlive();

    const report = await finalizeReport({
      runId,
      runDirectory,
      packet,
      startedAt,
      preflight: verifiedPreflight,
      records,
      supersededRecords: protocolResolution.supersededRecords,
      additionalEvidenceRefs: [
        ...(protocolReplacementEvidenceRef ? [protocolReplacementEvidenceRef] : []),
        ...protocolDiagnosticEvidenceRefs,
      ],
      additionalWarnings: protocolReplacementWarnings,
      decision,
      serverEvidenceRef: server.evidenceRef,
      checkpoint,
      packetBinding,
    });
    process.stdout.write(`${JSON.stringify({
      outcome: report.outcome,
      exitCode: report.exitCode,
      packetId: report.packetId,
      report: path.join(runDirectory, 'report.md'),
      evidenceDigest: digest(report.evidenceRefs.join('\n')),
    }, null, 2)}\n`);
    return report.exitCode as 0 | 1 | 2;
  } catch (error) {
    const discoveredEvidenceRefs = await collectRunEvidenceRefs(runDirectory);
    await writeBlockedReport({
      runId,
      runDirectory,
      ticket: packet.ticket,
      mode: packet.mode,
      packetId: packet.packetId,
      packetBinding,
      requiredQuorum: packet.workerCount,
      startedAt,
      exitCode: 2,
      reason: (error as Error).message,
      evidenceRefs: [
        ...(preflight ? [
          preflight.catalogEvidenceRef,
          preflight.computerUseBinaryEvidenceRef,
        ] : []),
        ...(checkpoint?.evidenceRefs ?? []),
        ...discoveredEvidenceRefs,
      ],
    });
    process.stderr.write(`${(error as Error).message}\nReport: ${path.join(runDirectory, 'report.md')}\n`);
    return 2;
  } finally {
    await server?.close();
  }
};
