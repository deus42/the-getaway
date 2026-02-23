import { ClockModule } from '../ClockModule';

describe('ClockModule', () => {
  it('tracks world time, dispatches cadence ticks, and redraws atmosphere buckets', () => {
    let atmosphereBucket = -1;
    const setAtmosphereRedrawBucket = jest.fn((nextBucket: number) => {
      atmosphereBucket = nextBucket;
    });
    const dispatchGameTime = jest.fn();
    const dispatchSuspicionDecay = jest.fn();
    const signalAtmosphereRedraw = jest.fn();
    const signalOverlayUpdate = jest.fn();
    const signalOcclusionUpdate = jest.fn();

    const module = new ClockModule({} as never, {
      getCurrentGameTime: () => 100,
      getAtmosphereRedrawBucket: () => atmosphereBucket,
      setAtmosphereRedrawBucket,
      signalAtmosphereRedraw,
      signalOverlayUpdate,
      signalOcclusionUpdate,
      dispatchGameTime,
      shouldApplySuspicionDecay: () => true,
      dispatchSuspicionDecay,
    });

    expect(setAtmosphereRedrawBucket).toHaveBeenCalledWith(20);

    module.onUpdate(0, 250);
    expect(dispatchGameTime).not.toHaveBeenCalled();

    module.onUpdate(0, 300);
    expect(dispatchGameTime).toHaveBeenCalledTimes(1);
    expect(dispatchGameTime).toHaveBeenLastCalledWith(0.55);
    expect(dispatchSuspicionDecay).toHaveBeenCalledWith(0.55, 100.55);

    module.onUpdate(0, 5000);
    expect(signalAtmosphereRedraw).toHaveBeenCalledTimes(1);
    expect(setAtmosphereRedrawBucket).toHaveBeenLastCalledWith(21);

    expect(signalOverlayUpdate).toHaveBeenCalledTimes(3);
    expect(signalOcclusionUpdate).toHaveBeenCalledTimes(3);
    expect(module.getCurrentGameTime()).toBeCloseTo(105.55);
  });
});
