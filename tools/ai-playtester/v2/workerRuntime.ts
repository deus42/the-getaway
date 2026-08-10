import { execFile, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  appendFile,
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import type { PlaytestPacketComputerUsePolicyV1 } from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import {
  validateOwnedBrowserProcessSnapshot,
  type BrowserAppName,
} from './browser.ts';
import { attestComputerUseBinary } from './computerUseIntegrity.ts';
import { parsePinnedModelCatalog, type PinnedModelCatalogEvidence } from './modelCatalog.ts';
import { reportRoot, workerResponseSchemaSource } from './paths.ts';
import {
  createObserverCaptureSyncRequest,
  type ObserverCaptureSyncRequest,
} from './observerSync.ts';
import {
  createComputerUseSupervisorLedgerEntry,
  reconcileComputerUseSupervisorLedger,
  type SupervisorLedgerCallBinding,
} from './supervisorLedger.ts';
import {
  parseCodexExecRuntimeAttestation,
  parseCodexRuntimeAttestation,
  type CodexExecRuntimeAttestation,
  type CodexRuntimeAttestation,
} from './runtimeAttestation.ts';
import {
  auditWorkerTranscript,
  parseCompletedComputerUseCall,
  type CompletedComputerUseCall,
  type TranscriptAudit,
} from './transcript.ts';
import {
  buildWorkerInvocation,
  CODEX_COMMAND,
  CODEX_MODEL,
  DISABLED_WORKER_FEATURES,
} from './worker.ts';
import {
  parseWorkerResponse,
  type AiGamerWorkerResponseV1,
} from './workerResponse.ts';

const execFileAsync = promisify(execFile);

export const resolveCodexAuthSource = (
  input: {
    environment?: Readonly<{ CODEX_HOME?: string }>;
    userHome?: string;
  } = {}
): string => {
  const codexHome = (input.environment ?? process.env).CODEX_HOME?.trim();
  const sourceRoot = codexHome
    ? path.resolve(codexHome)
    : path.join(input.userHome ?? homedir(), '.codex');
  return path.join(sourceRoot, 'auth.json');
};

const sha256 = (value: string | Buffer): string =>
  createHash('sha256').update(value).digest('hex');

export interface CodexPreflightEvidence {
  codexVersion: string;
  model: PinnedModelCatalogEvidence;
  catalogEvidenceRef: string;
  computerUseBinaryEvidenceRef: string;
}

export interface RawWorkerExecution {
  workerId: string;
  browserApp: BrowserAppName;
  marker: string;
  response?: AiGamerWorkerResponseV1;
  responseError?: string;
  transcriptAudit: TranscriptAudit;
  transcriptSha256: string;
  transcriptRef: string;
  transcriptSummaryRef: string;
  stderrRef: string;
  exitCode: number | null;
  timedOut: boolean;
  supervisorViolation?: string;
  runtimeAttestation: CodexExecRuntimeAttestation;
  runtimeAttestationRef: string;
  browserTargetAttestationRef: string;
  computerUseLedgerRef: string;
}

export const runCodexPreflight = async (
  runDirectory: string
): Promise<CodexPreflightEvidence> => {
  const [versionResult, catalogResult, computerUseBinary] = await Promise.all([
    execFileAsync(CODEX_COMMAND, ['--version'], { maxBuffer: 1024 * 1024 }),
    execFileAsync(CODEX_COMMAND, ['debug', 'models'], { maxBuffer: 32 * 1024 * 1024 }),
    attestComputerUseBinary(runDirectory),
  ]);
  const codexVersion = versionResult.stdout.trim();
  if (!codexVersion) throw new Error('Codex CLI returned no version evidence.');
  if (versionResult.stderr.trim() || catalogResult.stderr.trim()) {
    const warningText = `${versionResult.stderr}\n${catalogResult.stderr}`.trim();
    if (/\bwarn(?:ing)?\b|fallback|unavailable|unsupported/i.test(warningText)) {
      throw new Error(`Codex model/config preflight warning: ${warningText}`);
    }
  }
  const model = parsePinnedModelCatalog(catalogResult.stdout);
  const catalogEvidenceRef = 'model-catalog.json';
  const catalogEvidencePath = path.join(runDirectory, catalogEvidenceRef);
  await writeFile(
    catalogEvidencePath,
    `${JSON.stringify({
      codexVersion,
      requestedModel: CODEX_MODEL,
      requestedReasoningEffort: 'high',
      selected: model,
      rawCatalogSha256: sha256(catalogResult.stdout),
    }, null, 2)}\n`,
    'utf8'
  );
  await chmod(catalogEvidencePath, 0o600);
  return {
    codexVersion,
    model,
    catalogEvidenceRef,
    computerUseBinaryEvidenceRef: computerUseBinary.evidenceRef,
  };
};

const waitForExit = (
  child: ChildProcessWithoutNullStreams
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> =>
  new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });

export const waitForWorkerExitWithDeadline = async <T>(
  exit: Promise<T>,
  deadlineMs: number
): Promise<T> => {
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0) {
    throw new Error('Worker exit cleanup deadline is invalid.');
  }
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      exit,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Codex worker did not exit within its cleanup deadline.')),
          deadlineMs
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const closeReleaseSafeWorkerBrowsers = async <T extends {
  close(): Promise<void>;
}>(
  browsers: readonly T[],
  releaseSafe: readonly boolean[]
): Promise<number[]> => {
  if (browsers.length !== releaseSafe.length) {
    throw new Error('Worker browser release-safety state is incomplete.');
  }
  const quarantined: number[] = [];
  for (let index = 0; index < browsers.length; index += 1) {
    if (!releaseSafe[index]) {
      quarantined.push(index);
      continue;
    }
    await browsers[index].close();
  }
  return quarantined;
};

const processGroupExists = (processGroupId: number): boolean => {
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
};

const signalProcessGroup = (processGroupId: number, signal: NodeJS.Signals): void => {
  try {
    process.kill(-processGroupId, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
  }
};

export const stopOwnedWorkerProcessGroup = async (
  processGroupId: number,
  graceMs = 2_000
): Promise<void> => {
  if (!Number.isSafeInteger(processGroupId) || processGroupId <= 0) {
    throw new Error('Owned worker process group ID is invalid.');
  }
  if (!processGroupExists(processGroupId)) return;
  signalProcessGroup(processGroupId, 'SIGCONT');
  signalProcessGroup(processGroupId, 'SIGTERM');
  const termDeadline = Date.now() + graceMs;
  while (processGroupExists(processGroupId) && Date.now() < termDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  if (processGroupExists(processGroupId)) signalProcessGroup(processGroupId, 'SIGKILL');
  const killDeadline = Date.now() + graceMs;
  while (processGroupExists(processGroupId) && Date.now() < killDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  if (processGroupExists(processGroupId)) {
    throw new Error('Owned Codex/MCP process group still has live descendants after SIGKILL.');
  }
};

const terminateOwnedWorker = (child: ChildProcessWithoutNullStreams): void => {
  if (!child.pid) return;
  signalProcessGroup(child.pid, 'SIGCONT');
  signalProcessGroup(child.pid, 'SIGTERM');
  const forceTimer = setTimeout(() => {
    if (child.pid && processGroupExists(child.pid)) {
      signalProcessGroup(child.pid, 'SIGKILL');
    }
  }, 2_000);
  forceTimer.unref();
};

const immediateBlockingReasons = (audit: TranscriptAudit): string[] =>
  audit.blockingReasons.filter((reason) =>
    !reason.includes('must be followed by get_app_state') &&
    reason !== 'Transcript contains no Computer Use observation.'
  );

const modelOrConfigWarning = (line: string): boolean => {
  const warning = /\bwarn(?:ing)?\b/i.test(line);
  const sensitiveTopic = /\b(model|reasoning|config(?:uration)?)\b/i.test(line);
  const fallback = /\b(model|reasoning)\b.*\b(fallback|unavailable|unsupported|not found)\b/i.test(line);
  return (warning && sensitiveTopic) || fallback;
};

const requestRuntimeAttestation = async (input: {
  workerHome: string;
  workerCwd: string;
  env: Record<string, string>;
}): Promise<{ response: unknown; stderr: string }> => {
  const args = [
    'app-server',
    '--listen',
    'stdio://',
    '--strict-config',
    '-c',
    `model="${CODEX_MODEL}"`,
    '-c',
    'model_provider="openai"',
    '-c',
    'model_reasoning_effort="high"',
    '-c',
    'approval_policy="never"',
    '-c',
    'history.persistence="none"',
    '-c',
    'web_search="disabled"',
    '-c',
    'tools.web_search=false',
  ];
  for (const feature of DISABLED_WORKER_FEATURES) args.push('--disable', feature);

  const child = spawn(CODEX_COMMAND, args, {
    cwd: input.workerCwd,
    env: input.env,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true,
  });
  let stdoutBuffer = '';
  let stderr = '';
  let response: unknown;
  let protocolError: Error | undefined;
  let initialized = false;
  const send = (value: unknown): void => {
    child.stdin.write(`${JSON.stringify(value)}\n`);
  };
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  child.stdout.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString();
    for (;;) {
      const newlineIndex = stdoutBuffer.indexOf('\n');
      if (newlineIndex < 0) break;
      const line = stdoutBuffer.slice(0, newlineIndex).trim();
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
      if (!line) continue;
      try {
        const message = JSON.parse(line) as { id?: number; error?: unknown };
        if (message.id === 1 && !initialized) {
          if (message.error) throw new Error('Codex app-server rejected initialization.');
          initialized = true;
          send({
            jsonrpc: '2.0',
            id: 2,
            method: 'thread/start',
            params: {
              model: CODEX_MODEL,
              cwd: input.workerCwd,
              approvalPolicy: 'never',
              sandbox: 'read-only',
              ephemeral: true,
              allowProviderModelFallback: false,
              config: { model_reasoning_effort: 'high' },
              environments: [],
              dynamicTools: [],
              selectedCapabilityRoots: [],
            },
          });
        } else if (message.id === 2) {
          response = message;
          child.stdin.end();
          child.kill('SIGTERM');
        }
      } catch (error) {
        protocolError = error as Error;
        child.kill('SIGTERM');
      }
    }
  });
  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      clientInfo: { name: 'get179-ai-gamer', title: 'GET-179 AI Gamer', version: '1' },
      capabilities: { experimentalApi: true },
    },
  });

  const timeout = setTimeout(() => {
    try {
      if (child.pid) signalProcessGroup(child.pid, 'SIGKILL');
    } catch (error) {
      protocolError ??= error as Error;
    }
  }, 10_000);
  try {
    await waitForWorkerExitWithDeadline(waitForExit(child), 15_000);
  } finally {
    clearTimeout(timeout);
    if (child.pid) await stopOwnedWorkerProcessGroup(child.pid, 1_000);
  }
  if (protocolError) throw protocolError;
  if (!response) throw new Error('Codex runtime model attestation produced no response.');
  const sensitiveWarnings = stderr.split(/\r?\n/).filter(modelOrConfigWarning);
  if (sensitiveWarnings.length > 0) {
    throw new Error(`Codex runtime model attestation warning: ${sensitiveWarnings.join(' ')}`);
  }
  return { response, stderr };
};

const attestWorkerRuntimeConfiguration = async (input: {
  workerHome: string;
  workerCwd: string;
  workerDirectory: string;
  env: Record<string, string>;
}): Promise<{
  attestation: CodexRuntimeAttestation;
  appServerResponseSha256: string;
}> => {
  const runtime = await requestRuntimeAttestation(input);
  const appServerResponseSha256 = sha256(JSON.stringify(runtime.response));
  let attestation: CodexRuntimeAttestation;
  try {
    attestation = parseCodexRuntimeAttestation(runtime.response, {
      workerCwd: input.workerCwd,
      providerModelFallbackAllowed: false,
    });
  } catch (error) {
    await writeFile(
      path.join(input.workerDirectory, 'worker-runtime-configuration-failure.json'),
      `${JSON.stringify({
        schema: 'codex_runtime_configuration_failure_v1',
        reason: (error as Error).message,
        appServerResponseSha256,
        response: runtime.response,
      }, null, 2)}\n`,
      'utf8'
    );
    throw error;
  }
  await writeFile(
    path.join(input.workerDirectory, 'worker-runtime-configuration.json'),
    `${JSON.stringify({
      ...attestation,
      configuredAt: new Date().toISOString(),
      appServerResponseSha256,
    }, null, 2)}\n`,
    'utf8'
  );
  return { attestation, appServerResponseSha256 };
};

const attestActualWorkerRuntime = async (input: {
  workerHome: string;
  workerCwd: string;
  workerDirectory: string;
  jsonl: string;
  configuration: CodexRuntimeAttestation;
  appServerResponseSha256: string;
  codexVersion: string;
  lifecycle: 'paused-live-worker' | 'post-exit-fallback';
}): Promise<{ attestation: CodexExecRuntimeAttestation; reference: string }> => {
  const stateDatabase = path.join(input.workerHome, 'state_5.sqlite');
  let stateRows: unknown[] = [];
  let stateQuerySha256 = sha256('');
  let rolloutSha256 = sha256('');
  let rolloutPathEvidence: Record<string, string> | undefined;
  try {
    const query = [
      'SELECT id, model_provider, model, reasoning_effort, cwd, source,',
      'cli_version, rollout_path',
      'FROM threads',
      "WHERE source = 'exec'",
      'ORDER BY created_at_ms, id;',
    ].join(' ');
    const result = await execFileAsync(
      '/usr/bin/sqlite3',
      ['-readonly', '-json', stateDatabase, query],
      { maxBuffer: 16 * 1024 * 1024 }
    );
    if (result.stderr.trim()) {
      throw new Error(`sqlite3 emitted stderr: ${result.stderr.trim()}`);
    }
    const rows = JSON.parse(result.stdout || '[]') as unknown;
    if (!Array.isArray(rows)) throw new Error('Codex worker log query returned no JSON array.');
    stateRows = rows;
    stateQuerySha256 = sha256(result.stdout);
    const state = stateRows.length === 1 && stateRows[0] &&
      typeof stateRows[0] === 'object' && !Array.isArray(stateRows[0])
      ? stateRows[0] as Record<string, unknown>
      : undefined;
    const rolloutPath = typeof state?.rollout_path === 'string'
      ? path.resolve(state.rollout_path)
      : '';
    if (!rolloutPath) {
      throw new Error('Codex worker state did not point to its disposable rollout.');
    }
    const [resolvedWorkerCwd, resolvedSessionsRoot, resolvedRolloutPath] = await Promise.all([
      realpath(input.workerCwd),
      realpath(path.join(input.workerHome, 'sessions')),
      realpath(rolloutPath),
    ]);
    rolloutPathEvidence = {
      stateRolloutPath: rolloutPath,
      resolvedWorkerCwd,
      resolvedSessionsRoot,
      resolvedRolloutPath,
    };
    const rolloutRelativePath = path.relative(resolvedSessionsRoot, resolvedRolloutPath);
    if (
      !rolloutRelativePath ||
      rolloutRelativePath === '..' ||
      rolloutRelativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(rolloutRelativePath)
    ) {
      throw new Error('Codex worker state did not point to its disposable rollout.');
    }
    const rolloutJsonl = await readFile(resolvedRolloutPath, 'utf8');
    rolloutSha256 = sha256(rolloutJsonl);
    const attestation = parseCodexExecRuntimeAttestation({
      jsonl: input.jsonl,
      stateRows,
      rolloutJsonl,
      configuration: input.configuration,
      actualStateSha256: stateQuerySha256,
      actualRolloutSha256: rolloutSha256,
      workerHome: input.workerHome,
      workerCwd: input.workerCwd,
      resolvedWorkerCwd,
      resolvedSessionsRoot,
      resolvedRolloutPath,
      codexVersion: input.codexVersion,
    });
    const reference = 'worker-runtime-attestation.json';
    await writeFile(
      path.join(input.workerDirectory, reference),
      `${JSON.stringify({
        ...attestation,
        attestedAt: new Date().toISOString(),
        lifecycle: input.lifecycle,
        appServerResponseSha256: input.appServerResponseSha256,
      }, null, 2)}\n`,
      'utf8'
    );
    return { attestation, reference };
  } catch (error) {
    await writeFile(
      path.join(input.workerDirectory, 'worker-runtime-attestation-failure.json'),
      `${JSON.stringify({
        schema: 'codex_exec_runtime_attestation_failure_v1',
        reason: (error as Error).message,
        actualStateSha256: stateQuerySha256,
        actualRolloutSha256: rolloutSha256,
        rolloutPathEvidence,
        lifecycle: input.lifecycle,
        stateRowCount: stateRows.length,
        configuration: input.configuration,
        appServerResponseSha256: input.appServerResponseSha256,
      }, null, 2)}\n`,
      'utf8'
    );
    throw new Error(`Actual Codex worker runtime attestation failed: ${(error as Error).message}`);
  }
};

interface ExecuteCodexWorkerInput {
  workerId: string;
  browserApp: BrowserAppName;
  marker: string;
  browserExecutablePath: string;
  browserProfileDirectory: string;
  browserRootPid: number;
  prompt: string;
  budgetMs: number;
  workerDirectory: string;
  computerUsePolicy: PlaytestPacketComputerUsePolicyV1;
  codexVersion: string;
  onComputerUseCall: (call: CompletedComputerUseCall) => Promise<void>;
  onSynchronizedComputerUseCapture: (
    request: ObserverCaptureSyncRequest
  ) => Promise<void>;
  onBrowserReleaseSafetyChange?: (releaseSafe: boolean) => void;
}

const executeCodexWorkerInIsolation = async (
  input: ExecuteCodexWorkerInput & { isolationRoot: string }
): Promise<RawWorkerExecution> => {
  const isolationRoot = input.isolationRoot;
  const workerHome = path.join(isolationRoot, 'home');
  const workerCwd = path.join(isolationRoot, 'workspace');
  await mkdir(workerHome, { recursive: true });
  await mkdir(workerCwd, { recursive: true });
  const authTarget = path.join(workerHome, 'auth.json');
  const outputSchemaPath = path.join(workerHome, 'response.schema.json');
  const outputPath = path.join(workerHome, 'response.json');
  const computerUseLedgerRef = 'computer-use-ledger.jsonl';
  const computerUseLedgerPath = path.join(input.workerDirectory, computerUseLedgerRef);
  const observerSyncSecret = randomBytes(32).toString('hex');
  const browserTargetAttestationRef = 'browser-target-attestation.json';
  await copyFile(resolveCodexAuthSource(), authTarget);
  await chmod(authTarget, 0o600);
  await copyFile(workerResponseSchemaSource, outputSchemaPath);
  await writeFile(computerUseLedgerPath, '', { encoding: 'utf8', mode: 0o600 });
  await chmod(computerUseLedgerPath, 0o600);

  const invocation = buildWorkerInvocation({
    workerHome,
    workerCwd,
    outputSchemaPath,
    outputPath,
    computerUsePolicy: input.computerUsePolicy,
  });
  await writeFile(
    path.join(input.workerDirectory, browserTargetAttestationRef),
    `${JSON.stringify({
      schema: 'browser_target_attestation_v1',
      app: input.browserApp,
      marker: input.marker,
      executablePath: input.browserExecutablePath,
      profileDirectorySha256: sha256(input.browserProfileDirectory),
      rootPid: input.browserRootPid,
    }, null, 2)}\n`,
    'utf8'
  );
  const runtimeConfiguration = await attestWorkerRuntimeConfiguration({
    workerHome,
    workerCwd,
    workerDirectory: input.workerDirectory,
    env: invocation.env,
  });
  const transcriptRef = 'worker.jsonl';
  const transcriptSummaryRef = 'worker-transcript-summary.json';
  const stderrRef = 'worker.stderr.log';
  const transcriptPath = path.join(input.workerDirectory, transcriptRef);
  const stderrPath = path.join(input.workerDirectory, stderrRef);
  let jsonl = '';
  let completeJsonl = '';
  let stderr = '';
  let timedOut = false;
  let supervisorViolation: string | undefined;

  input.onBrowserReleaseSafetyChange?.(false);
  const child = spawn(invocation.command, invocation.args, {
    cwd: workerCwd,
    env: invocation.env,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true,
  });

  const supervise = (): void => {
    const audit = auditWorkerTranscript({
      jsonl: completeJsonl,
      stderr,
      expectedBrowserApp: input.browserApp,
      expectedMarker: input.marker,
      allowedComputerUseActions: input.computerUsePolicy.actionTools,
      allowedPlayerKeys: input.computerUsePolicy.keys,
      complete: false,
    });
    const blocking = immediateBlockingReasons(audit);
    if (blocking.length > 0 && !supervisorViolation) {
      supervisorViolation = blocking.join(' ');
      terminateOwnedWorker(child);
    }
  };

  let observerCallQueue: Promise<void> = Promise.resolve();
  let runtimeAttestationPromise: ReturnType<typeof attestActualWorkerRuntime> | undefined;
  let supervisorCallSequence = 0;
  let observerCaptureSequence = 0;
  let captureSynchronizationPending = false;
  let workerPausedForObserverSync = false;

  const resumeWorkerAfterObserverSync = (): void => {
    if (!workerPausedForObserverSync || !child.pid) return;
    workerPausedForObserverSync = false;
    signalProcessGroup(child.pid, 'SIGCONT');
  };

  const verifyBrowserOwnership = async (): Promise<void> => {
    const processList = await execFileAsync('/bin/ps', ['-axo', 'pid=,command='], {
      maxBuffer: 4 * 1024 * 1024,
    });
    const ownership = validateOwnedBrowserProcessSnapshot(processList.stdout, {
      executablePath: input.browserExecutablePath,
      profileDirectory: input.browserProfileDirectory,
      rootPid: input.browserRootPid,
    });
    if (!ownership.valid) {
      throw new Error(ownership.reason ?? 'assigned browser ownership changed');
    }
  };

  const queueObserverCall = (call: CompletedComputerUseCall): void => {
    const sequence = ++supervisorCallSequence;
    const isCapture = call.tool === 'get_app_state';
    if (isCapture) {
      captureSynchronizationPending = true;
      if (child.pid) {
        signalProcessGroup(child.pid, 'SIGSTOP');
        workerPausedForObserverSync = true;
      }
    }
    observerCallQueue = observerCallQueue
      .then(async () => {
        let observerSynchronized = false;
        try {
          await verifyBrowserOwnership();
          if (isCapture) {
            runtimeAttestationPromise ??= attestActualWorkerRuntime({
              workerHome,
              workerCwd,
              workerDirectory: input.workerDirectory,
              jsonl: completeJsonl,
              configuration: runtimeConfiguration.attestation,
              appServerResponseSha256: runtimeConfiguration.appServerResponseSha256,
              codexVersion: input.codexVersion,
              lifecycle: 'paused-live-worker',
            });
            await runtimeAttestationPromise;
            const captureRequest = createObserverCaptureSyncRequest({
              secret: observerSyncSecret,
              sequence: ++observerCaptureSequence,
              token: randomUUID(),
              captureResultSha256: call.resultSha256,
            });
            await input.onSynchronizedComputerUseCapture(captureRequest);
            observerSynchronized = true;
          }
          await input.onComputerUseCall(call);
          await appendFile(
            computerUseLedgerPath,
            `${JSON.stringify({
              capturedAt: new Date().toISOString(),
              ...createComputerUseSupervisorLedgerEntry({
                sequence,
                call,
                observerSynchronized,
                browserOwnershipVerified: true,
              }),
            })}\n`,
            'utf8'
          );
        } finally {
          if (isCapture) {
            captureSynchronizationPending = false;
            resumeWorkerAfterObserverSync();
          }
        }
      })
      .catch((error: Error) => {
        if (!supervisorViolation) {
          supervisorViolation = `Computer Use supervisor capture failed: ${error.message}`;
          terminateOwnedWorker(child);
        }
      });
  };

  const parseObserverCall = (line: string): CompletedComputerUseCall | undefined =>
    parseCompletedComputerUseCall(
      line,
      input.browserApp,
      input.marker,
      input.computerUsePolicy.actionTools
    );

  const isActionStartWhileCapturePending = (line: string): boolean => {
    if (!captureSynchronizationPending) return false;
    try {
      const event = JSON.parse(line) as {
        type?: unknown;
        item?: {
          type?: unknown;
          server?: unknown;
          server_name?: unknown;
          mcp_server?: unknown;
          tool?: unknown;
          name?: unknown;
        };
      };
      const item = event.item;
      const server = item?.server ?? item?.server_name ?? item?.mcp_server;
      const tool = item?.tool ?? item?.name;
      return event.type === 'item.started' &&
        item?.type === 'mcp_tool_call' &&
        server === 'computer-use' &&
        typeof tool === 'string' &&
        tool !== 'get_app_state';
    } catch {
      return false;
    }
  };

  const processTranscriptLine = (line: string): void => {
    if (isActionStartWhileCapturePending(line) && !supervisorViolation) {
      supervisorViolation =
        'Computer Use action started before the supervisor synchronized its preceding capture.';
      terminateOwnedWorker(child);
    }
    completeJsonl += `${line}\n`;
    supervise();
    const completedCall = parseObserverCall(line);
    if (completedCall && !supervisorViolation) queueObserverCall(completedCall);
  };

  child.stdout.on('data', (chunk: Buffer) => {
    jsonl += chunk.toString();
    const newlineIndex = jsonl.lastIndexOf('\n');
    if (newlineIndex >= 0) {
      const completed = jsonl.slice(0, newlineIndex + 1);
      jsonl = jsonl.slice(newlineIndex + 1);
      const lines = completed
        .split(/\r?\n/)
        .filter((line) => line.trim());
      for (const line of lines) processTranscriptLine(line);
    }
  });
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
    supervise();
  });
  child.stdin.on('error', (error: Error) => {
    stderr += `worker stdin: ${error.message}\n`;
  });
  child.stdin.end(input.prompt);

  const timeout = setTimeout(() => {
    timedOut = true;
    terminateOwnedWorker(child);
  }, input.budgetMs);
  let exitCode: number | null = null;
  let processError: string | undefined;
  try {
    const result = await waitForWorkerExitWithDeadline(
      waitForExit(child),
      input.budgetMs + 5_000
    );
    exitCode = result.code;
  } catch (error) {
    processError = (error as Error).message;
  } finally {
    clearTimeout(timeout);
    if (child.pid) {
      await stopOwnedWorkerProcessGroup(child.pid).then(() => {
        input.onBrowserReleaseSafetyChange?.(true);
      }).catch((error: Error) => {
        if (!supervisorViolation) {
          supervisorViolation = `Worker process-group cleanup failed: ${error.message}`;
        }
      });
    } else if (!supervisorViolation) {
      supervisorViolation = 'Worker process-group cleanup lacked a Codex process identity.';
    }
  }
  if (jsonl.trim()) {
    const finalLine = jsonl.trim();
    processTranscriptLine(finalLine);
  }
  await observerCallQueue;
  if (processError) stderr += `${processError}\n`;
  await writeFile(transcriptPath, completeJsonl, 'utf8');
  await writeFile(stderrPath, stderr, 'utf8');
  const runtime = await (runtimeAttestationPromise ?? attestActualWorkerRuntime({
    workerHome,
    workerCwd,
    workerDirectory: input.workerDirectory,
    jsonl: completeJsonl,
    configuration: runtimeConfiguration.attestation,
    appServerResponseSha256: runtimeConfiguration.appServerResponseSha256,
    codexVersion: input.codexVersion,
    lifecycle: 'post-exit-fallback',
  }));
  const baseTranscriptAudit = auditWorkerTranscript({
    jsonl: completeJsonl,
    stderr,
    expectedBrowserApp: input.browserApp,
    expectedMarker: input.marker,
    allowedComputerUseActions: input.computerUsePolicy.actionTools,
    allowedPlayerKeys: input.computerUsePolicy.keys,
  });
  const transcriptCalls = completeJsonl
    .split(/\r?\n/)
    .map(parseObserverCall)
    .filter((call): call is CompletedComputerUseCall => call !== undefined);
  let supervisorLedgerBlockingReasons: string[] = [];
  let supervisorLedgerCallBindings: SupervisorLedgerCallBinding[] = [];
  try {
    const supervisorLedgerAudit = reconcileComputerUseSupervisorLedger({
      ledgerJsonl: await readFile(computerUseLedgerPath, 'utf8'),
      transcriptCalls,
    });
    supervisorLedgerBlockingReasons = supervisorLedgerAudit.blockingReasons;
    supervisorLedgerCallBindings = supervisorLedgerAudit.bindings;
  } catch (error) {
    supervisorLedgerBlockingReasons = [
      `Computer Use supervisor ledger could not be reconciled: ${(error as Error).message}`,
    ];
  }
  const transcriptAudit: TranscriptAudit = {
    valid: baseTranscriptAudit.valid && supervisorLedgerBlockingReasons.length === 0,
    calls: baseTranscriptAudit.calls,
    blockingReasons: [
      ...baseTranscriptAudit.blockingReasons,
      ...supervisorLedgerBlockingReasons,
    ],
  };
  const transcriptDigest = sha256(completeJsonl);
  await writeFile(
    path.join(input.workerDirectory, transcriptSummaryRef),
    `${JSON.stringify({
      sha256: transcriptDigest,
      requestedModel: CODEX_MODEL,
      reasoningEffort: 'high',
      disposableIsolation: true,
      historyPersistence: 'save-all-in-disposable-home',
      strictConfig: true,
      ignoredUserConfigAndRules: true,
      computerUseOnly: true,
      directSignedComputerUseChild: true,
      supervisorLedgerReconciled: supervisorLedgerBlockingReasons.length === 0,
      supervisorLedgerCallBindings,
      runtimeAttestationRef: runtime.reference,
      invocationSha256: sha256(JSON.stringify(invocation.args)),
      environmentKeys: Object.keys(invocation.env).sort(),
      calls: transcriptAudit.calls,
      packetComputerUsePolicy: input.computerUsePolicy,
      valid: transcriptAudit.valid,
      blockingReasons: transcriptAudit.blockingReasons,
    }, null, 2)}\n`,
    'utf8'
  );

  let response: AiGamerWorkerResponseV1 | undefined;
  let responseError: string | undefined;
  try {
    response = parseWorkerResponse(await readFile(outputPath, 'utf8'));
  } catch (error) {
    responseError = (error as Error).message;
  }
  return {
    workerId: input.workerId,
    browserApp: input.browserApp,
    marker: input.marker,
    response,
    responseError,
    transcriptAudit,
    transcriptSha256: transcriptDigest,
    transcriptRef,
    transcriptSummaryRef,
    stderrRef,
    exitCode,
    timedOut,
    supervisorViolation,
    runtimeAttestation: runtime.attestation,
    runtimeAttestationRef: runtime.reference,
    browserTargetAttestationRef,
    computerUseLedgerRef,
  };
};

export const executeCodexWorker = async (
  input: ExecuteCodexWorkerInput
): Promise<RawWorkerExecution> => {
  await mkdir(input.workerDirectory, { recursive: true, mode: 0o700 });
  await chmod(input.workerDirectory, 0o700);
  const isolationRoot = await mkdtemp(path.join(tmpdir(), 'getaway-ai-gamer-worker-'));
  try {
    return await executeCodexWorkerInIsolation({ ...input, isolationRoot });
  } finally {
    await rm(isolationRoot, { recursive: true, force: true });
  }
};

export const resolveWorkerDirectory = (runId: string, workerId: string): string =>
  path.join(reportRoot, runId, 'workers', workerId);
