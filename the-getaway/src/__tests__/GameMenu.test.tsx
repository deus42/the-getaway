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

  it('keeps settings panel stable while selecting HUD override option', () => {
    renderMenu();
    fireEvent.click(screen.getByTestId('menu-open-settings'));

    const hudTrigger = screen.getByTestId('menu-hud-layout-dropdown');
    fireEvent.click(hudTrigger);
    fireEvent.click(screen.getByRole('option', { name: /Stealth/i }));

    expect(store.getState().hudLayout.override).toBe('stealth');
    expect(screen.getByTestId('menu-settings-panel')).toBeInTheDocument();
    expect(screen.getByTestId('menu-hud-layout-dropdown')).toHaveTextContent('Stealth');

    fireEvent.click(screen.getByTestId('menu-hud-layout-dropdown'));
    fireEvent.click(screen.getByRole('option', { name: /^Auto/i }));

    expect(store.getState().hudLayout.override).toBeNull();
    expect(screen.getByTestId('menu-settings-panel')).toBeInTheDocument();
    expect(screen.getByTestId('menu-hud-layout-dropdown')).toHaveTextContent('Auto');
  });

  it('supports keyboard selection for HUD override dropdown', () => {
    renderMenu();
    fireEvent.click(screen.getByTestId('menu-open-settings'));

    const hudTrigger = screen.getByTestId('menu-hud-layout-dropdown');
    hudTrigger.focus();

    fireEvent.keyDown(hudTrigger, { key: 'ArrowDown' });
    fireEvent.keyDown(hudTrigger, { key: 'Enter' });

    expect(store.getState().hudLayout.override).toBe('exploration');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByTestId('menu-settings-panel')).toBeInTheDocument();
  });
});
