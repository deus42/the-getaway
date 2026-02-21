import { DisposableBag } from '../DisposableBag';

describe('DisposableBag', () => {
  it('disposes resources in reverse registration order', () => {
    const bag = new DisposableBag();
    const calls: string[] = [];

    bag.add(() => calls.push('first'));
    bag.add(() => calls.push('second'));
    bag.add(() => calls.push('third'));

    bag.dispose();

    expect(calls).toEqual(['third', 'second', 'first']);
  });

  it('is idempotent', () => {
    const bag = new DisposableBag();
    const disposer = jest.fn();

    bag.add(disposer);
    bag.dispose();
    bag.dispose();

    expect(disposer).toHaveBeenCalledTimes(1);
  });

  it('disposes immediately when adding after bag is already disposed', () => {
    const bag = new DisposableBag();
    const disposer = jest.fn();

    bag.dispose();
    bag.add(disposer);

    expect(disposer).toHaveBeenCalledTimes(1);
  });

  it('continues disposal even when one disposer throws', () => {
    const bag = new DisposableBag();
    const calls: string[] = [];

    bag.add(() => calls.push('tail'));
    bag.add(() => {
      throw new Error('dispose failure');
    });
    bag.add(() => calls.push('head'));

    bag.dispose();

    expect(calls).toEqual(['head', 'tail']);
  });
});
