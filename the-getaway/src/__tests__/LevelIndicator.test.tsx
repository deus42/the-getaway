import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import LevelIndicator from '../components/ui/LevelIndicator';
import { resetGame, store } from '../store';

describe('LevelIndicator HUD panel', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('renders collapsed summary without a menu control', () => {
    render(
      <Provider store={store}>
        <LevelIndicator collapsed />
      </Provider>
    );

    expect(screen.getByText(/level/i)).toBeInTheDocument();
    expect(screen.queryByTestId('hud-menu-button')).not.toBeInTheDocument();
  });
});
