import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BrowserContext, ConsoleMessage, Dialog, Page, Request, Response } from 'playwright';

import type {
  PlaytestGateProbeResultV2,
  PlaytestGateProbeTimelineEntryV2,
} from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import type { CompletedComputerUseCall } from './transcript.ts';
import type { ObserverCaptureSyncRequest } from './observerSync.ts';

interface RenderedProbe {
  probeId: string;
  state: 'met' | 'unmet' | 'unavailable';
  acceptanceEligible: boolean;
  reason: string;
}

interface RenderedObservation {
  capturedAt: string;
  gateRun: string | null;
  runtime: null | {
    mission: string;
    pauseOwners: string[];
    playerPosition: { x: number; y: number };
    [key: string]: unknown;
  };
  probes: RenderedProbe[];
  feedbackId?: string | null;
  transitionIds?: string[];
}

interface ObserverActionStateEvidence {
  stateSha256: string;
  progressSha256: string;
  probeSha256: string;
  screenshotRef: string;
  screenshotSha256: string;
  captureCallId: string;
  captureResultSha256: string;
}

const OBSERVER_OPERATION_TIMEOUT_MS = 10_000;
const OBSERVER_TRACE_STOP_TIMEOUT_MS = 30_000;
export const PLAYTEST_TRACE_OPTIONS = {
  // Milestone and action-cycle screenshots are captured explicitly. Keeping
  // Playwright DOM/canvas snapshots here made a short run exceed 800 MB and
  // prevented trace finalization.
  screenshots: false,
  snapshots: false,
  sources: false,
} as const;

const withObserverTimeout = async <T>(
  operation: Promise<T>,
  label: string,
  timeoutMs = OBSERVER_OPERATION_TIMEOUT_MS
): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} exceeded ${timeoutMs}ms.`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const assertSynchronizedCaptureDigest = (
  proxyResultSha256: string,
  transcriptResultSha256: string
): void => {
  if (
    !/^[a-f\d]{64}$/i.test(proxyResultSha256) ||
    proxyResultSha256 !== transcriptResultSha256
  ) {
    throw new Error(
      'Computer Use capture transcript digest did not match its proxy-synchronized result.'
    );
  }
};

export interface ObserverActionCycleEvidence {
  actionId: string;
  actionTool: string;
  actionFingerprint: string;
  visibleTarget: string | null;
  beforeCaptureCallId: string;
  afterCaptureCallId: string;
  beforeCaptureResultSha256: string;
  afterCaptureResultSha256: string;
  beforeStateSha256: string;
  afterStateSha256: string;
  beforeScreenshotSha256: string;
  afterScreenshotSha256: string;
  progressChanged: boolean;
  probeChanged: boolean;
  evidenceRefs: string[];
}

export interface ObserverDiagnostics {
  console: string[];
  pageErrors: string[];
  network: string[];
  dialogs: string[];
  crashes: string[];
  toolingErrors: string[];
}

export interface ObserverResult {
  markerValid: boolean;
  targetValid: boolean;
  probeResults: PlaytestGateProbeResultV2[];
  probeTimeline: PlaytestGateProbeTimelineEntryV2[];
  evidenceRefs: string[];
  diagnostics: ObserverDiagnostics;
  observationOpened: boolean;
  observationResumed: boolean;
  fourBlockCoverageComplete: boolean;
  runtimeTransitionCount: number;
  stableUnmetPollCount: number;
  actionCycles: ObserverActionCycleEvidence[];
}

const safeProbeName = (probeId: string): string => probeId.replace(/[^a-z0-9]+/gi, '-');

const consoleLine = (message: ConsoleMessage): string =>
  `${message.type()}: ${message.text()}`;

const requestFailureLine = (request: Request): string =>
  `requestfailed ${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'unknown'}`;

const responseFailureLine = (response: Response): string =>
  `response ${response.status()} ${response.request().method()} ${response.url()}`;

const sha256 = (value: string | Buffer): string =>
  createHash('sha256').update(value).digest('hex');

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right, 'en'))
      .map(([key, entry]) => [key, canonicalize(entry)])
  );
};

const hashValue = (value: unknown): string => sha256(JSON.stringify(canonicalize(value)));

export const visibleTextProvesFourBlockCoverage = (visibleText: string): boolean =>
  /\bBLOCK COVERAGE 4\/4\b/i.test(visibleText) &&
  /\bALL FOUR BLOCKS VISITED\b/i.test(visibleText) &&
  /\bCITY COLLISION ROUTE COMPLETE\b/i.test(visibleText);

const visibleTargetForCall = (call: CompletedComputerUseCall): string | null => {
  if (call.tool === 'click') {
    const element = call.arguments.element_index ?? call.arguments.element_id;
    return typeof element === 'string' || typeof element === 'number'
      ? `element:${String(element)}`
      : null;
  }
  if (call.tool === 'press_key' && typeof call.arguments.key === 'string') {
    return `key:${call.arguments.key.toLowerCase()}`;
  }
  return null;
};

export class ReadOnlyPlaytestObserver {
  private readonly diagnostics: ObserverDiagnostics = {
    console: [],
    pageErrors: [],
    network: [],
    dialogs: [],
    crashes: [],
    toolingErrors: [],
  };
  private readonly probeStates = new Map<string, PlaytestGateProbeResultV2>();
  private readonly probeTimeline: PlaytestGateProbeTimelineEntryV2[] = [];
  private readonly evidenceRefs = new Set<string>();
  private readonly runtimeSignatures = new Set<string>();
  private stopped = false;
  private pollPromise: Promise<void> | undefined;
  private markerValid = true;
  private targetValid = true;
  private observationOpened = false;
  private observationResumed = false;
  private fourBlockCoverageComplete = false;
  private stableUnmetPollCount = 0;
  private pageCloseRecorded = false;
  private readonly actionCycles: ObserverActionCycleEvidence[] = [];
  private actionCaptureQueue: Promise<void> = Promise.resolve();
  private actionStateSequence = 0;
  private readonly synchronizedCaptureStates: ObserverActionStateEvidence[] = [];
  private lastActionState: ObserverActionStateEvidence | undefined;
  private pendingAction: {
    call: CompletedComputerUseCall;
    before: ObserverActionStateEvidence;
  } | undefined;

  constructor(
    private readonly context: BrowserContext,
    private readonly page: Page,
    private readonly marker: string,
    private readonly requiredProbeIds: readonly string[],
    private readonly workerDirectory: string
  ) {}

  async start(): Promise<void> {
    await mkdir(path.join(this.workerDirectory, 'screenshots'), { recursive: true });
    await mkdir(path.join(this.workerDirectory, 'action-cycles'), { recursive: true });
    this.page.on('console', this.onConsole);
    this.page.on('pageerror', this.onPageError);
    this.page.on('requestfailed', this.onRequestFailed);
    this.page.on('response', this.onResponse);
    this.page.on('dialog', this.onDialog);
    this.page.on('crash', this.onCrash);
    this.context.on('page', this.onNewPage);
    await this.context.tracing.start(PLAYTEST_TRACE_OPTIONS);
    await this.captureScreenshot('initial');
    this.pollPromise = this.pollLoop();
  }

  async stop(): Promise<ObserverResult> {
    this.stopped = true;
    this.context.off('page', this.onNewPage);
    await this.actionCaptureQueue;
    if (this.synchronizedCaptureStates.length > 0) {
      this.diagnostics.toolingErrors.push(
        `${this.synchronizedCaptureStates.length} synchronized observer capture(s) had no transcript completion.`
      );
      this.synchronizedCaptureStates.length = 0;
    }
    if (this.pendingAction) {
      this.diagnostics.toolingErrors.push(
        `action-cycle ${this.pendingAction.call.id}: terminal action has no observer capture.`
      );
      this.pendingAction = undefined;
    }
    await this.pollPromise;
    await this.captureScreenshot('final').catch((error: Error) => {
      this.diagnostics.toolingErrors.push(`final screenshot: ${error.message}`);
    });
    const tracePath = path.join(this.workerDirectory, 'trace.zip');
    try {
      await withObserverTimeout(
        this.context.tracing.stop({ path: tracePath }),
        'observer trace stop',
        OBSERVER_TRACE_STOP_TIMEOUT_MS
      );
      this.evidenceRefs.add('trace.zip');
    } catch (error) {
      this.diagnostics.toolingErrors.push(`trace: ${(error as Error).message}`);
    }
    await writeFile(
      path.join(this.workerDirectory, 'probe-timeline.json'),
      `${JSON.stringify(this.probeTimeline, null, 2)}\n`,
      'utf8'
    );
    await writeFile(
      path.join(this.workerDirectory, 'observer-diagnostics.json'),
      `${JSON.stringify(this.diagnostics, null, 2)}\n`,
      'utf8'
    );
    this.evidenceRefs.add('probe-timeline.json');
    this.evidenceRefs.add('observer-diagnostics.json');
    await writeFile(
      path.join(this.workerDirectory, 'action-cycles.json'),
      `${JSON.stringify(this.actionCycles, null, 2)}\n`,
      'utf8'
    );
    this.evidenceRefs.add('action-cycles.json');

    const probeResults = this.requiredProbeIds.map((probeId) => this.probeStates.get(probeId) ?? {
      probeId,
      state: 'unavailable' as const,
      acceptanceEligible: false,
      evidenceRefs: [],
    });
    return {
      markerValid: this.markerValid,
      targetValid: this.targetValid,
      probeResults,
      probeTimeline: [...this.probeTimeline],
      evidenceRefs: [...this.evidenceRefs].sort(),
      diagnostics: this.diagnostics,
      observationOpened: this.observationOpened,
      observationResumed: this.observationResumed,
      fourBlockCoverageComplete: this.fourBlockCoverageComplete,
      runtimeTransitionCount: Math.max(0, this.runtimeSignatures.size - 1),
      stableUnmetPollCount: this.stableUnmetPollCount,
      actionCycles: [...this.actionCycles],
    };
  }

  recordComputerUseCall(call: CompletedComputerUseCall): Promise<void> {
    const operation = this.actionCaptureQueue.then(() => this.recordComputerUseCallNow(call));
    this.actionCaptureQueue = operation.catch(() => undefined);
    return operation;
  }

  synchronizeComputerUseCapture(request: ObserverCaptureSyncRequest): Promise<void> {
    const operation = this.actionCaptureQueue.then(async () => {
      const state = await withObserverTimeout(
        this.captureActionState(
          request.token,
          request.captureResultSha256
        ),
        `observer synchronized capture ${request.sequence}`
      );
      this.synchronizedCaptureStates.push(state);
    });
    this.actionCaptureQueue = operation.catch(() => undefined);
    return operation;
  }

  private readonly onConsole = (message: ConsoleMessage): void => {
    if (message.type() === 'error' || message.type() === 'warning') {
      this.diagnostics.console.push(consoleLine(message));
    }
  };

  private readonly onPageError = (error: Error): void => {
    this.diagnostics.pageErrors.push(error.message);
  };

  private readonly onRequestFailed = (request: Request): void => {
    this.diagnostics.network.push(requestFailureLine(request));
  };

  private readonly onResponse = (response: Response): void => {
    if (response.status() >= 400) this.diagnostics.network.push(responseFailureLine(response));
  };

  private readonly onDialog = (dialog: Dialog): void => {
    this.diagnostics.dialogs.push(`${dialog.type()}: ${dialog.message()}`);
  };

  private readonly onCrash = (): void => {
    this.diagnostics.crashes.push('page-crashed');
  };

  private readonly onNewPage = (page: Page): void => {
    if (page !== this.page) this.targetValid = false;
  };

  private async recordComputerUseCallNow(call: CompletedComputerUseCall): Promise<void> {
    if (call.tool !== 'get_app_state') {
      if (this.lastActionState) {
        this.pendingAction = { call, before: this.lastActionState };
      }
      return;
    }

    const synchronizedState = this.synchronizedCaptureStates.shift();
    if (!synchronizedState) {
      throw new Error('Computer Use capture had no pre-action observer synchronization.');
    }
    assertSynchronizedCaptureDigest(
      synchronizedState.captureResultSha256,
      call.resultSha256
    );
    const after = {
      ...synchronizedState,
      captureCallId: call.id,
      captureResultSha256: call.resultSha256,
    };
    if (this.pendingAction) {
      const before = this.pendingAction.before;
      this.actionCycles.push({
        actionId: this.pendingAction.call.id,
        actionTool: this.pendingAction.call.tool,
        actionFingerprint: this.pendingAction.call.fingerprint,
        visibleTarget: visibleTargetForCall(this.pendingAction.call),
        beforeCaptureCallId: before.captureCallId,
        afterCaptureCallId: after.captureCallId,
        beforeCaptureResultSha256: before.captureResultSha256,
        afterCaptureResultSha256: after.captureResultSha256,
        beforeStateSha256: before.stateSha256,
        afterStateSha256: after.stateSha256,
        beforeScreenshotSha256: before.screenshotSha256,
        afterScreenshotSha256: after.screenshotSha256,
        progressChanged: before.progressSha256 !== after.progressSha256,
        probeChanged: before.probeSha256 !== after.probeSha256,
        evidenceRefs: [before.screenshotRef, after.screenshotRef],
      });
      this.pendingAction = undefined;
    }
    this.lastActionState = after;
  }

  private async captureActionState(
    captureCallId: string,
    captureResultSha256: string
  ): Promise<ObserverActionStateEvidence> {
    if (this.page.isClosed()) throw new Error('Assigned page closed during action-cycle capture.');
    const rendered = await this.page.evaluate<string | null>(
      'typeof window.render_game_to_text === "function" ? window.render_game_to_text() : null'
    );
    if (!rendered) throw new Error('Observation snapshot unavailable during action-cycle capture.');
    const observation = JSON.parse(rendered) as RenderedObservation;
    if (observation.gateRun !== this.marker) {
      throw new Error('Assigned browser marker changed during action-cycle capture.');
    }
    const { capturedAt: _capturedAt, ...stableObservation } = observation;
    const visibleText = await this.page.locator('body').innerText({
      timeout: OBSERVER_OPERATION_TIMEOUT_MS,
    });
    if (visibleTextProvesFourBlockCoverage(visibleText)) {
      this.fourBlockCoverageComplete = true;
    }
    const progress = {
      observation: stableObservation,
      visibleText,
    };
    const probes = observation.probes
      .filter((probe) => this.requiredProbeIds.includes(probe.probeId))
      .map((probe) => ({
        probeId: probe.probeId,
        state: probe.state,
        acceptanceEligible: probe.acceptanceEligible,
      }))
      .sort((left, right) => left.probeId.localeCompare(right.probeId, 'en'));
    const screenshotRef = `action-cycles/state-${String(++this.actionStateSequence).padStart(4, '0')}.png`;
    const screenshot = await this.page.screenshot({
      path: path.join(this.workerDirectory, screenshotRef),
      fullPage: false,
      timeout: OBSERVER_OPERATION_TIMEOUT_MS,
    });
    this.evidenceRefs.add(screenshotRef);
    const progressSha256 = hashValue(progress);
    const probeSha256 = hashValue(probes);
    return {
      stateSha256: hashValue({ progressSha256, probeSha256 }),
      progressSha256,
      probeSha256,
      screenshotRef,
      screenshotSha256: sha256(screenshot),
      captureCallId,
      captureResultSha256,
    };
  }

  private async pollLoop(): Promise<void> {
    while (!this.stopped) {
      await withObserverTimeout(this.pollOnce(), 'observer poll').catch((error: Error) => {
        this.diagnostics.toolingErrors.push(`observer: ${error.message}`);
      });
      if (!this.stopped) await new Promise((resolve) => setTimeout(resolve, 400));
    }
    await withObserverTimeout(this.pollOnce(), 'observer final poll').catch((error: Error) => {
      this.diagnostics.toolingErrors.push(`observer final poll: ${error.message}`);
    });
  }

  private async pollOnce(): Promise<void> {
    if (this.page.isClosed()) {
      this.targetValid = false;
      if (!this.pageCloseRecorded) {
        this.diagnostics.toolingErrors.push(
          'Assigned game page closed without attributable product-crash evidence.'
        );
        this.pageCloseRecorded = true;
      }
      return;
    }
    const rendered = await this.page.evaluate<string | null>(
      'typeof window.render_game_to_text === "function" ? window.render_game_to_text() : null'
    );
    if (!rendered) {
      this.stableUnmetPollCount += 1;
      return;
    }
    const observation = JSON.parse(rendered) as RenderedObservation;
    if (observation.gateRun !== this.marker) this.markerValid = false;
    const pauseOwners = observation.runtime?.pauseOwners ?? [];
    if (pauseOwners.includes('observation')) this.observationOpened = true;
    if (this.observationOpened && !pauseOwners.includes('observation')) {
      this.observationResumed = true;
    }
    if (observation.runtime) {
      this.runtimeSignatures.add(JSON.stringify({
        mission: observation.runtime.mission,
        playerPosition: observation.runtime.playerPosition,
        pauseOwners,
      }));
    }

    let requiredTransition = false;
    for (const probe of observation.probes) {
      if (!this.requiredProbeIds.includes(probe.probeId)) continue;
      const previous = this.probeStates.get(probe.probeId);
      const evidenceRefs = previous?.evidenceRefs ?? [];
      if (!previous || previous.state !== probe.state) {
        const timelineEntry: PlaytestGateProbeTimelineEntryV2 = {
          capturedAt: observation.capturedAt,
          probeId: probe.probeId,
          from: previous?.state ?? 'unavailable',
          to: probe.state,
          evidenceRefs: [],
        };
        if (probe.state === 'met' && probe.acceptanceEligible) {
          const screenshotRef = await this.captureScreenshot(
            `milestone-${safeProbeName(probe.probeId)}`
          );
          timelineEntry.evidenceRefs.push(screenshotRef);
          evidenceRefs.push(screenshotRef);
          requiredTransition = true;
        }
        this.probeTimeline.push(timelineEntry);
      }
      this.probeStates.set(probe.probeId, {
        probeId: probe.probeId,
        state: probe.state,
        acceptanceEligible: probe.acceptanceEligible,
        evidenceRefs: [...new Set(evidenceRefs)],
      });
    }
    if (requiredTransition) this.stableUnmetPollCount = 0;
    else if (this.requiredProbeIds.some((id) => this.probeStates.get(id)?.state !== 'met')) {
      this.stableUnmetPollCount += 1;
    }
  }

  private async captureScreenshot(name: string): Promise<string> {
    const reference = `screenshots/${name}.png`;
    await this.page.screenshot({
      path: path.join(this.workerDirectory, reference),
      fullPage: false,
      timeout: OBSERVER_OPERATION_TIMEOUT_MS,
    });
    this.evidenceRefs.add(reference);
    return reference;
  }
}
