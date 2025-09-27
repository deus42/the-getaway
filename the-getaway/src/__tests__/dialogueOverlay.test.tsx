import { fireEvent, render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import DialogueOverlay from '../components/ui/DialogueOverlay';
import { store, resetGame } from '../store';
import { startDialogue } from '../store/questsSlice';

describe('DialogueOverlay', () => {
  beforeEach(() => {
    store.dispatch(resetGame());
  });

  it('renders dialogue text and options when active', () => {
    render(
      <Provider store={store}>
        <DialogueOverlay />
      </Provider>
    );

    expect(screen.queryByText(/Lira the Smuggler/i)).toBeNull();

    act(() => {
      store.dispatch(startDialogue({ dialogueId: 'npc_lira_vendor', nodeId: 'intro' }));
    });

    expect(screen.getByText(/Lira the Smuggler/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Need gear, intel, or a favour/i)
    ).toBeInTheDocument();

    const optionButton = screen.getByRole('button', {
      name: /Show me what’s moving on the street/i,
    });
    fireEvent.click(optionButton);

    expect(screen.getByText(/"Merch is scarce, but creds talk/i)).toBeInTheDocument();
  });
});

