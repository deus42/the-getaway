import {
  computerUseCallIdentitySha256,
} from './proxyLedger.ts';
import type { CompletedComputerUseCall } from './transcript.ts';
import { COMPUTER_USE_TOOLS } from './worker.ts';

export const COMPUTER_USE_SUPERVISOR_TOOL_CALL_SCHEMA =
  'computer_use_supervisor_tool_call_v1' as const;

export interface ComputerUseSupervisorLedgerEntry {
  schema: typeof COMPUTER_USE_SUPERVISOR_TOOL_CALL_SCHEMA;
  sequence: number;
  transcriptItemId: string;
  tool: CompletedComputerUseCall['tool'];
  fingerprint: string;
  resultSha256: string;
  callIdentitySha256: string;
  directSignedChild: true;
  observerSynchronized: boolean;
  browserOwnershipVerified: boolean;
  markerVerified: boolean;
  allowed: true;
}

export interface SupervisorLedgerCallBinding {
  callIdentitySha256: string;
  supervisorSequence: number;
  transcriptItemId: string;
}

export interface SupervisorLedgerReconciliation {
  valid: boolean;
  blockingReasons: string[];
  bindings: SupervisorLedgerCallBinding[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isSha256 = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);

export const createComputerUseSupervisorLedgerEntry = (input: {
  sequence: number;
  call: CompletedComputerUseCall;
  observerSynchronized: boolean;
  browserOwnershipVerified: boolean;
}): ComputerUseSupervisorLedgerEntry => {
  if (!Number.isSafeInteger(input.sequence) || input.sequence < 1) {
    throw new Error('Computer Use supervisor sequence is invalid.');
  }
  const identity = {
    sequence: input.sequence,
    tool: input.call.tool,
    fingerprint: input.call.fingerprint,
    resultSha256: input.call.resultSha256,
  };
  return {
    schema: COMPUTER_USE_SUPERVISOR_TOOL_CALL_SCHEMA,
    ...identity,
    transcriptItemId: input.call.id,
    callIdentitySha256: computerUseCallIdentitySha256(identity),
    directSignedChild: true,
    observerSynchronized: input.observerSynchronized,
    browserOwnershipVerified: input.browserOwnershipVerified,
    markerVerified: input.call.markerVerified,
    allowed: true,
  };
};

const parseEntry = (
  value: Record<string, unknown>,
  lineNumber: number
): ComputerUseSupervisorLedgerEntry => {
  if (
    value.schema !== COMPUTER_USE_SUPERVISOR_TOOL_CALL_SCHEMA ||
    typeof value.sequence !== 'number' ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1 ||
    typeof value.transcriptItemId !== 'string' ||
    value.transcriptItemId.length === 0 ||
    typeof value.tool !== 'string' ||
    !COMPUTER_USE_TOOLS.includes(value.tool as CompletedComputerUseCall['tool']) ||
    typeof value.fingerprint !== 'string' ||
    !/^[a-z_]+:[a-f\d]{64}$/i.test(value.fingerprint) ||
    !isSha256(value.resultSha256) ||
    !isSha256(value.callIdentitySha256) ||
    value.directSignedChild !== true ||
    typeof value.observerSynchronized !== 'boolean' ||
    typeof value.browserOwnershipVerified !== 'boolean' ||
    typeof value.markerVerified !== 'boolean' ||
    value.allowed !== true
  ) {
    throw new Error(`Computer Use supervisor ledger line ${lineNumber} is malformed.`);
  }
  const entry = value as unknown as ComputerUseSupervisorLedgerEntry;
  if (entry.callIdentitySha256 !== computerUseCallIdentitySha256(entry)) {
    throw new Error(
      `Computer Use supervisor ledger line ${lineNumber} has an invalid call identity.`
    );
  }
  return entry;
};

export const reconcileComputerUseSupervisorLedger = (input: {
  ledgerJsonl: string;
  transcriptCalls: readonly CompletedComputerUseCall[];
}): SupervisorLedgerReconciliation => {
  const blockingReasons: string[] = [];
  const bindings: SupervisorLedgerCallBinding[] = [];
  const entries: ComputerUseSupervisorLedgerEntry[] = [];
  const lines = input.ledgerJsonl.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    try {
      const value = JSON.parse(line) as unknown;
      if (!isRecord(value)) throw new Error('entry must be an object');
      entries.push(parseEntry(value, index + 1));
    } catch (error) {
      blockingReasons.push(
        `Computer Use supervisor ledger line ${index + 1} is invalid: ` +
        `${(error as Error).message}`
      );
    }
  }

  if (entries.length === 0) {
    blockingReasons.push('Computer Use supervisor ledger contains no external tool calls.');
  }
  const seenTranscriptIds = new Set<string>();
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.sequence !== index + 1) {
      blockingReasons.push('Computer Use supervisor sequence is missing or out of order.');
    }
    if (!entry.browserOwnershipVerified) {
      blockingReasons.push(
        `Computer Use supervisor call ${entry.sequence} lacks browser ownership verification.`
      );
    }
    if (!entry.markerVerified) {
      blockingReasons.push(
        `Computer Use supervisor call ${entry.sequence} lacks marker verification.`
      );
    }
    if (entry.tool === 'get_app_state' && !entry.observerSynchronized) {
      blockingReasons.push(
        `Computer Use capture ${entry.sequence} lacks observer synchronization.`
      );
    }
    if (seenTranscriptIds.has(entry.transcriptItemId)) {
      blockingReasons.push(
        `Computer Use transcript item ${entry.transcriptItemId} was bound more than once.`
      );
    }
    seenTranscriptIds.add(entry.transcriptItemId);
  }
  if (entries.length !== input.transcriptCalls.length) {
    blockingReasons.push(
      `Computer Use supervisor/transcript call count differs: ${entries.length} supervisor, ` +
      `${input.transcriptCalls.length} transcript.`
    );
  }

  const transcriptByIdentity = new Map<string, CompletedComputerUseCall>();
  input.transcriptCalls.forEach((call, index) => {
    transcriptByIdentity.set(computerUseCallIdentitySha256({
      sequence: index + 1,
      tool: call.tool,
      fingerprint: call.fingerprint,
      resultSha256: call.resultSha256,
    }), call);
  });
  const matchedIdentities = new Set<string>();
  for (const entry of entries) {
    const call = transcriptByIdentity.get(entry.callIdentitySha256);
    if (!call || call.id !== entry.transcriptItemId) {
      blockingReasons.push(
        `Computer Use supervisor call ${entry.sequence} has no exact transcript identity match.`
      );
      continue;
    }
    if (matchedIdentities.has(entry.callIdentitySha256)) {
      blockingReasons.push(
        `Computer Use supervisor call identity was reused at sequence ${entry.sequence}.`
      );
      continue;
    }
    matchedIdentities.add(entry.callIdentitySha256);
    bindings.push({
      callIdentitySha256: entry.callIdentitySha256,
      supervisorSequence: entry.sequence,
      transcriptItemId: call.id,
    });
  }
  if (matchedIdentities.size !== input.transcriptCalls.length) {
    blockingReasons.push(
      'Computer Use transcript contains an identity not bound to the supervisor ledger.'
    );
  }

  return {
    valid: blockingReasons.length === 0,
    blockingReasons: [...new Set(blockingReasons)],
    bindings,
  };
};
