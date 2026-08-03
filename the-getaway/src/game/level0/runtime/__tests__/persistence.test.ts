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

describe('Level 0 persistence envelopes', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips one complete compatible autosave envelope', () => {
    const run = createInitialLevel0RunState('run-roundtrip');
    writeLevel0Autosave(window.localStorage, run, 1234);

    const decoded = decodeLevel0Autosave(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY));
    expect(decoded.status).toBe('compatible');
    if (decoded.status === 'compatible') {
      expect(decoded.envelope.timestamp).toBe(1234);
      expect(decoded.envelope.payload).toEqual(run);
    }
  });

  it('never persists transient UI pause owners and derives terminal pauses on decode', () => {
    const run = createInitialLevel0RunState('run-transient-pause');
    run.worldClock.pauseOwners = ['menu', 'observation', 'safehouse_action'];

    writeLevel0Autosave(window.localStorage, run, 1234);

    const stored = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);
    expect(stored.payload.worldClock.pauseOwners).toEqual([]);

    stored.payload.mission = 'L0_FAILED';
    stored.payload.worldClock = createWorldClockState(24 * 60);
    stored.payload.failureCause = 'failure.deadline';
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

    const run = createInitialLevel0RunState('run-reject');
    writeLevel0Autosave(window.localStorage, run, 10);
    const parsed = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);

    parsed.schemaVersion = 99;
    expect(decodeLevel0Autosave(JSON.stringify(parsed))).toEqual({
      status: 'incompatible',
      reason: 'schema-version',
    });

    parsed.schemaVersion = 1;
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
    const run = createInitialLevel0RunState('run-corrupt');
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
      createInitialLevel0RunState('run-preserve-retired'),
      20
    );

    expect(window.localStorage.getItem(retiredKey)).toBe(retiredBytes);
    expect(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)).not.toBeNull();
  });

  it('keeps the operation Retry immutable when later departure state diverges', () => {
    const departure = departLevel0Operation(
      createInitialLevel0RunState('run-retry-once'),
      { x: 21, y: 50 }
    );
    const snapshot = departure.snapshot!;

    expect(
      writeLevel0DepartureTransaction(window.localStorage, departure.run, snapshot, 30)
    ).toEqual({ status: 'written' });
    const originalBytes = window.localStorage.getItem(LEVEL0_RETRY_KEY);

    const changedSnapshot = { ...snapshot, health: 1 };
    expect(
      writeLevel0DepartureTransaction(
        window.localStorage,
        { ...departure.run, health: 1 },
        changedSnapshot,
        40
      )
    ).toEqual({ status: 'conflict', reason: 'retry-state' });
    writeLevel0Autosave(window.localStorage, { ...departure.run, health: 9 }, 50);

    expect(window.localStorage.getItem(LEVEL0_RETRY_KEY)).toBe(originalBytes);
    expect(readLevel0Retry(window.localStorage)).toMatchObject({
      status: 'compatible',
      envelope: { payload: { health: 100 } },
    });
  });

  it('rejects a Retry snapshot that no longer matches the authored departure anchor', () => {
    const departure = departLevel0Operation(
      createInitialLevel0RunState('run-retry-position'),
      { x: 21, y: 50 }
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
    const run = createInitialLevel0RunState('run-failure-requirements');
    writeLevel0Autosave(window.localStorage, run, 56);
    const stored = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);
    stored.payload.mission = 'L0_FAILED';
    stored.payload.worldClock = createWorldClockState(24 * 60);
    stored.payload.failureCause = 'failure.deadline';
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
      createInitialLevel0RunState('run-transaction-a'),
      { x: 21, y: 50 }
    );
    expect(
      writeLevel0DepartureTransaction(window.localStorage, first.run, first.snapshot!, 60)
    ).toEqual({ status: 'written' });

    const autosaveBytes = window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY);
    const retryBytes = window.localStorage.getItem(LEVEL0_RETRY_KEY);
    expect(autosaveBytes).not.toBeNull();
    expect(retryBytes).not.toBeNull();

    const second = departLevel0Operation(
      createInitialLevel0RunState('run-transaction-b'),
      { x: 21, y: 50 }
    );
    expect(
      writeLevel0DepartureTransaction(window.localStorage, second.run, second.snapshot!, 70)
    ).toEqual({ status: 'conflict', reason: 'retry-session' });
    expect(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)).toBe(autosaveBytes);
    expect(window.localStorage.getItem(LEVEL0_RETRY_KEY)).toBe(retryBytes);
  });

  it('rejects a first-write Retry snapshot that does not match its departed autosave', () => {
    const departure = departLevel0Operation(
      createInitialLevel0RunState('run-transaction-mismatch'),
      { x: 21, y: 50 }
    );
    const mismatchedSnapshot = { ...departure.snapshot!, health: 1 };

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
});
