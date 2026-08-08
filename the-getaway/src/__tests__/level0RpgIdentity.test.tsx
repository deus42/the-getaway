import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import Level0CharacterPanel from '../components/level0/Level0CharacterPanel';
import Level0GateVerdict from '../components/level0/Level0GateVerdict';
import { LEVEL0_GATE_CATALOG, resolveLevel0Gate } from '../game/level0/rpg/gates';
import { applyLevel0ParanoiaEffect } from '../game/level0/rpg/paranoia';
import { writeLevel0Autosave } from '../game/level0/runtime/persistence';
import { createInitialLevel0RunState } from '../game/level0/runtime/safehouse';
import { resetGame, store } from '../store';
import { setLocale } from '../store/settingsSlice';

jest.mock('../components/level0/Level0GameCanvas', () => {
  return function MockedLevel0GameCanvas() {
    return <div data-testid="level0-game-canvas">Level 0 Canvas</div>;
  };
});

const startNeighborRun = async () => {
  fireEvent.click(await screen.findByTestId('level0-new-game'));
  expect(await screen.findByTestId('level0-cover-select')).toBeInTheDocument();
  fireEvent.click(screen.getByTestId('level0-cover-select-confirm'));
  await screen.findByTestId('level0-game-canvas');
};

describe('Level 0 cover and binary-ability identity', () => {
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

  it('starts with four authored covers and permits only the Neighbor', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));

    expect(await screen.findByRole('dialog', {
      name: 'What life did you live before tonight?',
    })).toBeInTheDocument();
    expect(screen.getByText('The Neighbor')).toBeInTheDocument();
    expect(screen.getByText('The Technician')).toBeInTheDocument();
    expect(screen.getByText('The Commuter')).toBeInTheDocument();
    expect(screen.getByText('The Archivist')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(store.getState().level0Runtime.run).toBeNull();

    fireEvent.click(screen.getByTestId('level0-cover-cover.technician'));
    expect(screen.getByTestId('level0-cover-select-confirm')).toBeDisabled();
    expect(screen.getByText(/complete route has not been authored/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('level0-cover-cover.neighbor'));
    fireEvent.click(screen.getByTestId('level0-cover-select-confirm'));
    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run).toMatchObject({
      identity: {
        coverId: 'cover.neighbor',
        appearancePresetId: 'player_civilian_01',
      },
      abilities: {
        heldAbilityIds: [
          'ability.read_people',
          'ability.negotiate',
          'ability.blend_in',
        ],
      },
      paranoia: 0,
      mission: 'L0_SAFEHOUSE_INTRO',
    });
    expect(store.getState().level0Runtime.run).not.toHaveProperty('health');
    expect(store.getState().level0Runtime.run).not.toHaveProperty('build');
  });

  it('presents the cover and ability identity in Ukrainian without numeric RPG fields', async () => {
    store.dispatch(setLocale('uk'));

    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-new-game'));

    expect(await screen.findByRole('dialog', {
      name: 'Яке життя ви вели до цієї ночі?',
    })).toBeInTheDocument();
    expect(screen.getByText('Сусід')).toBeInTheDocument();
    expect(screen.getByText('Технік')).toBeInTheDocument();
    expect(screen.getByText('Пасажир')).toBeInTheDocument();
    expect(screen.getByText('Архівіст')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('level0-cover-select-confirm'));
    await screen.findByTestId('level0-game-canvas');
    fireEvent.click(screen.getByTestId('level0-character-open'));

    const panel = await screen.findByTestId('level0-character-panel');
    expect(panel).toHaveTextContent('Сусід');
    expect(panel).toHaveTextContent('Спокій');
    expect(panel).toHaveTextContent('Читати людей');
    expect(panel).not.toHaveTextContent(/здоров|досвід|рівень/i);
  });

  it('continues an exact compatible cover autosave without reopening cover selection', async () => {
    const saved = createInitialLevel0RunState('saved-cover', 'cover.neighbor');
    writeLevel0Autosave(window.localStorage, saved, 4321);

    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-continue'));

    expect(await screen.findByTestId('level0-game-canvas')).toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.identity).toEqual(saved.identity);
    expect(screen.queryByTestId('level0-cover-select')).not.toBeInTheDocument();
  });

  it('shows only cover, named Paranoia condition, abilities, research, and facts', async () => {
    render(<App />);
    await startNeighborRun();

    fireEvent.click(screen.getByTestId('level0-character-open'));
    const panel = await screen.findByTestId('level0-character-panel');
    expect(panel).toHaveTextContent('The Neighbor');
    expect(panel).toHaveTextContent('Calm');
    expect(panel).toHaveTextContent('Read People');
    expect(panel).toHaveTextContent('Negotiate');
    expect(panel).toHaveTextContent('Blend In');
    expect(panel).toHaveTextContent('Research');
    expect(panel).not.toHaveTextContent(/health/i);
    expect(panel).not.toHaveTextContent(/\bXP\b/i);
    expect(panel).not.toHaveTextContent(/attribute/i);
    expect(panel).not.toHaveTextContent(/skill point/i);
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).toContain('character');

    fireEvent.click(screen.getByTestId('level0-character-close'));
    expect(screen.queryByTestId('level0-character-panel')).not.toBeInTheDocument();
    expect(store.getState().level0Runtime.run?.worldClock.pauseOwners).not.toContain('character');
  });

  it('renders Paranoia as one continuous read-only slider in the HUD and Character screen', async () => {
    const saved = applyLevel0ParanoiaEffect(
      createInitialLevel0RunState('slider-state', 'cover.neighbor'),
      {
        eventId: 'paranoia.slider-proof',
        amount: 55,
        sourceId: 'camera.slider-proof',
        feedbackId: 'paranoia.camera_observation',
      }
    ).run;
    writeLevel0Autosave(window.localStorage, saved, 4321);

    render(<App />);
    fireEvent.click(await screen.findByTestId('level0-continue'));
    await screen.findByTestId('level0-game-canvas');

    const hudSlider = screen.getByTestId('level0-paranoia-slider-hud');
    expect(hudSlider).toHaveAttribute('role', 'meter');
    expect(hudSlider).toHaveAttribute('aria-valuemin', '0');
    expect(hudSlider).toHaveAttribute('aria-valuemax', '100');
    expect(hudSlider).toHaveAttribute('aria-valuenow', '55');
    expect(hudSlider).toHaveAttribute('aria-valuetext', 'Uneasy');
    expect(hudSlider.style.getPropertyValue('--paranoia-position')).toBe('55%');

    fireEvent.click(screen.getByTestId('level0-character-open'));
    const characterSlider = await screen.findByTestId('level0-paranoia-slider-character');
    expect(characterSlider).toHaveAttribute('role', 'meter');
    expect(characterSlider).toHaveAttribute('aria-valuenow', '55');
    expect(characterSlider).toHaveAttribute('aria-valuetext', 'Uneasy');
    expect(characterSlider.style.getPropertyValue('--paranoia-position')).toBe('55%');
  });

  it('renders an exact non-arithmetic gate reason for ability and fact paths', () => {
    const requirement = LEVEL0_GATE_CATALOG['gate.public_blend'];
    const abilityVerdict = resolveLevel0Gate({
      requirement,
      path: 'ability',
      heldAbilityIds: ['ability.blend_in'],
      knownFactIds: [],
      paranoia: 0,
      presentation: 'preview',
    });
    const view = render(
      <Level0GateVerdict
        requirement={requirement}
        verdict={abilityVerdict}
        ukrainian={false}
      />
    );
    expect(screen.getByTestId('level0-gate-verdict')).toHaveTextContent('MET');
    expect(screen.getByTestId('level0-gate-verdict')).toHaveTextContent('Blend In');
    expect(screen.getByTestId('level0-gate-verdict')).not.toHaveTextContent(/\d+\s*[+−/]\s*\d+/);

    const factVerdict = resolveLevel0Gate({
      requirement,
      path: 'fact',
      heldAbilityIds: [],
      knownFactIds: [],
      paranoia: 0,
      presentation: 'preview',
    });
    view.rerender(
      <Level0GateVerdict
        requirement={requirement}
        verdict={factVerdict}
        ukrainian={false}
      />
    );
    expect(screen.getByTestId('level0-gate-verdict')).toHaveTextContent('NOT MET');
    expect(screen.getByTestId('level0-gate-verdict')).toHaveTextContent('required fact is unknown');
  });

  it('presents fragile abilities as locked by named Paranoia tiers', () => {
    const run = createInitialLevel0RunState('uneasy-character', 'cover.neighbor');
    run.paranoia = 40;

    render(<Level0CharacterPanel run={run} ukrainian={false} onClose={jest.fn()} />);

    expect(screen.getByTestId('level0-character-panel')).toHaveTextContent('Uneasy');
    expect(screen.getAllByText('LOCKED')).toHaveLength(3);
    expect(screen.queryByText(/−1|penalty|check total/i)).not.toBeInTheDocument();
  });
});
