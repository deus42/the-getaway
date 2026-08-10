import { act, render, screen } from '@testing-library/react';
import App from '../../../App';
import { resolveLevel0GateRunMarker } from '../../../game/level0/playtest/level0PlaytestObserverV2';
import { resetGame, store } from '../../../store';
import {
  initializeLevel0Run,
  syncLevel0PlayerCheckpoint,
} from '../../../store/level0RuntimeSlice';

jest.mock('../Level0GameCanvas', () => function MockedLevel0GameCanvas() {
  return <div data-testid="level0-game-canvas">Level 0 Canvas</div>;
});

describe('Level 0 gate run marker', () => {
  afterEach(() => {
    act(() => {
      store.dispatch(resetGame());
    });
    window.history.replaceState({}, '', '/');
    delete window.render_game_to_text;
  });

  it('shows live four-block traversal coverage without bypassing visible input', () => {
    window.history.replaceState({}, '', '/?agent=1&gateRun=GET-204.worker-1');
    store.dispatch(initializeLevel0Run({
      sessionId: 'get204-gate-coverage',
      coverId: 'cover.neighbor',
    }));

    render(<App />);

    expect(screen.getByTestId('level0-gate-block-coverage')).toHaveTextContent(
      'CURRENT BLOCK safehouse-backstreet / BLOCK COVERAGE 1/4: safehouse-backstreet'
    );
    act(() => {
      store.dispatch(syncLevel0PlayerCheckpoint({
        position: { x: 44, y: 12 },
        facing: { x: 1, y: 0 },
      }));
    });
    expect(screen.getByTestId('level0-gate-block-coverage')).toHaveTextContent(
      'CURRENT BLOCK controlled-logistics / BLOCK COVERAGE 2/4: safehouse-backstreet, controlled-logistics'
    );
    expect(screen.getByTestId('level0-gate-collision-route')).toHaveTextContent(
      'COLLISION ROUTE 0/14'
    );
    expect(screen.getByRole('button', { name: /move to safehouse lot padding/i })).toBeVisible();
  });

  it('renders the validated marker for a development agent window', () => {
    window.history.replaceState({}, '', '/?agent=1&gateRun=GET-179.worker-1');

    render(<App />);

    expect(screen.getByTestId('level0-gate-run-marker')).toHaveTextContent(
      'AI GAMER / GET-179.worker-1'
    );
  });

  it('rejects missing agent gates, unsafe marker text, and production', () => {
    expect(resolveLevel0GateRunMarker('?gateRun=GET-179.worker-1', 'development')).toBeNull();
    expect(resolveLevel0GateRunMarker('?agent=1&gateRun=%3Cscript%3E', 'development')).toBeNull();
    expect(resolveLevel0GateRunMarker(
      '?agent=1&gateRun=GET-179.worker-1',
      'production'
    )).toBeNull();
  });
});
