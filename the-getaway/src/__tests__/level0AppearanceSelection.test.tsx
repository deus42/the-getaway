import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { readLevel0Autosave, writeLevel0Autosave } from '../game/level0/runtime/persistence';
import { createInitialLevel0RunState } from '../game/level0/runtime/safehouse';
import { LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT } from '../game/level0/scene/level0ActorPresentation';
import { resetGame, store } from '../store';
import { setLocale } from '../store/settingsSlice';

jest.mock('../components/level0/Level0GameCanvas', () => {
  return function MockedLevel0GameCanvas() {
    return <div data-testid="level0-game-canvas">Level 0 Canvas</div>;
  };
});

describe('Level 0 provisional appearance selection', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    store.dispatch(setLocale('en'));
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('persists the selected neutral appearance without changing the build', async () => {
    render(<App />);

    const choices = await screen.findAllByTestId(/^level0-appearance-player_civilian_0[1-4]$/);
    expect(choices).toHaveLength(4);

    fireEvent.click(screen.getByTestId('level0-appearance-player_civilian_04'));
    fireEvent.click(screen.getByTestId('level0-new-game'));

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    const run = store.getState().level0Runtime.run;
    expect(run?.identity.appearancePresetId).toBe('player_civilian_04');
    expect(run?.build).toMatchObject({
      attributes: { physical: 1, mental: 1, social: 1, technical: 1 },
      level: 1,
      xp: 0,
    });

    const autosave = readLevel0Autosave(window.localStorage);
    expect(autosave.status).toBe('compatible');
    if (autosave.status === 'compatible') {
      expect(autosave.envelope.payload.identity.appearancePresetId).toBe('player_civilian_04');
    }
  });

  it('initializes the visible selector from the compatible autosave identity', async () => {
    writeLevel0Autosave(
      window.localStorage,
      createInitialLevel0RunState('saved-appearance', 'player_civilian_04'),
      4321
    );

    render(<App />);

    expect(await screen.findByTestId('level0-appearance-player_civilian_04')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByTestId('level0-appearance-player_civilian_01')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('publishes the resolved world anchor for interaction presentation', async () => {
    const listener = jest.fn();
    window.addEventListener(LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT, listener);
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));
    fireEvent.click(await screen.findByTestId('level0-interact'));

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      anchorId: 'interaction.safehouse.rest',
    });
    window.removeEventListener(LEVEL0_ACTOR_INTERACTION_PRESENTATION_EVENT, listener);
  });
});
