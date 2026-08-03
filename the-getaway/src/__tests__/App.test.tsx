import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import {
  LEVEL0_AUTOSAVE_KEY,
  LEVEL0_RETRY_KEY,
  readLevel0Retry,
} from '../game/level0/runtime/persistence';
import { PERSISTED_STATE_KEY, resetGame, store } from '../store';
import { setLocale } from '../store/settingsSlice';
import { advanceLevel0Clock, hydrateLevel0Run } from '../store/level0RuntimeSlice';

jest.mock('../components/level0/Level0GameCanvas', () => {
  return function MockedLevel0GameCanvas() {
    return <div data-testid="level0-game-canvas">Level 0 Canvas</div>;
  };
});

describe('canonical Level 0 runtime entry', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    store.dispatch(setLocale('en'));
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    jest.useRealTimers();
  });

  it('opens on the menu and starts an ordinary canonical New Game', async () => {
    render(<App />);

    expect(await screen.findByTestId('level0-start-menu')).toBeInTheDocument();
    expect(screen.getByTestId('level0-continue')).toBeDisabled();

    fireEvent.click(screen.getByTestId('level0-new-game'));

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('level0-runtime-hud')).toBeInTheDocument();
    expect(store.getState().level0Runtime.status).toBe('active');
    expect(store.getState().level0Runtime.run?.worldClock.currentMinute).toBe(18 * 60 + 30);
    expect(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)).not.toBeNull();
  });

  it('reports a retired prototype save and clears it only on explicit New Game', async () => {
    window.localStorage.setItem(PERSISTED_STATE_KEY, JSON.stringify({ legacy: true }));
    render(<App />);

    expect(await screen.findByTestId('retired-save-notice')).toBeInTheDocument();
    expect(window.localStorage.getItem(PERSISTED_STATE_KEY)).not.toBeNull();

    fireEvent.click(screen.getByTestId('level0-new-game'));
    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(window.localStorage.getItem(PERSISTED_STATE_KEY)).toBeNull();
  });

  it('uses the same canonical start path for the agent shortcut', async () => {
    window.history.replaceState({}, '', '/?agent=1&agentStart=level0&fresh=1');
    render(<App />);

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.sessionId).toBeTruthy();
    expect(screen.queryByTestId('level0-start-menu')).not.toBeInTheDocument();
  });

  it('applies safehouse actions and persists one operation-departure Retry snapshot', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));

    fireEvent.click(await screen.findByTestId('safehouse-wait'));
    expect(screen.getByTestId('safehouse-confirmation')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.currentMinute).toBe(18 * 60 + 30);
    fireEvent.click(screen.getByTestId('safehouse-confirm'));
    expect(store.getState().level0Runtime.run?.worldClock.currentMinute).toBe(19 * 60);

    fireEvent.click(screen.getByTestId('safehouse-depart'));
    fireEvent.click(screen.getByTestId('safehouse-confirm'));
    await waitFor(() => expect(window.localStorage.getItem(LEVEL0_RETRY_KEY)).not.toBeNull());

    const retry = readLevel0Retry(window.localStorage);
    expect(retry.status).toBe('compatible');
    expect(store.getState().level0Runtime.run?.mission).toBe('L0_OPERATION_DEPARTED');
  });

  it('pauses the clock while observation is active', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    fireEvent.click(screen.getByTestId('level0-observation'));

    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('observation');
    expect(screen.getByTestId('level0-observation')).toHaveAttribute('aria-pressed', 'true');
  });

  it('owns and releases the safehouse confirmation pause without applying a cancelled action', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    fireEvent.click(await screen.findByTestId('safehouse-rest'));

    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('safehouse_action');
    fireEvent.click(screen.getByTestId('safehouse-cancel'));

    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).not.toContain('safehouse_action');
    expect(store.getState().level0Runtime.run?.worldClock.currentMinute).toBe(18 * 60 + 30);
  });

  it('gives a safehouse confirmation exclusive keyboard and action ownership', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    fireEvent.click(await screen.findByTestId('safehouse-rest'));

    expect(screen.getByTestId('level0-runtime-background')).toHaveAttribute('inert');
    expect(screen.getByTestId('level0-observation')).toBeDisabled();
    expect(screen.getByTestId('level0-interact')).toBeDisabled();
    expect(screen.getByTestId('safehouse-wait')).toBeDisabled();
    expect(screen.getByTestId('safehouse-rest')).toBeDisabled();
    expect(screen.getByTestId('safehouse-depart')).toBeDisabled();
  });

  it('cancels an active safehouse modal on Escape instead of stacking a menu pause', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    fireEvent.click(await screen.findByTestId('safehouse-rest'));

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTestId('safehouse-confirmation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('level0-start-menu')).not.toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toEqual([]);
  });

  it('resumes a menu-saved run without restoring transient pause ownership', async () => {
    const first = render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    fireEvent.click(screen.getByRole('button', { name: /menu/i }));

    const persisted = JSON.parse(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)!);
    expect(persisted.payload.worldClock.pauseOwners).toEqual([]);

    first.unmount();
    store.dispatch(resetGame());
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-continue'));

    expect(await screen.findByTestId('level0-runtime-hud')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toEqual([]);
  });

  it('shows an exact paused deadline failure at 24:00', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));

    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 11 * 60 * 1_000 }));
    });

    expect(await screen.findByTestId('level0-failure')).toBeInTheDocument();
    expect(screen.getByText('24:00')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('failure');
  });

  it('gives a terminal failure overlay exclusive action ownership', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 11 * 60 * 1_000 }));
    });

    expect(await screen.findByTestId('level0-failure')).toBeInTheDocument();
    expect(screen.getByTestId('level0-runtime-background')).toHaveAttribute('inert');
    expect(screen.getByTestId('level0-observation')).toBeDisabled();
    expect(screen.getByTestId('level0-interact')).toBeDisabled();
    expect(screen.getByTestId('safehouse-wait')).toBeDisabled();

    fireEvent.click(screen.getByTestId('safehouse-wait'));
    expect(screen.queryByTestId('safehouse-confirmation')).not.toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.currentMinute).toBe(24 * 60);
  });

  it('warns when a confirmed Wait or Rest will cross the operation deadline', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 10.5 * 60 * 1_000 }));
    });

    fireEvent.click(screen.getByTestId('safehouse-wait'));
    expect(screen.getByTestId('safehouse-confirmation')).toHaveTextContent(
      /cross the 24:00 deadline and fail the operation/i
    );
    fireEvent.click(screen.getByTestId('safehouse-cancel'));

    fireEvent.click(screen.getByTestId('safehouse-rest'));
    expect(screen.getByTestId('safehouse-confirmation')).toHaveTextContent(
      /cross the 24:00 deadline and fail the operation/i
    );
  });

  it('does not promise deadline failure after both completion requirements are met', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 10.5 * 60 * 1_000 }));
      const run = store.getState().level0Runtime.run!;
      store.dispatch(hydrateLevel0Run({
        ...run,
        completion: { medkitsReturned: true, transitValidated: true },
      }));
    });

    fireEvent.click(screen.getByTestId('safehouse-wait'));
    expect(screen.getByTestId('safehouse-confirmation')).not.toHaveTextContent(
      /fail the operation/i
    );
  });

  it('localizes the runtime start boundary in Ukrainian', async () => {
    store.dispatch(setLocale('uk'));
    render(<App />);

    expect(await screen.findByRole('heading', { name: /втеча з токіо/i })).toBeInTheDocument();
    expect(screen.getByTestId('level0-new-game')).toHaveTextContent(/нова гра/i);
  });
});
