import { fireEvent, render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import DialogueOverlay from '../components/ui/DialogueOverlay';
import { store, resetGame } from '../store';
import {
  startDialogue,
  startQuest,
  updateObjectiveCounter,
} from '../store/questsSlice';
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

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBeTruthy();

    const optionButtons = screen.getAllByRole('button');
    expect(optionButtons.length).toBeGreaterThan(0);

    const interactiveOption =
      optionButtons.find((button) => button.style.pointerEvents !== 'none') ??
      optionButtons[0];

    const initialText = heading.textContent;
    fireEvent.click(interactiveOption);

    expect(screen.getByRole('heading', { level: 2 }).textContent).not.toBe(
      initialText
    );
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

  it('locks quest completion dialogue until required objectives are complete', () => {
    render(
      <Provider store={store}>
        <DialogueOverlay />
      </Provider>
    );

    act(() => {
      store.dispatch(startQuest('quest_market_cache'));
      store.dispatch(startDialogue({ dialogueId: 'npc_lira_vendor', nodeId: 'intro' }));
    });

    expect(
      screen.queryByRole('button', {
        name: /Cache is back in rebel hands\./i,
      })
    ).toBeNull();

    expect(
      store
        .getState()
        .quests.quests.find((quest) => quest.id === 'quest_market_cache')
        ?.isCompleted
    ).toBe(false);

    act(() => {
      store.dispatch(
        updateObjectiveCounter({
          questId: 'quest_market_cache',
          objectiveId: 'recover-keycard',
          count: 1,
        })
      );
    });

    const completionOption = screen.getByRole('button', {
      name: /Cache is back in rebel hands\./i,
    });
    expect(completionOption).toHaveStyle('pointer-events: auto');

    fireEvent.click(completionOption);
    expect(
      store
        .getState()
        .quests.quests.find((quest) => quest.id === 'quest_market_cache')
        ?.isCompleted
    ).toBe(true);
  });

  it('allows selecting a dialogue option with number keys', () => {
    render(
      <Provider store={store}>
        <DialogueOverlay />
      </Provider>
    );

    act(() => {
      store.dispatch(startDialogue({ dialogueId: 'npc_lira_vendor', nodeId: 'intro' }));
    });

    const initialNode = store.getState().quests.activeDialogue.currentNodeId;

    act(() => {
      fireEvent.keyDown(window, { key: '1' });
    });

    const updatedNode = store.getState().quests.activeDialogue.currentNodeId;
    expect(updatedNode).not.toEqual(initialNode);
  });

  it('supports numpad digit shortcuts', () => {
    render(
      <Provider store={store}>
        <DialogueOverlay />
      </Provider>
    );

    act(() => {
      store.dispatch(startDialogue({ dialogueId: 'npc_lira_vendor', nodeId: 'intro' }));
    });

    const initialNode = store.getState().quests.activeDialogue.currentNodeId;

    act(() => {
      fireEvent.keyDown(window, { key: '1', code: 'Numpad1' });
    });

    const updatedNode = store.getState().quests.activeDialogue.currentNodeId;
    expect(updatedNode).not.toEqual(initialNode);
  });
});
