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
      screen.getByText(/Need gear, gossip, or a miracle/i)
    ).toBeInTheDocument();

    const optionButton = screen.getByRole('button', {
      name: /Any shipments vanish like the coyotes Harbour Control promised us\?/i,
    });
    fireEvent.click(optionButton);

    expect(screen.getByText(/CorpSec bagged my street cache/i)).toBeInTheDocument();
  });

  it('locks options when skill requirements are unmet', () => {
    render(
      <Provider store={store}>
        <DialogueOverlay />
      </Provider>
    );

    act(() => {
      store.dispatch(updateSkill({ skill: 'charisma', amount: -4 }));
    });

    act(() => {
      store.dispatch(startDialogue({ dialogueId: 'npc_lira_vendor', nodeId: 'intro' }));
    });

    const lockedOption = screen.getByRole('button', {
      name: /What’s humming through the market tonight\?/i,
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
      name: /What’s humming through the market tonight\?/i,
    });

    expect(optionButton).toHaveStyle('pointer-events: auto');
    expect(screen.getByText(/Check Charisma 6/i)).toBeInTheDocument();

    fireEvent.click(optionButton);

    expect(screen.getByText(/Inventory is thinner than curfew soup/i)).toBeInTheDocument();
  });
});
