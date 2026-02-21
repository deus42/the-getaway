export type Disposable = () => void;

export class DisposableBag {
  private readonly disposables: Disposable[] = [];
  private disposed = false;

  add(disposable: Disposable): void {
    if (this.disposed) {
      disposable();
      return;
    }
    this.disposables.push(disposable);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    while (this.disposables.length > 0) {
      const disposable = this.disposables.pop();
      if (!disposable) {
        continue;
      }
      try {
        disposable();
      } catch (error) {
        console.error('[DisposableBag] Failed to dispose resource.', error);
      }
    }
  }
}
