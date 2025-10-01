import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import PlayerStatsPanel from '../components/ui/PlayerStatsPanel';
import { resetGame, store } from '../store';
import { setPlayerData } from '../store/playerSlice';

describe('PlayerStatsPanel attribute spending', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('renders attribute spend controls when points are available', async () => {
    render(
      <Provider store={store}>
        <PlayerStatsPanel />
      </Provider>
    );

    const basePlayer = store.getState().player.data;

    act(() => {
      store.dispatch(
        setPlayerData({
          ...basePlayer,
          attributePoints: 1,
          skills: {
            ...basePlayer.skills,
            strength: 5,
          },
        })
      );
    });

    expect(store.getState().player.data.attributePoints).toBe(1);

    expect(await screen.findByText(/Attribute Points Available/i)).toBeInTheDocument();

    const increaseStrength = await screen.findByRole('button', { name: /Increase STR/i });

    act(() => {
      fireEvent.click(increaseStrength);
    });

    const updatedPlayer = store.getState().player.data;
    expect(updatedPlayer.skills.strength).toBe(6);
    expect(updatedPlayer.attributePoints).toBe(0);
    expect(screen.queryByRole('button', { name: /Increase STR/i })).not.toBeInTheDocument();
  });

  it('disables increase button when attribute is capped', async () => {
    render(
      <Provider store={store}>
        <PlayerStatsPanel />
      </Provider>
    );

    const basePlayer = store.getState().player.data;

    act(() => {
      store.dispatch(
        setPlayerData({
          ...basePlayer,
          attributePoints: 2,
          skills: {
            ...basePlayer.skills,
            strength: 10,
          },
        })
      );
    });

    expect(store.getState().player.data.attributePoints).toBe(2);

    const increaseStrength = await screen.findByRole('button', { name: /Increase STR/i });
    expect(increaseStrength).toBeDisabled();
  });
});
