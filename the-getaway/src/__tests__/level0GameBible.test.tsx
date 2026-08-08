import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Level0GameBible from '../components/level0/Level0GameBible';

describe('Level0GameBible', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
  });

  it('renders the full reference, searches body copy, and navigates chapters', async () => {
    const onClose = jest.fn();
    render(<Level0GameBible locale="en" onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'Game Design Bible' })).toBeInTheDocument();
    expect(screen.getByTestId('game-bible-chapter-rail')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What The Getaway Is' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'physiological and cognitive strain' } });
    expect(await screen.findByTestId('game-bible-search-results')).toHaveTextContent(
      /paranoia, breakdown, and recovery/i
    );
    fireEvent.click(screen.getAllByRole('button', { name: /paranoia, breakdown, and recovery —/i })[0]);
    expect(screen.getByRole('heading', { name: 'Paranoia, Breakdown, and Recovery' })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('game-bible-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses Ukrainian copy and preserves equivalent navigation', () => {
    render(<Level0GameBible locale="uk" onClose={jest.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Біблія ігрового дизайну' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /повний шлях Level 0/i })[0]);
    expect(screen.getByRole('heading', { name: 'Повний шлях Level 0' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /одна цілісна операція/i })).toBeInTheDocument();
  });

  it('opens a narrow-screen chapter drawer and gives Escape local precedence', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    render(<Level0GameBible locale="en" onClose={jest.fn()} />);

    fireEvent.click(screen.getByTestId('game-bible-drawer-toggle'));
    expect(screen.getByTestId('game-bible-chapter-drawer')).toHaveAttribute('data-open', 'true');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.getByTestId('game-bible-chapter-drawer')).toHaveAttribute('data-open', 'false'));
  });
});
