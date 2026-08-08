import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import {
  LEVEL0_ATTEMPT_BASELINE_KEY,
  LEVEL0_AUTOSAVE_KEY,
  decodeLevel0Autosave,
  readLevel0OperationAttemptBaseline,
  writeLevel0Autosave,
  writeLevel0DepartureTransaction,
} from '../persistence';
import { createInitialLevel0RunState, departLevel0Operation } from '../safehouse';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  readonly writes: string[] = [];
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    this.writes.push(key);
    this.values.set(key, value);
  }
}

const createDeparture = () => {
  const initial = createInitialLevel0RunState('persistence-v3', 'cover.neighbor');
  const preparation = { ...initial, mission: 'L0_PREPARATION' as const };
  const anchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
    (candidate) => candidate.id === 'safehouse.departure'
  );
  if (!anchor) throw new Error('missing departure anchor');
  return departLevel0Operation(preparation, anchor.position);
};

describe('GET-216 Level 0 v3 persistence', () => {
  it('round-trips a valid autosave while discarding transient pause owners', () => {
    const storage = new MemoryStorage();
    const run = createInitialLevel0RunState('autosave-v3', 'cover.neighbor');
    run.worldClock.pauseOwners = ['menu', 'character'];

    writeLevel0Autosave(storage, run, 123);
    const decoded = decodeLevel0Autosave(storage.getItem(LEVEL0_AUTOSAVE_KEY));

    expect(decoded.status).toBe('compatible');
    if (decoded.status === 'compatible') {
      expect(decoded.envelope.payload.worldClock.pauseOwners).toEqual([]);
      expect(decoded.envelope.payload.identity.coverId).toBe('cover.neighbor');
      expect(decoded.envelope.payload).not.toHaveProperty('health');
      expect(decoded.envelope.payload).not.toHaveProperty('build');
    }
  });

  it('rejects v2 and malformed payloads without partial migration', () => {
    const retired = JSON.stringify({
      kind: 'autosave',
      schemaVersion: 2,
      contentVersions: { layout: 'retired', runtime: 'level0-runtime-v2' },
      timestamp: 1,
      payload: {},
    });
    expect(decodeLevel0Autosave(retired)).toEqual({
      status: 'incompatible',
      reason: 'schema-version',
    });
    expect(decodeLevel0Autosave('{')).toEqual({
      status: 'incompatible',
      reason: 'malformed',
    });
  });

  it('fails closed on retired or unknown run fields', () => {
    const storage = new MemoryStorage();
    const run = createInitialLevel0RunState('invalid-v3', 'cover.neighbor');
    const invalid = { ...run, health: 100 };
    const raw = JSON.stringify({
      kind: 'autosave',
      schemaVersion: 3,
      contentVersions: run.contentVersions,
      timestamp: 1,
      payload: invalid,
    });
    expect(decodeLevel0Autosave(raw)).toEqual({
      status: 'incompatible',
      reason: 'payload',
    });
    expect(() => writeLevel0Autosave(storage, invalid as never)).toThrow(
      'Refusing to persist an invalid Level 0 autosave payload'
    );
  });

  it('writes the immutable operation baseline before the departed autosave', () => {
    const storage = new MemoryStorage();
    const departure = createDeparture();
    expect(departure.baseline).not.toBeNull();

    const result = writeLevel0DepartureTransaction(
      storage,
      departure.run,
      departure.baseline!,
      456
    );
    expect(result).toEqual({ status: 'written' });
    expect(storage.writes).toEqual([LEVEL0_ATTEMPT_BASELINE_KEY, LEVEL0_AUTOSAVE_KEY]);

    const readback = readLevel0OperationAttemptBaseline(storage);
    expect(readback.status).toBe('compatible');
    if (readback.status === 'compatible') {
      expect(readback.envelope.payload).toEqual(departure.baseline);
    }
  });

  it('rejects a divergent second baseline for the same session', () => {
    const storage = new MemoryStorage();
    const departure = createDeparture();
    writeLevel0DepartureTransaction(storage, departure.run, departure.baseline!, 1);
    const divergent = {
      ...departure.baseline!,
      safehouse: {
        ...departure.baseline!.safehouse,
        usedActionIds: [...departure.baseline!.safehouse.usedActionIds, 'wait'],
      },
    };

    expect(writeLevel0DepartureTransaction(
      storage,
      departure.run,
      divergent,
      2
    )).toEqual({ status: 'conflict', reason: 'baseline-state' });
  });
});
