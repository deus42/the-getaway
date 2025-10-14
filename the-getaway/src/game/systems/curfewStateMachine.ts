export type CurfewTimeoutHandle = ReturnType<typeof setTimeout>;

const timerHost: Pick<typeof globalThis, 'setTimeout' | 'clearTimeout'> =
  typeof window !== 'undefined' ? window : globalThis;

export class CurfewStateMachine {
  private timeouts = new Set<CurfewTimeoutHandle>();

  schedule(callback: () => void, delayMs: number): CurfewTimeoutHandle {
    const handle = timerHost.setTimeout(() => {
      this.timeouts.delete(handle);
      callback();
    }, delayMs);

    this.timeouts.add(handle);
    return handle;
  }

  cancel(handle: CurfewTimeoutHandle | null | undefined) {
    if (handle === null || handle === undefined) {
      return;
    }

    timerHost.clearTimeout(handle);
    this.timeouts.delete(handle);
  }

  dispose() {
    this.timeouts.forEach((handle) => {
      timerHost.clearTimeout(handle);
    });
    this.timeouts.clear();
  }
}

export const createCurfewStateMachine = () => new CurfewStateMachine();
