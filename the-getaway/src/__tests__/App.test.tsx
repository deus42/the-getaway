import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { PERSISTED_STATE_KEY, resetGame, store } from "../store";
import { startDialogue } from "../store/questsSlice";

// Mock the GameCanvas component to avoid Phaser initialization in tests
jest.mock("../components/GameCanvas", () => {
  return function MockedGameCanvas() {
    return <div data-testid="game-canvas">Game Canvas Mock</div>;
  };
});

jest.mock("../components/debug/GameDebugInspector", () => () => null);

describe("App component", () => {
  beforeEach(() => {
    store.dispatch(resetGame());
    window.localStorage.removeItem(PERSISTED_STATE_KEY);
  });

  const completeCharacterCreation = async () => {
    const nameInput = await screen.findByPlaceholderText("Enter your operative name...");
    fireEvent.change(nameInput, { target: { value: "Test Operative" } });

    const presetButtons = await screen.findAllByRole("button", { name: /Operative/i });
    fireEvent.click(presetButtons[0]);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    });

    const incrementButtons = await screen.findAllByTitle("Increase attribute");
    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        fireEvent.click(incrementButtons[0]);
      });
    }

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    });

    const backgroundCard = await screen.findByTestId('background-card-corpsec_defector');
    fireEvent.click(backgroundCard);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Confirm & Start/i }));
    });
  };

  it("shows the menu first and enters the game when starting a new session", async () => {
    render(<App />);

    expect(await screen.findByTestId("game-menu")).toBeInTheDocument();
    const continueButtonInitial = await screen.findByTestId("continue-game");
    expect(continueButtonInitial).toBeDisabled();

    fireEvent.click(await screen.findByTestId("start-new-game"));

    await completeCharacterCreation();

    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("game-canvas")).toBeInTheDocument();

    const openMenuButton = await screen.findByTestId("menu-overlay-button");
    fireEvent.click(openMenuButton);

    const continueButton = screen.getByTestId("continue-game");
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
  });

  it("enables continue when a saved game is found", async () => {
    const { unmount } = render(<App />);

    fireEvent.click(await screen.findByTestId("start-new-game"));
    await completeCharacterCreation();
    fireEvent.click(await screen.findByTestId("menu-overlay-button"));

    unmount();

    const savedState = window.localStorage.getItem(PERSISTED_STATE_KEY);
    expect(savedState).not.toBeNull();

    render(<App />);

    const continueButton = await screen.findByTestId("continue-game");
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.queryByTestId("game-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("game-canvas")).toBeInTheDocument();
  });

  it('opens and closes the character screen', async () => {
    render(<App />);

    fireEvent.click(await screen.findByTestId('start-new-game'));
    await completeCharacterCreation();

    const characterButton = screen.getByTestId('summary-open-character');
    fireEvent.click(characterButton);

    const characterScreen = await screen.findByTestId('character-screen');
    expect(characterScreen).toBeInTheDocument();

    const closeButton = screen.getByTestId('close-character');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('character-screen')).not.toBeInTheDocument();

    fireEvent.click(characterButton);
    expect(await screen.findByTestId('character-screen')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('character-screen')).not.toBeInTheDocument());

    fireEvent.click(characterButton);
    expect(await screen.findByTestId('character-screen')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'c' });
    await waitFor(() => expect(screen.queryByTestId('character-screen')).not.toBeInTheDocument());
  });

  it('renders the HUD menu control with Level Panel styling and interactions', async () => {
    render(<App />);

    fireEvent.click(await screen.findByTestId('start-new-game'));
    await completeCharacterCreation();

    const menuButton = await screen.findByTestId('menu-overlay-button');
    expect(menuButton).toHaveTextContent(/Menu/i);
    expect(menuButton).toHaveTextContent(/ESC/i);
    expect(menuButton.style.width).toBe('90vw');
    expect(menuButton.style.maxWidth).toBe('240px');

    fireEvent.mouseEnter(menuButton);
    expect(menuButton.style.transform).toBe('translateY(-2px)');
    expect(menuButton.style.boxShadow).toBe('0 20px 42px rgba(15, 23, 42, 0.55)');
    expect(menuButton.style.borderColor).toBe('rgba(148, 163, 184, 0.55)');

    fireEvent.mouseLeave(menuButton);
    expect(menuButton.style.transform).toBe('translateY(0)');
    expect(menuButton.style.boxShadow).toBe('0 12px 32px rgba(15, 23, 42, 0.45)');
    expect(menuButton.style.borderColor).toBe('rgba(148, 163, 184, 0.35)');

    const levelInfoToggle = screen.getByRole('button', { name: /slums/i });
    const widthBeforeToggle = menuButton.style.width;
    fireEvent.click(levelInfoToggle);
    await waitFor(() => expect(menuButton.style.width).toBe(widthBeforeToggle));

    fireEvent.focus(menuButton);
    expect(menuButton.style.boxShadow).toBe('0 0 0 2px rgba(59, 130, 246, 0.35), 0 18px 42px rgba(15, 23, 42, 0.55)');
    expect(menuButton.style.borderColor).toBe('rgba(59, 130, 246, 0.7)');

    fireEvent.blur(menuButton);
    expect(menuButton.style.boxShadow).toBe('0 12px 32px rgba(15, 23, 42, 0.45)');
    expect(menuButton.style.borderColor).toBe('rgba(148, 163, 184, 0.35)');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(await screen.findByTestId('game-menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('game-menu')).not.toBeInTheDocument());
  });

  it('closes active dialogues before opening the menu', async () => {
    render(<App />);

    fireEvent.click(await screen.findByTestId('start-new-game'));
    await completeCharacterCreation();

    const dialogue = store.getState().quests.dialogues[0];
    expect(dialogue).toBeDefined();
    store.dispatch(startDialogue({ dialogueId: dialogue.id, nodeId: dialogue.nodes[0].id }));

    await waitFor(() => {
      expect(store.getState().quests.activeDialogue.dialogueId).toBe(dialogue.id);
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(store.getState().quests.activeDialogue.dialogueId).toBeNull();
    });
    expect(screen.queryByTestId('game-menu')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(await screen.findByTestId('game-menu')).toBeInTheDocument();
  });
});
