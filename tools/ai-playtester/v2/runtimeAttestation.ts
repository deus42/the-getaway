import path from 'node:path';

import { CODEX_MODEL } from './worker.ts';

export const CODEX_RUNTIME_ATTESTATION_SCHEMA = 'codex_runtime_attestation_v1' as const;
export const CODEX_EXEC_RUNTIME_ATTESTATION_SCHEMA =
  'codex_exec_runtime_attestation_v2' as const;

export interface CodexRuntimeAttestation {
  schema: typeof CODEX_RUNTIME_ATTESTATION_SCHEMA;
  source: 'codex-app-server-thread-start';
  model: typeof CODEX_MODEL;
  modelProvider: 'openai';
  reasoningEffort: 'high';
  providerModelFallbackAllowed: false;
  ephemeral: true;
  instructionSources: [];
  approvalPolicy: 'never';
  sandbox: { type: 'readOnly'; networkAccess: false };
  runtimeWorkspaceRoots: string[];
  multiAgentMode: string;
}

export interface CodexExecRuntimeAttestation {
  schema: typeof CODEX_EXEC_RUNTIME_ATTESTATION_SCHEMA;
  source: 'codex-exec-disposable-state-and-rollout';
  threadId: string;
  model: typeof CODEX_MODEL;
  modelProvider: 'openai';
  reasoningEffort: 'high';
  providerModelFallbackUsed: false;
  disposableIsolation: true;
  actualStateSha256: string;
  actualRolloutSha256: string;
  preflightConfiguration: CodexRuntimeAttestation;
}

interface RuntimeAttestationExpectation {
  workerCwd: string;
  providerModelFallbackAllowed: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const parseCodexRuntimeAttestation = (
  response: unknown,
  expectation: RuntimeAttestationExpectation
): CodexRuntimeAttestation => {
  if (expectation.providerModelFallbackAllowed) {
    throw new Error('Provider model fallback must be disabled for AI Gamer workers.');
  }
  if (!isRecord(response) || !isRecord(response.result)) {
    throw new Error('Codex runtime attestation response is missing its result.');
  }
  const result = response.result;
  const thread = isRecord(result.thread) ? result.thread : undefined;
  const sandbox = isRecord(result.sandbox) ? result.sandbox : undefined;
  const instructionSources = Array.isArray(result.instructionSources)
    ? result.instructionSources
    : undefined;
  const runtimeWorkspaceRoots = Array.isArray(result.runtimeWorkspaceRoots) &&
    result.runtimeWorkspaceRoots.every((root) => typeof root === 'string')
    ? result.runtimeWorkspaceRoots as string[]
    : undefined;
  const workspaceRootsPreserveIsolation = Boolean(runtimeWorkspaceRoots) && (
    runtimeWorkspaceRoots!.length === 0 ||
    (
      runtimeWorkspaceRoots!.length === 1 &&
      runtimeWorkspaceRoots![0] === expectation.workerCwd
    )
  );

  if (result.model !== CODEX_MODEL) {
    throw new Error(
      `Codex runtime resolved model ${String(result.model)} instead of ${CODEX_MODEL}.`
    );
  }
  if (
    result.modelProvider !== 'openai' ||
    result.reasoningEffort !== 'high' ||
    result.approvalPolicy !== 'never' ||
    !thread ||
    thread.ephemeral !== true ||
    thread.path !== null ||
    thread.cwd !== expectation.workerCwd ||
    thread.modelProvider !== 'openai' ||
    !sandbox ||
    sandbox.type !== 'readOnly' ||
    sandbox.networkAccess !== false ||
    !workspaceRootsPreserveIsolation ||
    typeof result.multiAgentMode !== 'string'
  ) {
    throw new Error('Codex runtime attestation did not preserve the isolated worker contract.');
  }
  if (!instructionSources || instructionSources.length !== 0) {
    throw new Error('Codex runtime attestation exposed user or project instruction sources.');
  }

  return {
    schema: CODEX_RUNTIME_ATTESTATION_SCHEMA,
    source: 'codex-app-server-thread-start',
    model: CODEX_MODEL,
    modelProvider: 'openai',
    reasoningEffort: 'high',
    providerModelFallbackAllowed: false,
    ephemeral: true,
    instructionSources: [],
    approvalPolicy: 'never',
    sandbox: { type: 'readOnly', networkAccess: false },
    runtimeWorkspaceRoots: [...runtimeWorkspaceRoots!],
    multiAgentMode: result.multiAgentMode,
  };
};

const threadIdFromJsonl = (jsonl: string): string => {
  const ids = new Set<string>();
  for (const line of jsonl.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const value = JSON.parse(line) as unknown;
      if (
        isRecord(value) &&
        value.type === 'thread.started' &&
        typeof value.thread_id === 'string' &&
        /^[a-f\d-]{16,}$/i.test(value.thread_id)
      ) {
        ids.add(value.thread_id);
      }
    } catch {
      continue;
    }
  }
  if (ids.size !== 1) {
    throw new Error('Codex exec transcript did not expose exactly one actual worker thread ID.');
  }
  return [...ids][0];
};

export const parseCodexExecRuntimeAttestation = (input: {
  jsonl: string;
  stateRows: readonly unknown[];
  rolloutJsonl: string;
  configuration: CodexRuntimeAttestation;
  actualStateSha256: string;
  actualRolloutSha256: string;
  workerHome: string;
  workerCwd: string;
  resolvedWorkerCwd?: string;
  resolvedSessionsRoot: string;
  resolvedRolloutPath: string;
  codexVersion: string;
}): CodexExecRuntimeAttestation => {
  const threadId = threadIdFromJsonl(input.jsonl);
  if (
    !/^[a-f\d]{64}$/i.test(input.actualStateSha256) ||
    !/^[a-f\d]{64}$/i.test(input.actualRolloutSha256)
  ) {
    throw new Error('Codex exec runtime state or rollout evidence has no valid digest.');
  }
  if (input.stateRows.length !== 1 || !isRecord(input.stateRows[0])) {
    throw new Error('Codex exec state did not expose exactly one actual worker thread row.');
  }
  const state = input.stateRows[0];
  const workerCwd = path.resolve(input.workerCwd);
  const resolvedWorkerCwd = path.resolve(input.resolvedWorkerCwd ?? input.workerCwd);
  const matchesWorkerCwd = (value: unknown): boolean =>
    typeof value === 'string' &&
    (path.resolve(value) === workerCwd || path.resolve(value) === resolvedWorkerCwd);
  if (state.model !== CODEX_MODEL || state.reasoning_effort !== 'high') {
    throw new Error('Codex exec actual worker model or reasoning effort was substituted in state.');
  }
  const rolloutPath = typeof state.rollout_path === 'string'
    ? path.resolve(state.rollout_path)
    : '';
  const resolvedSessionsRoot = path.resolve(input.resolvedSessionsRoot);
  const resolvedRolloutPath = path.resolve(input.resolvedRolloutPath);
  const rolloutRelativePath = path.relative(resolvedSessionsRoot, resolvedRolloutPath);
  const rolloutIsDisposable = Boolean(rolloutPath) &&
    Boolean(rolloutRelativePath) &&
    rolloutRelativePath !== '..' &&
    !rolloutRelativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(rolloutRelativePath);
  if (!rolloutIsDisposable) {
    throw new Error('Codex worker state did not point to its disposable rollout.');
  }
  if (
    state.id !== threadId ||
    state.model_provider !== 'openai' ||
    !matchesWorkerCwd(state.cwd) ||
    state.source !== 'exec' ||
    state.cli_version !== input.codexVersion
  ) {
    throw new Error('Codex exec same-thread state did not preserve disposable isolation.');
  }

  const rolloutRecords = input.rolloutJsonl.split(/\r?\n/).flatMap((line) => {
    if (!line.trim()) return [];
    try {
      const parsed = JSON.parse(line) as unknown;
      return isRecord(parsed) ? [parsed] : [];
    } catch {
      return [];
    }
  });
  const sessionMetadata = rolloutRecords.filter((record) => record.type === 'session_meta');
  if (sessionMetadata.length !== 1 || !isRecord(sessionMetadata[0].payload)) {
    throw new Error('Codex exec rollout did not expose exactly one same-thread session record.');
  }
  const session = sessionMetadata[0].payload;
  if (
    session.id !== threadId ||
    !matchesWorkerCwd(session.cwd) ||
    session.model_provider !== 'openai' ||
    session.cli_version !== input.codexVersion ||
    session.source !== 'exec'
  ) {
    throw new Error('Codex exec rollout session did not preserve disposable isolation.');
  }
  const turnContexts = rolloutRecords
    .filter((record) => record.type === 'turn_context')
    .map((record) => record.payload)
    .filter(isRecord);
  if (turnContexts.length === 0) {
    throw new Error('Codex exec rollout exposed no actual turn context.');
  }
  if (turnContexts.some((turn) => turn.model !== CODEX_MODEL || turn.effort !== 'high')) {
    throw new Error('Codex exec actual worker model or reasoning effort was substituted in rollout.');
  }
  if (turnContexts.some((turn) =>
    !matchesWorkerCwd(turn.cwd) ||
    turn.approval_policy !== 'never' ||
    !isRecord(turn.sandbox_policy) ||
    turn.sandbox_policy.type !== 'read-only'
  )) {
    throw new Error('Codex exec actual turn did not preserve the isolated runtime contract.');
  }

  return {
    schema: CODEX_EXEC_RUNTIME_ATTESTATION_SCHEMA,
    source: 'codex-exec-disposable-state-and-rollout',
    threadId,
    model: CODEX_MODEL,
    modelProvider: 'openai',
    reasoningEffort: 'high',
    providerModelFallbackUsed: false,
    disposableIsolation: true,
    actualStateSha256: input.actualStateSha256,
    actualRolloutSha256: input.actualRolloutSha256,
    preflightConfiguration: input.configuration,
  };
};
