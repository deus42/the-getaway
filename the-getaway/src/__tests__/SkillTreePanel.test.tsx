import { render, screen, act, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import SkillTreePanel from '../components/ui/SkillTreePanel';
import { store, resetGame } from '../store';
import { addExperience } from '../store/playerSlice';

describe('SkillTreePanel', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('reflects available skill points and responds to skill allocation updates', async () => {
    render(
      <Provider store={store}>
        <SkillTreePanel />
      </Provider>
    );

    expect(screen.getByText(/0 Skill Points/i)).toBeInTheDocument();

    act(() => {
      store.dispatch(addExperience(500));
    });

    expect(await screen.findByText(/4 Skill Points/i)).toBeInTheDocument();

    const increaseButton = screen.getByRole('button', { name: /Increase Small Guns/i });

    act(() => {
      fireEvent.click(increaseButton);
    });

    expect(screen.getByTestId('skill-value-smallGuns')).toHaveTextContent('5');
  });
});
