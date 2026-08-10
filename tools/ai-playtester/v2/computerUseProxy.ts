import { execFile, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { appendFile, chmod, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import readline from 'node:readline';
import { promisify } from 'node:util';

import { validateOwnedBrowserProcessSnapshot } from './browser.ts';
import {
  createObserverCaptureSyncRequest,
  synchronizeObserverCapture,
} from './observerSync.ts';
import {
  computerUseCallIdentitySha256,
  COMPUTER_USE_PROXY_PROTOCOL_VIOLATION_SCHEMA,
  COMPUTER_USE_PROXY_TOOL_CALL_SCHEMA,
} from './proxyLedger.ts';
import {
  computerUseCallFingerprint,
  hashComputerUseResult,
} from './transcript.ts';
import { COMPUTER_USE_MCP_COMMAND, COMPUTER_USE_TOOLS } from './worker.ts';

const execFileAsync = promisify(execFile);
const allComputerUseTools = new Set<string>(COMPUTER_USE_TOOLS);

type JsonRpcId = string | number | null;

export interface JsonRpcMessage {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
}

interface ProxyConfiguration {
  app: string;
  marker: string;
  executablePath: string;
  profileDirectory: string;
  rootPid: number;
  ledgerPath: string;
  observerSocketPath: string;
  observerSyncSecret: string;
  childCommand: string;
  childArgs: string[];
  allowedActionTools: string[];
  allowedPlayerKeys: string[];
}

export interface ProxyPreActionInput {
  tool: string;
  arguments: Readonly<Record<string, unknown>>;
  expectedApp: string;
  allowedActionTools: readonly string[];
  allowedPlayerKeys: readonly string[];
  externalCaptureReady: boolean;
  processOwnershipValidBeforeCapture: boolean;
  processOwnershipValidAfterCapture: boolean;
  internalMarkerVerified: boolean;
  internalPermissionReady: boolean;
}

export type ProxyQueueSettlement =
  | { state: 'settled' }
  | { state: 'rejected'; reason: string }
  | { state: 'timed-out' };

export const waitForProxyQueueSettlement = async (
  queue: Promise<unknown>,
  timeoutMs: number
): Promise<ProxyQueueSettlement> => {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Computer Use proxy queue deadline is invalid.');
  }
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      queue.then(
        (): ProxyQueueSettlement => ({ state: 'settled' }),
        (error: unknown): ProxyQueueSettlement => ({
          state: 'rejected',
          reason: error instanceof Error ? error.message : String(error),
        })
      ),
      new Promise<ProxyQueueSettlement>((resolve) => {
        timeout = setTimeout(() => resolve({ state: 'timed-out' }), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toolNameAndArguments = (
  message: JsonRpcMessage
): { tool: string; arguments: Record<string, unknown> } | undefined => {
  if (message.method !== 'tools/call' || !isRecord(message.params)) return undefined;
  const tool = message.params.name;
  const args = message.params.arguments;
  if (typeof tool !== 'string' || !isRecord(args)) return undefined;
  return { tool, arguments: args };
};

export const validateComputerUseProxyRequestShape = (
  message: JsonRpcMessage
): string | undefined => {
  if (message.jsonrpc !== '2.0') {
    return 'Computer Use proxy requires JSON-RPC 2.0.';
  }
  if (
    message.method !== undefined &&
    (typeof message.method !== 'string' || message.method.length === 0)
  ) {
    return 'Computer Use JSON-RPC method must be a non-empty string.';
  }
  if (
    message.id !== undefined &&
    (
      (typeof message.id !== 'string' && typeof message.id !== 'number') ||
      (typeof message.id === 'number' && !Number.isFinite(message.id))
    )
  ) {
    return 'Computer Use JSON-RPC messages require a string or numeric correlation ID.';
  }
  if (message.method === 'tools/call' && message.id === undefined) {
    return 'Computer Use tool-call notifications are forbidden.';
  }
  if (message.method?.startsWith('notifications/') && message.id !== undefined) {
    return 'Computer Use notification methods cannot carry a correlation ID.';
  }
  if (
    message.method &&
    !message.method.startsWith('notifications/') &&
    message.id === undefined
  ) {
    return 'Computer Use JSON-RPC request requires a correlation ID.';
  }
  if (!message.method && message.id === undefined) {
    return 'Computer Use JSON-RPC message requires a method or correlation ID.';
  }
  if (message.method !== 'tools/call') return undefined;
  if (!toolNameAndArguments(message)) {
    return 'Computer Use tools/call request is malformed.';
  }
  return undefined;
};

export const filterComputerUseToolListResponse = (
  response: JsonRpcMessage,
  allowedToolNames: ReadonlySet<string> = allComputerUseTools
): JsonRpcMessage => {
  if (!isRecord(response.result) || !Array.isArray(response.result.tools)) return response;
  return {
    ...response,
    result: {
      ...response.result,
      tools: response.result.tools.filter((tool) =>
        isRecord(tool) && typeof tool.name === 'string' && allowedToolNames.has(tool.name)
      ),
    },
  };
};

export const validateProxyPreAction = (input: ProxyPreActionInput): string[] => {
  const reasons: string[] = [];
  const allowedActionTools = new Set(input.allowedActionTools);
  const allowedPlayerKeys = new Set(input.allowedPlayerKeys.map((key) => key.toLowerCase()));
  if (!allowedActionTools.has(input.tool)) {
    reasons.push(`Computer Use action is not allowlisted: ${input.tool}.`);
  }
  if (input.arguments.app !== input.expectedApp) {
    reasons.push('Computer Use action did not target the assigned browser app.');
  }
  if (!input.externalCaptureReady) {
    reasons.push('Computer Use action had no marker-verified external get_app_state.');
  }
  if (!input.processOwnershipValidBeforeCapture) {
    reasons.push('Assigned browser process ownership was invalid before the private capture.');
  }
  if (!input.processOwnershipValidAfterCapture) {
    reasons.push('Assigned browser process ownership changed during the private capture.');
  }
  if (!input.internalMarkerVerified) {
    reasons.push('Pre-action Computer Use capture did not contain the assigned visible marker.');
  }
  if (!input.internalPermissionReady) {
    reasons.push('Pre-action Computer Use capture reported a permission or app-approval blocker.');
  }
  if (input.tool === 'press_key') {
    const key = input.arguments.key;
    if (typeof key !== 'string' || !allowedPlayerKeys.has(key.toLowerCase())) {
      reasons.push('Computer Use key is outside the packet-visible input allowlist.');
    }
  }
  if (input.tool === 'click') {
    if (
      input.arguments.mouse_button !== undefined &&
      input.arguments.mouse_button !== 'left'
    ) {
      reasons.push('Computer Use click must use the left mouse button.');
    }
    if (input.arguments.click_count !== undefined && input.arguments.click_count !== 1) {
      reasons.push('Computer Use click_count must be exactly 1.');
    }
  }
  return reasons;
};

const parseProxyConfiguration = (argv: readonly string[]): ProxyConfiguration => {
  const values = new Map<string, string[]>();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith('--') || value === undefined) {
      throw new Error('Computer Use proxy received malformed configuration.');
    }
    values.set(name, [...(values.get(name) ?? []), value]);
  }
  const one = (name: string): string => {
    const entries = values.get(name);
    if (!entries || entries.length !== 1 || !entries[0]) {
      throw new Error(`Computer Use proxy requires exactly one ${name}.`);
    }
    return entries[0];
  };
  const rootPid = Number(one('--root-pid'));
  if (!Number.isSafeInteger(rootPid) || rootPid <= 0) {
    throw new Error('Computer Use proxy root PID is invalid.');
  }
  const childCommand = one('--child-command');
  if (childCommand !== COMPUTER_USE_MCP_COMMAND) {
    throw new Error('Computer Use proxy child launcher is not the reviewed binary.');
  }
  const allowedActionTools = values.get('--allowed-tool') ?? [];
  const allowedPlayerKeys = values.get('--allowed-key') ?? [];
  if (
    allowedActionTools.length === 0 ||
    new Set(allowedActionTools).size !== allowedActionTools.length ||
    allowedActionTools.some((tool) => tool === 'get_app_state' || !allComputerUseTools.has(tool)) ||
    new Set(allowedPlayerKeys.map((key) => key.toLowerCase())).size !== allowedPlayerKeys.length ||
    (allowedActionTools.includes('press_key') ? allowedPlayerKeys.length === 0 : allowedPlayerKeys.length !== 0)
  ) {
    throw new Error('Computer Use proxy received an invalid packet-scoped input policy.');
  }
  const observerSocketPath = one('--observer-socket');
  if (!path.isAbsolute(observerSocketPath)) {
    throw new Error('Computer Use proxy observer socket path must be absolute.');
  }
  const observerSyncSecret = one('--observer-secret');
  if (!/^[a-f\d]{64}$/i.test(observerSyncSecret)) {
    throw new Error('Computer Use proxy observer synchronization secret is invalid.');
  }
  return {
    app: one('--app'),
    marker: one('--marker'),
    executablePath: one('--executable'),
    profileDirectory: one('--profile'),
    rootPid,
    ledgerPath: one('--ledger'),
    observerSocketPath,
    observerSyncSecret,
    childCommand,
    childArgs: values.get('--child-arg') ?? [],
    allowedActionTools,
    allowedPlayerKeys,
  };
};

class ChildMcpPeer {
  private readonly pending = new Map<string, {
    resolve: (message: JsonRpcMessage) => void;
    reject: (error: Error) => void;
  }>();

  constructor(private readonly child: ChildProcessWithoutNullStreams) {
    const output = readline.createInterface({ input: child.stdout });
    output.on('line', (line) => {
      let message: JsonRpcMessage;
      try {
        message = JSON.parse(line) as JsonRpcMessage;
      } catch {
        process.stderr.write('Computer Use child emitted malformed JSON-RPC.\n');
        return;
      }
      const key = message.id === undefined ? undefined : String(message.id);
      const waiter = key === undefined ? undefined : this.pending.get(key);
      if (waiter) {
        this.pending.delete(key!);
        waiter.resolve(message);
      } else {
        process.stdout.write(`${line}\n`);
      }
    });
    const failPending = (error: Error): void => {
      for (const waiter of this.pending.values()) waiter.reject(error);
      this.pending.clear();
    };
    child.once('error', (error) => failPending(error));
    child.once('exit', (code, signal) => {
      const error = new Error(
        `Computer Use child exited unexpectedly (${String(code ?? signal ?? 'unknown')}).`
      );
      failPending(error);
    });
  }

  send(message: JsonRpcMessage): void {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  request(message: JsonRpcMessage, timeoutMs = 25_000): Promise<JsonRpcMessage> {
    if (message.id === undefined) throw new Error('MCP request has no correlation ID.');
    const key = String(message.id);
    if (this.pending.has(key)) throw new Error('Duplicate MCP correlation ID.');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(key);
        this.terminate();
        reject(new Error(`Computer Use child request ${key} timed out.`));
      }, timeoutMs);
      this.pending.set(key, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
      this.send(message);
    });
  }

  terminate(): void {
    if (this.child.exitCode !== null) return;
    this.child.kill('SIGTERM');
    const forceTimer = setTimeout(() => {
      if (this.child.exitCode === null) this.child.kill('SIGKILL');
    }, 1_000);
    forceTimer.unref();
  }
}

const resultContainsMarker = (response: JsonRpcMessage, marker: string): boolean =>
  response.error === undefined && JSON.stringify(response.result ?? '').includes(marker);

export const resultIndicatesPermissionOrApprovalBlock = (response: JsonRpcMessage): boolean =>
  /Computer Use permissions are still pending|Required .* permissions were not granted|permission setup is still open|Computer Use is not allowed to use the app|Running application not found|Ambiguous app identifier|app approval (?:is )?(?:pending|required)|session has been stopped/i.test(
    JSON.stringify(response.error ?? response.result ?? '')
  );

const safeResponseId = (id: unknown): JsonRpcId =>
  typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id)) ? id : null;

const deniedResponse = (id: unknown, reason: string): JsonRpcMessage => ({
  jsonrpc: '2.0',
  id: safeResponseId(id),
  error: { code: -32001, message: `GET-179 Computer Use integrity gate: ${reason}` },
});

const runProxy = async (configuration: ProxyConfiguration): Promise<void> => {
  await mkdir(path.dirname(configuration.ledgerPath), { recursive: true, mode: 0o700 });
  await appendFile(configuration.ledgerPath, '', { mode: 0o600 });
  await chmod(configuration.ledgerPath, 0o600);
  const appendLedger = async (entry: Record<string, unknown>): Promise<void> => {
    await appendFile(
      configuration.ledgerPath,
      `${JSON.stringify({ capturedAt: new Date().toISOString(), ...entry })}\n`,
      'utf8'
    );
  };
  let externalToolSequence = 0;
  let observerCaptureSequence = 0;

  const child = spawn(configuration.childCommand, configuration.childArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (chunk: Buffer) => process.stderr.write(chunk));
  const peer = new ChildMcpPeer(child);
  const allowedToolNames = new Set([
    'get_app_state',
    ...configuration.allowedActionTools,
  ]);
  let externalCaptureReady = false;
  let compromised = false;

  const appendProtocolViolation = async (
    message: unknown,
    reason: string,
    rawLine?: string
  ): Promise<void> => appendLedger({
    schema: COMPUTER_USE_PROXY_PROTOCOL_VIOLATION_SCHEMA,
    method: isRecord(message) && typeof message.method === 'string'
      ? message.method
      : null,
    requestSha256: sha256(rawLine ?? JSON.stringify(message) ?? String(message)),
    allowed: false,
    reasonSha256: sha256(reason),
  });

  const appendExternalToolCall = async (input: {
    sequence: number;
    message: JsonRpcMessage;
    toolCall: { tool: string; arguments: Record<string, unknown> };
    response: JsonRpcMessage;
    observerSynchronized: boolean;
    allowed: boolean;
    evidence?: Record<string, unknown>;
  }): Promise<void> => {
    const fingerprint = computerUseCallFingerprint(
      input.toolCall.tool,
      input.toolCall.arguments
    );
    const resultSha256 = hashComputerUseResult(
      input.response.error === undefined ? input.response.result : input.response.error
    );
    await appendLedger({
      schema: COMPUTER_USE_PROXY_TOOL_CALL_SCHEMA,
      sequence: input.sequence,
      tool: input.toolCall.tool,
      fingerprint,
      resultSha256,
      callIdentitySha256: computerUseCallIdentitySha256({
        sequence: input.sequence,
        tool: input.toolCall.tool,
        fingerprint,
        resultSha256,
      }),
      requestSha256: sha256(JSON.stringify(input.message)),
      responseSha256: sha256(JSON.stringify(input.response)),
      observerSynchronized: input.observerSynchronized,
      allowed: input.allowed,
      ...(input.evidence ?? {}),
    });
  };

  const handleRequest = async (message: JsonRpcMessage): Promise<JsonRpcMessage> => {
    const requestShapeError = validateComputerUseProxyRequestShape(message);
    if (requestShapeError) {
      compromised = true;
      await appendProtocolViolation(message, requestShapeError);
      return deniedResponse(message.id, requestShapeError);
    }
    if (message.method === 'tools/list') {
      return filterComputerUseToolListResponse(await peer.request(message), allowedToolNames);
    }
    const toolCall = toolNameAndArguments(message);
    if (!toolCall) return peer.request(message);
    const callSequence = ++externalToolSequence;
    if (compromised) {
      const response = deniedResponse(message.id, 'the proxy session was already blocked.');
      await appendExternalToolCall({
        sequence: callSequence,
        message,
        toolCall,
        response,
        observerSynchronized: false,
        allowed: false,
      });
      return response;
    }
    if (!allowedToolNames.has(toolCall.tool)) {
      compromised = true;
      const response = deniedResponse(message.id, 'tool is not allowlisted.');
      await appendExternalToolCall({
        sequence: callSequence,
        message,
        toolCall,
        response,
        observerSynchronized: false,
        allowed: false,
      });
      return response;
    }
    if (toolCall.arguments.app !== configuration.app) {
      compromised = true;
      const response = deniedResponse(message.id, 'call did not target the assigned browser app.');
      await appendExternalToolCall({
        sequence: callSequence,
        message,
        toolCall,
        response,
        observerSynchronized: false,
        allowed: false,
        evidence: { appBound: false },
      });
      return response;
    }

    if (toolCall.tool === 'get_app_state') {
      const response = await peer.request(message);
      const responseSha256 = sha256(JSON.stringify(response));
      const resultSha256 = hashComputerUseResult(
        response.error === undefined ? response.result : response.error
      );
      const markerVerified = resultContainsMarker(response, configuration.marker);
      const permissionReady = !resultIndicatesPermissionOrApprovalBlock(response);
      const processList = await execFileAsync('/bin/ps', ['-axo', 'pid=,command='], {
        maxBuffer: 4 * 1024 * 1024,
      });
      const ownership = validateOwnedBrowserProcessSnapshot(processList.stdout, {
        executablePath: configuration.executablePath,
        profileDirectory: configuration.profileDirectory,
        rootPid: configuration.rootPid,
      });
      externalCaptureReady = markerVerified && permissionReady && ownership.valid;
      const observerSyncToken = randomUUID();
      let observerSynchronized = false;
      let observerSyncSequence: number | null = null;
      if (externalCaptureReady) {
        try {
          observerSyncSequence = ++observerCaptureSequence;
          await synchronizeObserverCapture(
            configuration.observerSocketPath,
            configuration.observerSyncSecret,
            createObserverCaptureSyncRequest({
            secret: configuration.observerSyncSecret,
            sequence: observerSyncSequence,
            token: observerSyncToken,
            captureResultSha256: resultSha256,
          }));
          observerSynchronized = true;
        } catch {
          externalCaptureReady = false;
        }
      }
      if (!externalCaptureReady) compromised = true;
      const returnedResponse = externalCaptureReady
        ? response
        : deniedResponse(
          message.id,
          ownership.reason ?? (!permissionReady
            ? 'permission or app approval was not ready.'
            : !markerVerified
              ? 'visible marker was not verified.'
              : 'read-only observer did not acknowledge the capture before action.')
        );
      await appendExternalToolCall({
        sequence: callSequence,
        message,
        toolCall,
        response: returnedResponse,
        observerSynchronized,
        allowed: externalCaptureReady,
        evidence: {
          childResponseSha256: responseSha256,
          markerVerified,
          permissionReady,
          processOwnershipValid: ownership.valid,
          observerSyncSequence,
          observerSyncTokenSha256: sha256(observerSyncToken),
        },
      });
      return returnedResponse;
    }

    const processList = await execFileAsync('/bin/ps', ['-axo', 'pid=,command='], {
      maxBuffer: 4 * 1024 * 1024,
    });
    const ownershipBeforeCapture = validateOwnedBrowserProcessSnapshot(processList.stdout, {
      executablePath: configuration.executablePath,
      profileDirectory: configuration.profileDirectory,
      rootPid: configuration.rootPid,
    });
    const internalCapture = await peer.request({
      jsonrpc: '2.0',
      id: `__getaway_gate_${randomUUID()}`,
      method: 'tools/call',
      params: {
        name: 'get_app_state',
        arguments: { app: configuration.app },
      },
    });
    const internalMarkerVerified = resultContainsMarker(
      internalCapture,
      configuration.marker
    );
    const internalPermissionReady = !resultIndicatesPermissionOrApprovalBlock(internalCapture);
    const processListAfterCapture = await execFileAsync('/bin/ps', ['-axo', 'pid=,command='], {
      maxBuffer: 4 * 1024 * 1024,
    });
    const ownershipAfterCapture = validateOwnedBrowserProcessSnapshot(
      processListAfterCapture.stdout,
      {
        executablePath: configuration.executablePath,
        profileDirectory: configuration.profileDirectory,
        rootPid: configuration.rootPid,
      }
    );
    const reasons = validateProxyPreAction({
      tool: toolCall.tool,
      arguments: toolCall.arguments,
      expectedApp: configuration.app,
      allowedActionTools: configuration.allowedActionTools,
      allowedPlayerKeys: configuration.allowedPlayerKeys,
      externalCaptureReady,
      processOwnershipValidBeforeCapture: ownershipBeforeCapture.valid,
      processOwnershipValidAfterCapture: ownershipAfterCapture.valid,
      internalMarkerVerified,
      internalPermissionReady,
    });
    if (reasons.length > 0) {
      compromised = true;
      const response = deniedResponse(message.id, reasons.join(' '));
      await appendExternalToolCall({
        sequence: callSequence,
        message,
        toolCall,
        response,
        observerSynchronized: false,
        allowed: false,
        evidence: {
          internalCaptureSha256: sha256(JSON.stringify(internalCapture)),
          markerVerified: internalMarkerVerified,
          permissionReady: internalPermissionReady,
          processOwnershipValidBeforeCapture: ownershipBeforeCapture.valid,
          processOwnershipValidAfterCapture: ownershipAfterCapture.valid,
          reasonSha256: sha256(reasons.join(' ')),
        },
      });
      return response;
    }

    const response = await peer.request(message);
    externalCaptureReady = false;
    const responsePermissionReady = !resultIndicatesPermissionOrApprovalBlock(response);
    await appendExternalToolCall({
      sequence: callSequence,
      message,
      toolCall,
      response,
      observerSynchronized: false,
      allowed: response.error === undefined && responsePermissionReady,
      evidence: {
        internalCaptureSha256: sha256(JSON.stringify(internalCapture)),
        markerVerified: true,
        permissionReady: responsePermissionReady,
        processOwnershipValidBeforeCapture: true,
        processOwnershipValidAfterCapture: true,
      },
    });
    if (response.error !== undefined || !responsePermissionReady) compromised = true;
    return response;
  };

  const input = readline.createInterface({ input: process.stdin });
  const inputClosed = new Promise<void>((resolve) => input.once('close', resolve));
  let queue = Promise.resolve();
  input.on('line', (line) => {
    queue = queue.then(async () => {
      let message: JsonRpcMessage;
      try {
        const parsed = JSON.parse(line) as unknown;
        if (!isRecord(parsed)) throw new Error('JSON-RPC message must be an object');
        message = parsed;
      } catch (error) {
        compromised = true;
        const reason = `malformed JSON-RPC: ${(error as Error).message}`;
        await appendProtocolViolation(undefined, reason, line);
        process.stdout.write(`${JSON.stringify(deniedResponse(null, 'malformed JSON-RPC.'))}\n`);
        return;
      }
      const requestShapeError = validateComputerUseProxyRequestShape(message);
      if (requestShapeError) {
        compromised = true;
        await appendProtocolViolation(message, requestShapeError);
        process.stdout.write(`${JSON.stringify(deniedResponse(message.id, requestShapeError))}\n`);
        return;
      }
      if (message.method && message.id !== undefined) {
        try {
          const response = await handleRequest(message);
          process.stdout.write(`${JSON.stringify(response)}\n`);
        } catch (error) {
          compromised = true;
          await appendProtocolViolation(
            message,
            `Computer Use proxy request failed: ${(error as Error).message}`
          );
          process.stdout.write(`${JSON.stringify(deniedResponse(
            message.id,
            (error as Error).message
          ))}\n`);
        }
      } else {
        peer.send(message);
      }
    });
  });
  let terminatedBySignal = false;
  const stopForSignal = (): void => {
    compromised = true;
    terminatedBySignal = true;
    peer.terminate();
    input.close();
  };
  process.once('SIGTERM', stopForSignal);
  process.once('SIGINT', stopForSignal);
  await inputClosed;
  peer.terminate();
  if (terminatedBySignal) {
    await appendProtocolViolation(undefined, 'Computer Use proxy received a termination signal.');
  }
  const queueSettlement = await waitForProxyQueueSettlement(queue, 2_000);
  if (queueSettlement.state !== 'settled') {
    compromised = true;
    const reason = queueSettlement.state === 'rejected'
      ? `Computer Use proxy request queue rejected: ${queueSettlement.reason}`
      : 'Computer Use proxy request queue did not settle during shutdown.';
    process.stderr.write(`GET-179 Computer Use proxy integrity violation: ${reason}\n`);
    await appendProtocolViolation(undefined, reason).catch(() => undefined);
  }
  child.stdin.end();
  peer.terminate();
  process.off('SIGTERM', stopForSignal);
  process.off('SIGINT', stopForSignal);
  if (compromised) process.exitCode = 1;
};

const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  runProxy(parseProxyConfiguration(process.argv.slice(2))).catch((error: Error) => {
    process.stderr.write(`Computer Use proxy failed closed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
