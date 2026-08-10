import assert from 'node:assert/strict';
import test from 'node:test';

import {
  recoverableWorkerBlockKind,
  isRecoverableProtocolBlock,
  replaceRecoverableProtocolBlocks,
  type ProtocolRetryCandidate,
} from './protocolRetry.ts';

const recoverableCandidate = (overrides: Partial<ProtocolRetryCandidate> = {}): ProtocolRetryCandidate => ({
  outcome: 'blocked',
  supervisorViolation: 'Computer Use action click must be preceded by get_app_state.',
  transcriptBlockingReasons: [
    'Computer Use call click (item_2) has no completion evidence.',
    'Computer Use action click must be preceded by get_app_state.',
    'Computer Use action click must be followed by get_app_state.',
  ],
  responsePresent: false,
  responseError: undefined,
  timedOut: false,
  ...overrides,
});

test('protocol replacement is limited to the exact supervised capture-sequence block', () => {
  assert.equal(isRecoverableProtocolBlock(recoverableCandidate()), true);
  assert.equal(recoverableWorkerBlockKind(recoverableCandidate({
    responseError: "ENOENT: no such file or directory, open '/tmp/response.json'",
  })), 'capture-sequence');
  assert.equal(isRecoverableProtocolBlock(recoverableCandidate({
    supervisorViolation: 'Computer Use key is outside the packet-visible input allowlist: tab.',
  })), false);
  assert.equal(isRecoverableProtocolBlock(recoverableCandidate({
    supervisorViolation: 'Assigned browser target became ambiguous.',
  })), false);
  assert.equal(isRecoverableProtocolBlock(recoverableCandidate({ timedOut: true })), false);
  assert.equal(isRecoverableProtocolBlock(recoverableCandidate({ responsePresent: true })), false);
  assert.equal(isRecoverableProtocolBlock(recoverableCandidate({
    responseError: 'Worker model/config fallback warning.',
  })), false);
  assert.equal(isRecoverableProtocolBlock(recoverableCandidate({
    transcriptBlockingReasons: [
      ...recoverableCandidate().transcriptBlockingReasons,
      'Permission or browser dialog blocked the run.',
    ],
  })), false);
});

test('worker replacement accepts only the exact transient websocket disconnect shape', () => {
  const transportDisconnect = recoverableCandidate({
    supervisorViolation: undefined,
    transcriptBlockingReasons: [
      'Worker event failed: Reconnecting... 2/2 (stream disconnected before completion: websocket closed by server before response.completed).',
      'Computer Use action click must be followed by get_app_state.',
    ],
    responseError: "ENOENT: no such file or directory, open '/tmp/response.json'",
  });
  assert.equal(recoverableWorkerBlockKind(transportDisconnect), 'transport-disconnect');
  assert.equal(recoverableWorkerBlockKind({
    ...transportDisconnect,
    timedOut: true,
  }), undefined);
  assert.equal(recoverableWorkerBlockKind({
    ...transportDisconnect,
    transcriptBlockingReasons: ['Worker event failed: model fallback warning.'],
  }), undefined);
  assert.equal(recoverableWorkerBlockKind({
    ...transportDisconnect,
    responseError: 'Worker model/config fallback warning.',
  }), undefined);
});

test('worker replacement accepts only an empty exact Computer Use startup miss', () => {
  const startupMiss = recoverableCandidate({
    supervisorViolation: undefined,
    transcriptBlockingReasons: [
      'Transcript contains no Computer Use observation.',
      'Computer Use supervisor ledger contains no external tool calls.',
    ],
    responsePresent: true,
    responseSummary: 'Unable to begin validation because the configured Computer Use tools were not exposed in this session, so the required initial get_app_state marker check could not be performed.',
  });
  assert.equal(recoverableWorkerBlockKind(startupMiss), 'tool-startup-empty');
  assert.equal(recoverableWorkerBlockKind({
    ...startupMiss,
    responseSummary:
      'No configured Computer Use tool was available, so the required initial marker verification and game interaction could not be performed.',
  }), 'tool-startup-empty');
  assert.equal(recoverableWorkerBlockKind({
    ...startupMiss,
    responseSummary: 'A permission dialog blocked Computer Use.',
  }), undefined);
});

test('recoverable initial records receive exactly one replacement and remain diagnostic', async () => {
  const initial = [
    { id: 'worker-1', candidate: recoverableCandidate() },
    { id: 'worker-2', candidate: recoverableCandidate({ outcome: 'pass' }) },
  ];
  const launched: string[] = [];
  const result = await replaceRecoverableProtocolBlocks(
    initial,
    (record) => isRecoverableProtocolBlock(record.candidate),
    async (record, index) => {
      launched.push(record.id);
      return { id: `worker-${index + 1}-replacement-1`, candidate: recoverableCandidate({ outcome: 'pass' }) };
    }
  );

  assert.deepEqual(launched, ['worker-1']);
  assert.deepEqual(result.activeRecords.map((record) => record.id), [
    'worker-1-replacement-1',
    'worker-2',
  ]);
  assert.deepEqual(result.supersededRecords.map((record) => record.id), ['worker-1']);
  assert.equal(result.replacements.length, 1);
});

test('a worker slot gets at most two bounded replacements', async () => {
  const initial = [{ id: 'worker-1', recoverable: true }];
  const launched: string[] = [];
  const result = await replaceRecoverableProtocolBlocks(
    initial,
    (record) => record.recoverable,
    async (_record, slotIndex, attempt) => {
      const replacement = {
        id: `worker-${slotIndex + 1}-replacement-${attempt}`,
        recoverable: attempt < 2,
      };
      launched.push(replacement.id);
      return replacement;
    },
    2
  );

  assert.deepEqual(launched, ['worker-1-replacement-1', 'worker-1-replacement-2']);
  assert.deepEqual(result.activeRecords.map((record) => record.id), ['worker-1-replacement-2']);
  assert.equal(result.replacements.length, 2);
  assert.deepEqual(result.replacements.map((replacement) => replacement.attempt), [1, 2]);
});

test('non-recoverable records are never relaunched', async () => {
  const initial = [{
    id: 'worker-1',
    candidate: recoverableCandidate({ timedOut: true }),
  }];
  let launches = 0;
  const result = await replaceRecoverableProtocolBlocks(
    initial,
    (record) => isRecoverableProtocolBlock(record.candidate),
    async (record) => {
      launches += 1;
      return record;
    }
  );

  assert.equal(launches, 0);
  assert.deepEqual(result.activeRecords, initial);
  assert.deepEqual(result.supersededRecords, []);
  assert.deepEqual(result.replacements, []);
});
