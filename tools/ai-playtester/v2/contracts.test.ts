import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMPUTER_USE_MCP_COMMAND,
  auditWorkerTranscript,
  buildOwnedDevServerLaunch,
  buildWorkerInvocation,
  classifyEvidence,
  decideQuorum,
  exitCodeForOutcome,
  filterComputerUseToolListResponse,
  hashComputerUseResult,
  parseCliArgs,
  parseCompletedComputerUseCall,
  parseCodexRuntimeAttestation,
  parseCodexExecRuntimeAttestation,
  parseComputerUseCodeSignature,
  parseLsofListenerPids,
  parseProcessRelationships,
  resolveQuorumWithTieBreaker,
  reconcileComputerUseProxyLedger,
  renderGateReportMarkdown,
  assertOwnedServerListener,
  assertSynchronizedCaptureDigest,
  assertServedSourceHashes,
  validateProxyPreAction,
  validateComputerUseProxyRequestShape,
  validateCheckpoint,
  waitForProxyQueueSettlement,
  type CheckpointProvenance,
  type WorkerVerdict,
} from './index.ts';

const sha = (character: string): string => character.repeat(64);

const validCheckpoint: CheckpointProvenance = {
  checkpointId: 'checkpoint-affected-1',
  buildHash: sha('a'),
  contentHash: sha('b'),
  layoutHash: sha('c'),
  probeSchemaHash: sha('d'),
  newGameReplayProof: {
    verified: true,
    traceHash: sha('e'),
  },
};

const currentCheckpointHashes = {
  buildHash: validCheckpoint.buildHash,
  contentHash: validCheckpoint.contentHash,
  layoutHash: validCheckpoint.layoutHash,
  probeSchemaHash: validCheckpoint.probeSchemaHash,
};

test('CLI parser defaults to affected mode', () => {
  assert.deepEqual(parseCliArgs(['--ticket', 'GET-179']), {
    ticket: 'GET-179',
    mode: 'affected',
    dryRun: false,
  });
});

test('CLI parser accepts closeout and dry-run', () => {
  assert.deepEqual(
    parseCliArgs(['--dry-run', '--mode', 'closeout', '--ticket', 'GET-204']),
    { ticket: 'GET-204', mode: 'closeout', dryRun: true }
  );
});

test('CLI parser requires one valid ticket', () => {
  assert.throws(() => parseCliArgs([]), /--ticket GET-XXX is required/);
  assert.throws(() => parseCliArgs(['--ticket', 'get-179']), /must match GET-XXX/);
  assert.throws(
    () => parseCliArgs(['--ticket', 'GET-179', '--ticket', 'GET-180']),
    /may be provided only once/
  );
});

test('CLI parser rejects unknown mode and positional arguments', () => {
  assert.throws(
    () => parseCliArgs(['--ticket', 'GET-179', '--mode', 'fast']),
    /--mode must be affected or closeout/
  );
  assert.throws(() => parseCliArgs(['--ticket', 'GET-179', 'extra']), /Unknown argument: extra/);
});

for (const legacyFlag of ['--profile', '--max-steps', '--codex', '--no-codex']) {
  test(`CLI parser gives a migration error for ${legacyFlag}`, () => {
    assert.throws(
      () => parseCliArgs(['--ticket', 'GET-179', legacyFlag]),
      new RegExp(`${legacyFlag}.*retired.*--ticket GET-XXX.*--mode affected\\|closeout`, 'i')
    );
  });
}

test('exit codes map pass/fail/blocked/harness-error exactly', () => {
  assert.equal(exitCodeForOutcome('pass'), 0);
  assert.equal(exitCodeForOutcome('fail'), 1);
  assert.equal(exitCodeForOutcome('blocked'), 2);
  assert.equal(exitCodeForOutcome('harness-error'), 3);
});

test('affected mode accepts no checkpoint or a fully proven checkpoint', () => {
  assert.deepEqual(validateCheckpoint('affected'), { valid: true, errors: [] });
  assert.deepEqual(
    validateCheckpoint('affected', validCheckpoint, currentCheckpointHashes),
    { valid: true, errors: [] }
  );
});

test('affected checkpoints fail closed when current hashes are unavailable or stale', () => {
  assert.deepEqual(validateCheckpoint('affected', validCheckpoint), {
    valid: false,
    errors: ['Current build, content, layout, and probe-schema hashes are required.'],
  });
  assert.deepEqual(
    validateCheckpoint('affected', validCheckpoint, {
      ...currentCheckpointHashes,
      layoutHash: sha('f'),
    }),
    {
      valid: false,
      errors: ['Checkpoint layoutHash does not match the current layoutHash.'],
    }
  );
  assert.deepEqual(
    validateCheckpoint('affected', validCheckpoint, {
      ...currentCheckpointHashes,
      probeSchemaHash: 'unavailable',
    }),
    {
      valid: false,
      errors: ['Current probeSchemaHash must be a SHA-256 hex digest.'],
    }
  );
});

test('checkpoint validation requires every provenance hash and New Game replay proof', () => {
  const invalid = {
    ...validCheckpoint,
    contentHash: 'not-a-hash',
    newGameReplayProof: { verified: false, traceHash: '' },
  };
  const result = validateCheckpoint('affected', invalid, currentCheckpointHashes);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    'contentHash must be a SHA-256 hex digest.',
    'newGameReplayProof.verified must be true.',
    'newGameReplayProof.traceHash must be a SHA-256 hex digest.',
  ]);
});

test('closeout mode rejects checkpoints', () => {
  assert.deepEqual(validateCheckpoint('closeout', validCheckpoint), {
    valid: false,
    errors: ['Closeout mode must start from New Game and cannot use a checkpoint.'],
  });
});

test('evidence classification keeps clean evidence concise', () => {
  assert.deepEqual(classifyEvidence([]), {
    outcome: 'pass',
    retention: 'concise',
    reasons: [],
  });
});

test('evidence classification reports evidence-valid gameplay defects as failure', () => {
  assert.deepEqual(
    classifyEvidence([
      { kind: 'gameplay-defect', evidenceValid: true, message: 'Door cannot be opened.' },
    ]),
    { outcome: 'fail', retention: 'diagnostic', reasons: ['Door cannot be opened.'] }
  );
});

test('evidence classification fails closed on invalid evidence or integrity/environment issues', () => {
  const result = classifyEvidence([
    { kind: 'gameplay-defect', evidenceValid: false, message: 'Unproven route failure.' },
    { kind: 'integrity-failure', evidenceValid: true, message: 'Unexpected tool call.' },
    { kind: 'environment-blocker', evidenceValid: true, message: 'Computer Use unavailable.' },
  ]);
  assert.deepEqual(result, {
    outcome: 'blocked',
    retention: 'diagnostic',
    reasons: ['Unproven route failure.', 'Unexpected tool call.', 'Computer Use unavailable.'],
  });
});

const verdict = (
  workerId: string,
  outcome: WorkerVerdict['outcome'],
  evidenceValid = true,
  integrityValid = true
): WorkerVerdict => ({ workerId, outcome, evidenceValid, integrityValid });

test('one-worker quorum resolves without a tie-breaker', () => {
  assert.deepEqual(decideQuorum(1, [verdict('worker-1', 'pass')]), {
    state: 'resolved',
    outcome: 'pass',
    runTieBreaker: false,
  });
});

test('two agreeing workers resolve without a tie-breaker', () => {
  assert.deepEqual(
    decideQuorum(2, [verdict('worker-1', 'fail'), verdict('worker-2', 'fail')]),
    { state: 'resolved', outcome: 'fail', runTieBreaker: false }
  );
});

test('two evidence-valid disagreeing workers request one fresh blind tie-breaker', () => {
  assert.deepEqual(
    decideQuorum(2, [verdict('worker-1', 'pass'), verdict('worker-2', 'fail')]),
    {
      state: 'tie-break-required',
      runTieBreaker: true,
      tieBreaker: { count: 1, blind: true, fresh: true },
    }
  );
});

test('a fresh blind tie-breaker resolves only through an evidence-valid matching pair', () => {
  assert.deepEqual(
    decideQuorum(
      2,
      [verdict('worker-1', 'pass'), verdict('worker-2', 'fail')],
      verdict('tie-breaker', 'pass')
    ),
    { state: 'resolved', outcome: 'pass', runTieBreaker: false }
  );
});

test('quorum protocol launches exactly one fresh blind tie-breaker on disagreement', async () => {
  let launches = 0;
  const result = await resolveQuorumWithTieBreaker(
    2,
    [verdict('worker-1', 'pass'), verdict('worker-2', 'fail')],
    async () => {
      launches += 1;
      return {
        record: { isolated: true },
        verdict: verdict('tie-breaker', 'pass'),
      };
    }
  );
  assert.equal(launches, 1);
  assert.deepEqual(result, {
    decision: { state: 'resolved', outcome: 'pass', runTieBreaker: false },
    tieBreakerRecord: { isolated: true },
  });
});

test('quorum protocol never launches a tie-breaker when initial verdicts agree', async () => {
  let launches = 0;
  const result = await resolveQuorumWithTieBreaker(
    2,
    [verdict('worker-1', 'pass'), verdict('worker-2', 'pass')],
    async () => {
      launches += 1;
      return { record: null, verdict: verdict('tie-breaker', 'pass') };
    }
  );
  assert.equal(launches, 0);
  assert.deepEqual(result, {
    decision: { state: 'resolved', outcome: 'pass', runTieBreaker: false },
  });
});

test('quorum blocks on invalid evidence, integrity failure, or blocked worker', () => {
  for (const workers of [
    [verdict('worker-1', 'pass', false)],
    [verdict('worker-1', 'pass', true, false)],
    [verdict('worker-1', 'blocked')],
  ]) {
    const result = decideQuorum(1, workers);
    assert.equal(result.state, 'blocked');
    assert.equal(result.outcome, 'blocked');
    assert.equal(result.runTieBreaker, false);
  }
});

test('worker invocation is pinned, isolated, read-only, and Computer-Use-only', () => {
  const invocation = buildWorkerInvocation({
    workerHome: '/private/tmp/get179-home-1',
    workerCwd: '/private/tmp/get179-cwd-1',
    outputSchemaPath: '/private/tmp/get179-result.schema.json',
    outputPath: '/private/tmp/get179-result.json',
    computerUsePolicy: {
      actionTools: ['click', 'press_key'],
      keys: ['w', 'a', 's', 'd', 'e', 'o', 'escape'],
    },
  });

  assert.equal(invocation.command, '/opt/homebrew/bin/codex');
  assert.equal(invocation.env.CODEX_HOME, '/private/tmp/get179-home-1');
  assert.deepEqual(invocation.env, {
    CODEX_HOME: '/private/tmp/get179-home-1',
    HOME: '/private/tmp/get179-home-1',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
    PATH: '/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    TMPDIR: '/private/tmp',
  });
  assert.deepEqual(invocation.args.slice(0, 2), ['exec', '--ignore-user-config']);
  assert.equal(invocation.args.includes('--ephemeral'), false);
  for (const value of [
    '--ignore-rules',
    '--strict-config',
    '--skip-git-repo-check',
    '--json',
    'gpt-5.6-sol',
    'model_provider="openai"',
    'read-only',
    'model_reasoning_effort="high"',
    'history.persistence="save-all"',
    `mcp_servers.computer-use.command=${JSON.stringify(COMPUTER_USE_MCP_COMMAND)}`,
    `mcp_servers.computer-use.args=${JSON.stringify(['mcp'])}`,
    `mcp_servers.computer-use.enabled_tools=${JSON.stringify(['get_app_state', 'click', 'press_key'])}`,
    'mcp_servers.computer-use.tool_timeout_sec=90',
  ]) {
    assert.ok(invocation.args.includes(value), `missing worker argument: ${value}`);
  }
  for (const feature of [
    'computer_use',
    'browser_use',
    'browser_use_external',
    'browser_use_full_cdp_access',
    'in_app_browser',
    'shell_tool',
    'unified_exec',
    'shell_snapshot',
    'apps',
    'plugins',
    'remote_plugin',
    'memories',
    'multi_agent',
    'goals',
    'hooks',
    'skill_search',
    'skill_mcp_dependency_install',
    'workspace_dependencies',
    'image_generation',
  ]) {
    const index = invocation.args.indexOf('--disable');
    assert.ok(
      invocation.args.some((arg, argIndex) => arg === feature && invocation.args[argIndex - 1] === '--disable'),
      `feature was not disabled: ${feature}; first disable at ${index}`
    );
  }
  assert.ok(!invocation.args.some(
    (arg, argIndex) => arg === 'computer_use' && invocation.args[argIndex - 1] === '--enable'
  ));
  for (const setting of [
    'web_search="disabled"',
    'tools.web_search=false',
  ]) {
    assert.ok(invocation.args.includes(setting), `missing disabled tool setting: ${setting}`);
  }
  assert.equal(invocation.args.at(-1), '-');
  assert.ok(!invocation.args.includes('--dangerously-bypass-approvals-and-sandbox'));
  assert.ok(
    !invocation.args.some((argument) =>
      argument.includes('computerUseProxy.ts') || argument.includes('node_modules/.bin/tsx')
    ),
    'Computer Use must be a direct signed Codex child; an unsigned Node proxy breaks macOS trust.'
  );
});

test('worker auth source follows the supervisor Codex home with a portable fallback', async () => {
  const runtime = await import('./workerRuntime.ts') as unknown as {
    resolveCodexAuthSource?: (input: {
      environment?: { CODEX_HOME?: string };
      userHome: string;
    }) => string;
  };
  assert.equal(typeof runtime.resolveCodexAuthSource, 'function');
  assert.equal(
    runtime.resolveCodexAuthSource?.({
      environment: { CODEX_HOME: '/srv/reviewed-codex-home' },
      userHome: '/Users/ignored',
    }),
    '/srv/reviewed-codex-home/auth.json'
  );
  assert.equal(
    runtime.resolveCodexAuthSource?.({ environment: {}, userHome: '/Users/reviewer' }),
    '/Users/reviewer/.codex/auth.json'
  );
});

test('worker invocation rejects non-absolute or shared isolation paths', () => {
  const base: Parameters<typeof buildWorkerInvocation>[0] = {
    workerHome: '/private/tmp/get179-worker',
    workerCwd: '/private/tmp/get179-cwd',
    outputSchemaPath: '/private/tmp/result.schema.json',
    outputPath: '/private/tmp/result.json',
    computerUsePolicy: {
      actionTools: ['click', 'press_key'],
      keys: ['w', 'escape'],
    },
  };
  assert.throws(() => buildWorkerInvocation({ ...base, workerHome: 'relative' }), /absolute/);
  assert.throws(
    () => buildWorkerInvocation({ ...base, workerCwd: base.workerHome }),
    /must be distinct/
  );
});

test('Computer Use signature parser requires the reviewed OpenAI identity', () => {
  const signature = [
    'Executable=/signed/SkyComputerUseClient',
    'Identifier=com.openai.sky.CUAService.cli',
    'Authority=Developer ID Application: OpenAI OpCo, LLC (2DC432GLL2)',
    'TeamIdentifier=2DC432GLL2',
  ].join('\n');
  assert.deepEqual(parseComputerUseCodeSignature(signature), {
    identifier: 'com.openai.sky.CUAService.cli',
    teamIdentifier: '2DC432GLL2',
    authority: 'Developer ID Application: OpenAI OpCo, LLC (2DC432GLL2)',
  });
  assert.throws(
    () => parseComputerUseCodeSignature(signature.replace('2DC432GLL2', 'UNTRUSTED',)),
    /signature identity/
  );
});

test('supervised Computer Use proxy fails closed before visible actions', () => {
  const valid = {
    tool: 'click',
    arguments: { app: 'Google Chrome', element_index: 42, click_count: 1 },
    expectedApp: 'Google Chrome',
    allowedActionTools: ['click', 'press_key'],
    allowedPlayerKeys: ['w', 'escape'],
    externalCaptureReady: true,
    processOwnershipValidBeforeCapture: true,
    processOwnershipValidAfterCapture: true,
    internalMarkerVerified: true,
    internalPermissionReady: true,
  } as const;
  assert.deepEqual(validateProxyPreAction(valid), []);
  assert.match(validateProxyPreAction({
    ...valid,
    externalCaptureReady: false,
  }).join(' '), /external get_app_state/);
  assert.match(validateProxyPreAction({
    ...valid,
    processOwnershipValidAfterCapture: false,
  }).join(' '), /ownership changed during/);
  assert.match(validateProxyPreAction({
    ...valid,
    internalMarkerVerified: false,
  }).join(' '), /visible marker/);
  assert.match(validateProxyPreAction({
    ...valid,
    internalPermissionReady: false,
  }).join(' '), /permission or app-approval/);
  assert.match(validateProxyPreAction({
    ...valid,
    tool: 'scroll',
  }).join(' '), /not allowlisted/);
  assert.match(validateProxyPreAction({
    ...valid,
    arguments: { app: 'Brave Browser', element_index: 42 },
  }).join(' '), /assigned browser app/);
});

test('supervised Computer Use proxy advertises only the packet-reviewed tool surface', () => {
  const response = filterComputerUseToolListResponse({
    jsonrpc: '2.0',
    id: 2,
    result: {
      tools: [
        { name: 'list_apps' },
        { name: 'get_app_state' },
        { name: 'click' },
        { name: 'type_text' },
        { name: 'press_key' },
        { name: 'scroll' },
        { name: 'drag' },
      ],
    },
  }, new Set(['get_app_state', 'click', 'press_key']));
  assert.deepEqual(
    (response.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name),
    ['get_app_state', 'click', 'press_key']
  );
});

test('supervised Computer Use proxy rejects malformed calls and tool-call notifications', () => {
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: { name: 'list_apps' },
  }) ?? '', /malformed/);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: { name: 'click', arguments: { app: 'Google Chrome', element_index: 1 } },
  }) ?? '', /notifications are forbidden/);
  assert.equal(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    id: 8,
    method: 'tools/call',
    params: { name: 'click', arguments: { app: 'Google Chrome', element_index: 1 } },
  }), undefined);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '1.0',
    id: 9,
    method: 'tools/call',
    params: { name: 'click', arguments: { app: 'Google Chrome', element_index: 1 } },
  }) ?? '', /JSON-RPC 2\.0/);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    id: {} as never,
    method: 'tools/call',
    params: { name: 'click', arguments: { app: 'Google Chrome', element_index: 1 } },
  }) ?? '', /correlation ID/);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    method: {} as never,
  }) ?? '', /method must be a non-empty string/);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
  }) ?? '', /method or correlation ID/);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    method: 'tools/list',
  }) ?? '', /request.*correlation ID/);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    id: {} as never,
    method: 'tools/list',
  }) ?? '', /correlation ID/);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    id: 10,
    method: 'notifications/initialized',
  }) ?? '', /notification.*correlation ID/i);
  assert.match(validateComputerUseProxyRequestShape({
    jsonrpc: '2.0',
    id: 11,
    method: '',
  }) ?? '', /non-empty/);
});

test('proxy ledger binds every transcript item to a content-addressed proxy call ID', async () => {
  const proxyLedger = await import('./proxyLedger.ts') as unknown as {
    computerUseCallIdentitySha256?: (input: {
      sequence: number;
      tool: string;
      fingerprint: string;
      resultSha256: string;
    }) => string;
  };
  assert.equal(typeof proxyLedger.computerUseCallIdentitySha256, 'function');
  const callIdentity = proxyLedger.computerUseCallIdentitySha256!;
  const captureResult = { content: [{ type: 'text', text: 'marker-1' }] };
  const actionResult = { content: [{ type: 'text', text: 'clicked' }] };
  const calls = [
    {
      id: 'capture-1',
      tool: 'get_app_state' as const,
      arguments: { app: 'Google Chrome' },
      fingerprint: `get_app_state:${sha('a')}`,
      resultSha256: hashComputerUseResult(captureResult),
      markerVerified: true,
    },
    {
      id: 'action-1',
      tool: 'click' as const,
      arguments: { app: 'Google Chrome', element_index: 42 },
      fingerprint: `click:${sha('b')}`,
      resultSha256: hashComputerUseResult(actionResult),
      markerVerified: true,
    },
    {
      id: 'capture-2',
      tool: 'get_app_state' as const,
      arguments: { app: 'Google Chrome' },
      fingerprint: `get_app_state:${sha('a')}`,
      resultSha256: hashComputerUseResult(captureResult),
      markerVerified: true,
    },
  ];
  const entry = (
    sequence: number,
    call: typeof calls[number],
    observerSynchronized: boolean
  ) => {
    const identityInput = {
      sequence,
      tool: call.tool,
      fingerprint: call.fingerprint,
      resultSha256: call.resultSha256,
    };
    return JSON.stringify({
      schema: 'computer_use_proxy_tool_call_v1',
      ...identityInput,
      callIdentitySha256: callIdentity(identityInput),
      requestSha256: sha('c'),
      responseSha256: sha('d'),
      observerSynchronized,
      allowed: true,
    });
  };
  const ledgerJsonl = calls
    .map((call, index) => entry(index + 1, call, call.tool === 'get_app_state'))
    .join('\n');

  assert.deepEqual(reconcileComputerUseProxyLedger({ ledgerJsonl, transcriptCalls: calls }), {
    valid: true,
    blockingReasons: [],
    bindings: calls.map((call, index) => ({
      callIdentitySha256: callIdentity({
        sequence: index + 1,
        tool: call.tool,
        fingerprint: call.fingerprint,
        resultSha256: call.resultSha256,
      }),
      proxySequence: index + 1,
      transcriptItemId: call.id,
    })),
  });
  const missingAction = reconcileComputerUseProxyLedger({
    ledgerJsonl,
    transcriptCalls: [calls[0], calls[2]],
  });
  assert.equal(missingAction.valid, false);
  assert.match(missingAction.blockingReasons.join(' '), /3.*2|count/i);
  const mismatchedResult = reconcileComputerUseProxyLedger({
    ledgerJsonl,
    transcriptCalls: [calls[0], { ...calls[1], resultSha256: sha('e') }, calls[2]],
  });
  assert.equal(mismatchedResult.valid, false);
  assert.match(mismatchedResult.blockingReasons.join(' '), /identity/i);
  const firstIdentity = callIdentity({
    sequence: 1,
    tool: calls[0].tool,
    fingerprint: calls[0].fingerprint,
    resultSha256: calls[0].resultSha256,
  });
  const forgedIdentity = reconcileComputerUseProxyLedger({
    ledgerJsonl: ledgerJsonl.replace(firstIdentity, sha('f')),
    transcriptCalls: calls,
  });
  assert.equal(forgedIdentity.valid, false);
  assert.match(forgedIdentity.blockingReasons.join(' '), /identity/i);
  const deniedLedger = reconcileComputerUseProxyLedger({
    ledgerJsonl: ledgerJsonl.replace('"allowed":true', '"allowed":false'),
    transcriptCalls: calls,
  });
  assert.equal(deniedLedger.valid, false);
  assert.match(deniedLedger.blockingReasons.join(' '), /denied/i);
  const terminalProtocolViolation = reconcileComputerUseProxyLedger({
    ledgerJsonl: `${ledgerJsonl}\n${JSON.stringify({
      schema: 'computer_use_proxy_protocol_violation_v1',
      requestSha256: sha('f'),
      reasonSha256: sha('a'),
      allowed: false,
    })}`,
    transcriptCalls: calls,
  });
  assert.equal(terminalProtocolViolation.valid, false);
  assert.match(terminalProtocolViolation.blockingReasons.join(' '), /protocol violation/i);
});

test('direct Computer Use supervisor ledger binds every signed-child call and capture', async () => {
  const ledger = await import('./supervisorLedger.ts') as unknown as {
    createComputerUseSupervisorLedgerEntry?: (input: {
      sequence: number;
      call: {
        id: string;
        tool: 'get_app_state' | 'click';
        arguments: Record<string, unknown>;
        fingerprint: string;
        resultSha256: string;
        markerVerified: boolean;
      };
      observerSynchronized: boolean;
      browserOwnershipVerified: boolean;
    }) => Record<string, unknown>;
    reconcileComputerUseSupervisorLedger?: (input: {
      ledgerJsonl: string;
      transcriptCalls: readonly {
        id: string;
        tool: 'get_app_state' | 'click';
        arguments: Record<string, unknown>;
        fingerprint: string;
        resultSha256: string;
        markerVerified: boolean;
      }[];
    }) => { valid: boolean; blockingReasons: string[]; bindings: unknown[] };
  };
  assert.equal(typeof ledger.createComputerUseSupervisorLedgerEntry, 'function');
  assert.equal(typeof ledger.reconcileComputerUseSupervisorLedger, 'function');
  const calls = [
    {
      id: 'capture-1',
      tool: 'get_app_state' as const,
      arguments: { app: 'Google Chrome for Testing' },
      fingerprint: `get_app_state:${sha('a')}`,
      resultSha256: sha('b'),
      markerVerified: true,
    },
    {
      id: 'action-1',
      tool: 'click' as const,
      arguments: { app: 'Google Chrome for Testing', element_index: 42 },
      fingerprint: `click:${sha('c')}`,
      resultSha256: sha('d'),
      markerVerified: true,
    },
    {
      id: 'capture-2',
      tool: 'get_app_state' as const,
      arguments: { app: 'Google Chrome for Testing' },
      fingerprint: `get_app_state:${sha('e')}`,
      resultSha256: sha('f'),
      markerVerified: true,
    },
  ];
  const entries = calls.map((call, index) =>
    ledger.createComputerUseSupervisorLedgerEntry!({
      sequence: index + 1,
      call,
      observerSynchronized: call.tool === 'get_app_state',
      browserOwnershipVerified: true,
    })
  );
  const ledgerJsonl = entries.map((entry) => JSON.stringify(entry)).join('\n');
  const valid = ledger.reconcileComputerUseSupervisorLedger!({
    ledgerJsonl,
    transcriptCalls: calls,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.blockingReasons.length, 0);
  assert.equal(valid.bindings.length, calls.length);

  const unsynchronized = ledger.reconcileComputerUseSupervisorLedger!({
    ledgerJsonl: ledgerJsonl.replace('"observerSynchronized":true', '"observerSynchronized":false'),
    transcriptCalls: calls,
  });
  assert.equal(unsynchronized.valid, false);
  assert.match(unsynchronized.blockingReasons.join(' '), /observer synchronization/i);

  const wrongBrowser = ledger.reconcileComputerUseSupervisorLedger!({
    ledgerJsonl: ledgerJsonl.replace(
      '"browserOwnershipVerified":true',
      '"browserOwnershipVerified":false'
    ),
    transcriptCalls: calls,
  });
  assert.equal(wrongBrowser.valid, false);
  assert.match(wrongBrowser.blockingReasons.join(' '), /browser ownership/i);
});

test('gate report labels required invariants as derived summaries, not independent evidence', () => {
  const markdown = renderGateReportMarkdown({
    schema: 'playtest_gate_report_v2',
    runId: 'get-179-derived-invariants',
    ticket: 'GET-179',
    mode: 'affected',
    packetId: 'GET-179:affected',
    packetRevision: 1,
    packetSha256: sha('a'),
    packetEvidenceRef: 'playtest-packet.json',
    outcome: 'blocked',
    exitCode: 2,
    startedAt: '2026-08-10T00:00:00.000Z',
    completedAt: '2026-08-10T00:01:00.000Z',
    retention: 'diagnostic',
    verdicts: [],
    probeResults: [],
    invariantEvidenceBasis: 'derived',
    invariantResults: [{
      invariantId: 'window-marker',
      state: 'met',
      acceptanceEligible: true,
      evidenceRefs: ['workers/worker-1/trace.zip'],
    }],
    probeTimeline: [],
    evidenceRefs: ['playtest-packet.json'],
    warnings: [],
    findings: [],
    quorum: { required: 1, valid: 0, decidingWorkerIds: [] },
  } as never);

  assert.match(markdown, /## Derived required invariants/);
  assert.match(markdown, /derived from the primary gate checks; they are not independent corroboration/i);
  assert.doesNotMatch(markdown, /## Required invariants/);
});

test('Computer Use result hashing is stable across object key serialization order', () => {
  assert.equal(
    hashComputerUseResult({ b: 2, a: { d: 4, c: 3 } }),
    hashComputerUseResult({ a: { c: 3, d: 4 }, b: 2 })
  );
});

test('proxy queue rejection remains an independently auditable integrity failure', async () => {
  assert.deepEqual(
    await waitForProxyQueueSettlement(Promise.reject(new Error('ledger unavailable')), 100),
    { state: 'rejected', reason: 'ledger unavailable' }
  );
  const audit = auditWorkerTranscript({
    jsonl: mcpEvent('capture-1', 'get_app_state'),
    stderr: 'GET-179 Computer Use proxy integrity violation: queue rejected.',
  });
  assert.equal(audit.valid, false);
  assert.match(audit.blockingReasons.join(' '), /proxy integrity violation/i);
});

test('observer capture binding rejects a proxy/transcript result mismatch', () => {
  assert.doesNotThrow(() => assertSynchronizedCaptureDigest(sha('a'), sha('a')));
  assert.throws(
    () => assertSynchronizedCaptureDigest(sha('a'), sha('b')),
    /did not match its proxy-synchronized result/
  );
});

test('owned server evidence blocks when served sources change during a gate', () => {
  const hashes = {
    buildHash: sha('a'),
    contentHash: sha('b'),
    layoutHash: sha('c'),
    probeSchemaHash: sha('d'),
  };
  assert.doesNotThrow(() => assertServedSourceHashes(hashes, { ...hashes }));
  assert.throws(() => assertServedSourceHashes(hashes, {
    ...hashes,
    buildHash: sha('e'),
  }), /served source hashes changed/);
});

test('owned server listener must be the sole listener in the launched process tree', () => {
  const processes = '100 1\n101 100\n102 101\n900 1\n';
  assert.deepEqual(parseProcessRelationships(processes), [
    { pid: 100, parentPid: 1 },
    { pid: 101, parentPid: 100 },
    { pid: 102, parentPid: 101 },
    { pid: 900, parentPid: 1 },
  ]);
  assert.deepEqual(parseLsofListenerPids('p102\nf18\np102\nf19\n'), [102]);
  assert.deepEqual(assertOwnedServerListener({
    rootPid: 100,
    processOutput: processes,
    lsofOutput: 'p102\nf18\n',
  }), [102]);
  assert.throws(() => assertOwnedServerListener({
    rootPid: 100,
    processOutput: processes,
    lsofOutput: 'p900\nf18\n',
  }), /not owned/);
  assert.throws(() => assertOwnedServerListener({
    rootPid: 100,
    processOutput: processes,
    lsofOutput: 'p101\nf18\np102\nf19\n',
  }), /exactly one listener process/);
});

test('owned server launch uses its dynamically reserved localhost port', () => {
  assert.deepEqual(buildOwnedDevServerLaunch(49321), {
    baseUrl: 'http://127.0.0.1:49321',
    args: ['yarn', 'dev', '--host', '127.0.0.1', '--port', '49321', '--strictPort'],
  });
});

const runtimeAttestationResponse = {
  id: 2,
  result: {
    thread: {
      id: 'thread-1',
      ephemeral: true,
      path: null,
      modelProvider: 'openai',
      cwd: '/private/tmp/get179-worker/workspace',
      cliVersion: '0.145.0',
    },
    model: 'gpt-5.6-sol',
    modelProvider: 'openai',
    cwd: '/private/tmp/get179-worker/workspace',
    runtimeWorkspaceRoots: ['/private/tmp/get179-worker/workspace'],
    instructionSources: [],
    approvalPolicy: 'never',
    sandbox: { type: 'readOnly', networkAccess: false },
    reasoningEffort: 'high',
    multiAgentMode: 'explicitRequestOnly',
  },
};

test('runtime attestation proves the resolved exact model without provider fallback', () => {
  assert.deepEqual(
    parseCodexRuntimeAttestation(runtimeAttestationResponse, {
      workerCwd: '/private/tmp/get179-worker/workspace',
      providerModelFallbackAllowed: false,
    }),
    {
      schema: 'codex_runtime_attestation_v1',
      source: 'codex-app-server-thread-start',
      model: 'gpt-5.6-sol',
      modelProvider: 'openai',
      reasoningEffort: 'high',
      providerModelFallbackAllowed: false,
      ephemeral: true,
      instructionSources: [],
      approvalPolicy: 'never',
      sandbox: { type: 'readOnly', networkAccess: false },
      runtimeWorkspaceRoots: ['/private/tmp/get179-worker/workspace'],
      multiAgentMode: 'explicitRequestOnly',
    }
  );
});

test('runtime attestation accepts no capability roots as the strongest isolation', () => {
  const response = {
    ...runtimeAttestationResponse,
    result: {
      ...runtimeAttestationResponse.result,
      runtimeWorkspaceRoots: [],
    },
  };

  assert.deepEqual(
    parseCodexRuntimeAttestation(response, {
      workerCwd: '/private/tmp/get179-worker/workspace',
      providerModelFallbackAllowed: false,
    }).runtimeWorkspaceRoots,
    []
  );
});

test('runtime attestation fails closed on substituted model, fallback, or instructions', () => {
  assert.throws(
    () => parseCodexRuntimeAttestation({
      ...runtimeAttestationResponse,
      result: { ...runtimeAttestationResponse.result, model: 'fallback-model' },
    }, {
      workerCwd: '/private/tmp/get179-worker/workspace',
      providerModelFallbackAllowed: false,
    }),
    /resolved model/
  );
  assert.throws(
    () => parseCodexRuntimeAttestation(runtimeAttestationResponse, {
      workerCwd: '/private/tmp/get179-worker/workspace',
      providerModelFallbackAllowed: true,
    }),
    /fallback must be disabled/
  );
  assert.throws(
    () => parseCodexRuntimeAttestation({
      ...runtimeAttestationResponse,
      result: {
        ...runtimeAttestationResponse.result,
        instructionSources: ['/Users/deus/AGENTS.md'],
      },
    }, {
      workerCwd: '/private/tmp/get179-worker/workspace',
      providerModelFallbackAllowed: false,
    }),
    /instruction sources/
  );
});

test('runtime attestation binds the effective model to disposable same-thread state and rollout', () => {
  const configuration = parseCodexRuntimeAttestation(runtimeAttestationResponse, {
    workerCwd: '/private/tmp/get179-worker/workspace',
    providerModelFallbackAllowed: false,
  });
  const threadId = '019f774c-844e-7352-bd89-7d609da15100';
  const jsonl = JSON.stringify({ type: 'thread.started', thread_id: threadId });
  const workerHome = '/private/tmp/get179-worker/home';
  const workerCwd = '/private/tmp/get179-worker/workspace';
  const stateRows = [{
    id: threadId,
    model_provider: 'openai',
    model: 'gpt-5.6-sol',
    reasoning_effort: 'high',
    cwd: workerCwd,
    source: 'exec',
    cli_version: '0.145.0',
    rollout_path: `${workerHome}/sessions/rollout-${threadId}.jsonl`,
  }];
  const rolloutRows = [
    {
      type: 'session_meta',
      payload: {
        id: threadId,
        cwd: workerCwd,
        model_provider: 'openai',
        cli_version: '0.145.0',
        source: 'exec',
      },
    },
    {
      type: 'turn_context',
      payload: {
        model: 'gpt-5.6-sol',
        effort: 'high',
        approval_policy: 'never',
        sandbox_policy: { type: 'read-only' },
        cwd: workerCwd,
      },
    },
  ];
  const rolloutJsonl = rolloutRows.map((row) => JSON.stringify(row)).join('\n');
  assert.deepEqual(parseCodexExecRuntimeAttestation({
    jsonl,
    stateRows,
    rolloutJsonl,
    configuration,
    actualStateSha256: 'a'.repeat(64),
    actualRolloutSha256: 'b'.repeat(64),
    workerHome,
    workerCwd,
    resolvedSessionsRoot: `${workerHome}/sessions`,
    resolvedRolloutPath: `${workerHome}/sessions/rollout-${threadId}.jsonl`,
    codexVersion: '0.145.0',
  }), {
    schema: 'codex_exec_runtime_attestation_v2',
    source: 'codex-exec-disposable-state-and-rollout',
    threadId,
    model: 'gpt-5.6-sol',
    modelProvider: 'openai',
    reasoningEffort: 'high',
    providerModelFallbackUsed: false,
    disposableIsolation: true,
    actualStateSha256: 'a'.repeat(64),
    actualRolloutSha256: 'b'.repeat(64),
    preflightConfiguration: configuration,
  });
  assert.throws(() => parseCodexExecRuntimeAttestation({
    jsonl,
    stateRows: [{ ...stateRows[0], model: 'fallback-model' }],
    rolloutJsonl,
    configuration,
    actualStateSha256: 'c'.repeat(64),
    actualRolloutSha256: 'd'.repeat(64),
    workerHome,
    workerCwd,
    resolvedSessionsRoot: `${workerHome}/sessions`,
    resolvedRolloutPath: `${workerHome}/sessions/rollout-${threadId}.jsonl`,
    codexVersion: '0.145.0',
  }), /substituted/);
  assert.throws(() => parseCodexExecRuntimeAttestation({
    jsonl: '',
    stateRows,
    rolloutJsonl,
    configuration,
    actualStateSha256: 'e'.repeat(64),
    actualRolloutSha256: 'f'.repeat(64),
    workerHome,
    workerCwd,
    resolvedSessionsRoot: `${workerHome}/sessions`,
    resolvedRolloutPath: `${workerHome}/sessions/rollout-${threadId}.jsonl`,
    codexVersion: '0.145.0',
  }), /actual worker thread ID/);
  assert.throws(() => parseCodexExecRuntimeAttestation({
    jsonl,
    stateRows,
    rolloutJsonl: rolloutRows.map((row) => JSON.stringify(
      row.type === 'turn_context'
        ? { ...row, payload: { ...row.payload, model: 'fallback-model' } }
        : row
    )).join('\n'),
    configuration,
    actualStateSha256: '1'.repeat(64),
    actualRolloutSha256: '2'.repeat(64),
    workerHome,
    workerCwd,
    resolvedSessionsRoot: `${workerHome}/sessions`,
    resolvedRolloutPath: `${workerHome}/sessions/rollout-${threadId}.jsonl`,
    codexVersion: '0.145.0',
  }), /substituted/);

  const aliasedWorkerHome = '/var/folders/get179-worker/home';
  const aliasedWorkerCwd = '/var/folders/get179-worker/workspace';
  const canonicalSessionsRoot = '/private/var/folders/get179-worker/home/sessions';
  const canonicalRolloutPath = `${canonicalSessionsRoot}/rollout-${threadId}.jsonl`;
  assert.doesNotThrow(() => parseCodexExecRuntimeAttestation({
    jsonl,
    stateRows: [{
      ...stateRows[0],
      cwd: '/private/var/folders/get179-worker/workspace',
      rollout_path: canonicalRolloutPath,
    }],
    rolloutJsonl: rolloutRows.map((row) => JSON.stringify({
      ...row,
      payload: {
        ...row.payload,
        cwd: '/private/var/folders/get179-worker/workspace',
      },
    })).join('\n'),
    configuration,
    actualStateSha256: '3'.repeat(64),
    actualRolloutSha256: '4'.repeat(64),
    workerHome: aliasedWorkerHome,
    workerCwd: aliasedWorkerCwd,
    resolvedWorkerCwd: '/private/var/folders/get179-worker/workspace',
    resolvedSessionsRoot: canonicalSessionsRoot,
    resolvedRolloutPath: canonicalRolloutPath,
    codexVersion: '0.145.0',
  }));
  assert.throws(() => parseCodexExecRuntimeAttestation({
    jsonl,
    stateRows,
    rolloutJsonl,
    configuration,
    actualStateSha256: '5'.repeat(64),
    actualRolloutSha256: '6'.repeat(64),
    workerHome,
    workerCwd,
    resolvedSessionsRoot: `${workerHome}/sessions`,
    resolvedRolloutPath: '/private/tmp/outside-worker/rollout.jsonl',
    codexVersion: '0.145.0',
  }), /disposable rollout/);
});

const mcpEvent = (
  id: string,
  name: string,
  server = 'computer-use',
  args?: Record<string, unknown>
): string =>
  JSON.stringify({
    type: 'item.completed',
    item: {
      id,
      type: 'mcp_tool_call',
      server,
      tool: name,
      status: 'completed',
      ...(args ? { arguments: args } : {}),
    },
  });

test('transcript auditor accepts state-action-state Computer Use sequences', () => {
  const transcript = [
    mcpEvent('1', 'get_app_state'),
    mcpEvent('2', 'click'),
    mcpEvent('3', 'get_app_state'),
    mcpEvent('4', 'press_key'),
    mcpEvent('5', 'get_app_state'),
  ].join('\n');
  assert.deepEqual(auditWorkerTranscript({ jsonl: transcript }), {
    valid: true,
    calls: ['get_app_state', 'click', 'get_app_state', 'press_key', 'get_app_state'],
    blockingReasons: [],
  });
});

test('transcript auditor enforces the packet-scoped visible input policy', () => {
  const scrollTranscript = [
    mcpEvent('1', 'get_app_state'),
    mcpEvent('2', 'scroll'),
    mcpEvent('3', 'get_app_state'),
  ].join('\n');
  assert.match(auditWorkerTranscript({
    jsonl: scrollTranscript,
    allowedComputerUseActions: ['click', 'press_key'],
    allowedPlayerKeys: ['w', 'escape'],
  }).blockingReasons.join(' '), /scroll/);

  const keyTranscript = [
    mcpEvent('1', 'get_app_state', 'computer-use', { app: 'Google Chrome' }),
    mcpEvent('2', 'press_key', 'computer-use', { app: 'Google Chrome', key: 'x' }),
    mcpEvent('3', 'get_app_state', 'computer-use', { app: 'Google Chrome' }),
  ].join('\n');
  assert.match(auditWorkerTranscript({
    jsonl: keyTranscript,
    expectedBrowserApp: 'Google Chrome',
    allowedComputerUseActions: ['click', 'press_key'],
    allowedPlayerKeys: ['w', 'escape'],
  }).blockingReasons.join(' '), /packet-visible input allowlist/);
  assert.equal(
    parseCompletedComputerUseCall(
      mcpEvent('2', 'scroll', 'computer-use', { app: 'Google Chrome' }),
      'Google Chrome',
      undefined,
      ['click', 'press_key']
    ),
    undefined
  );
});

test('completed Computer Use calls expose a stable app-bound action fingerprint', () => {
  const call = parseCompletedComputerUseCall(
    mcpEvent('2', 'click', 'computer-use', {
      app: 'Google Chrome',
      element_index: '42',
      click_count: 1,
    }),
    'Google Chrome'
  );
  assert.deepEqual(call && {
    id: call.id,
    tool: call.tool,
    arguments: call.arguments,
  }, {
    id: '2',
    tool: 'click',
    arguments: {
      app: 'Google Chrome',
      element_index: '42',
      click_count: 1,
    },
  });
  assert.match(call?.fingerprint ?? '', /^click:[a-f\d]{64}$/);
  assert.equal(parseCompletedComputerUseCall(
    mcpEvent('2', 'click', 'computer-use', { app: 'Brave Browser' }),
    'Google Chrome'
  ), undefined);
  assert.equal(parseCompletedComputerUseCall(JSON.stringify({
    type: 'item.started',
    item: {
      id: '2',
      type: 'mcp_tool_call',
      server: 'computer-use',
      tool: 'click',
      arguments: { app: 'Google Chrome' },
    },
  }), 'Google Chrome'), undefined);
});

test('completed Computer Use capture hashing includes the full structured result', () => {
  const event = (suffix: string): string => JSON.stringify({
    type: 'item.completed',
    item: {
      id: `capture-${suffix}`,
      type: 'mcp_tool_call',
      server: 'computer-use',
      tool: 'get_app_state',
      status: 'completed',
      arguments: { app: 'Google Chrome' },
      result: { content: [{ type: 'text', text: `${'x'.repeat(33_000)}${suffix}` }] },
    },
  });
  const left = parseCompletedComputerUseCall(event('a'), 'Google Chrome');
  const right = parseCompletedComputerUseCall(event('b'), 'Google Chrome');
  assert.ok(left);
  assert.ok(right);
  assert.notEqual(left.resultSha256, right.resultSha256);
});

test('transcript and completed-call parsing bind captures to the visible window marker', () => {
  const markedCapture = JSON.stringify({
    type: 'item.completed',
    item: {
      id: 'capture-1',
      type: 'mcp_tool_call',
      server: 'computer-use',
      tool: 'get_app_state',
      status: 'completed',
      arguments: { app: 'Google Chrome' },
      result: { content: [{ type: 'text', text: 'AI GAMER / marker-123' }] },
    },
  });
  assert.equal(
    parseCompletedComputerUseCall(markedCapture, 'Google Chrome', 'marker-123')?.markerVerified,
    true
  );
  assert.deepEqual(auditWorkerTranscript({
    jsonl: markedCapture,
    expectedBrowserApp: 'Google Chrome',
    expectedMarker: 'marker-123',
  }), {
    valid: true,
    calls: ['get_app_state'],
    blockingReasons: [],
  });
  const missing = auditWorkerTranscript({
    jsonl: markedCapture.replace('marker-123', 'another-window'),
    expectedBrowserApp: 'Google Chrome',
    expectedMarker: 'marker-123',
  });
  assert.equal(missing.valid, false);
  assert.match(missing.blockingReasons.join(' '), /visible marker/);
});

test('transcript auditor binds every Computer Use call to the assigned browser app', () => {
  const transcript = [
    mcpEvent('1', 'get_app_state', 'computer-use', { app: 'Google Chrome' }),
    mcpEvent('2', 'click', 'computer-use', {
      app: 'Brave Browser',
      element_index: '42',
    }),
    mcpEvent('3', 'get_app_state', 'computer-use', { app: 'Google Chrome' }),
  ].join('\n');
  const result = auditWorkerTranscript({
    jsonl: transcript,
    expectedBrowserApp: 'Google Chrome',
  });
  assert.equal(result.valid, false);
  assert.deepEqual(result.blockingReasons, [
    'Computer Use call click targeted Brave Browser instead of assigned Google Chrome.',
  ]);
});

test('transcript auditor rejects disallowed key and click inputs', () => {
  const transcript = [
    mcpEvent('1', 'get_app_state', 'computer-use', { app: 'Google Chrome' }),
    mcpEvent('2', 'press_key', 'computer-use', {
      app: 'Google Chrome',
      key: 'super+l',
    }),
    mcpEvent('3', 'get_app_state', 'computer-use', { app: 'Google Chrome' }),
    mcpEvent('4', 'click', 'computer-use', {
      app: 'Google Chrome',
      element_index: '12',
      mouse_button: 'right',
      click_count: 2,
    }),
    mcpEvent('5', 'get_app_state', 'computer-use', { app: 'Google Chrome' }),
  ].join('\n');
  const result = auditWorkerTranscript({
    jsonl: transcript,
    expectedBrowserApp: 'Google Chrome',
  });
  assert.equal(result.valid, false);
  assert.deepEqual(result.blockingReasons, [
    'Computer Use key is outside the packet-visible input allowlist: super+l.',
    'Computer Use click must use the left mouse button.',
    'Computer Use click_count must be exactly 1.',
  ]);
});

test('transcript auditor blocks pending permissions or app approval results', () => {
  const transcript = JSON.stringify({
    type: 'item.completed',
    item: {
      id: '1',
      type: 'mcp_tool_call',
      server: 'computer-use',
      tool: 'get_app_state',
      status: 'completed',
      arguments: { app: 'Google Chrome' },
      result: 'Computer Use permissions are still pending.',
    },
  });
  const result = auditWorkerTranscript({
    jsonl: transcript,
    expectedBrowserApp: 'Google Chrome',
  });
  assert.equal(result.valid, false);
  assert.deepEqual(result.blockingReasons, [
    'Computer Use permission or app-target approval was not ready.',
  ]);
});

test('transcript auditor rejects duplicate or reused Computer Use item IDs', () => {
  const result = auditWorkerTranscript({
    jsonl: [
      mcpEvent('1', 'get_app_state'),
      mcpEvent('2', 'click'),
      mcpEvent('3', 'get_app_state'),
      mcpEvent('3', 'press_key'),
    ].join('\n'),
  });
  assert.equal(result.valid, false);
  assert.match(result.blockingReasons.join(' '), /ID 3.*reused|duplicate.*3/i);
});

test('transcript auditor rejects a same-ID start after completion', () => {
  const result = auditWorkerTranscript({
    jsonl: [
      mcpEvent('capture-1', 'get_app_state'),
      mcpEvent('action-1', 'click'),
      mcpEvent('capture-2', 'get_app_state'),
      JSON.stringify({
        type: 'item.started',
        item: {
          id: 'action-1',
          type: 'mcp_tool_call',
          server: 'computer-use',
          tool: 'click',
          status: 'in_progress',
        },
      }),
    ].join('\n'),
  });
  assert.equal(result.valid, false);
  assert.match(result.blockingReasons.join(' '), /started after its completion/);
});

test('transcript auditor rejects Computer Use calls without stable item IDs', () => {
  const event = JSON.stringify({
    type: 'item.completed',
    item: {
      type: 'mcp_tool_call',
      server: 'computer-use',
      tool: 'get_app_state',
      status: 'completed',
      arguments: { app: 'Google Chrome' },
      result: 'visible state',
    },
  });
  assert.equal(parseCompletedComputerUseCall(event, 'Google Chrome'), undefined);
  assert.match(
    auditWorkerTranscript({ jsonl: event }).blockingReasons.join(' '),
    /missing a stable item ID/
  );
});

test('transcript auditor rejects truncated MCP calls without completion evidence', () => {
  const result = auditWorkerTranscript({
    jsonl: JSON.stringify({
      type: 'item.started',
      item: {
        id: '1',
        type: 'mcp_tool_call',
        server: 'computer-use',
        tool: 'get_app_state',
        status: 'in_progress',
        arguments: { app: 'Google Chrome' },
      },
    }),
    expectedBrowserApp: 'Google Chrome',
  });
  assert.deepEqual(result.blockingReasons, [
    'Computer Use call get_app_state (1) has no completion evidence.',
  ]);
});

test('transcript auditor rejects non-Computer-Use and non-allowlisted tools', () => {
  const transcript = [
    mcpEvent('1', 'get_app_state'),
    mcpEvent('2', 'type_text'),
    mcpEvent('3', 'click', 'playwright'),
  ].join('\n');
  const result = auditWorkerTranscript({ jsonl: transcript });
  assert.equal(result.valid, false);
  assert.deepEqual(result.blockingReasons, [
    'Computer Use tool is not allowlisted: type_text.',
    'Unexpected MCP server: playwright.',
  ]);
});

test('transcript auditor rejects built-in tool calls and malformed JSONL', () => {
  const transcript = [
    JSON.stringify({
      type: 'item.started',
      item: { id: '1', type: 'command_execution', command: 'pwd' },
    }),
    '{bad json',
  ].join('\n');
  const result = auditWorkerTranscript({ jsonl: transcript });
  assert.equal(result.valid, false);
  assert.match(result.blockingReasons[0], /Unexpected non-Computer-Use item: command_execution/);
  assert.match(result.blockingReasons[1], /Malformed JSONL at line 2/);
});

test('transcript auditor fails closed on unknown item types', () => {
  const result = auditWorkerTranscript({
    jsonl: JSON.stringify({
      type: 'item.started',
      item: { id: '1', type: 'dynamic_tool_call', name: 'mystery' },
    }),
  });
  assert.deepEqual(result.blockingReasons, [
    'Unexpected non-Computer-Use item: dynamic_tool_call.',
    'Transcript contains no Computer Use observation.',
  ]);
});

test('transcript auditor enforces observation around every action', () => {
  const startsWithAction = auditWorkerTranscript({ jsonl: mcpEvent('1', 'click') });
  assert.deepEqual(startsWithAction.blockingReasons, [
    'Computer Use action click must be preceded by get_app_state.',
    'Computer Use action click must be followed by get_app_state.',
  ]);

  const consecutiveActions = auditWorkerTranscript({
    jsonl: [
      mcpEvent('1', 'get_app_state'),
      mcpEvent('2', 'click'),
      mcpEvent('3', 'press_key'),
    ].join('\n'),
  });
  assert.deepEqual(consecutiveActions.blockingReasons, [
    'Computer Use action press_key must be preceded by get_app_state.',
    'Computer Use action press_key must be followed by get_app_state.',
  ]);
});

test('transcript auditor fails closed on model or config warnings', () => {
  const result = auditWorkerTranscript({
    jsonl: mcpEvent('1', 'get_app_state'),
    stderr: [
      'WARNING: requested model unavailable; falling back to another model',
      'WARN config key features.shell_tool was ignored',
    ].join('\n'),
  });
  assert.deepEqual(result.blockingReasons, [
    'Model/config warning: WARNING: requested model unavailable; falling back to another model',
    'Model/config warning: WARN config key features.shell_tool was ignored',
  ]);
});

test('transcript auditor fails closed on worker errors and failed MCP calls', () => {
  const transcript = [
    JSON.stringify({ type: 'turn.failed', error: { message: 'worker timed out' } }),
    JSON.stringify({
      type: 'item.completed',
      item: {
        id: '1',
        type: 'mcp_tool_call',
        server: 'computer-use',
        tool: 'get_app_state',
        status: 'failed',
      },
    }),
  ].join('\n');
  const result = auditWorkerTranscript({ jsonl: transcript });
  assert.deepEqual(result.blockingReasons, [
    'Worker event failed: worker timed out.',
    'Computer Use call get_app_state did not complete successfully.',
  ]);
});
