import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validatePlaytestPacketV1 } from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import { writeLevel0Autosave } from '../../../the-getaway/src/game/level0/runtime/persistence.ts';
import { createInitialLevel0RunState } from '../../../the-getaway/src/game/level0/runtime/safehouse.ts';
import { resolvePlaytestPacket } from './packets.ts';
import { workerResponseSchemaSource } from './paths.ts';
import { buildWorkerPrompt } from './prompt.ts';
import {
  AI_GAMER_WORKER_RESPONSE_SCHEMA,
  parseWorkerResponse,
} from './workerResponse.ts';
import { parsePinnedModelCatalog } from './modelCatalog.ts';
import {
  normalizeGateEvidenceRefs,
  normalizeGateFindings,
  pruneConciseWorkerArtifacts,
  selectWorkerEvidenceRefs,
} from './report.ts';
import {
  browserTargetsRequireSequentialExecution,
  classifyBrowserProcessCollisions,
  reserveBrowserTargets,
  resolveOwnedBrowserRootPid,
  validateOwnedBrowserProcessSnapshot,
} from './browser.ts';
import { reserveLiveBrowserTargets } from './browserRuntime.ts';
import { classifyWorkerEvidence } from './verdict.ts';
import {
  PLAYTEST_CHECKPOINT_V1_SCHEMA,
  DEFAULT_CHECKPOINT_HASH_SOURCES,
  computeCurrentCheckpointHashes,
  discoverViteEnvironmentSources,
  hashCheckpointStorageEntries,
  prepareVerifiedCheckpoint,
  type CheckpointHashSources,
} from './checkpointRuntime.ts';
import { bindReviewedPacket, canonicalReviewedPacketJson } from './packetEvidence.ts';
import {
  createObserverCaptureSyncRequest,
  startObserverCaptureSyncServer,
  synchronizeObserverCapture,
} from './observerSync.ts';
import {
  closeReleaseSafeWorkerBrowsers,
  stopOwnedWorkerProcessGroup,
  waitForWorkerExitWithDeadline,
} from './workerRuntime.ts';
import {
  PLAYTEST_TRACE_OPTIONS,
  ReadOnlyPlaytestObserver,
  visibleTextProvesFourBlockCoverage,
  type ObserverDiagnostics,
} from './observer.ts';

const memoryStorage = (): Storage => {
  const entries = new Map<string, string>();
  return {
    get length() { return entries.size; },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => { entries.delete(key); },
    setItem: (key, value) => { entries.set(key, value); },
  };
};

test('GET-179 has reviewed affected and closeout packets with tiered budgets', () => {
  const affected = resolvePlaytestPacket('GET-179', 'affected');
  const closeout = resolvePlaytestPacket('GET-179', 'closeout');

  assert.deepEqual(validatePlaytestPacketV1(affected), { ok: true });
  assert.deepEqual(validatePlaytestPacketV1(closeout), { ok: true });
  assert.equal(affected.revision, 6);
  assert.equal(closeout.revision, 6);
  assert.match(affected.reviewedAt, /^2026-08-10T/);
  assert.equal(affected.workerCount, 1);
  assert.equal(affected.startState.kind, 'new-game');
  assert.equal(affected.workerBudgetMs, 5 * 60_000);
  assert.deepEqual(affected.computerUsePolicy.actionTools, ['click', 'press_key']);
  assert.equal(affected.computerUsePolicy.keys.includes('escape'), true);
  assert.equal(affected.allowedVisibleInputs.some((input) => /escape.*visible.*menu/i.test(input)), true);
  assert.equal(closeout.workerCount, 2);
  assert.equal(closeout.startState.kind, 'new-game');
  assert.equal(closeout.workerBudgetMs, 25 * 60_000);
});

test('GET-204 has reviewed collision packets for affected and closeout gates', () => {
  const affected = resolvePlaytestPacket('GET-204', 'affected');
  const closeout = resolvePlaytestPacket('GET-204', 'closeout');

  assert.deepEqual(validatePlaytestPacketV1(affected), { ok: true });
  assert.deepEqual(validatePlaytestPacketV1(closeout), { ok: true });
  assert.equal(affected.ticket, 'GET-204');
  assert.equal(affected.revision, 7);
  assert.equal(affected.workerCount, 1);
  assert.equal(affected.startState.kind, 'new-game');
  assert.equal(affected.workerBudgetMs, 8 * 60_000);
  assert.deepEqual(affected.requiredProbeIds, ['level0.creation']);
  assert.match(affected.visibleGoal, /open city destinations/i);
  assert.equal(closeout.ticket, 'GET-204');
  assert.equal(closeout.revision, 7);
  assert.equal(closeout.workerCount, 2);
  assert.equal(closeout.startState.kind, 'new-game');
  assert.equal(closeout.workerBudgetMs, 8 * 60_000);
  assert.match(closeout.visibleGoal, /MOVE TO collision-checkpoint/i);
  assert.match(closeout.visibleGoal, /block coverage/i);
  assert.match(closeout.visibleGoal, /CITY COLLISION ROUTE COMPLETE/i);
  assert.equal(closeout.requiredInvariants.some(
    (invariant) => invariant.id === 'four-block-coverage'
  ), true);
});

test('proxy capture synchronization waits for the read-only observer acknowledgement', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'get179-observer-sync-'));
  const socketPath = path.join(root, 'observer.sock');
  let releaseCapture!: () => void;
  let captureStarted!: () => void;
  const captureRelease = new Promise<void>((resolve) => { releaseCapture = resolve; });
  const started = new Promise<void>((resolve) => { captureStarted = resolve; });
  const secret = randomBytes(32).toString('hex');
  const server = await startObserverCaptureSyncServer(socketPath, secret, async () => {
    captureStarted();
    await captureRelease;
  });
  try {
    let settled = false;
    const synchronization = synchronizeObserverCapture(socketPath, secret, createObserverCaptureSyncRequest({
      secret,
      sequence: 1,
      token: 'capture-1',
      captureResultSha256: 'a'.repeat(64),
    })).then(() => { settled = true; });
    await started;
    await Promise.resolve();
    assert.equal(settled, false);
    releaseCapture();
    await synchronization;
    assert.equal(settled, true);
  } finally {
    await server.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('proxy capture synchronization fails closed when the observer rejects capture', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'get179-observer-sync-reject-'));
  const socketPath = path.join(root, 'observer.sock');
  const secret = randomBytes(32).toString('hex');
  const server = await startObserverCaptureSyncServer(socketPath, secret, async () => {
    throw new Error('observer unavailable');
  });
  try {
    await assert.rejects(synchronizeObserverCapture(socketPath, secret, createObserverCaptureSyncRequest({
      secret,
      sequence: 1,
      token: 'capture-rejected',
      captureResultSha256: 'b'.repeat(64),
    })), /Observer rejected/);
  } finally {
    await server.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('observer synchronization rejects replay and bounds a wedged capture callback', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'get179-observer-sync-timeout-'));
  const socketPath = path.join(root, 'observer.sock');
  const secret = randomBytes(32).toString('hex');
  const never = new Promise<void>(() => undefined);
  const server = await startObserverCaptureSyncServer(
    socketPath,
    secret,
    async () => never,
    25
  );
  const request = createObserverCaptureSyncRequest({
    secret,
    sequence: 1,
    token: 'capture-timeout',
    captureResultSha256: 'c'.repeat(64),
  });
  try {
    await assert.rejects(
      synchronizeObserverCapture(socketPath, secret, request, 1_000),
      /Observer rejected/
    );
    await assert.rejects(
      synchronizeObserverCapture(socketPath, secret, request, 1_000),
      /Observer rejected/
    );
    await Promise.race([
      server.close(),
      new Promise<never>((_, reject) => setTimeout(
        () => reject(new Error('observer sync close exceeded its bounded deadline')),
        500
      )),
    ]);
  } finally {
    await server.close().catch(() => undefined);
    await rm(root, { recursive: true, force: true });
  }
});

test('worker process-group cleanup terminates MCP-like descendants before browser release', async () => {
  const child = spawn(process.execPath, ['-e', [
    'const { spawn } = require("node:child_process");',
    'spawn(process.execPath, ["-e", "setInterval(() => undefined, 1000)"], { stdio: "ignore" });',
    'setInterval(() => undefined, 1000);',
  ].join(' ')], {
    detached: true,
    stdio: 'ignore',
  });
  assert.ok(child.pid);
  try {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const leaderExited = child.exitCode !== null
      ? Promise.resolve()
      : new Promise<void>((resolve) => child.once('exit', () => resolve()));
    await stopOwnedWorkerProcessGroup(child.pid!, 250);
    await Promise.race([
      leaderExited,
      new Promise<never>((_, reject) => setTimeout(
        () => reject(new Error('owned process-group leader did not exit')),
        500
      )),
    ]);
  } finally {
    await stopOwnedWorkerProcessGroup(child.pid!, 100).catch(() => undefined);
  }
});

test('worker exit and browser release stay bounded and fail closed', async () => {
  await assert.rejects(
    waitForWorkerExitWithDeadline(new Promise<never>(() => undefined), 20),
    /did not exit within its cleanup deadline/
  );
  const closed: string[] = [];
  const quarantined = await closeReleaseSafeWorkerBrowsers([
    { close: async () => { closed.push('safe'); } },
    { close: async () => { closed.push('unsafe'); } },
  ], [true, false]);
  assert.deepEqual(closed, ['safe']);
  assert.deepEqual(quarantined, [1]);
});

test('reviewed packet evidence binds revision and canonical packet bytes', async () => {
  const runDirectory = await mkdtemp(path.join(tmpdir(), 'get179-packet-evidence-'));
  try {
    const packet = resolvePlaytestPacket('GET-179', 'affected');
    const binding = await bindReviewedPacket(runDirectory, packet);
    const artifact = JSON.parse(
      await readFile(path.join(runDirectory, binding.evidenceRef), 'utf8')
    ) as { packetSha256: string; packet: unknown };
    assert.equal(binding.revision, packet.revision);
    assert.equal(artifact.packetSha256, binding.sha256);
    assert.equal(
      createHash('sha256').update(canonicalReviewedPacketJson(packet)).digest('hex'),
      binding.sha256
    );
    assert.equal(JSON.stringify(artifact.packet), canonicalReviewedPacketJson(packet));
  } finally {
    await rm(runDirectory, { recursive: true, force: true });
  }
});

test('Vite launch hashing discovers every existing .env source without reading unrelated files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'get179-vite-env-'));
  try {
    const appDirectory = path.join(root, 'the-getaway');
    await mkdir(appDirectory, { recursive: true });
    await Promise.all([
      writeFile(path.join(appDirectory, '.env'), 'VITE_A=1\n'),
      writeFile(path.join(appDirectory, '.env.local'), 'VITE_B=2\n'),
      writeFile(path.join(appDirectory, '.env.development.local'), 'VITE_C=3\n'),
      writeFile(path.join(appDirectory, 'not-env.txt'), 'ignored\n'),
    ]);
    assert.deepEqual(await discoverViteEnvironmentSources(root), [
      'the-getaway/.env',
      'the-getaway/.env.development.local',
      'the-getaway/.env.local',
    ]);
    assert.ok(DEFAULT_CHECKPOINT_HASH_SOURCES.build.includes('the-getaway/index.html'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('missing ticket packets are configuration errors', () => {
  assert.throws(
    () => resolvePlaytestPacket('GET-999', 'affected'),
    /No reviewed PlaytestPacketV1.*GET-999.*affected/
  );
});

test('affected checkpoint setup verifies replay and current hashes before restoring storage', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'get179-checkpoint-test-'));
  try {
    const checkpointDirectory = path.join(root, 'tools/ai-playtester/checkpoints');
    const runDirectory = path.join(root, 'run');
    const sourceDirectory = path.join(root, 'sources');
    await mkdir(checkpointDirectory, { recursive: true });
    await mkdir(sourceDirectory, { recursive: true });
    const sources: CheckpointHashSources = {
      build: ['sources/build.txt'],
      content: ['sources/content.txt'],
      layout: ['sources/layout.txt'],
      probeSchema: ['sources/probes.txt'],
    };
    for (const [name, value] of [
      ['build.txt', 'build-v1'],
      ['content.txt', 'content-v1'],
      ['layout.txt', 'layout-v1'],
      ['probes.txt', 'probes-v1'],
    ]) {
      await writeFile(path.join(sourceDirectory, name), value, 'utf8');
    }
    const currentHashes = await computeCurrentCheckpointHashes(root, sources);
    const run = createInitialLevel0RunState('affected-ready-session', 'cover.neighbor');
    const storage = memoryStorage();
    writeLevel0Autosave(storage, run, 1_786_272_451_000);
    const storageEntries = {
      'the-getaway-level0-autosave-v3': storage.getItem('the-getaway-level0-autosave-v3')!,
    };
    const replay = {
      schema: 'playtest_checkpoint_replay_v1',
      checkpointId: 'affected-ready',
      startedFrom: 'new-game',
      completedAt: '2026-08-09T09:09:51.000Z',
      steps: [{
        sequence: 0,
        capturedAt: '2026-08-09T09:09:50.000Z',
        command: { kind: 'control', control: 'start' },
        observationSha256: createHash('sha256')
          .update(JSON.stringify(run))
          .digest('hex'),
        runtime: { sessionId: run.sessionId, mission: run.mission },
      }],
      terminal: {
        sessionId: run.sessionId,
        mission: run.mission,
        storageSha256: hashCheckpointStorageEntries(storageEntries),
      },
    };
    const replayBytes = Buffer.from(JSON.stringify(replay));
    await writeFile(path.join(checkpointDirectory, 'replay.json'), replayBytes);
    const artifact = {
      schema: PLAYTEST_CHECKPOINT_V1_SCHEMA,
      provenance: {
        checkpointId: 'affected-ready',
        ...currentHashes,
        newGameReplayProof: {
          verified: true,
          traceHash: createHash('sha256').update(replayBytes).digest('hex'),
        },
      },
      replayEvidenceRef: 'replay.json',
      storageEntries,
    };
    await writeFile(
      path.join(checkpointDirectory, 'affected-ready.json'),
      JSON.stringify(artifact),
      'utf8'
    );

    const verified = await prepareVerifiedCheckpoint({
      repoRoot: root,
      runDirectory,
      mode: 'affected',
      startState: {
        kind: 'checkpoint',
        checkpointId: 'affected-ready',
        provenanceRef: 'tools/ai-playtester/checkpoints/affected-ready.json',
      },
      hashSources: sources,
    });
    assert.equal(
      verified?.storageEntries['the-getaway-level0-autosave-v3'],
      storageEntries['the-getaway-level0-autosave-v3']
    );
    assert.deepEqual(verified?.evidenceRefs, [
      'checkpoint/current-hashes.json',
      'checkpoint/new-game-replay.json',
      'checkpoint/provenance.json',
    ]);
    assert.deepEqual(
      JSON.parse(await readFile(path.join(runDirectory, 'checkpoint/new-game-replay.json'), 'utf8')),
      replay
    );

    const advancedRun = structuredClone(run);
    advancedRun.player.position.x += 1;
    const advancedStorage = memoryStorage();
    writeLevel0Autosave(advancedStorage, advancedRun, 1_786_272_452_000);
    const advancedEntries = {
      'the-getaway-level0-autosave-v3': advancedStorage.getItem(
        'the-getaway-level0-autosave-v3'
      )!,
    };
    const advancedReplay = {
      ...replay,
      checkpointId: 'advanced-unproven',
      steps: [{
        ...replay.steps[0],
        observationSha256: createHash('sha256')
          .update(JSON.stringify(advancedRun))
          .digest('hex'),
      }],
      terminal: {
        ...replay.terminal,
        storageSha256: hashCheckpointStorageEntries(advancedEntries),
      },
    };
    const advancedReplayBytes = Buffer.from(JSON.stringify(advancedReplay));
    await writeFile(path.join(checkpointDirectory, 'advanced-replay.json'), advancedReplayBytes);
    await writeFile(
      path.join(checkpointDirectory, 'advanced-unproven.json'),
      JSON.stringify({
        ...artifact,
        provenance: {
          ...artifact.provenance,
          checkpointId: 'advanced-unproven',
          newGameReplayProof: {
            verified: true,
            traceHash: createHash('sha256').update(advancedReplayBytes).digest('hex'),
          },
        },
        replayEvidenceRef: 'advanced-replay.json',
        storageEntries: advancedEntries,
      }),
      'utf8'
    );
    await assert.rejects(
      () => prepareVerifiedCheckpoint({
        repoRoot: root,
        runDirectory,
        mode: 'affected',
        startState: {
          kind: 'checkpoint',
          checkpointId: 'advanced-unproven',
          provenanceRef: 'tools/ai-playtester/checkpoints/advanced-unproven.json',
        },
        hashSources: sources,
      }),
      /not the deterministic New Game state/
    );

    const malformedArtifact = {
      ...artifact,
      provenance: {
        ...artifact.provenance,
        checkpointId: 'malformed-replay',
        newGameReplayProof: {
          verified: true,
          traceHash: createHash('sha256').update('arbitrary bytes').digest('hex'),
        },
      },
      replayEvidenceRef: 'arbitrary.bin',
    };
    await writeFile(path.join(checkpointDirectory, 'arbitrary.bin'), 'arbitrary bytes', 'utf8');
    await writeFile(
      path.join(checkpointDirectory, 'malformed-replay.json'),
      JSON.stringify(malformedArtifact),
      'utf8'
    );
    await assert.rejects(
      () => prepareVerifiedCheckpoint({
        repoRoot: root,
        runDirectory,
        mode: 'affected',
        startState: {
          kind: 'checkpoint',
          checkpointId: 'malformed-replay',
          provenanceRef: 'tools/ai-playtester/checkpoints/malformed-replay.json',
        },
        hashSources: sources,
      }),
      /replay proof is not JSON/
    );

    await writeFile(path.join(sourceDirectory, 'layout.txt'), 'layout-v2', 'utf8');
    await assert.rejects(
      () => prepareVerifiedCheckpoint({
        repoRoot: root,
        runDirectory,
        mode: 'affected',
        startState: {
          kind: 'checkpoint',
          checkpointId: 'affected-ready',
          provenanceRef: 'tools/ai-playtester/checkpoints/affected-ready.json',
        },
        hashSources: sources,
      }),
      /Checkpoint layoutHash does not match the current layoutHash/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('worker prompt is black-box and contains only visible goal, controls, persona, app, and marker', () => {
  const packet = resolvePlaytestPacket('GET-179', 'affected');
  const prompt = buildWorkerPrompt({
    packet,
    persona: packet.playerPersonas[0],
    browserApp: 'Google Chrome',
    marker: 'f3472ec3-4871-4ae4-9e2c-fdfb07b11a48',
  });

  assert.match(prompt, new RegExp(packet.visibleGoal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(prompt, /Google Chrome/);
  assert.match(prompt, /f3472ec3-4871-4ae4-9e2c-fdfb07b11a48/);
  assert.match(prompt, /get_app_state.*act.*get_app_state/is);
  assert.match(prompt, /very next tool call must be get_app_state/i);
  assert.match(prompt, /Never issue two actions in a row/i);
  assert.match(prompt, /final get_app_state.*immediately return/is);
  assert.match(prompt, /Do not emit schema-shaped progress updates/i);
  for (const forbidden of [
    'GET-179',
    'requiredProbeIds',
    'level0.preparation',
    '/Users/deus/Projects',
    'Linear',
    'Redux',
    'repository',
  ]) {
    assert.ok(!prompt.includes(forbidden), `prompt leaked forbidden context: ${forbidden}`);
  }
});

test('observer trace stays resource-bounded while separate screenshots carry visual evidence', () => {
  assert.deepEqual(PLAYTEST_TRACE_OPTIONS, {
    screenshots: false,
    snapshots: false,
    sources: false,
  });
});

test('four-block coverage requires the complete visible marker evidence', () => {
  assert.equal(visibleTextProvesFourBlockCoverage(
    'BLOCK COVERAGE 4/4: safehouse, public, logistics, service\nALL FOUR BLOCKS VISITED\nCITY COLLISION ROUTE COMPLETE'
  ), true);
  assert.equal(visibleTextProvesFourBlockCoverage(
    'BLOCK COVERAGE 4/4: safehouse, public, logistics, service\nALL FOUR BLOCKS VISITED'
  ), false);
  assert.equal(visibleTextProvesFourBlockCoverage('BLOCK COVERAGE 4/4'), false);
  assert.equal(visibleTextProvesFourBlockCoverage('ALL FOUR BLOCKS VISITED'), false);
});

test('worker response parser accepts structured visible verdicts and rejects malformed output', () => {
  const response = {
    schema: AI_GAMER_WORKER_RESPONSE_SCHEMA,
    outcome: 'pass',
    visibleGoalMet: true,
    summary: 'The visible goal was completed.',
    warnings: [],
    regression: null,
    blocker: null,
  };
  assert.deepEqual(parseWorkerResponse(JSON.stringify(response)), response);
  assert.throws(
    () => parseWorkerResponse(JSON.stringify({ ...response, visibleGoalMet: 'yes' })),
    /does not match/
  );
  const nonCrashFailure = {
    ...response,
    outcome: 'fail',
    visibleGoalMet: false,
    regression: {
      kind: 'visible-input-failure',
      title: 'Visible control did not respond',
      observed: 'The same indexed control was activated twice without progress.',
      attempts: 2,
      reproduction: { tool: 'click', target: 'element:42' },
    },
  };
  assert.deepEqual(parseWorkerResponse(JSON.stringify(nonCrashFailure)), nonCrashFailure);
  assert.throws(
    () => parseWorkerResponse(JSON.stringify({
      ...nonCrashFailure,
      regression: { ...nonCrashFailure.regression, reproduction: undefined },
    })),
    /does not match/
  );
});

test('worker output schema stays within the strict structured-output subset', async () => {
  const schema = JSON.parse(await readFile(workerResponseSchemaSource, 'utf8')) as unknown;
  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as Record<string, unknown>;
    assert.equal('oneOf' in record, false);
    if ('enum' in record || 'const' in record) {
      assert.equal(typeof record.type, 'string');
    }
    Object.values(record).forEach(visit);
  };
  visit(schema);
});

test('model catalog parser requires exact gpt-5.6-sol and high reasoning', () => {
  const catalog = JSON.stringify({
    models: [{
      slug: 'gpt-5.6-sol',
      display_name: 'GPT-5.6-Sol',
      supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }],
    }],
  });
  assert.deepEqual(parsePinnedModelCatalog(catalog), {
    slug: 'gpt-5.6-sol',
    displayName: 'GPT-5.6-Sol',
    supportsHigh: true,
  });
  assert.throws(
    () => parsePinnedModelCatalog(JSON.stringify({ models: [{ slug: 'gpt-5.6-sol' }] })),
    /does not advertise high reasoning/
  );
});

test('report evidence references are normalized deterministically', () => {
  assert.deepEqual(
    normalizeGateEvidenceRefs([' trace.zip ', 'shot-2.png', 'trace.zip', '', 'shot-1.png']),
    ['shot-1.png', 'shot-2.png', 'trace.zip']
  );
});

test('report findings merge duplicate worker observations and evidence', () => {
  assert.deepEqual(normalizeGateFindings([
    {
      id: 'worker-1-regression',
      kind: 'regression',
      title: 'Door is stuck',
      summary: 'Visible Interact failed twice.',
      evidenceRefs: ['workers/worker-1/shot.png'],
    },
    {
      id: 'worker-2-regression',
      kind: 'regression',
      title: 'Door is stuck',
      summary: 'Visible Interact failed twice.',
      evidenceRefs: ['workers/worker-2/shot.png'],
    },
  ]), [{
    id: 'worker-1-regression',
    kind: 'regression',
    title: 'Door is stuck',
    summary: 'Visible Interact failed twice.',
    evidenceRefs: [
      'workers/worker-1/shot.png',
      'workers/worker-2/shot.png',
    ],
  }]);
});

test('pass retention keeps milestone, trace, probe, and transcript-summary evidence only', () => {
  const refs = [
    'screenshots/initial.png',
    'screenshots/milestone-level0-preparation.png',
    'screenshots/final.png',
    'trace.zip',
    'probe-timeline.json',
    'observer-diagnostics.json',
    'browser-target-attestation.json',
    'computer-use-ledger.jsonl',
    'worker-runtime-attestation.json',
    'worker-transcript-summary.json',
    'worker.jsonl',
    'worker.stderr.log',
  ];
  assert.deepEqual(selectWorkerEvidenceRefs('pass', refs), [
    'browser-target-attestation.json',
    'computer-use-ledger.jsonl',
    'probe-timeline.json',
    'screenshots/milestone-level0-preparation.png',
    'trace.zip',
    'worker-runtime-attestation.json',
    'worker-transcript-summary.json',
  ]);
  assert.deepEqual(selectWorkerEvidenceRefs('fail', refs), [...refs].sort());
  assert.deepEqual(selectWorkerEvidenceRefs('blocked', refs), [...refs].sort());
});

test('pass retention prunes files and directories with explicit Node 26 rm options', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'get179-pass-retention-'));
  try {
    await mkdir(path.join(root, 'action-cycles'), { recursive: true });
    await mkdir(path.join(root, 'screenshots'), { recursive: true });
    await Promise.all([
      writeFile(path.join(root, 'worker.jsonl'), 'transcript'),
      writeFile(path.join(root, 'worker.stderr.log'), ''),
      writeFile(path.join(root, 'observer-diagnostics.json'), '{}'),
      writeFile(path.join(root, 'action-cycles.json'), '[]'),
      writeFile(path.join(root, 'action-cycles', 'state-0001.png'), 'image'),
      writeFile(path.join(root, 'screenshots', 'initial.png'), 'image'),
      writeFile(path.join(root, 'screenshots', 'final.png'), 'image'),
      writeFile(path.join(root, 'trace.zip'), 'trace'),
    ]);
    await pruneConciseWorkerArtifacts(root);
    await assert.rejects(() => readFile(path.join(root, 'worker.jsonl')));
    await assert.rejects(() => readFile(path.join(root, 'action-cycles', 'state-0001.png')));
    assert.equal(await readFile(path.join(root, 'trace.zip'), 'utf8'), 'trace');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const dedicatedBrowserTarget = {
  app: 'Google Chrome for Testing' as const,
  executablePath: '/playwright/Google Chrome for Testing',
};

test('personal Chrome and Brave processes do not block the dedicated AI Gamer browser', () => {
  const personalProcesses = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser --profile-directory=Default',
  ].join('\n');

  assert.deepEqual(
    reserveBrowserTargets(personalProcesses, 1, dedicatedBrowserTarget),
    [dedicatedBrowserTarget]
  );
});

test('a pre-existing dedicated browser process remains a fail-closed collision', () => {
  assert.deepEqual(
    classifyBrowserProcessCollisions(
      `123 ${dedicatedBrowserTarget.executablePath} --user-data-dir=/unknown`,
      [dedicatedBrowserTarget]
    ),
    ['Google Chrome for Testing already has a running process; reserved targeting is ambiguous.']
  );
});

test('live reservation provisions the pinned dedicated browser before use', async () => {
  let installed = false;
  let installCalls = 0;
  const targets = await reserveLiveBrowserTargets(1, {
    executablePath: dedicatedBrowserTarget.executablePath,
    executableExists: async () => installed,
    installPinnedBrowser: async () => {
      installCalls += 1;
      installed = true;
    },
    readProcessList: async () => [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ].join('\n'),
  });

  assert.equal(installCalls, 1);
  assert.deepEqual(targets, [dedicatedBrowserTarget]);
});

test('two workers sharing the dedicated browser target require sequential execution', () => {
  const targets = reserveBrowserTargets('', 2, dedicatedBrowserTarget);

  assert.deepEqual(targets, [dedicatedBrowserTarget, dedicatedBrowserTarget]);
  assert.equal(browserTargetsRequireSequentialExecution(targets), true);
  assert.equal(browserTargetsRequireSequentialExecution([dedicatedBrowserTarget]), false);
});

test('browser ownership binds the gate to one unchanged fresh-profile root process', () => {
  const executable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const profile = '/private/tmp/getaway-ai-gamer-browser-owned';
  const owned = ` 4123 ${executable} --user-data-dir=${profile} --remote-debugging-pipe`;
  assert.equal(resolveOwnedBrowserRootPid(owned, {
    executablePath: executable,
    profileDirectory: profile,
  }), 4123);
  assert.deepEqual(validateOwnedBrowserProcessSnapshot(owned, {
    executablePath: executable,
    profileDirectory: profile,
    rootPid: 4123,
  }), { valid: true, reason: null });

  const personal = `${owned}\n 5123 ${executable} --profile-directory=Default`;
  assert.deepEqual(validateOwnedBrowserProcessSnapshot(personal, {
    executablePath: executable,
    profileDirectory: profile,
    rootPid: 4123,
  }), {
    valid: false,
    reason: 'Browser process ownership changed or became ambiguous.',
  });
  assert.throws(() => resolveOwnedBrowserRootPid(personal, {
    executablePath: executable,
    profileDirectory: profile,
  }), /exactly one owned root process/);
});

const passingWorkerEvidence = {
  requiredInvariants: [
    { id: 'window-marker', description: 'The assigned marker remains visible.' },
    { id: 'capture-before-action', description: 'Every input is capture-bounded.' },
    { id: 'visible-inputs-only', description: 'Only player-visible inputs are used.' },
    { id: 'no-runtime-errors', description: 'No runtime error occurs.' },
    { id: 'observation-exercised', description: 'Observation opens and resumes.' },
  ],
  response: {
    schema: AI_GAMER_WORKER_RESPONSE_SCHEMA,
    outcome: 'pass' as const,
    visibleGoalMet: true,
    summary: 'Visible goal completed.',
    warnings: [],
    regression: null,
    blocker: null,
  },
  responseError: undefined,
  exitCode: 0,
  timedOut: false,
  supervisorViolation: undefined,
  transcriptAudit: {
    valid: true,
    calls: ['get_app_state', 'click', 'get_app_state'],
    blockingReasons: [],
  },
  observer: {
    markerValid: true,
    targetValid: true,
    probeResults: [{
      probeId: 'level0.preparation',
      state: 'met' as const,
      acceptanceEligible: true,
      evidenceRefs: ['milestone.png'],
    }],
    diagnostics: {
      console: [],
      pageErrors: [],
      network: [],
      dialogs: [],
      crashes: [],
      toolingErrors: [],
    },
    observationOpened: true,
    observationResumed: true,
    fourBlockCoverageComplete: true,
    runtimeTransitionCount: 3,
    stableUnmetPollCount: 0,
    actionCycles: [],
  },
};

const expectedPassingInvariantResults = passingWorkerEvidence.requiredInvariants.map((invariant) => ({
  invariantId: invariant.id,
  state: 'met' as const,
  acceptanceEligible: true,
  evidenceRefs: invariant.id === 'capture-before-action' || invariant.id === 'visible-inputs-only'
    ? ['worker-transcript-summary.json']
    : ['trace.zip'],
}));

test('worker evidence passes only with the visible goal, probes, invariants, and integrity', () => {
  assert.deepEqual(classifyWorkerEvidence(passingWorkerEvidence), {
    outcome: 'pass',
    evidenceValid: true,
    integrityValid: true,
    reasons: [],
    warnings: [],
    invariantResults: expectedPassingInvariantResults,
  });
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    observer: {
      ...passingWorkerEvidence.observer,
      probeResults: [{
        ...passingWorkerEvidence.observer.probeResults[0],
        state: 'unmet',
        acceptanceEligible: false,
      }],
    },
  }).outcome, 'blocked');
  assert.deepEqual(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    observer: { ...passingWorkerEvidence.observer, targetValid: false },
  }), {
    outcome: 'blocked',
    evidenceValid: false,
    integrityValid: false,
    reasons: ['Assigned browser target became ambiguous.'],
    warnings: [],
    invariantResults: expectedPassingInvariantResults,
  });
});

test('worker evidence requires Observation only when the reviewed packet owns that invariant', () => {
  const classified = classifyWorkerEvidence({
    ...passingWorkerEvidence,
    requiredInvariants: passingWorkerEvidence.requiredInvariants.filter(
      (invariant) => invariant.id !== 'observation-exercised'
    ),
    observer: {
      ...passingWorkerEvidence.observer,
      observationOpened: false,
      observationResumed: false,
    },
  });
  assert.equal(classified.outcome, 'pass');
  assert.equal(classified.evidenceValid, true);
});

test('worker evidence requires observed four-block coverage when the packet owns it', () => {
  const classified = classifyWorkerEvidence({
    ...passingWorkerEvidence,
    requiredInvariants: [{
      id: 'four-block-coverage',
      description: 'All four city blocks are visibly traversed.',
    }],
    observer: {
      ...passingWorkerEvidence.observer,
      fourBlockCoverageComplete: false,
    },
  });
  assert.equal(classified.outcome, 'blocked');
  assert.deepEqual(classified.invariantResults, [{
    invariantId: 'four-block-coverage',
    state: 'unmet',
    acceptanceEligible: false,
    evidenceRefs: ['trace.zip'],
  }]);
});

test('worker evidence blocks unknown packet invariants instead of ignoring them', () => {
  const classified = classifyWorkerEvidence({
    ...passingWorkerEvidence,
    requiredInvariants: [{ id: 'future-invariant', description: 'Must be explicitly implemented.' }],
  });
  assert.equal(classified.outcome, 'blocked');
  assert.deepEqual(classified.invariantResults, [{
    invariantId: 'future-invariant',
    state: 'unavailable',
    acceptanceEligible: false,
    evidenceRefs: [],
  }]);
});

test('worker evidence distinguishes proven regression from ambiguous or tooling failure', () => {
  const failedResponse = {
    ...passingWorkerEvidence.response,
    outcome: 'fail' as const,
    visibleGoalMet: false,
    regression: {
      kind: 'crash' as const,
      title: 'Page crashed',
      observed: 'The game window became unavailable.',
      attempts: 1,
      reproduction: null,
    },
  };
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: failedResponse,
    observer: {
      ...passingWorkerEvidence.observer,
      diagnostics: {
        ...passingWorkerEvidence.observer.diagnostics,
        crashes: ['page-crashed'],
      },
    },
  }).outcome, 'fail');
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: failedResponse,
  }).outcome, 'blocked');
  assert.deepEqual(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    supervisorViolation: 'Unexpected tool call.',
  }), {
    outcome: 'blocked',
    evidenceValid: false,
    integrityValid: false,
    reasons: ['Unexpected tool call.'],
    warnings: [],
    invariantResults: expectedPassingInvariantResults,
  });
});

test('crash regression requires an actual assigned-page crash event', () => {
  const failedResponse = {
    ...passingWorkerEvidence.response,
    outcome: 'fail' as const,
    visibleGoalMet: false,
    regression: {
      kind: 'crash' as const,
      title: 'Page crashed',
      observed: 'The game window became unavailable.',
      attempts: 1,
      reproduction: null,
    },
  };
  const withDiagnostics = (diagnostics: Partial<ObserverDiagnostics>) =>
    classifyWorkerEvidence({
      ...passingWorkerEvidence,
      response: failedResponse,
      observer: {
        ...passingWorkerEvidence.observer,
        diagnostics: {
          ...passingWorkerEvidence.observer.diagnostics,
          ...diagnostics,
        },
      },
    });

  assert.equal(withDiagnostics({ pageErrors: ['incidental application error'] }).outcome, 'blocked');
  assert.equal(withDiagnostics({ crashes: ['page-closed'] }).outcome, 'blocked');
  assert.deepEqual(withDiagnostics({ crashes: ['page-crashed'] }), {
    outcome: 'fail',
    evidenceValid: true,
    integrityValid: true,
    reasons: ['Observer recorded a renderer crash on the assigned game page.'],
    warnings: [],
    invariantResults: expectedPassingInvariantResults.map((invariant) =>
      invariant.invariantId === 'no-runtime-errors'
        ? { ...invariant, state: 'unmet', acceptanceEligible: false }
        : invariant
    ),
  });
});

test('observer treats an unattributed page close as a single blocked tooling event', async () => {
  const observer = new ReadOnlyPlaytestObserver(
    {} as never,
    { isClosed: () => true } as never,
    'marker-1',
    [],
    '/private/tmp/get179-observer-test'
  ) as unknown as {
    pollOnce: () => Promise<void>;
    diagnostics: {
      crashes: string[];
      toolingErrors: string[];
    };
    targetValid: boolean;
  };

  await observer.pollOnce();
  await observer.pollOnce();

  assert.deepEqual(observer.diagnostics.crashes, []);
  assert.deepEqual(observer.diagnostics.toolingErrors, [
    'Assigned game page closed without attributable product-crash evidence.',
  ]);
  assert.equal(observer.targetValid, false);
});

test('non-crash regression requires repeated matching observer-correlated action cycles', () => {
  const failedResponse = {
    ...passingWorkerEvidence.response,
    outcome: 'fail' as const,
    visibleGoalMet: false,
    regression: {
      kind: 'visible-input-failure' as const,
      title: 'Visible control does not respond',
      observed: 'The same visible control did not progress twice.',
      attempts: 2,
      reproduction: {
        tool: 'click' as const,
        target: 'element:42',
      },
    },
  };
  const unchangedCycle = (actionId: string) => ({
    actionId,
    actionTool: 'click',
    actionFingerprint: `click:${'a'.repeat(64)}`,
    visibleTarget: 'element:42',
    beforeCaptureCallId: `${actionId}-before-capture`,
    afterCaptureCallId: `${actionId}-after-capture`,
    beforeCaptureResultSha256: 'c'.repeat(64),
    afterCaptureResultSha256: 'c'.repeat(64),
    beforeStateSha256: 'b'.repeat(64),
    afterStateSha256: 'b'.repeat(64),
    beforeScreenshotSha256: 'e'.repeat(64),
    afterScreenshotSha256: 'e'.repeat(64),
    progressChanged: false,
    probeChanged: false,
    evidenceRefs: [
      `action-cycles/${actionId}-before.png`,
      `action-cycles/${actionId}-after.png`,
    ],
  });
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: failedResponse,
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [unchangedCycle('action-1'), unchangedCycle('action-2')],
    },
  }).outcome, 'fail');
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: failedResponse,
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [unchangedCycle('action-1')],
    },
  }).outcome, 'blocked');
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: failedResponse,
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [
        unchangedCycle('action-1'),
        {
          ...unchangedCycle('action-2'),
          afterScreenshotSha256: 'f'.repeat(64),
        },
      ],
    },
  }).outcome, 'blocked');
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: failedResponse,
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [
        unchangedCycle('action-1'),
        {
          ...unchangedCycle('action-2'),
          beforeCaptureResultSha256: 'd'.repeat(64),
          afterCaptureResultSha256: 'd'.repeat(64),
        },
      ],
    },
  }).outcome, 'blocked');
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: failedResponse,
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [
        unchangedCycle('action-1'),
        {
          ...unchangedCycle('action-2'),
          beforeStateSha256: '9'.repeat(64),
          afterStateSha256: '9'.repeat(64),
        },
      ],
    },
  }).outcome, 'blocked');
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: {
      ...failedResponse,
      regression: {
        ...failedResponse.regression,
        reproduction: { tool: 'click' as const, target: 'element:99' },
      },
    },
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [unchangedCycle('action-1'), unchangedCycle('action-2')],
    },
  }).outcome, 'blocked');
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: failedResponse,
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [
        unchangedCycle('action-1'),
        { ...unchangedCycle('action-2'), progressChanged: true },
      ],
    },
  }).outcome, 'blocked');
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: {
      ...failedResponse,
      regression: { ...failedResponse.regression, kind: 'incorrect-transition' as const },
    },
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [unchangedCycle('action-1'), unchangedCycle('action-2')],
    },
  }).outcome, 'blocked');
  const changedCycle = (actionId: string) => ({
    ...unchangedCycle(actionId),
    afterCaptureResultSha256: 'd'.repeat(64),
    afterStateSha256: '9'.repeat(64),
    afterScreenshotSha256: 'f'.repeat(64),
    progressChanged: true,
  });
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: {
      ...failedResponse,
      regression: {
        ...failedResponse.regression,
        kind: 'incorrect-transition' as const,
      },
    },
    observer: {
      ...passingWorkerEvidence.observer,
      actionCycles: [changedCycle('action-1'), changedCycle('action-2')],
    },
  }).outcome, 'fail');
});

test('worker evidence fails closed on permission dialogs, wrong markers, and ambiguous timeouts', () => {
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    observer: {
      ...passingWorkerEvidence.observer,
      diagnostics: {
        ...passingWorkerEvidence.observer.diagnostics,
        dialogs: ['permission: Screen Recording access required'],
      },
    },
  }).integrityValid, false);
  assert.equal(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    observer: { ...passingWorkerEvidence.observer, markerValid: false },
  }).integrityValid, false);
  assert.deepEqual(classifyWorkerEvidence({
    ...passingWorkerEvidence,
    timedOut: true,
  }), {
    outcome: 'blocked',
    evidenceValid: false,
    integrityValid: true,
    reasons: ['Worker timed out without unambiguous product evidence.'],
    warnings: [],
    invariantResults: expectedPassingInvariantResults,
  });
  const observerBlocked = classifyWorkerEvidence({
    ...passingWorkerEvidence,
    response: {
      ...passingWorkerEvidence.response!,
      outcome: 'fail',
      visibleGoalMet: false,
      regression: {
        kind: 'crash',
        title: 'Page crashed',
        observed: 'The page disappeared.',
        attempts: 1,
        reproduction: null,
      },
    },
    observer: {
      ...passingWorkerEvidence.observer,
      diagnostics: {
        ...passingWorkerEvidence.observer.diagnostics,
        toolingErrors: ['trace: observer transport stopped'],
      },
    },
  });
  assert.equal(observerBlocked.outcome, 'blocked');
  assert.match(observerBlocked.reasons.join(' '), /Observer tooling failure/);
});
