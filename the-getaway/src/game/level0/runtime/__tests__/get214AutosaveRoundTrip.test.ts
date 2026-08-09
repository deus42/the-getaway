import { advanceWorldClock } from '../worldClock';
import {
  decodeLevel0Autosave,
  LEVEL0_AUTOSAVE_KEY,
  writeLevel0Autosave,
} from '../persistence';
import { createTestLevel0RunState } from '../../testing/createTestLevel0RunState';
import type { Level0RunState } from '../types';

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const advanceRunTo = (run: Level0RunState, targetMinute: number): Level0RunState => {
  let current = run;
  // Frame-sized fractional steps, like the live 250 ms interval at 30x.
  while (current.worldClock.currentMinute < targetMinute) {
    const result = advanceWorldClock(current.worldClock, {
      realMilliseconds: 251.7,
      activeExploration: true,
      completion: current.completion,
    });
    current = { ...current, worldClock: result.state };
  }
  return current;
};

describe('GET-214 autosave round-trip across street boundaries', () => {
  it.each([
    ['before any boundary', 19 * 60 + 14, []],
    ['after blue hour', 20 * 60 + 6, []],
    ['after 21:00', 21 * 60 + 2, ['clock.2100']],
    ['after 21:30', 21 * 60 + 44, ['clock.2100', 'clock.2130']],
    ['after curfew', 22 * 60 + 13, ['clock.2100', 'clock.2130', 'clock.2200']],
    [
      'after last train',
      23 * 60 + 41,
      ['clock.2100', 'clock.2130', 'clock.2200', 'clock.2330'],
    ],
  ])('writes and rehydrates a frame-advanced run %s', (_label, minute, expectedBoundaryIds) => {
    const storage = new MemoryStorage();
    const run = advanceRunTo(createTestLevel0RunState(`roundtrip-${minute}`), minute);

    expect(run.worldClock.processedBoundaryIds).toEqual(expectedBoundaryIds);

    writeLevel0Autosave(storage, run, 1_000);
    expect(storage.getItem(LEVEL0_AUTOSAVE_KEY)).not.toBeNull();

    const decoded = decodeLevel0Autosave(storage.getItem(LEVEL0_AUTOSAVE_KEY));
    expect(decoded.status).toBe('compatible');
    if (decoded.status === 'compatible') {
      expect(decoded.envelope.payload.worldClock.currentMinute).toBeCloseTo(
        run.worldClock.currentMinute
      );
      expect(decoded.envelope.payload.worldClock.processedBoundaryIds).toEqual(
        expectedBoundaryIds
      );
      expect(decoded.envelope.payload.recovery).toEqual(run.recovery);
    }
  });
});
