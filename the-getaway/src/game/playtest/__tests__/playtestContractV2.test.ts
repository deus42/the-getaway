import {
  AI_GAMER_VERDICT_V2_SCHEMA,
  GATE_OUTCOMES,
  PLAYTEST_CONTROLS,
  PLAYTEST_EVIDENCE_CLASSES,
  PLAYTEST_GATE_REPORT_V2_SCHEMA,
  PLAYTEST_PACKET_V1_SCHEMA,
  PLAYTEST_VERBS,
  validateAiGamerVerdictV2,
  validatePlaytestCommand,
  validatePlaytestGateReportV2,
  validatePlaytestPacketV1,
} from '../playtestContractV2';

const packet = {
  schema: PLAYTEST_PACKET_V1_SCHEMA,
  packetId: 'get-179.level0-bootstrap.affected.v1',
  revision: 1,
  ticket: 'GET-179',
  mode: 'affected' as const,
  visibleGoal: 'Reach the Level 0 preparation beat through visible player controls.',
  startState: { kind: 'new-game' as const },
  viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  locale: 'en' as const,
  allowedVisibleInputs: ['Left click', 'W/A/S/D', 'E', 'O', 'Escape'],
  computerUsePolicy: {
    actionTools: ['click', 'press_key'] as const,
    keys: ['w', 'a', 's', 'd', 'e', 'o', 'escape'],
  },
  playerPersonas: [{ id: 'first-time-player', brief: 'Explore deliberately and read visible feedback.' }],
  workerCount: 1 as const,
  allowedVerbs: [...PLAYTEST_VERBS],
  allowedControls: [...PLAYTEST_CONTROLS],
  requiredProbeIds: ['level0.preparation'],
  requiredInvariants: [{ id: 'visible-inputs-only', description: 'Use only visible player input.' }],
  evidenceRequirements: {
    milestoneScreenshots: true,
    trace: true,
    console: true,
    pageErrors: true,
    network: true,
    workerTranscript: true,
    replayEvidence: false,
  },
  reviewedAt: '2026-08-09T00:00:00.000Z',
};

const verdict = {
  schema: AI_GAMER_VERDICT_V2_SCHEMA,
  packetId: packet.packetId,
  workerId: 'worker-1',
  outcome: 'pass' as const,
  evidenceClass: 'live-guided' as const,
  visibleGoalMet: true,
  summary: 'Reached preparation through the visible New Game and dialogue flow.',
  evidenceRefs: ['screenshot:final'],
  warnings: [],
  model: {
    requested: 'gpt-5.6-sol',
    effective: 'gpt-5.6-sol',
    reasoningEffort: 'high' as const,
    codexVersion: '0.145.0',
    catalogEvidenceRef: 'model-catalog.json',
    runtimeEvidenceRef: 'worker-1.jsonl',
  },
  worker: {
    browserApp: 'Google Chrome',
    marker: 'GET-179.worker-1',
    transcriptRef: 'worker-1.jsonl',
    transcriptSha256: 'a'.repeat(64),
    integrityValid: true,
  },
};

describe('playtest contract v2', () => {
  it('freezes the exact guided vocabulary and keeps controls separate', () => {
    expect(PLAYTEST_VERBS).toEqual([
      'move',
      'observe',
      'interact',
      'choose',
      'useContext',
      'consultGeorge',
    ]);
    expect(PLAYTEST_CONTROLS).toEqual(['start', 'wait', 'restartAttempt']);
    expect(new Set([...PLAYTEST_VERBS, ...PLAYTEST_CONTROLS]).size).toBe(9);
  });

  it.each([
    { kind: 'verb', verb: 'move' },
    { kind: 'verb', verb: 'observe' },
    { kind: 'verb', verb: 'interact' },
    { kind: 'verb', verb: 'choose' },
    { kind: 'verb', verb: 'useContext' },
    { kind: 'verb', verb: 'consultGeorge' },
    { kind: 'control', control: 'start' },
    { kind: 'control', control: 'wait', durationMs: 250 },
    { kind: 'control', control: 'restartAttempt' },
  ])('accepts canonical command $kind/$verb$control', (command) => {
    expect(validatePlaytestCommand(command)).toEqual({ ok: true });
  });

  it.each([
    { type: 'startLevel0' },
    { type: 'clickTile', position: { x: 1, y: 2 } },
    { type: 'focusObjective' },
    { type: 'interactNpc', role: 'lira' },
    { type: 'collectItem', name: 'medkits' },
    { type: 'toggleStealth' },
    { type: 'continueMission' },
    { type: 'advanceMission' },
    { type: 'triggerMissionFailure' },
    { type: 'chooseDialogueOption', index: 0 },
    { type: 'setClock', phase: 'night' },
    { type: 'waitForDialogue' },
    { kind: 'verb', verb: 'combat' },
    { kind: 'verb', verb: 'interact', role: 'lira' },
    { kind: 'verb', verb: 'move', position: { x: 1, y: 2 } },
    { kind: 'control', control: 'wait', durationMs: Number.NaN },
  ])('rejects legacy or direct-state command %#', (command) => {
    expect(validatePlaytestCommand(command).ok).toBe(false);
  });

  it('validates a versioned packet with the frozen command vocabulary', () => {
    const result = validatePlaytestPacketV1(packet);

    expect(result).toEqual({ ok: true });
    expect(validatePlaytestPacketV1({
      ...packet,
      packetId: 'GET-179:legacy',
      allowedVerbs: [...PLAYTEST_VERBS, 'toggleStealth'],
    }).ok).toBe(false);
  });

  it('requires the complete reviewed packet envelope and mode-safe start state', () => {
    for (const missing of [
      'revision',
      'startState',
      'viewport',
      'locale',
      'allowedVisibleInputs',
      'computerUsePolicy',
      'playerPersonas',
      'evidenceRequirements',
      'reviewedAt',
    ] as const) {
      const candidate = { ...packet } as Record<string, unknown>;
      delete candidate[missing];
      expect(validatePlaytestPacketV1(candidate)).toEqual({ ok: false, reason: 'invalid-packet' });
    }
    expect(validatePlaytestPacketV1({
      ...packet,
      mode: 'closeout',
      startState: { kind: 'checkpoint', checkpointId: 'stale' },
    })).toEqual({ ok: false, reason: 'closeout-must-start-new-game' });
    expect(validatePlaytestPacketV1({
      ...packet,
      workerCount: 2,
      playerPersonas: packet.playerPersonas,
    })).toEqual({ ok: false, reason: 'persona-worker-count-mismatch' });
  });

  it('freezes v2 verdict/report schemas and the three gate outcomes', () => {
    expect(GATE_OUTCOMES).toEqual(['pass', 'fail', 'blocked']);
    expect(PLAYTEST_EVIDENCE_CLASSES).toEqual([
      'live-guided',
      'deterministic-reachable',
      'fixture-only',
    ]);

    expect(validateAiGamerVerdictV2(verdict)).toEqual({ ok: true });
    const passingReport = {
      schema: PLAYTEST_GATE_REPORT_V2_SCHEMA,
      runId: '2026-08-09-get-179-affected',
      ticket: 'GET-179',
      mode: 'affected',
      packetId: verdict.packetId,
      packetRevision: packet.revision,
      packetSha256: 'b'.repeat(64),
      packetEvidenceRef: 'playtest-packet.json',
      outcome: 'pass',
      exitCode: 0,
      startedAt: '2026-08-09T00:00:00.000Z',
      completedAt: '2026-08-09T00:01:00.000Z',
      retention: 'concise',
      verdicts: [verdict],
      probeResults: [{
        probeId: 'level0.preparation',
        state: 'met',
        acceptanceEligible: true,
        evidenceRefs: ['screenshot:final'],
      }],
      invariantEvidenceBasis: 'derived',
      invariantResults: [{
        invariantId: 'window-marker',
        state: 'met',
        acceptanceEligible: true,
        evidenceRefs: ['screenshot:final'],
      }],
      probeTimeline: [{
        capturedAt: '2026-08-09T00:00:30.000Z',
        probeId: 'level0.preparation',
        from: 'unmet',
        to: 'met',
        evidenceRefs: ['screenshot:final'],
      }],
      evidenceRefs: ['playtest-packet.json', 'screenshot:final'],
      warnings: [],
      findings: [],
      quorum: { required: 1, valid: 1, decidingWorkerIds: ['worker-1'] },
    };
    expect(validatePlaytestGateReportV2(passingReport)).toEqual({ ok: true });
    const reportWithoutInvariantBasis = { ...passingReport } as Record<string, unknown>;
    delete reportWithoutInvariantBasis.invariantEvidenceBasis;
    expect(validatePlaytestGateReportV2(reportWithoutInvariantBasis)).toEqual({
      ok: false,
      reason: 'invalid-gate-invariant-evidence-basis',
    });
    expect(validatePlaytestGateReportV2({
      ...passingReport,
      invariantResults: [],
    })).toEqual({ ok: false, reason: 'passing-gate-missing-evidence' });
    expect(validatePlaytestGateReportV2({
      ...passingReport,
      probeResults: [],
    })).toEqual({ ok: false, reason: 'passing-gate-missing-evidence' });
    expect(validatePlaytestGateReportV2({
      ...passingReport,
      packetSha256: null,
    })).toEqual({ ok: false, reason: 'invalid-gate-packet-binding' });
    expect(validatePlaytestGateReportV2({
      ...passingReport,
      evidenceRefs: ['screenshot:final'],
    })).toEqual({ ok: false, reason: 'gate-packet-artifact-missing-from-evidence' });
  });

  it('never validates fixture-only evidence as a passing verdict or gate', () => {
    const fixtureVerdict = {
      ...verdict,
      packetId: 'GET-179:fixture',
      workerId: 'fixture-worker',
      evidenceClass: 'fixture-only',
      evidenceRefs: ['fixture:direct-state', 'playtest-packet.json'],
    };

    expect(validateAiGamerVerdictV2(fixtureVerdict)).toEqual({
      ok: false,
      reason: 'fixture-only-cannot-pass',
    });
    expect(validatePlaytestGateReportV2({
      schema: PLAYTEST_GATE_REPORT_V2_SCHEMA,
      runId: 'fixture-run',
      ticket: 'GET-179',
      mode: 'affected',
      packetId: fixtureVerdict.packetId,
      packetRevision: packet.revision,
      packetSha256: 'b'.repeat(64),
      packetEvidenceRef: 'playtest-packet.json',
      outcome: 'pass',
      exitCode: 0,
      startedAt: '2026-08-09T00:00:00.000Z',
      completedAt: '2026-08-09T00:01:00.000Z',
      retention: 'concise',
      verdicts: [fixtureVerdict],
      probeResults: [{
        probeId: 'level0.debrief',
        state: 'met',
        acceptanceEligible: false,
        evidenceRefs: ['fixture:direct-state'],
      }],
      invariantEvidenceBasis: 'derived',
      invariantResults: [{
        invariantId: 'window-marker',
        state: 'unmet',
        acceptanceEligible: false,
        evidenceRefs: ['fixture:direct-state'],
      }],
      probeTimeline: [],
      evidenceRefs: ['fixture:direct-state', 'playtest-packet.json'],
      warnings: [],
      findings: [],
      quorum: { required: 1, valid: 1, decidingWorkerIds: ['fixture-worker'] },
    })).toEqual({
      ok: false,
      reason: 'fixture-only-cannot-pass',
    });
  });

  it('allows an exit-3 blocked report before any worker can start', () => {
    expect(validatePlaytestGateReportV2({
      schema: PLAYTEST_GATE_REPORT_V2_SCHEMA,
      runId: 'invalid-packet-run',
      ticket: 'GET-999',
      mode: 'affected',
      packetId: 'unavailable',
      packetRevision: null,
      packetSha256: null,
      packetEvidenceRef: null,
      outcome: 'blocked',
      exitCode: 3,
      startedAt: '2026-08-09T00:00:00.000Z',
      completedAt: '2026-08-09T00:00:00.100Z',
      retention: 'diagnostic',
      verdicts: [],
      probeResults: [],
      invariantEvidenceBasis: 'derived',
      invariantResults: [],
      probeTimeline: [],
      evidenceRefs: ['report.json'],
      warnings: [],
      findings: [{
        id: 'invalid-packet',
        kind: 'blocker',
        title: 'Packet is unavailable',
        summary: 'No reviewed packet exists for the requested ticket and mode.',
        evidenceRefs: ['report.json'],
      }],
      quorum: { required: 1, valid: 0, decidingWorkerIds: [] },
    })).toEqual({ ok: true });
  });
});
