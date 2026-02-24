import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PlayerSummaryPanel from '../components/ui/PlayerSummaryPanel';
import { resetGame, store } from '../store';
import { setStealthState } from '../store/playerSlice';
import { setEngagementMode } from '../store/worldSlice';

const renderPanel = () =>
  render(
    <Provider store={store}>
      <PlayerSummaryPanel variant="frameless" />
    </Provider>
  );

describe('PlayerSummaryPanel stealth controls', () => {
  beforeEach(() => {
    act(() => {
      store.dispatch(resetGame());
    });
  });

  afterEach(() => {
    act(() => {
      store.dispatch(resetGame());
    });
  });

  it('always shows a compact stealth toggle chip only', () => {
    renderPanel();

    expect(screen.getByTestId('player-stealth-toggle')).toHaveTextContent('Stealth Off');
    expect(screen.queryByTestId('player-stealth-strip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('player-pace-badge')).not.toBeInTheDocument();
  });

  it('keeps the same toggle surface when stealth state changes', () => {
    act(() => {
      store.dispatch(setStealthState({ enabled: true, cooldownExpiresAt: null }));
      store.dispatch(setEngagementMode('stealth'));
    });
    renderPanel();

    const button = screen.getByTestId('player-stealth-toggle');
    expect(button).toHaveTextContent('Stealth On');
    expect(screen.queryByTestId('player-stealth-strip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('player-pace-badge')).not.toBeInTheDocument();
  });

  it('shows stealth active state and dispatches toggle request on click', () => {
    act(() => {
      store.dispatch(setStealthState({ enabled: true, cooldownExpiresAt: null }));
      store.dispatch(setEngagementMode('stealth'));
    });
    renderPanel();

    const beforeNonce = store.getState().world.stealthToggleRequestNonce;
    const button = screen.getByTestId('player-stealth-toggle');
    expect(button).toHaveTextContent('Stealth On');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button);

    expect(store.getState().world.stealthToggleRequestNonce).toBe(beforeNonce + 1);
  });
});
