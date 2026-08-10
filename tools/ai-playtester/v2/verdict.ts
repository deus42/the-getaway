import type {
  PlaytestGateInvariantResultV2,
  PlaytestGateProbeResultV2,
  PlaytestPacketInvariantV1,
} from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import type { TranscriptAudit } from './transcript.ts';
import type { AiGamerWorkerResponseV1 } from './workerResponse.ts';
import type { WorkerRegressionReproductionV1 } from './workerResponse.ts';
import type { ObserverActionCycleEvidence } from './observer.ts';

interface WorkerObserverEvidence {
  markerValid: boolean;
  targetValid: boolean;
  probeResults: PlaytestGateProbeResultV2[];
  diagnostics: {
    console: string[];
    pageErrors: string[];
    network: string[];
    dialogs: string[];
    crashes: string[];
    toolingErrors: string[];
  };
  observationOpened: boolean;
  observationResumed: boolean;
  fourBlockCoverageComplete: boolean;
  runtimeTransitionCount: number;
  stableUnmetPollCount: number;
  actionCycles: ObserverActionCycleEvidence[];
}

export interface ClassifyWorkerEvidenceInput {
  requiredInvariants: readonly PlaytestPacketInvariantV1[];
  response?: AiGamerWorkerResponseV1;
  responseError?: string;
  exitCode: number | null;
  timedOut: boolean;
  supervisorViolation?: string;
  transcriptAudit: TranscriptAudit;
  observer: WorkerObserverEvidence;
}

export interface ClassifiedWorkerEvidence {
  outcome: 'pass' | 'fail' | 'blocked';
  evidenceValid: boolean;
  integrityValid: boolean;
  reasons: string[];
  warnings: string[];
  invariantResults: PlaytestGateInvariantResultV2[];
}

const consoleErrors = (lines: readonly string[]): string[] =>
  lines.filter((line) => line.startsWith('error:'));

const isEvidenceBackedUnchangedCycle = (cycle: ObserverActionCycleEvidence): boolean =>
  !cycle.progressChanged &&
  !cycle.probeChanged &&
  cycle.beforeStateSha256 === cycle.afterStateSha256 &&
  cycle.beforeCaptureResultSha256 === cycle.afterCaptureResultSha256 &&
  cycle.beforeScreenshotSha256 === cycle.afterScreenshotSha256 &&
  /^[a-f\d]{64}$/i.test(cycle.beforeStateSha256) &&
  /^[a-f\d]{64}$/i.test(cycle.beforeCaptureResultSha256) &&
  /^[a-f\d]{64}$/i.test(cycle.afterCaptureResultSha256) &&
  /^[a-f\d]{64}$/i.test(cycle.beforeScreenshotSha256) &&
  /^[a-f\d]{64}$/i.test(cycle.afterScreenshotSha256) &&
  cycle.beforeCaptureCallId !== cycle.afterCaptureCallId &&
  new Set(cycle.evidenceRefs).size >= 2;

const provesRepeatedVisibleFailure = (
  cycles: readonly ObserverActionCycleEvidence[],
  attempts: number,
  reproduction: WorkerRegressionReproductionV1
): boolean => {
  const required = Math.max(2, attempts);
  const counts = new Map<string, number>();
  for (const cycle of cycles.filter((cycle) =>
    isEvidenceBackedUnchangedCycle(cycle) &&
    cycle.actionTool === reproduction.tool &&
    cycle.visibleTarget === reproduction.target
  )) {
    const contextKey = [
      cycle.actionFingerprint,
      cycle.beforeStateSha256,
      cycle.beforeCaptureResultSha256,
      cycle.beforeScreenshotSha256,
    ].join('\0');
    counts.set(contextKey, (counts.get(contextKey) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= required);
};

const provesRepeatedIncorrectTransition = (
  cycles: readonly ObserverActionCycleEvidence[],
  attempts: number,
  reproduction: WorkerRegressionReproductionV1
): boolean => {
  const required = Math.max(2, attempts);
  const counts = new Map<string, number>();
  for (const cycle of cycles.filter((candidate) =>
    candidate.actionTool === reproduction.tool &&
    candidate.visibleTarget === reproduction.target &&
    (candidate.progressChanged || candidate.probeChanged) &&
    candidate.beforeStateSha256 !== candidate.afterStateSha256 &&
    candidate.beforeCaptureResultSha256 !== candidate.afterCaptureResultSha256 &&
    candidate.beforeScreenshotSha256 !== candidate.afterScreenshotSha256 &&
    /^[a-f\d]{64}$/i.test(candidate.beforeStateSha256) &&
    /^[a-f\d]{64}$/i.test(candidate.afterStateSha256) &&
    /^[a-f\d]{64}$/i.test(candidate.beforeCaptureResultSha256) &&
    /^[a-f\d]{64}$/i.test(candidate.afterCaptureResultSha256) &&
    /^[a-f\d]{64}$/i.test(candidate.beforeScreenshotSha256) &&
    /^[a-f\d]{64}$/i.test(candidate.afterScreenshotSha256) &&
    candidate.beforeCaptureCallId !== candidate.afterCaptureCallId &&
    new Set(candidate.evidenceRefs).size >= 2
  )) {
    const contextKey = [
      cycle.actionFingerprint,
      cycle.beforeStateSha256,
      cycle.beforeCaptureResultSha256,
      cycle.beforeScreenshotSha256,
      cycle.afterStateSha256,
      cycle.afterCaptureResultSha256,
      cycle.afterScreenshotSha256,
    ].join('\0');
    counts.set(contextKey, (counts.get(contextKey) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= required);
};

const evaluateInvariant = (
  invariant: PlaytestPacketInvariantV1,
  input: ClassifyWorkerEvidenceInput
): PlaytestGateInvariantResultV2 => {
  const result = (met: boolean, evidenceRefs: string[]): PlaytestGateInvariantResultV2 => ({
    invariantId: invariant.id,
    state: met ? 'met' : 'unmet',
    acceptanceEligible: met,
    evidenceRefs,
  });
  switch (invariant.id) {
    case 'window-marker':
      return result(input.observer.markerValid, ['trace.zip']);
    case 'capture-before-action':
    case 'visible-inputs-only':
      return result(input.transcriptAudit.valid, ['worker-transcript-summary.json']);
    case 'no-runtime-errors':
      return result(
        input.observer.diagnostics.pageErrors.length === 0 &&
        input.observer.diagnostics.crashes.length === 0 &&
        consoleErrors(input.observer.diagnostics.console).length === 0,
        ['trace.zip']
      );
    case 'observation-exercised':
      return result(
        input.observer.observationOpened && input.observer.observationResumed,
        ['trace.zip']
      );
    case 'four-block-coverage':
      return result(input.observer.fourBlockCoverageComplete, ['trace.zip']);
    default:
      return {
        invariantId: invariant.id,
        state: 'unavailable',
        acceptanceEligible: false,
        evidenceRefs: [],
      };
  }
};

export const classifyWorkerEvidence = (
  input: ClassifyWorkerEvidenceInput
): ClassifiedWorkerEvidence => {
  const invariantResults = input.requiredInvariants.map((invariant) =>
    evaluateInvariant(invariant, input)
  );
  if (input.supervisorViolation) {
    return {
      outcome: 'blocked',
      evidenceValid: false,
      integrityValid: false,
      reasons: [input.supervisorViolation],
      warnings: [],
      invariantResults,
    };
  }

  const integrityReasons = [
    ...input.transcriptAudit.blockingReasons,
    ...(input.observer.markerValid ? [] : ['Assigned browser marker did not remain valid.']),
    ...(input.observer.targetValid ? [] : ['Assigned browser target became ambiguous.']),
    ...input.observer.diagnostics.dialogs.map((dialog) =>
      `Permission or browser dialog blocked the run: ${dialog}`
    ),
  ];
  if (!input.transcriptAudit.valid || integrityReasons.length > 0) {
    return {
      outcome: 'blocked',
      evidenceValid: false,
      integrityValid: false,
      reasons: [...new Set(integrityReasons)],
      warnings: [],
      invariantResults,
    };
  }

  const operationalReasons = [
    ...(input.timedOut ? ['Worker timed out without unambiguous product evidence.'] : []),
    ...(input.exitCode === 0 ? [] : [`Worker exited with code ${input.exitCode ?? 'unavailable'}.`]),
    ...(input.responseError ? [input.responseError] : []),
    ...(input.response ? [] : ['Worker produced no structured verdict.']),
    ...input.observer.diagnostics.toolingErrors.map((error) =>
      `Observer tooling failure: ${error}`
    ),
  ];
  if (operationalReasons.length > 0) {
    return {
      outcome: 'blocked',
      evidenceValid: false,
      integrityValid: true,
      reasons: operationalReasons,
      warnings: [],
      invariantResults,
    };
  }

  const response = input.response;
  if (!response) {
    throw new Error('Unreachable worker-response classification state.');
  }
  const warnings = [
    ...response.warnings,
    ...input.observer.diagnostics.console.filter((line) => line.startsWith('warning:')),
    ...input.observer.diagnostics.network,
  ];
  if (response.outcome === 'blocked') {
    return {
      outcome: 'blocked',
      evidenceValid: false,
      integrityValid: true,
      reasons: [response.blocker ?? 'Worker reported an unspecified blocker.'],
      warnings,
      invariantResults,
    };
  }

  if (response.outcome === 'fail' && response.regression) {
    const directCrashEvidence =
      response.regression.kind === 'crash' &&
      input.observer.diagnostics.crashes.includes('page-crashed');
    const repeatedVisibleFailure =
      (
        response.regression.kind === 'softlock' ||
        response.regression.kind === 'visible-input-failure'
      ) &&
      response.regression.reproduction !== null &&
      provesRepeatedVisibleFailure(
        input.observer.actionCycles,
        response.regression.attempts,
        response.regression.reproduction
      );
    const repeatedIncorrectTransition =
      response.regression.kind === 'incorrect-transition' &&
      response.regression.reproduction !== null &&
      provesRepeatedIncorrectTransition(
        input.observer.actionCycles,
        response.regression.attempts,
        response.regression.reproduction
      );
    if (directCrashEvidence || repeatedVisibleFailure || repeatedIncorrectTransition) {
      return {
        outcome: 'fail',
        evidenceValid: true,
        integrityValid: true,
        reasons: directCrashEvidence
          ? ['Observer recorded a renderer crash on the assigned game page.']
          : [response.regression.observed],
        warnings,
        invariantResults,
      };
    }
    return {
      outcome: 'blocked',
      evidenceValid: false,
      integrityValid: true,
      reasons: ['Worker reported a regression, but observer evidence did not prove it.'],
      warnings,
      invariantResults,
    };
  }

  const unmetProbes = input.observer.probeResults
    .filter((probe) => probe.state !== 'met' || !probe.acceptanceEligible)
    .map((probe) => probe.probeId);
  const passBlockers = [
    ...(response.visibleGoalMet ? [] : ['Worker did not prove the visible goal.']),
    ...(unmetProbes.length === 0 ? [] : [`Required probes are unproven: ${unmetProbes.join(', ')}.`]),
    ...(invariantResults.every((invariant) => invariant.state === 'met' && invariant.acceptanceEligible)
      ? []
      : [`Required invariants are unproven: ${invariantResults
        .filter((invariant) => invariant.state !== 'met' || !invariant.acceptanceEligible)
        .map((invariant) => invariant.invariantId)
        .join(', ')}.`]),
    ...input.observer.diagnostics.pageErrors.map((error) => `Page error: ${error}`),
    ...input.observer.diagnostics.crashes.map((crash) => `Page failure: ${crash}`),
    ...consoleErrors(input.observer.diagnostics.console).map((error) => `Console error: ${error}`),
  ];
  if (passBlockers.length > 0) {
    return {
      outcome: 'blocked',
      evidenceValid: false,
      integrityValid: true,
      reasons: passBlockers,
      warnings,
      invariantResults,
    };
  }
  return {
    outcome: 'pass',
    evidenceValid: true,
    integrityValid: true,
    reasons: [],
    warnings,
    invariantResults,
  };
};
