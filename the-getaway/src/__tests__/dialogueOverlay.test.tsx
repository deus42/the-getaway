import { fireEvent, render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import DialogueOverlay from '../components/ui/DialogueOverlay';
import { store, resetGame } from '../store';
import { startDialogue } from '../store/questsSlice';
import { updateSkill } from '../store/playerSlice';

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
      name: /Any shipments gone missing recently\?/i,
    });
    fireEvent.click(optionButton);

    expect(screen.getByText(/"Corporate patrol seized my street cache/i)).toBeInTheDocument();
  });

  it('locks options when skill requirements are unmet', () => {
    render(
      <Provider store={store}>
        <DialogueOverlay />
      </Provider>
    );

    act(() => {
      store.dispatch(startDialogue({ dialogueId: 'npc_lira_vendor', nodeId: 'intro' }));
    });

    const lockedOption = screen.getByRole('button', {
      name: /Show me what’s moving on the street/i,
    });

    expect(lockedOption).toHaveStyle('pointer-events: none');
    expect(screen.getByText(/Requires Charisma 6/i)).toBeInTheDocument();
  });

  it('unlocks options once the player meets the skill threshold', () => {
    render(
      <Provider store={store}>
        <DialogueOverlay />
      </Provider>
    );

    act(() => {
      store.dispatch(startDialogue({ dialogueId: 'npc_lira_vendor', nodeId: 'intro' }));
    });

    act(() => {
      store.dispatch(updateSkill({ skill: 'charisma', amount: 2 }));
    });

    const optionButton = screen.getByRole('button', {
      name: /Show me what’s moving on the street/i,
    });

    expect(optionButton).toHaveStyle('pointer-events: auto');
    expect(screen.getByText(/Check Charisma 6/i)).toBeInTheDocument();

    fireEvent.click(optionButton);

    expect(screen.getByText(/"Merch is scarce, but creds talk/i)).toBeInTheDocument();
  });
});
