import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import SkillTreePanel from '../components/ui/SkillTreePanel';
import { store, resetGame } from '../store';
import { addExperience } from '../store/playerSlice';

describe('SkillTreePanel', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('displays available skill points and increments skills on spend', () => {
    render(
      <Provider store={store}>
        <SkillTreePanel />
      </Provider>
    );

    expect(screen.getByText(/0 Skill Points/i)).toBeInTheDocument();

    act(() => {
      store.dispatch(addExperience(500));
    });

    expect(screen.getByText(/Skill Points/i).textContent).toMatch(/\d/);

    const increaseButton = screen.getByRole('button', {
      name: /Increase Small Guns/i,
    });

    act(() => {
      fireEvent.click(increaseButton);
    });

    const controls = increaseButton.parentElement as HTMLElement | null;
    expect(controls).not.toBeNull();
    if (controls) {
      expect(within(controls).getByText('5')).toBeInTheDocument();
    }
  });
});
