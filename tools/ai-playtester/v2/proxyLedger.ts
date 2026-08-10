import { createHash } from 'node:crypto';

import {
  COMPUTER_USE_TOOLS,
} from './worker.ts';
import type { CompletedComputerUseCall } from './transcript.ts';

export const COMPUTER_USE_PROXY_TOOL_CALL_SCHEMA =
  'computer_use_proxy_tool_call_v1' as const;
export const COMPUTER_USE_PROXY_PROTOCOL_VIOLATION_SCHEMA =
  'computer_use_proxy_protocol_violation_v1' as const;

interface ProxyToolCallLedgerEntry {
  schema: typeof COMPUTER_USE_PROXY_TOOL_CALL_SCHEMA;
  sequence: number;
  tool: string;
  fingerprint: string;
  resultSha256: string;
  callIdentitySha256: string;
  requestSha256: string;
  responseSha256: string;
  observerSynchronized: boolean;
  allowed: boolean;
}

export interface ProxyLedgerReconciliation {
  valid: boolean;
  blockingReasons: string[];
  bindings: ProxyLedgerCallBinding[];
}

export interface ProxyLedgerCallBinding {
  callIdentitySha256: string;
  proxySequence: number;
  transcriptItemId: string;
}

export const computerUseCallIdentitySha256 = (input: {
  sequence: number;
  tool: string;
  fingerprint: string;
  resultSha256: string;
}): string => createHash('sha256').update([
  String(input.sequence),
  input.tool,
  input.fingerprint,
  input.resultSha256,
].join('\0')).digest('hex');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isSha256 = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);

const parseToolEntry = (
  value: Record<string, unknown>,
  lineNumber: number
): ProxyToolCallLedgerEntry => {
  if (
    value.schema !== COMPUTER_USE_PROXY_TOOL_CALL_SCHEMA ||
    typeof value.sequence !== 'number' ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1 ||
    typeof value.tool !== 'string' ||
    !COMPUTER_USE_TOOLS.includes(value.tool as typeof COMPUTER_USE_TOOLS[number]) ||
    typeof value.fingerprint !== 'string' ||
    !/^[a-z_]+:[a-f\d]{64}$/i.test(value.fingerprint) ||
    !isSha256(value.resultSha256) ||
    !isSha256(value.callIdentitySha256) ||
    !isSha256(value.requestSha256) ||
    !isSha256(value.responseSha256) ||
    typeof value.observerSynchronized !== 'boolean' ||
    typeof value.allowed !== 'boolean'
  ) {
    throw new Error(`Computer Use proxy ledger line ${lineNumber} is malformed.`);
  }
  const entry = value as unknown as ProxyToolCallLedgerEntry;
  if (entry.callIdentitySha256 !== computerUseCallIdentitySha256(entry)) {
    throw new Error(`Computer Use proxy ledger line ${lineNumber} has an invalid call identity.`);
  }
  return entry;
};

export const reconcileComputerUseProxyLedger = (input: {
  ledgerJsonl: string;
  transcriptCalls: readonly CompletedComputerUseCall[];
}): ProxyLedgerReconciliation => {
  const blockingReasons: string[] = [];
  const bindings: ProxyLedgerCallBinding[] = [];
  const entries: ProxyToolCallLedgerEntry[] = [];
  const lines = input.ledgerJsonl.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    try {
      const value = JSON.parse(line) as unknown;
      if (!isRecord(value)) throw new Error('entry must be an object');
      if (value.schema === COMPUTER_USE_PROXY_PROTOCOL_VIOLATION_SCHEMA) {
        blockingReasons.push('Computer Use proxy recorded a protocol violation.');
        continue;
      }
      entries.push(parseToolEntry(value, index + 1));
    } catch (error) {
      blockingReasons.push(
        `Computer Use proxy ledger line ${index + 1} is invalid: ${(error as Error).message}`
      );
    }
  }

  if (entries.length === 0) {
    blockingReasons.push('Computer Use proxy ledger contains no external tool calls.');
  }
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.sequence !== index + 1) {
      blockingReasons.push('Computer Use proxy tool-call sequence is missing or out of order.');
    }
    if (!entry.allowed) {
      blockingReasons.push(`Computer Use proxy denied external call ${entry.sequence}.`);
    }
    if (entry.tool === 'get_app_state' && !entry.observerSynchronized) {
      blockingReasons.push(
        `Computer Use capture ${entry.sequence} lacks pre-action observer synchronization.`
      );
    }
  }
  if (entries.length !== input.transcriptCalls.length) {
    blockingReasons.push(
      `Computer Use proxy/transcript call count differs: ${entries.length} proxy, ` +
      `${input.transcriptCalls.length} transcript.`
    );
  }
  const transcriptByIdentity = new Map<string, {
    call: CompletedComputerUseCall;
    sequence: number;
  }>();
  input.transcriptCalls.forEach((call, index) => {
    const sequence = index + 1;
    const callIdentitySha256 = computerUseCallIdentitySha256({
      sequence,
      tool: call.tool,
      fingerprint: call.fingerprint,
      resultSha256: call.resultSha256,
    });
    transcriptByIdentity.set(callIdentitySha256, { call, sequence });
  });
  const matchedTranscriptIdentities = new Set<string>();
  for (const entry of entries) {
    const match = transcriptByIdentity.get(entry.callIdentitySha256);
    if (!match) {
      blockingReasons.push(
        `Computer Use proxy call identity has no transcript match at sequence ${entry.sequence}.`
      );
      continue;
    }
    if (matchedTranscriptIdentities.has(entry.callIdentitySha256)) {
      blockingReasons.push(
        `Computer Use proxy call identity was reused at sequence ${entry.sequence}.`
      );
      continue;
    }
    matchedTranscriptIdentities.add(entry.callIdentitySha256);
    bindings.push({
      callIdentitySha256: entry.callIdentitySha256,
      proxySequence: entry.sequence,
      transcriptItemId: match.call.id,
    });
  }
  if (matchedTranscriptIdentities.size !== input.transcriptCalls.length) {
    blockingReasons.push('Computer Use transcript contains an identity not bound to the proxy ledger.');
  }

  return {
    valid: blockingReasons.length === 0,
    blockingReasons: [...new Set(blockingReasons)],
    bindings,
  };
};
