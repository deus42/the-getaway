import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import Level0StreetMomentBanner from '../components/level0/Level0StreetMomentBanner';
import { LEVEL0_LAYOUT_CONTRACT } from '../content/levels/level0/layoutContract';
import { createTestLevel0RunState } from '../game/level0/testing/createTestLevel0RunState';
import { createWorldClockState } from '../game/level0/runtime/worldClock';
import { departLevel0Operation } from '../game/level0/runtime/safehouse';
import { resetGame, store } from '../store';
import {
  advanceLevel0Clock,
  hydrateLevel0Run,
  restartAttempt,
} from '../store/level0RuntimeSlice';
import { setLocale } from '../store/settingsSlice';
import { playLevel0FeedbackCue } from '../game/feedback/audioCues';

jest.mock('../game/feedback/audioCues', () => ({
  getLevel0AudioContext: jest.fn(() => null),
  playLevel0FeedbackCue: jest.fn(),
  primeLevel0AudioCues: jest.fn(),
}));

const renderBanner = () => {
  const run = store.getState().level0Runtime.run;
  if (!run) throw new Error('Expected an active Level 0 run');
  return render(
    <Provider store={store}>
      <Level0StreetMomentBanner run={run} />
    </Provider>
  );
};

describe('Level 0 street-moment presentation queue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    store.dispatch(resetGame());
    store.dispatch(setLocale('en'));
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('presents every street boundary from a large jump in canonical order', () => {
    const run = createTestLevel0RunState('street-queue');
    run.worldClock = createWorldClockState(20 * 60 + 55);
    store.dispatch(hydrateLevel0Run(run));
    renderBanner();

    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 312_000 }));
    });

    const announcement = () => screen.getByTestId('level0-street-announcement');
    expect(announcement()).toHaveAttribute('data-moment-id', 'clock.2100');

    act(() => jest.advanceTimersByTime(4_500));
    expect(announcement()).toHaveAttribute('data-moment-id', 'clock.2130');

    act(() => jest.advanceTimersByTime(4_500));
    expect(announcement()).toHaveAttribute('data-moment-id', 'clock.2200');

    act(() => jest.advanceTimersByTime(4_500));
    expect(announcement()).toHaveAttribute('data-moment-id', 'clock.2330');

    act(() => jest.advanceTimersByTime(4_500));
    expect(screen.queryByTestId('level0-street-announcement')).not.toBeInTheDocument();
    expect(playLevel0FeedbackCue).toHaveBeenCalledTimes(4);
    expect(playLevel0FeedbackCue).toHaveBeenLastCalledWith('last-train');
  });

  it('does not replay persisted street history after hydration', () => {
    const run = createTestLevel0RunState('street-hydration');
    run.worldClock = createWorldClockState(23 * 60 + 45);
    store.dispatch(hydrateLevel0Run(run));

    renderBanner();

    expect(screen.queryByTestId('level0-street-announcement')).not.toBeInTheDocument();
    expect(playLevel0FeedbackCue).not.toHaveBeenCalled();
  });

  it('announces a boundary again after Restart Attempt restores an earlier clock', () => {
    const run = createTestLevel0RunState('street-restart');
    run.mission = 'L0_PREPARATION';
    run.worldClock = createWorldClockState(20 * 60 + 55);
    const departureAnchor = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'safehouse.departure'
    );
    if (!departureAnchor) throw new Error('Expected the safehouse departure anchor');
    const departure = departLevel0Operation(run, departureAnchor.position);
    if (!departure.baseline) throw new Error('Expected an operation-attempt baseline');
    store.dispatch(hydrateLevel0Run(departure.run));
    const view = renderBanner();

    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 10_000 }));
    });
    const crossedRun = store.getState().level0Runtime.run;
    if (!crossedRun) throw new Error('Expected a crossed Level 0 run');
    view.rerender(
      <Provider store={store}>
        <Level0StreetMomentBanner run={crossedRun} />
      </Provider>
    );
    expect(screen.getByTestId('level0-street-announcement')).toHaveAttribute(
      'data-moment-id',
      'clock.2100'
    );
    act(() => jest.advanceTimersByTime(4_500));

    act(() => {
      store.dispatch(restartAttempt(departure.baseline!));
    });
    const restartedRun = store.getState().level0Runtime.run;
    if (!restartedRun) throw new Error('Expected a restarted Level 0 run');
    view.rerender(
      <Provider store={store}>
        <Level0StreetMomentBanner run={restartedRun} />
      </Provider>
    );
    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 10_000 }));
    });

    expect(screen.getByTestId('level0-street-announcement')).toHaveAttribute(
      'data-moment-id',
      'clock.2100'
    );
    expect(playLevel0FeedbackCue).toHaveBeenCalledTimes(2);
  });
});
