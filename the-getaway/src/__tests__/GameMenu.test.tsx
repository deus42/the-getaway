import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import GameMenu from '../components/ui/GameMenu';
import { resetGame, store } from '../store';

describe('GameMenu', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  const renderMenu = (props?: Partial<React.ComponentProps<typeof GameMenu>>) => {
    return render(
      <Provider store={store}>
        <GameMenu
          onContinue={jest.fn()}
          onStartNewGame={jest.fn()}
          hasActiveGame
          {...props}
        />
      </Provider>
    );
  };

  it('focuses on primary actions by default', () => {
    renderMenu();

    expect(screen.getByTestId('start-new-game')).toBeInTheDocument();
    expect(screen.getByTestId('continue-game')).toBeEnabled();
    expect(screen.getByTestId('menu-open-settings')).toHaveTextContent('Settings');
    expect(screen.queryByTestId('menu-settings-panel')).not.toBeInTheDocument();
  });

  it('opens the settings panel and returns to landing view', () => {
    renderMenu();

    fireEvent.click(screen.getByTestId('menu-open-settings'));

    expect(screen.getByTestId('menu-settings-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('continue-game')).not.toBeInTheDocument();
    expect(screen.getByTestId('menu-close-settings')).toHaveTextContent('Return to Menu');

    fireEvent.click(screen.getByTestId('menu-close-settings'));
    expect(screen.queryByTestId('menu-settings-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('start-new-game')).toBeInTheDocument();
  });
});
