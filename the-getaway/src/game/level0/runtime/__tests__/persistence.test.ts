import {
  LEVEL0_AUTOSAVE_KEY,
  LEVEL0_RETRY_KEY,
  decodeLevel0Autosave,
  readLevel0Retry,
  writeLevel0DepartureTransaction,
  writeLevel0Autosave,
} from '../persistence';
import { createInitialLevel0RunState, departLevel0Operation } from '../safehouse';
import { createWorldClockState } from '../worldClock';
import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { createConfirmedLevel0Sample } from '../../rpg/creation';
import type { Level0PlayerAppearanceId } from '../../../../content/characters/spriteManifest';
import { applyLevel0ResourceEffect, createLevel0ResourceEffect } from '../../rpg/resources';
import { commitLevel0CheckResolution } from '../../rpg/checks';
import { createTestLevel0RunState } from '../../testing/createTestLevel0RunState';

const DEPARTURE_POSITION = LEVEL0_LAYOUT_CONTRACT.anchors.find(
  (anchor) => anchor.id === 'safehouse.departure'
)!.position;

const prepareForDeparture = (run: ReturnType<typeof createInitialLevel0RunState>) => ({
  ...run,
  mission: 'L0_PREPARATION' as const,
});

const makeRunWithAppearance = (
  sessionId: string,
  appearancePresetId: Level0PlayerAppearanceId
) => {
  const sample = createConfirmedLevel0Sample('social_mental', 'Mara', appearancePresetId);
  return createInitialLevel0RunState(sessionId, sample.identity, sample.build);
};

describe('Level 0 persistence envelopes', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips one complete compatible autosave envelope', () => {
    const run = createTestLevel0RunState('run-roundtrip');
    writeLevel0Autosave(window.localStorage, run, 1234);

    const decoded = decodeLevel0Autosave(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY));
    expect(decoded.status).toBe('compatible');
    if (decoded.status === 'compatible') {
      expect(decoded.envelope.timestamp).toBe(1234);
      expect(decoded.envelope.payload).toEqual(run);
    }
  });

  it('rejects forged check outcomes and modifiers instead of trusting ledger math', () => {
    const social = createConfirmedLevel0Sample('social_mental', 'Mara');
    const committed = commitLevel0CheckResolution(
      createInitialLevel0RunState('run-check-integrity', social.identity, social.build),
      {
        resolutionId: 'resolution.camera-loop.integrity',
        checkId: 'check.camera_loop',
        activeContextIds: [],
      }
    );
    expect(committed.applied).toBe(true);
    writeLevel0Autosave(window.localStorage, committed.run, 1235);

    const stored = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);
    const resolution = stored.payload.rpg.resolvedChecks['resolution.camera-loop.integrity'];
    expect(resolution).toMatchObject({
      outcome: 'fail-forward',
      paranoiaValue: 0,
      activeContextIds: [],
    });

    resolution.outcome = 'success';
    expect(decodeLevel0Autosave(JSON.stringify(stored))).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });

    resolution.outcome = 'fail-forward';
    resolution.appliedModifiers = [{
      id: 'modifier.forged',
      amount: 3,
      requiredContextId: 'context.forged',
    }];
    resolution.finalTotal += 3;
    expect(decodeLevel0Autosave(JSON.stringify(stored))).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });
  });

  it('rejects retired and unknown appearances instead of guessing a migration', () => {
    const run = makeRunWithAppearance('run-appearance-rejection', 'player_civilian_04');
    writeLevel0Autosave(window.localStorage, run, 1234);
    const stored = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);

    stored.payload.identity.appearancePresetId = 'provisional-runtime-silhouette';
    expect(decodeLevel0Autosave(JSON.stringify(stored))).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });

    stored.payload.identity.appearancePresetId = 'unknown-future-appearance';
    expect(decodeLevel0Autosave(JSON.stringify(stored))).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });
  });

  it('rejects a retired appearance in Retry snapshots', () => {
    const departure = departLevel0Operation(
      prepareForDeparture(makeRunWithAppearance('run-retry-appearance', 'player_civilian_03')),
      { ...DEPARTURE_POSITION }
    );
    writeLevel0DepartureTransaction(window.localStorage, departure.run, departure.snapshot!, 1250);
    const stored = JSON.parse(window.localStorage.getItem(LEVEL0_RETRY_KEY)!);
    stored.payload.identity.appearancePresetId = 'provisional-runtime-silhouette';
    window.localStorage.setItem(LEVEL0_RETRY_KEY, JSON.stringify(stored));

    expect(readLevel0Retry(window.localStorage)).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });
  });

  it('never persists transient UI pause owners and derives terminal pauses on decode', () => {
    const run = createTestLevel0RunState('run-transient-pause');
    run.worldClock.pauseOwners = ['menu', 'bible', 'observation', 'safehouse_action'];

    writeLevel0Autosave(window.localStorage, run, 1234);

    const stored = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);
    expect(stored.payload.worldClock.pauseOwners).toEqual([]);

    stored.payload.mission = 'L0_FAILED';
    stored.payload.worldClock = createWorldClockState(24 * 60);
    stored.payload.failureCause = 'failure.deadline';
    stored.payload.failureSourceId = 'clock.deadline';
    stored.payload.failureMissingRequirements = ['medkits-returned', 'transit-validated'];
    const decoded = decodeLevel0Autosave(JSON.stringify(stored));
    expect(decoded.status).toBe('compatible');
    if (decoded.status === 'compatible') {
      expect(decoded.envelope.payload.worldClock.pauseOwners).toEqual(['failure']);
    }
  });

  it('rejects malformed, unknown-schema, and wrong-layout payloads without default filling', () => {
    expect(decodeLevel0Autosave('{"schemaVersion":1}')).toMatchObject({
      status: 'incompatible',
    });

    const run = createTestLevel0RunState('run-reject');
    writeLevel0Autosave(window.localStorage, run, 10);
    const parsed = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);

    parsed.schemaVersion = 99;
    expect(decodeLevel0Autosave(JSON.stringify(parsed))).toEqual({
      status: 'incompatible',
      reason: 'schema-version',
    });

    parsed.schemaVersion = run.schemaVersion;
    parsed.contentVersions.layout = 'wrong-layout';
    expect(decodeLevel0Autosave(JSON.stringify(parsed))).toEqual({
      status: 'incompatible',
      reason: 'content-version',
    });
  });

  it.each([
    ['attributes', (payload: Record<string, unknown>) => {
      (payload.build as Record<string, unknown>).attributes = {};
    }],
    ['skills', (payload: Record<string, unknown>) => {
      (payload.build as Record<string, unknown>).skills = {};
    }],
    ['earned skill accounting', (payload: Record<string, unknown>) => {
      const build = payload.build as Record<string, unknown>;
      const skills = build.skills as Record<string, number>;
      skills.awareness += 1;
    }],
    ['normalized callsign', (payload: Record<string, unknown>) => {
      const identity = payload.identity as Record<string, unknown>;
      identity.callsign = '  Mara  ';
    }],
    ['RPG ledger shape', (payload: Record<string, unknown>) => {
      const rpg = payload.rpg as Record<string, unknown>;
      delete rpg.resourceEvents;
    }],
    ['objectives', (payload: Record<string, unknown>) => { payload.objectives = { broken: null }; }],
    ['contacts', (payload: Record<string, unknown>) => { payload.contacts = {}; }],
    ['map knowledge', (payload: Record<string, unknown>) => { payload.mapKnowledge = {}; }],
    ['pause owners', (payload: Record<string, unknown>) => {
      (payload.worldClock as Record<string, unknown>).pauseOwners = ['unknown-overlay'];
    }],
    ['clock consistency', (payload: Record<string, unknown>) => {
      (payload.worldClock as Record<string, unknown>).currentMinute = 999;
    }],
    ['failure cause', (payload: Record<string, unknown>) => { payload.failureCause = 'failure.magic'; }],
    ['failure source', (payload: Record<string, unknown>) => { payload.failureSourceId = 'magic'; }],
    ['outside player position', (payload: Record<string, unknown>) => {
      (payload.player as Record<string, unknown>).position = { x: -1, y: -1 };
    }],
    ['occupied player position', (payload: Record<string, unknown>) => {
      (payload.player as Record<string, unknown>).position = { x: 15, y: 15 };
    }],
    ['clearance-overlapping player position', (payload: Record<string, unknown>) => {
      (payload.player as Record<string, unknown>).position = { x: 61.2, y: 20 };
    }],
    ['overflowing player position', (payload: Record<string, unknown>) => {
      (payload.player as Record<string, unknown>).position = { x: 1e308, y: 1e308 };
    }],
    ['zero facing', (payload: Record<string, unknown>) => {
      (payload.player as Record<string, unknown>).facing = { x: 0, y: 0 };
    }],
    ['unnormalized facing', (payload: Record<string, unknown>) => {
      (payload.player as Record<string, unknown>).facing = { x: 20, y: 20 };
    }],
    ['outside last-known position', (payload: Record<string, unknown>) => {
      (payload.surveillance as Record<string, unknown>).lastKnownPosition = { x: 100, y: 100 };
    }],
    ['clearance-overlapping last-known position', (payload: Record<string, unknown>) => {
      (payload.surveillance as Record<string, unknown>).lastKnownPosition = { x: 61.2, y: 20 };
    }],
    ['runtime generation', (payload: Record<string, unknown>) => {
      (payload.runtimeGeneration as Record<string, unknown>).generationVersion = 'drifted-runtime';
    }],
    ['authored layout variant', (payload: Record<string, unknown>) => {
      const generation = payload.runtimeGeneration as Record<string, unknown>;
      generation.authoredVariantIds = { layout: 'drifted-layout' };
    }],
  ])('rejects a structurally corrupted %s payload', (_label, mutate) => {
    const run = createTestLevel0RunState('run-corrupt');
    writeLevel0Autosave(window.localStorage, run, 10);
    const parsed = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);
    mutate(parsed.payload as Record<string, unknown>);

    expect(decodeLevel0Autosave(JSON.stringify(parsed))).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });
  });

  it('never touches retired bytes when writing the new target autosave', () => {
    const retiredKey = 'the-getaway-state';
    const retiredBytes = JSON.stringify({ player: { name: 'Retired Operative' } });
    window.localStorage.setItem(retiredKey, retiredBytes);

    writeLevel0Autosave(
      window.localStorage,
      createTestLevel0RunState('run-preserve-retired'),
      20
    );

    expect(window.localStorage.getItem(retiredKey)).toBe(retiredBytes);
    expect(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)).not.toBeNull();
  });

  it('keeps the operation Retry immutable when later departure state diverges', () => {
    const departure = departLevel0Operation(
      prepareForDeparture(createTestLevel0RunState('run-retry-once')),
      { ...DEPARTURE_POSITION }
    );
    const snapshot = departure.snapshot!;

    expect(
      writeLevel0DepartureTransaction(window.localStorage, departure.run, snapshot, 30)
    ).toEqual({ status: 'written' });
    const originalBytes = window.localStorage.getItem(LEVEL0_RETRY_KEY);

    const damaged = applyLevel0ResourceEffect(departure.run, createLevel0ResourceEffect({
      eventId: 'resource.test.damage',
      resource: 'health',
      amount: -99,
      sourceId: 'test.damage',
      feedbackId: 'resource.health.test',
      worldMinute: departure.run.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    })).run;
    const changedSnapshot = {
      ...snapshot,
      health: damaged.health,
      rpg: damaged.rpg,
    };
    expect(
      writeLevel0DepartureTransaction(
        window.localStorage,
        damaged,
        changedSnapshot,
        40
      )
    ).toEqual({ status: 'conflict', reason: 'retry-state' });
    writeLevel0Autosave(window.localStorage, damaged, 50);

    expect(window.localStorage.getItem(LEVEL0_RETRY_KEY)).toBe(originalBytes);
    expect(readLevel0Retry(window.localStorage)).toMatchObject({
      status: 'compatible',
      envelope: { payload: { health: 100 } },
    });
  });

  it('rejects a Retry snapshot that no longer matches the authored departure anchor', () => {
    const departure = departLevel0Operation(
      prepareForDeparture(createTestLevel0RunState('run-retry-position')),
      { ...DEPARTURE_POSITION }
    );
    writeLevel0DepartureTransaction(window.localStorage, departure.run, departure.snapshot!, 55);

    const stored = JSON.parse(window.localStorage.getItem(LEVEL0_RETRY_KEY)!);
    stored.payload.player.position = { x: 25, y: 30 };
    window.localStorage.setItem(LEVEL0_RETRY_KEY, JSON.stringify(stored));

    expect(readLevel0Retry(window.localStorage)).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });
  });

  it('rejects deadline failure copy that omits or misstates a missing requirement', () => {
    const run = createTestLevel0RunState('run-failure-requirements');
    writeLevel0Autosave(window.localStorage, run, 56);
    const stored = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);
    stored.payload.mission = 'L0_FAILED';
    stored.payload.worldClock = createWorldClockState(24 * 60);
    stored.payload.failureCause = 'failure.deadline';
    stored.payload.failureSourceId = 'clock.deadline';
    stored.payload.failureMissingRequirements = ['medkits-returned'];

    expect(decodeLevel0Autosave(JSON.stringify(stored))).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });

    stored.payload.completion.medkitsReturned = true;
    stored.payload.failureMissingRequirements = ['medkits-returned'];
    expect(decodeLevel0Autosave(JSON.stringify(stored))).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });
  });

  it('writes Retry before the departed autosave and rejects a conflicting session', () => {
    const first = departLevel0Operation(
      prepareForDeparture(createTestLevel0RunState('run-transaction-a')),
      { ...DEPARTURE_POSITION }
    );
    expect(
      writeLevel0DepartureTransaction(window.localStorage, first.run, first.snapshot!, 60)
    ).toEqual({ status: 'written' });

    const autosaveBytes = window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY);
    const retryBytes = window.localStorage.getItem(LEVEL0_RETRY_KEY);
    expect(autosaveBytes).not.toBeNull();
    expect(retryBytes).not.toBeNull();

    const second = departLevel0Operation(
      prepareForDeparture(createTestLevel0RunState('run-transaction-b')),
      { ...DEPARTURE_POSITION }
    );
    expect(
      writeLevel0DepartureTransaction(window.localStorage, second.run, second.snapshot!, 70)
    ).toEqual({ status: 'conflict', reason: 'retry-session' });
    expect(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)).toBe(autosaveBytes);
    expect(window.localStorage.getItem(LEVEL0_RETRY_KEY)).toBe(retryBytes);
  });

  it('rejects a first-write Retry snapshot that does not match its departed autosave', () => {
    const departure = departLevel0Operation(
      prepareForDeparture(createTestLevel0RunState('run-transaction-mismatch')),
      { ...DEPARTURE_POSITION }
    );
    const damaged = applyLevel0ResourceEffect(departure.run, createLevel0ResourceEffect({
      eventId: 'resource.test.retry-mismatch',
      resource: 'health',
      amount: -10,
      sourceId: 'test.retry-mismatch',
      feedbackId: 'resource.health.test',
      worldMinute: departure.run.worldClock.currentMinute,
      retryTreatment: 'captured-at-departure',
    })).run;
    const mismatchedSnapshot = {
      ...departure.snapshot!,
      health: damaged.health,
      rpg: damaged.rpg,
    };

    expect(
      writeLevel0DepartureTransaction(
        window.localStorage,
        departure.run,
        mismatchedSnapshot,
        80
      )
    ).toEqual({ status: 'conflict', reason: 'retry-state' });
    expect(window.localStorage.getItem(LEVEL0_RETRY_KEY)).toBeNull();
    expect(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)).toBeNull();
  });

  it.each([
    ['Health', 'health', -100, 'failure.health'],
    ['Paranoia', 'paranoia', 100, 'failure.paranoia'],
  ] as const)('round-trips a sourced fatal %s failure', (_label, resource, amount, cause) => {
    const run = createTestLevel0RunState(`run-fatal-${resource}`);
    const failed = applyLevel0ResourceEffect(run, createLevel0ResourceEffect({
      eventId: `resource.test.fatal.${resource}`,
      resource,
      amount,
      sourceId: `test.fatal.${resource}`,
      feedbackId: `resource.${resource}.fatal`,
      worldMinute: run.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    })).run;

    writeLevel0Autosave(window.localStorage, failed, 90);
    const decoded = decodeLevel0Autosave(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY));
    expect(decoded.status).toBe('compatible');
    if (decoded.status === 'compatible') {
      expect(decoded.envelope.payload).toMatchObject({
        mission: 'L0_FAILED',
        failureCause: cause,
        failureSourceId: `test.fatal.${resource}`,
      });
    }
  });

  it.each([
    ['Health', 'health', -100],
    ['Paranoia', 'paranoia', 100],
  ] as const)('rejects a lethal %s ledger forged back into an active mission', (
    _label,
    resource,
    amount
  ) => {
    const run = createTestLevel0RunState(`run-forged-active-${resource}`);
    const failed = applyLevel0ResourceEffect(run, createLevel0ResourceEffect({
      eventId: `resource.test.forged-active.${resource}`,
      resource,
      amount,
      sourceId: `test.forged-active.${resource}`,
      feedbackId: `resource.${resource}.fatal`,
      worldMinute: run.worldClock.currentMinute,
      retryTreatment: 'discard-on-retry',
    })).run;
    const forged = {
      ...failed,
      mission: 'L0_SAFEHOUSE_INTRO' as const,
      failureCause: null,
      failureSourceId: null,
      failureMissingRequirements: [],
      worldClock: { ...failed.worldClock, pauseOwners: [] },
    };

    expect(() => writeLevel0Autosave(window.localStorage, forged, 91)).toThrow(
      'Refusing to persist an invalid Level 0 autosave payload'
    );
  });
});
