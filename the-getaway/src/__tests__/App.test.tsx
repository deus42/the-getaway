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

const startNormalRun = async (callsign = 'Mara') => {
  fireEvent.click(await screen.findByTestId('level0-new-game'));
  fireEvent.change(screen.getByTestId('level0-callsign'), { target: { value: callsign } });
  fireEvent.click(screen.getByTestId('level0-create-attribute-mental-increase'));
  fireEvent.click(screen.getByTestId('level0-create-attribute-mental-increase'));
  fireEvent.click(screen.getByTestId('level0-create-attribute-social-increase'));
  fireEvent.click(screen.getByTestId('level0-create-attribute-social-increase'));
  for (let index = 0; index < 2; index += 1) {
    fireEvent.click(screen.getByTestId('level0-create-skill-composure-increase'));
    fireEvent.click(screen.getByTestId('level0-create-skill-insight-increase'));
    fireEvent.click(screen.getByTestId('level0-create-skill-influence-increase'));
  }
  fireEvent.click(screen.getByTestId('level0-creation-confirm'));
  await screen.findByTestId('level0-game-canvas');
};

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

    await startNormalRun();

    expect(screen.getByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('level0-runtime-hud')).toBeInTheDocument();
    expect(store.getState().level0Runtime.status).toBe('active');
    expect(store.getState().level0Runtime.run?.worldClock.currentMinute).toBe(18 * 60 + 30);
    expect(window.localStorage.getItem(LEVEL0_AUTOSAVE_KEY)).not.toBeNull();
  });

  it('opens the complete Game Design Bible from the start menu without creating a run', async () => {
    render(<App />);

    fireEvent.click(await screen.findByTestId('level0-bible-open'));
    expect(screen.getByRole('dialog', { name: 'Game Design Bible' })).toBeInTheDocument();
    expect(store.getState().level0Runtime.run).toBeNull();
    fireEvent.click(screen.getByTestId('game-bible-close'));
    expect(screen.getByTestId('level0-start-menu')).toBeInTheDocument();
  });

  it('opens the Bible with F1 during play and owns only its composable pause', async () => {
    render(<App />);
    await startNormalRun();

    fireEvent.keyDown(window, { key: 'F1' });
    expect(screen.getByRole('dialog', { name: 'Game Design Bible' })).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('bible');
    const pausedMinute = store.getState().level0Runtime.run!.worldClock.currentMinute;
    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 5_000 }));
    });
    expect(store.getState().level0Runtime.run?.worldClock.currentMinute).toBe(pausedMinute);

    fireEvent.click(screen.getByTestId('game-bible-close'));
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).not.toContain('bible');
    expect(screen.getByTestId('level0-runtime-hud')).toBeInTheDocument();
  });

  it('keeps the Bible open with unchanged pause ownership on repeated F1', async () => {
    render(<App />);
    await startNormalRun();

    fireEvent.keyDown(window, { key: 'F1' });
    expect(screen.getByRole('dialog', { name: 'Game Design Bible' })).toBeInTheDocument();
    const ownersAfterOpen = [...store.getState().level0Runtime.run!.worldClock.pauseOwners];

    fireEvent.keyDown(window, { key: 'F1' });
    expect(screen.getByRole('dialog', { name: 'Game Design Bible' })).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toEqual(ownersAfterOpen);
    expect(
      store.getState().level0Runtime.run?.worldClock.pauseOwners.filter((owner) => owner === 'bible')
    ).toHaveLength(1);

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Game Design Bible' }), { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Game Design Bible' })).not.toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).not.toContain('bible');
  });

  it('opens from the paused menu and leaves the menu pause intact on close', async () => {
    render(<App />);
    await startNormalRun();
    fireEvent.click(screen.getByRole('button', { name: /menu/i }));

    fireEvent.click(screen.getByTestId('level0-bible-open'));
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toEqual(
      expect.arrayContaining(['menu', 'bible'])
    );
    fireEvent.click(screen.getByTestId('game-bible-close'));
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('menu');
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).not.toContain('bible');
  });

  it('reports a retired prototype save and clears it only on explicit New Game', async () => {
    window.localStorage.setItem(PERSISTED_STATE_KEY, JSON.stringify({ legacy: true }));
    render(<App />);

    expect(await screen.findByTestId('retired-save-notice')).toBeInTheDocument();
    expect(window.localStorage.getItem(PERSISTED_STATE_KEY)).not.toBeNull();

    await startNormalRun();
    expect(screen.getByTestId('level0-game-canvas')).toBeInTheDocument();
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
    await startNormalRun();
    act(() => {
      const run = store.getState().level0Runtime.run!;
      store.dispatch(hydrateLevel0Run({ ...run, mission: 'L0_PREPARATION' }));
    });

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
    await startNormalRun();
    fireEvent.click(screen.getByTestId('level0-observation'));

    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('observation');
    expect(screen.getByTestId('level0-observation')).toHaveAttribute('aria-pressed', 'true');
  });

  it('owns and releases the safehouse confirmation pause without applying a cancelled action', async () => {
    render(<App />);
    await startNormalRun();
    fireEvent.click(await screen.findByTestId('safehouse-rest'));

    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('safehouse_action');
    fireEvent.click(screen.getByTestId('safehouse-cancel'));

    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).not.toContain('safehouse_action');
    expect(store.getState().level0Runtime.run?.worldClock.currentMinute).toBe(18 * 60 + 30);
  });

  it('gives a safehouse confirmation exclusive keyboard and action ownership', async () => {
    render(<App />);
    await startNormalRun();
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
    await startNormalRun();
    fireEvent.click(await screen.findByTestId('safehouse-rest'));

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTestId('safehouse-confirmation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('level0-start-menu')).not.toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toEqual([]);
  });

  it('resumes a menu-saved run without restoring transient pause ownership', async () => {
    const first = render(<App />);
    await startNormalRun();
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
    await startNormalRun();

    act(() => {
      store.dispatch(advanceLevel0Clock({ realDeltaMilliseconds: 11 * 60 * 1_000 }));
    });

    expect(await screen.findByTestId('level0-failure')).toBeInTheDocument();
    expect(screen.getByText('24:00')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('failure');
  });

  it('gives a terminal failure overlay exclusive action ownership', async () => {
    render(<App />);
    await startNormalRun();
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
    await startNormalRun();
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
    await startNormalRun();
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
